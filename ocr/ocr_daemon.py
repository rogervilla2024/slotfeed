#!/usr/bin/env python3
"""
SLOTFEED - Production OCR Daemon
Runs 24/7 with auto-recovery, logging, and health monitoring
"""

import os
import sys
import json
import time
import signal
import logging
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any

# Disable PaddleX model source check (must be before imports)
os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# ============================================
# CONFIGURATION
# ============================================
CONFIG = {
    "capture_interval": 10,          # seconds between captures
    "max_retries": 5,                # max retries per streamer
    "retry_delay": 5,                # seconds between retries
    "health_check_interval": 60,     # seconds between health checks
    "streamer_refresh_interval": 60, # seconds between refreshing live list
    "max_balance": 10_000_000,       # $10M max
    "max_change": 5_000_000,         # $5M max change
    "min_confidence": 0.7,           # OCR confidence threshold
    "max_consecutive_errors": 10,    # restart OCR engine after this many errors
}

# Paths
DATA_DIR = PROJECT_ROOT / "data"
LOG_DIR = DATA_DIR / "logs"
BALANCE_HISTORY_FILE = DATA_DIR / "balance_history.json"
HEALTH_FILE = DATA_DIR / "daemon_health.json"
STREAMERS_DIR = DATA_DIR / "streamers"

# Ensure directories exist
LOG_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ============================================
# LOGGING SETUP
# ============================================
def setup_logging():
    """Configure logging to file and console."""
    log_file = LOG_DIR / f"ocr_daemon_{datetime.now().strftime('%Y%m%d')}.log"

    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # File handler (rotates daily)
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    # Root logger
    logger = logging.getLogger('slotfeed')
    logger.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

log = setup_logging()

# ============================================
# DAEMON CLASS
# ============================================
class OCRDaemon:
    """Production-ready OCR daemon with auto-recovery."""

    def __init__(self):
        self.running = False
        self.ocr = None
        self.history = {}
        self.pending_readings = {}
        self.stats = {
            "start_time": None,
            "total_rounds": 0,
            "total_captures": 0,
            "total_errors": 0,
            "consecutive_errors": 0,
            "last_success": None,
            "streamers_processed": set(),
        }
        self.game_detector = None
        self.game_stats = None

        # Signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        log.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False

    def initialize(self) -> bool:
        """Initialize OCR engine and components."""
        try:
            log.info("Initializing OCR engine...")
            from ocr.stream_ocr import StreamOCR
            from ocr.game_detector import get_game_detector
            from ocr.game_stats_aggregator import get_game_stats_aggregator
            from ocr.session_manager import session_manager

            self.ocr = StreamOCR()
            self.game_detector = get_game_detector()
            self.game_stats = get_game_stats_aggregator()
            self.session_manager = session_manager

            # Load history
            self.history = self._load_balance_history()

            log.info("OCR engine initialized successfully")
            return True

        except Exception as e:
            log.error(f"Failed to initialize OCR: {e}")
            return False

    def reinitialize(self) -> bool:
        """Reinitialize OCR engine (for recovery)."""
        log.warning("Reinitializing OCR engine...")
        self.ocr = None
        time.sleep(2)
        return self.initialize()

    def _load_balance_history(self) -> Dict:
        """Load existing balance history."""
        if BALANCE_HISTORY_FILE.exists():
            try:
                with open(BALANCE_HISTORY_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                log.error(f"Error loading history: {e}")
        return {}

    def _save_balance_history(self):
        """Save balance history atomically."""
        try:
            temp_file = BALANCE_HISTORY_FILE.with_suffix('.tmp')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(self.history, f, indent=2, default=str)
            temp_file.replace(BALANCE_HISTORY_FILE)
        except Exception as e:
            log.error(f"Error saving history: {e}")

    def _save_health_status(self):
        """Save health status for monitoring."""
        try:
            health = {
                "status": "running" if self.running else "stopped",
                "uptime_seconds": (datetime.now() - self.stats["start_time"]).total_seconds() if self.stats["start_time"] else 0,
                "total_rounds": self.stats["total_rounds"],
                "total_captures": self.stats["total_captures"],
                "total_errors": self.stats["total_errors"],
                "consecutive_errors": self.stats["consecutive_errors"],
                "last_success": self.stats["last_success"],
                "streamers_active": len(self.stats["streamers_processed"]),
                "updated_at": datetime.now().isoformat(),
            }
            with open(HEALTH_FILE, 'w', encoding='utf-8') as f:
                json.dump(health, f, indent=2)
        except Exception as e:
            log.error(f"Error saving health: {e}")

    def get_live_streamers(self) -> list:
        """Get list of currently live streamers with retry."""
        live = []

        if not STREAMERS_DIR.exists():
            return live

        for filepath in STREAMERS_DIR.glob('*.json'):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('livestream'):
                        live.append(data.get('slug', filepath.stem))
            except Exception as e:
                log.debug(f"Error reading {filepath}: {e}")

        return live

    def refresh_streamer_data(self):
        """Refresh streamer data from Kick API."""
        try:
            from ocr.stream_ocr import StreamOCR
            temp_ocr = StreamOCR()

            # List of priority streamers to check
            priority_streamers = [
                'roshtein', 'classybeef', 'casinodaddy', 'trainwreckstv',
                'xposed', 'deuceace', 'fruityslots', 'maherco'
            ]

            for username in priority_streamers:
                try:
                    temp_ocr.get_stream_url(username)
                except Exception as e:
                    log.debug(f"Could not refresh {username}: {e}")

        except Exception as e:
            log.error(f"Error refreshing streamers: {e}")

    def get_stream_title(self, username: str) -> str:
        """Get stream title from streamer JSON file."""
        filepath = STREAMERS_DIR / f"{username}.json"
        if filepath.exists():
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    livestream = data.get('livestream', {})
                    if isinstance(livestream, dict):
                        return livestream.get('session_title', '')
            except:
                pass
        return ''

    def is_valid_balance(self, balance: float, prev_balance: Optional[float] = None) -> tuple:
        """Validate if balance reading is realistic."""
        if balance < 0:
            return False, "negative"

        digit_count = len(str(int(balance)))
        if digit_count > 9:
            return False, f"too_many_digits ({digit_count})"

        if balance > CONFIG["max_balance"]:
            return False, f"exceeds_max (${balance:,.0f})"

        if prev_balance is not None and prev_balance > 0:
            change = abs(balance - prev_balance)
            if change > CONFIG["max_change"]:
                return False, f"change_too_large (${change:,.0f})"

        return True, "valid"

    def confirm_reading(self, username: str, balance: float, tolerance: float = 100) -> tuple:
        """Multi-frame confirmation - requires similar reading twice."""
        if username not in self.pending_readings:
            self.pending_readings[username] = {"balance": balance, "count": 1}
            return False, "awaiting_confirmation"

        pending = self.pending_readings[username]

        if abs(balance - pending["balance"]) <= tolerance:
            pending["count"] += 1
            pending["balance"] = balance

            if pending["count"] >= 2:
                self.pending_readings[username] = {"balance": balance, "count": 0}
                return True, "confirmed"
            else:
                return False, f"count={pending['count']}/2"
        else:
            self.pending_readings[username] = {"balance": balance, "count": 1}
            return False, "reset_new_value"

    def process_streamer(self, username: str) -> bool:
        """Process a single streamer with error handling."""
        try:
            result = self.ocr.process_streamer(username)

            if not result or not result.get("extracted", {}).get("balance"):
                return False

            balance = result["extracted"]["balance"]
            confidence = result.get("confidence", 0)
            timestamp = datetime.now().isoformat()

            # Check confidence
            if confidence < CONFIG["min_confidence"]:
                log.debug(f"{username}: LOW CONFIDENCE ({confidence:.2f})")
                return False

            # Get previous balance
            prev_balance = self.history.get(username, {}).get("current_balance")

            # Validate
            is_valid, reason = self.is_valid_balance(balance, prev_balance)
            if not is_valid:
                log.debug(f"{username}: REJECTED ({reason}) - ${balance:,.2f}")
                return False

            # Game detection
            stream_title = self.get_stream_title(username)
            ocr_texts = result.get("raw_text", [])
            detected_game = self.game_detector.detect_game(username, stream_title, ocr_texts)

            # Multi-frame confirmation
            confirmed, confirm_status = self.confirm_reading(username, balance)
            if not confirmed:
                game_info = f" [{detected_game.game_name}]" if detected_game and detected_game.game_id != 'generic' else ""
                log.debug(f"{username}: PENDING ({confirm_status}) - ${balance:,.2f}{game_info}")
                if detected_game and detected_game.game_id != 'generic':
                    self.game_stats.register_game_session(username, detected_game.game_id, detected_game.game_name, detected_game.provider)
                return False

            # CONFIRMED - Update history
            game_info = f" [{detected_game.game_name}]" if detected_game.game_id != 'generic' else ""

            # Initialize if needed
            if username not in self.history:
                self.history[username] = {
                    "current_balance": 0,
                    "session_start_balance": balance,
                    "session_start_time": timestamp,
                    "peak_balance": balance,
                    "lowest_balance": balance,
                    "total_wagered": 0,
                    "balance_history": [],
                }

            # Update stats
            prev_balance = self.history[username].get("current_balance", balance)
            self.history[username]["current_balance"] = balance
            self.history[username]["peak_balance"] = max(balance, self.history[username].get("peak_balance", balance))
            self.history[username]["lowest_balance"] = min(balance, self.history[username].get("lowest_balance", balance))

            # Track change
            change = balance - prev_balance
            if abs(change) > 0:
                self.history[username]["balance_history"].append({
                    "timestamp": timestamp,
                    "balance": balance,
                    "change": change,
                    "game_id": detected_game.game_id if detected_game else None,
                })

                if len(self.history[username]["balance_history"]) > 1000:
                    self.history[username]["balance_history"] = self.history[username]["balance_history"][-1000:]

                if detected_game and detected_game.game_id != 'generic':
                    self.game_stats.update_stats(
                        username=username,
                        game_id=detected_game.game_id,
                        game_name=detected_game.game_name,
                        provider=detected_game.provider,
                        balance_change=change
                    )

            # Session P/L
            session_start = self.history[username].get("session_start_balance", balance)
            profit_loss = balance - session_start

            log.info(f"{username}: ${balance:,.2f} (P/L: ${profit_loss:+,.2f}){game_info}")

            # Update session
            self.session_manager.update_session(username, {"balance": balance})

            # Update stats
            self.stats["total_captures"] += 1
            self.stats["last_success"] = datetime.now().isoformat()
            self.stats["consecutive_errors"] = 0
            self.stats["streamers_processed"].add(username)

            return True

        except Exception as e:
            log.error(f"{username}: Error - {e}")
            self.stats["total_errors"] += 1
            self.stats["consecutive_errors"] += 1
            return False

    def run_round(self) -> int:
        """Run one capture round for all live streamers."""
        self.stats["total_rounds"] += 1

        # Get live streamers
        live_streamers = self.get_live_streamers()

        if not live_streamers:
            log.info("No live streamers found")
            return 0

        log.info(f"Round {self.stats['total_rounds']} | Live: {', '.join(live_streamers)}")

        successful = 0
        for username in live_streamers:
            if not self.running:
                break

            if self.process_streamer(username):
                successful += 1

            # Small delay between streamers
            time.sleep(0.5)

        # Save after round
        self._save_balance_history()

        return successful

    def run(self):
        """Main daemon loop with auto-recovery."""
        log.info("=" * 60)
        log.info("SLOTFEED OCR DAEMON - Starting")
        log.info(f"Capture Interval: {CONFIG['capture_interval']}s")
        log.info("=" * 60)

        # Initialize
        if not self.initialize():
            log.error("Failed to initialize, exiting")
            return

        self.running = True
        self.stats["start_time"] = datetime.now()

        last_refresh = datetime.now()
        last_health_check = datetime.now()

        try:
            while self.running:
                # Check if we need to reinitialize
                if self.stats["consecutive_errors"] >= CONFIG["max_consecutive_errors"]:
                    log.warning(f"Too many consecutive errors ({self.stats['consecutive_errors']}), reinitializing...")
                    if not self.reinitialize():
                        log.error("Reinitialization failed, waiting 30s...")
                        time.sleep(30)
                        continue
                    self.stats["consecutive_errors"] = 0

                # Refresh streamer data periodically
                if (datetime.now() - last_refresh).total_seconds() > CONFIG["streamer_refresh_interval"]:
                    log.debug("Refreshing streamer data...")
                    self.refresh_streamer_data()
                    last_refresh = datetime.now()

                # Run capture round
                try:
                    self.run_round()
                except Exception as e:
                    log.error(f"Round error: {e}")
                    self.stats["total_errors"] += 1
                    self.stats["consecutive_errors"] += 1

                # Health check
                if (datetime.now() - last_health_check).total_seconds() > CONFIG["health_check_interval"]:
                    self._save_health_status()
                    last_health_check = datetime.now()

                # Wait for next round
                time.sleep(CONFIG["capture_interval"])

        except Exception as e:
            log.error(f"Fatal error: {e}")
        finally:
            self.shutdown()

    def shutdown(self):
        """Graceful shutdown."""
        log.info("Shutting down daemon...")
        self.running = False
        self._save_balance_history()
        self._save_health_status()
        log.info("Daemon stopped")


# ============================================
# MAIN
# ============================================
def main():
    daemon = OCRDaemon()
    daemon.run()


if __name__ == "__main__":
    main()

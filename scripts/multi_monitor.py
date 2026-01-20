#!/usr/bin/env python3
"""
SLOTFEED - Multi-Stream Monitor
Monitors multiple live streams simultaneously using async/threading.
"""

import sys
import os
import time
import json
import subprocess
import threading
import signal
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

import cloudscraper
import numpy as np
from PIL import Image
import imageio_ffmpeg
import sqlite3
import re


@dataclass
class StreamEvent:
    """Captured event from a stream."""
    timestamp: str
    streamer: str
    balance: Optional[float]
    bet: Optional[float]
    win: Optional[float]
    multiplier: Optional[float]
    raw_values: Dict[str, Any]


class MultiStreamMonitor:
    """
    Monitors multiple streams simultaneously.
    """

    def __init__(
        self,
        output_dir: Path,
        interval: float = 5.0,
        db_path: Optional[Path] = None,
    ):
        self.output_dir = output_dir
        self.interval = interval
        self.db_path = db_path or output_dir / "multi_stream_events.db"

        self.scraper = cloudscraper.create_scraper()
        self.ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        self.ocr_engine = None
        self.running = False
        self.lock = threading.Lock()
        self.ocr_lock = threading.Lock()  # Separate lock for OCR

        # Stats per streamer
        self.stats: Dict[str, Dict] = {}

        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Initialize database
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stream_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                streamer TEXT NOT NULL,
                balance REAL,
                bet REAL,
                win REAL,
                multiplier REAL,
                raw_values TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_streamer_timestamp
            ON stream_events(streamer, timestamp)
        ''')

        conn.commit()
        conn.close()
        print(f"Database: {self.db_path}")

    def _save_event(self, event: StreamEvent):
        """Save event to database (thread-safe)."""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO stream_events
                (timestamp, streamer, balance, bet, win, multiplier, raw_values)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                event.timestamp,
                event.streamer,
                event.balance,
                event.bet,
                event.win,
                event.multiplier,
                json.dumps(event.raw_values),
            ))

            conn.commit()
            conn.close()

    def _init_ocr(self):
        """Initialize OCR engine."""
        if self.ocr_engine is None:
            from ocr.engine.ocr_engine import OCREngine
            self.ocr_engine = OCREngine()

    def get_live_streamers(self) -> List[Dict[str, Any]]:
        """Get list of currently live streamers."""
        kick_streamers = [
            "roshtein", "classybeef", "maherco", "trainwreckstv",
            "xposed", "deuceace", "casinodaddy", "fruityslots",
            "letsgiveitaspin", "jarttu84", "vondice", "spintwix",
            "chipmonkz", "slotspinner"
        ]

        live = []
        for username in kick_streamers:
            try:
                resp = self.scraper.get(
                    f"https://kick.com/api/v2/channels/{username}",
                    timeout=10
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("livestream"):
                        live.append({
                            "username": username,
                            "viewers": data.get("livestream", {}).get("viewer_count", 0),
                            "title": data.get("livestream", {}).get("session_title", ""),
                            "playback_url": data.get("playback_url"),
                        })
            except Exception:
                pass

        return sorted(live, key=lambda x: x["viewers"], reverse=True)

    def capture_frame(self, username: str, stream_url: str) -> Optional[Path]:
        """Capture a frame from the stream."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        streamer_dir = self.output_dir / username
        streamer_dir.mkdir(exist_ok=True)
        frame_path = streamer_dir / f"frame_{timestamp}.jpg"

        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i", stream_url,
            "-frames:v", "1",
            "-q:v", "2",
            str(frame_path),
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=15,
            )

            if result.returncode == 0 and frame_path.exists():
                return frame_path
            return None
        except Exception:
            return None

    def extract_values(self, frame_path: Path) -> Dict[str, Any]:
        """Extract values from frame using OCR (thread-safe)."""
        # Use lock to prevent concurrent OCR calls
        with self.ocr_lock:
            self._init_ocr()

            image = Image.open(frame_path)
            frame = np.array(image)

            results = self.ocr_engine.process_image(frame)

        values = {
            "currencies": [],
            "multipliers": [],
        }

        for r in results:
            text = r.raw_text

            # Currency values
            currency_matches = re.findall(r'\$[\d,]+\.?\d*', text)
            for match in currency_matches:
                try:
                    value = float(match.replace('$', '').replace(',', ''))
                    values["currencies"].append({
                        "value": value,
                        "confidence": r.confidence,
                        "raw": match,
                    })
                except:
                    pass

            # Multipliers
            mult_matches = re.findall(r'[\d,]+\.?\d*x', text, re.IGNORECASE)
            for match in mult_matches:
                try:
                    value = float(match.lower().replace('x', '').replace(',', ''))
                    values["multipliers"].append({
                        "value": value,
                        "confidence": r.confidence,
                        "raw": match,
                    })
                except:
                    pass

        return values

    def analyze_values(self, username: str, values: Dict[str, Any]) -> StreamEvent:
        """Analyze extracted values."""
        timestamp = datetime.now().isoformat()

        currencies = sorted(
            values.get("currencies", []),
            key=lambda x: x["value"],
            reverse=True
        )

        balance = None
        bet = None
        multiplier = None

        # Get multiplier
        multipliers = values.get("multipliers", [])
        if multipliers:
            max_mult = max(multipliers, key=lambda x: x["value"])
            multiplier = max_mult["value"]

        # Identify balance
        for curr in currencies:
            val = curr["value"]
            if 100 <= val <= 10_000_000 and curr["confidence"] > 0.8:
                if balance is None or val > balance:
                    balance = val
                break

        # Common bet values
        common_bets = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
        for curr in currencies:
            val = curr["value"]
            if val in common_bets or (val % 10 == 0 and val <= 1000):
                bet = val
                break

        return StreamEvent(
            timestamp=timestamp,
            streamer=username,
            balance=balance,
            bet=bet,
            win=None,
            multiplier=multiplier,
            raw_values={
                "currencies": currencies[:10],
                "multipliers": multipliers[:5],
            },
        )

    def process_streamer(self, streamer: Dict[str, Any]) -> Optional[StreamEvent]:
        """Process a single streamer's frame."""
        username = streamer["username"]
        stream_url = streamer["playback_url"]

        if not stream_url:
            return None

        # Capture frame
        frame_path = self.capture_frame(username, stream_url)
        if not frame_path:
            return None

        # Extract and analyze
        values = self.extract_values(frame_path)
        event = self.analyze_values(username, values)

        # Save event
        self._save_event(event)

        # Update stats
        if username not in self.stats:
            self.stats[username] = {"frames": 0, "events": 0}
        self.stats[username]["frames"] += 1
        self.stats[username]["events"] += 1

        # Cleanup old frames
        self._cleanup_frames(username)

        return event

    def _cleanup_frames(self, username: str, keep_last: int = 5):
        """Remove old frame files."""
        streamer_dir = self.output_dir / username
        if streamer_dir.exists():
            frames = sorted(streamer_dir.glob("frame_*.jpg"))
            for frame in frames[:-keep_last]:
                try:
                    frame.unlink()
                except:
                    pass

    def run(self, duration: Optional[int] = None, max_workers: int = 3):
        """
        Run multi-stream monitoring.

        Args:
            duration: Duration in seconds. None = run forever.
            max_workers: Max concurrent stream captures.
        """
        print("\n" + "=" * 70)
        print("SLOTFEED Multi-Stream Monitor")
        print("=" * 70)
        print(f"Interval: {self.interval}s")
        print(f"Max workers: {max_workers}")
        print(f"Output: {self.output_dir}")
        print("=" * 70)

        self.running = True
        start_time = time.time()
        cycle = 0

        # Handle Ctrl+C
        def signal_handler(sig, frame):
            print("\n\nStopping monitor...")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)

        while self.running:
            # Check duration
            elapsed = time.time() - start_time
            if duration and elapsed >= duration:
                print(f"\nDuration ({duration}s) reached.")
                break

            cycle += 1

            # Get live streamers
            live_streamers = self.get_live_streamers()
            if not live_streamers:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] No live streams. Waiting...")
                time.sleep(30)
                continue

            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Cycle {cycle} - {len(live_streamers)} live streams")

            # Process streamers in parallel
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {
                    executor.submit(self.process_streamer, s): s
                    for s in live_streamers
                }

                for future in as_completed(futures):
                    streamer = futures[future]
                    try:
                        event = future.result()
                        if event:
                            bal_str = f"${event.balance:,.0f}" if event.balance else "?"
                            mult_str = f"{event.multiplier:.0f}x" if event.multiplier else "-"
                            print(
                                f"  {streamer['username']:15} | "
                                f"Bal: {bal_str:>12} | "
                                f"Mult: {mult_str:>8} | "
                                f"Viewers: {streamer['viewers']:,}"
                            )
                    except Exception as e:
                        print(f"  {streamer['username']:15} | Error: {e}")

            # Wait for next interval
            time.sleep(self.interval)

        # Print summary
        self._print_summary()

    def _print_summary(self):
        """Print monitoring summary."""
        print("\n" + "=" * 70)
        print("MONITORING SUMMARY")
        print("=" * 70)

        total_frames = sum(s["frames"] for s in self.stats.values())
        print(f"Total frames captured: {total_frames}")
        print(f"Streamers monitored: {len(self.stats)}")

        print("\nPer-Streamer Stats:")
        for username, stats in self.stats.items():
            print(f"  {username}: {stats['frames']} frames")

        print(f"\nDatabase: {self.db_path}")
        print("=" * 70 + "\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="SLOTFEED Multi-Stream Monitor")
    parser.add_argument("-i", "--interval", type=float, default=10.0,
                        help="Capture interval in seconds (default: 10)")
    parser.add_argument("-d", "--duration", type=int, default=None,
                        help="Duration in seconds (default: run forever)")
    parser.add_argument("-w", "--workers", type=int, default=3,
                        help="Max concurrent workers (default: 3)")
    parser.add_argument("-o", "--output", type=str, default=None,
                        help="Output directory")

    args = parser.parse_args()

    # Set output directory
    if args.output:
        output_dir = Path(args.output)
    else:
        output_dir = project_root / "data" / "multi_captures"

    # Create and run monitor
    monitor = MultiStreamMonitor(
        output_dir=output_dir,
        interval=args.interval,
    )

    monitor.run(duration=args.duration, max_workers=args.workers)


if __name__ == "__main__":
    main()

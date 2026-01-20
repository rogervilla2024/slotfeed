#!/usr/bin/env python3
"""
SLOTFEED - Continuous OCR Collector
Runs all day, capturing frames and extracting balance data
"""

import os
import sys
import json
import time
from datetime import datetime

# Disable PaddleX model source check (must be before imports)
os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from ocr.stream_ocr import StreamOCR, STREAMERS_DIR, OCR_RESULTS_DIR
from ocr.session_manager import session_manager
from ocr.game_detector import get_game_detector, DetectedGame
from ocr.game_stats_aggregator import get_game_stats_aggregator

# Configuration
CAPTURE_INTERVAL = 10  # seconds between captures
BALANCE_HISTORY_FILE = os.path.join(project_root, "data", "balance_history.json")

# Validation thresholds
MAX_BALANCE = 10_000_000  # $10M max balance (high rollers like roshtein)
MAX_CHANGE = 5_000_000    # $5M max change (high roller reloads and jackpots)
MIN_CONFIDENCE = 0.7     # Minimum OCR confidence score
MAX_DIGITS = 9           # Max digits in a valid balance (up to $99,999,999)


# Multi-frame confirmation cache
pending_readings = {}  # {username: {"balance": value, "count": n}}


def load_balance_history():
    """Load existing balance history."""
    if os.path.exists(BALANCE_HISTORY_FILE):
        with open(BALANCE_HISTORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_balance_history(history):
    """Save balance history."""
    with open(BALANCE_HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=2, default=str)


def is_valid_balance(balance, prev_balance=None):
    """Validate if balance reading is realistic."""
    # Check for negative
    if balance < 0:
        return False, "negative"

    # Check digit count (prevents garbage like 96707410429011)
    digit_count = len(str(int(balance)))
    if digit_count > MAX_DIGITS:
        return False, f"too_many_digits ({digit_count})"

    # Check max balance
    if balance > MAX_BALANCE:
        return False, f"exceeds_max (${balance:,.0f})"

    # Check change amount if we have previous balance
    if prev_balance is not None and prev_balance > 0:
        change = abs(balance - prev_balance)
        if change > MAX_CHANGE:
            return False, f"change_too_large (${change:,.0f})"

    return True, "valid"


def confirm_reading(username, balance, tolerance=100):
    """Multi-frame confirmation - requires similar reading twice."""
    global pending_readings

    if username not in pending_readings:
        # First reading - store it but don't confirm yet
        pending_readings[username] = {"balance": balance, "count": 1}
        return False, "awaiting_confirmation"

    pending = pending_readings[username]

    # Check if new reading is similar to pending (within tolerance)
    if abs(balance - pending["balance"]) <= tolerance:
        # Similar reading - increment count
        pending["count"] += 1
        pending["balance"] = balance  # Update with latest

        if pending["count"] >= 2:
            # Confirmed! Reset counter
            pending_readings[username] = {"balance": balance, "count": 0}
            return True, "confirmed"
        else:
            return False, f"count={pending['count']}/2"
    else:
        # Different reading - reset with new value
        pending_readings[username] = {"balance": balance, "count": 1}
        return False, "reset_new_value"


def get_live_streamers():
    """Get list of currently live streamers."""
    live = []
    if os.path.exists(STREAMERS_DIR):
        for filename in os.listdir(STREAMERS_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(STREAMERS_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if data.get('livestream'):
                            live.append(data.get('slug', filename.replace('.json', '')))
                except:
                    pass
    return live


def get_stream_title(username: str) -> str:
    """Get stream title from streamer JSON file."""
    filepath = os.path.join(STREAMERS_DIR, f"{username}.json")
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                livestream = data.get('livestream', {})
                if livestream:
                    return livestream.get('session_title', '')
        except:
            pass
    return ''


def main():
    print("=" * 60)
    print("SLOTFEED Continuous OCR Collector")
    print(f"Capture Interval: {CAPTURE_INTERVAL} seconds")
    print("Game Detection: ENABLED")
    print("=" * 60)

    # Initialize OCR
    ocr = StreamOCR()

    # Initialize game detection and stats
    game_detector = get_game_detector()
    game_stats = get_game_stats_aggregator()

    # Load history
    history = load_balance_history()

    round_num = 0

    try:
        while True:
            round_num += 1
            print(f"\n--- OCR Round {round_num} | {datetime.now().strftime('%H:%M:%S')} ---")

            # Get live streamers
            live_streamers = get_live_streamers()

            if not live_streamers:
                print("No live streamers. Waiting...")
                time.sleep(CAPTURE_INTERVAL)
                continue

            print(f"Live: {', '.join(live_streamers)}")

            for username in live_streamers:
                try:
                    result = ocr.process_streamer(username)

                    if result and result.get("extracted", {}).get("balance"):
                        balance = result["extracted"]["balance"]
                        confidence = result.get("confidence", 0)
                        timestamp = datetime.now().isoformat()

                        # Check OCR confidence
                        if confidence < MIN_CONFIDENCE:
                            print(f"  {username}: LOW CONFIDENCE ({confidence:.2f}) - ${balance:,.2f}")
                            continue

                        # Get previous balance for validation
                        prev_balance = history.get(username, {}).get("current_balance")

                        # Validate balance format and range
                        is_valid, reason = is_valid_balance(balance, prev_balance)
                        if not is_valid:
                            print(f"  {username}: REJECTED ({reason}) - ${balance:,.2f}")
                            continue

                        # Detect current game from stream title and OCR text (before confirmation)
                        stream_title = get_stream_title(username)
                        ocr_texts = result.get("raw_text", [])
                        detected_game = game_detector.detect_game(username, stream_title, ocr_texts)

                        # Multi-frame confirmation
                        confirmed, confirm_status = confirm_reading(username, balance)
                        if not confirmed:
                            game_info = f" [{detected_game.game_name}]" if detected_game and detected_game.game_id != 'generic' else ""
                            print(f"  {username}: PENDING ({confirm_status}) - ${balance:,.2f}{game_info}")
                            # Still update game stats for pending readings (track game even without balance confirm)
                            if detected_game and detected_game.game_id != 'generic':
                                # Only register game play, don't track balance change yet
                                game_stats.register_game_session(username, detected_game.game_id, detected_game.game_name, detected_game.provider)
                            continue

                        game_info = f" [{detected_game.game_name}]" if detected_game.game_id != 'generic' else ""
                        print(f"  {username}: CONFIRMED - ${balance:,.2f}{game_info} (conf: {confidence:.2f})")

                        # Initialize streamer history
                        if username not in history:
                            history[username] = {
                                "current_balance": 0,
                                "session_start_balance": balance,
                                "session_start_time": timestamp,
                                "peak_balance": balance,
                                "lowest_balance": balance,
                                "total_wagered": 0,
                                "balance_history": [],
                            }

                        # Update stats
                        prev_balance = history[username].get("current_balance", balance)
                        history[username]["current_balance"] = balance
                        history[username]["peak_balance"] = max(balance, history[username].get("peak_balance", balance))
                        history[username]["lowest_balance"] = min(balance, history[username].get("lowest_balance", balance))

                        # Track balance change
                        change = balance - prev_balance
                        if abs(change) > 0:
                            # Add entry with game_id
                            history[username]["balance_history"].append({
                                "timestamp": timestamp,
                                "balance": balance,
                                "change": change,
                                "game_id": detected_game.game_id if detected_game else None,
                            })

                            # Keep last 1000 entries
                            if len(history[username]["balance_history"]) > 1000:
                                history[username]["balance_history"] = history[username]["balance_history"][-1000:]

                            # Update game stats if we detected a game
                            if detected_game and detected_game.game_id != 'generic':
                                game_stats.update_stats(
                                    username=username,
                                    game_id=detected_game.game_id,
                                    game_name=detected_game.game_name,
                                    provider=detected_game.provider,
                                    balance_change=change
                                )

                        # Calculate session profit/loss
                        session_start = history[username].get("session_start_balance", balance)
                        profit_loss = balance - session_start

                        print(f"  {username}: ${balance:,.2f} (P/L: ${profit_loss:+,.2f})")

                        # Update session manager
                        session_manager.update_session(username, {"balance": balance})

                        # Save history after each update
                        save_balance_history(history)

                except Exception as e:
                    print(f"  {username}: Error - {e}")

            print(f"\nNext capture in {CAPTURE_INTERVAL} seconds...")
            time.sleep(CAPTURE_INTERVAL)

    except KeyboardInterrupt:
        print("\n[STOP] OCR Collector stopped")
        save_balance_history(history)
        print("Balance history saved.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
SLOTFEED - Multi-Platform OCR Collector
Monitors streams from Kick, Twitch, and YouTube
"""

import os
import sys

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

import json
import time
import httpx
from datetime import datetime

# Disable PaddleX model source check
os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'
os.environ['FLAGS_allocator_strategy'] = 'auto_growth'

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from ocr.stream_ocr import StreamOCR, STREAMERS_DIR
from ocr.continuous_ocr import (
    load_balance_history, save_balance_history,
    is_valid_balance, confirm_reading, BALANCE_HISTORY_FILE
)

# Configuration
CAPTURE_INTERVAL = 10
API_BASE = "http://localhost:8000/api/v1"

# Tier 1 Kick streamers to prioritize
TIER1_KICK = [
    'roshtein', 'trainwreckstv', 'classybeef', 'xposed',
    'deuceace', 'casinodaddy', 'mellstroy', 'maherco',
    'bidule', 'fruityslots', 'jarttu84', 'vondice', 'westcol'
]


def fetch_kick_streamers():
    """Fetch live Kick streamers and save their data."""
    live = []

    for username in TIER1_KICK:
        try:
            resp = httpx.get(f'https://kick.com/api/v2/channels/{username}', timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                livestream = data.get('livestream')

                if livestream:
                    # Get playback URL
                    playback_url = livestream.get('playback_url', '')

                    # Save streamer data
                    streamer_file = os.path.join(STREAMERS_DIR, f"{username}.json")
                    streamer_data = {
                        'slug': username,
                        'username': username,
                        'platform': 'kick',
                        'livestream': livestream,
                        'playback_url': playback_url,
                        'viewer_count': livestream.get('viewer_count', 0),
                        'updated_at': datetime.now().isoformat(),
                    }

                    with open(streamer_file, 'w') as f:
                        json.dump(streamer_data, f, indent=2)

                    live.append({
                        'username': username,
                        'platform': 'kick',
                        'viewers': livestream.get('viewer_count', 0),
                        'playback_url': playback_url,
                    })
                    print(f"  [KICK] {username}: LIVE ({livestream.get('viewer_count', 0):,} viewers)")
                else:
                    # Mark as offline
                    streamer_file = os.path.join(STREAMERS_DIR, f"{username}.json")
                    if os.path.exists(streamer_file):
                        with open(streamer_file, 'r') as f:
                            existing = json.load(f)
                        existing['livestream'] = None
                        with open(streamer_file, 'w') as f:
                            json.dump(existing, f, indent=2)

        except Exception as e:
            print(f"  [KICK] {username}: Error - {str(e)[:50]}")

    return live


def fetch_twitch_streamers(ocr_instance=None):
    """Fetch live Twitch gambling streamers and get streamlink URLs."""
    live = []

    try:
        resp = httpx.get(f'{API_BASE}/live/streams?platform=twitch', timeout=30)
        if resp.status_code == 200:
            streams = resp.json()
            if isinstance(streams, list):
                for stream in streams[:5]:  # Top 5 (streamlink is slower)
                    username = stream.get('streamer', {}).get('username', 'unknown')
                    viewers = stream.get('viewerCount', 0)

                    # Try to get streamlink URL if OCR instance provided
                    playback_url = None
                    if ocr_instance:
                        playback_url = ocr_instance.get_twitch_stream_url(username)

                    if playback_url:
                        # Save streamer data
                        streamer_file = os.path.join(STREAMERS_DIR, f"twitch_{username}.json")
                        streamer_data = {
                            'slug': f"twitch_{username}",
                            'username': username,
                            'platform': 'twitch',
                            'livestream': True,
                            'playback_url': playback_url,
                            'viewer_count': viewers,
                            'updated_at': datetime.now().isoformat(),
                        }

                        with open(streamer_file, 'w') as f:
                            json.dump(streamer_data, f, indent=2)

                        live.append({
                            'username': username,
                            'platform': 'twitch',
                            'viewers': viewers,
                            'playback_url': playback_url,
                        })
                        print(f"  [TWITCH] {username}: LIVE ({viewers:,} viewers) - streamlink OK")
                    else:
                        print(f"  [TWITCH] {username}: LIVE ({viewers:,} viewers) - no streamlink")

    except Exception as e:
        print(f"  [TWITCH] Error: {e}")

    return live


def fetch_youtube_streamers(ocr_instance=None):
    """Fetch live YouTube slot streamers and get streamlink URLs."""
    live = []

    try:
        resp = httpx.get(f'{API_BASE}/live/youtube/live', timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            streams = data.get('streams', [])
            for stream in streams[:3]:  # Top 3 (streamlink is slower)
                username = stream.get('streamerName', 'unknown')
                viewers = stream.get('viewerCount', 0)
                video_id = stream.get('videoId', '')

                # Try to get streamlink URL if OCR instance and video_id available
                playback_url = None
                if ocr_instance and video_id:
                    playback_url = ocr_instance.get_youtube_stream_url(video_id)

                if playback_url:
                    # Save streamer data
                    safe_name = username.replace(' ', '_').lower()[:20]
                    streamer_file = os.path.join(STREAMERS_DIR, f"youtube_{safe_name}.json")
                    streamer_data = {
                        'slug': f"youtube_{safe_name}",
                        'username': username,
                        'platform': 'youtube',
                        'video_id': video_id,
                        'livestream': True,
                        'playback_url': playback_url,
                        'viewer_count': viewers,
                        'updated_at': datetime.now().isoformat(),
                    }

                    with open(streamer_file, 'w') as f:
                        json.dump(streamer_data, f, indent=2)

                    live.append({
                        'username': username,
                        'platform': 'youtube',
                        'viewers': viewers,
                        'playback_url': playback_url,
                    })
                    print(f"  [YOUTUBE] {username}: LIVE ({viewers:,} viewers) - streamlink OK")
                else:
                    print(f"  [YOUTUBE] {username}: LIVE ({viewers:,} viewers)")

    except Exception as e:
        print(f"  [YOUTUBE] Error: {e}")

    return live


def get_all_live_streamers(ocr_instance=None):
    """Fetch live streamers from all platforms."""
    print("\n[FETCH] Refreshing live streamer data...")

    kick_live = fetch_kick_streamers()
    twitch_live = fetch_twitch_streamers(ocr_instance)  # Pass OCR for streamlink
    youtube_live = fetch_youtube_streamers(ocr_instance)  # Pass OCR for streamlink

    all_live = kick_live + twitch_live + youtube_live
    print(f"\n[SUMMARY] Kick: {len(kick_live)} | Twitch: {len(twitch_live)} | YouTube: {len(youtube_live)}")

    return all_live


def main():
    print("=" * 60)
    print("SLOTFEED Multi-Platform OCR Collector")
    print(f"Capture Interval: {CAPTURE_INTERVAL} seconds")
    print("=" * 60)

    # Ensure directories exist
    os.makedirs(STREAMERS_DIR, exist_ok=True)

    # Initialize OCR
    print("\n[INIT] Loading PaddleOCR...")
    ocr = StreamOCR()

    # Load history
    history = load_balance_history()

    round_num = 0
    last_refresh = 0
    REFRESH_INTERVAL = 120  # Refresh streamer data every 2 minutes

    try:
        while True:
            round_num += 1
            now = time.time()

            # Refresh streamer data periodically
            if now - last_refresh > REFRESH_INTERVAL:
                live_streamers = get_all_live_streamers(ocr)  # Pass OCR for streamlink
                last_refresh = now

            print(f"\n--- OCR Round {round_num} | {datetime.now().strftime('%H:%M:%S')} ---")

            # Get currently live streamers from saved data
            streamers_to_process = []
            if os.path.exists(STREAMERS_DIR):
                for filename in os.listdir(STREAMERS_DIR):
                    if filename.endswith('.json'):
                        filepath = os.path.join(STREAMERS_DIR, filename)
                        try:
                            with open(filepath, 'r') as f:
                                data = json.load(f)
                                if data.get('livestream') and data.get('playback_url'):
                                    streamers_to_process.append(data.get('slug', filename.replace('.json', '')))
                        except:
                            pass

            if not streamers_to_process:
                print("No live streamers with valid URLs. Waiting...")
                time.sleep(CAPTURE_INTERVAL)
                continue

            print(f"Processing: {', '.join(streamers_to_process)}")

            for username in streamers_to_process:
                try:
                    result = ocr.process_streamer(username)

                    if result and result.get("extracted", {}).get("balance"):
                        balance = result["extracted"]["balance"]
                        confidence = result.get("confidence", 0)
                        timestamp = datetime.now().isoformat()

                        # Get previous balance
                        prev_balance = history.get(username, {}).get("current_balance")

                        # Validate balance
                        is_valid, reason = is_valid_balance(balance, prev_balance)
                        if not is_valid:
                            print(f"  {username}: REJECTED ({reason}) - ${balance:,.2f}")
                            continue

                        # Multi-frame confirmation
                        confirmed, confirm_status = confirm_reading(username, balance)
                        if not confirmed:
                            print(f"  {username}: PENDING ({confirm_status}) - ${balance:,.2f}")
                            continue

                        print(f"  {username}: CONFIRMED - ${balance:,.2f} (conf: {confidence:.2f})")

                        # Initialize history
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

                        # Track change
                        change = balance - prev_balance
                        if abs(change) > 0:
                            history[username]["balance_history"].append({
                                "timestamp": timestamp,
                                "balance": balance,
                                "change": change,
                            })

                            if len(history[username]["balance_history"]) > 1000:
                                history[username]["balance_history"] = history[username]["balance_history"][-1000:]

                        # Calculate P/L
                        session_start = history[username].get("session_start_balance", balance)
                        profit_loss = balance - session_start

                        print(f"  {username}: ${balance:,.2f} (P/L: ${profit_loss:+,.2f})")

                        # Save
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

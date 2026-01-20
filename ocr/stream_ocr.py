#!/usr/bin/env python3
"""
SLOTFEED - Stream OCR Pipeline
Captures frames from live streams and extracts balance/bet/win data
"""

import os
import sys
import json
import time
import re
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

# Disable PaddleX model source check
os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

import cv2
import numpy as np

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# PaddleOCR import
from paddleocr import PaddleOCR

# Configuration
DATA_DIR = os.path.join(project_root, "data")
FRAMES_DIR = os.path.join(DATA_DIR, "frames")
OCR_RESULTS_DIR = os.path.join(DATA_DIR, "ocr_results")
STREAMERS_DIR = os.path.join(DATA_DIR, "streamers")

# Ensure directories exist
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(OCR_RESULTS_DIR, exist_ok=True)

# OCR Configuration
CAPTURE_INTERVAL = 5  # seconds between captures
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720


class StreamOCR:
    """OCR processor for live streams."""

    def __init__(self):
        print("[OCR] Initializing PaddleOCR...")
        self.ocr = PaddleOCR(lang='en')
        print("[OCR] PaddleOCR ready!")

        self.stats = {
            "frames_captured": 0,
            "ocr_processed": 0,
            "balance_detected": 0,
            "started_at": datetime.now().isoformat(),
        }

    def get_stream_url(self, username: str) -> Optional[str]:
        """Get fresh stream URL from Kick API (tokens expire after ~2 hours)."""
        print(f"[STREAM] Getting stream URL for {username}...")

        try:
            import cloudscraper

            # Use cloudscraper to bypass CloudFlare
            scraper = cloudscraper.create_scraper()

            # Fetch fresh URL from Kick API
            api_url = f"https://kick.com/api/v2/channels/{username}"

            response = scraper.get(api_url, timeout=15)

            if response.status_code == 200:
                data = response.json()
                playback_url = data.get('playback_url')

                if playback_url:
                    print(f"[STREAM] Got URL: {playback_url[:80]}...")

                    # Update local JSON file with fresh data
                    streamer_file = os.path.join(STREAMERS_DIR, f"{username}.json")
                    with open(streamer_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2)

                    return playback_url
                else:
                    print(f"[STREAM] {username} is offline (no playback_url)")
                    return None
            else:
                print(f"[STREAM] API error: {response.status_code}")
                # Fallback to cached URL
                return self._get_cached_url(username)

        except Exception as e:
            print(f"[STREAM] Error: {e}")
            # Fallback to cached URL
            return self._get_cached_url(username)

    def _get_cached_url(self, username: str) -> Optional[str]:
        """Get cached URL from local JSON (fallback)."""
        try:
            streamer_file = os.path.join(STREAMERS_DIR, f"{username}.json")
            if os.path.exists(streamer_file):
                with open(streamer_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('playback_url')
        except:
            pass
        return None

    def get_twitch_stream_url(self, username: str, quality: str = "720p,720p60,best") -> Optional[str]:
        """Get Twitch stream URL via streamlink."""
        print(f"[STREAMLINK] Getting Twitch URL for {username}...")

        try:
            # Use python -m streamlink to avoid PATH issues on Windows
            result = subprocess.run(
                [sys.executable, '-m', 'streamlink', '--stream-url', f'https://twitch.tv/{username}', quality],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout.strip():
                url = result.stdout.strip()
                print(f"[STREAMLINK] Got URL: {url[:80]}...")
                return url
            else:
                if 'No playable streams' in result.stderr or 'offline' in result.stderr.lower():
                    print(f"[STREAMLINK] {username} is offline")
                else:
                    print(f"[STREAMLINK] Error: {result.stderr[:100] if result.stderr else 'No URL returned'}")
                return None

        except subprocess.TimeoutExpired:
            print(f"[STREAMLINK] Timeout getting URL for {username}")
            return None
        except FileNotFoundError:
            print("[STREAMLINK] Python or streamlink module not found")
            return None
        except Exception as e:
            print(f"[STREAMLINK] Error: {e}")
            return None

    def get_youtube_stream_url(self, video_id: str, quality: str = "720p,best") -> Optional[str]:
        """Get YouTube stream URL via streamlink."""
        print(f"[STREAMLINK] Getting YouTube URL for {video_id}...")

        try:
            # Use python -m streamlink to avoid PATH issues on Windows
            result = subprocess.run(
                [sys.executable, '-m', 'streamlink', '--stream-url', f'https://youtube.com/watch?v={video_id}', quality],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout.strip():
                url = result.stdout.strip()
                print(f"[STREAMLINK] Got URL: {url[:80]}...")
                return url
            else:
                print(f"[STREAMLINK] Error: {result.stderr[:100] if result.stderr else 'No URL returned'}")
                return None

        except subprocess.TimeoutExpired:
            print(f"[STREAMLINK] Timeout getting URL for {video_id}")
            return None
        except FileNotFoundError:
            print("[STREAMLINK] Python or streamlink module not found")
            return None
        except Exception as e:
            print(f"[STREAMLINK] Error: {e}")
            return None

    def capture_frame(self, stream_url: str, username: str) -> Optional[str]:
        """Capture a single frame from stream."""
        print(f"[CAPTURE] Opening stream...")

        try:
            # Set timeout for stream opening
            cap = cv2.VideoCapture(stream_url, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 10000)  # 10 second timeout
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)   # 5 second read timeout

            if not cap.isOpened():
                print("[CAPTURE] Failed to open stream")
                return None

            # Skip some frames to get current frame
            for _ in range(3):
                cap.grab()

            ret, frame = cap.read()
            cap.release()

            if not ret or frame is None:
                print("[CAPTURE] Failed to read frame")
                return None

            # Resize if needed
            if frame.shape[1] != FRAME_WIDTH or frame.shape[0] != FRAME_HEIGHT:
                frame = cv2.resize(frame, (FRAME_WIDTH, FRAME_HEIGHT))

            # Save frame
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{username}_{timestamp}.jpg"
            filepath = os.path.join(FRAMES_DIR, filename)

            cv2.imwrite(filepath, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            self.stats["frames_captured"] += 1
            print(f"[CAPTURE] Saved: {filename}")

            return filepath

        except Exception as e:
            print(f"[CAPTURE] Error: {e}")
            return None

    def extract_numbers(self, text: str) -> list:
        """Extract monetary values from text (supports $ and €)."""
        # Match patterns for both $ and € currencies
        patterns = [
            r'[\$€][\d,]+\.?\d*',  # $1,234.56 or €1,234.56
            r'[\d,]+\.\d{2}',      # 1,234.56
        ]

        numbers = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # Clean and convert (remove currency symbols and commas)
                clean = match.replace('$', '').replace('€', '').replace(',', '')
                try:
                    value = float(clean)
                    if value > 0:
                        numbers.append(value)
                except:
                    pass

        return numbers

    def find_labeled_balance(self, raw_texts: list) -> Optional[float]:
        """Find balance by looking for labeled amounts like 'BALANCE: $X' or 'CREDIT: €X'."""
        # Priority labels - more specific first
        priority_labels = ['BALANCE', 'SALDO', 'BAKIYE']
        secondary_labels = ['CREDIT', 'CREDITS']

        # Labels to SKIP (bonus hunt stats, not current balance)
        skip_labels = ['USED', 'USED:', 'TOTAL USED', 'WAGERED', 'SPENT']

        # Try priority labels first
        for labels in [priority_labels, secondary_labels]:
            for i, text in enumerate(raw_texts):
                text_upper = text.upper().strip()

                # Skip lines that contain "Used" or similar bonus hunt fields
                should_skip = False
                for skip in skip_labels:
                    if skip in text_upper:
                        should_skip = True
                        break
                if should_skip:
                    continue

                for label in labels:
                    # Check if this line starts with or is the label (also handle "CREDIT$X" or "CREDIT€X" format)
                    if text_upper == label or text_upper.startswith(label + ' ') or text_upper.startswith(label + ':') or text_upper.startswith(label + '$') or text_upper.startswith(label + '€'):
                        # Extract $ or € amount from this line first
                        currency_match = re.search(r'[\$€][\d,]+\.?\d*', text)
                        if currency_match:
                            clean = currency_match.group().replace('$', '').replace('€', '').replace(',', '')
                            try:
                                value = float(clean)
                                # Must be a reasonable balance (>10 to avoid small numbers)
                                if 10 < value < 50_000_000:
                                    return value
                            except:
                                pass

                        # Look in next lines if not found in this line
                        for j in range(i + 1, min(i + 3, len(raw_texts))):
                            line = raw_texts[j]
                            # Skip if next line is a "Used" field
                            if any(skip in line.upper() for skip in skip_labels):
                                continue
                            currency_match = re.search(r'[\$€][\d,]+\.?\d*', line)
                            if currency_match:
                                clean = currency_match.group().replace('$', '').replace('€', '').replace(',', '')
                                try:
                                    value = float(clean)
                                    if 10 < value < 50_000_000:
                                        return value
                                except:
                                    pass
        return None

    def filter_garbage_numbers(self, numbers: list, raw_texts: list) -> list:
        """Filter out garbage numbers like IDs, timestamps, bonus hunt totals."""
        filtered = []

        # Labels that indicate numbers we should skip
        skip_contexts = ['BEST WIN', 'BEST X', 'USED', 'USED:', 'WAGERED', 'SPENT', 'TOTAL USED']

        for num in numbers:
            # Skip numbers that look like IDs (very large integers with no decimals)
            if num > 1_000_000_000 and num == int(num):
                continue

            # Skip unreasonably large numbers (>$50M)
            if num > 50_000_000:
                continue

            # Skip if this number appears in a "Best Win", "Used", or similar context
            skip_this = False
            num_str_dollar = f"${num:,.2f}"
            num_str_euro = f"€{num:,.2f}"
            num_int_dollar = f"${int(num):,}"
            num_int_euro = f"€{int(num):,}"

            for text in raw_texts:
                text_upper = text.upper()
                for skip_ctx in skip_contexts:
                    if skip_ctx in text_upper:
                        # Check if the number appears in this line
                        if any(s in text for s in [num_str_dollar, num_str_euro, num_int_dollar, num_int_euro, str(int(num))]):
                            skip_this = True
                            break
                if skip_this:
                    break

            if not skip_this:
                filtered.append(num)

        return filtered

    def is_bonus_mode(self, raw_texts: list) -> bool:
        """Detect if the screen shows a bonus/free spins mode."""
        bonus_keywords = [
            'FREE SPIN', 'FREE GAME', 'BONUS ROUND', 'BONUS GAME',
            'MEGA WIN', 'EPIC WIN', 'SUPER WIN', 'ULTRA WIN',
            'JACKPOT', 'MULTIPLIER X', 'SPINNING', 'SPINS LEFT'
        ]

        all_text = ' '.join(raw_texts).upper()
        for keyword in bonus_keywords:
            if keyword in all_text:
                return True
        return False

    def process_frame(self, image_path: str) -> Dict[str, Any]:
        """Run OCR on frame and extract data."""
        print(f"[OCR] Processing: {os.path.basename(image_path)}")

        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return {"error": "Failed to read image"}

            # Run OCR
            result = self.ocr.predict(image_path)
            self.stats["ocr_processed"] += 1

            # Extract all text - handle new PaddleOCR result format
            all_text = []
            all_numbers = []

            # New format: result is a list containing OCRResult objects
            if isinstance(result, list) and len(result) > 0:
                ocr_result = result[0]

                # Access attributes from OCRResult object
                rec_texts = getattr(ocr_result, 'rec_texts', []) or ocr_result.get('rec_texts', []) if hasattr(ocr_result, 'get') else []
                rec_scores = getattr(ocr_result, 'rec_scores', []) or ocr_result.get('rec_scores', []) if hasattr(ocr_result, 'get') else []

                # Handle both object attribute and dict access
                if not rec_texts and hasattr(ocr_result, '__getitem__'):
                    try:
                        rec_texts = ocr_result['rec_texts']
                        rec_scores = ocr_result['rec_scores']
                    except:
                        pass

                for i, text in enumerate(rec_texts):
                    if text:
                        confidence = float(rec_scores[i]) if i < len(rec_scores) else 0

                        all_text.append({
                            "text": str(text),
                            "confidence": confidence,
                        })

                        # Extract numbers
                        numbers = self.extract_numbers(str(text))
                        all_numbers.extend(numbers)

            # Try to identify balance, bet, win
            balance = None
            bet = None
            win = None

            # First try: look for labeled balance (BALANCE, CREDIT, etc.)
            raw_text_list = [t["text"] for t in all_text]
            labeled_balance = self.find_labeled_balance(raw_text_list)

            if labeled_balance:
                balance = labeled_balance
                self.stats["balance_detected"] += 1
            else:
                # Fallback: filter garbage and pick smartly
                filtered_nums = self.filter_garbage_numbers(all_numbers, raw_text_list)
                sorted_nums = sorted(set(filtered_nums), reverse=True)

                if len(sorted_nums) >= 1:
                    # Pick the largest reasonable number as balance
                    balance = sorted_nums[0]
                    self.stats["balance_detected"] += 1

            # Find bet amount (look for BET label or small numbers)
            for i, text in enumerate(raw_text_list):
                text_upper = text.upper().strip()
                # Match "BET $X" or "BET: €X" or just "BET" followed by amount
                if text_upper == 'BET' or text_upper.startswith('BET ') or text_upper.startswith('BET:') or text_upper.startswith('BET$') or text_upper.startswith('BET€'):
                    # Look for $ or € amount in this line or next lines
                    for j in range(i, min(i + 2, len(raw_text_list))):
                        bet_match = re.search(r'[\$€][\d,]+\.?\d*', raw_text_list[j])
                        if bet_match:
                            clean = bet_match.group().replace('$', '').replace('€', '').replace(',', '')
                            try:
                                bet_val = float(clean)
                                # Bets are usually small and shouldn't equal balance
                                if bet_val < 10000 and (balance is None or bet_val != balance):
                                    bet = bet_val
                                    break
                            except:
                                pass

            # Find win amount (look for WIN label)
            for i, text in enumerate(raw_text_list):
                text_upper = text.upper().strip()
                if text_upper == 'WIN' or text_upper.startswith('WIN:') or text_upper.startswith('WIN ') or text_upper.startswith('WIN$') or text_upper.startswith('WIN€'):
                    for j in range(i, min(i + 2, len(raw_text_list))):
                        win_match = re.search(r'[\$€][\d,]+\.?\d*', raw_text_list[j])
                        if win_match:
                            clean = win_match.group().replace('$', '').replace('€', '').replace(',', '')
                            try:
                                win = float(clean)
                                break
                            except:
                                pass

            # Get sorted numbers for logging
            filtered_nums = self.filter_garbage_numbers(all_numbers, raw_text_list)
            sorted_nums = sorted(set(filtered_nums), reverse=True)

            # Detect bonus mode
            is_bonus = self.is_bonus_mode(raw_text_list)

            ocr_data = {
                "timestamp": datetime.now().isoformat(),
                "image": os.path.basename(image_path),
                "raw_text": [t["text"] for t in all_text],
                "numbers_found": sorted_nums[:10] if sorted_nums else [],
                "extracted": {
                    "balance": balance,
                    "bet": bet,
                    "win": win,
                },
                "confidence": sum(t["confidence"] for t in all_text) / len(all_text) if all_text else 0,
                "is_bonus_mode": is_bonus,
            }

            if is_bonus:
                print(f"[OCR] BONUS MODE - Balance: ${balance:,.2f}" if balance else "[OCR] BONUS MODE - Using last known balance")
            else:
                print(f"[OCR] Balance: ${balance:,.2f}" if balance else "[OCR] No balance detected")

            return ocr_data

        except Exception as e:
            print(f"[OCR] Error: {e}")
            return {"error": str(e)}

    def process_streamer(self, username: str) -> Optional[Dict]:
        """Process a single streamer's stream."""
        print(f"\n{'='*60}")
        print(f"[PROCESS] {username}")
        print('='*60)

        # Check if streamer is live
        streamer_file = os.path.join(STREAMERS_DIR, f"{username}.json")
        if os.path.exists(streamer_file):
            with open(streamer_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if not data.get('livestream'):
                    print(f"[PROCESS] {username} is not live, skipping")
                    return None

        # Get stream URL
        stream_url = self.get_stream_url(username)
        if not stream_url:
            return None

        # Capture frame
        frame_path = self.capture_frame(stream_url, username)
        if not frame_path:
            return None

        # Process with OCR
        ocr_result = self.process_frame(frame_path)
        ocr_result["username"] = username

        # Save result
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = os.path.join(OCR_RESULTS_DIR, f"{username}_{timestamp}.json")
        with open(result_file, 'w') as f:
            json.dump(ocr_result, f, indent=2)

        return ocr_result

    def run_continuous(self, usernames: list):
        """Run continuous OCR on multiple streamers."""
        print("\n" + "="*60)
        print("SLOTFEED OCR Pipeline Started")
        print(f"Monitoring: {', '.join(usernames)}")
        print(f"Interval: {CAPTURE_INTERVAL} seconds")
        print("="*60)

        round_num = 0

        try:
            while True:
                round_num += 1
                print(f"\n--- OCR Round {round_num} ---")

                for username in usernames:
                    try:
                        result = self.process_streamer(username)
                        if result and result.get("extracted", {}).get("balance"):
                            print(f"[SUCCESS] {username}: ${result['extracted']['balance']:,.2f}")
                    except Exception as e:
                        print(f"[ERROR] {username}: {e}")

                print(f"\nStats: {self.stats['frames_captured']} frames, {self.stats['balance_detected']} balances detected")
                print(f"Next capture in {CAPTURE_INTERVAL} seconds...")
                time.sleep(CAPTURE_INTERVAL)

        except KeyboardInterrupt:
            print("\n[STOP] OCR Pipeline stopped")
            print(f"Final stats: {json.dumps(self.stats, indent=2)}")


def main():
    """Main entry point."""
    # Default streamers to monitor
    live_streamers = []

    # Check which streamers are live
    if os.path.exists(STREAMERS_DIR):
        for filename in os.listdir(STREAMERS_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(STREAMERS_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if data.get('livestream'):
                            live_streamers.append(data.get('slug', filename.replace('.json', '')))
                except Exception as e:
                    print(f"Error reading {filename}: {e}")

    if not live_streamers:
        print("No live streamers found!")
        print("Make sure the data collector is running.")
        return

    print(f"Found {len(live_streamers)} live streamers: {', '.join(live_streamers)}")

    ocr = StreamOCR()

    # Process each live streamer once for testing
    for username in live_streamers:
        result = ocr.process_streamer(username)
        if result:
            print(f"\nResult for {username}:")
            print(json.dumps(result.get("extracted", {}), indent=2))

    print("\n" + "="*60)
    print("OCR Test Complete!")
    print(f"Frames saved to: {FRAMES_DIR}")
    print(f"Results saved to: {OCR_RESULTS_DIR}")
    print("="*60)


if __name__ == "__main__":
    main()

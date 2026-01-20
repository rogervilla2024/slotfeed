#!/usr/bin/env python3
"""
SLOTFEED - VOD Processor
Processes past streams (VODs) from Kick to extract balance data
"""

import os
import sys
import json
import time
import subprocess
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

# Disable PaddleX model source check
os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import cloudscraper
from ocr.stream_ocr import StreamOCR

# Directories
VOD_RESULTS_DIR = os.path.join(project_root, "data", "vod_results")
VOD_FRAMES_DIR = os.path.join(project_root, "data", "vod_frames")

# Create directories
os.makedirs(VOD_RESULTS_DIR, exist_ok=True)
os.makedirs(VOD_FRAMES_DIR, exist_ok=True)

# Tier 1 streamers to process
TIER1_STREAMERS = [
    'roshtein', 'trainwreckstv', 'classybeef', 'xposed',
    'deuceace', 'casinodaddy', 'mellstroy', 'maherco',
    'bidule', 'fruityslots'
]

# Configuration
FRAME_INTERVAL = 30  # Extract 1 frame every 30 seconds from VOD
MAX_FRAMES_PER_VOD = 100  # Max frames to process per VOD


class KickVODFetcher:
    """Fetches VOD data from Kick API."""

    def __init__(self):
        self.scraper = cloudscraper.create_scraper(
            browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
        )

    def get_channel_vods(self, username: str, limit: int = 10) -> List[Dict]:
        """Get list of VODs for a channel."""
        try:
            url = f'https://kick.com/api/v2/channels/{username}/videos'
            resp = self.scraper.get(url, timeout=30)

            if resp.status_code == 200:
                vods = resp.json()
                if isinstance(vods, list):
                    return vods[:limit]
            else:
                print(f"[VOD] Error fetching VODs for {username}: HTTP {resp.status_code}")
        except Exception as e:
            print(f"[VOD] Exception fetching VODs for {username}: {e}")

        return []

    def get_vod_stream_url(self, vod: Dict) -> Optional[str]:
        """Extract stream URL from VOD data."""
        # VOD source is directly in the response
        source = vod.get('source')
        if source:
            return source

        # Try video object
        video = vod.get('video', {})
        if video:
            return video.get('source')

        return None


class VODFrameExtractor:
    """Extracts frames from VOD streams using OpenCV."""

    def __init__(self, frames_dir: str = VOD_FRAMES_DIR):
        self.frames_dir = frames_dir
        import cv2
        self.cv2 = cv2

    def extract_frames(
        self,
        stream_url: str,
        vod_id: str,
        interval: int = FRAME_INTERVAL,
        max_frames: int = MAX_FRAMES_PER_VOD,
        start_time: int = 0  # Start time in seconds
    ) -> List[str]:
        """Extract frames from VOD stream at regular intervals using OpenCV."""

        vod_frames_dir = os.path.join(self.frames_dir, vod_id)
        os.makedirs(vod_frames_dir, exist_ok=True)

        extracted_frames = []

        try:
            print(f"[CV2] Opening VOD stream {vod_id}...")
            cap = self.cv2.VideoCapture(stream_url)

            if not cap.isOpened():
                print(f"[CV2] Failed to open stream")
                return []

            fps = cap.get(self.cv2.CAP_PROP_FPS) or 30
            total_frames = int(cap.get(self.cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0

            print(f"[CV2] Stream opened: {fps:.1f} FPS, ~{duration/60:.1f} min duration")

            # Skip to start time
            if start_time > 0:
                start_frame = int(start_time * fps)
                cap.set(self.cv2.CAP_PROP_POS_FRAMES, start_frame)

            frame_interval = int(interval * fps)  # Frames to skip between captures
            frame_count = 0
            saved_count = 0

            while saved_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % frame_interval == 0:
                    # Save frame
                    output_path = os.path.join(vod_frames_dir, f"frame_{saved_count:04d}.jpg")
                    self.cv2.imwrite(output_path, frame)
                    extracted_frames.append(output_path)
                    saved_count += 1

                    if saved_count % 20 == 0:
                        current_time = frame_count / fps
                        print(f"[CV2] Extracted {saved_count} frames ({current_time/60:.1f} min)")

                frame_count += 1

            cap.release()
            print(f"[CV2] Extracted {len(extracted_frames)} frames total")

        except Exception as e:
            print(f"[CV2] Exception: {e}")

        return extracted_frames


class VODProcessor:
    """Main VOD processing pipeline."""

    def __init__(self):
        self.vod_fetcher = KickVODFetcher()
        self.frame_extractor = VODFrameExtractor()
        self.ocr = None  # Lazy load

    def _init_ocr(self):
        """Initialize OCR engine."""
        if self.ocr is None:
            print("[OCR] Initializing PaddleOCR...")
            self.ocr = StreamOCR()
            print("[OCR] Ready!")

    def process_vod(self, username: str, vod: Dict) -> Optional[Dict]:
        """Process a single VOD and extract balance data."""

        self._init_ocr()

        vod_id = vod.get('id', str(hash(str(vod)))[:8])
        livestream_id = vod.get('livestream_id', vod_id)

        print(f"\n{'='*60}")
        print(f"[VOD] Processing: {username} - VOD {livestream_id}")
        print(f"{'='*60}")

        # Get stream URL
        stream_url = self.vod_fetcher.get_vod_stream_url(vod)
        if not stream_url:
            print(f"[VOD] No stream URL found")
            return None

        print(f"[VOD] Stream URL: {stream_url[:80]}...")

        # Extract frames
        frames = self.frame_extractor.extract_frames(
            stream_url,
            f"{username}_{livestream_id}",
            interval=FRAME_INTERVAL,
            max_frames=MAX_FRAMES_PER_VOD
        )

        if not frames:
            print(f"[VOD] No frames extracted")
            return None

        # Process frames with OCR
        results = {
            'vod_id': vod_id,
            'livestream_id': livestream_id,
            'username': username,
            'processed_at': datetime.now().isoformat(),
            'frame_count': len(frames),
            'balances': [],
            'stats': {}
        }

        balances = []

        for i, frame_path in enumerate(frames):
            try:
                # Process frame with OCR
                result = self.ocr.process_frame(frame_path)

                if result and result.get('extracted', {}).get('balance'):
                    balance = result['extracted']['balance']
                    confidence = result.get('confidence', 0)
                    timestamp = i * FRAME_INTERVAL  # Approx timestamp in seconds

                    balances.append({
                        'timestamp_sec': timestamp,
                        'balance': balance,
                        'confidence': confidence
                    })

                    if (i + 1) % 10 == 0:
                        print(f"[OCR] Frame {i+1}/{len(frames)}: ${balance:,.2f}")

            except Exception as e:
                print(f"[OCR] Error on frame {i}: {e}")

        results['balances'] = balances

        # Calculate stats
        if balances:
            balance_values = [b['balance'] for b in balances]
            results['stats'] = {
                'min_balance': min(balance_values),
                'max_balance': max(balance_values),
                'start_balance': balance_values[0],
                'end_balance': balance_values[-1],
                'profit_loss': balance_values[-1] - balance_values[0],
                'readings_count': len(balances)
            }

            print(f"\n[STATS] Start: ${results['stats']['start_balance']:,.2f}")
            print(f"[STATS] End: ${results['stats']['end_balance']:,.2f}")
            print(f"[STATS] P/L: ${results['stats']['profit_loss']:+,.2f}")

        # Save results
        result_file = os.path.join(VOD_RESULTS_DIR, f"{username}_{livestream_id}.json")
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"[VOD] Results saved to {result_file}")

        return results

    def process_streamer_vods(self, username: str, limit: int = 3) -> List[Dict]:
        """Process multiple VODs for a streamer."""

        print(f"\n{'#'*60}")
        print(f"# Processing VODs for: {username}")
        print(f"{'#'*60}")

        vods = self.vod_fetcher.get_channel_vods(username, limit=limit)
        print(f"[VOD] Found {len(vods)} VODs")

        results = []
        for vod in vods:
            try:
                result = self.process_vod(username, vod)
                if result:
                    results.append(result)
            except Exception as e:
                print(f"[VOD] Error processing VOD: {e}")

        return results


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='SLOTFEED VOD Processor')
    parser.add_argument('--streamers', nargs='+', default=TIER1_STREAMERS[:5],
                       help='Streamers to process')
    parser.add_argument('--vods-per-streamer', type=int, default=2,
                       help='Number of VODs to process per streamer')
    parser.add_argument('--list-only', action='store_true',
                       help='Only list VODs without processing')

    args = parser.parse_args()

    print("=" * 60)
    print("SLOTFEED VOD Processor")
    print(f"Streamers: {', '.join(args.streamers)}")
    print(f"VODs per streamer: {args.vods_per_streamer}")
    print("=" * 60)

    processor = VODProcessor()

    if args.list_only:
        # Just list VODs
        for username in args.streamers:
            print(f"\n{username}:")
            vods = processor.vod_fetcher.get_channel_vods(username, limit=5)
            for v in vods:
                duration_ms = v.get('duration', 0)
                duration_min = duration_ms // 60000 if duration_ms else 0
                livestream_id = v.get('livestream_id', 'N/A')
                print(f"  - ID: {livestream_id}, Duration: {duration_min} min")
    else:
        # Process VODs
        all_results = []
        for username in args.streamers:
            try:
                results = processor.process_streamer_vods(username, limit=args.vods_per_streamer)
                all_results.extend(results)
            except Exception as e:
                print(f"[ERROR] Failed to process {username}: {e}")

        print(f"\n{'='*60}")
        print(f"COMPLETED: Processed {len(all_results)} VODs")
        print(f"{'='*60}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
SLOTFEED - Parallel OCR Worker
Each worker has its own PaddleOCR instance and processes streams independently
"""

import os
import sys
import json
import time
import signal
import asyncio
import argparse
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# Disable PaddleOCR verbose logging and model checks
os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'
os.environ['FLAGS_use_mkldnn'] = 'True'
os.environ['OMP_NUM_THREADS'] = '2'  # Limit threads per worker

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.workers.job_queue import (
    JobQueue, StreamJob, OCRResult, get_job_queue
)

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | Worker-%(name)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


class OCRWorker:
    """
    Independent OCR Worker process.
    Each worker has its own PaddleOCR instance for true parallelism.
    """

    def __init__(
        self,
        worker_id: int,
        redis_url: str = "redis://localhost:6379/0",
        data_dir: Optional[Path] = None
    ):
        self.worker_id = worker_id
        self.redis_url = redis_url
        self.running = False

        # Directories
        self.data_dir = data_dir or PROJECT_ROOT / "data"
        self.frames_dir = self.data_dir / "frames"
        self.streamers_dir = self.data_dir / "streamers"

        # Create directories
        self.frames_dir.mkdir(parents=True, exist_ok=True)

        # Components (lazy loaded)
        self.job_queue: Optional[JobQueue] = None
        self.ocr_engine = None
        self.scraper = None

        # Stats
        self.stats = {
            "started_at": None,
            "frames_processed": 0,
            "jobs_completed": 0,
            "jobs_failed": 0,
            "last_job_at": None,
        }

        # Logger with worker ID
        self.logger = logging.getLogger(str(worker_id))

        # Signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        self.logger.info(f"Received signal {signum}, shutting down...")
        self.running = False

    async def initialize(self) -> bool:
        """Initialize OCR engine and connections."""
        try:
            self.logger.info("Initializing worker...")

            # Connect to Redis
            self.job_queue = get_job_queue(self.redis_url)
            await self.job_queue.connect()

            # Initialize cloudscraper for API calls
            import cloudscraper
            self.scraper = cloudscraper.create_scraper()

            # Initialize PaddleOCR (this takes ~10-15 seconds)
            self.logger.info("Loading PaddleOCR engine...")
            from paddleocr import PaddleOCR
            self.ocr_engine = PaddleOCR(
                lang='en',
                show_log=False,
                use_angle_cls=False,  # Speed optimization
            )
            self.logger.info("PaddleOCR ready!")

            self.stats["started_at"] = datetime.utcnow().isoformat()
            return True

        except Exception as e:
            self.logger.error(f"Initialization failed: {e}")
            return False

    def get_playback_url(self, username: str) -> Optional[str]:
        """Get stream playback URL from Kick API."""
        try:
            # Check cached URL first
            streamer_file = self.streamers_dir / f"{username}.json"
            if streamer_file.exists():
                with open(streamer_file, 'r') as f:
                    data = json.load(f)
                    cached_url = data.get('playback_url')
                    if cached_url:
                        return cached_url

            # Fetch fresh from API
            api_url = f"https://kick.com/api/v2/channels/{username}"
            response = self.scraper.get(api_url, timeout=15)

            if response.status_code == 200:
                data = response.json()
                playback_url = data.get('playback_url')

                # Cache the response
                with open(streamer_file, 'w') as f:
                    json.dump(data, f, indent=2)

                return playback_url

            return None

        except Exception as e:
            self.logger.debug(f"Error getting playback URL for {username}: {e}")
            return None

    def capture_frame(self, stream_url: str, username: str) -> Optional[str]:
        """Capture a single frame from stream."""
        import cv2

        try:
            cap = cv2.VideoCapture(stream_url, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 10000)
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)

            if not cap.isOpened():
                return None

            # Skip frames to get current
            for _ in range(3):
                cap.grab()

            ret, frame = cap.read()
            cap.release()

            if not ret or frame is None:
                return None

            # Resize to 720p
            if frame.shape[1] != 1280 or frame.shape[0] != 720:
                frame = cv2.resize(frame, (1280, 720))

            # Crop out right side (chat area) - keep only left 80%
            # This removes chat messages that can confuse OCR
            frame = frame[:, :1024]  # Keep x=0 to x=1024

            # Save frame
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{username}_{timestamp}_w{self.worker_id}.jpg"
            filepath = self.frames_dir / filename

            cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            return str(filepath)

        except Exception as e:
            self.logger.debug(f"Frame capture error: {e}")
            return None

    def process_frame(self, image_path: str) -> Dict[str, Any]:
        """Run OCR on captured frame."""
        import cv2
        import re

        try:
            # Run OCR
            result = self.ocr_engine.ocr(image_path, cls=False)

            if not result or not result[0]:
                return {"balance": None, "confidence": 0, "raw_text": []}

            # Extract text and confidence
            all_text = []
            all_numbers = []

            for line in result[0]:
                if len(line) >= 2:
                    text = line[1][0] if isinstance(line[1], tuple) else str(line[1])
                    confidence = line[1][1] if isinstance(line[1], tuple) else 0.9
                    all_text.append(text)

                    # Extract monetary values
                    patterns = [r'[\$€][\d,]+\.?\d*', r'[\d,]+\.\d{2}']
                    for pattern in patterns:
                        matches = re.findall(pattern, text)
                        for match in matches:
                            clean = match.replace('$', '').replace('€', '').replace(',', '')
                            try:
                                value = float(clean)
                                if 10 < value < 50_000_000:
                                    all_numbers.append(value)
                            except:
                                pass

            # Find balance (look for BALANCE/CREDIT labels)
            balance = None

            # Labels that indicate overlay/static text (not actual balance)
            overlay_labels = ['START', 'BREAK EVEN', 'AVERAGE', 'BIGGEST', 'SUPER', 'BONUS HUNT']

            # First try: Find "BALANCE $X" pattern in same line (most accurate)
            for text in all_text:
                text_upper = text.upper()
                # Skip overlay lines
                if any(label in text_upper for label in overlay_labels):
                    continue
                # Look for BALANCE/CREDIT followed by amount in same line
                if any(label in text_upper for label in ['BALANCE', 'CREDIT', 'SALDO']):
                    match = re.search(r'[\$€][\d,]+\.?\d*', text)
                    if match:
                        clean = match.group().replace('$', '').replace('€', '').replace(',', '')
                        try:
                            val = float(clean)
                            if 10 < val < 50_000_000:
                                balance = val
                                break
                        except:
                            pass

            # Second try: Look for label on one line, amount on next
            if not balance:
                for i, text in enumerate(all_text):
                    text_upper = text.upper()
                    # Skip overlay lines
                    if any(label in text_upper for label in overlay_labels):
                        continue
                    if any(label in text_upper for label in ['BALANCE', 'CREDIT', 'SALDO']):
                        # Check next line for amount
                        if i + 1 < len(all_text):
                            match = re.search(r'[\$€][\d,]+\.?\d*', all_text[i + 1])
                            if match:
                                clean = match.group().replace('$', '').replace('€', '').replace(',', '')
                                try:
                                    val = float(clean)
                                    if 10 < val < 50_000_000:
                                        balance = val
                                        break
                                except:
                                    pass

            # Fallback: filter out overlay numbers and use largest remaining
            if not balance and all_numbers:
                # Build list of numbers to exclude (from overlay lines)
                excluded_numbers = set()
                for i, text in enumerate(all_text):
                    text_upper = text.upper()
                    if any(label in text_upper for label in overlay_labels):
                        # Extract numbers from this overlay line
                        for pattern in [r'[\$€][\d,]+\.?\d*', r'[\d,]+\.\d{2}']:
                            matches = re.findall(pattern, text)
                            for match in matches:
                                clean = match.replace('$', '').replace('€', '').replace(',', '')
                                try:
                                    excluded_numbers.add(float(clean))
                                except:
                                    pass

                # Filter out excluded numbers
                filtered_numbers = [n for n in all_numbers if n not in excluded_numbers]
                if filtered_numbers:
                    balance = max(filtered_numbers)

            # Find bet
            bet = None
            for i, text in enumerate(all_text):
                if 'BET' in text.upper():
                    for j in range(i, min(i + 2, len(all_text))):
                        match = re.search(r'[\$€][\d,]+\.?\d*', all_text[j])
                        if match:
                            clean = match.group().replace('$', '').replace('€', '').replace(',', '')
                            try:
                                val = float(clean)
                                if val < 10000:
                                    bet = val
                                    break
                            except:
                                pass
                    if bet:
                        break

            # Find win
            win = None
            for i, text in enumerate(all_text):
                if 'WIN' in text.upper() and 'TWIN' not in text.upper():
                    for j in range(i, min(i + 2, len(all_text))):
                        match = re.search(r'[\$€][\d,]+\.?\d*', all_text[j])
                        if match:
                            clean = match.group().replace('$', '').replace('€', '').replace(',', '')
                            try:
                                win = float(clean)
                                break
                            except:
                                pass
                    if win:
                        break

            # Detect bonus mode
            is_bonus = any(
                kw in ' '.join(all_text).upper()
                for kw in ['FREE SPIN', 'BONUS', 'MEGA WIN', 'JACKPOT']
            )

            # Calculate average confidence
            avg_conf = sum(
                line[1][1] if isinstance(line[1], tuple) else 0.9
                for line in result[0]
            ) / len(result[0]) if result[0] else 0

            return {
                "balance": balance,
                "bet": bet,
                "win": win,
                "confidence": avg_conf,
                "is_bonus_mode": is_bonus,
                "raw_text": all_text[:20],  # Limit for storage
            }

        except Exception as e:
            self.logger.error(f"OCR processing error: {e}")
            return {"balance": None, "confidence": 0, "raw_text": [], "error": str(e)}

    async def process_job(self, job: StreamJob) -> Optional[OCRResult]:
        """Process a single stream job."""
        self.logger.info(f"Processing job: {job.username}")

        try:
            # Get playback URL (use provided or fetch)
            playback_url = job.playback_url
            if not playback_url:
                playback_url = self.get_playback_url(job.username)

            if not playback_url:
                raise Exception("No playback URL available")

            # Capture frame
            frame_path = self.capture_frame(playback_url, job.username)
            if not frame_path:
                raise Exception("Frame capture failed")

            # Run OCR
            ocr_data = self.process_frame(frame_path)

            self.stats["frames_processed"] += 1

            # Create result
            result = OCRResult(
                job_id=job.job_id,
                username=job.username,
                session_id=job.session_id,
                worker_id=self.worker_id,
                balance=ocr_data.get("balance"),
                bet=ocr_data.get("bet"),
                win=ocr_data.get("win"),
                confidence=ocr_data.get("confidence", 0),
                is_bonus_mode=ocr_data.get("is_bonus_mode", False),
                raw_text=ocr_data.get("raw_text", []),
            )

            if result.balance:
                self.logger.info(f"{job.username}: Balance ${result.balance:,.2f} (conf={result.confidence:.2f})")
            else:
                self.logger.debug(f"{job.username}: No balance detected")

            # Clean up frame file (optional - uncomment to save disk space)
            # os.remove(frame_path)

            return result

        except Exception as e:
            self.logger.error(f"Job processing error for {job.username}: {e}")
            return OCRResult(
                job_id=job.job_id,
                username=job.username,
                session_id=job.session_id,
                worker_id=self.worker_id,
                balance=None,
                bet=None,
                win=None,
                confidence=0,
                is_bonus_mode=False,
                raw_text=[],
                error=str(e),
            )

    async def run(self):
        """Main worker loop."""
        self.logger.info("=" * 60)
        self.logger.info(f"SLOTFEED OCR Worker {self.worker_id} Starting")
        self.logger.info("=" * 60)

        if not await self.initialize():
            self.logger.error("Failed to initialize, exiting")
            return

        self.running = True
        heartbeat_interval = 10  # seconds

        last_heartbeat = time.time()

        try:
            while self.running:
                # Send heartbeat periodically
                if time.time() - last_heartbeat > heartbeat_interval:
                    await self.job_queue.worker_heartbeat(self.worker_id)
                    last_heartbeat = time.time()

                # Get next job
                job = await self.job_queue.get_job(timeout=5)

                if not job:
                    continue

                # Process job
                result = await self.process_job(job)

                if result:
                    if result.error:
                        # Don't publish error results (would overwrite good data)
                        await self.job_queue.fail_job(job, result.error)
                        self.stats["jobs_failed"] += 1
                    elif result.balance is not None:
                        # Validate balance change - reject only unrealistic drops
                        should_publish = True
                        prev_balance = await self.job_queue.get_last_balance(job.username)

                        if prev_balance is not None and prev_balance > 0:
                            change_ratio = result.balance / prev_balance
                            # Only reject extreme drops (>95% loss in one reading is likely OCR error)
                            # Allow all increases - big wins happen in slots!
                            if change_ratio < 0.05:
                                self.logger.warning(
                                    f"{job.username}: Rejected bad reading ${result.balance:,.2f} "
                                    f"(prev: ${prev_balance:,.2f}, change: {change_ratio:.2f}x)"
                                )
                                should_publish = False

                        if should_publish:
                            await self.job_queue.publish_result(result)
                            self.stats["jobs_completed"] += 1

                        await self.job_queue.complete_job(job)
                    else:
                        # No balance detected - don't overwrite Redis, just complete job
                        await self.job_queue.complete_job(job)
                        self.stats["jobs_completed"] += 1

                self.stats["last_job_at"] = datetime.utcnow().isoformat()

        except Exception as e:
            self.logger.error(f"Worker error: {e}")
        finally:
            self.running = False
            if self.job_queue:
                await self.job_queue.close()
            self.logger.info(f"Worker {self.worker_id} stopped")
            self.logger.info(f"Stats: {json.dumps(self.stats, indent=2)}")


async def main():
    parser = argparse.ArgumentParser(description="SLOTFEED OCR Worker")
    parser.add_argument(
        "--worker-id", "-w",
        type=int,
        default=1,
        help="Worker ID (1-6)"
    )
    parser.add_argument(
        "--redis-url",
        type=str,
        default="redis://localhost:6379/0",
        help="Redis connection URL"
    )

    args = parser.parse_args()

    worker = OCRWorker(
        worker_id=args.worker_id,
        redis_url=args.redis_url,
    )

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())

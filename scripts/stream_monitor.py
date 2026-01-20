#!/usr/bin/env python3
"""
SLOTFEED - Continuous Stream Monitor
Captures frames from live streams and extracts balance/bet/win data using OCR.
"""

import sys
import os
import time
import json
import subprocess
import asyncio
import signal
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict

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
class BalanceEvent:
    """Represents a captured balance event."""
    timestamp: str
    streamer: str
    balance: Optional[float]
    bet: Optional[float]
    win: Optional[float]
    multiplier: Optional[float]
    raw_values: Dict[str, Any]
    frame_path: Optional[str]


class StreamMonitor:
    """
    Monitors a live stream and extracts slot data using OCR.
    """

    def __init__(
        self,
        username: str,
        output_dir: Path,
        interval: float = 5.0,
        db_path: Optional[Path] = None,
    ):
        self.username = username
        self.output_dir = output_dir
        self.interval = interval
        self.db_path = db_path or output_dir / "balance_events.db"

        self.scraper = cloudscraper.create_scraper()
        self.ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        self.ocr_engine = None
        self.running = False
        self.frame_count = 0
        self.events: List[BalanceEvent] = []

        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Initialize database
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database for storing events."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS balance_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                streamer TEXT NOT NULL,
                balance REAL,
                bet REAL,
                win REAL,
                multiplier REAL,
                raw_values TEXT,
                frame_path TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_streamer_timestamp
            ON balance_events(streamer, timestamp)
        ''')

        conn.commit()
        conn.close()
        print(f"Database initialized: {self.db_path}")

    def _save_event(self, event: BalanceEvent):
        """Save event to database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO balance_events
            (timestamp, streamer, balance, bet, win, multiplier, raw_values, frame_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            event.timestamp,
            event.streamer,
            event.balance,
            event.bet,
            event.win,
            event.multiplier,
            json.dumps(event.raw_values),
            event.frame_path,
        ))

        conn.commit()
        conn.close()

    def _init_ocr(self):
        """Initialize OCR engine."""
        if self.ocr_engine is None:
            from ocr.engine.ocr_engine import OCREngine
            self.ocr_engine = OCREngine()
            print("OCR engine initialized")

    def get_stream_url(self) -> Optional[str]:
        """Get stream URL from Kick API."""
        try:
            resp = self.scraper.get(
                f"https://kick.com/api/v2/channels/{self.username}"
            )
            if resp.status_code != 200:
                return None

            data = resp.json()
            if not data.get("livestream"):
                return None

            return data.get("playback_url")
        except Exception as e:
            print(f"Error getting stream URL: {e}")
            return None

    def capture_frame(self, stream_url: str) -> Optional[Path]:
        """Capture a frame from the stream."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        frame_path = self.output_dir / f"frame_{self.username}_{timestamp}.jpg"

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
        except Exception as e:
            print(f"Frame capture error: {e}")
            return None

    def extract_values(self, frame_path: Path) -> Dict[str, Any]:
        """Extract balance/bet/win values from frame using OCR."""
        self._init_ocr()

        image = Image.open(frame_path)
        frame = np.array(image)

        results = self.ocr_engine.process_image(frame)

        # Extract all numeric values
        values = {
            "all_numbers": [],
            "currencies": [],
            "multipliers": [],
            "texts": [],
        }

        for r in results:
            text = r.raw_text

            # Store all text
            values["texts"].append({
                "text": text,
                "confidence": r.confidence,
                "bbox": r.bbox,
            })

            # Look for currency values ($ followed by numbers)
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

            # Look for multipliers (Nx or N.Nx)
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

            # Look for plain numbers
            num_matches = re.findall(r'[\d,]+\.?\d+', text)
            for match in num_matches:
                try:
                    value = float(match.replace(',', ''))
                    if value > 0:
                        values["all_numbers"].append({
                            "value": value,
                            "confidence": r.confidence,
                        })
                except:
                    pass

        return values

    def analyze_values(self, values: Dict[str, Any]) -> BalanceEvent:
        """Analyze extracted values and identify balance/bet/win."""
        timestamp = datetime.now().isoformat()

        # Sort currencies by value
        currencies = sorted(
            values.get("currencies", []),
            key=lambda x: x["value"],
            reverse=True
        )

        # Heuristics for identifying values:
        # - Balance is usually the largest value (except huge wins)
        # - Bet is usually a round number (10, 20, 50, 100, etc.)
        # - Win can be 0 or any positive number

        balance = None
        bet = None
        win = None
        multiplier = None

        # Get largest multiplier
        multipliers = values.get("multipliers", [])
        if multipliers:
            max_mult = max(multipliers, key=lambda x: x["value"])
            multiplier = max_mult["value"]

        # Identify balance (likely the largest reasonable value)
        for curr in currencies:
            val = curr["value"]
            # Balance is typically between $100 and $10,000,000
            if 100 <= val <= 10_000_000 and curr["confidence"] > 0.8:
                if balance is None or val > balance:
                    balance = val
                break

        # Look for common bet values
        common_bets = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
        for curr in currencies:
            val = curr["value"]
            if val in common_bets or (val % 10 == 0 and val <= 1000):
                bet = val
                break

        # Win might be mentioned with specific keywords
        for text_item in values.get("texts", []):
            text_lower = text_item["text"].lower()
            if "win" in text_lower:
                # Extract number near "win"
                nums = re.findall(r'[\d,]+\.?\d*', text_item["text"])
                for num in nums:
                    try:
                        win = float(num.replace(',', ''))
                        break
                    except:
                        pass

        return BalanceEvent(
            timestamp=timestamp,
            streamer=self.username,
            balance=balance,
            bet=bet,
            win=win,
            multiplier=multiplier,
            raw_values={
                "currencies": currencies[:10],
                "multipliers": multipliers[:5],
            },
            frame_path=None,
        )

    def process_frame(self, stream_url: str) -> Optional[BalanceEvent]:
        """Capture and process a single frame."""
        # Capture frame
        frame_path = self.capture_frame(stream_url)
        if not frame_path:
            return None

        self.frame_count += 1

        # Extract values
        values = self.extract_values(frame_path)

        # Analyze and create event
        event = self.analyze_values(values)
        event.frame_path = str(frame_path)

        # Save to database
        self._save_event(event)
        self.events.append(event)

        return event

    def run(self, duration: Optional[int] = None):
        """
        Run the monitor continuously.

        Args:
            duration: Optional duration in seconds. None = run forever.
        """
        print(f"\n{'='*60}")
        print(f"SLOTFEED Stream Monitor")
        print(f"{'='*60}")
        print(f"Streamer: {self.username}")
        print(f"Interval: {self.interval}s")
        print(f"Output: {self.output_dir}")
        print(f"Database: {self.db_path}")
        print(f"{'='*60}\n")

        self.running = True
        start_time = time.time()

        # Handle Ctrl+C
        def signal_handler(sig, frame):
            print("\n\nStopping monitor...")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)

        while self.running:
            # Check duration
            if duration and (time.time() - start_time) >= duration:
                print(f"\nDuration ({duration}s) reached. Stopping.")
                break

            # Get stream URL
            stream_url = self.get_stream_url()
            if not stream_url:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Stream offline. Waiting...")
                time.sleep(30)
                continue

            # Process frame
            try:
                event = self.process_frame(stream_url)
                if event:
                    # Print status
                    balance_str = f"${event.balance:,.2f}" if event.balance else "?"
                    mult_str = f"{event.multiplier:.1f}x" if event.multiplier else "-"

                    print(
                        f"[{datetime.now().strftime('%H:%M:%S')}] "
                        f"Frame #{self.frame_count} | "
                        f"Balance: {balance_str} | "
                        f"Mult: {mult_str}"
                    )

                    # Clean up old frames (keep last 10)
                    self._cleanup_frames()

            except Exception as e:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {e}")

            # Wait for next interval
            time.sleep(self.interval)

        # Print summary
        self._print_summary()

    def _cleanup_frames(self, keep_last: int = 10):
        """Remove old frame files."""
        frames = sorted(self.output_dir.glob(f"frame_{self.username}_*.jpg"))
        for frame in frames[:-keep_last]:
            try:
                frame.unlink()
            except:
                pass

    def _print_summary(self):
        """Print monitoring summary."""
        print(f"\n{'='*60}")
        print("MONITORING SUMMARY")
        print(f"{'='*60}")
        print(f"Streamer: {self.username}")
        print(f"Frames captured: {self.frame_count}")
        print(f"Events recorded: {len(self.events)}")

        if self.events:
            balances = [e.balance for e in self.events if e.balance]
            if balances:
                print(f"Balance range: ${min(balances):,.2f} - ${max(balances):,.2f}")

            multipliers = [e.multiplier for e in self.events if e.multiplier]
            if multipliers:
                print(f"Max multiplier: {max(multipliers):.1f}x")

        print(f"Database: {self.db_path}")
        print(f"{'='*60}\n")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="SLOTFEED Stream Monitor")
    parser.add_argument("username", help="Kick username to monitor")
    parser.add_argument("-i", "--interval", type=float, default=5.0,
                        help="Capture interval in seconds (default: 5)")
    parser.add_argument("-d", "--duration", type=int, default=None,
                        help="Duration in seconds (default: run forever)")
    parser.add_argument("-o", "--output", type=str, default=None,
                        help="Output directory")

    args = parser.parse_args()

    # Set output directory
    if args.output:
        output_dir = Path(args.output)
    else:
        output_dir = project_root / "data" / "captures" / args.username

    # Create and run monitor
    monitor = StreamMonitor(
        username=args.username,
        output_dir=output_dir,
        interval=args.interval,
    )

    monitor.run(duration=args.duration)


if __name__ == "__main__":
    main()

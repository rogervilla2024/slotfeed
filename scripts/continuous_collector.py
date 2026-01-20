#!/usr/bin/env python3
"""
SLOTFEED - Continuous Data Collector
Runs all day, collecting data every 30 seconds
"""

import os
import sys
import json
import time
import signal
from datetime import datetime
from typing import Dict, Any, List, Optional

import cloudscraper

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from database.seeds.tier1_streamers import TIER1_STREAMERS

# Configuration
FETCH_INTERVAL = 30  # seconds between fetches
DATA_DIR = os.path.join(project_root, "data")
STREAMERS_DIR = os.path.join(DATA_DIR, "streamers")
SNAPSHOTS_DIR = os.path.join(DATA_DIR, "snapshots")
LOG_FILE = os.path.join(DATA_DIR, "collector.log")

# Ensure directories exist
os.makedirs(STREAMERS_DIR, exist_ok=True)
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

# Global flag for graceful shutdown
running = True


def signal_handler(signum, frame):
    global running
    print("\n[STOP] Graceful shutdown initiated...")
    running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def log(message: str):
    """Log message to console and file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] {message}"
    print(log_line)

    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_line + "\n")
    except:
        pass


class DataCollector:
    """Continuous data collector for Kick streamers."""

    BASE_URL = "https://kick.com/api/v2"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.stats = {
            "total_fetches": 0,
            "successful_fetches": 0,
            "failed_fetches": 0,
            "live_detected": 0,
            "started_at": datetime.now().isoformat(),
        }

    def fetch(self, endpoint: str) -> Optional[Dict[str, Any]]:
        """Fetch data from Kick API."""
        url = f"{self.BASE_URL}{endpoint}"
        self.stats["total_fetches"] += 1

        try:
            resp = self.scraper.get(url, timeout=30)
            if resp.status_code == 200:
                self.stats["successful_fetches"] += 1
                return resp.json()
            else:
                self.stats["failed_fetches"] += 1
                log(f"[WARN] {endpoint} returned {resp.status_code}")
                return None
        except Exception as e:
            self.stats["failed_fetches"] += 1
            log(f"[ERROR] {endpoint}: {e}")
            return None

    def collect_round(self) -> Dict:
        """Run one collection round."""
        timestamp = datetime.now()
        timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")

        kick_streamers = [s for s in TIER1_STREAMERS if s.get("platform") == "kick"]

        round_data = {
            "timestamp": timestamp.isoformat(),
            "streamers": [],
            "live_count": 0,
            "total_viewers": 0,
        }

        for streamer in kick_streamers:
            username = streamer["username"]
            data = self.fetch(f"/channels/{username}")

            if data:
                # Save individual streamer file (always update)
                filepath = os.path.join(STREAMERS_DIR, f"{username}.json")
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False, default=str)

                # Track for round summary
                is_live = data.get("livestream") is not None
                viewer_count = 0

                if is_live:
                    viewer_count = data["livestream"].get("viewer_count", 0)
                    round_data["live_count"] += 1
                    round_data["total_viewers"] += viewer_count
                    self.stats["live_detected"] += 1

                round_data["streamers"].append({
                    "username": username,
                    "is_live": is_live,
                    "viewers": viewer_count,
                    "followers": data.get("followers_count", 0),
                    "title": data.get("livestream", {}).get("session_title", "") if is_live else "",
                })

            # Small delay between requests
            time.sleep(0.5)

        # Save snapshot
        snapshot_path = os.path.join(SNAPSHOTS_DIR, f"snapshot_{timestamp_str}.json")
        with open(snapshot_path, 'w', encoding='utf-8') as f:
            json.dump(round_data, f, indent=2, ensure_ascii=False)

        return round_data

    def run(self):
        """Run continuous collection."""
        log("=" * 60)
        log("SLOTFEED Continuous Data Collector Started")
        log(f"Interval: {FETCH_INTERVAL} seconds")
        log(f"Data Dir: {DATA_DIR}")
        log("=" * 60)

        round_num = 0

        while running:
            round_num += 1
            log(f"\n--- Round {round_num} ---")

            try:
                start_time = time.time()
                round_data = self.collect_round()
                elapsed = time.time() - start_time

                live_list = [s["username"] for s in round_data["streamers"] if s["is_live"]]

                log(f"Live: {round_data['live_count']} streamers, {round_data['total_viewers']:,} total viewers")
                if live_list:
                    log(f"Live now: {', '.join(live_list)}")
                log(f"Round completed in {elapsed:.1f}s")

            except Exception as e:
                log(f"[ERROR] Round failed: {e}")

            # Wait for next round
            if running:
                log(f"Next fetch in {FETCH_INTERVAL} seconds...")

                # Interruptible sleep
                for _ in range(FETCH_INTERVAL):
                    if not running:
                        break
                    time.sleep(1)

        # Final stats
        log("\n" + "=" * 60)
        log("COLLECTOR STOPPED")
        log(f"Total Fetches: {self.stats['total_fetches']}")
        log(f"Successful: {self.stats['successful_fetches']}")
        log(f"Failed: {self.stats['failed_fetches']}")
        log(f"Live Detections: {self.stats['live_detected']}")
        log("=" * 60)


def main():
    collector = DataCollector()
    collector.run()


if __name__ == "__main__":
    main()

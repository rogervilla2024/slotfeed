Watch Live - Set Alert - View On Kick çalışmıyor butonlar#!/usr/bin/env python3
"""
SLOTFEED - Data Fetcher & Saver
Fetches streamer data from Kick API and saves to data/ directory
"""

import os
import sys
import jsonClient ID  q33h39chqjk31oi75t63qw3z64gvb5    Client Secret  2xbuartrdlrtrfyph5wfivqnb1vv6h
from datetime import datetime
from typing import Dict, Any, List, Optional

import cloudscraper

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from database.seeds.tier1_streamers import TIER1_STREAMERS

# Data output directory
DATA_DIR = os.path.join(project_root, "data")
STREAMERS_DIR = os.path.join(DATA_DIR, "streamers")
LIVE_DIR = os.path.join(DATA_DIR, "live")
GAMBLING_DIR = os.path.join(DATA_DIR, "gambling_streams")

# Ensure directories exist
os.makedirs(STREAMERS_DIR, exist_ok=True)
os.makedirs(LIVE_DIR, exist_ok=True)
os.makedirs(GAMBLING_DIR, exist_ok=True)


class KickDataFetcher:
    """Fetches data from Kick API and saves to disk."""

    BASE_URL = "https://kick.com/api/v2"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.fetched_urls: List[str] = []
        self.saved_files: List[str] = []

    def fetch(self, endpoint: str) -> Optional[Dict[str, Any]]:
        """Fetch data from an endpoint."""
        url = f"{self.BASE_URL}{endpoint}"
        self.fetched_urls.append(url)
        print(f"  [FETCH] {url}")

        try:
            resp = self.scraper.get(url, timeout=30)
            if resp.status_code == 200:
                print(f"  [OK] Status: {resp.status_code}, Size: {len(resp.content)} bytes")
                return resp.json()
            else:
                print(f"  [FAIL] Status: {resp.status_code}")
                return None
        except Exception as e:
            print(f"  [ERROR] {e}")
            return None

    def save_json(self, data: Any, filepath: str) -> bool:
        """Save data as JSON file."""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            self.saved_files.append(filepath)
            print(f"  [SAVED] {filepath}")
            return True
        except Exception as e:
            print(f"  [SAVE ERROR] {e}")
            return False

    def fetch_streamer(self, username: str) -> Optional[Dict]:
        """Fetch single streamer data."""
        return self.fetch(f"/channels/{username}")

    def fetch_gambling_streams(self) -> Optional[Dict]:
        """Fetch gambling category live streams."""
        return self.fetch("/categories/gambling/livestreams")

    def fetch_slots_streams(self) -> Optional[Dict]:
        """Fetch slots category live streams."""
        return self.fetch("/categories/slots/livestreams")


def main():
    """Main data fetching routine."""
    print("=" * 70)
    print("SLOTFEED - Data Fetcher")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 70)
    print()

    fetcher = KickDataFetcher()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # === FETCH STREAMER DATA ===
    print("[1/3] FETCHING STREAMER DATA")
    print("-" * 70)

    kick_streamers = [s for s in TIER1_STREAMERS if s.get("platform") == "kick"]
    all_streamers_data = []
    live_streamers = []

    for i, streamer in enumerate(kick_streamers, 1):
        username = streamer["username"]
        print(f"\n[{i}/{len(kick_streamers)}] {username}")

        data = fetcher.fetch_streamer(username)
        if data:
            # Save individual streamer file
            filepath = os.path.join(STREAMERS_DIR, f"{username}.json")
            fetcher.save_json(data, filepath)

            # Track live status
            if data.get("livestream"):
                live_streamers.append({
                    "username": username,
                    "viewers": data["livestream"].get("viewer_count", 0),
                    "title": data["livestream"].get("session_title", ""),
                    "started_at": data["livestream"].get("created_at", ""),
                })

            all_streamers_data.append({
                "username": username,
                "display_name": data.get("user", {}).get("username", username),
                "followers": data.get("followersCount", 0),
                "is_live": data.get("livestream") is not None,
                "fetched_at": datetime.now().isoformat(),
            })

    # Save combined streamers summary
    summary_path = os.path.join(DATA_DIR, f"streamers_summary_{timestamp}.json")
    fetcher.save_json({
        "fetched_at": datetime.now().isoformat(),
        "total_streamers": len(all_streamers_data),
        "live_count": len(live_streamers),
        "streamers": all_streamers_data
    }, summary_path)

    # === FETCH GAMBLING CATEGORY ===
    print()
    print("[2/3] FETCHING GAMBLING CATEGORY STREAMS")
    print("-" * 70)

    gambling_data = fetcher.fetch_gambling_streams()
    if gambling_data:
        gambling_path = os.path.join(GAMBLING_DIR, f"gambling_streams_{timestamp}.json")
        fetcher.save_json(gambling_data, gambling_path)

        streams = gambling_data.get("data", [])
        print(f"\n  Found {len(streams)} gambling streams")

        # Show top 10
        streams_sorted = sorted(streams, key=lambda x: x.get("viewer_count", 0), reverse=True)
        print("\n  TOP 10 GAMBLING STREAMS:")
        for i, stream in enumerate(streams_sorted[:10], 1):
            channel = stream.get("channel", {})
            username = channel.get("slug", "unknown")
            viewers = stream.get("viewer_count", 0)
            print(f"    {i:2}. {username:<20} {viewers:>8,} viewers")

    # === FETCH SLOTS CATEGORY ===
    print()
    print("[3/3] FETCHING SLOTS CATEGORY STREAMS")
    print("-" * 70)

    slots_data = fetcher.fetch_slots_streams()
    if slots_data:
        slots_path = os.path.join(GAMBLING_DIR, f"slots_streams_{timestamp}.json")
        fetcher.save_json(slots_data, slots_path)

        streams = slots_data.get("data", [])
        print(f"\n  Found {len(streams)} slots streams")

    # === SAVE LIVE STREAMERS ===
    if live_streamers:
        live_path = os.path.join(LIVE_DIR, f"live_now_{timestamp}.json")
        fetcher.save_json({
            "timestamp": datetime.now().isoformat(),
            "live_streamers": live_streamers
        }, live_path)

    # === SUMMARY ===
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print()
    print(f"URLs Fetched: {len(fetcher.fetched_urls)}")
    print(f"Files Saved: {len(fetcher.saved_files)}")
    print()

    print("FETCHED URLs:")
    for url in fetcher.fetched_urls:
        print(f"  - {url}")

    print()
    print("SAVED FILES:")
    for filepath in fetcher.saved_files:
        size = os.path.getsize(filepath)
        print(f"  - {filepath} ({size:,} bytes)")

    print()
    if live_streamers:
        print("LIVE STREAMERS RIGHT NOW:")
        for s in sorted(live_streamers, key=lambda x: x["viewers"], reverse=True):
            print(f"  - {s['username']}: {s['viewers']:,} viewers")
            print(f"    https://kick.com/{s['username']}")
    else:
        print("No tracked streamers are currently live.")

    print()
    print(f"Data saved to: {DATA_DIR}")
    print("=" * 70)

    return fetcher.fetched_urls, fetcher.saved_files


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Live Stream Checker - Check which streamers are currently live on Kick
Uses cloudscraper to bypass Cloudflare protection
"""

import asyncio
import sys
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict, Any, List

import cloudscraper

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from database.seeds.tier1_streamers import TIER1_STREAMERS
from database.seeds.tier2_streamers import TIER2_STREAMERS


class KickAPI:
    """Kick API client using cloudscraper to bypass Cloudflare."""

    BASE_URL = "https://kick.com/api/v2"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()

    def get_channel(self, username: str) -> Optional[Dict[str, Any]]:
        """Get channel info by username."""
        try:
            resp = self.scraper.get(f"{self.BASE_URL}/channels/{username}")
            if resp.status_code == 200:
                return resp.json()
            return None
        except Exception as e:
            print(f"Error fetching {username}: {e}")
            return None


def check_streamer(api: KickAPI, streamer: Dict) -> Dict[str, Any]:
    """Check if a single streamer is live."""
    username = streamer["username"]
    result = {
        "username": username,
        "display_name": streamer.get("display_name", username),
        "platform": streamer.get("platform", "kick"),
        "is_live": False,
        "viewers": 0,
        "title": "",
        "error": None,
    }

    if streamer.get("platform") != "kick":
        result["error"] = "Not Kick platform"
        return result

    try:
        data = api.get_channel(username)
        if data:
            livestream = data.get("livestream")
            result["is_live"] = livestream is not None
            if livestream:
                result["viewers"] = livestream.get("viewer_count", 0)
                result["title"] = livestream.get("session_title", "")
                result["followers"] = data.get("followersCount", 0)
        else:
            result["error"] = "Channel not found"
    except Exception as e:
        result["error"] = str(e)

    return result


def check_all_streamers():
    """Check all streamers' live status."""
    print("=" * 70)
    print("SLOTFEED - Live Stream Checker")
    print("=" * 70)
    print()

    # Combine all streamers
    all_streamers = TIER1_STREAMERS + TIER2_STREAMERS
    kick_streamers = [s for s in all_streamers if s.get("platform") == "kick"]

    print(f"Total streamers: {len(all_streamers)}")
    print(f"Kick streamers to check: {len(kick_streamers)}")
    print()
    print("Checking live status...")
    print("-" * 70)

    api = KickAPI()
    live_streams = []
    offline_streams = []
    errors = []

    for i, streamer in enumerate(kick_streamers, 1):
        result = check_streamer(api, streamer)
        username = result["username"]

        if result["error"]:
            errors.append((username, result["error"]))
            status = f"[ERROR] {result['error']}"
        elif result["is_live"]:
            live_streams.append(result)
            status = f"[LIVE] ({result['viewers']:,} viewers)"
        else:
            offline_streams.append(username)
            status = "[OFF]"

        print(f"[{i:3}/{len(kick_streamers)}] {username:<20} {status}")

    # Summary
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print()

    if live_streams:
        print(f"*** LIVE STREAMS ({len(live_streams)}) ***")
        print("-" * 70)
        # Sort by viewers
        live_streams.sort(key=lambda x: x["viewers"], reverse=True)
        for stream in live_streams:
            # Clean title for Windows console
            title = stream['title'][:50] + "..." if len(stream['title']) > 50 else stream['title']
            title = title.encode('ascii', 'ignore').decode('ascii')
            print(f"  {stream['display_name']:<20} {stream['viewers']:>8,} viewers")
            print(f"    -> {title}")
        print()
    else:
        print("No streamers currently live.")
        print()

    print(f"Offline: {len(offline_streams)}")
    if errors:
        print(f"Errors: {len(errors)}")
        for username, error in errors:
            print(f"    {username}: {error}")

    print()
    print("=" * 70)

    return live_streams


def discover_gambling_streams():
    """Discover gambling/casino streams on Kick."""
    print()
    print("=" * 70)
    print("DISCOVERING GAMBLING STREAMS ON KICK")
    print("=" * 70)
    print()

    api = KickAPI()

    # Try to get streams from gambling/slots category
    try:
        resp = api.scraper.get(f"{api.BASE_URL}/categories/gambling/livestreams")
        if resp.status_code == 200:
            data = resp.json()
            streams = data.get("data", [])

            print(f"Found {len(streams)} gambling streams")
            print("-" * 70)

            # Sort by viewers
            streams.sort(key=lambda x: x.get("viewer_count", 0), reverse=True)

            for i, stream in enumerate(streams[:25], 1):
                channel = stream.get("channel", {})
                username = channel.get("slug", "unknown")
                viewers = stream.get("viewer_count", 0)
                title = stream.get("session_title", "N/A")[:40]
                title = title.encode('ascii', 'ignore').decode('ascii')
                print(f"{i:2}. {username:<20} {viewers:>8,} viewers")
                print(f"     {title}")

            print()

            # Return new streamers we're not tracking
            existing_usernames = set(s["username"] for s in TIER1_STREAMERS + TIER2_STREAMERS)
            new_streamers = []
            for stream in streams:
                username = stream.get("channel", {}).get("slug", "")
                if username and username not in existing_usernames:
                    new_streamers.append({
                        "username": username,
                        "viewers": stream.get("viewer_count", 0),
                        "followers": stream.get("channel", {}).get("followersCount", 0),
                    })

            if new_streamers:
                print(f"\n*** NEW STREAMERS TO ADD ({len(new_streamers)}) ***")
                print("-" * 70)
                for s in new_streamers[:20]:
                    print(f"  {s['username']:<20} {s['viewers']:>8,} viewers, {s['followers']:>8,} followers")

            return new_streamers
        else:
            print(f"Failed to get gambling streams: {resp.status_code}")
    except Exception as e:
        print(f"Error discovering streams: {e}")

    return []


def main():
    """Main entry point."""
    # Check our tracked streamers
    live_streams = check_all_streamers()

    # Discover more gambling streams
    new_streamers = discover_gambling_streams()

    # Summary
    print()
    print("=" * 70)
    print("RECOMMENDATIONS")
    print("=" * 70)
    if live_streams:
        print(f"\nBest stream to test OCR: {live_streams[0]['username']}")
        print(f"  URL: https://kick.com/{live_streams[0]['username']}")
        print(f"  Viewers: {live_streams[0]['viewers']:,}")


if __name__ == "__main__":
    main()

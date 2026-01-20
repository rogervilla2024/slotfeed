#!/usr/bin/env python3
"""
SLOTFEED - Real-time Data Updater
Fetches data from Kick API, saves to JSON, and broadcasts via WebSocket
"""

import os
import sys
import json
import asyncio
import websockets
from datetime import datetime
from typing import Dict, Any, List, Optional

import cloudscraper

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from database.seeds.tier1_streamers import TIER1_STREAMERS

# Configuration
DATA_DIR = os.path.join(project_root, "data", "streamers")
WEBSOCKET_URL = "ws://localhost:8000/api/v1/ws/live"
UPDATE_INTERVAL = 30  # seconds

os.makedirs(DATA_DIR, exist_ok=True)


class KickDataFetcher:
    """Fetches data from Kick API."""

    BASE_URL = "https://kick.com/api/v2"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()

    def fetch_channel(self, username: str) -> Optional[Dict[str, Any]]:
        """Fetch channel data."""
        try:
            resp = self.scraper.get(f"{self.BASE_URL}/channels/{username}", timeout=30)
            if resp.status_code == 200:
                return resp.json()
            return None
        except Exception as e:
            print(f"  [ERROR] {username}: {e}")
            return None


class RealtimeUpdater:
    """Real-time data updater with WebSocket broadcasting."""

    def __init__(self):
        self.fetcher = KickDataFetcher()
        self.previous_states: Dict[str, bool] = {}  # Track live status changes
        self.ws_connection = None

    def save_json(self, data: Dict, username: str) -> str:
        """Save data to JSON file."""
        filepath = os.path.join(DATA_DIR, f"{username}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        return filepath

    async def broadcast_update(self, event_type: str, data: Dict):
        """Broadcast update to WebSocket server."""
        if self.ws_connection:
            try:
                message = {
                    "type": event_type,
                    "data": data,
                    "timestamp": datetime.now().isoformat()
                }
                await self.ws_connection.send(json.dumps(message))
                print(f"  [WS] Broadcast: {event_type}")
            except Exception as e:
                print(f"  [WS ERROR] {e}")
                self.ws_connection = None

    async def connect_websocket(self):
        """Connect to WebSocket server."""
        try:
            self.ws_connection = await websockets.connect(WEBSOCKET_URL)
            print(f"[WS] Connected to {WEBSOCKET_URL}")
        except Exception as e:
            print(f"[WS] Could not connect: {e}")
            self.ws_connection = None

    async def update_streamer(self, streamer: Dict) -> Optional[Dict]:
        """Fetch and update single streamer data."""
        username = streamer["username"]
        data = self.fetcher.fetch_channel(username)

        if not data:
            return None

        # Save to JSON
        self.save_json(data, username)

        # Check for status changes
        was_live = self.previous_states.get(username, False)
        is_live = data.get("livestream") is not None

        if is_live != was_live:
            self.previous_states[username] = is_live

            if is_live:
                # Stream started
                await self.broadcast_update("stream_start", {
                    "username": username,
                    "display_name": data.get("user", {}).get("username", username),
                    "viewer_count": data["livestream"].get("viewer_count", 0),
                    "title": data["livestream"].get("session_title", ""),
                })
            else:
                # Stream ended
                await self.broadcast_update("stream_end", {
                    "username": username,
                })
        elif is_live:
            # Balance update (stream still live)
            await self.broadcast_update("balance_update", {
                "username": username,
                "viewer_count": data["livestream"].get("viewer_count", 0),
            })

        return data

    async def run_update_cycle(self):
        """Run a single update cycle for all streamers."""
        print(f"\n{'='*60}")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting update cycle...")
        print(f"{'='*60}")

        kick_streamers = [s for s in TIER1_STREAMERS if s.get("platform") == "kick"]
        live_count = 0
        updated_count = 0

        for streamer in kick_streamers:
            username = streamer["username"]
            data = await self.update_streamer(streamer)

            if data:
                updated_count += 1
                is_live = data.get("livestream") is not None
                if is_live:
                    live_count += 1
                    viewers = data["livestream"].get("viewer_count", 0)
                    print(f"  [LIVE] {username}: {viewers:,} viewers")
                else:
                    print(f"  [OFF] {username}")

            # Small delay between requests
            await asyncio.sleep(1)

        print(f"\n[SUMMARY] {updated_count} updated, {live_count} live")

        # Broadcast summary
        await self.broadcast_update("update_complete", {
            "updated_count": updated_count,
            "live_count": live_count,
            "timestamp": datetime.now().isoformat()
        })

    async def run(self):
        """Main run loop."""
        print("="*60)
        print("SLOTFEED - Real-time Updater")
        print(f"Update interval: {UPDATE_INTERVAL} seconds")
        print("="*60)

        # Try to connect to WebSocket
        await self.connect_websocket()

        while True:
            try:
                await self.run_update_cycle()
            except Exception as e:
                print(f"[ERROR] Update cycle failed: {e}")

            print(f"\n[WAIT] Next update in {UPDATE_INTERVAL} seconds...")
            await asyncio.sleep(UPDATE_INTERVAL)


async def main():
    """Main entry point."""
    updater = RealtimeUpdater()
    await updater.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[STOPPED] Real-time updater stopped.")

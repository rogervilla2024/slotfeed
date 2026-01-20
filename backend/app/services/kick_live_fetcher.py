"""
Kick Live Streamer Fetcher

Fetches real-time data from Kick API and stores it for the frontend.
"""

import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import httpx
import cloudscraper
import logging

logger = logging.getLogger(__name__)

# Data directory
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "streamers"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Tier 1 streamers to monitor
TIER1_USERNAMES = [
    "roshtein", "trainwreckstv", "classybeef", "xposed", "deuceace",
    "casinodaddy", "maherco", "fruityslots", "letsgiveitaspin",
    "jarttu84", "vondice", "westcol", "nickslots"
]


class KickLiveFetcher:
    """Fetches live stream data from Kick API."""

    BASE_URL = "https://kick.com/api/v2"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper()

    def fetch_channel(self, username: str) -> Optional[Dict[str, Any]]:
        """Fetch channel data from Kick API."""
        try:
            resp = self.scraper.get(
                f"{self.BASE_URL}/channels/{username}",
                timeout=15
            )
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"Failed to fetch {username}: {resp.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching {username}: {e}")
            return None

    def fetch_all_live_streamers(self) -> List[Dict[str, Any]]:
        """Fetch data for all tracked streamers."""
        live_streamers = []

        for username in TIER1_USERNAMES:
            data = self.fetch_channel(username)
            if data:
                # Save to file
                filepath = DATA_DIR / f"{username}.json"
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)

                # Check if live
                if data.get('livestream'):
                    live_streamers.append(data)
                    logger.info(f"{username}: LIVE ({data['livestream'].get('viewer_count', 0)} viewers)")
                else:
                    logger.info(f"{username}: offline")

        return live_streamers

    def fetch_gambling_category(self) -> List[Dict[str, Any]]:
        """Fetch all gambling streams."""
        try:
            # Try subcategory endpoint
            resp = self.scraper.get(
                f"{self.BASE_URL}/subcategory/slots/livestreams?page=1&limit=50",
                timeout=15
            )
            if resp.status_code == 200:
                data = resp.json()
                streams = data.get('data', [])
                logger.info(f"Found {len(streams)} gambling streams")
                return streams
        except Exception as e:
            logger.error(f"Error fetching gambling category: {e}")

        return []


# OCR Events storage (in-memory for now, will be DB later)
_ocr_events: List[Dict] = []
_balance_history: Dict[str, List[Dict]] = {}  # username -> list of balance events


def add_ocr_event(
    streamer: str,
    balance: float,
    bet: float,
    win: float,
    multiplier: Optional[float] = None,
    game: Optional[str] = None,
    screenshot_path: Optional[str] = None
):
    """Add an OCR event from the monitoring system."""
    global _ocr_events, _balance_history

    timestamp = datetime.now().isoformat()

    event = {
        "timestamp": timestamp,
        "streamer": streamer,
        "balance": balance,
        "bet": bet,
        "win": win,
        "multiplier": multiplier,
        "game": game,
        "screenshot_path": screenshot_path
    }

    _ocr_events.append(event)

    # Keep only last 1000 events
    if len(_ocr_events) > 1000:
        _ocr_events = _ocr_events[-1000:]

    # Update balance history
    if streamer not in _balance_history:
        _balance_history[streamer] = []

    _balance_history[streamer].append({
        "timestamp": timestamp,
        "balance": balance,
        "bet": bet,
        "win": win
    })

    # Keep only last 500 per streamer
    if len(_balance_history[streamer]) > 500:
        _balance_history[streamer] = _balance_history[streamer][-500:]

    logger.info(f"OCR Event: {streamer} - Balance: ${balance:,.2f}, Bet: ${bet:,.2f}, Win: ${win:,.2f}")

    return event


def get_streamer_live_data(username: str) -> Optional[Dict]:
    """Get combined live data for a streamer (Kick API + OCR)."""
    # Load cached Kick data
    filepath = DATA_DIR / f"{username}.json"
    if not filepath.exists():
        return None

    with open(filepath, 'r', encoding='utf-8') as f:
        kick_data = json.load(f)

    if not kick_data.get('livestream'):
        return None

    # Get OCR data
    balance_events = _balance_history.get(username, [])
    current_balance = balance_events[-1]['balance'] if balance_events else 0
    start_balance = balance_events[0]['balance'] if balance_events else 0

    # Calculate stats
    all_balances = [e['balance'] for e in balance_events]
    peak_balance = max(all_balances) if all_balances else 0
    lowest_balance = min(all_balances) if all_balances else 0
    total_wagered = sum(e.get('bet', 0) for e in balance_events)

    profit_loss = current_balance - start_balance if start_balance > 0 else 0
    profit_percentage = (profit_loss / start_balance * 100) if start_balance > 0 else 0

    return {
        "session": {
            "id": str(kick_data['livestream']['id']),
            "streamerId": username,
            "startTime": kick_data['livestream'].get('created_at'),
            "startBalance": start_balance,
            "currentBalance": current_balance,
            "peakBalance": peak_balance,
            "lowestBalance": lowest_balance,
            "totalWagered": total_wagered,
            "status": "live",
            "thumbnailUrl": kick_data['livestream'].get('thumbnail', {}).get('url') if isinstance(kick_data['livestream'].get('thumbnail'), dict) else kick_data['livestream'].get('thumbnail'),
        },
        "streamer": {
            "id": username,
            "username": username,
            "displayName": kick_data.get('user', {}).get('username', username),
            "platform": "kick",
            "platformId": str(kick_data['id']),
            "avatarUrl": kick_data.get('user', {}).get('profile_pic'),
            "followerCount": kick_data.get('followers_count', 0),
            "isLive": True,
            "lifetimeStats": {
                "totalSessions": 0,
                "totalHoursStreamed": 0,
                "totalWagered": total_wagered,
                "totalWon": 0,
                "biggestWin": 0,
                "biggestMultiplier": 0,
                "averageRtp": 0,
            },
        },
        "currentGame": None,
        "recentWins": [],
        "viewerCount": kick_data['livestream'].get('viewer_count', 0),
        "sessionProfitLoss": {
            "amount": profit_loss,
            "percentage": profit_percentage,
            "isProfit": profit_loss >= 0,
        },
        "balanceHistory": balance_events[-50:],  # Last 50 events for chart
    }


def get_all_live_streams() -> List[Dict]:
    """Get all live streams with OCR data."""
    live_streams = []

    for username in TIER1_USERNAMES:
        data = get_streamer_live_data(username)
        if data:
            live_streams.append(data)

    # Sort by viewer count
    live_streams.sort(key=lambda x: x['viewerCount'], reverse=True)
    return live_streams


def get_recent_ocr_events(limit: int = 50) -> List[Dict]:
    """Get recent OCR events from balance_history.json."""
    # Read from balance_history.json file
    balance_file = DATA_DIR.parent / "balance_history.json"

    all_events = []

    try:
        if balance_file.exists():
            with open(balance_file, 'r', encoding='utf-8') as f:
                history = json.load(f)

            for username, data in history.items():
                for event in data.get('balance_history', []):
                    all_events.append({
                        "timestamp": event.get('timestamp'),
                        "streamer": username,
                        "balance": event.get('balance', 0),
                        "change": event.get('change', 0),
                        "game": event.get('game_id'),
                        # Calculate multiplier from change if bet info available
                        "multiplier": abs(event.get('change', 0)) / 100 if event.get('change', 0) > 1000 else None,
                    })
    except Exception as e:
        logger.error(f"Error reading balance history: {e}")

    # Sort by timestamp descending and return latest
    all_events.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return all_events[:limit]


def get_big_wins(min_win: float = 5000, limit: int = 20) -> List[Dict]:
    """Get big wins (large positive balance changes) from history."""
    balance_file = DATA_DIR.parent / "balance_history.json"

    big_wins = []

    try:
        if balance_file.exists():
            with open(balance_file, 'r', encoding='utf-8') as f:
                history = json.load(f)

            for username, data in history.items():
                for event in data.get('balance_history', []):
                    change = event.get('change', 0)
                    if change >= min_win:
                        big_wins.append({
                            "timestamp": event.get('timestamp'),
                            "streamer": username,
                            "displayName": username.replace('twitch_', '').replace('_', ' ').title(),
                            "balance": event.get('balance', 0),
                            "winAmount": change,
                            "game": event.get('game_id', 'Unknown'),
                            "multiplier": round(change / 100, 1) if change > 0 else 0,  # Estimate based on $100 bet
                        })
    except Exception as e:
        logger.error(f"Error reading big wins: {e}")

    # Sort by win amount descending
    big_wins.sort(key=lambda x: x.get('winAmount', 0), reverse=True)
    return big_wins[:limit]


def get_streamer_stats(username: str) -> Dict:
    """Get stats for a specific streamer."""
    events = _balance_history.get(username, [])

    if not events:
        return {
            "username": username,
            "totalEvents": 0,
            "currentBalance": 0,
            "startBalance": 0,
            "profitLoss": 0,
            "peakBalance": 0,
            "lowestBalance": 0,
        }

    balances = [e['balance'] for e in events]

    return {
        "username": username,
        "totalEvents": len(events),
        "currentBalance": balances[-1],
        "startBalance": balances[0],
        "profitLoss": balances[-1] - balances[0],
        "peakBalance": max(balances),
        "lowestBalance": min(balances),
    }


# Background task to periodically fetch Kick data
async def periodic_kick_fetch(interval: int = 60):
    """Periodically fetch Kick data."""
    fetcher = KickLiveFetcher()

    while True:
        try:
            logger.info("Fetching live streamer data from Kick...")
            fetcher.fetch_all_live_streamers()
        except Exception as e:
            logger.error(f"Error in periodic fetch: {e}")

        await asyncio.sleep(interval)


# Singleton fetcher instance
_fetcher: Optional[KickLiveFetcher] = None


def get_kick_fetcher() -> KickLiveFetcher:
    """Get singleton Kick fetcher instance."""
    global _fetcher
    if _fetcher is None:
        _fetcher = KickLiveFetcher()
    return _fetcher

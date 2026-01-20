"""
Twitch API Service

Fetches live stream data from Twitch Helix API.
Requires: TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import httpx

from ..core.config import settings

logger = logging.getLogger(__name__)


class TwitchAPIService:
    """
    Twitch Helix API client for fetching gambling/slots streams.
    """

    AUTH_URL = "https://id.twitch.tv/oauth2/token"
    API_BASE = "https://api.twitch.tv/helix"

    # Gambling/Slots related game IDs on Twitch
    GAMBLING_GAME_IDS = [
        "29452",      # Slots
        "499973",     # Casino
        "27284",      # Retro/Classic Games (some slots here)
    ]

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None
    ):
        self.client_id = client_id or getattr(settings, 'TWITCH_CLIENT_ID', '')
        self.client_secret = client_secret or getattr(settings, 'TWITCH_CLIENT_SECRET', '')
        self._access_token: Optional[str] = None
        self._token_expires: Optional[datetime] = None
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _get_access_token(self) -> Optional[str]:
        """Get or refresh OAuth access token."""
        if not self.client_id or not self.client_secret:
            logger.warning("Twitch credentials not configured")
            return None

        # Check if token is still valid
        if self._access_token and self._token_expires:
            if datetime.now() < self._token_expires - timedelta(minutes=5):
                return self._access_token

        # Get new token
        client = await self._get_client()
        try:
            response = await client.post(
                self.AUTH_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "client_credentials"
                }
            )
            response.raise_for_status()
            data = response.json()

            self._access_token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            self._token_expires = datetime.now() + timedelta(seconds=expires_in)

            logger.info("Twitch access token obtained")
            return self._access_token

        except Exception as e:
            logger.error(f"Failed to get Twitch access token: {e}")
            return None

    async def _api_request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Make authenticated API request."""
        token = await self._get_access_token()
        if not token:
            return None

        client = await self._get_client()
        headers = {
            "Authorization": f"Bearer {token}",
            "Client-Id": self.client_id
        }

        try:
            response = await client.get(
                f"{self.API_BASE}{endpoint}",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Twitch API error: {e}")
            return None

    async def get_gambling_streams(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get live gambling/slots streams."""
        all_streams = []

        for game_id in self.GAMBLING_GAME_IDS:
            data = await self._api_request(
                "/streams",
                params={
                    "game_id": game_id,
                    "first": min(limit, 100),
                    "type": "live"
                }
            )

            if data and "data" in data:
                streams = data["data"]
                for stream in streams:
                    stream["game_id"] = game_id
                all_streams.extend(streams)

        # Sort by viewer count
        all_streams.sort(key=lambda x: x.get("viewer_count", 0), reverse=True)

        logger.info(f"Found {len(all_streams)} Twitch gambling streams")
        return all_streams[:limit]

    async def get_stream_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get stream info for a specific user."""
        data = await self._api_request(
            "/streams",
            params={"user_login": username}
        )

        if data and data.get("data"):
            return data["data"][0]
        return None

    async def get_user_info(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user profile info."""
        data = await self._api_request(
            "/users",
            params={"login": username}
        )

        if data and data.get("data"):
            return data["data"][0]
        return None

    async def get_channel_info(self, broadcaster_id: str) -> Optional[Dict[str, Any]]:
        """Get channel info including follower count."""
        data = await self._api_request(
            "/channels",
            params={"broadcaster_id": broadcaster_id}
        )

        if data and data.get("data"):
            return data["data"][0]
        return None

    def transform_to_live_stream(self, stream: Dict, user: Optional[Dict] = None) -> Dict:
        """Transform Twitch stream data to our LiveStreamData format."""
        username = stream.get("user_login", "")
        display_name = stream.get("user_name", username)

        # Build thumbnail URL (replace size placeholders)
        thumbnail = stream.get("thumbnail_url", "")
        if thumbnail:
            thumbnail = thumbnail.replace("{width}", "640").replace("{height}", "360")

        return {
            "session": {
                "id": stream.get("id", ""),
                "streamerId": username,
                "startTime": stream.get("started_at"),
                "startBalance": 0,
                "currentBalance": 0,
                "peakBalance": 0,
                "lowestBalance": 0,
                "totalWagered": 0,
                "status": "live",
                "thumbnailUrl": thumbnail,
            },
            "streamer": {
                "id": username,
                "username": username,
                "displayName": display_name,
                "platform": "twitch",
                "platformId": stream.get("user_id", ""),
                "avatarUrl": user.get("profile_image_url") if user else None,
                "followerCount": 0,  # Would need separate API call
                "isLive": True,
                "lifetimeStats": {
                    "totalSessions": 0,
                    "totalHoursStreamed": 0,
                    "totalWagered": 0,
                    "totalWon": 0,
                    "biggestWin": 0,
                    "biggestMultiplier": 0,
                    "averageRtp": 0,
                },
            },
            "currentGame": {
                "id": stream.get("game_id", ""),
                "name": stream.get("game_name", "Slots"),
                "slug": stream.get("game_name", "").lower().replace(" ", "-"),
                "providerId": "twitch",
                "rtp": 0,
                "volatility": "unknown",
                "maxMultiplier": 0,
                "isActive": True,
            },
            "recentWins": [],
            "viewerCount": stream.get("viewer_count", 0),
            "sessionProfitLoss": {
                "amount": 0,
                "percentage": 0,
                "isProfit": True,
            },
        }


# Singleton instance
_twitch_service: Optional[TwitchAPIService] = None


def get_twitch_service() -> TwitchAPIService:
    """Get singleton Twitch service instance."""
    global _twitch_service
    if _twitch_service is None:
        _twitch_service = TwitchAPIService()
    return _twitch_service

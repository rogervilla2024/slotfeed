import httpx
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from datetime import datetime
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential


@dataclass
class KickChannel:
    """Represents a Kick channel/streamer."""
    id: int
    user_id: int
    slug: str
    username: str
    display_name: str
    bio: Optional[str]
    avatar_url: Optional[str]
    banner_url: Optional[str]
    followers_count: int
    is_live: bool
    livestream: Optional[Dict[str, Any]]


@dataclass
class KickLivestream:
    """Represents an active Kick livestream."""
    id: int
    channel_id: int
    session_title: str
    created_at: datetime
    viewer_count: int
    thumbnail_url: Optional[str]
    playback_url: Optional[str]
    categories: List[Dict[str, Any]]


class KickAPIClient:
    """Client for interacting with Kick's API (unofficial)."""

    BASE_URL = "https://kick.com/api/v2"
    BASE_URL_V1 = "https://kick.com/api/v1"

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                    "Accept-Language": "en-US,en;q=0.9",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def _request(
        self,
        method: str,
        endpoint: str,
        base_url: Optional[str] = None,
        **kwargs,
    ) -> Optional[Dict]:
        """Make HTTP request with retry logic."""
        client = await self._get_client()
        url = f"{base_url or self.BASE_URL}{endpoint}"

        try:
            response = await client.request(method, url, **kwargs)

            if response.status_code == 404:
                return None

            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            print(f"HTTP error for {url}: {e.response.status_code}")
            raise
        except Exception as e:
            print(f"Request error for {url}: {e}")
            raise

    async def get_channel(self, username: str) -> Optional[KickChannel]:
        """Get channel information by username/slug."""
        data = await self._request("GET", f"/channels/{username}")
        if not data:
            return None

        livestream = None
        if data.get("livestream"):
            ls = data["livestream"]
            livestream = {
                "id": ls.get("id"),
                "session_title": ls.get("session_title"),
                "created_at": ls.get("created_at"),
                "viewer_count": ls.get("viewer_count", 0),
                "thumbnail": ls.get("thumbnail"),
            }

        return KickChannel(
            id=data.get("id"),
            user_id=data.get("user_id"),
            slug=data.get("slug", username),
            username=data.get("user", {}).get("username", username),
            display_name=data.get("user", {}).get("username", username),
            bio=data.get("user", {}).get("bio"),
            avatar_url=data.get("user", {}).get("profile_pic"),
            banner_url=data.get("banner_image", {}).get("url") if data.get("banner_image") else None,
            followers_count=data.get("followers_count", 0),
            is_live=data.get("livestream") is not None,
            livestream=livestream,
        )

    async def get_livestream(self, username: str) -> Optional[KickLivestream]:
        """Get active livestream details for a channel."""
        channel = await self.get_channel(username)
        if not channel or not channel.is_live or not channel.livestream:
            return None

        ls = channel.livestream
        return KickLivestream(
            id=ls.get("id"),
            channel_id=channel.id,
            session_title=ls.get("session_title", ""),
            created_at=datetime.fromisoformat(
                ls.get("created_at", "").replace("Z", "+00:00")
            ) if ls.get("created_at") else datetime.utcnow(),
            viewer_count=ls.get("viewer_count", 0),
            thumbnail_url=ls.get("thumbnail", {}).get("url") if isinstance(ls.get("thumbnail"), dict) else ls.get("thumbnail"),
            playback_url=None,  # Extracted separately
            categories=ls.get("categories", []),
        )

    async def get_playback_url(self, username: str) -> Optional[str]:
        """Get m3u8 playback URL for a live stream."""
        # Kick uses a specific endpoint for playback
        # The actual URL format is: https://kick.com/api/v2/channels/{username}/livestream
        data = await self._request("GET", f"/channels/{username}/livestream")
        if not data or not data.get("playback_url"):
            return None

        return data.get("playback_url")

    async def search_channels(
        self,
        query: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search for channels by name."""
        data = await self._request(
            "GET",
            "/search",
            params={"query": query},
            base_url=self.BASE_URL_V1,
        )
        if not data:
            return []

        channels = data.get("channels", [])[:limit]
        return channels

    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get list of stream categories."""
        data = await self._request("GET", "/categories")
        return data.get("categories", []) if data else []

    async def get_top_streams(
        self,
        category: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Get top live streams, optionally filtered by category."""
        endpoint = "/livestreams/en"
        if category:
            endpoint = f"/categories/{category}/livestreams"

        data = await self._request("GET", endpoint, params={"limit": limit})
        return data.get("data", []) if data else []

    async def check_multiple_live(
        self,
        usernames: List[str],
    ) -> Dict[str, bool]:
        """Check live status for multiple streamers concurrently."""
        async def check_one(username: str) -> tuple:
            try:
                channel = await self.get_channel(username)
                return username, channel.is_live if channel else False
            except Exception:
                return username, False

        tasks = [check_one(username) for username in usernames]
        results = await asyncio.gather(*tasks)
        return dict(results)

    async def get_channel_videos(
        self,
        username: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get VODs/videos for a channel."""
        data = await self._request(
            "GET",
            f"/channels/{username}/videos",
            params={"limit": limit},
        )
        return data.get("data", []) if data else []

    async def get_channel_clips(
        self,
        username: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get clips for a channel."""
        data = await self._request(
            "GET",
            f"/channels/{username}/clips",
            params={"limit": limit},
        )
        return data.get("clips", []) if data else []


# Global Kick API client instance
kick_api = KickAPIClient()

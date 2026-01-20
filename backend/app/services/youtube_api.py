"""
YouTube API Service

Fetches live stream data from YouTube Data API v3.
Requires: YOUTUBE_API_KEY in .env
"""

import logging
from typing import Optional, Dict, Any, List
import httpx

from ..core.config import settings

logger = logging.getLogger(__name__)


class YouTubeAPIService:
    """
    YouTube Data API v3 client for fetching gambling/slots streams.
    """

    API_BASE = "https://www.googleapis.com/youtube/v3"

    # Search terms for gambling streams
    GAMBLING_KEYWORDS = [
        "slots live",
        "casino live stream",
        "slot machine live",
        "gambling stream",
        "bonus hunt live",
    ]

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'YOUTUBE_API_KEY', '')
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

    async def _api_request(
        self,
        endpoint: str,
        params: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Make API request."""
        if not self.api_key:
            logger.warning("YouTube API key not configured")
            return None

        params["key"] = self.api_key
        client = await self._get_client()

        try:
            response = await client.get(
                f"{self.API_BASE}{endpoint}",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"YouTube API error: {e}")
            return None

    async def search_live_streams(
        self,
        query: str = "slots live",
        max_results: int = 25
    ) -> List[Dict[str, Any]]:
        """Search for live streams matching query."""
        data = await self._api_request(
            "/search",
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "eventType": "live",
                "maxResults": min(max_results, 50),
                "order": "viewCount",
                "relevanceLanguage": "en",
            }
        )

        if data and "items" in data:
            return data["items"]
        return []

    async def get_gambling_streams(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get live gambling/slots streams from multiple searches."""
        all_streams = []
        seen_ids = set()

        for keyword in self.GAMBLING_KEYWORDS[:3]:  # Limit API calls
            streams = await self.search_live_streams(keyword, max_results=20)

            for stream in streams:
                video_id = stream.get("id", {}).get("videoId")
                if video_id and video_id not in seen_ids:
                    seen_ids.add(video_id)
                    all_streams.append(stream)

        # Get video details for view counts
        if all_streams:
            video_ids = [s.get("id", {}).get("videoId") for s in all_streams if s.get("id", {}).get("videoId")]
            details = await self.get_video_details(video_ids[:50])

            # Merge details into streams
            details_map = {d["id"]: d for d in details}
            for stream in all_streams:
                video_id = stream.get("id", {}).get("videoId")
                if video_id in details_map:
                    stream["details"] = details_map[video_id]

        # Sort by concurrent viewers
        all_streams.sort(
            key=lambda x: int(x.get("details", {}).get("liveStreamingDetails", {}).get("concurrentViewers", 0)),
            reverse=True
        )

        logger.info(f"Found {len(all_streams)} YouTube gambling streams")
        return all_streams[:limit]

    async def get_video_details(self, video_ids: List[str]) -> List[Dict[str, Any]]:
        """Get detailed info for videos including live viewer count."""
        if not video_ids:
            return []

        data = await self._api_request(
            "/videos",
            params={
                "part": "snippet,liveStreamingDetails,statistics",
                "id": ",".join(video_ids[:50]),
            }
        )

        if data and "items" in data:
            return data["items"]
        return []

    async def get_channel_info(self, channel_id: str) -> Optional[Dict[str, Any]]:
        """Get channel info including subscriber count."""
        data = await self._api_request(
            "/channels",
            params={
                "part": "snippet,statistics",
                "id": channel_id,
            }
        )

        if data and data.get("items"):
            return data["items"][0]
        return None

    def transform_to_live_stream(self, stream: Dict) -> Dict:
        """Transform YouTube stream data to our LiveStreamData format."""
        snippet = stream.get("snippet", {})
        details = stream.get("details", {})
        live_details = details.get("liveStreamingDetails", {})
        statistics = details.get("statistics", {})

        channel_id = snippet.get("channelId", "")
        channel_title = snippet.get("channelTitle", "Unknown")
        video_id = stream.get("id", {}).get("videoId") or details.get("id", "")

        # Get thumbnail
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("high", {}).get("url") or
            thumbnails.get("medium", {}).get("url") or
            thumbnails.get("default", {}).get("url")
        )

        # Get viewer count
        viewer_count = int(live_details.get("concurrentViewers", 0))

        return {
            "session": {
                "id": video_id,
                "streamerId": channel_id,
                "startTime": live_details.get("actualStartTime") or snippet.get("publishedAt"),
                "startBalance": 0,
                "currentBalance": 0,
                "peakBalance": 0,
                "lowestBalance": 0,
                "totalWagered": 0,
                "status": "live",
                "thumbnailUrl": thumbnail_url,
            },
            "streamer": {
                "id": channel_id,
                "username": channel_id,
                "displayName": channel_title,
                "platform": "youtube",
                "platformId": channel_id,
                "avatarUrl": None,  # Would need separate API call
                "followerCount": int(statistics.get("subscriberCount", 0)) if statistics else 0,
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
                "id": "slots",
                "name": snippet.get("title", "Slots")[:50],
                "slug": "slots",
                "providerId": "youtube",
                "rtp": 0,
                "volatility": "unknown",
                "maxMultiplier": 0,
                "isActive": True,
            },
            "recentWins": [],
            "viewerCount": viewer_count,
            "sessionProfitLoss": {
                "amount": 0,
                "percentage": 0,
                "isProfit": True,
            },
            "streamTitle": snippet.get("title", ""),
            "streamUrl": f"https://youtube.com/watch?v={video_id}",
        }


# Singleton instance
_youtube_service: Optional[YouTubeAPIService] = None


def get_youtube_service() -> YouTubeAPIService:
    """Get singleton YouTube service instance."""
    global _youtube_service
    if _youtube_service is None:
        _youtube_service = YouTubeAPIService()
    return _youtube_service

"""
YouTube Hybrid Service

Combines RSS feeds + scraping + minimal API usage to avoid quota limits.
Priority: RSS/Scrape (free) -> Cached API data -> Fresh API (only when needed)

Quota-free methods:
- RSS feeds for recent videos
- /live endpoint scraping for live status
- oEmbed for basic video info

API usage (costs quota):
- Only for viewer counts on confirmed live streams
- Heavily cached (5+ minutes)
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import asyncio

from .youtube_rss import YouTubeRSSService, get_youtube_rss_service
from .youtube_api import YouTubeAPIService, get_youtube_service
from ..core.redis import redis_client

logger = logging.getLogger(__name__)


class YouTubeHybridService:
    """
    Hybrid YouTube service that minimizes API quota usage.

    Strategy:
    1. Use RSS for video discovery (0 quota)
    2. Use scraping for live status (0 quota)
    3. Cache everything aggressively
    4. Use API only for viewer counts, cached 5+ min
    """

    # Cache settings
    CACHE_PREFIX = "youtube"
    CACHE_TTL_LIVE_STATUS = 60  # 1 min - live status changes frequently
    CACHE_TTL_CHANNEL_INFO = 3600  # 1 hour - channel info rarely changes
    CACHE_TTL_VIDEO_DETAILS = 300  # 5 min - viewer counts
    CACHE_TTL_FEED = 300  # 5 min - RSS feed

    # Known YouTube slot streamers with their channel IDs
    KNOWN_STREAMERS = {
        "nickslots": {
            "channel_id": "UC7lRGWgTvqGcOB_RzRMwnFA",
            "display_name": "NickSlots",
            "handle": "@NickSlots",
        },
        "letsgiveitaspin": {
            "channel_id": "UCwQo8MrPpKeFLr_MQsPFe-g",
            "display_name": "LetsGiveItASpin",
            "handle": "@LetsGiveItASpin",
        },
        "fruityslots": {
            "channel_id": "UCPkPj3ucOqtxLaJE0pOrwww",
            "display_name": "FruitySlots",
            "handle": "@FruitySlots",
        },
        "casinodaddy": {
            "channel_id": "UCMPFVHJQbx7mLnm0F6x_mYA",
            "display_name": "CasinoDaddy",
            "handle": "@CasinoDaddy",
        },
        "casinogrounds": {
            "channel_id": "UCEm3GVjJK3I3sQ8FYe6_YJg",
            "display_name": "CasinoGrounds",
            "handle": "@CasinoGrounds",
        },
        "classy_beef": {
            "channel_id": "UCFIIFwu_vMfXCL9r_FVQgPA",
            "display_name": "ClassyBeef",
            "handle": "@classybeef",
        },
        "ayezee": {
            "channel_id": "UC2bR_f3p6bdq3M_CpKsviHA",
            "display_name": "AyeZee",
            "handle": "@AyeZee",
        },
        "spintwix": {
            "channel_id": "UCFB3l9_nHQevIgVq8LCb8KQ",
            "display_name": "Spintwix",
            "handle": "@Spintwix",
        },
    }

    def __init__(self):
        self.rss_service = get_youtube_rss_service()
        self.api_service = get_youtube_service()
        self._quota_used_today = 0
        self._quota_reset_date = datetime.utcnow().date()

    async def _get_cache(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        return await redis_client.get_json(f"{self.CACHE_PREFIX}:{key}")

    async def _set_cache(self, key: str, value: Any, ttl: int) -> bool:
        """Set value in cache with TTL."""
        return await redis_client.set_json(
            f"{self.CACHE_PREFIX}:{key}",
            value,
            expire=ttl
        )

    def _check_quota_reset(self):
        """Reset quota counter if it's a new day."""
        today = datetime.utcnow().date()
        if today > self._quota_reset_date:
            self._quota_used_today = 0
            self._quota_reset_date = today
            logger.info("YouTube quota counter reset for new day")

    def _track_quota(self, cost: int):
        """Track quota usage."""
        self._check_quota_reset()
        self._quota_used_today += cost
        logger.debug(f"YouTube quota: +{cost}, total today: {self._quota_used_today}")

    async def get_channel_videos(self, channel_id: str) -> List[Dict[str, Any]]:
        """
        Get recent videos from channel using RSS (0 quota).
        Cached for 5 minutes.
        """
        cache_key = f"feed:{channel_id}"
        cached = await self._get_cache(cache_key)
        if cached:
            return cached

        videos = await self.rss_service.get_channel_feed(channel_id)
        if videos:
            await self._set_cache(cache_key, videos, self.CACHE_TTL_FEED)

        return videos

    async def check_live_status(self, channel_id: str) -> Dict[str, Any]:
        """
        Check if channel is live using scraping (0 quota).
        Cached for 1 minute.
        """
        cache_key = f"live:{channel_id}"
        cached = await self._get_cache(cache_key)
        if cached:
            return cached

        status = await self.rss_service.check_if_live(channel_id)
        if status:
            await self._set_cache(cache_key, status, self.CACHE_TTL_LIVE_STATUS)
            return status

        return {"isLive": False}

    async def get_live_viewer_count(self, video_id: str) -> int:
        """
        Get live viewer count - uses API but heavily cached.
        Only call this for confirmed live streams!

        Quota cost: 1 unit per call (videos endpoint)
        """
        cache_key = f"viewers:{video_id}"
        cached = await self._get_cache(cache_key)
        if cached is not None:
            return cached.get("count", 0)

        # Use API - costs 1 quota unit
        self._track_quota(1)
        details = await self.api_service.get_video_details([video_id])

        if details:
            live_details = details[0].get("liveStreamingDetails", {})
            count = int(live_details.get("concurrentViewers", 0))
            await self._set_cache(cache_key, {"count": count}, self.CACHE_TTL_VIDEO_DETAILS)
            return count

        return 0

    async def get_all_live_streamers(self) -> List[Dict[str, Any]]:
        """
        Get all currently live YouTube slot streamers.
        Uses scraping for live detection (0 quota).
        Only uses API for viewer counts on live streams (cached).
        """
        cache_key = "all_live"
        cached = await self._get_cache(cache_key)
        if cached:
            return cached

        live_streams = []

        # Check all known streamers in parallel
        tasks = []
        for name, info in self.KNOWN_STREAMERS.items():
            tasks.append(self._check_streamer_live(name, info))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, dict) and result.get("isLive"):
                live_streams.append(result)

        # Sort by viewer count
        live_streams.sort(key=lambda x: x.get("viewerCount", 0), reverse=True)

        # Cache for 1 minute
        await self._set_cache(cache_key, live_streams, 60)

        logger.info(f"Found {len(live_streams)} live YouTube slot streamers")
        return live_streams

    async def _check_streamer_live(
        self,
        name: str,
        info: Dict[str, str]
    ) -> Dict[str, Any]:
        """Check if a single streamer is live and get details."""
        channel_id = info["channel_id"]

        # First check live status (0 quota)
        status = await self.check_live_status(channel_id)

        if not status.get("isLive"):
            return {"isLive": False}

        # Get viewer count (uses cached API)
        video_id = status.get("videoId")
        viewer_count = 0
        if video_id:
            viewer_count = await self.get_live_viewer_count(video_id)

        return {
            "isLive": True,
            "streamerName": name,
            "displayName": info["display_name"],
            "channelId": channel_id,
            "videoId": video_id,
            "title": status.get("title", "Live Stream"),
            "viewerCount": viewer_count,
            "url": status.get("url", f"https://youtube.com/channel/{channel_id}/live"),
            "platform": "youtube",
            "thumbnail": f"https://i.ytimg.com/vi/{video_id}/maxresdefault_live.jpg" if video_id else None,
        }

    async def get_channel_info_cached(self, channel_id: str) -> Optional[Dict[str, Any]]:
        """
        Get channel info with aggressive caching (1 hour).
        Only uses API once per hour per channel.

        Quota cost: 1 unit (cached for 1 hour)
        """
        cache_key = f"channel:{channel_id}"
        cached = await self._get_cache(cache_key)
        if cached:
            return cached

        # Use API - costs 1 quota unit
        self._track_quota(1)
        info = await self.api_service.get_channel_info(channel_id)

        if info:
            await self._set_cache(cache_key, info, self.CACHE_TTL_CHANNEL_INFO)

        return info

    def transform_to_live_stream(self, data: Dict) -> Dict:
        """Transform hybrid data to our LiveStreamData format."""
        channel_id = data.get("channelId", "")
        video_id = data.get("videoId", "")

        return {
            "session": {
                "id": video_id,
                "streamerId": channel_id,
                "startTime": datetime.utcnow().isoformat(),
                "startBalance": 0,
                "currentBalance": 0,
                "peakBalance": 0,
                "lowestBalance": 0,
                "totalWagered": 0,
                "status": "live",
                "thumbnailUrl": data.get("thumbnail"),
            },
            "streamer": {
                "id": channel_id,
                "username": data.get("streamerName", ""),
                "displayName": data.get("displayName", ""),
                "platform": "youtube",
                "platformId": channel_id,
                "avatarUrl": None,
                "followerCount": 0,
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
                "name": data.get("title", "Slots")[:50],
                "slug": "slots",
                "providerId": "youtube",
                "rtp": 0,
                "volatility": "unknown",
                "maxMultiplier": 0,
                "isActive": True,
            },
            "recentWins": [],
            "viewerCount": data.get("viewerCount", 0),
            "sessionProfitLoss": {
                "amount": 0,
                "percentage": 0,
                "isProfit": True,
            },
            "streamTitle": data.get("title", ""),
            "streamUrl": data.get("url", ""),
        }

    def get_quota_status(self) -> Dict[str, Any]:
        """Get current quota usage status."""
        self._check_quota_reset()
        return {
            "used_today": self._quota_used_today,
            "daily_limit": 10000,
            "remaining": max(0, 10000 - self._quota_used_today),
            "reset_date": self._quota_reset_date.isoformat(),
            "percentage_used": round(self._quota_used_today / 10000 * 100, 2),
        }

    async def close(self):
        """Close underlying services."""
        await self.rss_service.close()
        await self.api_service.close()


# Singleton instance
_youtube_hybrid_service: Optional[YouTubeHybridService] = None


def get_youtube_hybrid_service() -> YouTubeHybridService:
    """Get singleton YouTube hybrid service instance."""
    global _youtube_hybrid_service
    if _youtube_hybrid_service is None:
        _youtube_hybrid_service = YouTubeHybridService()
    return _youtube_hybrid_service

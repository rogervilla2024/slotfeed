"""
YouTube RSS/Scraping Service

Alternative to YouTube Data API to avoid quota limits.
Uses RSS feeds and public endpoints that don't require API keys.
"""

import logging
import re
import xml.etree.ElementTree as ET
from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class YouTubeRSSService:
    """
    YouTube data fetcher using RSS feeds and public endpoints.
    No API quota limits!
    """

    RSS_BASE = "https://www.youtube.com/feeds/videos.xml"
    OEMBED_URL = "https://www.youtube.com/oembed"

    # Known slot streamers on YouTube (channel IDs)
    KNOWN_STREAMERS = {
        "nickslots": "UCxxxxxxx",  # Add real channel IDs
        "letsgiveitaspin": "UCxxxxxxx",
        "fruityslots": "UCxxxxxxx",
        "casinogrounds": "UCxxxxxxx",
    }

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def get_channel_feed(self, channel_id: str) -> List[Dict[str, Any]]:
        """
        Get recent videos from channel RSS feed.
        RSS URL: https://www.youtube.com/feeds/videos.xml?channel_id=XXXXX
        """
        client = await self._get_client()

        try:
            url = f"{self.RSS_BASE}?channel_id={channel_id}"
            response = await client.get(url)
            response.raise_for_status()

            # Parse XML
            root = ET.fromstring(response.text)
            ns = {"atom": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}

            videos = []
            for entry in root.findall("atom:entry", ns):
                video = {
                    "id": entry.find("yt:videoId", ns).text if entry.find("yt:videoId", ns) is not None else "",
                    "title": entry.find("atom:title", ns).text if entry.find("atom:title", ns) is not None else "",
                    "published": entry.find("atom:published", ns).text if entry.find("atom:published", ns) is not None else "",
                    "updated": entry.find("atom:updated", ns).text if entry.find("atom:updated", ns) is not None else "",
                    "channelId": channel_id,
                }

                # Get thumbnail
                media_group = entry.find("{http://search.yahoo.com/mrss/}group")
                if media_group is not None:
                    thumbnail = media_group.find("{http://search.yahoo.com/mrss/}thumbnail")
                    if thumbnail is not None:
                        video["thumbnail"] = thumbnail.get("url")

                videos.append(video)

            logger.info(f"Got {len(videos)} videos from channel {channel_id}")
            return videos

        except Exception as e:
            logger.error(f"Error fetching YouTube RSS for {channel_id}: {e}")
            return []

    async def check_if_live(self, channel_id: str) -> Optional[Dict[str, Any]]:
        """
        Check if a channel is currently live by scraping the channel page.
        This is a lightweight check that doesn't use API quota.
        """
        client = await self._get_client()

        try:
            # Check channel's live page
            url = f"https://www.youtube.com/channel/{channel_id}/live"
            response = await client.get(url, follow_redirects=True)

            # If redirected to a video, they might be live
            final_url = str(response.url)

            if "/watch?v=" in final_url:
                # Extract video ID
                video_id_match = re.search(r"v=([a-zA-Z0-9_-]{11})", final_url)
                if video_id_match:
                    video_id = video_id_match.group(1)

                    # Check if it's actually live by looking for live indicators in page
                    if '"isLive":true' in response.text or '"isLiveContent":true' in response.text:
                        # Extract title
                        title_match = re.search(r'"title":"([^"]+)"', response.text)
                        title = title_match.group(1) if title_match else "Live Stream"

                        # Extract viewer count
                        viewers_match = re.search(r'"viewCount":"(\d+)"', response.text)
                        viewers = int(viewers_match.group(1)) if viewers_match else 0

                        return {
                            "isLive": True,
                            "videoId": video_id,
                            "title": title,
                            "viewerCount": viewers,
                            "url": f"https://youtube.com/watch?v={video_id}",
                        }

            return {"isLive": False}

        except Exception as e:
            logger.error(f"Error checking live status for {channel_id}: {e}")
            return None

    async def get_video_info_oembed(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Get video info using oEmbed (no API quota).
        Limited info but free and reliable.
        """
        client = await self._get_client()

        try:
            url = f"{self.OEMBED_URL}?url=https://youtube.com/watch?v={video_id}&format=json"
            response = await client.get(url)
            response.raise_for_status()

            data = response.json()
            return {
                "title": data.get("title"),
                "authorName": data.get("author_name"),
                "authorUrl": data.get("author_url"),
                "thumbnailUrl": data.get("thumbnail_url"),
                "thumbnailWidth": data.get("thumbnail_width"),
                "thumbnailHeight": data.get("thumbnail_height"),
            }

        except Exception as e:
            logger.error(f"Error fetching oEmbed for {video_id}: {e}")
            return None

    async def get_channel_id_from_handle(self, handle: str) -> Optional[str]:
        """
        Get channel ID from @handle or username.
        Scrapes the channel page to find the ID.
        """
        client = await self._get_client()

        try:
            # Try @handle format
            url = f"https://www.youtube.com/@{handle}"
            response = await client.get(url, follow_redirects=True)

            # Extract channel ID from page
            channel_id_match = re.search(r'"channelId":"(UC[a-zA-Z0-9_-]{22})"', response.text)
            if channel_id_match:
                return channel_id_match.group(1)

            return None

        except Exception as e:
            logger.error(f"Error getting channel ID for {handle}: {e}")
            return None

    async def get_known_streamers_status(self) -> List[Dict[str, Any]]:
        """Check live status of all known slot streamers."""
        results = []

        for name, channel_id in self.KNOWN_STREAMERS.items():
            if channel_id.startswith("UC"):  # Valid channel ID
                status = await self.check_if_live(channel_id)
                if status:
                    status["streamerName"] = name
                    status["channelId"] = channel_id
                    results.append(status)

        # Return only live streamers
        live_streamers = [r for r in results if r.get("isLive")]
        logger.info(f"Found {len(live_streamers)} live YouTube streamers")
        return live_streamers

    def transform_to_live_stream(self, data: Dict) -> Dict:
        """Transform RSS/scrape data to our LiveStreamData format."""
        return {
            "session": {
                "id": data.get("videoId", ""),
                "streamerId": data.get("channelId", ""),
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
                "id": data.get("channelId", ""),
                "username": data.get("streamerName", ""),
                "displayName": data.get("streamerName", ""),
                "platform": "youtube",
                "platformId": data.get("channelId", ""),
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


# Singleton instance
_youtube_rss_service: Optional[YouTubeRSSService] = None


def get_youtube_rss_service() -> YouTubeRSSService:
    """Get singleton YouTube RSS service instance."""
    global _youtube_rss_service
    if _youtube_rss_service is None:
        _youtube_rss_service = YouTubeRSSService()
    return _youtube_rss_service

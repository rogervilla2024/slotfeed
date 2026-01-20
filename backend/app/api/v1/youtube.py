"""
YouTube API Integration Endpoints

Provides endpoints for:
- Syncing streamer data from YouTube
- Checking live status
- Fetching gambling streams
"""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models import Streamer, Session
from ...core.database import get_db
from ...services.youtube_api import get_youtube_service

router = APIRouter()


@router.get("/status")
async def get_youtube_api_status():
    """
    Check YouTube API status.
    """
    service = get_youtube_service()

    if not service.api_key:
        return {
            "status": "not_configured",
            "message": "YOUTUBE_API_KEY not set in .env",
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }

    try:
        # Try a simple search to verify API key works
        streams = await service.search_live_streams("test", max_results=1)
        return {
            "status": "operational",
            "authenticated": True,
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/check/{channel_id}")
async def check_youtube_channel(channel_id: str):
    """
    Check a YouTube channel by ID.
    """
    service = get_youtube_service()

    if not service.api_key:
        raise HTTPException(
            status_code=503,
            detail="YouTube API not configured. Set YOUTUBE_API_KEY in .env"
        )

    try:
        channel = await service.get_channel_info(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found on YouTube")

        snippet = channel.get("snippet", {})
        statistics = channel.get("statistics", {})
        thumbnails = snippet.get("thumbnails", {})

        return {
            "id": channel.get("id"),
            "username": snippet.get("customUrl", ""),
            "displayName": snippet.get("title"),
            "description": snippet.get("description", "")[:200] + "..." if len(snippet.get("description", "")) > 200 else snippet.get("description", ""),
            "avatarUrl": thumbnails.get("high", {}).get("url") or thumbnails.get("default", {}).get("url"),
            "subscriberCount": int(statistics.get("subscriberCount", 0)),
            "videoCount": int(statistics.get("videoCount", 0)),
            "viewCount": int(statistics.get("viewCount", 0)),
            "country": snippet.get("country"),
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {str(e)}")


@router.get("/streams")
async def get_youtube_gambling_streams(
    limit: int = Query(20, ge=1, le=50),
    query: str = Query("slots live", description="Search query"),
):
    """
    Get live gambling/slots streams from YouTube.
    """
    service = get_youtube_service()

    if not service.api_key:
        raise HTTPException(
            status_code=503,
            detail="YouTube API not configured. Set YOUTUBE_API_KEY in .env"
        )

    try:
        streams = await service.get_gambling_streams(limit=limit)

        results = []
        for s in streams:
            snippet = s.get("snippet", {})
            details = s.get("details", {})
            live_details = details.get("liveStreamingDetails", {})
            thumbnails = snippet.get("thumbnails", {})

            video_id = s.get("id", {}).get("videoId") or details.get("id", "")

            results.append({
                "id": video_id,
                "channelId": snippet.get("channelId"),
                "channelTitle": snippet.get("channelTitle"),
                "title": snippet.get("title"),
                "description": snippet.get("description", "")[:100] + "..." if len(snippet.get("description", "")) > 100 else snippet.get("description", ""),
                "viewers": int(live_details.get("concurrentViewers", 0)),
                "thumbnail": thumbnails.get("high", {}).get("url") or thumbnails.get("medium", {}).get("url"),
                "startedAt": live_details.get("actualStartTime"),
                "streamUrl": f"https://youtube.com/watch?v={video_id}",
            })

        # Sort by viewers
        results.sort(key=lambda x: x["viewers"], reverse=True)

        return {
            "liveCount": len(results),
            "streams": results[:limit],
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {str(e)}")


@router.get("/sync/{username}")
async def sync_youtube_streamer(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Sync a single streamer's data from YouTube API.
    Note: YouTube requires channel ID, not username. The streamer's youtube_url should contain the channel ID.
    """
    service = get_youtube_service()

    if not service.api_key:
        raise HTTPException(
            status_code=503,
            detail="YouTube API not configured"
        )

    # Find streamer in database
    query = select(Streamer).where(
        (Streamer.username == username) | (Streamer.slug == username)
    )
    result = await db.execute(query)
    streamer = result.scalar_one_or_none()

    if not streamer:
        raise HTTPException(status_code=404, detail="Streamer not found in database")

    if not streamer.youtube_url:
        raise HTTPException(status_code=400, detail="Streamer has no YouTube URL configured")

    # Extract channel ID from URL
    # YouTube URLs can be:
    # - https://youtube.com/channel/UC...
    # - https://youtube.com/@username
    # - https://youtube.com/c/channelname
    youtube_url = streamer.youtube_url
    channel_id = None

    if "/channel/" in youtube_url:
        channel_id = youtube_url.split("/channel/")[-1].split("/")[0].split("?")[0]
    elif "/@" in youtube_url:
        # Need to search for channel by custom URL - not directly supported
        raise HTTPException(
            status_code=400,
            detail="YouTube URL uses @username format. Please update to channel ID format (/channel/UC...)"
        )

    if not channel_id:
        raise HTTPException(status_code=400, detail="Could not extract channel ID from YouTube URL")

    try:
        channel = await service.get_channel_info(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found on YouTube")

        snippet = channel.get("snippet", {})
        statistics = channel.get("statistics", {})
        thumbnails = snippet.get("thumbnails", {})

        changes = {"updated": False}

        # Update avatar
        avatar_url = thumbnails.get("high", {}).get("url") or thumbnails.get("default", {}).get("url")
        if avatar_url and avatar_url != streamer.avatar_url:
            streamer.avatar_url = avatar_url
            changes["updated"] = True

        # Update bio
        bio = snippet.get("description", "")[:500]
        if bio and bio != streamer.bio:
            streamer.bio = bio
            changes["updated"] = True

        # Update follower count (subscribers)
        subscribers = int(statistics.get("subscriberCount", 0))
        if subscribers and subscribers != streamer.followers_count:
            streamer.followers_count = subscribers
            changes["updated"] = True

        await db.commit()

        return {
            "username": username,
            "channelId": channel_id,
            "channelTitle": snippet.get("title"),
            "subscribers": subscribers,
            "changes": changes,
            "syncedAt": datetime.now(timezone.utc).isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {str(e)}")


@router.get("/live")
async def get_youtube_live_streamers(
    db: AsyncSession = Depends(get_db),
):
    """
    Get all tracked streamers that are currently live on YouTube.
    Note: This is limited due to YouTube API not having a direct "check if user is live" endpoint.
    We would need to search their channel for active broadcasts.
    """
    service = get_youtube_service()

    if not service.api_key:
        raise HTTPException(
            status_code=503,
            detail="YouTube API not configured"
        )

    # Get all streamers with YouTube URLs
    query = select(Streamer).where(Streamer.youtube_url.isnot(None))
    result = await db.execute(query)
    streamers = result.scalars().all()

    # Note: Checking live status for specific channels on YouTube is complex
    # and requires searching for their live streams. This is expensive API-wise.
    # For now, return the tracked streamers without live status.

    return {
        "message": "YouTube live check requires searching for active broadcasts per channel, which is API-intensive",
        "trackedStreamers": [
            {
                "id": s.id,
                "username": s.username,
                "displayName": s.display_name or s.username,
                "youtubeUrl": s.youtube_url,
            }
            for s in streamers
        ],
        "suggestion": "Use /streams endpoint to find live gambling streams on YouTube",
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/search")
async def search_youtube_live(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
):
    """
    Search for live streams on YouTube.
    """
    service = get_youtube_service()

    if not service.api_key:
        raise HTTPException(
            status_code=503,
            detail="YouTube API not configured"
        )

    try:
        streams = await service.search_live_streams(q, max_results=limit)

        results = []
        for s in streams:
            snippet = s.get("snippet", {})
            thumbnails = snippet.get("thumbnails", {})
            video_id = s.get("id", {}).get("videoId", "")

            results.append({
                "id": video_id,
                "channelId": snippet.get("channelId"),
                "channelTitle": snippet.get("channelTitle"),
                "title": snippet.get("title"),
                "thumbnail": thumbnails.get("high", {}).get("url") or thumbnails.get("medium", {}).get("url"),
                "publishedAt": snippet.get("publishedAt"),
                "streamUrl": f"https://youtube.com/watch?v={video_id}",
            })

        return {
            "query": q,
            "resultCount": len(results),
            "streams": results,
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {str(e)}")

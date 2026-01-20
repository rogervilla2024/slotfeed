"""
Kick API Integration Endpoints

Provides endpoints for:
- Syncing streamer data from Kick
- Checking live status
- Manual refresh triggers
"""

from typing import Optional, List
from datetime import datetime, timezone
import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from ...models import Streamer, Session
from ...core.database import get_db
from ...services.kick_live_fetcher import KickLiveFetcher, get_kick_fetcher

router = APIRouter()

# Thread pool for running sync cloudscraper calls
executor = ThreadPoolExecutor(max_workers=5)


def fetch_kick_channel_sync(username: str) -> dict:
    """Synchronous fetch using cloudscraper."""
    fetcher = get_kick_fetcher()
    return fetcher.fetch_channel(username)


async def update_streamer_from_kick_data(db: AsyncSession, streamer: Streamer, kick_data: dict) -> dict:
    """Update streamer record with Kick data and handle session management."""

    changes = {"updated": False, "session_created": False, "session_ended": False}

    # Extract data
    followers = kick_data.get("followers_count", 0)
    avatar_url = kick_data.get("user", {}).get("profile_pic")
    bio = kick_data.get("user", {}).get("bio")
    is_live = kick_data.get("livestream") is not None
    livestream = kick_data.get("livestream")

    # Update streamer info
    if followers and followers != streamer.followers_count:
        streamer.followers_count = followers
        changes["updated"] = True

    if avatar_url and avatar_url != streamer.avatar_url:
        streamer.avatar_url = avatar_url
        changes["updated"] = True

    if bio and bio != streamer.bio:
        streamer.bio = bio
        changes["updated"] = True

    # Handle live status change
    was_live = False
    current_session = None

    # Check for existing live session
    session_query = select(Session).where(
        Session.streamer_id == streamer.id,
        Session.is_live == True
    )
    result = await db.execute(session_query)
    current_session = result.scalar_one_or_none()
    was_live = current_session is not None

    # Streamer went live
    if is_live and not was_live:
        thumbnail = livestream.get("thumbnail", {})
        thumb_url = thumbnail.get("url") if isinstance(thumbnail, dict) else thumbnail

        new_session = Session(
            streamer_id=streamer.id,
            platform="kick",
            platform_session_id=str(livestream.get("id")) if livestream else None,
            started_at=datetime.now(timezone.utc),
            is_live=True,
            avg_viewers=livestream.get("viewer_count", 0) if livestream else 0,
            peak_viewers=livestream.get("viewer_count", 0) if livestream else 0,
            thumbnail_url=thumb_url,
        )
        db.add(new_session)
        streamer.last_live_at = datetime.now(timezone.utc)
        changes["session_created"] = True
        changes["updated"] = True

    # Streamer went offline
    elif not is_live and was_live and current_session:
        current_session.is_live = False
        current_session.ended_at = datetime.now(timezone.utc)
        if current_session.started_at:
            duration = (current_session.ended_at - current_session.started_at).total_seconds() / 60
            current_session.duration_minutes = int(duration)
        changes["session_ended"] = True
        changes["updated"] = True

    # Update viewer count for live session
    elif is_live and was_live and current_session and livestream:
        viewers = livestream.get("viewer_count", 0)
        current_session.avg_viewers = viewers
        if viewers > (current_session.peak_viewers or 0):
            current_session.peak_viewers = viewers
        changes["updated"] = True

    return changes


@router.get("/sync/{username}")
async def sync_single_streamer(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Sync a single streamer's data from Kick API.
    """
    # Find streamer in database
    query = select(Streamer).where(
        (Streamer.username == username) | (Streamer.slug == username)
    )
    result = await db.execute(query)
    streamer = result.scalar_one_or_none()

    if not streamer:
        raise HTTPException(status_code=404, detail="Streamer not found in database")

    # Extract Kick username from URL
    kick_username = username
    if streamer.kick_url:
        kick_username = streamer.kick_url.rstrip("/").split("/")[-1]

    # Fetch from Kick API using thread pool
    loop = asyncio.get_event_loop()
    try:
        kick_data = await loop.run_in_executor(executor, fetch_kick_channel_sync, kick_username)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Kick API error: {str(e)}")

    if not kick_data:
        raise HTTPException(status_code=404, detail="Streamer not found on Kick")

    # Update database
    changes = await update_streamer_from_kick_data(db, streamer, kick_data)
    await db.commit()

    livestream = kick_data.get("livestream")

    return {
        "username": username,
        "kickUsername": kick_username,
        "isLive": livestream is not None,
        "followers": kick_data.get("followers_count", 0),
        "viewers": livestream.get("viewer_count", 0) if livestream else 0,
        "title": livestream.get("session_title", "") if livestream else None,
        "thumbnail": livestream.get("thumbnail") if livestream else None,
        "changes": changes,
        "syncedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/sync-all")
async def sync_all_streamers(
    db: AsyncSession = Depends(get_db),
):
    """
    Sync all tracked Kick streamers.
    """
    # Get all streamers with Kick URLs
    query = select(Streamer).where(Streamer.kick_url.isnot(None))
    result = await db.execute(query)
    streamers = result.scalars().all()

    results = []
    loop = asyncio.get_event_loop()

    for streamer in streamers:
        kick_username = streamer.kick_url.rstrip("/").split("/")[-1]

        try:
            kick_data = await loop.run_in_executor(executor, fetch_kick_channel_sync, kick_username)

            if kick_data:
                changes = await update_streamer_from_kick_data(db, streamer, kick_data)
                livestream = kick_data.get("livestream")

                results.append({
                    "username": streamer.username,
                    "kickUsername": kick_username,
                    "isLive": livestream is not None,
                    "followers": kick_data.get("followers_count", 0),
                    "viewers": livestream.get("viewer_count", 0) if livestream else 0,
                    "status": "synced",
                    "changes": changes,
                })
            else:
                results.append({
                    "username": streamer.username,
                    "kickUsername": kick_username,
                    "status": "not_found",
                })
        except Exception as e:
            results.append({
                "username": streamer.username,
                "kickUsername": kick_username,
                "status": "error",
                "error": str(e),
            })

    await db.commit()

    live_count = sum(1 for r in results if r.get("isLive"))

    return {
        "totalSynced": len(results),
        "liveCount": live_count,
        "results": results,
        "syncedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/check/{username}")
async def check_kick_channel(username: str):
    """
    Check a Kick channel directly (doesn't require database entry).
    """
    loop = asyncio.get_event_loop()
    try:
        kick_data = await loop.run_in_executor(executor, fetch_kick_channel_sync, username)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Kick API error: {str(e)}")

    if not kick_data:
        raise HTTPException(status_code=404, detail="Channel not found on Kick")

    user = kick_data.get("user", {})
    livestream = kick_data.get("livestream")

    return {
        "id": kick_data.get("id"),
        "username": user.get("username"),
        "displayName": user.get("username"),
        "slug": kick_data.get("slug"),
        "bio": user.get("bio"),
        "avatarUrl": user.get("profile_pic"),
        "bannerUrl": kick_data.get("banner_image", {}).get("url") if kick_data.get("banner_image") else None,
        "followersCount": kick_data.get("followers_count", 0),
        "isLive": livestream is not None,
        "livestream": {
            "id": livestream.get("id"),
            "title": livestream.get("session_title"),
            "viewers": livestream.get("viewer_count", 0),
            "thumbnail": livestream.get("thumbnail"),
            "startedAt": livestream.get("created_at"),
        } if livestream else None,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/live")
async def get_kick_live_streamers(
    db: AsyncSession = Depends(get_db),
):
    """
    Get all tracked streamers that are currently live on Kick.
    Fetches fresh data from Kick API.
    """
    # Get all streamers with Kick URLs
    query = select(Streamer).where(Streamer.kick_url.isnot(None))
    result = await db.execute(query)
    streamers = result.scalars().all()

    live_streamers = []
    loop = asyncio.get_event_loop()

    for streamer in streamers:
        kick_username = streamer.kick_url.rstrip("/").split("/")[-1]

        try:
            kick_data = await loop.run_in_executor(executor, fetch_kick_channel_sync, kick_username)

            if kick_data:
                livestream = kick_data.get("livestream")

                if livestream:
                    # Update database
                    await update_streamer_from_kick_data(db, streamer, kick_data)

                    thumbnail = livestream.get("thumbnail", {})
                    thumb_url = thumbnail.get("url") if isinstance(thumbnail, dict) else thumbnail

                    live_streamers.append({
                        "id": streamer.id,
                        "username": streamer.username,
                        "displayName": streamer.display_name or streamer.username,
                        "slug": streamer.slug,
                        "kickUsername": kick_username,
                        "avatarUrl": kick_data.get("user", {}).get("profile_pic") or streamer.avatar_url,
                        "followers": kick_data.get("followers_count", 0),
                        "viewers": livestream.get("viewer_count", 0),
                        "title": livestream.get("session_title", ""),
                        "thumbnail": thumb_url,
                        "tier": streamer.tier,
                        "country": streamer.country,
                    })
                else:
                    # Update if went offline
                    await update_streamer_from_kick_data(db, streamer, kick_data)

        except Exception as e:
            print(f"Error checking {kick_username}: {e}")
            continue

    await db.commit()

    # Sort by viewers
    live_streamers.sort(key=lambda x: x["viewers"], reverse=True)

    return {
        "liveCount": len(live_streamers),
        "streamers": live_streamers,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/status")
async def get_kick_api_status():
    """
    Check Kick API status by making a test request.
    """
    loop = asyncio.get_event_loop()
    try:
        kick_data = await loop.run_in_executor(executor, fetch_kick_channel_sync, "roshtein")

        return {
            "status": "operational",
            "testChannel": "roshtein",
            "testResult": {
                "found": kick_data is not None,
                "isLive": kick_data.get("livestream") is not None if kick_data else None,
                "followers": kick_data.get("followers_count") if kick_data else None,
            },
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/scheduler-status")
async def get_scheduler_status():
    """
    Get the background sync scheduler status.
    """
    try:
        from ...services.scheduler import scheduler
        
        if scheduler is None:
            return {
                "status": "stopped",
                "message": "Scheduler is not running"
            }
        
        job = scheduler.get_job("kick_sync")
        if job:
            next_run = job.next_run_time
            return {
                "status": "running",
                "jobName": job.name,
                "nextRun": next_run.isoformat() if next_run else None,
                "interval": "5 minutes",
            }
        else:
            return {
                "status": "running",
                "message": "No sync job scheduled"
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

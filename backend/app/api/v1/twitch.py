"""
Twitch API Integration Endpoints

Provides endpoints for:
- Syncing streamer data from Twitch
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
from ...services.twitch_api import get_twitch_service

router = APIRouter()


@router.get("/status")
async def get_twitch_api_status():
    """
    Check Twitch API status by attempting to authenticate.
    """
    service = get_twitch_service()

    if not service.client_id or not service.client_secret:
        return {
            "status": "not_configured",
            "message": "TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET not set in .env",
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }

    try:
        token = await service._get_access_token()
        if token:
            return {
                "status": "operational",
                "authenticated": True,
                "checkedAt": datetime.now(timezone.utc).isoformat(),
            }
        else:
            return {
                "status": "error",
                "message": "Failed to obtain access token",
                "checkedAt": datetime.now(timezone.utc).isoformat(),
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/check/{username}")
async def check_twitch_channel(username: str):
    """
    Check a Twitch channel directly (doesn't require database entry).
    """
    service = get_twitch_service()

    if not service.client_id:
        raise HTTPException(
            status_code=503,
            detail="Twitch API not configured. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET."
        )

    try:
        # Get user info
        user = await service.get_user_info(username)
        if not user:
            raise HTTPException(status_code=404, detail="User not found on Twitch")

        # Check if live
        stream = await service.get_stream_by_username(username)

        return {
            "id": user.get("id"),
            "username": user.get("login"),
            "displayName": user.get("display_name"),
            "avatarUrl": user.get("profile_image_url"),
            "description": user.get("description"),
            "viewCount": user.get("view_count", 0),
            "createdAt": user.get("created_at"),
            "isLive": stream is not None,
            "livestream": {
                "id": stream.get("id"),
                "title": stream.get("title"),
                "game": stream.get("game_name"),
                "viewers": stream.get("viewer_count", 0),
                "startedAt": stream.get("started_at"),
                "thumbnail": stream.get("thumbnail_url", "").replace("{width}", "640").replace("{height}", "360"),
            } if stream else None,
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Twitch API error: {str(e)}")


@router.get("/streams")
async def get_twitch_gambling_streams(
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get live gambling/slots streams from Twitch.
    """
    service = get_twitch_service()

    if not service.client_id:
        raise HTTPException(
            status_code=503,
            detail="Twitch API not configured. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET."
        )

    try:
        streams = await service.get_gambling_streams(limit=limit)

        return {
            "liveCount": len(streams),
            "streams": [
                {
                    "id": s.get("id"),
                    "username": s.get("user_login"),
                    "displayName": s.get("user_name"),
                    "title": s.get("title"),
                    "game": s.get("game_name"),
                    "viewers": s.get("viewer_count", 0),
                    "thumbnail": s.get("thumbnail_url", "").replace("{width}", "640").replace("{height}", "360"),
                    "startedAt": s.get("started_at"),
                    "streamUrl": f"https://twitch.tv/{s.get('user_login')}",
                }
                for s in streams
            ],
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Twitch API error: {str(e)}")


@router.get("/sync/{username}")
async def sync_twitch_streamer(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Sync a single streamer's data from Twitch API.
    """
    service = get_twitch_service()

    if not service.client_id:
        raise HTTPException(
            status_code=503,
            detail="Twitch API not configured"
        )

    # Find streamer in database
    query = select(Streamer).where(
        (Streamer.username == username) | (Streamer.slug == username)
    )
    result = await db.execute(query)
    streamer = result.scalar_one_or_none()

    if not streamer:
        raise HTTPException(status_code=404, detail="Streamer not found in database")

    # Extract Twitch username from URL
    twitch_username = username
    if streamer.twitch_url:
        twitch_username = streamer.twitch_url.rstrip("/").split("/")[-1]

    try:
        # Get user info
        user = await service.get_user_info(twitch_username)
        if not user:
            raise HTTPException(status_code=404, detail="Streamer not found on Twitch")

        # Check if live
        stream = await service.get_stream_by_username(twitch_username)

        changes = {"updated": False, "session_created": False, "session_ended": False}

        # Update avatar if available
        avatar_url = user.get("profile_image_url")
        if avatar_url and avatar_url != streamer.avatar_url:
            streamer.avatar_url = avatar_url
            changes["updated"] = True

        # Update bio if available
        bio = user.get("description")
        if bio and bio != streamer.bio:
            streamer.bio = bio
            changes["updated"] = True

        # Check for existing live session
        session_query = select(Session).where(
            Session.streamer_id == streamer.id,
            Session.is_live == True,
            Session.platform == "twitch"
        )
        sess_result = await db.execute(session_query)
        current_session = sess_result.scalar_one_or_none()
        was_live = current_session is not None
        is_live = stream is not None

        # Streamer went live
        if is_live and not was_live:
            thumbnail = stream.get("thumbnail_url", "").replace("{width}", "640").replace("{height}", "360")

            new_session = Session(
                streamer_id=streamer.id,
                platform="twitch",
                platform_session_id=stream.get("id"),
                started_at=datetime.now(timezone.utc),
                is_live=True,
                avg_viewers=stream.get("viewer_count", 0),
                peak_viewers=stream.get("viewer_count", 0),
                thumbnail_url=thumbnail,
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
        elif is_live and was_live and current_session:
            viewers = stream.get("viewer_count", 0)
            current_session.avg_viewers = viewers
            if viewers > (current_session.peak_viewers or 0):
                current_session.peak_viewers = viewers
            changes["updated"] = True

        await db.commit()

        return {
            "username": username,
            "twitchUsername": twitch_username,
            "isLive": is_live,
            "viewers": stream.get("viewer_count", 0) if stream else 0,
            "title": stream.get("title") if stream else None,
            "game": stream.get("game_name") if stream else None,
            "changes": changes,
            "syncedAt": datetime.now(timezone.utc).isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Twitch API error: {str(e)}")


@router.get("/live")
async def get_twitch_live_streamers(
    db: AsyncSession = Depends(get_db),
):
    """
    Get all tracked streamers that are currently live on Twitch.
    """
    service = get_twitch_service()

    if not service.client_id:
        raise HTTPException(
            status_code=503,
            detail="Twitch API not configured"
        )

    # Get all streamers with Twitch URLs
    query = select(Streamer).where(Streamer.twitch_url.isnot(None))
    result = await db.execute(query)
    streamers = result.scalars().all()

    live_streamers = []

    for streamer in streamers:
        twitch_username = streamer.twitch_url.rstrip("/").split("/")[-1]

        try:
            stream = await service.get_stream_by_username(twitch_username)

            if stream:
                thumbnail = stream.get("thumbnail_url", "").replace("{width}", "640").replace("{height}", "360")

                live_streamers.append({
                    "id": streamer.id,
                    "username": streamer.username,
                    "displayName": streamer.display_name or streamer.username,
                    "slug": streamer.slug,
                    "twitchUsername": twitch_username,
                    "avatarUrl": streamer.avatar_url,
                    "viewers": stream.get("viewer_count", 0),
                    "title": stream.get("title", ""),
                    "game": stream.get("game_name", ""),
                    "thumbnail": thumbnail,
                    "tier": streamer.tier,
                    "country": streamer.country,
                })

        except Exception as e:
            print(f"Error checking Twitch {twitch_username}: {e}")
            continue

    # Sort by viewers
    live_streamers.sort(key=lambda x: x["viewers"], reverse=True)

    return {
        "liveCount": len(live_streamers),
        "streamers": live_streamers,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }

"""
Background Scheduler Service

Handles periodic tasks:
- Kick streamer sync every 5 minutes
- Session cleanup
- Stats aggregation
"""

import asyncio
import logging
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db_context
from ..models import Streamer, Session
from .kick_live_fetcher import get_kick_fetcher

logger = logging.getLogger(__name__)

# Thread pool for sync cloudscraper calls
executor = ThreadPoolExecutor(max_workers=5)

# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None


def fetch_kick_channel_sync(username: str) -> dict:
    """Synchronous fetch using cloudscraper."""
    fetcher = get_kick_fetcher()
    return fetcher.fetch_channel(username)


async def update_streamer_from_kick(db: AsyncSession, streamer: Streamer, kick_data: dict) -> dict:
    """Update streamer record with Kick data and handle session management."""
    from datetime import datetime, timezone

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


async def sync_all_kick_streamers():
    """Sync all tracked Kick streamers - called periodically."""
    logger.info("Starting scheduled Kick sync...")

    try:
        async with get_db_context() as db:
            # Get all streamers with Kick URLs
            query = select(Streamer).where(Streamer.kick_url.isnot(None))
            result = await db.execute(query)
            streamers = result.scalars().all()

            if not streamers:
                logger.info("No Kick streamers to sync")
                return

            loop = asyncio.get_event_loop()
            synced = 0
            live_count = 0
            errors = 0

            for streamer in streamers:
                kick_username = streamer.kick_url.rstrip("/").split("/")[-1]

                try:
                    kick_data = await loop.run_in_executor(
                        executor, fetch_kick_channel_sync, kick_username
                    )

                    if kick_data:
                        await update_streamer_from_kick(db, streamer, kick_data)
                        synced += 1
                        if kick_data.get("livestream"):
                            live_count += 1
                except Exception as e:
                    logger.error(f"Error syncing {kick_username}: {e}")
                    errors += 1
                    continue

            await db.commit()

            logger.info(
                f"Kick sync complete: {synced} synced, {live_count} live, {errors} errors"
            )

    except Exception as e:
        logger.error(f"Kick sync failed: {e}")


def start_scheduler():
    """Start the background scheduler."""
    global scheduler

    if scheduler is not None:
        logger.warning("Scheduler already running")
        return

    scheduler = AsyncIOScheduler()

    # Kick sync every 5 minutes
    scheduler.add_job(
        sync_all_kick_streamers,
        trigger=IntervalTrigger(minutes=5),
        id="kick_sync",
        name="Sync Kick Streamers",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Background scheduler started - Kick sync every 5 minutes")


def stop_scheduler():
    """Stop the background scheduler."""
    global scheduler

    if scheduler is None:
        return

    scheduler.shutdown(wait=False)
    scheduler = None
    logger.info("Background scheduler stopped")


async def run_sync_now():
    """Manually trigger a sync (for API endpoint)."""
    await sync_all_kick_streamers()

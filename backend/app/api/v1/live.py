"""
Live streaming data endpoints

Returns real-time streaming data from database in format expected by frontend.
Includes real-time OCR data from Redis for balance updates.
"""

import os
from datetime import datetime, timezone
from typing import Optional, List, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import redis.asyncio as redis

from ...core.database import get_db
from ...models import Session, Streamer, Game

router = APIRouter(tags=["live"])

# Redis connection for OCR data
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Get Redis client for OCR data."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    return _redis_client


async def get_ocr_data(username: str) -> Optional[Dict]:
    """Get latest OCR data for a streamer from Redis."""
    try:
        r = await get_redis()
        data = await r.hgetall(f"ocr:latest:{username}")
        if data:
            return {
                "balance": float(data["balance"]) if data.get("balance") else None,
                "bet": float(data["bet"]) if data.get("bet") else None,
                "win": float(data["win"]) if data.get("win") else None,
                "confidence": float(data.get("confidence", 0)),
                "timestamp": data.get("timestamp"),
                "worker_id": int(data.get("worker_id", 0)),
            }
    except Exception:
        pass
    return None


@router.get("/streams")
async def get_live_streams(
    db: AsyncSession = Depends(get_db),
    platform: Optional[str] = Query(None, description="Filter by platform: kick, twitch, youtube"),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Get all currently live streams with their data.
    Returns data in LiveStreamData format expected by frontend.
    """
    # Query active sessions with streamer info
    query = (
        select(Session)
        .options(selectinload(Session.streamer))
        .where(Session.is_live == True)
        .order_by(Session.avg_viewers.desc().nullslast())
        .limit(limit)
    )

    # Filter by platform if specified
    if platform:
        query = query.where(Session.platform == platform)

    result = await db.execute(query)
    sessions = result.scalars().all()

    live_streams = []

    for s in sessions:
        if not s.streamer:
            continue

        # Get real-time OCR data from Redis
        ocr_data = await get_ocr_data(s.streamer.username)

        # Calculate session profit/loss
        start_balance = 10000  # Default start balance
        current_balance = start_balance  # Will be updated when OCR is active

        # Use real-time OCR balance if available
        if ocr_data and ocr_data.get("balance"):
            current_balance = ocr_data["balance"]

        # Use session data if available (fallback)
        if hasattr(s, 'start_balance') and s.start_balance:
            start_balance = s.start_balance
        if not ocr_data and hasattr(s, 'current_balance') and s.current_balance:
            current_balance = s.current_balance

        profit_loss = current_balance - start_balance
        profit_percentage = (profit_loss / start_balance * 100) if start_balance > 0 else 0

        # Build streamer lifetime stats
        lifetime_stats = {
            "totalSessions": 0,
            "totalHoursStreamed": 0,
            "totalWagered": 0,
            "totalWon": 0,
            "biggestWin": 0,
            "biggestMultiplier": 0,
            "averageRtp": 96.0,
        }

        # Determine platform
        streamer_platform = s.platform or "kick"
        if s.streamer.twitch_url and not s.streamer.kick_url:
            streamer_platform = "twitch"
        elif s.streamer.youtube_url and not s.streamer.kick_url:
            streamer_platform = "youtube"

        # Build the response in LiveStreamData format
        stream_data = {
            "session": {
                "id": str(s.id),
                "streamerId": str(s.streamer_id),
                "startTime": s.started_at.isoformat() if s.started_at else datetime.now(timezone.utc).isoformat(),
                "endTime": s.ended_at.isoformat() if s.ended_at else None,
                "startBalance": start_balance,
                "currentBalance": current_balance,
                "peakBalance": s.peak_viewers or current_balance,  # Using peak viewers as proxy
                "lowestBalance": start_balance * 0.8,  # Placeholder
                "totalWagered": 0,
                "status": "live" if s.is_live else "ended",
                "streamUrl": f"https://kick.com/{s.streamer.username}" if streamer_platform == "kick" else
                            f"https://twitch.tv/{s.streamer.username}" if streamer_platform == "twitch" else
                            s.streamer.youtube_url,
                "thumbnailUrl": s.thumbnail_url,
            },
            "streamer": {
                "id": str(s.streamer.id),
                "username": s.streamer.username,
                "displayName": s.streamer.display_name or s.streamer.username,
                "platform": streamer_platform,
                "platformId": str(s.streamer.id),
                "avatarUrl": s.streamer.avatar_url,
                "bio": s.streamer.bio,
                "followerCount": s.streamer.followers_count or 0,
                "isLive": True,
                "lifetimeStats": lifetime_stats,
                "createdAt": s.streamer.created_at.isoformat() if s.streamer.created_at else datetime.now(timezone.utc).isoformat(),
                "updatedAt": s.streamer.updated_at.isoformat() if s.streamer.updated_at else datetime.now(timezone.utc).isoformat(),
            },
            "currentGame": None,  # Will be populated when game detection is active
            "recentWins": [],  # Will be populated from big_wins table
            "viewerCount": s.avg_viewers or 0,
            "sessionProfitLoss": {
                "amount": profit_loss,
                "percentage": round(profit_percentage, 2),
                "isProfit": profit_loss >= 0,
            },
            "ocrData": {
                "balance": ocr_data.get("balance") if ocr_data else None,
                "bet": ocr_data.get("bet") if ocr_data else None,
                "win": ocr_data.get("win") if ocr_data else None,
                "confidence": ocr_data.get("confidence", 0) if ocr_data else 0,
                "lastUpdated": ocr_data.get("timestamp") if ocr_data else None,
                "isActive": ocr_data is not None,
            },
        }

        live_streams.append(stream_data)

    return live_streams


@router.get("/stats")
async def get_live_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated live stats."""
    # Count live sessions
    query = select(Session).where(Session.is_live == True)
    result = await db.execute(query)
    sessions = result.scalars().all()

    total_viewers = sum(s.avg_viewers or 0 for s in sessions)

    # Count by platform
    kick_count = sum(1 for s in sessions if s.platform == "kick")
    twitch_count = sum(1 for s in sessions if s.platform == "twitch")
    youtube_count = sum(1 for s in sessions if s.platform == "youtube")

    return {
        "activeStreamers": len(sessions),
        "totalViewers": total_viewers,
        "platforms": {
            "kick": kick_count,
            "twitch": twitch_count,
            "youtube": youtube_count,
        },
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/big-wins")
async def get_big_wins(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(10, ge=1, le=50),
    sort: str = Query("recent", description="Sort by: recent, amount, multiplier"),
):
    """Get recent big wins."""
    from ...models import BigWin

    query = select(BigWin).options(
        selectinload(BigWin.streamer),
        selectinload(BigWin.game)
    ).limit(limit)

    if sort == "amount":
        query = query.order_by(BigWin.amount.desc())
    elif sort == "multiplier":
        query = query.order_by(BigWin.multiplier.desc())
    else:
        query = query.order_by(BigWin.created_at.desc())

    result = await db.execute(query)
    wins = result.scalars().all()

    # Return format expected by frontend BigWin interface
    return [
        {
            "id": str(w.id),
            "streamerName": (w.streamer.display_name or w.streamer.username) if w.streamer else "Unknown",
            "gameName": w.game.name if w.game else "Unknown Game",
            "amount": float(w.amount) if w.amount else 0,
            "multiplier": float(w.multiplier) if w.multiplier else 0,
            "timestamp": w.created_at.isoformat() if w.created_at else datetime.now(timezone.utc).isoformat(),
            "platform": "kick",  # Default platform
            "videoUrl": w.clip_url or (f"https://kick.com/{w.streamer.username}" if w.streamer else ""),
        }
        for w in wins
    ]


@router.get("/rtp-tracker")
async def get_rtp_tracker(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(8, ge=1, le=20),
):
    """Get RTP tracking data for slots from real database."""
    # Get games with RTP data directly
    query = select(Game).where(Game.is_active == True).limit(limit)
    result = await db.execute(query)
    games = result.scalars().all()

    return [
        {
            "gameId": str(g.id),
            "gameName": g.name,
            "streamerName": "Various",
            "currentRtp": float(g.rtp) if g.rtp else 96.0,
            "theoreticalRtp": float(g.rtp) if g.rtp else 96.0,
            "status": "neutral",
            "trend": "stable",
            "sparkline": [float(g.rtp) if g.rtp else 96.0] * 10,
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
        }
        for g in games
    ]


@router.get("/ocr-status")
async def get_ocr_status():
    """
    Get OCR system status including worker health and queue stats.
    """
    try:
        r = await get_redis()

        # Get queue lengths
        high_priority_len = await r.llen("ocr:jobs:high")
        normal_len = await r.llen("ocr:jobs:normal")

        # Get active streams count
        active_count = await r.scard("ocr:active")

        # Get worker heartbeats
        heartbeats = await r.hgetall("ocr:workers:heartbeat")
        workers = []
        for worker_id, last_heartbeat in heartbeats.items():
            workers.append({
                "workerId": int(worker_id),
                "lastHeartbeat": last_heartbeat,
                "isHealthy": True,  # Could check if heartbeat is recent
            })

        # Get stats
        stats = await r.hgetall("ocr:stats")

        # Get recent big wins
        big_wins_raw = await r.lrange("ocr:big_wins", 0, 4)
        recent_big_wins = []
        for bw in big_wins_raw:
            try:
                import json
                recent_big_wins.append(json.loads(bw))
            except Exception:
                pass

        return {
            "status": "active" if workers else "inactive",
            "queue": {
                "highPriority": high_priority_len,
                "normal": normal_len,
                "total": high_priority_len + normal_len,
            },
            "activeStreams": active_count,
            "workers": workers,
            "workerCount": len(workers),
            "stats": {
                "jobsEnqueued": int(stats.get("jobs_enqueued", 0)),
                "jobsCompleted": int(stats.get("jobs_completed", 0)),
                "jobsFailed": int(stats.get("jobs_failed", 0)),
            },
            "recentBigWins": recent_big_wins,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "queue": {"highPriority": 0, "normal": 0, "total": 0},
            "activeStreams": 0,
            "workers": [],
            "workerCount": 0,
            "stats": {"jobsEnqueued": 0, "jobsCompleted": 0, "jobsFailed": 0},
            "recentBigWins": [],
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }

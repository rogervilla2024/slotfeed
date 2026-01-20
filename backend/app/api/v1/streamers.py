"""
Streamers API Endpoints

Provides endpoints for listing and retrieving streamer information.
"""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from ...models import Streamer, BigWin, Session
from ...core.database import get_db

router = APIRouter()


@router.get("/")
async def list_streamers(
    platform: Optional[str] = Query(None, description="Filter by platform (kick, twitch, youtube)"),
    tier: Optional[int] = Query(None, ge=1, le=3, description="Filter by tier (1=top, 2=mid, 3=rising)"),
    country: Optional[str] = Query(None, description="Filter by country code"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort: str = Query("followers", description="Sort by: followers, wagered, profit, rtp"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List all tracked streamers with optional filters.
    """
    query = select(Streamer)

    # Apply filters
    if platform:
        if platform == "kick":
            query = query.where(Streamer.kick_url.isnot(None))
        elif platform == "twitch":
            query = query.where(Streamer.twitch_url.isnot(None))
        elif platform == "youtube":
            query = query.where(Streamer.youtube_url.isnot(None))

    if tier:
        query = query.where(Streamer.tier == tier)

    if country:
        query = query.where(Streamer.country == country.upper())

    if is_active is not None:
        query = query.where(Streamer.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(Streamer)
    if tier:
        count_query = count_query.where(Streamer.tier == tier)
    if is_active is not None:
        count_query = count_query.where(Streamer.is_active == is_active)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    if sort == "wagered":
        query = query.order_by(desc(Streamer.total_wagered))
    elif sort == "profit":
        query = query.order_by(desc(Streamer.net_profit_loss))
    elif sort == "rtp":
        query = query.order_by(desc(Streamer.lifetime_rtp))
    else:  # followers (default)
        query = query.order_by(desc(Streamer.followers_count))

    # Apply pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    streamers = result.scalars().all()

    # Build response with all fields needed by both leaderboard and streamers pages
    streamers_list = []
    for s in streamers:
        total_wagered = float(s.total_wagered) if s.total_wagered else 0
        total_won = float(s.total_won) if s.total_won else 0
        net_profit = float(s.net_profit_loss) if s.net_profit_loss else 0
        lifetime_rtp = float(s.lifetime_rtp) if s.lifetime_rtp else 96.0

        # Calculate ROI
        roi = (net_profit / total_wagered * 100) if total_wagered > 0 else 0

        streamers_list.append({
            "id": s.id,
            "username": s.username,
            "displayName": s.display_name or s.username,
            "name": s.display_name or s.username,  # Alias for leaderboard
            "slug": s.slug,
            "avatarUrl": s.avatar_url,
            "country": s.country,
            "language": s.language,
            "platform": "kick" if s.kick_url else ("twitch" if s.twitch_url else "youtube"),
            "platformId": s.id,
            "kickUrl": s.kick_url,
            "twitchUrl": s.twitch_url,
            "youtubeUrl": s.youtube_url,
            # Flat fields for leaderboard
            "followersCount": s.followers_count or 0,
            "followers": s.followers_count or 0,  # Alias for leaderboard
            "followerCount": s.followers_count or 0,  # Alias for streamers page
            "avgViewers": s.avg_viewers or 0,
            "tier": s.tier,
            "isActive": s.is_active,
            "isLive": False,  # Will be updated by live endpoint
            "totalSessions": s.total_sessions or 0,
            "totalWagered": total_wagered,
            "totalWon": total_won,
            "totalPayouts": total_won,  # Alias for leaderboard
            "netProfitLoss": net_profit,
            "profitLoss": net_profit,  # Alias for leaderboard
            "roi": round(roi, 2),
            "lifetimeRtp": lifetime_rtp,
            "averageRtp": lifetime_rtp,  # Alias for leaderboard
            "biggestWin": float(s.biggest_win) if s.biggest_win else 0,
            "biggestMultiplier": float(s.biggest_multiplier) if s.biggest_multiplier else 0,
            # Nested lifetimeStats for streamers page
            "lifetimeStats": {
                "totalSessions": s.total_sessions or 0,
                "totalHoursStreamed": float(s.total_stream_hours) if s.total_stream_hours else 0,
                "totalWagered": total_wagered,
                "totalWon": total_won,
                "biggestWin": float(s.biggest_win) if s.biggest_win else 0,
                "biggestMultiplier": float(s.biggest_multiplier) if s.biggest_multiplier else 0,
                "averageRtp": lifetime_rtp,
            },
        })

    return {"streamers": streamers_list, "total": total}


@router.get("/leaderboard")
async def get_streamer_leaderboard(
    period: str = Query("7d", description="Time period: 24h, 7d, 30d, all"),
    metric: str = Query("profit", description="Ranking metric: profit, wagered, rtp, wins"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get streamer leaderboard based on specified metric.
    """
    query = select(Streamer).where(Streamer.is_active == True)

    # Apply sorting based on metric
    if metric == "wagered":
        query = query.order_by(desc(Streamer.total_wagered))
    elif metric == "rtp":
        query = query.order_by(desc(Streamer.lifetime_rtp))
    elif metric == "wins":
        query = query.order_by(desc(Streamer.biggest_win))
    else:  # profit
        query = query.order_by(desc(Streamer.net_profit_loss))

    query = query.limit(limit)

    result = await db.execute(query)
    streamers = result.scalars().all()

    return {
        "period": period,
        "metric": metric,
        "leaderboard": [
            {
                "rank": idx + 1,
                "id": s.id,
                "username": s.username,
                "displayName": s.display_name or s.username,
                "slug": s.slug,
                "avatarUrl": s.avatar_url,
                "country": s.country,
                "value": float(getattr(s, {
                    "wagered": "total_wagered",
                    "rtp": "lifetime_rtp",
                    "wins": "biggest_win",
                    "profit": "net_profit_loss"
                }.get(metric, "net_profit_loss")) or 0),
                "totalWagered": float(s.total_wagered) if s.total_wagered else 0,
                "netProfitLoss": float(s.net_profit_loss) if s.net_profit_loss else 0,
                "lifetimeRtp": float(s.lifetime_rtp) if s.lifetime_rtp else None,
            }
            for idx, s in enumerate(streamers)
        ],
    }


@router.get("/search")
async def search_streamers(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Search streamers by username or display name.
    """
    search_term = f"%{q.lower()}%"

    query = select(Streamer).where(
        (func.lower(Streamer.username).like(search_term)) |
        (func.lower(Streamer.display_name).like(search_term))
    ).order_by(desc(Streamer.followers_count)).limit(limit)

    result = await db.execute(query)
    streamers = result.scalars().all()

    return [
        {
            "id": s.id,
            "username": s.username,
            "displayName": s.display_name or s.username,
            "slug": s.slug,
            "avatarUrl": s.avatar_url,
            "followersCount": s.followers_count,
            "platform": "kick" if s.kick_url else ("twitch" if s.twitch_url else "youtube"),
        }
        for s in streamers
    ]


@router.get("/{streamer_id}")
async def get_streamer(
    streamer_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific streamer.
    """
    query = select(Streamer).where(
        (Streamer.id == streamer_id) | (Streamer.slug == streamer_id) | (Streamer.username == streamer_id)
    )

    result = await db.execute(query)
    streamer = result.scalar_one_or_none()

    if not streamer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Streamer not found"
        )

    # Determine platform
    platform = "kick"
    if streamer.twitch_url and not streamer.kick_url:
        platform = "twitch"
    elif streamer.youtube_url and not streamer.kick_url:
        platform = "youtube"

    # Calculate stats
    total_wagered = float(streamer.total_wagered) if streamer.total_wagered else 0
    total_won = float(streamer.total_won) if streamer.total_won else 0
    lifetime_rtp = float(streamer.lifetime_rtp) if streamer.lifetime_rtp else 96.0

    return {
        "id": streamer.id,
        "username": streamer.username,
        "displayName": streamer.display_name or streamer.username,
        "slug": streamer.slug,
        "avatarUrl": streamer.avatar_url,
        "bio": streamer.bio,
        "country": streamer.country,
        "language": streamer.language,
        "tier": streamer.tier,
        "isActive": streamer.is_active,
        "lastLiveAt": streamer.last_live_at.isoformat() if streamer.last_live_at else None,
        # Frontend required fields
        "platform": platform,
        "platformId": streamer.id,
        "followerCount": streamer.followers_count or 0,
        "isLive": False,  # Will be updated by checking live sessions
        "createdAt": streamer.created_at.isoformat() if streamer.created_at else datetime.now(timezone.utc).isoformat(),
        "updatedAt": streamer.updated_at.isoformat() if streamer.updated_at else datetime.now(timezone.utc).isoformat(),
        "socialLinks": {
            "kick": streamer.kick_url,
            "twitch": streamer.twitch_url,
            "youtube": streamer.youtube_url,
            "twitter": streamer.twitter_url,
            "discord": streamer.discord_url,
        },
        # Nested lifetimeStats for frontend
        "lifetimeStats": {
            "totalSessions": streamer.total_sessions or 0,
            "totalHoursStreamed": float(streamer.total_stream_hours) if streamer.total_stream_hours else 0,
            "totalWagered": total_wagered,
            "totalWon": total_won,
            "biggestWin": float(streamer.biggest_win) if streamer.biggest_win else 0,
            "biggestMultiplier": float(streamer.biggest_multiplier) if streamer.biggest_multiplier else 0,
            "averageRtp": lifetime_rtp,
        },
        # Legacy stats field for backwards compatibility
        "stats": {
            "followersCount": streamer.followers_count or 0,
            "avgViewers": streamer.avg_viewers or 0,
            "totalSessions": streamer.total_sessions or 0,
            "totalStreamHours": float(streamer.total_stream_hours) if streamer.total_stream_hours else 0,
            "totalWagered": total_wagered,
            "totalWon": total_won,
            "netProfitLoss": float(streamer.net_profit_loss) if streamer.net_profit_loss else 0,
            "lifetimeRtp": lifetime_rtp,
            "biggestWin": float(streamer.biggest_win) if streamer.biggest_win else 0,
            "biggestMultiplier": float(streamer.biggest_multiplier) if streamer.biggest_multiplier else 0,
        },
        "sponsorInfo": streamer.sponsor_info,
    }


@router.get("/{streamer_id}/stats")
async def get_streamer_stats(
    streamer_id: str,
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, all"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated statistics for a streamer.
    """
    query = select(Streamer).where(
        (Streamer.id == streamer_id) | (Streamer.slug == streamer_id)
    )

    result = await db.execute(query)
    streamer = result.scalar_one_or_none()

    if not streamer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Streamer not found"
        )

    return {
        "streamerId": streamer.id,
        "streamerName": streamer.display_name or streamer.username,
        "period": period,
        "totalSessions": streamer.total_sessions,
        "totalHours": streamer.total_stream_hours,
        "totalWagered": float(streamer.total_wagered) if streamer.total_wagered else 0,
        "totalWon": float(streamer.total_won) if streamer.total_won else 0,
        "netProfitLoss": float(streamer.net_profit_loss) if streamer.net_profit_loss else 0,
        "averageRtp": float(streamer.lifetime_rtp) if streamer.lifetime_rtp else None,
        "biggestWin": float(streamer.biggest_win) if streamer.biggest_win else 0,
        "biggestMultiplier": float(streamer.biggest_multiplier) if streamer.biggest_multiplier else 0,
    }


@router.get("/{streamer_id}/big-wins")
async def get_streamer_big_wins(
    streamer_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get big wins for a specific streamer.
    """
    # First find the streamer
    streamer_query = select(Streamer).where(
        (Streamer.id == streamer_id) | (Streamer.slug == streamer_id)
    )
    streamer_result = await db.execute(streamer_query)
    streamer = streamer_result.scalar_one_or_none()

    if not streamer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Streamer not found"
        )

    # Get big wins
    query = select(BigWin).options(
        selectinload(BigWin.game)
    ).where(
        BigWin.streamer_id == streamer.id
    ).order_by(desc(BigWin.multiplier)).limit(limit)

    result = await db.execute(query)
    wins = result.scalars().all()

    return {
        "streamerId": streamer.id,
        "streamerName": streamer.display_name or streamer.username,
        "bigWins": [
            {
                "id": win.id,
                "amount": float(win.amount),
                "multiplier": float(win.multiplier),
                "betAmount": float(win.bet_amount) if win.bet_amount else 0,
                "timestamp": win.timestamp.isoformat(),
                "game": {
                    "name": win.game.name,
                    "slug": win.game.slug,
                } if win.game else None,
            }
            for win in wins
        ],
        "total": len(wins),
    }


@router.get("/{streamer_id}/sessions")
async def get_streamer_sessions(
    streamer_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get streaming sessions for a specific streamer.
    """
    # First find the streamer
    streamer_query = select(Streamer).where(
        (Streamer.id == streamer_id) | (Streamer.slug == streamer_id)
    )
    streamer_result = await db.execute(streamer_query)
    streamer = streamer_result.scalar_one_or_none()

    if not streamer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Streamer not found"
        )

    # Get sessions
    query = select(Session).where(
        Session.streamer_id == streamer.id
    ).order_by(desc(Session.started_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    sessions = result.scalars().all()

    # Count total
    count_query = select(func.count()).select_from(Session).where(
        Session.streamer_id == streamer.id
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return {
        "streamerId": streamer.id,
        "sessions": [
            {
                "id": session.id,
                "platform": session.platform,
                "startedAt": session.started_at.isoformat(),
                "endedAt": session.ended_at.isoformat() if session.ended_at else None,
                "durationMinutes": session.duration_minutes,
                "totalWagered": float(session.total_wagered) if session.total_wagered else 0,
                "totalWon": float(session.total_won) if session.total_won else 0,
                "netProfitLoss": float(session.net_profit_loss) if session.net_profit_loss else 0,
                "sessionRtp": float(session.session_rtp) if session.session_rtp else None,
                "gamesPlayed": session.games_played,
                "biggestWin": float(session.biggest_win) if session.biggest_win else 0,
                "isLive": session.is_live,
            }
            for session in sessions
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

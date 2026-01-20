"""
Big Wins API Endpoints

Provides endpoints for listing and retrieving big win records.
Big wins are typically defined as wins with multipliers >= 100x.
"""

from typing import Optional
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from ...models import BigWin, Game, Streamer
from ...core.database import get_db

router = APIRouter()


@router.get("/")
async def list_big_wins(
    streamer: Optional[str] = Query(None, description="Filter by streamer slug"),
    game: Optional[str] = Query(None, description="Filter by game slug"),
    min_multiplier: Optional[float] = Query(None, ge=1, description="Minimum multiplier"),
    period: Optional[str] = Query(None, description="Time period: 24h, 7d, 30d, all"),
    sort: str = Query("recent", description="Sort by: recent, multiplier, amount"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List big wins with optional filters.

    Returns paginated list of big wins sorted by specified criteria.
    """
    # Build query with relationships
    query = select(BigWin).options(
        selectinload(BigWin.game),
        selectinload(BigWin.streamer)
    )

    # Apply filters
    if streamer:
        query = query.join(Streamer).where(Streamer.slug == streamer)

    if game:
        query = query.join(Game).where(Game.slug == game)

    if min_multiplier:
        query = query.where(BigWin.multiplier >= min_multiplier)

    # Time period filter
    if period:
        now = datetime.now(timezone.utc)
        if period == "24h":
            query = query.where(BigWin.timestamp >= now - timedelta(hours=24))
        elif period == "7d":
            query = query.where(BigWin.timestamp >= now - timedelta(days=7))
        elif period == "30d":
            query = query.where(BigWin.timestamp >= now - timedelta(days=30))

    # Count total before pagination
    count_query = select(func.count()).select_from(BigWin)
    if streamer:
        count_query = count_query.join(Streamer).where(Streamer.slug == streamer)
    if game:
        count_query = count_query.join(Game).where(Game.slug == game)
    if min_multiplier:
        count_query = count_query.where(BigWin.multiplier >= min_multiplier)
    if period:
        now = datetime.now(timezone.utc)
        if period == "24h":
            count_query = count_query.where(BigWin.timestamp >= now - timedelta(hours=24))
        elif period == "7d":
            count_query = count_query.where(BigWin.timestamp >= now - timedelta(days=7))
        elif period == "30d":
            count_query = count_query.where(BigWin.timestamp >= now - timedelta(days=30))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    if sort == "multiplier":
        query = query.order_by(desc(BigWin.multiplier))
    elif sort == "amount":
        query = query.order_by(desc(BigWin.amount))
    else:  # recent
        query = query.order_by(desc(BigWin.timestamp))

    # Apply pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    wins = result.scalars().all()

    return {
        "wins": [
            {
                "id": win.id,
                "amount": float(win.amount),
                "multiplier": float(win.multiplier),
                "betAmount": float(win.bet_amount) if win.bet_amount else 0,
                "timestamp": win.timestamp.isoformat(),
                "screenshotUrl": win.screenshot_url,
                "clipUrl": win.clip_url,
                "game": {
                    "id": win.game.id,
                    "name": win.game.name,
                    "slug": win.game.slug,
                    "thumbnailUrl": win.game.thumbnail_url,
                } if win.game else None,
                "streamer": {
                    "id": win.streamer.id,
                    "username": win.streamer.username,
                    "displayName": win.streamer.display_name,
                    "slug": win.streamer.slug,
                    "avatarUrl": win.streamer.avatar_url,
                } if win.streamer else None,
            }
            for win in wins
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/stats")
async def get_big_wins_stats(
    period: str = Query("24h", description="Time period: 24h, 7d, 30d, all"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated statistics for big wins.
    """
    now = datetime.now(timezone.utc)

    # Base query
    query = select(
        func.count(BigWin.id).label("total_wins"),
        func.sum(BigWin.amount).label("total_amount"),
        func.avg(BigWin.multiplier).label("avg_multiplier"),
        func.max(BigWin.multiplier).label("max_multiplier"),
        func.max(BigWin.amount).label("max_amount"),
    )

    # Apply time filter
    if period == "24h":
        query = query.where(BigWin.timestamp >= now - timedelta(hours=24))
    elif period == "7d":
        query = query.where(BigWin.timestamp >= now - timedelta(days=7))
    elif period == "30d":
        query = query.where(BigWin.timestamp >= now - timedelta(days=30))

    result = await db.execute(query)
    stats = result.one()

    return {
        "period": period,
        "totalWins": stats.total_wins or 0,
        "totalAmount": float(stats.total_amount) if stats.total_amount else 0,
        "avgMultiplier": float(stats.avg_multiplier) if stats.avg_multiplier else 0,
        "maxMultiplier": float(stats.max_multiplier) if stats.max_multiplier else 0,
        "maxAmount": float(stats.max_amount) if stats.max_amount else 0,
    }


@router.get("/leaderboard")
async def get_big_wins_leaderboard(
    period: str = Query("7d", description="Time period: 24h, 7d, 30d, all"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get leaderboard of biggest wins.
    """
    now = datetime.now(timezone.utc)

    query = select(BigWin).options(
        selectinload(BigWin.game),
        selectinload(BigWin.streamer)
    )

    # Apply time filter
    if period == "24h":
        query = query.where(BigWin.timestamp >= now - timedelta(hours=24))
    elif period == "7d":
        query = query.where(BigWin.timestamp >= now - timedelta(days=7))
    elif period == "30d":
        query = query.where(BigWin.timestamp >= now - timedelta(days=30))

    # Order by multiplier (biggest wins first)
    query = query.order_by(desc(BigWin.multiplier)).limit(limit)

    result = await db.execute(query)
    wins = result.scalars().all()

    return {
        "period": period,
        "leaderboard": [
            {
                "rank": idx + 1,
                "id": win.id,
                "amount": float(win.amount),
                "multiplier": float(win.multiplier),
                "betAmount": float(win.bet_amount) if win.bet_amount else 0,
                "timestamp": win.timestamp.isoformat(),
                "screenshotUrl": win.screenshot_url,
                "game": {
                    "name": win.game.name,
                    "slug": win.game.slug,
                } if win.game else None,
                "streamer": {
                    "username": win.streamer.username,
                    "displayName": win.streamer.display_name,
                    "avatarUrl": win.streamer.avatar_url,
                } if win.streamer else None,
            }
            for idx, win in enumerate(wins)
        ],
    }


@router.get("/recent")
async def get_recent_big_wins(
    limit: int = Query(10, ge=1, le=50),
    min_multiplier: float = Query(100, ge=1, description="Minimum multiplier to qualify"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get most recent big wins (for live ticker display).
    """
    query = select(BigWin).options(
        selectinload(BigWin.game),
        selectinload(BigWin.streamer)
    ).where(
        BigWin.multiplier >= min_multiplier
    ).order_by(desc(BigWin.timestamp)).limit(limit)

    result = await db.execute(query)
    wins = result.scalars().all()

    return [
        {
            "id": win.id,
            "amount": float(win.amount),
            "multiplier": float(win.multiplier),
            "timestamp": win.timestamp.isoformat(),
            "game": win.game.name if win.game else None,
            "gameSlug": win.game.slug if win.game else None,
            "streamer": win.streamer.display_name or win.streamer.username if win.streamer else None,
            "streamerSlug": win.streamer.slug if win.streamer else None,
            "avatarUrl": win.streamer.avatar_url if win.streamer else None,
        }
        for win in wins
    ]


@router.get("/{win_id}")
async def get_big_win(
    win_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific big win.
    """
    query = select(BigWin).options(
        selectinload(BigWin.game).selectinload(Game.provider),
        selectinload(BigWin.streamer)
    ).where(BigWin.id == win_id)

    result = await db.execute(query)
    win = result.scalar_one_or_none()

    if not win:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Big win not found"
        )

    return {
        "id": win.id,
        "amount": float(win.amount),
        "multiplier": float(win.multiplier),
        "betAmount": float(win.bet_amount) if win.bet_amount else 0,
        "balanceBefore": float(win.balance_before) if win.balance_before else None,
        "balanceAfter": float(win.balance_after) if win.balance_after else None,
        "timestamp": win.timestamp.isoformat(),
        "screenshotUrl": win.screenshot_url,
        "clipUrl": win.clip_url,
        "game": {
            "id": win.game.id,
            "name": win.game.name,
            "slug": win.game.slug,
            "thumbnailUrl": win.game.thumbnail_url,
            "rtp": float(win.game.rtp) if win.game.rtp else None,
            "volatility": win.game.volatility,
            "provider": {
                "name": win.game.provider.name,
                "slug": win.game.provider.slug,
            } if win.game.provider else None,
        } if win.game else None,
        "streamer": {
            "id": win.streamer.id,
            "username": win.streamer.username,
            "displayName": win.streamer.display_name,
            "slug": win.streamer.slug,
            "avatarUrl": win.streamer.avatar_url,
            "kickUrl": win.streamer.kick_url,
        } if win.streamer else None,
    }

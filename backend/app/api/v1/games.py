"""
Games API Endpoints

Provides endpoints for listing and retrieving slot game information.
"""

from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ...models import Game, Provider
from ...core.database import get_db

router = APIRouter()


@router.get("/")
async def list_games(
    provider: Optional[str] = Query(None, description="Filter by provider slug"),
    volatility: Optional[str] = Query(None, description="Filter by volatility (low, medium, high, extreme)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List all tracked slot games with optional filters.
    """
    # Build query
    query = select(Game).options(selectinload(Game.provider))

    # Apply filters
    if provider:
        query = query.join(Provider).where(Provider.slug == provider)
    if volatility:
        query = query.where(Game.volatility == volatility)

    # Get total count
    count_query = select(func.count()).select_from(Game)
    if provider:
        count_query = count_query.join(Provider).where(Provider.slug == provider)
    if volatility:
        count_query = count_query.where(Game.volatility == volatility)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(Game.name).offset(skip).limit(limit)

    result = await db.execute(query)
    games = result.scalars().all()

    return {
        "games": [
            {
                "id": game.id,
                "name": game.name,
                "slug": game.slug,
                "thumbnailUrl": game.thumbnail_url,
                "rtp": float(game.rtp) if game.rtp else None,
                "volatility": game.volatility,
                "maxMultiplier": game.max_multiplier,
                "minBet": float(game.min_bet) if game.min_bet else None,
                "maxBet": float(game.max_bet) if game.max_bet else None,
                "hasFreespins": game.has_free_spins,
                "hasBonus": game.has_bonus,
                "hasMultiplier": game.has_multiplier,
                "totalSpins": game.total_spins,
                "isActive": game.is_active,
                "provider": {
                    "id": game.provider.id,
                    "name": game.provider.name,
                    "slug": game.provider.slug,
                } if game.provider else None,
            }
            for game in games
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/providers")
async def list_providers(
    db: AsyncSession = Depends(get_db),
):
    """
    List all game providers.
    """
    query = select(Provider).order_by(Provider.name)
    result = await db.execute(query)
    providers = result.scalars().all()

    return {
        "providers": [
            {
                "id": provider.id,
                "name": provider.name,
                "slug": provider.slug,
                "logoUrl": provider.logo_url,
                "websiteUrl": provider.website_url,
                "totalGames": provider.total_games,
                "avgRtp": float(provider.avg_rtp) if provider.avg_rtp else None,
            }
            for provider in providers
        ],
    }


@router.get("/hot-cold")
async def get_hot_cold_slots(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current hot and cold slots based on recent performance.
    Hot = observed RTP > theoretical RTP
    Cold = observed RTP < theoretical RTP
    """
    # Get games with observed RTP data
    query = select(Game).options(selectinload(Game.provider)).where(
        Game.is_active == True
    ).order_by(Game.total_spins.desc()).limit(limit * 2)

    result = await db.execute(query)
    games = result.scalars().all()

    hot = []
    cold = []

    for game in games:
        theoretical = float(game.rtp) if game.rtp else 96.0
        observed = None
        if game.total_wagered and float(game.total_wagered) > 0:
            observed = float(game.total_won) / float(game.total_wagered) * 100

        game_data = {
            "id": game.id,
            "name": game.name,
            "slug": game.slug,
            "thumbnailUrl": game.thumbnail_url,
            "theoreticalRtp": theoretical,
            "observedRtp": observed,
            "totalSpins": game.total_spins,
            "volatility": game.volatility,
            "provider": game.provider.name if game.provider else None,
        }

        # Calculate if hot or cold based on wagered/won ratio
        if observed is not None:
            if observed > theoretical:
                hot.append(game_data)
            else:
                cold.append(game_data)

    return {
        "hot": hot[:limit],
        "cold": cold[:limit],
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/{game_id}")
async def get_game(
    game_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific game.
    """
    query = select(Game).options(selectinload(Game.provider)).where(
        (Game.id == game_id) | (Game.slug == game_id)
    )
    result = await db.execute(query)
    game = result.scalar_one_or_none()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )

    return {
        "id": game.id,
        "name": game.name,
        "slug": game.slug,
        "description": game.description,
        "thumbnailUrl": game.thumbnail_url,
        "rtp": float(game.rtp) if game.rtp else None,
        "volatility": game.volatility,
        "maxMultiplier": game.max_multiplier,
        "minBet": float(game.min_bet) if game.min_bet else None,
        "maxBet": float(game.max_bet) if game.max_bet else None,
        "hasFreespins": game.has_free_spins,
        "hasBonus": game.has_bonus,
        "hasMultiplier": game.has_multiplier,
        "totalSpins": game.total_spins,
        "totalWagered": float(game.total_wagered) if game.total_wagered else 0,
        "totalWon": float(game.total_won) if game.total_won else 0,
        "isActive": game.is_active,
        "provider": {
            "id": game.provider.id,
            "name": game.provider.name,
            "slug": game.provider.slug,
            "logoUrl": game.provider.logo_url,
        } if game.provider else None,
    }


@router.get("/{game_id}/stats")
async def get_game_stats(
    game_id: str,
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, all"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated statistics for a game across all streamers.
    """
    query = select(Game).where(
        (Game.id == game_id) | (Game.slug == game_id)
    )
    result = await db.execute(query)
    game = result.scalar_one_or_none()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )

    # Calculate observed RTP
    observed_rtp = None
    if game.total_wagered and float(game.total_wagered) > 0:
        observed_rtp = float(game.total_won) / float(game.total_wagered) * 100

    return {
        "gameId": game.id,
        "gameName": game.name,
        "period": period,
        "observedRtp": observed_rtp,
        "theoreticalRtp": float(game.rtp) if game.rtp else 96.0,
        "totalSpins": game.total_spins,
        "totalWagered": float(game.total_wagered) if game.total_wagered else 0,
        "totalWon": float(game.total_won) if game.total_won else 0,
        "bonusFrequency": 0,  # TODO: Calculate from game_sessions
        "averageBonusPayout": 0,  # TODO: Calculate from big_wins
        "biggestWins": [],  # TODO: Query big_wins table
        "streamerRankings": [],  # TODO: Query streamer_game_stats
    }


@router.get("/{game_id}/content")
async def get_game_content(
    game_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get educational and SEO content for a game.
    """
    # First verify game exists
    query = select(Game).where(
        (Game.id == game_id) | (Game.slug == game_id)
    )
    result = await db.execute(query)
    game = result.scalar_one_or_none()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )

    # TODO: Query game_content table when implemented
    return {
        "gameId": game.id,
        "gameName": game.name,
        "overview": None,
        "rtpExplanation": None,
        "volatilityAnalysis": None,
        "bonusFeatures": None,
        "strategies": None,
        "streamerInsights": None,
        "metaDescription": None,
        "focusKeywords": [],
        "isPublished": False,
        "generatedAt": None,
        "updatedAt": None,
    }

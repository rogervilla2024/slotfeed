"""
Hot/Cold Slot Indicator API endpoints

Endpoints for retrieving slot heat scores and analysis:
- Individual slot hot/cold status
- Hottest and coldest slots rankings
- Trend analysis
- Historical data

Now supports JSON-based fallback when PostgreSQL is not available.
"""

from typing import Optional, List
from datetime import datetime, timezone
from pathlib import Path
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

# Try to import PostgreSQL dependencies, fall back to JSON if not available
USE_POSTGRES = False
try:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.core.database import get_db
    from app.services.hot_cold_service import HotColdService, get_hot_cold_service
    from app.schemas.hot_cold import (
        HotColdStatus,
        HotColdScore,
        HotColdResponse,
        HotColdListResponse,
        HottestSlotsResponse,
        ColdestSlotsResponse,
        HotColdHistoryEntry,
        SlotTrendAnalysis,
    )
    USE_POSTGRES = True
except ImportError:
    logger.warning("PostgreSQL dependencies not available, using JSON fallback")

router = APIRouter(prefix="/hot-cold", tags=["hot-cold"])

# JSON data paths
DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent / "data"


def get_game_stats_from_json() -> dict:
    """Load game stats from JSON file."""
    game_stats_file = DATA_DIR / "game_stats.json"
    if game_stats_file.exists():
        with open(game_stats_file, 'r') as f:
            return json.load(f)
    return {"stats": {}}


def get_balance_history_from_json() -> dict:
    """Load balance history from JSON file."""
    balance_file = DATA_DIR / "balance_history.json"
    if balance_file.exists():
        with open(balance_file, 'r') as f:
            return json.load(f)
    return {}


def calculate_hot_cold_from_json():
    """Calculate hot/cold scores from JSON data."""
    balance_data = get_balance_history_from_json()
    game_stats = get_game_stats_from_json().get("stats", {})

    results = []

    # Calculate per-game stats from balance history
    game_performance = {}

    for username, data in balance_data.items():
        history = data.get("balance_history", [])
        for event in history:
            game_id = event.get("game_id", "unknown")
            change = event.get("change", 0)

            if game_id not in game_performance:
                game_performance[game_id] = {
                    "total_won": 0,
                    "total_lost": 0,
                    "sample_count": 0,
                }

            if change > 0:
                game_performance[game_id]["total_won"] += change
            else:
                game_performance[game_id]["total_lost"] += abs(change)
            game_performance[game_id]["sample_count"] += 1

    # Also aggregate from game_stats.json
    for streamer, games in game_stats.items():
        for game_id, stats in games.items():
            if game_id not in game_performance:
                game_performance[game_id] = {
                    "total_won": 0,
                    "total_lost": 0,
                    "sample_count": 0,
                    "game_name": stats.get("gameName", game_id),
                    "provider": stats.get("provider", "unknown"),
                    "theoretical_rtp": stats.get("theoreticalRtp", 96.0),
                }
            game_performance[game_id]["total_won"] += stats.get("totalWon", 0)
            game_performance[game_id]["game_name"] = stats.get("gameName", game_id)
            game_performance[game_id]["provider"] = stats.get("provider", "unknown")
            game_performance[game_id]["theoretical_rtp"] = stats.get("theoreticalRtp", 96.0)

    # Calculate scores
    for game_id, perf in game_performance.items():
        total_wagered = perf.get("total_lost", 0)
        total_won = perf.get("total_won", 0)

        if total_wagered > 0:
            observed_rtp = (total_won / total_wagered) * 100
        else:
            observed_rtp = 100

        theoretical_rtp = perf.get("theoretical_rtp", 96.0)

        # Heat score: difference from theoretical RTP, normalized
        heat_score = min(100, max(-100, (observed_rtp - theoretical_rtp) * 5))

        if heat_score > 25:
            status = "hot"
        elif heat_score < -25:
            status = "cold"
        else:
            status = "neutral"

        results.append({
            "gameId": game_id,
            "gameName": perf.get("game_name", game_id.replace("-", " ").title()),
            "provider": perf.get("provider", "unknown"),
            "heatScore": round(heat_score, 1),
            "status": status,
            "observedRtp": round(observed_rtp, 2),
            "theoreticalRtp": theoretical_rtp,
            "sampleCount": perf.get("sample_count", 0),
            "totalWagered": total_wagered,
            "totalWon": total_won,
        })

    # Sort by heat score
    results.sort(key=lambda x: x["heatScore"], reverse=True)

    return results


# ============= Individual Slot Endpoints =============

@router.get(
    "/games/{game_id}",
    response_model=HotColdResponse,
    summary="Get hot/cold score for a game",
)
async def get_game_hot_cold(
    game_id: str,
    period_hours: int = Query(24, ge=1, le=168, description="Analysis period in hours"),
    include_history: bool = Query(False, description="Include historical data"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the hot/cold score for a specific slot game.

    The score ranges from -100 (coldest) to +100 (hottest):
    - Hot (> 25): Slot is paying above average
    - Neutral (-25 to 25): Slot is paying as expected
    - Cold (< -25): Slot is paying below average
    """
    service = get_hot_cold_service()

    score = await service.calculate_hot_cold(game_id, db, period_hours)

    if not score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found or insufficient data",
        )

    history = None
    if include_history:
        history = await service.get_history(game_id, db, days=7)

    return HotColdResponse(score=score, history=history)


@router.get(
    "/games/{game_id}/trend",
    response_model=SlotTrendAnalysis,
    summary="Get trend analysis for a game",
)
async def get_game_trend(
    game_id: str,
    period_hours: int = Query(168, ge=24, le=720, description="Analysis period in hours"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed trend analysis for a slot game.

    Analyzes historical performance to determine if the slot
    is heating up, cooling down, or stable.
    """
    service = get_hot_cold_service()

    trend = await service.get_trend_analysis(game_id, db, period_hours)

    if not trend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found or insufficient data for trend analysis",
        )

    return trend


@router.get(
    "/games/{game_id}/history",
    response_model=List[HotColdHistoryEntry],
    summary="Get historical hot/cold data",
)
async def get_game_history(
    game_id: str,
    days: int = Query(7, ge=1, le=30, description="Number of days of history"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get historical hot/cold records for a slot game.

    Useful for analyzing how a slot's performance has changed over time.
    """
    service = get_hot_cold_service()
    return await service.get_history(game_id, db, days, limit)


# ============= Ranking Endpoints =============

@router.get(
    "/hottest",
    response_model=HottestSlotsResponse,
    summary="Get hottest slots",
)
async def get_hottest_slots(
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    period_hours: int = Query(24, ge=1, le=168, description="Analysis period"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the currently hottest slots.

    Returns slots sorted by heat score descending, showing
    which games are currently paying above their expected RTP.
    """
    service = get_hot_cold_service()

    slots = await service.get_hottest_slots(db, limit, period_hours)

    return HottestSlotsResponse(
        items=slots,
        period_hours=period_hours,
        generated_at=datetime.now(timezone.utc),
    )


@router.get(
    "/coldest",
    response_model=ColdestSlotsResponse,
    summary="Get coldest slots",
)
async def get_coldest_slots(
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    period_hours: int = Query(24, ge=1, le=168, description="Analysis period"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the currently coldest slots.

    Returns slots sorted by heat score ascending, showing
    which games are currently paying below their expected RTP.
    """
    service = get_hot_cold_service()

    slots = await service.get_coldest_slots(db, limit, period_hours)

    return ColdestSlotsResponse(
        items=slots,
        period_hours=period_hours,
        generated_at=datetime.now(timezone.utc),
    )


@router.get(
    "/all",
    summary="Get all slot scores",
)
async def get_all_scores(
    period_hours: int = Query(24, ge=1, le=168, description="Analysis period"),
    status_filter: Optional[str] = Query(None, description="Filter by status: hot, cold, neutral"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get hot/cold scores for all active slots.

    Returns comprehensive list of all slot scores with summary counts.
    Now queries database directly for game performance data.
    """
    from app.models import Game, Provider

    # Query games with their providers
    query = select(Game).options(selectinload(Game.provider)).where(Game.is_active == True)
    result = await db.execute(query)
    games = result.scalars().all()

    all_scores = []

    for game in games:
        theoretical_rtp = float(game.rtp) if game.rtp else 96.0

        # Calculate observed RTP from wagered/won data
        total_wagered = float(game.total_wagered) if game.total_wagered else 0
        total_won = float(game.total_won) if game.total_won else 0

        if total_wagered > 0:
            observed_rtp = (total_won / total_wagered) * 100
        else:
            # If no wagered data, assume neutral
            observed_rtp = theoretical_rtp

        # Calculate heat score: difference from theoretical RTP normalized
        rtp_diff = observed_rtp - theoretical_rtp
        heat_score = min(100, max(-100, rtp_diff * 5))

        # Determine status
        if heat_score > 25:
            status = "hot"
        elif heat_score < -25:
            status = "cold"
        else:
            status = "neutral"

        # Determine trend (simplified - would need historical data for real trend)
        if heat_score > 10:
            trend = "heating"
        elif heat_score < -10:
            trend = "cooling"
        else:
            trend = "stable"

        # Calculate confidence based on sample size
        confidence = min(1.0, total_wagered / 100000) if total_wagered > 0 else 0.1

        score_data = {
            "game_id": str(game.id),
            "game_name": game.name,
            "game_slug": game.slug,
            "provider_name": game.provider.name if game.provider else None,
            "status": status,
            "score": round(heat_score, 1),
            "heat_score": round(heat_score, 1),
            "metrics": {
                "theoretical_rtp": theoretical_rtp,
                "observed_rtp": round(observed_rtp, 2),
                "rtp_difference": round(rtp_diff, 2),
                "sample_sessions": game.total_spins or 0,
                "total_spins": game.total_spins or 0,
                "total_wagered": total_wagered,
                "total_won": total_won,
                "recent_big_wins": 0,  # Would need to query big_wins table
                "avg_big_wins": 0,
                "big_win_ratio": 0,
            },
            "trend": trend,
            "confidence": round(confidence, 2),
            "period_hours": period_hours,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        all_scores.append(score_data)

    # Sort by heat score descending
    all_scores.sort(key=lambda x: x["score"], reverse=True)

    # Apply status filter if provided
    if status_filter:
        all_scores = [s for s in all_scores if s["status"] == status_filter]

    # Count by status
    hot_count = sum(1 for s in all_scores if s["status"] == "hot")
    cold_count = sum(1 for s in all_scores if s["status"] == "cold")
    neutral_count = sum(1 for s in all_scores if s["status"] == "neutral")

    return {
        "items": all_scores,
        "total": len(all_scores),
        "hot_count": hot_count,
        "cold_count": cold_count,
        "neutral_count": neutral_count,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


# ============= Utility Endpoints =============

@router.post(
    "/games/{game_id}/refresh",
    response_model=HotColdScore,
    summary="Force refresh hot/cold calculation",
)
async def refresh_game_score(
    game_id: str,
    period_hours: int = Query(24, ge=1, le=168),
    save_history: bool = Query(True, description="Save to history"),
    db: AsyncSession = Depends(get_db),
):
    """
    Force recalculation of hot/cold score, bypassing cache.

    Optionally saves the result to the history table.
    """
    service = get_hot_cold_service()

    score = await service.calculate_hot_cold(
        game_id, db, period_hours, force_refresh=True
    )

    if not score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found or insufficient data",
        )

    if save_history:
        await service.save_history(score, db)

    return score


@router.get(
    "/stats",
    summary="Get service statistics",
)
async def get_service_stats():
    """
    Get hot/cold service statistics.

    Useful for monitoring and debugging.
    """
    service = get_hot_cold_service()
    return service.get_stats()


@router.post(
    "/cache/clear",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear calculation cache",
)
async def clear_cache():
    """
    Clear the hot/cold calculation cache.

    Forces fresh calculations on next request.
    """
    service = get_hot_cold_service()
    service.clear_cache()

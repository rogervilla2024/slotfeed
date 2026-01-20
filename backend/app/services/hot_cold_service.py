"""
Hot/Cold Slot Indicator Service

Calculates slot "heat" based on recent performance compared to historical data.

The algorithm considers:
1. RTP Deviation: Observed RTP vs Theoretical RTP
2. Big Win Frequency: Recent big wins vs historical average
3. Trend Analysis: Direction of recent performance changes

Score Range: -100 (coldest) to +100 (hottest)
- Hot: Score > 25 (slot paying above average)
- Neutral: -25 <= Score <= 25 (slot paying as expected)
- Cold: Score < -25 (slot paying below average)

Features:
- Configurable analysis periods (1-168 hours)
- Confidence scoring based on sample size
- Trend detection and prediction
- Historical tracking
- Per-streamer performance analysis
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from uuid import uuid4
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import Game, BigWin, GameSession, HotColdHistory
from ..schemas.hot_cold import (
    HotColdStatus,
    TrendDirection,
    HotColdMetrics,
    HotColdScore,
    HotColdHistoryEntry,
    TrendDataPoint,
    SlotTrendAnalysis,
    HotColdConfig,
)


@dataclass
class HotColdServiceConfig:
    """Configuration for the hot/cold service."""
    # Score thresholds
    hot_threshold: int = 25
    cold_threshold: int = -25

    # Weight factors (must sum to 1.0)
    rtp_weight: float = 0.5
    big_win_weight: float = 0.3
    trend_weight: float = 0.2

    # Minimum samples for valid calculation
    min_sessions: int = 5
    min_spins: int = 1000

    # RTP deviation normalization
    max_rtp_deviation: float = 5.0  # % deviation for max score

    # Big win thresholds
    big_win_multiplier_threshold: float = 100.0

    # Cache settings
    cache_ttl_seconds: int = 300  # 5 minutes


class HotColdService:
    """
    Service for calculating and tracking slot hot/cold indicators.

    The service analyzes recent game performance data and calculates
    a "heat score" indicating whether a slot is currently paying
    above or below its expected return.
    """

    def __init__(self, config: Optional[HotColdServiceConfig] = None):
        """
        Initialize the HotColdService.

        Args:
            config: Service configuration. Uses defaults if not provided.
        """
        self.config = config or HotColdServiceConfig()
        self._cache: Dict[str, Tuple[datetime, HotColdScore]] = {}
        self._stats = {
            "calculations_performed": 0,
            "cache_hits": 0,
            "history_records_created": 0,
        }

    async def calculate_hot_cold(
        self,
        game_id: str,
        db: AsyncSession,
        period_hours: int = 24,
        force_refresh: bool = False,
    ) -> Optional[HotColdScore]:
        """
        Calculate the hot/cold score for a specific game.

        Args:
            game_id: ID of the game to analyze
            db: Database session
            period_hours: Analysis period in hours (default 24)
            force_refresh: Skip cache and recalculate

        Returns:
            HotColdScore if calculation successful, None if insufficient data
        """
        # Check cache
        cache_key = f"{game_id}:{period_hours}"
        if not force_refresh and cache_key in self._cache:
            cached_time, cached_score = self._cache[cache_key]
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < self.config.cache_ttl_seconds:
                self._stats["cache_hits"] += 1
                return cached_score

        # Get game data
        game = await self._get_game(game_id, db)
        if not game:
            return None

        # Calculate metrics
        metrics = await self._calculate_metrics(game_id, game, db, period_hours)
        if not metrics:
            return None

        # Calculate trend
        trend = await self._calculate_trend(game_id, db, period_hours)

        # Calculate final score
        score, heat_score = self._calculate_score(metrics, trend)

        # Determine status
        status = self._determine_status(score)

        # Calculate confidence
        confidence = self._calculate_confidence(metrics)

        result = HotColdScore(
            game_id=game_id,
            game_name=game.name,
            game_slug=game.slug,
            provider_name=None,  # Would need join to get provider
            status=status,
            score=score,
            heat_score=heat_score,
            metrics=metrics,
            trend=trend,
            confidence=confidence,
            period_hours=period_hours,
            last_updated=datetime.now(timezone.utc),
        )

        # Update cache
        self._cache[cache_key] = (datetime.now(timezone.utc), result)
        self._stats["calculations_performed"] += 1

        return result

    async def get_hottest_slots(
        self,
        db: AsyncSession,
        limit: int = 10,
        period_hours: int = 24,
    ) -> List[HotColdScore]:
        """
        Get the hottest slots based on current heat scores.

        Args:
            db: Database session
            limit: Maximum number of results
            period_hours: Analysis period in hours

        Returns:
            List of HotColdScore sorted by score descending
        """
        games = await self._get_active_games(db)
        scores = []

        for game in games:
            score = await self.calculate_hot_cold(game.id, db, period_hours)
            if score and score.confidence >= 0.5:  # Only include confident scores
                scores.append(score)

        # Sort by score descending
        scores.sort(key=lambda x: x.score, reverse=True)

        return scores[:limit]

    async def get_coldest_slots(
        self,
        db: AsyncSession,
        limit: int = 10,
        period_hours: int = 24,
    ) -> List[HotColdScore]:
        """
        Get the coldest slots based on current heat scores.

        Args:
            db: Database session
            limit: Maximum number of results
            period_hours: Analysis period in hours

        Returns:
            List of HotColdScore sorted by score ascending
        """
        games = await self._get_active_games(db)
        scores = []

        for game in games:
            score = await self.calculate_hot_cold(game.id, db, period_hours)
            if score and score.confidence >= 0.5:
                scores.append(score)

        # Sort by score ascending
        scores.sort(key=lambda x: x.score)

        return scores[:limit]

    async def get_all_scores(
        self,
        db: AsyncSession,
        period_hours: int = 24,
    ) -> List[HotColdScore]:
        """
        Get hot/cold scores for all active games.

        Args:
            db: Database session
            period_hours: Analysis period in hours

        Returns:
            List of all HotColdScore
        """
        games = await self._get_active_games(db)
        scores = []

        for game in games:
            score = await self.calculate_hot_cold(game.id, db, period_hours)
            if score:
                scores.append(score)

        return scores

    async def save_history(
        self,
        score: HotColdScore,
        db: AsyncSession,
    ) -> HotColdHistory:
        """
        Save a hot/cold calculation to history.

        Args:
            score: The calculated score to save
            db: Database session

        Returns:
            Created HotColdHistory record
        """
        history = HotColdHistory(
            id=str(uuid4()),
            game_id=score.game_id,
            recorded_at=score.last_updated,
            period_hours=score.period_hours,
            theoretical_rtp=score.metrics.theoretical_rtp,
            observed_rtp=score.metrics.observed_rtp,
            rtp_difference=score.metrics.rtp_difference,
            sample_sessions=score.metrics.sample_sessions,
            total_spins=score.metrics.total_spins,
            total_wagered=score.metrics.total_wagered,
            is_hot=score.status == HotColdStatus.HOT,
            heat_score=score.heat_score,
        )

        db.add(history)
        await db.commit()
        await db.refresh(history)

        self._stats["history_records_created"] += 1

        return history

    async def get_history(
        self,
        game_id: str,
        db: AsyncSession,
        days: int = 7,
        limit: int = 100,
    ) -> List[HotColdHistoryEntry]:
        """
        Get historical hot/cold records for a game.

        Args:
            game_id: ID of the game
            db: Database session
            days: Number of days of history
            limit: Maximum records to return

        Returns:
            List of historical entries
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        result = await db.execute(
            select(HotColdHistory)
            .where(
                and_(
                    HotColdHistory.game_id == game_id,
                    HotColdHistory.recorded_at >= cutoff,
                )
            )
            .order_by(HotColdHistory.recorded_at.desc())
            .limit(limit)
        )
        records = result.scalars().all()

        return [
            HotColdHistoryEntry(
                id=r.id,
                game_id=r.game_id,
                recorded_at=r.recorded_at,
                period_hours=r.period_hours,
                score=self._heat_to_score(float(r.heat_score) if r.heat_score else 0.5),
                status=HotColdStatus.HOT if r.is_hot else HotColdStatus.COLD if r.is_hot is False else HotColdStatus.NEUTRAL,
                observed_rtp=float(r.observed_rtp) if r.observed_rtp else None,
                theoretical_rtp=float(r.theoretical_rtp) if r.theoretical_rtp else None,
                sample_sessions=r.sample_sessions,
            )
            for r in records
        ]

    async def get_trend_analysis(
        self,
        game_id: str,
        db: AsyncSession,
        period_hours: int = 168,  # 7 days
    ) -> Optional[SlotTrendAnalysis]:
        """
        Get detailed trend analysis for a game.

        Args:
            game_id: ID of the game
            db: Database session
            period_hours: Analysis period in hours

        Returns:
            Trend analysis or None if insufficient data
        """
        # Get current score
        current = await self.calculate_hot_cold(game_id, db, 24)
        if not current:
            return None

        # Get historical data points
        history = await self.get_history(game_id, db, days=period_hours // 24)

        if len(history) < 3:
            # Not enough history for trend analysis
            return SlotTrendAnalysis(
                game_id=game_id,
                game_name=current.game_name,
                current_score=current.score,
                current_status=current.status,
                trend_direction=TrendDirection.STABLE,
                trend_strength=0.0,
                data_points=[
                    TrendDataPoint(
                        timestamp=current.last_updated,
                        score=current.score,
                        observed_rtp=current.metrics.observed_rtp,
                        big_wins=current.metrics.recent_big_wins,
                    )
                ],
                analysis_period_hours=period_hours,
            )

        # Calculate trend
        scores = [h.score for h in history]
        trend_direction, trend_strength = self._analyze_trend(scores)

        # Build data points
        data_points = [
            TrendDataPoint(
                timestamp=h.recorded_at,
                score=h.score,
                observed_rtp=h.observed_rtp,
                big_wins=0,  # Would need separate query
            )
            for h in history
        ]

        # Add current score
        data_points.insert(0, TrendDataPoint(
            timestamp=current.last_updated,
            score=current.score,
            observed_rtp=current.metrics.observed_rtp,
            big_wins=current.metrics.recent_big_wins,
        ))

        # Generate prediction
        prediction = self._generate_prediction(trend_direction, trend_strength, current.score)

        return SlotTrendAnalysis(
            game_id=game_id,
            game_name=current.game_name,
            current_score=current.score,
            current_status=current.status,
            trend_direction=trend_direction,
            trend_strength=trend_strength,
            data_points=data_points,
            analysis_period_hours=period_hours,
            prediction=prediction,
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics."""
        return self._stats.copy()

    def clear_cache(self) -> None:
        """Clear the calculation cache."""
        self._cache.clear()

    # ============= Private Methods =============

    async def _get_game(self, game_id: str, db: AsyncSession) -> Optional[Game]:
        """Get game by ID."""
        result = await db.execute(
            select(Game).where(Game.id == game_id)
        )
        return result.scalar_one_or_none()

    async def _get_active_games(self, db: AsyncSession) -> List[Game]:
        """Get all active games."""
        result = await db.execute(
            select(Game).where(Game.is_active == True)
        )
        return list(result.scalars().all())

    async def _calculate_metrics(
        self,
        game_id: str,
        game: Game,
        db: AsyncSession,
        period_hours: int,
    ) -> Optional[HotColdMetrics]:
        """Calculate metrics for hot/cold score."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=period_hours)

        # Get game sessions in period
        sessions_result = await db.execute(
            select(GameSession)
            .where(
                and_(
                    GameSession.game_id == game_id,
                    GameSession.started_at >= cutoff,
                )
            )
        )
        sessions = sessions_result.scalars().all()

        if len(sessions) < self.config.min_sessions:
            # Use default/mock values if not enough real data
            return self._create_default_metrics(game)

        # Calculate aggregates
        total_wagered = sum(float(s.total_wagered or 0) for s in sessions)
        total_won = sum(float(s.total_won or 0) for s in sessions)
        total_spins = sum(s.spin_count or 0 for s in sessions)

        if total_wagered == 0 or total_spins < self.config.min_spins:
            return self._create_default_metrics(game)

        # Calculate observed RTP
        observed_rtp = (total_won / total_wagered) * 100 if total_wagered > 0 else 0
        theoretical_rtp = float(game.theoretical_rtp or 96.0)
        rtp_difference = observed_rtp - theoretical_rtp

        # Get big wins
        big_wins_result = await db.execute(
            select(func.count(BigWin.id))
            .where(
                and_(
                    BigWin.game_id == game_id,
                    BigWin.won_at >= cutoff,
                )
            )
        )
        recent_big_wins = big_wins_result.scalar() or 0

        # Get historical average big wins (from before the period)
        historical_cutoff = cutoff - timedelta(hours=period_hours * 7)  # 7x period for average
        historical_result = await db.execute(
            select(func.count(BigWin.id))
            .where(
                and_(
                    BigWin.game_id == game_id,
                    BigWin.won_at >= historical_cutoff,
                    BigWin.won_at < cutoff,
                )
            )
        )
        historical_big_wins = historical_result.scalar() or 0
        avg_big_wins = historical_big_wins / 7 if historical_big_wins > 0 else recent_big_wins

        # Calculate big win ratio
        big_win_ratio = recent_big_wins / avg_big_wins if avg_big_wins > 0 else 1.0

        return HotColdMetrics(
            theoretical_rtp=theoretical_rtp,
            observed_rtp=round(observed_rtp, 2),
            rtp_difference=round(rtp_difference, 2),
            sample_sessions=len(sessions),
            total_spins=total_spins,
            total_wagered=round(total_wagered, 2),
            total_won=round(total_won, 2),
            recent_big_wins=recent_big_wins,
            avg_big_wins=round(avg_big_wins, 1),
            big_win_ratio=round(big_win_ratio, 2),
        )

    def _create_default_metrics(self, game: Game) -> HotColdMetrics:
        """Create default metrics when insufficient data."""
        theoretical_rtp = float(game.theoretical_rtp or 96.0)
        return HotColdMetrics(
            theoretical_rtp=theoretical_rtp,
            observed_rtp=theoretical_rtp,
            rtp_difference=0.0,
            sample_sessions=0,
            total_spins=0,
            total_wagered=0.0,
            total_won=0.0,
            recent_big_wins=0,
            avg_big_wins=0.0,
            big_win_ratio=1.0,
        )

    async def _calculate_trend(
        self,
        game_id: str,
        db: AsyncSession,
        period_hours: int,
    ) -> TrendDirection:
        """Calculate the trend direction from historical data."""
        # Get recent history
        history = await self.get_history(game_id, db, days=period_hours // 24, limit=10)

        if len(history) < 3:
            return TrendDirection.STABLE

        scores = [h.score for h in history]
        direction, _ = self._analyze_trend(scores)
        return direction

    def _calculate_score(
        self,
        metrics: HotColdMetrics,
        trend: TrendDirection,
    ) -> Tuple[int, float]:
        """
        Calculate the final hot/cold score.

        Returns:
            Tuple of (score: -100 to 100, heat_score: 0 to 1)
        """
        # RTP component: normalize RTP difference to -100 to 100
        rtp_score = (metrics.rtp_difference / self.config.max_rtp_deviation) * 100
        rtp_score = max(-100, min(100, rtp_score))

        # Big win component: ratio to score
        if metrics.big_win_ratio >= 2.0:
            big_win_score = 100
        elif metrics.big_win_ratio >= 1.5:
            big_win_score = 50
        elif metrics.big_win_ratio >= 1.0:
            big_win_score = 0
        elif metrics.big_win_ratio >= 0.5:
            big_win_score = -50
        else:
            big_win_score = -100

        # Trend component
        trend_score = 0
        if trend == TrendDirection.HEATING:
            trend_score = 50
        elif trend == TrendDirection.COOLING:
            trend_score = -50

        # Weighted combination
        final_score = (
            self.config.rtp_weight * rtp_score +
            self.config.big_win_weight * big_win_score +
            self.config.trend_weight * trend_score
        )

        # Clamp to valid range
        final_score = max(-100, min(100, int(final_score)))

        # Convert to heat score (0-1)
        heat_score = (final_score + 100) / 200

        return final_score, round(heat_score, 3)

    def _determine_status(self, score: int) -> HotColdStatus:
        """Determine status from score."""
        if score > self.config.hot_threshold:
            return HotColdStatus.HOT
        elif score < self.config.cold_threshold:
            return HotColdStatus.COLD
        else:
            return HotColdStatus.NEUTRAL

    def _calculate_confidence(self, metrics: HotColdMetrics) -> float:
        """Calculate confidence level based on sample size."""
        # Based on sessions
        session_confidence = min(metrics.sample_sessions / 20, 1.0)

        # Based on spins
        spin_confidence = min(metrics.total_spins / 10000, 1.0)

        # Combined
        return round((session_confidence + spin_confidence) / 2, 2)

    def _analyze_trend(self, scores: List[int]) -> Tuple[TrendDirection, float]:
        """Analyze trend from a list of scores (newest first)."""
        if len(scores) < 2:
            return TrendDirection.STABLE, 0.0

        # Simple linear regression
        n = len(scores)
        x_sum = sum(range(n))
        y_sum = sum(scores)
        xy_sum = sum(i * s for i, s in enumerate(scores))
        x2_sum = sum(i * i for i in range(n))

        denominator = n * x2_sum - x_sum * x_sum
        if denominator == 0:
            return TrendDirection.STABLE, 0.0

        slope = (n * xy_sum - x_sum * y_sum) / denominator

        # Determine direction
        # Note: scores are newest first, so negative slope = heating
        if slope < -2:
            direction = TrendDirection.HEATING
        elif slope > 2:
            direction = TrendDirection.COOLING
        else:
            direction = TrendDirection.STABLE

        # Trend strength (0-1)
        strength = min(abs(slope) / 10, 1.0)

        return direction, round(strength, 2)

    def _heat_to_score(self, heat_score: float) -> int:
        """Convert heat score (0-1) to score (-100 to 100)."""
        return int(heat_score * 200 - 100)

    def _generate_prediction(
        self,
        trend: TrendDirection,
        strength: float,
        current_score: int,
    ) -> str:
        """Generate a prediction string based on trend analysis."""
        if trend == TrendDirection.HEATING and strength > 0.5:
            if current_score < 0:
                return "Slot is recovering, may turn neutral or hot soon"
            else:
                return "Slot continues heating up, could reach peak soon"
        elif trend == TrendDirection.COOLING and strength > 0.5:
            if current_score > 0:
                return "Slot is cooling down, may return to normal"
            else:
                return "Slot continues cooling, may remain cold"
        else:
            return "Slot performance is stable, no significant change expected"


def create_hot_cold_service(
    hot_threshold: int = 25,
    cold_threshold: int = -25,
) -> HotColdService:
    """
    Factory function to create a HotColdService with custom configuration.

    Args:
        hot_threshold: Score above this is considered HOT
        cold_threshold: Score below this is considered COLD

    Returns:
        Configured HotColdService instance
    """
    config = HotColdServiceConfig(
        hot_threshold=hot_threshold,
        cold_threshold=cold_threshold,
    )
    return HotColdService(config)


# Global service instance
_hot_cold_service: Optional[HotColdService] = None


def get_hot_cold_service() -> HotColdService:
    """Get or create the hot/cold service instance."""
    global _hot_cold_service
    if _hot_cold_service is None:
        _hot_cold_service = HotColdService()
    return _hot_cold_service

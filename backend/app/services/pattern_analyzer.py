"""
Phase 13-2: Statistical Pattern Analysis Service

Discovers recurring patterns in slot behavior:
- Time-of-day effects
- Weekly patterns (weekday vs weekend)
- Session duration correlations
- Bonus frequency clustering
- RTP trends and seasonality
- Volatility patterns
"""

import logging
import statistics
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import math

logger = logging.getLogger(__name__)


class PatternType(str, Enum):
    """Types of patterns"""
    TIME_OF_DAY = "time_of_day"
    DAY_OF_WEEK = "day_of_week"
    SESSION_DURATION = "session_duration"
    BONUS_CLUSTERING = "bonus_clustering"
    RTP_TREND = "rtp_trend"
    VOLATILITY_CYCLE = "volatility_cycle"
    WIN_DISTRIBUTION = "win_distribution"


@dataclass
class TimePattern:
    """Time-of-day pattern"""
    hour: int
    sample_count: int
    avg_rtp: float
    rtp_variance: float
    avg_bonus_frequency: float
    avg_win_multiplier: float
    confidence: float  # Based on sample size


@dataclass
class DayPattern:
    """Day-of-week pattern"""
    day_name: str
    day_index: int  # 0=Monday, 6=Sunday
    sample_count: int
    avg_rtp: float
    rtp_variance: float
    session_count: int
    avg_session_duration: float
    confidence: float


@dataclass
class BonusPattern:
    """Bonus frequency pattern"""
    average_spins_between_bonus: float
    variance: float
    min_spins: int
    max_spins: int
    clustering_score: float  # 0-1: how clustered bonuses are
    frequency_per_100spins: float
    most_common_interval: int
    confidence: float


@dataclass
class VolatilityPattern:
    """Volatility pattern analysis"""
    average_volatility: float
    volatility_variance: float
    trend: str  # "increasing", "decreasing", "stable"
    clustering: str  # "random", "daily", "weekly", "session-based"
    peak_volatility_hour: Optional[int]
    low_volatility_hour: Optional[int]
    confidence: float


@dataclass
class PatternSummary:
    """Overall pattern summary"""
    game_id: str
    period: str  # "1d", "7d", "30d", "90d"
    patterns: Dict[str, any] = field(default_factory=dict)
    confidence: float = 0.0
    sample_sessions: int = 0
    date_range: Tuple[datetime, datetime] = None
    significance_level: str = "none"  # "low", "medium", "high"


class PatternAnalyzer:
    """
    Comprehensive pattern analysis for slot games.
    Identifies recurring behaviors and trends.
    """

    def __init__(self):
        self.min_samples_for_pattern = 10  # Minimum samples for valid pattern
        self.min_confidence = 0.7  # Minimum confidence threshold

    async def analyze_time_patterns(
        self,
        sessions: List[Dict],
        period: str = "7d"
    ) -> Dict[int, TimePattern]:
        """
        Analyze patterns by hour of day.

        Args:
            sessions: List of session data dicts
            period: Analysis period

        Returns:
            Dictionary of hour -> TimePattern
        """
        logger.info(f"Analyzing time-of-day patterns for {len(sessions)} sessions")

        # Group by hour
        by_hour = {}
        for hour in range(24):
            by_hour[hour] = {
                'rtps': [],
                'bonuses': [],
                'multipliers': [],
                'count': 0
            }

        for session in sessions:
            try:
                start_time = session.get('start_time')
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time)

                hour = start_time.hour

                by_hour[hour]['rtps'].append(session.get('observed_rtp', 0))
                by_hour[hour]['bonuses'].append(session.get('bonus_frequency_per_100spins', 0))
                by_hour[hour]['multipliers'].append(session.get('avg_win_multiplier', 0))
                by_hour[hour]['count'] += 1
            except Exception as e:
                logger.warning(f"Error processing session for time pattern: {e}")
                continue

        # Calculate patterns
        patterns = {}
        for hour in range(24):
            data = by_hour[hour]

            if data['count'] >= self.min_samples_for_pattern:
                patterns[hour] = TimePattern(
                    hour=hour,
                    sample_count=data['count'],
                    avg_rtp=statistics.mean(data['rtps']) if data['rtps'] else 0,
                    rtp_variance=statistics.variance(data['rtps']) if len(data['rtps']) > 1 else 0,
                    avg_bonus_frequency=statistics.mean(data['bonuses']) if data['bonuses'] else 0,
                    avg_win_multiplier=statistics.mean(data['multipliers']) if data['multipliers'] else 0,
                    confidence=min(data['count'] / 50.0, 1.0)  # More samples = higher confidence
                )

        logger.info(f"✓ Identified {len(patterns)} time-of-day patterns")
        return patterns

    async def analyze_day_patterns(
        self,
        sessions: List[Dict],
        period: str = "7d"
    ) -> List[DayPattern]:
        """
        Analyze patterns by day of week.

        Args:
            sessions: List of session data
            period: Analysis period

        Returns:
            List of DayPattern for each day
        """
        logger.info(f"Analyzing day-of-week patterns for {len(sessions)} sessions")

        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        # Group by day
        by_day = {}
        for day_idx in range(7):
            by_day[day_idx] = {
                'rtps': [],
                'durations': [],
                'session_count': 0,
                'day_name': day_names[day_idx]
            }

        for session in sessions:
            try:
                start_time = session.get('start_time')
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time)

                day_idx = start_time.weekday()

                by_day[day_idx]['rtps'].append(session.get('observed_rtp', 0))
                by_day[day_idx]['durations'].append(session.get('session_duration_minutes', 0))
                by_day[day_idx]['session_count'] += 1
            except Exception as e:
                logger.warning(f"Error processing session for day pattern: {e}")
                continue

        # Calculate patterns
        patterns = []
        for day_idx in range(7):
            data = by_day[day_idx]

            if data['session_count'] >= self.min_samples_for_pattern:
                patterns.append(DayPattern(
                    day_name=data['day_name'],
                    day_index=day_idx,
                    sample_count=data['session_count'],
                    avg_rtp=statistics.mean(data['rtps']) if data['rtps'] else 0,
                    rtp_variance=statistics.variance(data['rtps']) if len(data['rtps']) > 1 else 0,
                    session_count=data['session_count'],
                    avg_session_duration=statistics.mean(data['durations']) if data['durations'] else 0,
                    confidence=min(data['session_count'] / 20.0, 1.0)
                ))

        logger.info(f"✓ Identified {len(patterns)} day-of-week patterns")
        return patterns

    async def analyze_bonus_patterns(
        self,
        sessions: List[Dict],
        period: str = "7d"
    ) -> BonusPattern:
        """
        Analyze bonus hit patterns.

        Args:
            sessions: List of session data
            period: Analysis period

        Returns:
            BonusPattern with clustering and frequency analysis
        """
        logger.info(f"Analyzing bonus patterns for {len(sessions)} sessions")

        spins_between_bonuses = []
        bonus_frequencies = []

        for session in sessions:
            try:
                total_spins = session.get('total_spins', 0)
                bonus_hits = session.get('bonus_hit_count', 0)

                if bonus_hits > 0 and total_spins > 0:
                    spins_per_bonus = total_spins / bonus_hits
                    spins_between_bonuses.append(int(spins_per_bonus))

                frequency = session.get('bonus_frequency_per_100spins', 0)
                if frequency > 0:
                    bonus_frequencies.append(frequency)
            except Exception as e:
                logger.warning(f"Error processing bonus pattern: {e}")
                continue

        if spins_between_bonuses:
            avg_spins = statistics.mean(spins_between_bonuses)
            variance = statistics.variance(spins_between_bonuses) if len(spins_between_bonuses) > 1 else 0

            # Calculate clustering score
            clustering_score = await self._calculate_clustering_score(spins_between_bonuses)

            # Find most common interval (mode)
            try:
                most_common = max(set(spins_between_bonuses), key=spins_between_bonuses.count)
            except:
                most_common = int(avg_spins)

            pattern = BonusPattern(
                average_spins_between_bonus=avg_spins,
                variance=variance,
                min_spins=min(spins_between_bonuses),
                max_spins=max(spins_between_bonuses),
                clustering_score=clustering_score,
                frequency_per_100spins=statistics.mean(bonus_frequencies) if bonus_frequencies else 0,
                most_common_interval=most_common,
                confidence=min(len(spins_between_bonuses) / 20.0, 1.0)
            )

            logger.info(f"✓ Bonus pattern: avg={avg_spins:.0f} spins, clustering={clustering_score:.2f}")
            return pattern

        logger.warning("Insufficient bonus data for pattern analysis")
        return None

    async def _calculate_clustering_score(self, intervals: List[int]) -> float:
        """
        Calculate how clustered bonuses are (0 = random, 1 = highly clustered).
        Uses coefficient of variation.
        """
        if len(intervals) < 2:
            return 0.0

        mean = statistics.mean(intervals)
        stdev = statistics.stdev(intervals)

        # Coefficient of variation
        cv = stdev / mean if mean > 0 else 0

        # Inverse: low CV = high clustering
        clustering = 1.0 / (1.0 + cv)
        return min(clustering, 1.0)

    async def analyze_volatility_patterns(
        self,
        sessions: List[Dict],
        period: str = "7d"
    ) -> VolatilityPattern:
        """
        Analyze volatility patterns over time.

        Args:
            sessions: List of session data
            period: Analysis period

        Returns:
            VolatilityPattern with trend and clustering
        """
        logger.info(f"Analyzing volatility patterns for {len(sessions)} sessions")

        volatilities = []
        volatilities_by_hour = {}

        for session in sessions:
            try:
                volatility = session.get('balance_volatility', 0)
                volatilities.append(volatility)

                start_time = session.get('start_time')
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time)

                hour = start_time.hour
                if hour not in volatilities_by_hour:
                    volatilities_by_hour[hour] = []
                volatilities_by_hour[hour].append(volatility)
            except Exception as e:
                logger.warning(f"Error processing volatility pattern: {e}")
                continue

        if volatilities:
            avg_volatility = statistics.mean(volatilities)
            variance = statistics.variance(volatilities) if len(volatilities) > 1 else 0

            # Detect trend (first half vs second half)
            mid_point = len(volatilities) // 2
            first_half_avg = statistics.mean(volatilities[:mid_point]) if mid_point > 0 else 0
            second_half_avg = statistics.mean(volatilities[mid_point:]) if mid_point < len(volatilities) else 0

            if second_half_avg > first_half_avg * 1.1:
                trend = "increasing"
            elif second_half_avg < first_half_avg * 0.9:
                trend = "decreasing"
            else:
                trend = "stable"

            # Find peak and low volatility hours
            hour_avgs = {
                hour: statistics.mean(vols) for hour, vols in volatilities_by_hour.items()
            }
            peak_hour = max(hour_avgs, key=hour_avgs.get) if hour_avgs else None
            low_hour = min(hour_avgs, key=hour_avgs.get) if hour_avgs else None

            # Determine clustering pattern
            if len(volatilities) >= 7:
                daily_variance = variance / avg_volatility if avg_volatility > 0 else 0
                if daily_variance > 0.5:
                    clustering = "session-based"
                else:
                    clustering = "daily"
            else:
                clustering = "random"

            pattern = VolatilityPattern(
                average_volatility=avg_volatility,
                volatility_variance=variance,
                trend=trend,
                clustering=clustering,
                peak_volatility_hour=peak_hour,
                low_volatility_hour=low_hour,
                confidence=min(len(volatilities) / 30.0, 1.0)
            )

            logger.info(f"✓ Volatility pattern: avg={avg_volatility:.2f}, trend={trend}")
            return pattern

        logger.warning("Insufficient volatility data")
        return None

    async def analyze_rtp_trends(
        self,
        sessions: List[Dict],
        game_rtp: float = 96.48,
        period: str = "7d"
    ) -> Dict:
        """
        Analyze RTP trends and seasonal patterns.

        Args:
            sessions: List of session data
            game_rtp: Theoretical RTP for comparison
            period: Analysis period

        Returns:
            Dictionary with RTP trend analysis
        """
        logger.info(f"Analyzing RTP trends for {len(sessions)} sessions")

        rtps = []
        timestamps = []

        for session in sessions:
            try:
                rtp = session.get('observed_rtp', 0)
                rtps.append(rtp)

                start_time = session.get('start_time')
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time)
                timestamps.append(start_time)
            except Exception as e:
                logger.warning(f"Error processing RTP: {e}")
                continue

        if rtps:
            avg_rtp = statistics.mean(rtps)
            variance = statistics.variance(rtps) if len(rtps) > 1 else 0

            # Compare to theoretical
            deviation = avg_rtp - game_rtp
            pct_deviation = (deviation / game_rtp * 100) if game_rtp > 0 else 0

            # Trend detection
            if len(rtps) >= 2:
                first_half = statistics.mean(rtps[:len(rtps)//2])
                second_half = statistics.mean(rtps[len(rtps)//2:])
                trend_direction = "up" if second_half > first_half else "down" if second_half < first_half else "stable"
            else:
                trend_direction = "stable"

            trend_strength = abs(deviation) / game_rtp if game_rtp > 0 else 0

            analysis = {
                "average_rtp": avg_rtp,
                "theoretical_rtp": game_rtp,
                "deviation_points": deviation,
                "deviation_percent": pct_deviation,
                "variance": variance,
                "std_dev": math.sqrt(variance) if variance > 0 else 0,
                "trend": trend_direction,
                "trend_strength": trend_strength,
                "min_rtp": min(rtps),
                "max_rtp": max(rtps),
                "sample_count": len(rtps),
                "confidence": min(len(rtps) / 30.0, 1.0),
            }

            # Determine significance
            if abs(pct_deviation) > 2:
                analysis["significance"] = "high"
            elif abs(pct_deviation) > 0.5:
                analysis["significance"] = "medium"
            else:
                analysis["significance"] = "low"

            logger.info(f"✓ RTP Analysis: avg={avg_rtp:.2f}, deviation={pct_deviation:+.2f}%, trend={trend_direction}")
            return analysis

        logger.warning("Insufficient RTP data")
        return {}

    async def comprehensive_analysis(
        self,
        game_id: str,
        sessions: List[Dict],
        game_rtp: float = 96.48,
        period: str = "7d"
    ) -> PatternSummary:
        """
        Perform comprehensive pattern analysis.

        Args:
            game_id: Game identifier
            sessions: List of session data
            game_rtp: Theoretical RTP
            period: Analysis period

        Returns:
            PatternSummary with all patterns
        """
        logger.info(f"Starting comprehensive pattern analysis for {game_id} ({period})")

        if not sessions:
            logger.warning(f"No sessions for comprehensive analysis")
            return PatternSummary(game_id=game_id, period=period)

        # Get timestamps for date range
        timestamps = []
        for session in sessions:
            try:
                start_time = session.get('start_time')
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time)
                timestamps.append(start_time)
            except:
                continue

        date_range = (min(timestamps), max(timestamps)) if timestamps else None

        # Run all analyses in parallel
        time_patterns = await self.analyze_time_patterns(sessions, period)
        day_patterns = await self.analyze_day_patterns(sessions, period)
        bonus_pattern = await self.analyze_bonus_patterns(sessions, period)
        volatility_pattern = await self.analyze_volatility_patterns(sessions, period)
        rtp_analysis = await self.analyze_rtp_trends(sessions, game_rtp, period)

        # Consolidate into summary
        patterns = {
            "time_of_day": {
                hour: {
                    "rtp": p.avg_rtp,
                    "bonus_frequency": p.avg_bonus_frequency,
                    "sample_count": p.sample_count,
                    "confidence": p.confidence
                }
                for hour, p in time_patterns.items()
            },
            "day_of_week": {
                p.day_name: {
                    "rtp": p.avg_rtp,
                    "variance": p.rtp_variance,
                    "sample_count": p.sample_count,
                    "confidence": p.confidence
                }
                for p in day_patterns
            },
            "bonus": bonus_pattern.__dict__ if bonus_pattern else {},
            "volatility": volatility_pattern.__dict__ if volatility_pattern else {},
            "rtp_trends": rtp_analysis
        }

        # Overall confidence
        confidences = [
            min(1.0, len(time_patterns) / 12),  # More hours = higher confidence
            min(1.0, len(day_patterns) / 7),  # More days = higher confidence
            bonus_pattern.confidence if bonus_pattern else 0,
            volatility_pattern.confidence if volatility_pattern else 0,
            rtp_analysis.get('confidence', 0)
        ]
        overall_confidence = statistics.mean([c for c in confidences if c > 0]) if confidences else 0

        # Determine significance level
        rtp_dev = abs(rtp_analysis.get('deviation_percent', 0))
        if rtp_dev > 2 or (bonus_pattern and bonus_pattern.clustering_score > 0.7):
            significance = "high"
        elif rtp_dev > 0.5 or (volatility_pattern and volatility_pattern.trend != "stable"):
            significance = "medium"
        else:
            significance = "low"

        summary = PatternSummary(
            game_id=game_id,
            period=period,
            patterns=patterns,
            confidence=overall_confidence,
            sample_sessions=len(sessions),
            date_range=date_range,
            significance_level=significance
        )

        logger.info(f"✓ Comprehensive analysis complete (confidence: {overall_confidence:.2f}, significance: {significance})")
        return summary

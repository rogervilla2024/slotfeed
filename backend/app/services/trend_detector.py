"""
Phase 13-2: Trend Detection Service

Detects trends, momentum, and directional patterns in time-series data:
- Moving averages (SMA, EMA)
- Trend lines and support/resistance
- Momentum indicators
- Seasonality and cycles
- Breakouts and reversals
"""

import logging
import statistics
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import math

logger = logging.getLogger(__name__)


class TrendDirection(str, Enum):
    """Trend direction"""
    STRONG_UP = "strong_up"
    UP = "up"
    WEAK_UP = "weak_up"
    NEUTRAL = "neutral"
    WEAK_DOWN = "weak_down"
    DOWN = "down"
    STRONG_DOWN = "strong_down"


class TrendStrength(str, Enum):
    """Trend strength"""
    VERY_WEAK = "very_weak"
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    VERY_STRONG = "very_strong"


@dataclass
class TrendIndicator:
    """Trend indicator result"""
    direction: TrendDirection
    strength: TrendStrength
    confidence: float  # 0-1
    slope: float  # Angle of trend line
    momentum: float  # Rate of change
    support_level: Optional[float] = None
    resistance_level: Optional[float] = None
    breakout_probability: float = 0.0
    reversal_probability: float = 0.0


@dataclass
class MovingAverages:
    """Moving average analysis"""
    sma_short: float  # 5-period SMA
    sma_long: float  # 20-period SMA
    ema_short: float  # 5-period EMA
    ema_long: float  # 20-period EMA
    difference: float  # SMA_short - SMA_long
    golden_cross: bool  # Short above long
    death_cross: bool  # Short below long


class TrendDetector:
    """
    Comprehensive trend detection for time-series data.
    Uses technical analysis principles adapted for slot metrics.
    """

    def __init__(self):
        self.min_points = 5  # Minimum data points for valid trend
        self.breakout_threshold = 1.5  # Standard deviations for breakout
        self.reversal_threshold = 0.5  # RSI threshold for reversal

    async def detect_trend(
        self,
        values: List[float],
        timestamps: Optional[List[datetime]] = None
    ) -> TrendIndicator:
        """
        Detect overall trend in time series.

        Args:
            values: List of metric values
            timestamps: Optional list of timestamps

        Returns:
            TrendIndicator with direction and strength
        """
        if len(values) < self.min_points:
            return TrendIndicator(
                direction=TrendDirection.NEUTRAL,
                strength=TrendStrength.VERY_WEAK,
                confidence=0.0,
                slope=0,
                momentum=0
            )

        # Calculate trend line (linear regression)
        slope, intercept = self._linear_regression(values)

        # Calculate momentum (rate of change)
        momentum = await self._calculate_momentum(values)

        # Calculate confidence based on R-squared
        confidence = await self._calculate_r_squared(values, slope, intercept)

        # Determine direction and strength
        direction = self._slope_to_direction(slope, momentum)
        strength = self._confidence_to_strength(confidence, abs(slope))

        # Find support and resistance
        support, resistance = self._find_support_resistance(values)

        # Check for breakouts and reversals
        breakout_prob = await self._calculate_breakout_probability(values, resistance)
        reversal_prob = await self._calculate_reversal_probability(values, slope)

        return TrendIndicator(
            direction=direction,
            strength=strength,
            confidence=min(confidence, 0.99),
            slope=slope,
            momentum=momentum,
            support_level=support,
            resistance_level=resistance,
            breakout_probability=breakout_prob,
            reversal_probability=reversal_prob
        )

    def _linear_regression(self, values: List[float]) -> Tuple[float, float]:
        """Calculate linear regression slope and intercept"""
        n = len(values)
        x = list(range(n))
        y = values

        mean_x = sum(x) / n
        mean_y = sum(y) / n

        numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        denominator = sum((x[i] - mean_x) ** 2 for i in range(n))

        if denominator == 0:
            return 0, mean_y

        slope = numerator / denominator
        intercept = mean_y - slope * mean_x

        return slope, intercept

    async def _calculate_momentum(self, values: List[float]) -> float:
        """Calculate momentum (ROC - Rate of Change)"""
        if len(values) < 2:
            return 0

        # Use last 5 points vs previous 5 points
        lookback = min(5, len(values) // 2)

        if len(values) < lookback * 2:
            recent = values[-1]
            previous = values[0]
        else:
            recent = statistics.mean(values[-lookback:])
            previous = statistics.mean(values[-lookback*2:-lookback])

        if previous == 0:
            return 0

        momentum = (recent - previous) / abs(previous)
        return momentum

    async def _calculate_r_squared(self, values: List[float], slope: float, intercept: float) -> float:
        """Calculate R-squared (coefficient of determination)"""
        n = len(values)
        y_mean = statistics.mean(values)

        # Sum of squares
        ss_tot = sum((y - y_mean) ** 2 for y in values)
        ss_res = sum((values[i] - (slope * i + intercept)) ** 2 for i in range(n))

        if ss_tot == 0:
            return 0

        r_squared = 1 - (ss_res / ss_tot)
        return max(0, min(1, r_squared))

    def _slope_to_direction(self, slope: float, momentum: float) -> TrendDirection:
        """Convert slope to trend direction"""
        if slope > 0.05 and momentum > 0.1:
            return TrendDirection.STRONG_UP
        elif slope > 0.02 and momentum > 0:
            return TrendDirection.UP
        elif slope > 0:
            return TrendDirection.WEAK_UP
        elif slope > -0.02 and momentum > -0.05:
            return TrendDirection.NEUTRAL
        elif slope > -0.05:
            return TrendDirection.WEAK_DOWN
        elif momentum < -0.1:
            return TrendDirection.STRONG_DOWN
        else:
            return TrendDirection.DOWN

    def _confidence_to_strength(self, confidence: float, slope_magnitude: float) -> TrendStrength:
        """Convert confidence and slope to trend strength"""
        combined = confidence * slope_magnitude * 100

        if combined > 3:
            return TrendStrength.VERY_STRONG
        elif combined > 2:
            return TrendStrength.STRONG
        elif combined > 1:
            return TrendStrength.MODERATE
        elif combined > 0.5:
            return TrendStrength.WEAK
        else:
            return TrendStrength.VERY_WEAK

    def _find_support_resistance(self, values: List[float]) -> Tuple[Optional[float], Optional[float]]:
        """Find support and resistance levels"""
        if len(values) < 3:
            return None, None

        # Use pivot points method
        high = max(values)
        low = min(values)
        close = values[-1]

        pivot = (high + low + close) / 3
        support = 2 * pivot - high
        resistance = 2 * pivot - low

        return support, resistance

    async def _calculate_breakout_probability(self, values: List[float], resistance: Optional[float]) -> float:
        """Calculate probability of price breakout"""
        if not values or resistance is None:
            return 0

        recent_avg = statistics.mean(values[-3:]) if len(values) >= 3 else values[-1]
        distance_to_resistance = abs(resistance - recent_avg)

        # If close to resistance, higher breakout probability
        if distance_to_resistance < statistics.stdev(values) / 2:
            return 0.7
        elif distance_to_resistance < statistics.stdev(values):
            return 0.5
        else:
            return 0.2

    async def _calculate_reversal_probability(self, values: List[float], slope: float) -> float:
        """Calculate probability of trend reversal"""
        if len(values) < 5:
            return 0

        # RSI-like calculation
        gains = 0
        losses = 0

        for i in range(1, len(values)):
            change = values[i] - values[i-1]
            if change > 0:
                gains += change
            else:
                losses += abs(change)

        if gains + losses == 0:
            return 0.5

        gain_ratio = gains / (gains + losses)

        # If trend is extreme (very steep), higher reversal probability
        if abs(slope) > 0.1:
            return 0.6
        elif abs(slope) > 0.05:
            return 0.4
        else:
            return 0.2

    async def calculate_moving_averages(
        self,
        values: List[float]
    ) -> MovingAverages:
        """Calculate moving averages (SMA and EMA)"""
        n = len(values)

        # SMA calculations
        sma_short = statistics.mean(values[-5:]) if n >= 5 else statistics.mean(values)
        sma_long = statistics.mean(values[-20:]) if n >= 20 else statistics.mean(values)

        # EMA calculations (with alpha = 2/(n+1))
        ema_short = self._calculate_ema(values, 5)
        ema_long = self._calculate_ema(values, 20)

        difference = sma_short - sma_long
        golden_cross = sma_short > sma_long
        death_cross = sma_short < sma_long

        return MovingAverages(
            sma_short=sma_short,
            sma_long=sma_long,
            ema_short=ema_short,
            ema_long=ema_long,
            difference=difference,
            golden_cross=golden_cross,
            death_cross=death_cross
        )

    def _calculate_ema(self, values: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(values) < period:
            return statistics.mean(values)

        alpha = 2 / (period + 1)
        ema = values[0]

        for i in range(1, len(values)):
            ema = values[i] * alpha + ema * (1 - alpha)

        return ema

    async def detect_seasonality(
        self,
        values: List[float],
        period: int = 7
    ) -> Dict:
        """
        Detect seasonal patterns (weekly cycle, etc).

        Args:
            values: List of values
            period: Period length (default 7 for weekly)

        Returns:
            Seasonality analysis
        """
        if len(values) < period * 2:
            return {"detected": False, "confidence": 0}

        # Group by periods
        by_period = {}
        for i in range(len(values)):
            period_idx = i % period
            if period_idx not in by_period:
                by_period[period_idx] = []
            by_period[period_idx].append(values[i])

        # Calculate variance between periods
        period_means = []
        for i in range(period):
            if i in by_period:
                period_means.append(statistics.mean(by_period[i]))

        overall_mean = statistics.mean(values)
        variance_between = sum((m - overall_mean) ** 2 for m in period_means) / period
        variance_within = statistics.variance(values) if len(values) > 1 else 0

        # F-ratio test for seasonality
        if variance_within == 0:
            f_ratio = 0
        else:
            f_ratio = variance_between / variance_within

        # Seasonality detected if F-ratio > 1.5
        detected = f_ratio > 1.5
        confidence = min(f_ratio / 5.0, 1.0)  # Scale confidence

        return {
            "detected": detected,
            "confidence": confidence,
            "f_ratio": f_ratio,
            "period": period,
            "period_means": period_means
        }

    async def forecast_next_value(
        self,
        values: List[float],
        periods_ahead: int = 1
    ) -> Dict:
        """
        Simple trend-based forecast.

        Args:
            values: Historical values
            periods_ahead: How many periods to forecast

        Returns:
            Forecast with confidence interval
        """
        if len(values) < 2:
            return {"forecast": values[-1] if values else 0, "confidence": 0}

        # Get trend
        slope, intercept = self._linear_regression(values)
        r_squared = await self._calculate_r_squared(values, slope, intercept)

        # Forecast
        n = len(values)
        next_x = n + periods_ahead
        forecast = slope * next_x + intercept

        # Confidence interval (95%)
        residuals = [values[i] - (slope * i + intercept) for i in range(n)]
        std_error = statistics.stdev(residuals) if len(residuals) > 1 else 0
        margin_of_error = 1.96 * std_error  # 95% confidence

        return {
            "forecast": forecast,
            "lower_bound": forecast - margin_of_error,
            "upper_bound": forecast + margin_of_error,
            "confidence": min(r_squared, 0.95),
            "trend_strength": abs(slope)
        }

    def get_model_info(self) -> Dict:
        """Get trend detector model info"""
        return {
            "type": "Technical Analysis + Linear Regression",
            "min_points": self.min_points,
            "breakout_threshold": self.breakout_threshold,
            "reversal_threshold": self.reversal_threshold,
            "methods": [
                "Linear Regression",
                "Moving Averages (SMA, EMA)",
                "Support/Resistance Levels",
                "Momentum (ROC)",
                "Seasonality Detection"
            ]
        }

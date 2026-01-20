"""
Pydantic schemas for Hot/Cold Slot Indicator API

Provides schemas for:
- Slot heat score calculation
- Hot/Cold status tracking
- Historical trend analysis
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class HotColdStatus(str, Enum):
    """Slot heat status classification."""
    HOT = "hot"
    NEUTRAL = "neutral"
    COLD = "cold"


class TrendDirection(str, Enum):
    """Trend direction for slot performance."""
    HEATING = "heating"
    COOLING = "cooling"
    STABLE = "stable"


# ============= Core Schemas =============

class HotColdMetrics(BaseModel):
    """Core metrics used for hot/cold calculation."""
    theoretical_rtp: float = Field(..., description="Theoretical RTP from game data")
    observed_rtp: float = Field(..., description="Observed RTP from recent sessions")
    rtp_difference: float = Field(..., description="Difference between observed and theoretical RTP")

    sample_sessions: int = Field(0, ge=0, description="Number of sessions in sample")
    total_spins: int = Field(0, ge=0, description="Total spins in sample period")
    total_wagered: float = Field(0, ge=0, description="Total amount wagered")
    total_won: float = Field(0, ge=0, description="Total amount won")

    recent_big_wins: int = Field(0, ge=0, description="Big wins in period")
    avg_big_wins: float = Field(0, ge=0, description="Historical average big wins")
    big_win_ratio: float = Field(0, ge=0, description="Recent vs average big win ratio")


class HotColdScore(BaseModel):
    """Calculated hot/cold score for a slot."""
    game_id: str
    game_name: Optional[str] = None
    game_slug: Optional[str] = None
    provider_name: Optional[str] = None

    status: HotColdStatus
    score: int = Field(..., ge=-100, le=100, description="Score from -100 (coldest) to +100 (hottest)")
    heat_score: float = Field(..., ge=0, le=1, description="Normalized heat score 0-1")

    metrics: HotColdMetrics
    trend: TrendDirection
    confidence: float = Field(..., ge=0, le=1, description="Confidence level based on sample size")

    period_hours: int = Field(24, description="Analysis period in hours")
    last_updated: datetime


class HotColdHistoryEntry(BaseModel):
    """Historical hot/cold record."""
    id: str
    game_id: str
    recorded_at: datetime
    period_hours: int
    score: int
    status: HotColdStatus
    observed_rtp: Optional[float] = None
    theoretical_rtp: Optional[float] = None
    sample_sessions: Optional[int] = None

    class Config:
        from_attributes = True


# ============= Request/Response Schemas =============

class HotColdCalculateRequest(BaseModel):
    """Request to calculate hot/cold for a game."""
    game_id: str
    period_hours: int = Field(24, ge=1, le=168, description="Analysis period (1-168 hours)")
    include_history: bool = Field(False, description="Include historical data points")


class HotColdResponse(BaseModel):
    """Response with hot/cold score for a single game."""
    score: HotColdScore
    history: Optional[List[HotColdHistoryEntry]] = None


class HotColdListResponse(BaseModel):
    """Response listing hot/cold scores for multiple games."""
    items: List[HotColdScore]
    total: int
    hot_count: int
    cold_count: int
    neutral_count: int


class HottestSlotsResponse(BaseModel):
    """Response listing the hottest slots."""
    items: List[HotColdScore]
    period_hours: int
    generated_at: datetime


class ColdestSlotsResponse(BaseModel):
    """Response listing the coldest slots."""
    items: List[HotColdScore]
    period_hours: int
    generated_at: datetime


# ============= Trend Analysis Schemas =============

class TrendDataPoint(BaseModel):
    """Single data point in trend analysis."""
    timestamp: datetime
    score: int
    observed_rtp: Optional[float] = None
    big_wins: int = 0


class SlotTrendAnalysis(BaseModel):
    """Trend analysis for a slot over time."""
    game_id: str
    game_name: Optional[str] = None
    current_score: int
    current_status: HotColdStatus
    trend_direction: TrendDirection
    trend_strength: float = Field(..., ge=0, le=1, description="Strength of the trend")
    data_points: List[TrendDataPoint]
    analysis_period_hours: int
    prediction: Optional[str] = None


# ============= Streamer-Specific Schemas =============

class StreamerSlotPerformance(BaseModel):
    """A streamer's performance on a specific slot."""
    streamer_id: str
    streamer_name: Optional[str] = None
    game_id: str
    game_name: Optional[str] = None

    sessions_played: int
    total_wagered: float
    total_won: float
    observed_rtp: float
    theoretical_rtp: float
    rtp_luck: float  # observed - theoretical

    big_wins: int
    biggest_multiplier: Optional[float] = None

    personal_status: HotColdStatus
    personal_score: int


class StreamerHotColdSummary(BaseModel):
    """Summary of hot/cold slots for a streamer."""
    streamer_id: str
    streamer_name: Optional[str] = None
    hottest_slots: List[StreamerSlotPerformance]
    coldest_slots: List[StreamerSlotPerformance]
    luckiest_slot: Optional[StreamerSlotPerformance] = None
    unluckiest_slot: Optional[StreamerSlotPerformance] = None


# ============= Configuration Schema =============

class HotColdConfig(BaseModel):
    """Configuration for hot/cold calculations."""
    # Score thresholds
    hot_threshold: int = Field(25, description="Score above this is considered HOT")
    cold_threshold: int = Field(-25, description="Score below this is considered COLD")

    # Weight factors
    rtp_weight: float = Field(0.5, ge=0, le=1, description="Weight of RTP difference in score")
    big_win_weight: float = Field(0.3, ge=0, le=1, description="Weight of big win frequency")
    trend_weight: float = Field(0.2, ge=0, le=1, description="Weight of recent trend")

    # Minimum samples
    min_sessions: int = Field(5, ge=1, description="Minimum sessions for valid calculation")
    min_spins: int = Field(1000, ge=100, description="Minimum spins for valid calculation")

    # RTP deviation thresholds
    max_rtp_deviation: float = Field(5.0, description="Max expected RTP deviation (%)")

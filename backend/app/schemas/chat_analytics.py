"""
Pydantic schemas for Chat Analytics API

Provides schemas for:
- Chat message processing
- Chat analytics buckets (5-minute aggregations)
- Hype moment detection and tracking
- Sentiment analysis results
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class SentimentLevel(str, Enum):
    """Sentiment classification levels."""
    VERY_NEGATIVE = "very_negative"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    POSITIVE = "positive"
    VERY_POSITIVE = "very_positive"


class HypeTriggerType(str, Enum):
    """Types of events that can trigger a hype moment."""
    BIG_WIN = "big_win"
    CHAT_SPIKE = "chat_spike"
    VIEWER_SPIKE = "viewer_spike"
    EMOTE_SPAM = "emote_spam"
    BONUS_TRIGGER = "bonus_trigger"
    JACKPOT = "jackpot"
    MANUAL = "manual"


# ============= Chat Message Schemas =============

class ChatMessage(BaseModel):
    """Represents a single chat message."""
    id: str
    session_id: str
    username: str
    message: str
    timestamp: datetime
    is_subscriber: bool = False
    is_moderator: bool = False
    emotes: List[str] = Field(default_factory=list)
    badges: List[str] = Field(default_factory=list)


class ChatMessageBatch(BaseModel):
    """Batch of chat messages for processing."""
    session_id: str
    messages: List[ChatMessage]


# ============= Chat Analytics Schemas =============

class ChatAnalyticsBucketBase(BaseModel):
    """Base schema for chat analytics bucket."""
    session_id: str
    bucket_start: datetime
    bucket_end: datetime


class ChatAnalyticsBucketCreate(ChatAnalyticsBucketBase):
    """Schema for creating a chat analytics bucket."""
    message_count: int = Field(0, ge=0)
    unique_chatters: int = Field(0, ge=0)
    emote_count: int = Field(0, ge=0)
    sentiment_score: Optional[float] = Field(None, ge=-1, le=1)
    hype_score: Optional[float] = Field(None, ge=0, le=1)
    top_emotes: Optional[Dict[str, int]] = None
    language_distribution: Optional[Dict[str, int]] = None


class ChatAnalyticsBucketResponse(ChatAnalyticsBucketBase):
    """Response schema for chat analytics bucket."""
    id: str
    message_count: int
    unique_chatters: int
    emote_count: int
    sentiment_score: Optional[float] = None
    hype_score: Optional[float] = None
    top_emotes: Optional[Dict[str, int]] = None
    language_distribution: Optional[Dict[str, int]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatAnalyticsSessionStats(BaseModel):
    """Aggregated chat statistics for a session."""
    session_id: str
    total_messages: int = 0
    unique_chatters: int = 0
    total_emotes: int = 0
    avg_sentiment: Optional[float] = None
    peak_hype_score: Optional[float] = None
    peak_messages_per_minute: int = 0
    top_emotes: Dict[str, int] = Field(default_factory=dict)
    language_distribution: Dict[str, int] = Field(default_factory=dict)
    hype_moments_count: int = 0


class ChatAnalyticsListResponse(BaseModel):
    """Response for listing chat analytics buckets."""
    items: List[ChatAnalyticsBucketResponse]
    total: int
    session_id: str


# ============= Hype Moment Schemas =============

class HypeMomentBase(BaseModel):
    """Base schema for hype moment."""
    session_id: str
    detected_at: datetime
    trigger_type: HypeTriggerType


class HypeMomentCreate(HypeMomentBase):
    """Schema for creating a hype moment."""
    hype_score: Optional[float] = Field(None, ge=0, le=1)
    related_big_win_id: Optional[str] = None
    chat_velocity: Optional[int] = Field(None, ge=0, description="Messages per second")
    viewer_spike: Optional[int] = Field(None, description="Viewer count increase")
    clip_url: Optional[str] = None


class HypeMomentResponse(HypeMomentBase):
    """Response schema for hype moment."""
    id: str
    hype_score: Optional[float] = None
    related_big_win_id: Optional[str] = None
    chat_velocity: Optional[int] = None
    viewer_spike: Optional[int] = None
    clip_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HypeMomentListResponse(BaseModel):
    """Response for listing hype moments."""
    items: List[HypeMomentResponse]
    total: int
    session_id: Optional[str] = None


# ============= Sentiment Analysis Schemas =============

class SentimentAnalysisResult(BaseModel):
    """Result of sentiment analysis on text."""
    text: str
    score: float = Field(..., ge=-1, le=1, description="Sentiment score from -1 (negative) to 1 (positive)")
    level: SentimentLevel
    confidence: float = Field(..., ge=0, le=1)


class SentimentBatchResult(BaseModel):
    """Result of sentiment analysis on a batch of messages."""
    session_id: str
    bucket_start: datetime
    bucket_end: datetime
    average_sentiment: float
    sentiment_distribution: Dict[str, int]
    message_count: int


# ============= Real-time Chat Analytics Schemas =============

class LiveChatStats(BaseModel):
    """Real-time chat statistics for WebSocket updates."""
    session_id: str
    streamer_id: str
    timestamp: datetime
    messages_per_minute: int = 0
    unique_chatters_5min: int = 0
    current_sentiment: Optional[float] = None
    current_hype_score: Optional[float] = None
    trending_emotes: List[str] = Field(default_factory=list)
    is_hype_moment: bool = False


class ChatActivitySpike(BaseModel):
    """Detected spike in chat activity."""
    session_id: str
    detected_at: datetime
    spike_type: str  # "message_velocity", "emote_spam", "unique_chatters"
    baseline_value: float
    spike_value: float
    increase_percentage: float


# ============= Emote Statistics Schemas =============

class EmoteStats(BaseModel):
    """Statistics for emote usage."""
    emote_name: str
    count: int
    percentage: float
    first_seen: datetime
    last_seen: datetime


class SessionEmoteStats(BaseModel):
    """Emote statistics for a session."""
    session_id: str
    total_emotes: int
    unique_emotes: int
    top_emotes: List[EmoteStats]
    emotes_per_minute: float


# ============= Chat Analytics Configuration =============

class ChatAnalyticsConfig(BaseModel):
    """Configuration for chat analytics processing."""
    bucket_size_minutes: int = Field(5, ge=1, le=60)
    hype_threshold: float = Field(0.7, ge=0, le=1)
    sentiment_enabled: bool = True
    language_detection_enabled: bool = True
    emote_tracking_enabled: bool = True
    spike_detection_multiplier: float = Field(2.0, ge=1.0, description="Multiplier over baseline to detect spike")

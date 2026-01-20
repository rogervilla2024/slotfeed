"""
Alert schemas for API request/response validation.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class AlertType(str, Enum):
    """Types of alerts."""
    BIG_WIN = "big_win"
    STREAMER_LIVE = "streamer_live"
    HOT_SLOT = "hot_slot"


class NotificationChannel(str, Enum):
    """Available notification channels."""
    TELEGRAM = "telegram"
    DISCORD = "discord"
    EMAIL = "email"


class AlertConditions(BaseModel):
    """Conditions for triggering an alert."""
    streamer_ids: Optional[List[str]] = Field(
        None,
        description="List of streamer IDs to watch. None = all streamers"
    )
    game_ids: Optional[List[str]] = Field(
        None,
        description="List of game IDs to watch. None = all games"
    )
    min_multiplier: Optional[float] = Field(
        None,
        ge=1.0,
        description="Minimum multiplier for big win alerts"
    )
    min_tier: Optional[str] = Field(
        None,
        description="Minimum tier for big win alerts (big, mega, ultra, legendary)"
    )


class AlertRuleBase(BaseModel):
    """Base schema for alert rules."""
    type: AlertType
    conditions: AlertConditions = Field(default_factory=AlertConditions)
    channels: List[NotificationChannel] = Field(
        default=[NotificationChannel.TELEGRAM],
        description="Channels to send notifications through"
    )
    is_active: bool = True


class AlertRuleCreate(AlertRuleBase):
    """Schema for creating an alert rule."""
    pass


class AlertRuleUpdate(BaseModel):
    """Schema for updating an alert rule."""
    conditions: Optional[AlertConditions] = None
    channels: Optional[List[NotificationChannel]] = None
    is_active: Optional[bool] = None


class AlertRuleResponse(AlertRuleBase):
    """Schema for alert rule response."""
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class TelegramLinkRequest(BaseModel):
    """Request to link a Telegram account."""
    verification_code: str = Field(
        ...,
        min_length=6,
        max_length=6,
        description="6-character verification code from the bot"
    )


class TelegramLinkResponse(BaseModel):
    """Response after linking Telegram."""
    success: bool
    chat_id: Optional[str] = None
    username: Optional[str] = None
    message: str


class NotificationHistoryItem(BaseModel):
    """A single notification in the history."""
    id: str
    type: AlertType
    channel: NotificationChannel
    delivered_at: datetime
    success: bool
    error: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class NotificationHistoryResponse(BaseModel):
    """Response containing notification history."""
    items: List[NotificationHistoryItem]
    total: int
    page: int
    per_page: int


class AlertStatsResponse(BaseModel):
    """Statistics about user's alerts."""
    total_rules: int
    active_rules: int
    notifications_sent_24h: int
    notifications_sent_7d: int
    notifications_sent_30d: int
    channels_configured: List[NotificationChannel]

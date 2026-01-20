from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Platform(str, Enum):
    KICK = "kick"
    TWITCH = "twitch"
    YOUTUBE = "youtube"


class LifetimeStats(BaseModel):
    total_sessions: int = 0
    total_hours_streamed: float = 0
    total_wagered: float = 0
    total_won: float = 0
    biggest_win: float = 0
    biggest_multiplier: float = 0
    average_rtp: float = 0


class StreamerBase(BaseModel):
    username: str
    display_name: str
    platform: Platform
    platform_id: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class StreamerCreate(StreamerBase):
    pass


class StreamerResponse(StreamerBase):
    id: str
    follower_count: int = 0
    is_live: bool = False
    lifetime_stats: LifetimeStats = Field(default_factory=LifetimeStats)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StreamerListResponse(BaseModel):
    streamers: List[StreamerResponse]
    total: int
    skip: int
    limit: int

"""Pydantic schemas for GameContent API responses"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GameContentBase(BaseModel):
    """Base schema for game content"""

    overview: Optional[str] = Field(None, description="50-75 word game overview")
    rtp_explanation: Optional[str] = Field(
        None, description="75-100 word RTP explanation"
    )
    volatility_analysis: Optional[str] = Field(
        None, description="75-100 word volatility analysis"
    )
    bonus_features: Optional[str] = Field(
        None, description="100-125 word bonus features guide"
    )
    strategies: Optional[str] = Field(
        None, description="75-100 word winning strategies"
    )
    streamer_insights: Optional[str] = Field(
        None, description="25-50 word streamer insights"
    )
    meta_description: Optional[str] = Field(
        None, max_length=160, description="SEO meta description (160 char max)"
    )
    focus_keywords: Optional[List[str]] = Field(
        default=None, description="Array of SEO keywords"
    )


class GameContentCreate(GameContentBase):
    """Schema for creating game content"""

    game_id: str = Field(..., description="Game ID")


class GameContentUpdate(BaseModel):
    """Schema for updating game content"""

    overview: Optional[str] = None
    rtp_explanation: Optional[str] = None
    volatility_analysis: Optional[str] = None
    bonus_features: Optional[str] = None
    strategies: Optional[str] = None
    streamer_insights: Optional[str] = None
    meta_description: Optional[str] = None
    focus_keywords: Optional[List[str]] = None
    is_published: Optional[bool] = None


class GameContentResponse(GameContentBase):
    """Schema for API responses"""

    game_id: str
    is_published: bool = False
    generated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GameContentDetailResponse(GameContentResponse):
    """Detailed response with full content"""

    pass

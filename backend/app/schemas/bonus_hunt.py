"""
Pydantic schemas for Bonus Hunt API
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class BonusHuntStatus(str, Enum):
    """Status of a bonus hunt."""
    COLLECTING = "collecting"
    OPENING = "opening"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============= Entry Schemas =============

class BonusHuntEntryBase(BaseModel):
    """Base schema for bonus hunt entry."""
    game_id: str
    bet_amount: float = Field(..., gt=0, description="Bet amount for this bonus")


class BonusHuntEntryCreate(BonusHuntEntryBase):
    """Schema for creating a bonus hunt entry."""
    pass


class BonusHuntEntryUpdate(BaseModel):
    """Schema for updating a bonus hunt entry."""
    bet_amount: Optional[float] = Field(None, gt=0)
    payout: Optional[float] = Field(None, ge=0)
    multiplier: Optional[float] = Field(None, ge=0)
    screenshot_url: Optional[str] = None


class BonusHuntEntryOpen(BaseModel):
    """Schema for opening a bonus hunt entry."""
    payout: float = Field(..., ge=0, description="Final payout amount")
    multiplier: Optional[float] = Field(None, ge=0, description="Win multiplier (optional, will be calculated if not provided)")
    screenshot_url: Optional[str] = None


class BonusHuntEntryResponse(BonusHuntEntryBase):
    """Response schema for bonus hunt entry."""
    id: str
    bonus_hunt_id: str
    position: int
    is_opened: bool
    opened_at: Optional[datetime] = None
    payout: Optional[float] = None
    multiplier: Optional[float] = None
    screenshot_url: Optional[str] = None
    game_name: Optional[str] = None
    game_slug: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Bonus Hunt Schemas =============

class BonusHuntBase(BaseModel):
    """Base schema for bonus hunt."""
    session_id: str
    streamer_id: str


class BonusHuntCreate(BaseModel):
    """Schema for creating a bonus hunt."""
    session_id: str
    streamer_id: str


class BonusHuntUpdate(BaseModel):
    """Schema for updating a bonus hunt."""
    status: Optional[BonusHuntStatus] = None


class BonusHuntStats(BaseModel):
    """Statistics for a bonus hunt."""
    total_cost: float = 0
    total_payout: float = 0
    profit_loss: float = 0
    roi_percentage: Optional[float] = None
    bonus_count: int = 0
    bonuses_opened: int = 0
    bonuses_remaining: int = 0
    best_multiplier: Optional[float] = None
    worst_multiplier: Optional[float] = None
    avg_multiplier: Optional[float] = None
    current_avg_needed: Optional[float] = None  # Average multiplier needed to break even


class BonusHuntResponse(BaseModel):
    """Response schema for bonus hunt."""
    id: str
    session_id: str
    streamer_id: str
    streamer_name: Optional[str] = None
    status: str
    started_at: datetime
    opening_started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    stats: BonusHuntStats
    entries: List[BonusHuntEntryResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BonusHuntSummary(BaseModel):
    """Summary schema for bonus hunt list."""
    id: str
    streamer_id: str
    streamer_name: Optional[str] = None
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_cost: float
    total_payout: float
    roi_percentage: Optional[float] = None
    bonus_count: int
    bonuses_opened: int

    class Config:
        from_attributes = True


class BonusHuntListResponse(BaseModel):
    """Response for listing bonus hunts."""
    items: List[BonusHuntSummary]
    total: int
    page: int
    limit: int
    has_more: bool


# ============= Action Schemas =============

class StartOpeningRequest(BaseModel):
    """Request to start opening bonuses."""
    pass


class AddEntryRequest(BonusHuntEntryCreate):
    """Request to add an entry to a bonus hunt."""
    pass


class OpenEntryRequest(BaseModel):
    """Request to open a specific entry."""
    payout: float = Field(..., ge=0)
    screenshot_url: Optional[str] = None


class BulkAddEntriesRequest(BaseModel):
    """Request to add multiple entries at once."""
    entries: List[BonusHuntEntryCreate]


class BonusHuntLeaderboard(BaseModel):
    """Leaderboard entry for bonus hunts."""
    streamer_id: str
    streamer_name: str
    total_hunts: int
    total_cost: float
    total_payout: float
    total_profit: float
    avg_roi: float
    best_roi: float
    total_bonuses: int
    best_multiplier: float

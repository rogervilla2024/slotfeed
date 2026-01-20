from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SessionStatus(str, Enum):
    LIVE = "live"
    ENDED = "ended"


class SessionBase(BaseModel):
    streamer_id: str
    start_time: datetime
    start_balance: float


class SessionCreate(SessionBase):
    stream_url: Optional[str] = None


class SessionResponse(SessionBase):
    id: str
    end_time: Optional[datetime] = None
    current_balance: float
    peak_balance: float
    lowest_balance: float
    total_wagered: float = 0
    status: SessionStatus
    stream_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: List[SessionResponse]
    total: int
    skip: int
    limit: int


class BalanceEventBase(BaseModel):
    session_id: str
    game_session_id: Optional[str] = None
    balance: float
    bet: Optional[float] = None
    win: Optional[float] = None
    multiplier: Optional[float] = None
    confidence: float


class BalanceEventCreate(BalanceEventBase):
    pass


class BalanceEventResponse(BalanceEventBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True


class BigWinBase(BaseModel):
    session_id: str
    game_id: str
    streamer_id: str
    bet_amount: float
    win_amount: float
    multiplier: float


class BigWinCreate(BigWinBase):
    screenshot_url: Optional[str] = None


class BigWinResponse(BigWinBase):
    id: str
    screenshot_url: Optional[str] = None
    timestamp: datetime
    is_verified: bool = False

    class Config:
        from_attributes = True

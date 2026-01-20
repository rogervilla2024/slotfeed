from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class Volatility(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class ProviderBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None


class ProviderResponse(ProviderBase):
    id: str
    game_count: int = 0

    class Config:
        from_attributes = True


class GameBase(BaseModel):
    name: str
    slug: str
    provider_id: str
    rtp: float
    volatility: Volatility
    max_multiplier: float
    thumbnail_url: Optional[str] = None


class GameCreate(GameBase):
    pass


class GameResponse(GameBase):
    id: str
    provider: Optional[ProviderResponse] = None
    ocr_template_id: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class GameListResponse(BaseModel):
    games: List[GameResponse]
    total: int
    skip: int
    limit: int


class HotColdResponse(BaseModel):
    game_id: str
    game: GameResponse
    status: str  # hot, neutral, cold
    score: float
    recent_rtp: float
    sample_size: int

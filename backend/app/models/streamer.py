from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.big_win import BigWin
    from app.models.bonus_hunt import BonusHunt


class Streamer(Base, TimestampMixin):
    __tablename__ = "streamers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    kick_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    twitch_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    youtube_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)

    # Social links
    kick_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    twitch_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    youtube_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    discord_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Lifetime statistics
    total_wagered: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_won: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    net_profit_loss: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    lifetime_rtp: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    total_stream_hours: Mapped[int] = mapped_column(Integer, default=0)
    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    biggest_win: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    biggest_multiplier: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    # Meta
    followers_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_viewers: Mapped[int] = mapped_column(Integer, default=0)
    sponsor_info: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    tier: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_live_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="streamer")
    big_wins: Mapped[List["BigWin"]] = relationship("BigWin", back_populates="streamer")
    bonus_hunts: Mapped[List["BonusHunt"]] = relationship("BonusHunt", back_populates="streamer")

    def __repr__(self) -> str:
        return f"<Streamer(username={self.username}, tier={self.tier})>"

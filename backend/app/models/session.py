from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.streamer import Streamer
    from app.models.game_session import GameSession
    from app.models.big_win import BigWin


class Session(Base, TimestampMixin):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    streamer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("streamers.id"), nullable=False
    )
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    platform_session_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Financial summary
    starting_balance: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    ending_balance: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    total_wagered: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_won: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    net_profit_loss: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    session_rtp: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    # Stats
    biggest_win: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    biggest_multiplier: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    bonus_count: Mapped[int] = mapped_column(Integer, default=0)

    # Viewer stats
    peak_viewers: Mapped[int] = mapped_column(Integer, default=0)
    avg_viewers: Mapped[int] = mapped_column(Integer, default=0)

    # Meta
    vod_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_live: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    streamer: Mapped["Streamer"] = relationship("Streamer", back_populates="sessions")
    game_sessions: Mapped[List["GameSession"]] = relationship(
        "GameSession", back_populates="session", cascade="all, delete-orphan"
    )
    big_wins: Mapped[List["BigWin"]] = relationship("BigWin", back_populates="session")

    def __repr__(self) -> str:
        return f"<Session(streamer_id={self.streamer_id}, is_live={self.is_live})>"

from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import TimestampMixin


class StreamerGameStats(Base, TimestampMixin):
    __tablename__ = "streamer_game_stats"

    streamer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("streamers.id"), primary_key=True
    )
    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id"), primary_key=True
    )

    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    total_wagered: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_won: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    net_profit_loss: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    observed_rtp: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    biggest_win: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    biggest_multiplier: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    last_played_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<StreamerGameStats(streamer_id={self.streamer_id}, game_id={self.game_id})>"

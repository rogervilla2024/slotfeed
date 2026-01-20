from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.game import Game


class GameSession(Base, TimestampMixin):
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id"), nullable=False
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    starting_balance: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    ending_balance: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    total_wagered: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_won: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    net_profit_loss: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    game_rtp: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    spins_count: Mapped[int] = mapped_column(Integer, default=0)
    bonus_count: Mapped[int] = mapped_column(Integer, default=0)
    biggest_win: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    biggest_multiplier: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    avg_bet: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="game_sessions")
    game: Mapped["Game"] = relationship("Game", back_populates="game_sessions")

    def __repr__(self) -> str:
        return f"<GameSession(session_id={self.session_id}, game_id={self.game_id})>"

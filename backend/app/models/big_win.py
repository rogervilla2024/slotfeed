from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import generate_uuid

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.streamer import Streamer
    from app.models.game import Game


class BigWin(Base):
    __tablename__ = "big_wins"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id"), nullable=False
    )
    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id"), nullable=False
    )
    streamer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("streamers.id"), nullable=False
    )

    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    multiplier: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    bet_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    balance_before: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    balance_after: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)

    screenshot_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clip_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="big_wins")
    streamer: Mapped["Streamer"] = relationship("Streamer", back_populates="big_wins")
    game: Mapped["Game"] = relationship("Game", back_populates="big_wins")

    def __repr__(self) -> str:
        return f"<BigWin(multiplier={self.multiplier}x, amount={self.amount})>"

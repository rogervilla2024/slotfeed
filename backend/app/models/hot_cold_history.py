from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.game import Game


class HotColdHistory(Base, TimestampMixin):
    __tablename__ = "hot_cold_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id"), nullable=False
    )

    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_hours: Mapped[int] = mapped_column(Integer, nullable=False)

    theoretical_rtp: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    observed_rtp: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    rtp_difference: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    sample_sessions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_spins: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_wagered: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)

    is_hot: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    heat_score: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)

    def __repr__(self) -> str:
        return f"<HotColdHistory(game_id={self.game_id}, is_hot={self.is_hot})>"

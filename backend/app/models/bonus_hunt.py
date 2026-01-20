from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.streamer import Streamer
    from app.models.bonus_hunt_entry import BonusHuntEntry


class BonusHunt(Base, TimestampMixin):
    __tablename__ = "bonus_hunts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id"), nullable=False
    )
    streamer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("streamers.id"), nullable=False
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    opening_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    total_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_payout: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    roi_percentage: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)

    bonus_count: Mapped[int] = mapped_column(Integer, default=0)
    bonuses_opened: Mapped[int] = mapped_column(Integer, default=0)

    best_multiplier: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    worst_multiplier: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    avg_multiplier: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="collecting")

    # Relationships
    streamer: Mapped["Streamer"] = relationship("Streamer", back_populates="bonus_hunts")
    entries: Mapped[List["BonusHuntEntry"]] = relationship(
        "BonusHuntEntry", back_populates="bonus_hunt", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<BonusHunt(status={self.status}, bonus_count={self.bonus_count})>"

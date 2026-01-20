from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.bonus_hunt import BonusHunt
    from app.models.game import Game


class BonusHuntEntry(Base, TimestampMixin):
    __tablename__ = "bonus_hunt_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bonus_hunt_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("bonus_hunts.id", ondelete="CASCADE"), nullable=False
    )
    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id"), nullable=False
    )

    position: Mapped[int] = mapped_column(Integer, nullable=False)
    bet_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    is_opened: Mapped[bool] = mapped_column(Boolean, default=False)
    opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payout: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    multiplier: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)

    screenshot_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    bonus_hunt: Mapped["BonusHunt"] = relationship("BonusHunt", back_populates="entries")

    def __repr__(self) -> str:
        return f"<BonusHuntEntry(position={self.position}, is_opened={self.is_opened})>"

from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.big_win import BigWin


class HypeMoment(Base, TimestampMixin):
    __tablename__ = "hype_moments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )

    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    trigger_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hype_score: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)

    related_big_win_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("big_wins.id"), nullable=True
    )

    chat_velocity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    viewer_spike: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    clip_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<HypeMoment(trigger_type={self.trigger_type}, hype_score={self.hype_score})>"

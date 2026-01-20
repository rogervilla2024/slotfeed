from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.streamer import Streamer
    from app.models.big_win import BigWin


class Clip(Base, TimestampMixin):
    __tablename__ = "clips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("sessions.id"), nullable=True
    )
    streamer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("streamers.id"), nullable=False
    )
    big_win_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("big_wins.id"), nullable=True
    )

    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    platform_clip_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    clip_url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    embed_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    clipped_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<Clip(title={self.title}, platform={self.platform})>"

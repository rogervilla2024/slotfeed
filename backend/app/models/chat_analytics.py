from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.session import Session


class ChatAnalytics(Base, TimestampMixin):
    __tablename__ = "chat_analytics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )

    bucket_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    bucket_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    message_count: Mapped[int] = mapped_column(Integer, default=0)
    unique_chatters: Mapped[int] = mapped_column(Integer, default=0)
    emote_count: Mapped[int] = mapped_column(Integer, default=0)

    sentiment_score: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    hype_score: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)

    top_emotes: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    language_distribution: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    def __repr__(self) -> str:
        return f"<ChatAnalytics(bucket_start={self.bucket_start}, message_count={self.message_count})>"

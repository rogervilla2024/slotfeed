"""ContentGenerationQueue model for tracking AI content generation jobs"""
from typing import Optional
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid
from app.core.database import Base
from app.models.base import TimestampMixin


class ContentGenerationQueue(Base, TimestampMixin):
    """Queue for AI-powered content generation jobs"""

    __tablename__ = "content_generation_queue"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    game_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # Job status
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        comment="Job status: pending, processing, completed, failed",
    )

    # Priority (1 = highest, 10 = lowest)
    priority: Mapped[int] = mapped_column(Integer, default=5)

    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)

    def __repr__(self) -> str:
        return f"<ContentGenerationQueue(game_id={self.game_id}, status={self.status})>"

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "game_id": self.game_id,
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
        }

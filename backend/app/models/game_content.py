"""GameContent model for SEO content storage"""
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.game import Game


class GameContent(Base, TimestampMixin):
    """Educational and SEO content for slot games"""

    __tablename__ = "game_content"

    # Use game_id as primary key (one-to-one relationship)
    game_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("games.id"), primary_key=True
    )

    # Content sections (6 parts totaling 300-500 words)
    overview: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="50-75 word game overview"
    )
    rtp_explanation: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="75-100 word RTP explanation"
    )
    volatility_analysis: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="75-100 word volatility analysis"
    )
    bonus_features: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="100-125 word bonus features guide"
    )
    strategies: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="75-100 word winning strategies"
    )
    streamer_insights: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="25-50 word streamer insights"
    )

    # SEO metadata
    meta_description: Mapped[Optional[str]] = mapped_column(
        String(160), nullable=True, comment="SEO meta description (160 char max)"
    )
    focus_keywords: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String(100)), nullable=True, comment="Array of SEO keywords"
    )

    # Publishing status
    is_published: Mapped[bool] = mapped_column(
        Boolean, default=False, comment="Content published status"
    )

    # Relationships
    game: Mapped[Optional["Game"]] = relationship("Game")

    def __repr__(self) -> str:
        return f"<GameContent(game_id={self.game_id}, published={self.is_published})>"

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses"""
        return {
            "game_id": self.game_id,
            "overview": self.overview,
            "rtp_explanation": self.rtp_explanation,
            "volatility_analysis": self.volatility_analysis,
            "bonus_features": self.bonus_features,
            "strategies": self.strategies,
            "streamer_insights": self.streamer_insights,
            "meta_description": self.meta_description,
            "focus_keywords": self.focus_keywords or [],
            "is_published": self.is_published,
            "generated_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

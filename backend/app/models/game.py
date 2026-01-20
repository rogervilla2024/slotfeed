from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Numeric, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.provider import Provider
    from app.models.game_session import GameSession
    from app.models.big_win import BigWin


class Game(Base, TimestampMixin):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    provider_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("providers.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    rtp: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    volatility: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    max_multiplier: Mapped[int] = mapped_column(Integer, default=0)
    min_bet: Mapped[float] = mapped_column(Numeric(15, 2), default=0.01)
    max_bet: Mapped[float] = mapped_column(Numeric(15, 2), default=1000.00)
    has_free_spins: Mapped[bool] = mapped_column(Boolean, default=False)
    has_bonus: Mapped[bool] = mapped_column(Boolean, default=False)
    has_multiplier: Mapped[bool] = mapped_column(Boolean, default=False)
    total_spins: Mapped[int] = mapped_column(Integer, default=0)
    total_wagered: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_won: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    provider: Mapped[Optional["Provider"]] = relationship("Provider", back_populates="games")
    game_sessions: Mapped[List["GameSession"]] = relationship("GameSession", back_populates="game")
    big_wins: Mapped[List["BigWin"]] = relationship("BigWin", back_populates="game")

    def __repr__(self) -> str:
        return f"<Game(name={self.name}, rtp={self.rtp})>"

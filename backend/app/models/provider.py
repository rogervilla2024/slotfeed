from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.game import Game


class Provider(Base, TimestampMixin):
    __tablename__ = "providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    total_games: Mapped[int] = mapped_column(Integer, default=0)
    avg_rtp: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    # Relationships
    games: Mapped[List["Game"]] = relationship("Game", back_populates="provider")

    def __repr__(self) -> str:
        return f"<Provider(name={self.name}, slug={self.slug})>"

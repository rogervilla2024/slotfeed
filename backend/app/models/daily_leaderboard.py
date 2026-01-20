from datetime import date
from sqlalchemy import String, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class DailyLeaderboard(Base, TimestampMixin):
    __tablename__ = "daily_leaderboards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)

    leaderboard_date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)

    rankings: Mapped[dict] = mapped_column(JSONB, nullable=False)

    def __repr__(self) -> str:
        return f"<DailyLeaderboard(date={self.leaderboard_date}, category={self.category})>"

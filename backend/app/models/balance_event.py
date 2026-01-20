from typing import Optional
from datetime import datetime
from sqlalchemy import String, Numeric, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import generate_uuid


class BalanceEvent(Base):
    """
    Balance event storage matching actual database schema.

    Tracks balance changes during streaming sessions.
    """
    __tablename__ = "balance_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    # Balance data
    previous_balance: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    new_balance: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    balance_change: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)

    # Event classification
    event_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Wagering data
    wagered: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    won: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )

    __table_args__ = (
        Index('idx_balance_events_session_time', 'session_id', 'timestamp'),
    )

    def __repr__(self) -> str:
        return f"<BalanceEvent(new_balance={self.new_balance}, timestamp={self.timestamp})>"

from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Auth
    auth_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Subscription
    subscription_tier: Mapped[str] = mapped_column(String(20), default="free")
    subscription_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Preferences
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    notification_preferences: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        default={"email": True, "push": True, "telegram": False, "discord": False}
    )
    favorite_streamers: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String(36)), default=[]
    )
    favorite_games: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String(36)), default=[]
    )

    # Meta
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    alert_rules: Mapped[List["AlertRule"]] = relationship(
        "AlertRule", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(email={self.email}, tier={self.subscription_tier})>"


from app.models.alert_rule import AlertRule  # noqa: E402

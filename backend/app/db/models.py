"""
SLOTFEED SQLAlchemy Models
Maps to the PostgreSQL schema for ORM operations.
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal
import uuid

from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime,
    ForeignKey, Numeric, JSON, UniqueConstraint, Index, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Provider(Base):
    __tablename__ = "providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True)
    logo_url = Column(Text)
    website_url = Column(Text)
    total_games = Column(Integer, default=0)
    avg_rtp = Column(Numeric(5, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    games = relationship("Game", back_populates="provider")


class Game(Base):
    __tablename__ = "games"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"))
    name = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, unique=True)
    thumbnail_url = Column(Text)
    theoretical_rtp = Column(Numeric(5, 2))
    volatility = Column(String(20))
    max_win_multiplier = Column(Integer)
    min_bet = Column(Numeric(10, 2))
    max_bet = Column(Numeric(10, 2))
    features = Column(JSONB)
    ocr_template = Column(JSONB)
    is_active = Column(Boolean, default=True)
    total_sessions = Column(Integer, default=0)
    observed_rtp = Column(Numeric(5, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    provider = relationship("Provider", back_populates="games")
    game_sessions = relationship("GameSession", back_populates="game")
    big_wins = relationship("BigWin", back_populates="game")


class Streamer(Base):
    __tablename__ = "streamers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kick_id = Column(String(100), unique=True)
    twitch_id = Column(String(100), unique=True)
    youtube_id = Column(String(100), unique=True)
    username = Column(String(100), nullable=False)
    display_name = Column(String(200))
    slug = Column(String(100), nullable=False, unique=True)
    avatar_url = Column(Text)
    bio = Column(Text)
    country = Column(String(2))
    language = Column(String(5))

    # Social links
    kick_url = Column(Text)
    twitch_url = Column(Text)
    youtube_url = Column(Text)
    twitter_url = Column(Text)
    discord_url = Column(Text)

    # Lifetime statistics
    total_wagered = Column(Numeric(15, 2), default=0)
    total_won = Column(Numeric(15, 2), default=0)
    net_profit_loss = Column(Numeric(15, 2), default=0)
    lifetime_rtp = Column(Numeric(5, 2))
    total_stream_hours = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    biggest_win = Column(Numeric(15, 2), default=0)
    biggest_multiplier = Column(Numeric(10, 2), default=0)

    # Meta
    followers_count = Column(Integer, default=0)
    avg_viewers = Column(Integer, default=0)
    sponsor_info = Column(JSONB)
    tier = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    last_live_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    sessions = relationship("Session", back_populates="streamer")
    big_wins = relationship("BigWin", back_populates="streamer")
    bonus_hunts = relationship("BonusHunt", back_populates="streamer")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    streamer_id = Column(UUID(as_uuid=True), ForeignKey("streamers.id"), nullable=False)
    platform = Column(String(20), nullable=False)
    platform_session_id = Column(String(100))

    # Timing
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)

    # Financial summary
    starting_balance = Column(Numeric(15, 2))
    ending_balance = Column(Numeric(15, 2))
    peak_balance = Column(Numeric(15, 2))
    lowest_balance = Column(Numeric(15, 2))
    total_wagered = Column(Numeric(15, 2), default=0)
    total_won = Column(Numeric(15, 2), default=0)
    net_profit_loss = Column(Numeric(15, 2), default=0)
    session_rtp = Column(Numeric(5, 2))

    # Stats
    biggest_win = Column(Numeric(15, 2), default=0)
    biggest_multiplier = Column(Numeric(10, 2), default=0)
    games_played = Column(Integer, default=0)
    bonus_count = Column(Integer, default=0)

    # Viewer stats
    peak_viewers = Column(Integer, default=0)
    avg_viewers = Column(Integer, default=0)

    # Meta
    vod_url = Column(Text)
    thumbnail_url = Column(Text)
    is_live = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    streamer = relationship("Streamer", back_populates="sessions")
    game_sessions = relationship("GameSession", back_populates="session")
    big_wins = relationship("BigWin", back_populates="session")
    balance_events = relationship("BalanceEvent", back_populates="session")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)

    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)

    starting_balance = Column(Numeric(15, 2))
    ending_balance = Column(Numeric(15, 2))
    total_wagered = Column(Numeric(15, 2), default=0)
    total_won = Column(Numeric(15, 2), default=0)
    net_profit_loss = Column(Numeric(15, 2), default=0)
    game_rtp = Column(Numeric(5, 2))

    spins_count = Column(Integer, default=0)
    bonus_count = Column(Integer, default=0)
    biggest_win = Column(Numeric(15, 2), default=0)
    biggest_multiplier = Column(Numeric(10, 2), default=0)
    avg_bet = Column(Numeric(10, 2))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="game_sessions")
    game = relationship("Game", back_populates="game_sessions")


class BalanceEvent(Base):
    __tablename__ = "balance_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    game_session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"))

    captured_at = Column(DateTime(timezone=True), nullable=False, primary_key=True)

    balance = Column(Numeric(15, 2), nullable=False)
    bet_amount = Column(Numeric(10, 2))
    win_amount = Column(Numeric(15, 2))
    balance_change = Column(Numeric(15, 2))

    is_bonus = Column(Boolean, default=False)
    multiplier = Column(Numeric(10, 2))

    ocr_confidence = Column(Numeric(4, 3))
    frame_url = Column(Text)

    # Relationships
    session = relationship("Session", back_populates="balance_events")


class BigWin(Base):
    __tablename__ = "big_wins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    game_session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"))
    streamer_id = Column(UUID(as_uuid=True), ForeignKey("streamers.id"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)

    won_at = Column(DateTime(timezone=True), nullable=False)

    bet_amount = Column(Numeric(10, 2), nullable=False)
    win_amount = Column(Numeric(15, 2), nullable=False)
    multiplier = Column(Numeric(10, 2), nullable=False)

    is_bonus_win = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    screenshot_url = Column(Text)
    clip_url = Column(Text)
    vod_timestamp = Column(Integer)

    viewer_count = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="big_wins")
    streamer = relationship("Streamer", back_populates="big_wins")
    game = relationship("Game", back_populates="big_wins")


class BonusHunt(Base):
    __tablename__ = "bonus_hunts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    streamer_id = Column(UUID(as_uuid=True), ForeignKey("streamers.id"), nullable=False)

    started_at = Column(DateTime(timezone=True), nullable=False)
    opening_started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))

    total_cost = Column(Numeric(15, 2), default=0)
    total_payout = Column(Numeric(15, 2), default=0)
    roi_percentage = Column(Numeric(6, 2))

    bonus_count = Column(Integer, default=0)
    bonuses_opened = Column(Integer, default=0)

    best_multiplier = Column(Numeric(10, 2))
    worst_multiplier = Column(Numeric(10, 2))
    avg_multiplier = Column(Numeric(10, 2))

    status = Column(String(20), default="collecting")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    streamer = relationship("Streamer", back_populates="bonus_hunts")
    entries = relationship("BonusHuntEntry", back_populates="bonus_hunt")


class BonusHuntEntry(Base):
    __tablename__ = "bonus_hunt_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bonus_hunt_id = Column(UUID(as_uuid=True), ForeignKey("bonus_hunts.id", ondelete="CASCADE"), nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)

    position = Column(Integer, nullable=False)
    bet_amount = Column(Numeric(10, 2), nullable=False)

    is_opened = Column(Boolean, default=False)
    opened_at = Column(DateTime(timezone=True))
    payout = Column(Numeric(15, 2))
    multiplier = Column(Numeric(10, 2))

    screenshot_url = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    bonus_hunt = relationship("BonusHunt", back_populates="entries")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True)
    username = Column(String(100), unique=True)
    display_name = Column(String(200))
    avatar_url = Column(Text)

    auth_provider = Column(String(50))

    subscription_tier = Column(String(20), default="free")
    subscription_started_at = Column(DateTime(timezone=True))
    subscription_expires_at = Column(DateTime(timezone=True))
    stripe_customer_id = Column(String(100))

    timezone = Column(String(50), default="UTC")
    notification_preferences = Column(JSONB, default={"email": True, "push": True})
    favorite_streamers = Column(ARRAY(UUID(as_uuid=True)), default=[])
    favorite_games = Column(ARRAY(UUID(as_uuid=True)), default=[])

    last_login_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    alert_rules = relationship("AlertRule", back_populates="user")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(100))
    is_active = Column(Boolean, default=True)

    alert_type = Column(String(50), nullable=False)
    conditions = Column(JSONB, nullable=False)
    channels = Column(JSONB, default=["push"])

    cooldown_minutes = Column(Integer, default=60)
    last_triggered_at = Column(DateTime(timezone=True))
    trigger_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="alert_rules")

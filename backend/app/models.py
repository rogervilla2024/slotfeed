"""
SQLAlchemy Models for SLOTFEED Database

Core data models for:
- Streamers and their profiles
- Gaming sessions with balance tracking
- Games and provider information
- Hot/Cold indicators and RTP tracking
- Bonus hunts
- User management
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class Streamer(Base):
    """Streamer profile and metadata"""
    __tablename__ = "streamers"

    id = Column(String(50), primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(100))
    platform = Column(String(20), index=True)  # kick, twitch, youtube
    platform_id = Column(String(100), unique=True)
    avatar_url = Column(String(500))
    bio = Column(Text)
    follower_count = Column(Integer, default=0)
    is_live = Column(Boolean, default=False)

    # Stats
    total_sessions = Column(Integer, default=0)
    total_hours_streamed = Column(Float, default=0.0)
    total_wagered = Column(Float, default=0.0)
    total_won = Column(Float, default=0.0)
    biggest_win = Column(Float, default=0.0)
    biggest_multiplier = Column(Float, default=0.0)
    average_rtp = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    # Relationships
    sessions = relationship("Session", back_populates="streamer", cascade="all, delete-orphan")
    bonus_hunts = relationship("BonusHunt", back_populates="streamer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Streamer {self.username}>"


class Provider(Base):
    """Gaming provider (Pragmatic Play, Hacksaw, etc.)"""
    __tablename__ = "providers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, index=True)
    description = Column(Text)
    logo_url = Column(String(500))
    founded_year = Column(Integer)
    headquarter = Column(String(100))
    website = Column(String(500))

    # Stats
    game_count = Column(Integer, default=0)
    average_rtp = Column(Float, default=96.0)
    total_spins = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    games = relationship("Game", back_populates="provider", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Provider {self.name}>"


class Game(Base):
    """Slot game information"""
    __tablename__ = "games"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, index=True)
    provider_id = Column(String(50), ForeignKey("providers.id"), nullable=False, index=True)
    description = Column(Text)

    # Game mechanics
    rtp = Column(Float, nullable=False)  # Theoretical RTP
    volatility = Column(String(20))  # low, medium, high, very_high
    max_multiplier = Column(Integer, default=0)
    min_bet = Column(Float, default=0.01)
    max_bet = Column(Float, default=100.0)

    # Features
    has_free_spins = Column(Boolean, default=False)
    has_bonus = Column(Boolean, default=False)
    has_multiplier = Column(Boolean, default=False)

    # Stats
    total_spins = Column(Integer, default=0)
    observed_rtp = Column(Float, default=0.0)
    total_wagered = Column(Float, default=0.0)
    total_won = Column(Float, default=0.0)

    # Assets
    thumbnail_url = Column(String(500))
    game_url = Column(String(500))

    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("Provider", back_populates="games")
    game_sessions = relationship("GameSession", back_populates="game", cascade="all, delete-orphan")
    big_wins = relationship("BigWin", back_populates="game", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Game {self.name}>"


class Session(Base):
    """Individual streaming session"""
    __tablename__ = "sessions"

    id = Column(String(50), primary_key=True, index=True)
    streamer_id = Column(String(50), ForeignKey("streamers.id"), nullable=False, index=True)
    platform = Column(String(20))

    # Session timeline
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, index=True)
    duration_seconds = Column(Integer, default=0)

    # Balance tracking
    start_balance = Column(Float, nullable=False)
    end_balance = Column(Float)
    peak_balance = Column(Float)
    lowest_balance = Column(Float)

    # Wagering stats
    total_wagered = Column(Float, default=0.0)
    total_won = Column(Float, default=0.0)
    profit_loss = Column(Float, default=0.0)
    roi_percent = Column(Float, default=0.0)

    # RTP tracking
    average_rtp = Column(Float, default=0.0)
    theoretical_rtp = Column(Float, default=96.0)

    # Session status
    status = Column(String(20), default="ongoing")  # ongoing, ended, completed
    is_live = Column(Boolean, default=True, index=True)

    # Metadata
    external_session_id = Column(String(100), unique=True)
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    streamer = relationship("Streamer", back_populates="sessions")
    balance_events = relationship("BalanceEvent", back_populates="session", cascade="all, delete-orphan")
    game_sessions = relationship("GameSession", back_populates="session", cascade="all, delete-orphan")
    big_wins = relationship("BigWin", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Session {self.id}>"


class GameSession(Base):
    """Per-game breakdown within a session"""
    __tablename__ = "game_sessions"

    id = Column(String(50), primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("sessions.id"), nullable=False, index=True)
    game_id = Column(String(50), ForeignKey("games.id"), nullable=False, index=True)

    # Stats for this game in this session
    total_wagered = Column(Float, default=0.0)
    total_won = Column(Float, default=0.0)
    spins = Column(Integer, default=0)

    # Calculated metrics
    observed_rtp = Column(Float, default=0.0)
    biggest_win = Column(Float, default=0.0)
    biggest_multiplier = Column(Float, default=0.0)

    # Timeline
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="game_sessions")
    game = relationship("Game", back_populates="game_sessions")

    def __repr__(self):
        return f"<GameSession {self.id}>"


class BalanceEvent(Base):
    """High-frequency balance change events (PARTITIONED by session_id + date)"""
    __tablename__ = "balance_events"

    id = Column(String(50), primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("sessions.id"), nullable=False, index=True)

    # Balance tracking
    previous_balance = Column(Float, nullable=False)
    new_balance = Column(Float, nullable=False)
    balance_change = Column(Float)

    # Event details
    event_type = Column(String(20))  # spin, win, bet, bonus, etc.
    wagered = Column(Float, default=0.0)
    won = Column(Float, default=0.0)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="balance_events")

    def __repr__(self):
        return f"<BalanceEvent {self.id}>"


class BigWin(Base):
    """Notable wins (100x+)"""
    __tablename__ = "big_wins"

    id = Column(String(50), primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("sessions.id"), nullable=False, index=True)
    game_id = Column(String(50), ForeignKey("games.id"), nullable=False, index=True)
    streamer_id = Column(String(50), ForeignKey("streamers.id"), nullable=False, index=True)

    # Win details
    amount = Column(Float, nullable=False)
    multiplier = Column(Float, nullable=False)
    bet_amount = Column(Float, default=0.0)

    # Context
    balance_before = Column(Float)
    balance_after = Column(Float)

    # Media
    screenshot_url = Column(String(500))
    clip_url = Column(String(500))

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="big_wins")
    game = relationship("Game", back_populates="big_wins")
    streamer = relationship("Streamer")

    def __repr__(self):
        return f"<BigWin {self.id}>"


class BonusHunt(Base):
    """Bonus hunt tracking"""
    __tablename__ = "bonus_hunts"

    id = Column(String(50), primary_key=True, index=True)
    streamer_id = Column(String(50), ForeignKey("streamers.id"), nullable=False, index=True)
    game_id = Column(String(50), ForeignKey("games.id"))

    # Hunt details
    status = Column(String(20), default="collecting")  # collecting, opening, completed
    total_cost = Column(Float, nullable=False)
    entry_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)

    # Payouts
    total_payout = Column(Float, default=0.0)
    roi_percent = Column(Float, default=0.0)

    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime)

    # Relationships
    streamer = relationship("Streamer", back_populates="bonus_hunts")

    def __repr__(self):
        return f"<BonusHunt {self.id}>"


class HotColdIndicator(Base):
    """Hot/Cold slot performance tracking"""
    __tablename__ = "hot_cold_indicators"

    id = Column(String(50), primary_key=True, index=True)
    game_id = Column(String(50), ForeignKey("games.id"), nullable=False, index=True)

    # Scoring
    status = Column(String(20), index=True)  # hot, neutral, cold
    heat_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)

    # RTP metrics
    observed_rtp = Column(Float)
    theoretical_rtp = Column(Float)
    rtp_difference = Column(Float)

    # Sample data
    sample_sessions = Column(Integer, default=0)
    total_spins = Column(Integer, default=0)
    total_wagered = Column(Float, default=0.0)
    total_won = Column(Float, default=0.0)

    # Big wins analysis
    recent_big_wins = Column(Integer, default=0)
    avg_big_wins = Column(Float, default=0.0)

    # Trend
    trend = Column(String(20))  # heating, cooling, stable

    period_hours = Column(Integer, default=24)
    last_updated = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<HotColdIndicator {self.id}>"


class User(Base):
    """Platform user"""
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100))
    password_hash = Column(String(255))

    # Profile
    avatar_url = Column(String(500))
    bio = Column(Text)

    # Account status
    is_active = Column(Boolean, default=True, index=True)
    email_verified = Column(Boolean, default=False)

    # Subscription
    subscription_tier = Column(String(20), default="free")  # free, pro, premium
    subscription_expires = Column(DateTime)

    # Preferences
    preferences = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    def __repr__(self):
        return f"<User {self.username}>"


class AlertRule(Base):
    """User notification/alert rules"""
    __tablename__ = "alert_rules"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)

    # Rule details
    name = Column(String(100))
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    # Conditions
    alert_type = Column(String(50))  # big_win, hot_slot, streamer_live, etc.
    conditions = Column(JSON, default={})

    # Actions
    notify_email = Column(Boolean, default=False)
    notify_push = Column(Boolean, default=False)
    notify_discord = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AlertRule {self.name}>"

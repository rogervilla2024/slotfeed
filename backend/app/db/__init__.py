"""
Database package for SLOTFEED.
"""

from .connection import (
    Database,
    DatabaseConfig,
    get_database,
    get_sync_session,
    get_async_session,
)
from .models import (
    Base,
    Provider,
    Game,
    Streamer,
    Session,
    GameSession,
    BalanceEvent,
    BigWin,
    BonusHunt,
    BonusHuntEntry,
    User,
    AlertRule,
)

__all__ = [
    # Connection
    "Database",
    "DatabaseConfig",
    "get_database",
    "get_sync_session",
    "get_async_session",
    # Models
    "Base",
    "Provider",
    "Game",
    "Streamer",
    "Session",
    "GameSession",
    "BalanceEvent",
    "BigWin",
    "BonusHunt",
    "BonusHuntEntry",
    "User",
    "AlertRule",
]

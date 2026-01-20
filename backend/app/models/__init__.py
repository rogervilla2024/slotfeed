# SlotFeed Database Models
# All 16 core tables + 1 helper table (streamer_game_stats)

from app.models.provider import Provider
from app.models.game import Game
from app.models.game_content import GameContent
from app.models.streamer import Streamer
from app.models.session import Session
from app.models.game_session import GameSession
from app.models.balance_event import BalanceEvent
from app.models.big_win import BigWin
from app.models.bonus_hunt import BonusHunt
from app.models.bonus_hunt_entry import BonusHuntEntry
from app.models.chat_analytics import ChatAnalytics
from app.models.hype_moment import HypeMoment
from app.models.hot_cold_history import HotColdHistory
from app.models.clip import Clip
from app.models.user import User
from app.models.alert_rule import AlertRule
from app.models.daily_leaderboard import DailyLeaderboard
from app.models.streamer_game_stats import StreamerGameStats

__all__ = [
    "Provider",
    "Game",
    "GameContent",
    "Streamer",
    "Session",
    "GameSession",
    "BalanceEvent",
    "BigWin",
    "BonusHunt",
    "BonusHuntEntry",
    "ChatAnalytics",
    "HypeMoment",
    "HotColdHistory",
    "Clip",
    "User",
    "AlertRule",
    "DailyLeaderboard",
    "StreamerGameStats",
]

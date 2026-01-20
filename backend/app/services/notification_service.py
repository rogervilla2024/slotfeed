"""
Notification Service

Central service for managing and dispatching notifications to users.
Handles alert rule matching, user preferences, and delivery across channels.

Supported channels:
- Telegram
- Discord (future)
- Email (future)
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any, Set
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import AlertRule, User
from .telegram_bot import TelegramBotService, get_telegram_bot, NotificationResult

logger = logging.getLogger(__name__)


class AlertType(str, Enum):
    """Types of alerts that can be triggered."""
    BIG_WIN = "big_win"
    STREAMER_LIVE = "streamer_live"
    HOT_SLOT = "hot_slot"


class NotificationChannel(str, Enum):
    """Available notification channels."""
    TELEGRAM = "telegram"
    DISCORD = "discord"
    EMAIL = "email"


@dataclass
class AlertCondition:
    """Conditions for triggering an alert."""
    alert_type: AlertType
    streamer_ids: Optional[List[str]] = None  # None = all streamers
    game_ids: Optional[List[str]] = None  # None = all games
    min_multiplier: Optional[float] = None  # For big wins
    min_tier: Optional[str] = None  # big, mega, ultra, legendary


@dataclass
class NotificationPayload:
    """Payload for a notification to be sent."""
    alert_type: AlertType
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class DeliveryResult:
    """Result of delivering a notification."""
    user_id: str
    channel: NotificationChannel
    success: bool
    error: Optional[str] = None


class NotificationService:
    """
    Service for managing notifications and alert delivery.

    Usage:
        service = NotificationService()

        # Send big win notification
        await service.notify_big_win(
            streamer_id="123",
            streamer_name="Roshtein",
            game_id="456",
            game_name="Sweet Bonanza",
            multiplier=500.0,
            win_amount=50000.0,
            bet_amount=100.0,
            tier="mega"
        )
    """

    def __init__(
        self,
        telegram_bot: Optional[TelegramBotService] = None
    ):
        self.telegram = telegram_bot or get_telegram_bot()
        self._user_subscriptions: Dict[str, Set[str]] = {}  # user_id -> set of telegram chat_ids

    async def register_telegram_user(
        self,
        user_id: str,
        chat_id: str
    ):
        """Register a user's Telegram chat ID for notifications."""
        if user_id not in self._user_subscriptions:
            self._user_subscriptions[user_id] = set()
        self._user_subscriptions[user_id].add(chat_id)
        logger.info(f"Registered Telegram chat {chat_id} for user {user_id}")

    async def unregister_telegram_user(
        self,
        user_id: str,
        chat_id: str
    ):
        """Unregister a user's Telegram chat ID."""
        if user_id in self._user_subscriptions:
            self._user_subscriptions[user_id].discard(chat_id)
            if not self._user_subscriptions[user_id]:
                del self._user_subscriptions[user_id]

    async def get_matching_users(
        self,
        db: AsyncSession,
        alert_type: AlertType,
        streamer_id: Optional[str] = None,
        game_id: Optional[str] = None,
        multiplier: Optional[float] = None,
        tier: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Find users with alert rules matching the given criteria.

        Returns list of user data with their alert preferences.
        """
        # Query active alert rules of the given type
        query = select(AlertRule).where(
            AlertRule.alert_type == alert_type.value,
            AlertRule.is_active == True
        )

        result = await db.execute(query)
        rules = result.scalars().all()

        matching_users = []

        for rule in rules:
            conditions = rule.conditions or {}

            # Check streamer filter
            if streamer_id:
                allowed_streamers = conditions.get("streamer_ids")
                if allowed_streamers and streamer_id not in allowed_streamers:
                    continue

            # Check game filter
            if game_id:
                allowed_games = conditions.get("game_ids")
                if allowed_games and game_id not in allowed_games:
                    continue

            # Check multiplier threshold
            if multiplier is not None:
                min_mult = conditions.get("min_multiplier", 0)
                if multiplier < min_mult:
                    continue

            # Check tier filter
            if tier:
                min_tier = conditions.get("min_tier")
                if min_tier:
                    tier_order = ["big", "mega", "ultra", "legendary"]
                    if tier_order.index(tier.lower()) < tier_order.index(min_tier.lower()):
                        continue

            matching_users.append({
                "user_id": rule.user_id,
                "channels": rule.channels,
                "conditions": conditions
            })

        return matching_users

    async def notify_big_win(
        self,
        db: AsyncSession,
        streamer_id: str,
        streamer_name: str,
        game_id: str,
        game_name: str,
        multiplier: float,
        win_amount: float,
        bet_amount: float,
        tier: str,
        platform: str = "Kick",
        screenshot_url: Optional[str] = None
    ) -> List[DeliveryResult]:
        """
        Send big win notifications to all matching users.

        Args:
            db: Database session
            streamer_id: ID of the streamer
            streamer_name: Display name of the streamer
            game_id: ID of the game
            game_name: Name of the slot game
            multiplier: Win multiplier (e.g., 500.0 for 500x)
            win_amount: Total win amount
            bet_amount: Bet size
            tier: Win tier (big, mega, ultra, legendary)
            platform: Streaming platform
            screenshot_url: Optional screenshot of the win

        Returns:
            List of delivery results
        """
        results: List[DeliveryResult] = []

        # Find matching users
        matching_users = await self.get_matching_users(
            db=db,
            alert_type=AlertType.BIG_WIN,
            streamer_id=streamer_id,
            game_id=game_id,
            multiplier=multiplier,
            tier=tier
        )

        logger.info(f"Found {len(matching_users)} users matching big win alert")

        # Send notifications
        for user_data in matching_users:
            user_id = user_data["user_id"]
            channels = user_data["channels"]

            # Send via Telegram
            if NotificationChannel.TELEGRAM.value in channels:
                chat_ids = self._user_subscriptions.get(user_id, set())
                for chat_id in chat_ids:
                    result = await self.telegram.send_big_win_alert(
                        chat_id=chat_id,
                        streamer_name=streamer_name,
                        game_name=game_name,
                        multiplier=multiplier,
                        win_amount=win_amount,
                        bet_amount=bet_amount,
                        tier=tier,
                        platform=platform,
                        screenshot_url=screenshot_url
                    )
                    results.append(DeliveryResult(
                        user_id=user_id,
                        channel=NotificationChannel.TELEGRAM,
                        success=result.success,
                        error=result.error
                    ))

        return results

    async def notify_streamer_live(
        self,
        db: AsyncSession,
        streamer_id: str,
        streamer_name: str,
        platform: str,
        game_name: Optional[str] = None,
        viewer_count: Optional[int] = None,
        stream_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None
    ) -> List[DeliveryResult]:
        """
        Send streamer live notifications to all matching users.

        Args:
            db: Database session
            streamer_id: ID of the streamer
            streamer_name: Display name
            platform: Streaming platform
            game_name: Current game being played
            viewer_count: Current viewer count
            stream_url: Link to the stream
            thumbnail_url: Stream thumbnail

        Returns:
            List of delivery results
        """
        results: List[DeliveryResult] = []

        matching_users = await self.get_matching_users(
            db=db,
            alert_type=AlertType.STREAMER_LIVE,
            streamer_id=streamer_id
        )

        logger.info(f"Found {len(matching_users)} users matching streamer live alert")

        for user_data in matching_users:
            user_id = user_data["user_id"]
            channels = user_data["channels"]

            if NotificationChannel.TELEGRAM.value in channels:
                chat_ids = self._user_subscriptions.get(user_id, set())
                for chat_id in chat_ids:
                    result = await self.telegram.send_streamer_live_alert(
                        chat_id=chat_id,
                        streamer_name=streamer_name,
                        platform=platform,
                        game_name=game_name,
                        viewer_count=viewer_count,
                        stream_url=stream_url,
                        thumbnail_url=thumbnail_url
                    )
                    results.append(DeliveryResult(
                        user_id=user_id,
                        channel=NotificationChannel.TELEGRAM,
                        success=result.success,
                        error=result.error
                    ))

        return results

    async def notify_hot_slot(
        self,
        db: AsyncSession,
        game_id: str,
        game_name: str,
        provider: str,
        score: int,
        recent_rtp: float,
        sample_size: int
    ) -> List[DeliveryResult]:
        """
        Send hot slot notifications to all matching Pro+ users.

        Args:
            db: Database session
            game_id: ID of the game
            game_name: Name of the slot
            provider: Game provider
            score: Heat score (-100 to +100)
            recent_rtp: Recent observed RTP
            sample_size: Number of spins in sample

        Returns:
            List of delivery results
        """
        results: List[DeliveryResult] = []

        matching_users = await self.get_matching_users(
            db=db,
            alert_type=AlertType.HOT_SLOT,
            game_id=game_id
        )

        logger.info(f"Found {len(matching_users)} users matching hot slot alert")

        for user_data in matching_users:
            user_id = user_data["user_id"]
            channels = user_data["channels"]

            if NotificationChannel.TELEGRAM.value in channels:
                chat_ids = self._user_subscriptions.get(user_id, set())
                for chat_id in chat_ids:
                    result = await self.telegram.send_hot_slot_alert(
                        chat_id=chat_id,
                        game_name=game_name,
                        provider=provider,
                        score=score,
                        recent_rtp=recent_rtp,
                        sample_size=sample_size
                    )
                    results.append(DeliveryResult(
                        user_id=user_id,
                        channel=NotificationChannel.TELEGRAM,
                        success=result.success,
                        error=result.error
                    ))

        return results

    async def send_direct_message(
        self,
        user_id: str,
        message: str,
        channel: NotificationChannel = NotificationChannel.TELEGRAM
    ) -> List[DeliveryResult]:
        """Send a direct message to a specific user."""
        results: List[DeliveryResult] = []

        if channel == NotificationChannel.TELEGRAM:
            chat_ids = self._user_subscriptions.get(user_id, set())
            for chat_id in chat_ids:
                result = await self.telegram.send_message(
                    chat_id=chat_id,
                    text=message
                )
                results.append(DeliveryResult(
                    user_id=user_id,
                    channel=channel,
                    success=result.success,
                    error=result.error
                ))

        return results


# Singleton instance
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Get the singleton notification service instance."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service

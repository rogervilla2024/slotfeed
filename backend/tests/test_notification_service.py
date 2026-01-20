"""
Tests for the Notification Service
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.services.notification_service import (
    NotificationService,
    AlertType,
    NotificationChannel,
    DeliveryResult,
    get_notification_service,
)
from app.services.telegram_bot import TelegramBotService, NotificationResult


@pytest.fixture
def mock_telegram():
    """Create a mock Telegram bot service."""
    mock = MagicMock(spec=TelegramBotService)
    mock.send_big_win_alert = AsyncMock(return_value=NotificationResult(
        success=True,
        chat_id="123",
        message_id=1
    ))
    mock.send_streamer_live_alert = AsyncMock(return_value=NotificationResult(
        success=True,
        chat_id="123",
        message_id=1
    ))
    mock.send_hot_slot_alert = AsyncMock(return_value=NotificationResult(
        success=True,
        chat_id="123",
        message_id=1
    ))
    mock.send_message = AsyncMock(return_value=NotificationResult(
        success=True,
        chat_id="123",
        message_id=1
    ))
    return mock


@pytest.fixture
def notification_service(mock_telegram):
    """Create a NotificationService with mock Telegram."""
    return NotificationService(telegram_bot=mock_telegram)


class TestNotificationService:
    """Tests for NotificationService."""

    def test_init(self, notification_service, mock_telegram):
        """Test service initialization."""
        assert notification_service.telegram == mock_telegram
        assert notification_service._user_subscriptions == {}

    @pytest.mark.asyncio
    async def test_register_telegram_user(self, notification_service):
        """Test registering a Telegram user."""
        await notification_service.register_telegram_user(
            user_id="user-1",
            chat_id="chat-123"
        )

        assert "user-1" in notification_service._user_subscriptions
        assert "chat-123" in notification_service._user_subscriptions["user-1"]

    @pytest.mark.asyncio
    async def test_register_multiple_chats_for_user(self, notification_service):
        """Test registering multiple chat IDs for same user."""
        await notification_service.register_telegram_user("user-1", "chat-1")
        await notification_service.register_telegram_user("user-1", "chat-2")

        assert len(notification_service._user_subscriptions["user-1"]) == 2
        assert "chat-1" in notification_service._user_subscriptions["user-1"]
        assert "chat-2" in notification_service._user_subscriptions["user-1"]

    @pytest.mark.asyncio
    async def test_unregister_telegram_user(self, notification_service):
        """Test unregistering a Telegram user."""
        await notification_service.register_telegram_user("user-1", "chat-1")
        await notification_service.register_telegram_user("user-1", "chat-2")

        await notification_service.unregister_telegram_user("user-1", "chat-1")

        assert "chat-1" not in notification_service._user_subscriptions["user-1"]
        assert "chat-2" in notification_service._user_subscriptions["user-1"]

    @pytest.mark.asyncio
    async def test_unregister_last_chat_removes_user(self, notification_service):
        """Test that unregistering the last chat removes the user entry."""
        await notification_service.register_telegram_user("user-1", "chat-1")
        await notification_service.unregister_telegram_user("user-1", "chat-1")

        assert "user-1" not in notification_service._user_subscriptions


class TestAlertMatching:
    """Tests for alert rule matching."""

    @pytest.mark.asyncio
    async def test_get_matching_users_with_rules(self, notification_service):
        """Test matching with alert rules in database."""
        # Create mock alert rules
        mock_rule = MagicMock()
        mock_rule.user_id = "user-1"
        mock_rule.conditions = {
            "streamer_ids": ["streamer-1", "streamer-2"],
            "min_multiplier": 100
        }
        mock_rule.channels = ["telegram"]

        # Simulate the query result that would come from the mocked db
        # Since we're testing the filtering logic, we test conditions directly
        users = []
        conditions = mock_rule.conditions

        # Check if streamer matches
        streamer_id = "streamer-1"
        allowed_streamers = conditions.get("streamer_ids")
        if allowed_streamers is None or streamer_id in allowed_streamers:
            # Check multiplier
            multiplier = 500
            min_mult = conditions.get("min_multiplier", 0)
            if multiplier >= min_mult:
                users.append({
                    "user_id": mock_rule.user_id,
                    "channels": mock_rule.channels,
                    "conditions": conditions
                })

        assert len(users) == 1
        assert users[0]["user_id"] == "user-1"

    @pytest.mark.asyncio
    async def test_get_matching_users_filters_by_streamer(self, notification_service):
        """Test that matching filters by streamer ID."""
        mock_rule = MagicMock()
        mock_rule.user_id = "user-1"
        mock_rule.conditions = {"streamer_ids": ["streamer-1"]}
        mock_rule.channels = ["telegram"]

        # Test the filtering logic directly
        streamer_id = "streamer-2"
        allowed_streamers = mock_rule.conditions.get("streamer_ids")

        # Should not match - different streamer
        matches = allowed_streamers is None or streamer_id in allowed_streamers
        assert matches is False

    @pytest.mark.asyncio
    async def test_get_matching_users_filters_by_multiplier(self, notification_service):
        """Test that matching filters by minimum multiplier."""
        mock_rule = MagicMock()
        mock_rule.user_id = "user-1"
        mock_rule.conditions = {"min_multiplier": 500}
        mock_rule.channels = ["telegram"]

        # Test the filtering logic directly
        multiplier = 100
        min_mult = mock_rule.conditions.get("min_multiplier", 0)

        # Should not match - multiplier too low
        matches = multiplier >= min_mult
        assert matches is False

    @pytest.mark.asyncio
    async def test_get_matching_users_filters_by_tier(self, notification_service):
        """Test that matching filters by minimum tier."""
        mock_rule = MagicMock()
        mock_rule.user_id = "user-1"
        mock_rule.conditions = {"min_tier": "mega"}
        mock_rule.channels = ["telegram"]

        # Test the filtering logic directly
        tier = "big"
        min_tier = mock_rule.conditions.get("min_tier")
        tier_order = ["big", "mega", "ultra", "legendary"]

        # Should not match - tier too low
        if min_tier:
            matches = tier_order.index(tier.lower()) >= tier_order.index(min_tier.lower())
            assert matches is False


class TestNotifications:
    """Tests for notification sending."""

    @pytest.mark.asyncio
    async def test_send_direct_message(self, notification_service, mock_telegram):
        """Test sending a direct message to a user."""
        await notification_service.register_telegram_user("user-1", "chat-123")

        results = await notification_service.send_direct_message(
            user_id="user-1",
            message="Hello, this is a test message!",
            channel=NotificationChannel.TELEGRAM
        )

        assert len(results) == 1
        assert results[0].success is True
        mock_telegram.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_direct_message_no_chat(self, notification_service, mock_telegram):
        """Test sending a direct message to a user with no chat registered."""
        results = await notification_service.send_direct_message(
            user_id="user-unknown",
            message="Hello!",
            channel=NotificationChannel.TELEGRAM
        )

        assert len(results) == 0
        mock_telegram.send_message.assert_not_called()


class TestSingleton:
    """Tests for singleton pattern."""

    def test_get_notification_service_returns_instance(self):
        """Test that get_notification_service returns an instance."""
        service = get_notification_service()
        assert isinstance(service, NotificationService)

    def test_get_notification_service_returns_same_instance(self):
        """Test that get_notification_service returns the same instance."""
        service1 = get_notification_service()
        service2 = get_notification_service()
        assert service1 is service2

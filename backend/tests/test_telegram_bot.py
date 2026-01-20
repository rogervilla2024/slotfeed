"""
Tests for the Telegram Bot Service
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.services.telegram_bot import (
    TelegramBotService,
    NotificationResult,
    MessageType,
    get_telegram_bot,
)


@pytest.fixture
def bot():
    """Create a TelegramBotService instance with a test token."""
    return TelegramBotService(token="test_token_123")


@pytest.fixture
def bot_no_token():
    """Create a TelegramBotService instance without a token."""
    return TelegramBotService(token="")


class TestTelegramBotService:
    """Tests for TelegramBotService."""

    def test_init_with_token(self, bot):
        """Test bot initialization with token."""
        assert bot.token == "test_token_123"
        assert "test_token_123" in bot.api_url

    def test_init_without_token(self, bot_no_token):
        """Test bot initialization without token."""
        assert bot_no_token.token == ""

    @pytest.mark.asyncio
    async def test_send_message_no_token(self, bot_no_token):
        """Test sending message without token returns error."""
        result = await bot_no_token.send_message(
            chat_id="123",
            text="Test message"
        )

        assert result.success is False
        assert result.chat_id == "123"
        assert "not configured" in result.error

    @pytest.mark.asyncio
    async def test_send_message_success(self, bot):
        """Test successful message sending."""
        mock_response = {
            "ok": True,
            "result": {"message_id": 456}
        }

        with patch.object(bot, '_send_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response

            result = await bot.send_message(
                chat_id="123",
                text="Test message"
            )

            assert result.success is True
            assert result.chat_id == "123"
            assert result.message_id == 456
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_message_failure(self, bot):
        """Test message sending failure."""
        mock_response = {
            "ok": False,
            "description": "Chat not found"
        }

        with patch.object(bot, '_send_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response

            result = await bot.send_message(
                chat_id="123",
                text="Test message"
            )

            assert result.success is False
            assert result.chat_id == "123"
            assert "Chat not found" in result.error

    @pytest.mark.asyncio
    async def test_send_message_exception(self, bot):
        """Test message sending with exception."""
        with patch.object(bot, '_send_request', new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = Exception("Network error")

            result = await bot.send_message(
                chat_id="123",
                text="Test message"
            )

            assert result.success is False
            assert "Network error" in result.error

    @pytest.mark.asyncio
    async def test_send_photo_no_token(self, bot_no_token):
        """Test sending photo without token returns error."""
        result = await bot_no_token.send_photo(
            chat_id="123",
            photo_url="https://example.com/photo.jpg"
        )

        assert result.success is False
        assert "not configured" in result.error

    @pytest.mark.asyncio
    async def test_send_photo_success(self, bot):
        """Test successful photo sending."""
        mock_response = {
            "ok": True,
            "result": {"message_id": 789}
        }

        with patch.object(bot, '_send_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response

            result = await bot.send_photo(
                chat_id="123",
                photo_url="https://example.com/photo.jpg",
                caption="Test caption"
            )

            assert result.success is True
            assert result.message_id == 789


class TestMessageFormatting:
    """Tests for message formatting methods."""

    def test_format_big_win_message(self, bot):
        """Test big win message formatting."""
        message = bot._format_big_win_message(
            streamer_name="Roshtein",
            game_name="Sweet Bonanza",
            multiplier=500.0,
            win_amount=50000.0,
            bet_amount=100.0,
            tier="mega",
            platform="Kick"
        )

        assert "MEGA WIN" in message
        assert "Roshtein" in message
        assert "Sweet Bonanza" in message
        assert "500.00x" in message
        assert "$50,000.00" in message
        assert "Kick" in message

    def test_format_big_win_message_legendary(self, bot):
        """Test legendary big win message formatting."""
        message = bot._format_big_win_message(
            streamer_name="Trainwreckstv",
            game_name="Gates of Olympus",
            multiplier=10000.0,
            win_amount=1000000.0,
            bet_amount=100.0,
            tier="legendary",
            platform="Kick"
        )

        assert "LEGENDARY WIN" in message
        assert "10,000.00x" in message

    def test_format_streamer_live_message(self, bot):
        """Test streamer live message formatting."""
        message = bot._format_streamer_live_message(
            streamer_name="ClassyBeef",
            platform="Kick",
            game_name="Sugar Rush",
            viewer_count=15000
        )

        assert "ClassyBeef" in message
        assert "LIVE" in message
        assert "Sugar Rush" in message
        assert "15,000" in message

    def test_format_streamer_live_message_minimal(self, bot):
        """Test streamer live message with minimal info."""
        message = bot._format_streamer_live_message(
            streamer_name="TestStreamer",
            platform="Twitch"
        )

        assert "TestStreamer" in message
        assert "LIVE" in message
        assert "Twitch" in message

    def test_format_hot_slot_message(self, bot):
        """Test hot slot message formatting."""
        message = bot._format_hot_slot_message(
            game_name="Wanted Dead or a Wild",
            provider="Hacksaw Gaming",
            score=75,
            recent_rtp=102.5,
            sample_size=5000
        )

        assert "HOT SLOT" in message
        assert "Wanted Dead or a Wild" in message
        assert "Hacksaw Gaming" in message
        assert "+75" in message
        assert "102.50%" in message


class TestAlertMethods:
    """Tests for alert sending methods."""

    @pytest.mark.asyncio
    async def test_send_big_win_alert_without_screenshot(self, bot):
        """Test sending big win alert without screenshot."""
        with patch.object(bot, 'send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = NotificationResult(
                success=True,
                chat_id="123",
                message_id=1
            )

            result = await bot.send_big_win_alert(
                chat_id="123",
                streamer_name="Roshtein",
                game_name="Sweet Bonanza",
                multiplier=500.0,
                win_amount=50000.0,
                bet_amount=100.0,
                tier="mega"
            )

            assert result.success is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_big_win_alert_with_screenshot(self, bot):
        """Test sending big win alert with screenshot."""
        with patch.object(bot, 'send_photo', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = NotificationResult(
                success=True,
                chat_id="123",
                message_id=1
            )

            result = await bot.send_big_win_alert(
                chat_id="123",
                streamer_name="Roshtein",
                game_name="Sweet Bonanza",
                multiplier=500.0,
                win_amount=50000.0,
                bet_amount=100.0,
                tier="mega",
                screenshot_url="https://example.com/screenshot.jpg"
            )

            assert result.success is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_streamer_live_alert(self, bot):
        """Test sending streamer live alert."""
        with patch.object(bot, 'send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = NotificationResult(
                success=True,
                chat_id="123",
                message_id=1
            )

            result = await bot.send_streamer_live_alert(
                chat_id="123",
                streamer_name="ClassyBeef",
                platform="Kick",
                game_name="Sugar Rush"
            )

            assert result.success is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_hot_slot_alert(self, bot):
        """Test sending hot slot alert."""
        with patch.object(bot, 'send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = NotificationResult(
                success=True,
                chat_id="123",
                message_id=1
            )

            result = await bot.send_hot_slot_alert(
                chat_id="123",
                game_name="Sweet Bonanza",
                provider="Pragmatic Play",
                score=80,
                recent_rtp=105.0,
                sample_size=3000
            )

            assert result.success is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_welcome_message(self, bot):
        """Test sending welcome message."""
        with patch.object(bot, 'send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = NotificationResult(
                success=True,
                chat_id="123",
                message_id=1
            )

            result = await bot.send_welcome_message(
                chat_id="123",
                username="TestUser"
            )

            assert result.success is True
            mock_send.assert_called_once()
            # Check the message contains welcome text
            call_args = mock_send.call_args
            assert "Welcome" in call_args.kwargs["text"]
            assert "TestUser" in call_args.kwargs["text"]


class TestBroadcast:
    """Tests for broadcast functionality."""

    @pytest.mark.asyncio
    async def test_broadcast_message(self, bot):
        """Test broadcasting message to multiple users."""
        with patch.object(bot, 'send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = NotificationResult(
                success=True,
                chat_id="",
                message_id=1
            )

            chat_ids = ["123", "456", "789"]
            results = await bot.broadcast_message(
                chat_ids=chat_ids,
                text="Broadcast message",
                delay=0  # No delay for testing
            )

            assert len(results) == 3
            assert mock_send.call_count == 3


class TestSingleton:
    """Tests for singleton pattern."""

    def test_get_telegram_bot_returns_instance(self):
        """Test that get_telegram_bot returns an instance."""
        bot = get_telegram_bot()
        assert isinstance(bot, TelegramBotService)

    def test_get_telegram_bot_returns_same_instance(self):
        """Test that get_telegram_bot returns the same instance."""
        bot1 = get_telegram_bot()
        bot2 = get_telegram_bot()
        assert bot1 is bot2

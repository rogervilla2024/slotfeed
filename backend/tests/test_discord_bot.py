"""
Tests for Discord Bot Service
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.services.discord_bot import (
    DiscordBotService,
    DiscordColor,
    DiscordMessageType,
    NotificationResult,
    get_discord_bot
)


class TestDiscordBotService:
    """Tests for DiscordBotService."""

    def setup_method(self):
        """Setup test fixtures."""
        self.bot = DiscordBotService(token="test_token_123")

    @pytest.mark.asyncio
    async def test_create_embed_basic(self):
        """Test basic embed creation."""
        embed = self.bot._create_embed(
            title="Test Title",
            description="Test Description",
            color=DiscordColor.BLUE
        )

        assert embed["title"] == "Test Title"
        assert embed["description"] == "Test Description"
        assert embed["color"] == DiscordColor.BLUE

    @pytest.mark.asyncio
    async def test_create_embed_with_fields(self):
        """Test embed creation with fields."""
        fields = [
            {"name": "Field 1", "value": "Value 1", "inline": True},
            {"name": "Field 2", "value": "Value 2", "inline": False},
        ]

        embed = self.bot._create_embed(
            title="Test",
            description="Test",
            fields=fields
        )

        assert "fields" in embed
        assert len(embed["fields"]) == 2
        assert embed["fields"][0]["name"] == "Field 1"

    @pytest.mark.asyncio
    async def test_create_embed_with_images(self):
        """Test embed creation with thumbnail and image."""
        embed = self.bot._create_embed(
            title="Test",
            description="Test",
            thumbnail_url="https://example.com/thumb.jpg",
            image_url="https://example.com/image.jpg"
        )

        assert embed["thumbnail"]["url"] == "https://example.com/thumb.jpg"
        assert embed["image"]["url"] == "https://example.com/image.jpg"

    @pytest.mark.asyncio
    async def test_create_big_win_embed(self):
        """Test big win embed creation."""
        embed = self.bot._create_big_win_embed(
            streamer_name="Roshtein",
            game_name="Sweet Bonanza",
            multiplier=500.0,
            win_amount=50000.0,
            bet_amount=100.0,
            tier="mega",
            platform="Kick"
        )

        assert "MEGA WIN" in embed["title"]
        assert embed["color"] == DiscordColor.ORANGE
        assert len(embed["fields"]) == 6
        assert any(f["value"] == "Roshtein" for f in embed["fields"])

    @pytest.mark.asyncio
    async def test_create_big_win_embed_tiers(self):
        """Test different win tier colors."""
        tiers = {
            "big": DiscordColor.GREEN,
            "mega": DiscordColor.ORANGE,
            "ultra": DiscordColor.PURPLE,
            "legendary": DiscordColor.GOLD,
        }

        for tier, expected_color in tiers.items():
            embed = self.bot._create_big_win_embed(
                streamer_name="Test",
                game_name="Test",
                multiplier=100.0,
                win_amount=1000.0,
                bet_amount=10.0,
                tier=tier
            )
            assert embed["color"] == expected_color

    @pytest.mark.asyncio
    async def test_create_streamer_live_embed(self):
        """Test streamer live embed creation."""
        embed = self.bot._create_streamer_live_embed(
            streamer_name="Trainwreckstv",
            platform="Kick",
            game_name="Gates of Olympus",
            viewer_count=45000
        )

        assert "LIVE" in embed["title"]
        assert embed["color"] == DiscordColor.CYAN
        assert any(f["value"] == "45,000" for f in embed["fields"])

    @pytest.mark.asyncio
    async def test_create_hot_slot_embed(self):
        """Test hot slot embed creation."""
        embed = self.bot._create_hot_slot_embed(
            game_name="Wanted Dead or a Wild",
            provider="Hacksaw Gaming",
            score=85,
            recent_rtp=98.5,
            sample_size=15000
        )

        assert "HOT SLOT" in embed["title"]
        assert embed["color"] == DiscordColor.ORANGE
        assert any(f["value"] == "+85" for f in embed["fields"])

    @pytest.mark.asyncio
    async def test_create_cold_slot_embed(self):
        """Test cold slot embed creation."""
        embed = self.bot._create_cold_slot_embed(
            game_name="Test Slot",
            provider="Test Provider",
            score=-50,
            recent_rtp=92.0,
            sample_size=10000
        )

        assert "COLD SLOT" in embed["title"]
        assert embed["color"] == DiscordColor.BLUE

    @pytest.mark.asyncio
    async def test_send_dm_no_token(self):
        """Test send_dm fails gracefully without token."""
        bot = DiscordBotService(token=None)
        result = await bot.send_dm(
            user_id="123456789",
            content="Test message"
        )

        assert not result.success
        assert "not configured" in result.error.lower()

    @pytest.mark.asyncio
    async def test_send_webhook_message(self):
        """Test webhook message sending."""
        with patch.object(self.bot, '_send_webhook_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"id": "msg_123"}

            result = await self.bot.send_webhook_message(
                webhook_url="https://discord.com/api/webhooks/123/abc",
                content="Test message"
            )

            assert result.success
            assert result.message_id == "msg_123"
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_webhook_message_with_embed(self):
        """Test webhook message with embed."""
        with patch.object(self.bot, '_send_webhook_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"id": "msg_456"}

            embed = self.bot._create_embed(
                title="Test",
                description="Test embed"
            )

            result = await self.bot.send_webhook_message(
                webhook_url="https://discord.com/api/webhooks/123/abc",
                embed=embed
            )

            assert result.success
            call_args = mock_request.call_args[0]
            assert "embeds" in call_args[1]

    @pytest.mark.asyncio
    async def test_send_big_win_alert_dm(self):
        """Test sending big win alert via DM."""
        with patch.object(self.bot, 'send_dm', new_callable=AsyncMock) as mock_dm:
            mock_dm.return_value = NotificationResult(
                success=True,
                target_id="123",
                message_id="msg_789"
            )

            result = await self.bot.send_big_win_alert(
                target="123456789",
                streamer_name="Roshtein",
                game_name="Sweet Bonanza",
                multiplier=500.0,
                win_amount=50000.0,
                bet_amount=100.0,
                tier="mega",
                is_webhook=False
            )

            assert result.success
            mock_dm.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_big_win_alert_webhook(self):
        """Test sending big win alert via webhook."""
        with patch.object(self.bot, 'send_webhook_message', new_callable=AsyncMock) as mock_webhook:
            mock_webhook.return_value = NotificationResult(
                success=True,
                target_id="123",
                message_id="msg_789"
            )

            result = await self.bot.send_big_win_alert(
                target="https://discord.com/api/webhooks/123/abc",
                streamer_name="Roshtein",
                game_name="Sweet Bonanza",
                multiplier=500.0,
                win_amount=50000.0,
                bet_amount=100.0,
                tier="mega",
                is_webhook=True
            )

            assert result.success
            mock_webhook.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_streamer_live_alert(self):
        """Test sending streamer live alert."""
        with patch.object(self.bot, 'send_dm', new_callable=AsyncMock) as mock_dm:
            mock_dm.return_value = NotificationResult(
                success=True,
                target_id="123",
                message_id="msg_101"
            )

            result = await self.bot.send_streamer_live_alert(
                target="123456789",
                streamer_name="Trainwreckstv",
                platform="Kick",
                game_name="Gates of Olympus",
                viewer_count=45000
            )

            assert result.success

    @pytest.mark.asyncio
    async def test_send_hot_slot_alert(self):
        """Test sending hot slot alert."""
        with patch.object(self.bot, 'send_dm', new_callable=AsyncMock) as mock_dm:
            mock_dm.return_value = NotificationResult(
                success=True,
                target_id="123"
            )

            result = await self.bot.send_hot_slot_alert(
                target="123456789",
                game_name="Wanted Dead or a Wild",
                provider="Hacksaw Gaming",
                score=85,
                recent_rtp=98.5,
                sample_size=15000
            )

            assert result.success

    @pytest.mark.asyncio
    async def test_send_welcome_message(self):
        """Test sending welcome message."""
        with patch.object(self.bot, 'send_dm', new_callable=AsyncMock) as mock_dm:
            mock_dm.return_value = NotificationResult(
                success=True,
                target_id="123"
            )

            result = await self.bot.send_welcome_message(
                user_id="123456789",
                username="TestUser"
            )

            assert result.success
            call_args = mock_dm.call_args
            assert "Welcome" in str(call_args)

    @pytest.mark.asyncio
    async def test_broadcast_to_webhooks(self):
        """Test broadcasting to multiple webhooks."""
        with patch.object(self.bot, 'send_webhook_message', new_callable=AsyncMock) as mock_webhook:
            mock_webhook.return_value = NotificationResult(
                success=True,
                target_id="123"
            )

            embed = self.bot._create_embed(
                title="Broadcast Test",
                description="Test"
            )

            webhooks = [
                "https://discord.com/api/webhooks/1/a",
                "https://discord.com/api/webhooks/2/b",
                "https://discord.com/api/webhooks/3/c"
            ]

            results = await self.bot.broadcast_to_webhooks(
                webhook_urls=webhooks,
                embed=embed,
                delay=0.01
            )

            assert len(results) == 3
            assert all(r.success for r in results)
            assert mock_webhook.call_count == 3

    @pytest.mark.asyncio
    async def test_get_bot_info_no_token(self):
        """Test get_bot_info returns None without token."""
        bot = DiscordBotService(token=None)
        info = await bot.get_bot_info()
        assert info is None


class TestDiscordColors:
    """Test Discord color constants."""

    def test_color_values(self):
        """Test that color values are valid hex colors."""
        colors = [
            DiscordColor.GREEN,
            DiscordColor.RED,
            DiscordColor.BLUE,
            DiscordColor.GOLD,
            DiscordColor.PURPLE,
            DiscordColor.ORANGE,
            DiscordColor.CYAN,
            DiscordColor.GRAY,
        ]

        for color in colors:
            assert isinstance(color, int)
            assert 0 <= color <= 0xFFFFFF


class TestSingleton:
    """Test singleton pattern."""

    def test_get_discord_bot_returns_same_instance(self):
        """Test that get_discord_bot returns the same instance."""
        bot1 = get_discord_bot()
        bot2 = get_discord_bot()
        assert bot1 is bot2

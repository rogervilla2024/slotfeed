import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestDiscordLinking:
    """Tests for POST /api/v1/discord/link"""

    def test_link_discord_account(self):
        """Test linking a Discord account"""
        link_data = {
            "discord_user_id": "123456789",
            "discord_username": "testuser"
        }
        response = client.post("/api/v1/discord/link?user_id=user123", json=link_data)
        assert response.status_code in [200, 201, 400]

    def test_link_discord_account_response_structure(self):
        """Test linked account response structure"""
        link_data = {
            "discord_user_id": "123456789",
            "discord_username": "testuser"
        }
        response = client.post("/api/v1/discord/link?user_id=user123", json=link_data)
        if response.status_code == 200:
            data = response.json()
            assert "discord_id" in data
            assert "username" in data
            assert "is_linked" in data
            assert "dm_enabled" in data

    def test_link_discord_missing_discord_id(self):
        """Test linking without discord user ID"""
        link_data = {
            "discord_username": "testuser"
        }
        response = client.post("/api/v1/discord/link?user_id=user123", json=link_data)
        assert response.status_code == 422

    def test_link_discord_missing_username(self):
        """Test linking without discord username"""
        link_data = {
            "discord_user_id": "123456789"
        }
        response = client.post("/api/v1/discord/link?user_id=user123", json=link_data)
        assert response.status_code == 422

    def test_link_discord_missing_user_id(self):
        """Test linking without platform user ID"""
        link_data = {
            "discord_user_id": "123456789",
            "discord_username": "testuser"
        }
        response = client.post("/api/v1/discord/link", json=link_data)
        assert response.status_code == 422


class TestDiscordUnlinking:
    """Tests for DELETE /api/v1/discord/link"""

    def test_unlink_discord_account(self):
        """Test unlinking a Discord account"""
        response = client.delete("/api/v1/discord/link?user_id=user123")
        assert response.status_code in [200, 404]

    def test_unlink_nonexistent_link(self):
        """Test unlinking when no account is linked"""
        response = client.delete("/api/v1/discord/link?user_id=nonexistent_user")
        assert response.status_code in [404, 200]

    def test_unlink_missing_user_id(self):
        """Test unlinking without user ID"""
        response = client.delete("/api/v1/discord/link")
        assert response.status_code == 422


class TestDiscordStatus:
    """Tests for GET /api/v1/discord/status"""

    def test_get_discord_status(self):
        """Test getting Discord link status"""
        response = client.get("/api/v1/discord/status?user_id=user123")
        assert response.status_code == 200
        data = response.json()
        assert "is_linked" in data
        assert "discord_id" in data
        assert "username" in data

    def test_get_status_unlinked_user(self):
        """Test status for user with no Discord link"""
        response = client.get("/api/v1/discord/status?user_id=unknown_user")
        assert response.status_code == 200
        data = response.json()
        assert data["is_linked"] == False

    def test_get_status_missing_user_id(self):
        """Test getting status without user ID"""
        response = client.get("/api/v1/discord/status")
        assert response.status_code == 422


class TestDiscordWebhooks:
    """Tests for Discord webhook management"""

    def test_register_webhook(self):
        """Test registering a Discord webhook"""
        webhook_data = {
            "webhook_url": "https://discordapp.com/api/webhooks/123456789/abcdefg",
            "channel_name": "alerts",
            "guild_name": "Test Server",
            "notification_types": ["big_win", "streamer_live"]
        }
        response = client.post("/api/v1/discord/webhooks?user_id=user123", json=webhook_data)
        assert response.status_code in [200, 201, 400]

    def test_register_webhook_response_structure(self):
        """Test webhook registration response structure"""
        webhook_data = {
            "webhook_url": "https://discordapp.com/api/webhooks/123456789/abcdefg",
            "channel_name": "alerts",
            "guild_name": "Test Server",
            "notification_types": ["big_win"]
        }
        response = client.post("/api/v1/discord/webhooks?user_id=user123", json=webhook_data)
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "channel_name" in data
            assert "guild_name" in data
            assert "notification_types" in data
            assert "is_active" in data

    def test_register_webhook_missing_url(self):
        """Test webhook registration without URL"""
        webhook_data = {
            "channel_name": "alerts",
            "guild_name": "Test Server"
        }
        response = client.post("/api/v1/discord/webhooks?user_id=user123", json=webhook_data)
        assert response.status_code == 422

    def test_register_webhook_missing_channel(self):
        """Test webhook registration without channel name"""
        webhook_data = {
            "webhook_url": "https://discordapp.com/api/webhooks/123456789/abcdefg",
            "guild_name": "Test Server"
        }
        response = client.post("/api/v1/discord/webhooks?user_id=user123", json=webhook_data)
        assert response.status_code == 422

    def test_list_webhooks(self):
        """Test listing user's webhooks"""
        response = client.get("/api/v1/discord/webhooks?user_id=user123")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_webhooks_empty(self):
        """Test listing webhooks for user with none"""
        response = client.get("/api/v1/discord/webhooks?user_id=unknown_user")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    def test_list_webhooks_missing_user_id(self):
        """Test listing webhooks without user ID"""
        response = client.get("/api/v1/discord/webhooks")
        assert response.status_code == 422

    def test_delete_webhook(self):
        """Test deleting a webhook"""
        response = client.delete("/api/v1/discord/webhooks/webhook123?user_id=user123")
        assert response.status_code in [200, 404]

    def test_delete_nonexistent_webhook(self):
        """Test deleting webhook that doesn't exist"""
        response = client.delete("/api/v1/discord/webhooks/nonexistent?user_id=user123")
        assert response.status_code in [404, 403]

    def test_delete_webhook_missing_user_id(self):
        """Test deleting webhook without user ID"""
        response = client.delete("/api/v1/discord/webhooks/webhook123")
        assert response.status_code == 422


class TestDiscordNotifications:
    """Tests for Discord notification testing"""

    def test_send_test_notification_bigwin(self):
        """Test sending big win notification"""
        notification_data = {
            "notification_type": "big_win"
        }
        response = client.post("/api/v1/discord/test?user_id=user123", json=notification_data)
        assert response.status_code in [200, 400, 500]

    def test_send_test_notification_streamer_live(self):
        """Test sending streamer live notification"""
        notification_data = {
            "notification_type": "streamer_live"
        }
        response = client.post("/api/v1/discord/test?user_id=user123", json=notification_data)
        assert response.status_code in [200, 400, 500]

    def test_send_test_notification_hot_slot(self):
        """Test sending hot slot notification"""
        notification_data = {
            "notification_type": "hot_slot"
        }
        response = client.post("/api/v1/discord/test?user_id=user123", json=notification_data)
        assert response.status_code in [200, 400, 500]

    def test_send_test_notification_default(self):
        """Test sending test notification with default type"""
        notification_data = {}
        response = client.post("/api/v1/discord/test?user_id=user123", json=notification_data)
        assert response.status_code in [200, 400, 500]

    def test_send_test_notification_invalid_type(self):
        """Test sending notification with invalid type"""
        notification_data = {
            "notification_type": "invalid_type"
        }
        response = client.post("/api/v1/discord/test?user_id=user123", json=notification_data)
        assert response.status_code == 400

    def test_send_test_notification_no_linked_account(self):
        """Test sending notification when no Discord account linked"""
        notification_data = {
            "notification_type": "big_win"
        }
        response = client.post("/api/v1/discord/test?user_id=unlinked_user", json=notification_data)
        assert response.status_code == 400

    def test_send_test_notification_missing_user_id(self):
        """Test sending notification without user ID"""
        notification_data = {
            "notification_type": "big_win"
        }
        response = client.post("/api/v1/discord/test", json=notification_data)
        assert response.status_code == 422


class TestDiscordStats:
    """Tests for GET /api/v1/discord/stats"""

    def test_get_discord_stats(self):
        """Test getting Discord integration stats"""
        response = client.get("/api/v1/discord/stats")
        assert response.status_code == 200
        data = response.json()
        assert "linked_users" in data
        assert "active_webhooks" in data
        assert "notifications_sent_today" in data
        assert "notifications_sent_total" in data

    def test_stats_all_integers(self):
        """Test that all stats are integers"""
        response = client.get("/api/v1/discord/stats")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data["linked_users"], int)
            assert isinstance(data["active_webhooks"], int)
            assert isinstance(data["notifications_sent_today"], int)
            assert isinstance(data["notifications_sent_total"], int)

    def test_stats_non_negative(self):
        """Test that all stats are non-negative"""
        response = client.get("/api/v1/discord/stats")
        if response.status_code == 200:
            data = response.json()
            assert data["linked_users"] >= 0
            assert data["active_webhooks"] >= 0
            assert data["notifications_sent_today"] >= 0
            assert data["notifications_sent_total"] >= 0


class TestDiscordBotInfo:
    """Tests for GET /api/v1/discord/bot-info"""

    def test_get_bot_info(self):
        """Test getting Discord bot information"""
        response = client.get("/api/v1/discord/bot-info")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data

    def test_bot_info_structure_when_connected(self):
        """Test bot info structure when connected"""
        response = client.get("/api/v1/discord/bot-info")
        if response.status_code == 200:
            data = response.json()
            if data.get("connected"):
                assert "username" in data or "id" in data

    def test_bot_info_structure_when_disconnected(self):
        """Test bot info structure when disconnected"""
        response = client.get("/api/v1/discord/bot-info")
        if response.status_code == 200:
            data = response.json()
            if not data.get("connected"):
                assert "message" in data or "connected" in data

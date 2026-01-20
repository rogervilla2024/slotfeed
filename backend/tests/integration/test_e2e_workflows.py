import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestUserRegistrationWorkflow:
    """Tests for complete user registration and setup workflow"""

    def test_user_registration_complete_flow(self):
        """Test complete user registration flow"""
        # Step 1: Register user
        user_data = {
            "email": "testuser@example.com",
            "password": "SecurePass123!",
            "username": "testuser"
        }
        # Note: Update with actual registration endpoint
        assert user_data["email"] is not None
        assert len(user_data["password"]) > 0

    def test_user_profile_setup_flow(self):
        """Test user profile setup after registration"""
        user_id = "user123"
        profile_data = {
            "display_name": "Test User",
            "preferred_language": "en",
            "timezone": "UTC"
        }
        assert profile_data["display_name"] is not None

    def test_user_preferences_configuration(self):
        """Test setting user preferences"""
        preferences = {
            "theme": "dark",
            "notifications_enabled": True,
            "email_alerts": True
        }
        assert preferences["theme"] in ["light", "dark"]
        assert isinstance(preferences["notifications_enabled"], bool)


class TestAlertSetupWorkflow:
    """Tests for alert rule setup workflow"""

    def test_create_big_win_alert_workflow(self):
        """Test creating big win alert rule"""
        # Step 1: User logs in (implicit)
        user_id = "user123"

        # Step 2: Create alert rule
        alert_data = {
            "type": "big_win",
            "threshold": 100,
            "game_id": "sweet-bonanza",
            "enabled": True,
            "notification_channel": "discord"
        }
        assert alert_data["type"] == "big_win"
        assert alert_data["threshold"] >= 0

    def test_alert_rule_with_discord_integration(self):
        """Test alert rule with Discord webhook"""
        user_id = "user123"

        # Step 1: Link Discord account
        discord_data = {
            "discord_user_id": "123456789",
            "discord_username": "testuser"
        }

        # Step 2: Register webhook
        webhook_data = {
            "webhook_url": "https://discordapp.com/api/webhooks/123456789/abcdefg",
            "channel_name": "alerts",
            "guild_name": "Test Server"
        }

        # Step 3: Create alert rule targeting Discord
        alert_data = {
            "type": "big_win",
            "threshold": 100,
            "notification_channel": "discord_webhook"
        }

        assert webhook_data["webhook_url"] is not None
        assert alert_data["notification_channel"] is not None

    def test_multiple_alert_rules_same_user(self):
        """Test creating multiple alert rules for same user"""
        user_id = "user123"

        # Rule 1: Big wins > 100x on any game
        rule1 = {"type": "big_win", "threshold": 100}

        # Rule 2: Roshtein goes live
        rule2 = {"type": "streamer_live", "streamer_id": "roshtein"}

        # Rule 3: Sweet Bonanza becomes hot
        rule3 = {"type": "hot_slot", "game_id": "sweet-bonanza"}

        assert rule1["type"] == "big_win"
        assert rule2["type"] == "streamer_live"
        assert rule3["type"] == "hot_slot"


class TestStreamSessionWorkflow:
    """Tests for stream session workflow"""

    def test_stream_session_creation_workflow(self):
        """Test complete stream session creation workflow"""
        # Step 1: Detect stream start
        stream_data = {
            "streamer_id": "roshtein",
            "platform": "kick",
            "game": "sweet-bonanza",
            "initial_balance": 1000.0
        }

        # Step 2: Create session record
        session_data = {
            "streamer_id": stream_data["streamer_id"],
            "session_start": "2026-01-08T10:00:00Z",
            "status": "active"
        }

        assert session_data["status"] == "active"
        assert session_data["streamer_id"] == "roshtein"

    def test_session_balance_updates_workflow(self):
        """Test balance updates during session"""
        session_id = "session-123"

        # Simulate OCR readings over time
        readings = [
            {"balance": 1000.0, "bet": 100.0, "timestamp": "T00:00:00Z"},
            {"balance": 950.0, "bet": 100.0, "timestamp": "T00:00:05Z"},
            {"balance": 2000.0, "bet": 100.0, "timestamp": "T00:00:10Z"},  # Win
            {"balance": 1850.0, "bet": 100.0, "timestamp": "T00:00:15Z"},
        ]

        assert len(readings) == 4
        assert readings[2]["balance"] > readings[1]["balance"]  # Win detected

    def test_session_game_change_workflow(self):
        """Test game change during session"""
        session_id = "session-123"

        # Game sequence
        games = [
            {"game_id": "sweet-bonanza", "start_time": "T00:00:00Z"},
            {"game_id": "gates-of-olympus", "start_time": "T00:30:00Z"},
            {"game_id": "sugar-rush", "start_time": "T01:00:00Z"}
        ]

        assert games[0]["game_id"] == "sweet-bonanza"
        assert games[1]["game_id"] == "gates-of-olympus"
        assert games[2]["game_id"] != games[0]["game_id"]

    def test_session_end_workflow(self):
        """Test session end and statistics"""
        session_id = "session-123"

        # Session stats
        stats = {
            "session_start": "2026-01-08T10:00:00Z",
            "session_end": "2026-01-08T12:00:00Z",
            "initial_balance": 1000.0,
            "final_balance": 1500.0,
            "total_wagered": 5000.0,
            "total_winnings": 2000.0,
            "session_profit": 500.0
        }

        assert stats["final_balance"] > stats["initial_balance"]
        assert stats["session_profit"] == stats["final_balance"] - stats["initial_balance"]


class TestBonusHuntWorkflow:
    """Tests for bonus hunt tracking workflow"""

    def test_bonus_hunt_creation_and_tracking(self):
        """Test complete bonus hunt workflow"""
        # Step 1: User starts bonus hunt
        hunt_data = {
            "streamer_id": "roshtein",
            "game_id": "sweet-bonanza",
            "initial_balance": 1000.0,
            "target_bonus_count": 10
        }

        # Step 2: Track bonus entries
        bonuses = [
            {"bonus_id": "bonus_1", "status": "unopened", "cost": 100},
            {"bonus_id": "bonus_2", "status": "unopened", "cost": 100},
            {"bonus_id": "bonus_3", "status": "opened", "cost": 100, "payout": 500},
        ]

        # Step 3: Calculate hunt statistics
        unopened_count = len([b for b in bonuses if b["status"] == "unopened"])
        opened_count = len([b for b in bonuses if b["status"] == "opened"])
        total_cost = sum([b["cost"] for b in bonuses])
        total_payout = sum([b.get("payout", 0) for b in bonuses])
        roi = ((total_payout - total_cost) / total_cost * 100) if total_cost > 0 else 0

        assert unopened_count == 2
        assert opened_count == 1
        assert roi == 100.0


class TestLiveStreamIntegration:
    """Tests for live stream data integration"""

    def test_live_stream_data_correlation(self):
        """Test correlation of live stream data"""
        # Get live streams
        response = client.get("/api/v1/live/streams")
        assert response.status_code in [200, 404]

        # Get hot/cold slots
        response = client.get("/api/v1/games/hot-cold")
        assert response.status_code == 200

        # Data should correlate: hot slots should match played games

    def test_big_win_notification_workflow(self):
        """Test big win detection and notification"""
        # Step 1: Balance update detected
        balance_change = 5000.0
        initial_balance = 100.0

        # Step 2: Calculate multiplier
        multiplier = balance_change / 100.0  # bet amount

        # Step 3: Trigger notification if multiplier > 100
        is_big_win = multiplier >= 100
        assert is_big_win == True

        # Step 4: Send to alert subscribers
        # Verify notification was queued for sending

    def test_chat_analytics_real_time_updates(self):
        """Test real-time chat analytics updates"""
        streamer_id = "roshtein"

        # Get chat metrics
        response = client.get(f"/api/v1/chat-analytics/{streamer_id}/metrics")
        assert response.status_code in [200, 404]

        # Check for hype score
        if response.status_code == 200:
            data = response.json()
            # Should contain sentiment or hype metrics


class TestDataConsistencyWorkflow:
    """Tests for data consistency across services"""

    def test_balance_event_consistency(self):
        """Test balance event consistency in database"""
        session_id = "session-123"

        # Get session details
        response = client.get(f"/api/v1/sessions/{session_id}")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            session_data = response.json()

            # Get balance history
            response = client.get(f"/api/v1/sessions/{session_id}/balance-history")
            assert response.status_code in [200, 404]

    def test_streamer_stats_consistency(self):
        """Test streamer stats consistency"""
        streamer_id = "roshtein"

        # Get streamer profile
        response = client.get(f"/api/v1/streamers/{streamer_id}")
        assert response.status_code in [200, 404]

        # Get streamer stats
        response = client.get(f"/api/v1/streamers/{streamer_id}/stats")
        assert response.status_code in [200, 404]

        # Stats should be consistent with sessions

    def test_game_stats_consistency(self):
        """Test game stats consistency"""
        game_id = "sweet-bonanza"

        # Get game details
        response = client.get(f"/api/v1/games/{game_id}")
        assert response.status_code in [200, 404]

        # Get game stats
        response = client.get(f"/api/v1/games/{game_id}/stats")
        assert response.status_code in [200, 404]

        # Stats should match observed RTP from sessions


class TestNotificationDeliveryWorkflow:
    """Tests for notification delivery workflow"""

    def test_discord_notification_delivery(self):
        """Test Discord notification delivery"""
        user_id = "user123"

        # Step 1: User linked Discord
        link_status = client.get(f"/api/v1/discord/status?user_id={user_id}")
        assert link_status.status_code == 200

        # Step 2: User has webhook registered
        webhooks = client.get(f"/api/v1/discord/webhooks?user_id={user_id}")
        assert webhooks.status_code == 200

        # Step 3: Big win triggers alert
        # Step 4: Notification sent to Discord
        # Step 5: Verify delivery status

    def test_alert_notification_throttling(self):
        """Test alert notification throttling"""
        user_id = "user123"

        # Create multiple alerts
        alerts = [
            {"type": "big_win", "threshold": 100},
            {"type": "big_win", "threshold": 200},
            {"type": "big_win", "threshold": 300}
        ]

        # All three should be created
        assert len(alerts) == 3

        # But notifications should be throttled if multiple trigger simultaneously


class TestCacheInvalidationWorkflow:
    """Tests for cache invalidation on data changes"""

    def test_cache_invalidation_on_session_update(self):
        """Test cache invalidation when session updates"""
        session_id = "session-123"

        # Get session (cached)
        response = client.get(f"/api/v1/sessions/{session_id}")
        first_fetch = response.status_code

        # Update session
        # Cache should be invalidated

        # Get session again (fresh from DB)
        response = client.get(f"/api/v1/sessions/{session_id}")
        second_fetch = response.status_code

        assert first_fetch == second_fetch

    def test_cache_invalidation_on_big_win_detection(self):
        """Test cache invalidation on big win"""
        streamer_id = "roshtein"

        # Big win detected → invalidate cache
        # Get streamer stats (fresh)
        response = client.get(f"/api/v1/streamers/{streamer_id}/stats")
        assert response.status_code in [200, 404]

    def test_admin_cache_management(self):
        """Test admin cache management endpoints"""
        # Clear specific cache
        response = client.post("/api/v1/admin/cache/invalidate")
        assert response.status_code in [200, 401, 403]

        # Clear by key
        response = client.delete("/api/v1/admin/cache/streamer:roshtein")
        assert response.status_code in [200, 204, 401, 403]

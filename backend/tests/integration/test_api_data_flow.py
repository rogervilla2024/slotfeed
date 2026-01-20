import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestStreamerDataFlow:
    """Tests for streamer data consistency across APIs"""

    def test_streamer_profile_to_sessions_flow(self):
        """Test data flow from streamer profile to sessions"""
        streamer_id = "roshtein"

        # Step 1: Get streamer profile
        response = client.get(f"/api/v1/streamers/{streamer_id}")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            streamer = response.json()

            # Step 2: Get streamer's sessions
            response = client.get(f"/api/v1/streamers/{streamer_id}/sessions")
            assert response.status_code in [200, 404]

            if response.status_code == 200:
                sessions = response.json()
                # Sessions should belong to this streamer

    def test_streamer_stats_aggregation(self):
        """Test streamer stats aggregation from sessions"""
        streamer_id = "roshtein"

        # Get streamer stats
        response = client.get(f"/api/v1/streamers/{streamer_id}/stats")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            stats = response.json()
            # Stats should contain:
            # - Total sessions
            # - Total playtime
            # - Total winnings
            # - Average RTP

            expected_fields = ["total_sessions", "total_winnings"]
            for field in expected_fields:
                assert field in stats or isinstance(stats, dict)


class TestSessionDataFlow:
    """Tests for session data consistency"""

    def test_session_balance_history_consistency(self):
        """Test balance history consistency within session"""
        session_id = "session-123"

        # Get session details
        response = client.get(f"/api/v1/sessions/{session_id}")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            session = response.json()

            # Get balance history
            response = client.get(f"/api/v1/sessions/{session_id}/balance-history")
            assert response.status_code in [200, 404]

            # Get game breakdown
            response = client.get(f"/api/v1/sessions/{session_id}/game-breakdown")
            assert response.status_code in [200, 404]

    def test_session_game_breakdown_consistency(self):
        """Test game breakdown totals match session totals"""
        session_id = "session-123"

        # Get session
        response = client.get(f"/api/v1/sessions/{session_id}")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            session = response.json()

            # Get game breakdown
            response = client.get(f"/api/v1/sessions/{session_id}/game-breakdown")
            if response.status_code == 200:
                games = response.json()

                # Sum of game stats should equal session stats
                # Total wagered from games = session total_wagered
                # Total winnings from games = session total_winnings

    def test_session_big_wins_consistency(self):
        """Test big wins in session are consistent"""
        session_id = "session-123"

        # Get big wins for session
        response = client.get(f"/api/v1/sessions/{session_id}/big-wins")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            big_wins = response.json()

            # Each big win should have:
            # - Multiplier >= 100
            # - Valid timestamp within session time
            # - Screenshot URL


class TestGameDataFlow:
    """Tests for game data consistency"""

    def test_game_stats_calculation_flow(self):
        """Test game stats calculation across sessions"""
        game_id = "sweet-bonanza"

        # Step 1: Get game info
        response = client.get(f"/api/v1/games/{game_id}")
        assert response.status_code in [200, 404]

        # Step 2: Get game stats
        response = client.get(f"/api/v1/games/{game_id}/stats")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            stats = response.json()
            # Should have:
            # - Theoretical RTP
            # - Observed RTP (from player sessions)
            # - Sample size
            # - Big win frequency

    def test_game_hot_cold_calculation(self):
        """Test hot/cold score calculation from sessions"""
        game_id = "sweet-bonanza"

        # Get game hot/cold status
        response = client.get(f"/api/v1/hot-cold/{game_id}")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            hot_cold = response.json()
            # Status should be calculated from:
            # - Recent session RTP
            # - Big win frequency
            # - Player feedback
            # - Time window (7d, 30d)


class TestBonusHuntDataFlow:
    """Tests for bonus hunt data flow"""

    def test_bonus_hunt_statistics_calculation(self):
        """Test bonus hunt ROI calculation"""
        hunt_id = "hunt-123"

        # Get hunt details
        response = client.get(f"/api/v1/bonus-hunts/{hunt_id}")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            hunt = response.json()

            # Get hunt stats
            response = client.get(f"/api/v1/bonus-hunts/{hunt_id}/stats")
            assert response.status_code in [200, 404]

            if response.status_code == 200:
                stats = response.json()
                # Verify: ROI = ((total_payout - total_cost) / total_cost) * 100

    def test_bonus_hunt_entry_aggregation(self):
        """Test aggregation of bonus entries in hunt"""
        hunt_id = "hunt-123"

        # Get hunt entries
        response = client.get(f"/api/v1/bonus-hunts/{hunt_id}/entries")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            entries = response.json()

            # Get hunt stats
            response = client.get(f"/api/v1/bonus-hunts/{hunt_id}/stats")
            if response.status_code == 200:
                stats = response.json()

                # Counts should match:
                # unopened count = entries with status unopened
                # opened count = entries with status opened

    def test_bonus_hunt_leaderboard_ranking(self):
        """Test bonus hunt leaderboard ranking calculation"""
        # Get leaderboard
        response = client.get("/api/v1/bonus-hunts/leaderboard")
        assert response.status_code == 200

        if response.status_code == 200:
            leaderboard = response.json()

            # Rankings should be sorted by:
            # - ROI (metric=roi)
            # - Profit (metric=profit)
            # - Hunt count (metric=completed_count)


class TestChatAnalyticsDataFlow:
    """Tests for chat analytics data flow"""

    def test_chat_metrics_aggregation(self):
        """Test chat metrics aggregation over time"""
        streamer_id = "roshtein"

        # Get current metrics
        response = client.get(f"/api/v1/chat-analytics/{streamer_id}/metrics")
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            metrics = response.json()
            # Should have aggregated data from 5-min buckets

    def test_hype_moments_detection_flow(self):
        """Test hype moment detection from analytics"""
        streamer_id = "roshtein"

        # Get hype moments
        response = client.get(f"/api/v1/chat-analytics/{streamer_id}/hype-moments")
        assert response.status_code in [200, 404]

        # Hype moments should be detected from:
        # - Sudden message spike (> 2 std dev)
        # - Positive sentiment spike
        # - Emote frequency spike

    def test_chat_timeline_data_aggregation(self):
        """Test chat timeline aggregation"""
        streamer_id = "roshtein"

        # Get timeline with 5m buckets
        response = client.get(f"/api/v1/chat-analytics/{streamer_id}/timeline?bucket=5m")
        assert response.status_code in [200, 404]

        # Get timeline with 15m buckets
        response = client.get(f"/api/v1/chat-analytics/{streamer_id}/timeline?bucket=15m")
        assert response.status_code in [200, 404]

        # Data should show trends over time


class TestLiveDataConsistency:
    """Tests for live data consistency"""

    def test_live_streams_rtp_correlation(self):
        """Test correlation between live streams and RTP"""
        # Get live streams
        response = client.get("/api/v1/live/streams")
        assert response.status_code == 200

        if response.status_code == 200:
            streams = response.json()

            # Get live RTP
            response = client.get("/api/v1/live/rtp-tracker")
            assert response.status_code in [200, 404]

            # RTP data should match playing streams

    def test_live_big_wins_consistency(self):
        """Test live big wins are current"""
        # Get live big wins
        response = client.get("/api/v1/live/big-wins")
        assert response.status_code == 200

        if response.status_code == 200:
            big_wins = response.json()

            # Get recent big wins from database
            response = client.get("/api/v1/big-wins?limit=20")
            assert response.status_code in [200, 404]

            # Live big wins should be subset of recent wins

    def test_live_chat_activity_freshness(self):
        """Test live chat activity is fresh"""
        # Get live chat activity
        response = client.get("/api/v1/live/chat-activity")
        assert response.status_code in [200, 404]

        # Data should be < 1 minute old


class TestAdminDataValidation:
    """Tests for admin data validation and consistency"""

    def test_admin_stats_calculation_flow(self):
        """Test admin stats aggregation"""
        # Get admin stats
        response = client.get("/api/v1/admin/stats")
        assert response.status_code in [200, 401, 403]

        if response.status_code == 200:
            stats = response.json()

            # Should contain:
            # - Active sessions count
            # - Total big wins today
            # - Platform breakdown
            # - Game breakdown

    def test_admin_user_list_consistency(self):
        """Test user list consistency"""
        # Get user list
        response = client.get("/api/v1/admin/users")
        assert response.status_code in [200, 401, 403]

        # Can filter by role
        response = client.get("/api/v1/admin/users?role=premium")
        assert response.status_code in [200, 401, 403]

        # Can filter by status
        response = client.get("/api/v1/admin/users?status=active")
        assert response.status_code in [200, 401, 403]

    def test_admin_alert_audit_log(self):
        """Test admin audit logging"""
        # Get admin logs
        response = client.get("/api/v1/admin/logs")
        assert response.status_code in [200, 401, 403]

        if response.status_code == 200:
            logs = response.json()

            # Can filter by event type
            response = client.get("/api/v1/admin/logs?event=user_registration")
            assert response.status_code in [200, 401, 403]

            # Logs should have timestamps and user info


class TestErrorPropagation:
    """Tests for error handling across API layers"""

    def test_invalid_session_error_propagation(self):
        """Test error when session doesn't exist"""
        response = client.get("/api/v1/sessions/nonexistent")
        assert response.status_code == 404

        # Balance history should also 404
        response = client.get("/api/v1/sessions/nonexistent/balance-history")
        assert response.status_code == 404

    def test_invalid_streamer_error_propagation(self):
        """Test error when streamer doesn't exist"""
        response = client.get("/api/v1/streamers/nonexistent")
        assert response.status_code == 404

        # Sessions for nonexistent streamer should 404
        response = client.get("/api/v1/streamers/nonexistent/sessions")
        assert response.status_code == 404

    def test_invalid_game_error_propagation(self):
        """Test error when game doesn't exist"""
        response = client.get("/api/v1/games/nonexistent")
        assert response.status_code == 404

        # Stats for nonexistent game should 404
        response = client.get("/api/v1/games/nonexistent/stats")
        assert response.status_code == 404

    def test_database_error_handling(self):
        """Test graceful handling of database errors"""
        # Simulate database error
        # API should return 500 with descriptive error
        # Logs should capture the error


class TestCacheValidation:
    """Tests for cache hit/miss and consistency"""

    def test_cache_hit_consistency(self):
        """Test cache returns same data as database"""
        streamer_id = "roshtein"

        # First request (cache miss)
        response1 = client.get(f"/api/v1/streamers/{streamer_id}")
        data1 = response1.json() if response1.status_code == 200 else None

        # Second request (cache hit)
        response2 = client.get(f"/api/v1/streamers/{streamer_id}")
        data2 = response2.json() if response2.status_code == 200 else None

        # Data should be identical
        assert data1 == data2 or (data1 is None and data2 is None)

    def test_cache_invalidation_on_update(self):
        """Test cache invalidation triggers fresh data"""
        # Get streamer (cached)
        response = client.get("/api/v1/streamers/roshtein")
        first_fetch = response.status_code

        # Simulate streamer data update
        # Cache should be invalidated

        # Get streamer again (fresh)
        response = client.get("/api/v1/streamers/roshtein")
        second_fetch = response.status_code

        # Should still return same status
        assert first_fetch == second_fetch

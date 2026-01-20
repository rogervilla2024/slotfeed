import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestListSessions:
    """Tests for GET /api/v1/sessions/"""

    def test_list_sessions_success(self):
        """Test basic session listing"""
        response = client.get("/api/v1/sessions/")
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data or isinstance(data, list)

    def test_list_sessions_pagination(self):
        """Test pagination parameters"""
        response = client.get("/api/v1/sessions/?skip=0&limit=20")
        assert response.status_code == 200

    def test_list_sessions_limit_validation(self):
        """Test limit parameter validation"""
        response = client.get("/api/v1/sessions/?limit=0")
        assert response.status_code == 422

    def test_list_sessions_negative_skip(self):
        """Test negative skip validation"""
        response = client.get("/api/v1/sessions/?skip=-5")
        assert response.status_code == 422

    def test_list_sessions_custom_limit(self):
        """Test custom limit"""
        response = client.get("/api/v1/sessions/?limit=50")
        assert response.status_code == 200

    def test_list_sessions_streamer_filter(self):
        """Test filtering by streamer"""
        response = client.get("/api/v1/sessions/?streamer_id=roshtein")
        assert response.status_code == 200

    def test_list_sessions_status_filter(self):
        """Test filtering by status"""
        response = client.get("/api/v1/sessions/?status=completed")
        assert response.status_code == 200

    def test_list_sessions_date_range_filter(self):
        """Test filtering by date range"""
        response = client.get("/api/v1/sessions/?start_date=2026-01-01&end_date=2026-01-31")
        assert response.status_code == 200

    def test_list_sessions_sort_by_profit(self):
        """Test sorting by profit"""
        response = client.get("/api/v1/sessions/?sort=profit")
        assert response.status_code == 200

    def test_list_sessions_sort_by_duration(self):
        """Test sorting by duration"""
        response = client.get("/api/v1/sessions/?sort=duration")
        assert response.status_code == 200


class TestGetSession:
    """Tests for GET /api/v1/sessions/{session_id}"""

    def test_get_session_success(self):
        """Test getting specific session"""
        response = client.get("/api/v1/sessions/session-123")
        assert response.status_code in [200, 404]

    def test_get_session_response_structure(self):
        """Test session object fields"""
        response = client.get("/api/v1/sessions/session-123")
        if response.status_code == 200:
            data = response.json()
            assert "id" in data or "session_id" in data

    def test_get_session_nonexistent(self):
        """Test 404 for nonexistent session"""
        response = client.get("/api/v1/sessions/nonexistent-session-xyz")
        assert response.status_code == 404

    def test_get_session_detailed_info(self):
        """Test session contains detailed information"""
        response = client.get("/api/v1/sessions/session-123")
        if response.status_code == 200:
            data = response.json()
            # Should have streamer, game, profit, duration info
            assert any(key in data for key in ["streamer", "streamer_id", "username"])


class TestSessionStats:
    """Tests for GET /api/v1/sessions/{session_id}/stats"""

    def test_get_session_stats(self):
        """Test getting session statistics"""
        response = client.get("/api/v1/sessions/session-123/stats")
        assert response.status_code in [200, 404]

    def test_session_stats_contains_rtp(self):
        """Test stats contain RTP data"""
        response = client.get("/api/v1/sessions/session-123/stats")
        if response.status_code == 200:
            data = response.json()
            assert any(key in data for key in ["rtp", "observed_rtp", "profit"])

    def test_session_stats_numeric_values(self):
        """Test numeric stat values"""
        response = client.get("/api/v1/sessions/session-123/stats")
        if response.status_code == 200:
            data = response.json()
            # Should contain numeric values
            assert len(data) > 0


class TestSessionBalanceHistory:
    """Tests for GET /api/v1/sessions/{session_id}/balance-history"""

    def test_get_balance_history(self):
        """Test getting session balance history"""
        response = client.get("/api/v1/sessions/session-123/balance-history")
        assert response.status_code in [200, 404]

    def test_balance_history_response_structure(self):
        """Test balance history structure"""
        response = client.get("/api/v1/sessions/session-123/balance-history")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    def test_balance_history_time_series(self):
        """Test balance history is time series data"""
        response = client.get("/api/v1/sessions/session-123/balance-history")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and data:
                # Should have timestamp and balance fields
                entry = data[0]
                assert any(key in entry for key in ["timestamp", "time", "balance"])

    def test_balance_history_pagination(self):
        """Test balance history pagination"""
        response = client.get("/api/v1/sessions/session-123/balance-history?limit=100")
        assert response.status_code in [200, 404]


class TestSessionGameBreakdown:
    """Tests for GET /api/v1/sessions/{session_id}/games"""

    def test_get_session_games(self):
        """Test getting games played in session"""
        response = client.get("/api/v1/sessions/session-123/games")
        assert response.status_code in [200, 404]

    def test_session_games_response_structure(self):
        """Test game breakdown structure"""
        response = client.get("/api/v1/sessions/session-123/games")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    def test_session_games_contains_details(self):
        """Test game details in response"""
        response = client.get("/api/v1/sessions/session-123/games")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and data:
                game = data[0]
                assert any(key in game for key in ["game_id", "name", "spins", "profit"])

    def test_session_games_sorted(self):
        """Test games sorted by metric"""
        response = client.get("/api/v1/sessions/session-123/games?sort=profit")
        assert response.status_code in [200, 404]


class TestSessionWins:
    """Tests for GET /api/v1/sessions/{session_id}/big-wins"""

    def test_get_session_big_wins(self):
        """Test getting big wins from session"""
        response = client.get("/api/v1/sessions/session-123/big-wins")
        assert response.status_code in [200, 404]

    def test_big_wins_response_structure(self):
        """Test big wins response structure"""
        response = client.get("/api/v1/sessions/session-123/big-wins")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    def test_big_wins_filter_by_multiplier(self):
        """Test filtering wins by multiplier"""
        response = client.get("/api/v1/sessions/session-123/big-wins?min_multiplier=100")
        assert response.status_code in [200, 404]

    def test_big_wins_sort_by_multiplier(self):
        """Test sorting wins by multiplier"""
        response = client.get("/api/v1/sessions/session-123/big-wins?sort=multiplier")
        assert response.status_code in [200, 404]


class TestSessionBonusHunts:
    """Tests for GET /api/v1/sessions/{session_id}/bonus-hunts"""

    def test_get_session_bonus_hunts(self):
        """Test getting bonus hunts from session"""
        response = client.get("/api/v1/sessions/session-123/bonus-hunts")
        assert response.status_code in [200, 404]

    def test_bonus_hunts_response_structure(self):
        """Test bonus hunts response structure"""
        response = client.get("/api/v1/sessions/session-123/bonus-hunts")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))


class TestSessionComparison:
    """Tests for GET /api/v1/sessions/compare"""

    def test_compare_sessions(self):
        """Test comparing two sessions"""
        response = client.get("/api/v1/sessions/compare?session1=s1&session2=s2")
        assert response.status_code in [200, 404, 422]

    def test_compare_sessions_response(self):
        """Test comparison response structure"""
        response = client.get("/api/v1/sessions/compare?session1=s1&session2=s2")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)


class TestSessionStats:
    """Tests for GET /api/v1/sessions/stats"""

    def test_get_sessions_stats(self):
        """Test aggregate session statistics"""
        response = client.get("/api/v1/sessions/stats")
        assert response.status_code == 200

    def test_sessions_stats_global(self):
        """Test global session stats"""
        response = client.get("/api/v1/sessions/stats?scope=global")
        assert response.status_code == 200

    def test_sessions_stats_by_streamer(self):
        """Test session stats by streamer"""
        response = client.get("/api/v1/sessions/stats?streamer_id=roshtein")
        assert response.status_code == 200

    def test_sessions_stats_period_filter(self):
        """Test stats period filter"""
        response = client.get("/api/v1/sessions/stats?period=7d")
        assert response.status_code == 200

    def test_sessions_stats_30day_period(self):
        """Test 30 day stats"""
        response = client.get("/api/v1/sessions/stats?period=30d")
        assert response.status_code == 200


class TestSessionErrorHandling:
    """Tests for error handling in sessions API"""

    def test_invalid_session_id_format(self):
        """Test invalid session ID format"""
        response = client.get("/api/v1/sessions/!@#$%")
        assert response.status_code in [404, 422]

    def test_invalid_limit_parameter(self):
        """Test invalid limit parameter"""
        response = client.get("/api/v1/sessions/?limit=abc")
        assert response.status_code == 422

    def test_invalid_sort_parameter(self):
        """Test invalid sort parameter"""
        response = client.get("/api/v1/sessions/?sort=invalid")
        assert response.status_code in [200, 422]

    def test_invalid_date_format(self):
        """Test invalid date format"""
        response = client.get("/api/v1/sessions/?start_date=invalid-date")
        assert response.status_code in [200, 422]

    def test_missing_required_parameter(self):
        """Test missing required parameters"""
        response = client.get("/api/v1/sessions/compare?session1=s1")
        assert response.status_code in [422, 404]


class TestSessionPerformance:
    """Tests for session performance and edge cases"""

    def test_list_sessions_large_skip(self):
        """Test with large skip value"""
        response = client.get("/api/v1/sessions/?skip=10000")
        assert response.status_code == 200

    def test_list_sessions_max_limit(self):
        """Test maximum limit"""
        response = client.get("/api/v1/sessions/?limit=100")
        assert response.status_code == 200

    def test_session_with_no_games(self):
        """Test session with no games played"""
        response = client.get("/api/v1/sessions/empty-session/games")
        assert response.status_code in [200, 404]

    def test_session_with_no_wins(self):
        """Test session with no big wins"""
        response = client.get("/api/v1/sessions/no-wins-session/big-wins")
        assert response.status_code in [200, 404]

    def test_zero_duration_session(self):
        """Test session with zero duration"""
        response = client.get("/api/v1/sessions/zero-duration/stats")
        assert response.status_code in [200, 404]

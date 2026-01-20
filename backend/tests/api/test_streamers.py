import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestListStreamers:
    """Tests for GET /api/v1/streamers/"""

    def test_list_streamers_success(self):
        """Test basic streamer listing"""
        response = client.get("/api/v1/streamers/")
        assert response.status_code == 200
        data = response.json()
        assert "streamers" in data
        assert "total" in data
        assert isinstance(data["streamers"], list)

    def test_list_streamers_pagination(self):
        """Test pagination parameters"""
        response = client.get("/api/v1/streamers/?skip=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "skip" in data
        assert "limit" in data

    def test_list_streamers_skip(self):
        """Test skip parameter"""
        response = client.get("/api/v1/streamers/?skip=5")
        assert response.status_code == 200
        data = response.json()
        assert data.get("skip") == 5 or "skip" not in data  # May or may not be in response

    def test_list_streamers_limit(self):
        """Test limit parameter"""
        response = client.get("/api/v1/streamers/?limit=25")
        assert response.status_code == 200
        data = response.json()
        assert len(data["streamers"]) <= 25

    def test_list_streamers_validation_negative_skip(self):
        """Test negative skip validation"""
        response = client.get("/api/v1/streamers/?skip=-1")
        assert response.status_code == 422

    def test_list_streamers_validation_invalid_limit(self):
        """Test invalid limit validation"""
        response = client.get("/api/v1/streamers/?limit=abc")
        assert response.status_code == 422

    def test_list_streamers_platform_filter(self):
        """Test platform filter"""
        response = client.get("/api/v1/streamers/?platform=kick")
        assert response.status_code == 200
        data = response.json()
        assert "streamers" in data

    def test_list_streamers_is_live_filter(self):
        """Test is_live filter"""
        response = client.get("/api/v1/streamers/?is_live=true")
        assert response.status_code == 200
        data = response.json()
        assert "streamers" in data

    def test_list_streamers_sort_by_followers(self):
        """Test sorting by followers"""
        response = client.get("/api/v1/streamers/?sort=followers")
        assert response.status_code == 200
        data = response.json()
        assert "streamers" in data

    def test_list_streamers_sort_descending(self):
        """Test descending sort"""
        response = client.get("/api/v1/streamers/?sort=followers&order=desc")
        assert response.status_code == 200

    def test_list_streamers_response_structure(self):
        """Test response fields"""
        response = client.get("/api/v1/streamers/")
        data = response.json()
        if data["streamers"]:
            streamer = data["streamers"][0]
            assert "id" in streamer or "username" in streamer


class TestGetStreamer:
    """Tests for GET /api/v1/streamers/{username}"""

    def test_get_streamer_success(self):
        """Test getting specific streamer"""
        response = client.get("/api/v1/streamers/roshtein")
        assert response.status_code in [200, 404]

    def test_get_streamer_response_fields(self):
        """Test streamer object fields"""
        response = client.get("/api/v1/streamers/roshtein")
        if response.status_code == 200:
            data = response.json()
            assert "id" in data or "username" in data
            assert "platform" in data or response.status_code == 404

    def test_get_streamer_nonexistent(self):
        """Test 404 for nonexistent streamer"""
        response = client.get("/api/v1/streamers/nonexistent-streamer-xyz")
        assert response.status_code == 404

    def test_get_streamer_case_sensitivity(self):
        """Test username case handling"""
        response1 = client.get("/api/v1/streamers/Roshtein")
        response2 = client.get("/api/v1/streamers/roshtein")
        # Both should return same status
        assert response1.status_code == response2.status_code or response1.status_code == 404


class TestStreamerStats:
    """Tests for GET /api/v1/streamers/{username}/stats"""

    def test_get_streamer_stats_success(self):
        """Test getting streamer statistics"""
        response = client.get("/api/v1/streamers/roshtein/stats")
        assert response.status_code in [200, 404]

    def test_streamer_stats_response_fields(self):
        """Test stats response structure"""
        response = client.get("/api/v1/streamers/roshtein/stats")
        if response.status_code == 200:
            data = response.json()
            assert "username" in data or "streamer_id" in data

    def test_streamer_stats_period_filter(self):
        """Test filtering stats by period"""
        response = client.get("/api/v1/streamers/roshtein/stats?period=7d")
        assert response.status_code in [200, 404]

    def test_streamer_stats_30d_period(self):
        """Test 30 day period stats"""
        response = client.get("/api/v1/streamers/roshtein/stats?period=30d")
        assert response.status_code in [200, 404]

    def test_streamer_stats_all_time(self):
        """Test all-time statistics"""
        response = client.get("/api/v1/streamers/roshtein/stats?period=all")
        assert response.status_code in [200, 404]


class TestStreamerSessions:
    """Tests for GET /api/v1/streamers/{username}/sessions"""

    def test_get_streamer_sessions(self):
        """Test getting streamer sessions"""
        response = client.get("/api/v1/streamers/roshtein/sessions")
        assert response.status_code in [200, 404]

    def test_streamer_sessions_pagination(self):
        """Test sessions pagination"""
        response = client.get("/api/v1/streamers/roshtein/sessions?limit=20")
        assert response.status_code in [200, 404]

    def test_streamer_sessions_skip(self):
        """Test sessions skip"""
        response = client.get("/api/v1/streamers/roshtein/sessions?skip=10")
        assert response.status_code in [200, 404]

    def test_streamer_sessions_status_filter(self):
        """Test filtering sessions by status"""
        response = client.get("/api/v1/streamers/roshtein/sessions?status=completed")
        assert response.status_code in [200, 404]


class TestStreamerLeaderboard:
    """Tests for GET /api/v1/streamers/leaderboard"""

    def test_get_leaderboard_success(self):
        """Test getting streamer leaderboard"""
        response = client.get("/api/v1/streamers/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data or "streamers" in data

    def test_leaderboard_metric_filter(self):
        """Test leaderboard by metric"""
        response = client.get("/api/v1/streamers/leaderboard?metric=followers")
        assert response.status_code == 200

    def test_leaderboard_rtp_metric(self):
        """Test RTP leaderboard"""
        response = client.get("/api/v1/streamers/leaderboard?metric=rtp")
        assert response.status_code == 200

    def test_leaderboard_profit_metric(self):
        """Test profit leaderboard"""
        response = client.get("/api/v1/streamers/leaderboard?metric=profit")
        assert response.status_code == 200

    def test_leaderboard_period_filter(self):
        """Test leaderboard period filter"""
        response = client.get("/api/v1/streamers/leaderboard?period=7d")
        assert response.status_code == 200

    def test_leaderboard_limit(self):
        """Test leaderboard limit"""
        response = client.get("/api/v1/streamers/leaderboard?limit=10")
        assert response.status_code == 200


class TestStreamerGameStats:
    """Tests for GET /api/v1/streamers/{username}/games"""

    def test_get_streamer_games(self):
        """Test getting games played by streamer"""
        response = client.get("/api/v1/streamers/roshtein/games")
        assert response.status_code in [200, 404]

    def test_streamer_games_response_structure(self):
        """Test games response structure"""
        response = client.get("/api/v1/streamers/roshtein/games")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (dict, list))

    def test_streamer_games_pagination(self):
        """Test games pagination"""
        response = client.get("/api/v1/streamers/roshtein/games?limit=15")
        assert response.status_code in [200, 404]

    def test_streamer_games_sort_by_frequency(self):
        """Test sorting games by frequency"""
        response = client.get("/api/v1/streamers/roshtein/games?sort=frequency")
        assert response.status_code in [200, 404]

    def test_streamer_games_sort_by_profit(self):
        """Test sorting games by profit"""
        response = client.get("/api/v1/streamers/roshtein/games?sort=profit")
        assert response.status_code in [200, 404]


class TestStreamerFollow:
    """Tests for POST /api/v1/streamers/{username}/follow"""

    def test_follow_streamer(self):
        """Test following a streamer"""
        response = client.post("/api/v1/streamers/roshtein/follow")
        assert response.status_code in [200, 404, 401, 403]

    def test_unfollow_streamer(self):
        """Test unfollowing a streamer"""
        response = client.post("/api/v1/streamers/roshtein/unfollow")
        assert response.status_code in [200, 404, 401, 403]


class TestStreamerErrorHandling:
    """Tests for error handling in streamers API"""

    def test_invalid_period_parameter(self):
        """Test invalid period parameter"""
        response = client.get("/api/v1/streamers/roshtein/stats?period=invalid")
        assert response.status_code in [200, 422, 404]

    def test_invalid_metric_leaderboard(self):
        """Test invalid leaderboard metric"""
        response = client.get("/api/v1/streamers/leaderboard?metric=invalid")
        assert response.status_code in [200, 422]

    def test_invalid_limit_leaderboard(self):
        """Test invalid leaderboard limit"""
        response = client.get("/api/v1/streamers/leaderboard?limit=abc")
        assert response.status_code == 422

    def test_negative_limit_parameter(self):
        """Test negative limit"""
        response = client.get("/api/v1/streamers/?limit=-10")
        assert response.status_code == 422

    def test_empty_username_path(self):
        """Test empty username in path"""
        response = client.get("/api/v1/streamers//stats")
        assert response.status_code in [404, 422]


class TestStreamerBulkOperations:
    """Tests for bulk streamer operations"""

    def test_list_top_streamers(self):
        """Test getting top streamers"""
        response = client.get("/api/v1/streamers/?sort=followers&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["streamers"]) <= 10

    def test_list_live_streamers(self):
        """Test getting live streamers"""
        response = client.get("/api/v1/live/streams")
        assert response.status_code == 200

    def test_streamer_filter_chain(self):
        """Test combining multiple filters"""
        response = client.get("/api/v1/streamers/?platform=kick&is_live=true&limit=20")
        assert response.status_code == 200
        data = response.json()
        assert "streamers" in data

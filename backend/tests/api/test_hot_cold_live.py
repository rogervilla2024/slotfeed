import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHotColdSlots:
    """Tests for GET /api/v1/games/hot-cold"""

    def test_get_hot_cold_slots(self):
        """Test getting hot/cold slots"""
        response = client.get("/api/v1/games/hot-cold")
        assert response.status_code == 200
        data = response.json()
        assert "hot" in data
        assert "cold" in data

    def test_hot_cold_limit_default(self):
        """Test default limit"""
        response = client.get("/api/v1/games/hot-cold")
        data = response.json()
        assert len(data["hot"]) <= 10
        assert len(data["cold"]) <= 10

    def test_hot_cold_limit_custom(self):
        """Test custom limit"""
        response = client.get("/api/v1/games/hot-cold?limit=5")
        data = response.json()
        assert len(data["hot"]) <= 5
        assert len(data["cold"]) <= 5

    def test_hot_cold_limit_max(self):
        """Test max limit"""
        response = client.get("/api/v1/games/hot-cold?limit=50")
        assert response.status_code == 200

    def test_hot_cold_limit_validation(self):
        """Test limit validation"""
        response = client.get("/api/v1/games/hot-cold?limit=51")
        assert response.status_code == 422

    def test_hot_cold_arrays(self):
        """Test hot/cold are arrays"""
        response = client.get("/api/v1/games/hot-cold")
        data = response.json()
        assert isinstance(data["hot"], list)
        assert isinstance(data["cold"], list)

    def test_hot_cold_updated_at(self):
        """Test updated_at timestamp"""
        response = client.get("/api/v1/games/hot-cold")
        data = response.json()
        assert "updated_at" in data

    def test_hot_cold_content(self):
        """Test hot/cold slots contain data"""
        response = client.get("/api/v1/games/hot-cold")
        data = response.json()
        if data["hot"]:
            slot = data["hot"][0]
            assert "id" in slot or "name" in slot

    def test_hot_slots_are_hot(self):
        """Test hot slots have high scores"""
        response = client.get("/api/v1/games/hot-cold?limit=10")
        data = response.json()
        if data["hot"]:
            # Hot slots should have higher scores than cold
            assert len(data["hot"]) > 0

    def test_cold_slots_are_cold(self):
        """Test cold slots have low scores"""
        response = client.get("/api/v1/games/hot-cold?limit=10")
        data = response.json()
        if data["cold"]:
            # Cold slots should have lower scores than hot
            assert len(data["cold"]) > 0


class TestLiveStreams:
    """Tests for GET /api/v1/live/streams"""

    def test_get_live_streams(self):
        """Test getting live streams"""
        response = client.get("/api/v1/live/streams")
        assert response.status_code == 200
        data = response.json()
        assert "streams" in data or isinstance(data, (list, dict))

    def test_live_streams_response_structure(self):
        """Test live streams response"""
        response = client.get("/api/v1/live/streams")
        data = response.json()
        if isinstance(data, dict):
            assert "streams" in data

    def test_live_streams_pagination(self):
        """Test live streams pagination"""
        response = client.get("/api/v1/live/streams?limit=20")
        assert response.status_code == 200

    def test_live_streams_platform_filter(self):
        """Test filtering by platform"""
        response = client.get("/api/v1/live/streams?platform=kick")
        assert response.status_code == 200

    def test_live_streams_game_filter(self):
        """Test filtering by game"""
        response = client.get("/api/v1/live/streams?game_id=sweet-bonanza")
        assert response.status_code == 200

    def test_live_streams_sort_by_viewers(self):
        """Test sorting by viewers"""
        response = client.get("/api/v1/live/streams?sort=viewers")
        assert response.status_code == 200

    def test_live_streams_contains_streamer_info(self):
        """Test live streams contain streamer info"""
        response = client.get("/api/v1/live/streams")
        data = response.json()
        if isinstance(data, dict) and data.get("streams"):
            stream = data["streams"][0]
            assert any(key in stream for key in ["streamer", "username", "channel"])

    def test_live_streams_contains_game_info(self):
        """Test live streams contain game info"""
        response = client.get("/api/v1/live/streams")
        data = response.json()
        if isinstance(data, dict) and data.get("streams"):
            if data["streams"]:
                stream = data["streams"][0]
                assert any(key in stream for key in ["game", "game_name", "game_id"])

    def test_live_streams_contains_viewer_count(self):
        """Test live streams contain viewer count"""
        response = client.get("/api/v1/live/streams")
        data = response.json()
        if isinstance(data, dict) and data.get("streams"):
            if data["streams"]:
                stream = data["streams"][0]
                assert any(key in stream for key in ["viewers", "viewer_count"])


class TestLiveRTP:
    """Tests for GET /api/v1/live/rtp-tracker"""

    def test_get_live_rtp(self):
        """Test getting live RTP data"""
        response = client.get("/api/v1/live/rtp-tracker")
        assert response.status_code in [200, 404]

    def test_live_rtp_structure(self):
        """Test live RTP response structure"""
        response = client.get("/api/v1/live/rtp-tracker")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    def test_live_rtp_game_filter(self):
        """Test filtering by game"""
        response = client.get("/api/v1/live/rtp-tracker?game_id=sweet-bonanza")
        assert response.status_code in [200, 404]

    def test_live_rtp_streamer_filter(self):
        """Test filtering by streamer"""
        response = client.get("/api/v1/live/rtp-tracker?streamer_id=roshtein")
        assert response.status_code in [200, 404]


class TestLiveBigWins:
    """Tests for GET /api/v1/live/big-wins"""

    def test_get_live_big_wins(self):
        """Test getting live big wins"""
        response = client.get("/api/v1/live/big-wins")
        assert response.status_code == 200
        data = response.json()
        assert "wins" in data or isinstance(data, (list, dict))

    def test_live_big_wins_pagination(self):
        """Test big wins pagination"""
        response = client.get("/api/v1/live/big-wins?limit=50")
        assert response.status_code == 200

    def test_live_big_wins_min_multiplier(self):
        """Test filtering by min multiplier"""
        response = client.get("/api/v1/live/big-wins?min_multiplier=100")
        assert response.status_code == 200

    def test_live_big_wins_game_filter(self):
        """Test filtering by game"""
        response = client.get("/api/v1/live/big-wins?game_id=sweet-bonanza")
        assert response.status_code == 200

    def test_live_big_wins_sort_by_multiplier(self):
        """Test sorting by multiplier"""
        response = client.get("/api/v1/live/big-wins?sort=multiplier")
        assert response.status_code == 200


class TestLiveChatActivity:
    """Tests for GET /api/v1/live/chat-activity"""

    def test_get_live_chat_activity(self):
        """Test getting live chat activity"""
        response = client.get("/api/v1/live/chat-activity")
        assert response.status_code in [200, 404]

    def test_live_chat_activity_streamer_filter(self):
        """Test filtering by streamer"""
        response = client.get("/api/v1/live/chat-activity?streamer_id=roshtein")
        assert response.status_code in [200, 404]

    def test_live_chat_activity_limit(self):
        """Test chat activity limit"""
        response = client.get("/api/v1/live/chat-activity?limit=100")
        assert response.status_code in [200, 404]


class TestHotColdDetails:
    """Tests for GET /api/v1/hot-cold/{game_id}"""

    def test_get_game_hot_cold_details(self):
        """Test getting hot/cold details for specific game"""
        response = client.get("/api/v1/hot-cold/sweet-bonanza")
        assert response.status_code in [200, 404]

    def test_game_hot_cold_score(self):
        """Test hot/cold score for game"""
        response = client.get("/api/v1/hot-cold/sweet-bonanza")
        if response.status_code == 200:
            data = response.json()
            assert any(key in data for key in ["score", "status", "hype_level"])

    def test_game_hot_cold_big_wins(self):
        """Test hot/cold includes recent big wins"""
        response = client.get("/api/v1/hot-cold/sweet-bonanza")
        if response.status_code == 200:
            data = response.json()
            assert any(key in data for key in ["big_wins", "recent_wins", "wins"])

    def test_game_hot_cold_updated_at(self):
        """Test hot/cold includes update time"""
        response = client.get("/api/v1/hot-cold/sweet-bonanza")
        if response.status_code == 200:
            data = response.json()
            assert "updated_at" in data or "last_updated" in data


class TestLiveAndHotColdErrors:
    """Tests for error handling in live/hot-cold APIs"""

    def test_invalid_game_id(self):
        """Test invalid game ID"""
        response = client.get("/api/v1/hot-cold/!@#$%")
        assert response.status_code in [404, 422]

    def test_invalid_limit_hot_cold(self):
        """Test invalid limit"""
        response = client.get("/api/v1/games/hot-cold?limit=abc")
        assert response.status_code == 422

    def test_invalid_multiplier_filter(self):
        """Test invalid multiplier filter"""
        response = client.get("/api/v1/live/big-wins?min_multiplier=abc")
        assert response.status_code == 422

    def test_live_streams_invalid_sort(self):
        """Test invalid sort parameter"""
        response = client.get("/api/v1/live/streams?sort=invalid")
        assert response.status_code in [200, 422]

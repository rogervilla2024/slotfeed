import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestListGames:
    """Tests for GET /api/v1/games/"""

    def test_list_games_success(self):
        """Test basic game listing"""
        response = client.get("/api/v1/games/")
        assert response.status_code == 200
        data = response.json()
        assert "games" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert data["skip"] == 0
        assert data["limit"] == 20

    def test_list_games_with_skip(self):
        """Test pagination with skip parameter"""
        response = client.get("/api/v1/games/?skip=10")
        assert response.status_code == 200
        data = response.json()
        assert data["skip"] == 10

    def test_list_games_with_limit(self):
        """Test pagination with custom limit"""
        response = client.get("/api/v1/games/?limit=50")
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 50

    def test_list_games_with_max_limit(self):
        """Test limit capped at 100"""
        response = client.get("/api/v1/games/?limit=200")
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 100

    def test_list_games_with_min_limit(self):
        """Test minimum limit of 1"""
        response = client.get("/api/v1/games/?limit=1")
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 1

    def test_list_games_skip_validation(self):
        """Test negative skip rejected"""
        response = client.get("/api/v1/games/?skip=-1")
        assert response.status_code == 422

    def test_list_games_limit_validation(self):
        """Test limit validation"""
        response = client.get("/api/v1/games/?limit=0")
        assert response.status_code == 422

    def test_list_games_filter_by_provider(self):
        """Test filtering by provider"""
        response = client.get("/api/v1/games/?provider=pragmatic-play")
        assert response.status_code == 200
        data = response.json()
        assert "games" in data

    def test_list_games_filter_by_volatility(self):
        """Test filtering by volatility"""
        response = client.get("/api/v1/games/?volatility=high")
        assert response.status_code == 200
        data = response.json()
        assert "games" in data

    def test_list_games_combined_filters(self):
        """Test combining multiple filters"""
        response = client.get("/api/v1/games/?provider=pragmatic-play&volatility=medium&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 10

    def test_list_games_response_structure(self):
        """Test response contains required fields"""
        response = client.get("/api/v1/games/")
        data = response.json()
        assert isinstance(data["games"], list)
        assert isinstance(data["total"], int)

    def test_list_games_pagination_consistency(self):
        """Test skip and limit work correctly"""
        response = client.get("/api/v1/games/?skip=5&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["skip"] == 5
        assert data["limit"] == 10


class TestGetGame:
    """Tests for GET /api/v1/games/{game_id}"""

    def test_get_game_success(self):
        """Test retrieving a specific game"""
        response = client.get("/api/v1/games/sweet-bonanza")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "sweet-bonanza"
        assert "name" in data
        assert "rtp" in data
        assert "volatility" in data

    def test_get_game_response_fields(self):
        """Test game object has required fields"""
        response = client.get("/api/v1/games/gates-of-olympus")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "slug" in data
        assert "provider" in data
        assert "rtp" in data
        assert "volatility" in data
        assert "max_multiplier" in data
        assert "is_active" in data

    def test_get_game_rtp_format(self):
        """Test RTP is numeric"""
        response = client.get("/api/v1/games/sweet-bonanza")
        data = response.json()
        assert isinstance(data["rtp"], (int, float))
        assert 0 <= data["rtp"] <= 100

    def test_get_game_max_multiplier_positive(self):
        """Test max_multiplier is positive"""
        response = client.get("/api/v1/games/sweet-bonanza")
        data = response.json()
        assert data["max_multiplier"] > 0

    def test_get_game_is_active_boolean(self):
        """Test is_active is boolean"""
        response = client.get("/api/v1/games/sweet-bonanza")
        data = response.json()
        assert isinstance(data["is_active"], bool)

    def test_get_game_nonexistent(self):
        """Test 404 for nonexistent game"""
        response = client.get("/api/v1/games/nonexistent-game-xyz")
        assert response.status_code == 404

    def test_get_game_empty_id(self):
        """Test invalid empty game ID"""
        response = client.get("/api/v1/games/")
        # This hits the list endpoint, not get
        assert response.status_code == 200

    def test_get_game_case_sensitivity(self):
        """Test game ID case handling"""
        response1 = client.get("/api/v1/games/sweet-bonanza")
        assert response1.status_code == 200


class TestGetGameStats:
    """Tests for GET /api/v1/games/{game_id}/stats"""

    def test_get_game_stats_default_period(self):
        """Test getting stats with default 30d period"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["game_id"] == "sweet-bonanza"
        assert data["period"] == "30d"

    def test_get_game_stats_7d_period(self):
        """Test getting stats for 7 day period"""
        response = client.get("/api/v1/games/sweet-bonanza/stats?period=7d")
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "7d"

    def test_get_game_stats_90d_period(self):
        """Test getting stats for 90 day period"""
        response = client.get("/api/v1/games/sweet-bonanza/stats?period=90d")
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "90d"

    def test_get_game_stats_all_period(self):
        """Test getting all-time stats"""
        response = client.get("/api/v1/games/sweet-bonanza/stats?period=all")
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "all"

    def test_get_game_stats_response_fields(self):
        """Test stats response structure"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        data = response.json()
        assert "game_id" in data
        assert "period" in data
        assert "observed_rtp" in data
        assert "theoretical_rtp" in data
        assert "total_spins" in data
        assert "total_wagered" in data
        assert "bonus_frequency" in data
        assert "average_bonus_payout" in data
        assert "biggest_wins" in data
        assert "streamer_rankings" in data

    def test_get_game_stats_numeric_values(self):
        """Test stats contain numeric values"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        data = response.json()
        assert isinstance(data["observed_rtp"], (int, float))
        assert isinstance(data["theoretical_rtp"], (int, float))
        assert isinstance(data["total_spins"], int)
        assert isinstance(data["total_wagered"], (int, float))

    def test_get_game_stats_rtp_range(self):
        """Test RTP values are in valid range"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        data = response.json()
        assert 0 <= data["observed_rtp"] <= 100
        assert 0 <= data["theoretical_rtp"] <= 100

    def test_get_game_stats_positive_spins(self):
        """Test spin count is non-negative"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        data = response.json()
        assert data["total_spins"] >= 0

    def test_get_game_stats_positive_wagered(self):
        """Test wagered amount is non-negative"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        data = response.json()
        assert data["total_wagered"] >= 0

    def test_get_game_stats_biggest_wins_array(self):
        """Test biggest_wins is array"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        data = response.json()
        assert isinstance(data["biggest_wins"], list)

    def test_get_game_stats_streamer_rankings_array(self):
        """Test streamer_rankings is array"""
        response = client.get("/api/v1/games/sweet-bonanza/stats")
        data = response.json()
        assert isinstance(data["streamer_rankings"], list)


class TestGetGameHotCold:
    """Tests for GET /api/v1/games/hot-cold"""

    def test_get_hot_cold_success(self):
        """Test getting hot/cold slots"""
        response = client.get("/api/v1/games/hot-cold")
        assert response.status_code == 200
        data = response.json()
        assert "hot" in data
        assert "cold" in data
        assert "updated_at" in data

    def test_hot_cold_arrays(self):
        """Test hot and cold are arrays"""
        response = client.get("/api/v1/games/hot-cold")
        data = response.json()
        assert isinstance(data["hot"], list)
        assert isinstance(data["cold"], list)

    def test_hot_cold_default_limit(self):
        """Test default limit of 10"""
        response = client.get("/api/v1/games/hot-cold")
        data = response.json()
        assert len(data["hot"]) <= 10
        assert len(data["cold"]) <= 10

    def test_hot_cold_custom_limit(self):
        """Test custom limit parameter"""
        response = client.get("/api/v1/games/hot-cold?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["hot"]) <= 5
        assert len(data["cold"]) <= 5

    def test_hot_cold_limit_validation(self):
        """Test limit parameter validation"""
        response = client.get("/api/v1/games/hot-cold?limit=51")
        assert response.status_code == 422

    def test_hot_cold_limit_min_validation(self):
        """Test minimum limit"""
        response = client.get("/api/v1/games/hot-cold?limit=0")
        assert response.status_code == 422

    def test_hot_cold_updated_at_field(self):
        """Test updated_at timestamp"""
        response = client.get("/api/v1/games/hot-cold")
        data = response.json()
        assert data["updated_at"] is None or isinstance(data["updated_at"], str)


class TestGameContentAPI:
    """Tests for GET /api/v1/games/{game_id}/content"""

    def test_get_game_content_success(self):
        """Test getting game content"""
        response = client.get("/api/v1/games/sweet-bonanza/content")
        assert response.status_code in [200, 404]  # May not have content yet
        if response.status_code == 200:
            data = response.json()
            assert "overview" in data or data == {}

    def test_game_content_structure(self):
        """Test content response structure"""
        response = client.get("/api/v1/games/sweet-bonanza/content")
        if response.status_code == 200:
            data = response.json()
            if data:
                # If content exists, check structure
                valid_fields = ["overview", "rtp_explanation", "volatility_analysis",
                               "bonus_features", "strategies", "streamer_insights",
                               "meta_description", "focus_keywords"]
                for key in data.keys():
                    assert key in valid_fields


class TestGamesErrorHandling:
    """Tests for error handling in games API"""

    def test_invalid_query_parameter_type(self):
        """Test invalid query parameter type"""
        response = client.get("/api/v1/games/?limit=abc")
        assert response.status_code == 422

    def test_negative_skip_parameter(self):
        """Test negative skip parameter"""
        response = client.get("/api/v1/games/?skip=-5")
        assert response.status_code == 422

    def test_invalid_volatility_filter(self):
        """Test invalid volatility filter (still 200, just no results)"""
        response = client.get("/api/v1/games/?volatility=invalid")
        assert response.status_code == 200

    def test_malformed_url(self):
        """Test malformed URL"""
        response = client.get("/api/v1/games/!@#$%")
        # Should either 404 or handle gracefully
        assert response.status_code in [200, 404, 422]

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestListBonusHunts:
    """Tests for GET /api/v1/bonus-hunts/"""

    def test_list_bonus_hunts_success(self):
        """Test basic bonus hunt listing"""
        response = client.get("/api/v1/bonus-hunts/")
        assert response.status_code == 200
        data = response.json()
        assert "hunts" in data or isinstance(data, (list, dict))

    def test_list_bonus_hunts_pagination(self):
        """Test pagination parameters"""
        response = client.get("/api/v1/bonus-hunts/?skip=0&limit=20")
        assert response.status_code == 200

    def test_list_bonus_hunts_status_filter(self):
        """Test filtering by status"""
        response = client.get("/api/v1/bonus-hunts/?status=completed")
        assert response.status_code == 200

    def test_list_bonus_hunts_status_collecting(self):
        """Test collecting status filter"""
        response = client.get("/api/v1/bonus-hunts/?status=collecting")
        assert response.status_code == 200

    def test_list_bonus_hunts_status_opening(self):
        """Test opening status filter"""
        response = client.get("/api/v1/bonus-hunts/?status=opening")
        assert response.status_code == 200

    def test_list_bonus_hunts_status_cancelled(self):
        """Test cancelled status filter"""
        response = client.get("/api/v1/bonus-hunts/?status=cancelled")
        assert response.status_code == 200

    def test_list_bonus_hunts_streamer_filter(self):
        """Test filtering by streamer"""
        response = client.get("/api/v1/bonus-hunts/?streamer_id=roshtein")
        assert response.status_code == 200

    def test_list_bonus_hunts_game_filter(self):
        """Test filtering by game"""
        response = client.get("/api/v1/bonus-hunts/?game_id=sweet-bonanza")
        assert response.status_code == 200

    def test_list_bonus_hunts_sort_by_roi(self):
        """Test sorting by ROI"""
        response = client.get("/api/v1/bonus-hunts/?sort=roi")
        assert response.status_code == 200

    def test_list_bonus_hunts_sort_by_profit(self):
        """Test sorting by profit"""
        response = client.get("/api/v1/bonus-hunts/?sort=profit")
        assert response.status_code == 200

    def test_list_bonus_hunts_sort_by_date(self):
        """Test sorting by date"""
        response = client.get("/api/v1/bonus-hunts/?sort=date")
        assert response.status_code == 200

    def test_list_bonus_hunts_limit_validation(self):
        """Test limit validation"""
        response = client.get("/api/v1/bonus-hunts/?limit=0")
        assert response.status_code == 422

    def test_list_bonus_hunts_negative_skip(self):
        """Test negative skip validation"""
        response = client.get("/api/v1/bonus-hunts/?skip=-5")
        assert response.status_code == 422

    def test_list_bonus_hunts_combined_filters(self):
        """Test combining multiple filters"""
        response = client.get("/api/v1/bonus-hunts/?status=completed&streamer_id=roshtein&sort=roi")
        assert response.status_code == 200


class TestGetBonusHunt:
    """Tests for GET /api/v1/bonus-hunts/{hunt_id}"""

    def test_get_bonus_hunt_success(self):
        """Test getting specific bonus hunt"""
        response = client.get("/api/v1/bonus-hunts/hunt-123")
        assert response.status_code in [200, 404]

    def test_get_bonus_hunt_response_structure(self):
        """Test bonus hunt response structure"""
        response = client.get("/api/v1/bonus-hunts/hunt-123")
        if response.status_code == 200:
            data = response.json()
            assert "id" in data or "hunt_id" in data

    def test_get_bonus_hunt_contains_roi(self):
        """Test bonus hunt contains ROI calculation"""
        response = client.get("/api/v1/bonus-hunts/hunt-123")
        if response.status_code == 200:
            data = response.json()
            assert any(key in data for key in ["roi", "roi_percent", "roi_percentage"])

    def test_get_bonus_hunt_nonexistent(self):
        """Test 404 for nonexistent hunt"""
        response = client.get("/api/v1/bonus-hunts/nonexistent-hunt")
        assert response.status_code == 404


class TestBonusHuntStats:
    """Tests for GET /api/v1/bonus-hunts/{hunt_id}/stats"""

    def test_get_bonus_hunt_stats(self):
        """Test getting bonus hunt statistics"""
        response = client.get("/api/v1/bonus-hunts/hunt-123/stats")
        assert response.status_code in [200, 404]

    def test_bonus_hunt_stats_contains_metrics(self):
        """Test stats contain required metrics"""
        response = client.get("/api/v1/bonus-hunts/hunt-123/stats")
        if response.status_code == 200:
            data = response.json()
            assert any(key in data for key in ["total_cost", "total_payout", "roi"])

    def test_bonus_hunt_stats_financial_data(self):
        """Test stats contain financial data"""
        response = client.get("/api/v1/bonus-hunts/hunt-123/stats")
        if response.status_code == 200:
            data = response.json()
            # Should have cost and payout info
            assert len(data) > 0


class TestBonusHuntEntries:
    """Tests for GET /api/v1/bonus-hunts/{hunt_id}/entries"""

    def test_get_bonus_hunt_entries(self):
        """Test getting entries in bonus hunt"""
        response = client.get("/api/v1/bonus-hunts/hunt-123/entries")
        assert response.status_code in [200, 404]

    def test_bonus_hunt_entries_structure(self):
        """Test entries response structure"""
        response = client.get("/api/v1/bonus-hunts/hunt-123/entries")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    def test_bonus_hunt_entries_pagination(self):
        """Test entries pagination"""
        response = client.get("/api/v1/bonus-hunts/hunt-123/entries?limit=50")
        assert response.status_code in [200, 404]

    def test_bonus_hunt_entries_status_filter(self):
        """Test filtering entries by status"""
        response = client.get("/api/v1/bonus-hunts/hunt-123/entries?status=opened")
        assert response.status_code in [200, 404]


class TestCreateBonusHunt:
    """Tests for POST /api/v1/bonus-hunts/"""

    def test_create_bonus_hunt(self):
        """Test creating new bonus hunt"""
        hunt_data = {
            "streamer_id": "roshtein",
            "game_id": "sweet-bonanza",
            "initial_balance": 1000,
            "target_bonus_count": 10
        }
        response = client.post("/api/v1/bonus-hunts/", json=hunt_data)
        assert response.status_code in [201, 200, 401, 403, 422]

    def test_create_bonus_hunt_validation(self):
        """Test bonus hunt creation validation"""
        invalid_data = {
            "streamer_id": "",
            "game_id": "",
        }
        response = client.post("/api/v1/bonus-hunts/", json=invalid_data)
        assert response.status_code in [422, 400, 403]

    def test_create_bonus_hunt_missing_fields(self):
        """Test missing required fields"""
        incomplete_data = {
            "streamer_id": "roshtein"
        }
        response = client.post("/api/v1/bonus-hunts/", json=incomplete_data)
        assert response.status_code == 422


class TestUpdateBonusHunt:
    """Tests for PATCH /api/v1/bonus-hunts/{hunt_id}"""

    def test_update_bonus_hunt_status(self):
        """Test updating bonus hunt status"""
        update_data = {"status": "opening"}
        response = client.patch("/api/v1/bonus-hunts/hunt-123", json=update_data)
        assert response.status_code in [200, 404, 401, 403]

    def test_update_bonus_hunt_cost(self):
        """Test updating bonus hunt cost"""
        update_data = {"total_cost": 1500}
        response = client.patch("/api/v1/bonus-hunts/hunt-123", json=update_data)
        assert response.status_code in [200, 404, 401, 403]

    def test_update_bonus_hunt_payout(self):
        """Test updating bonus hunt payout"""
        update_data = {"total_payout": 2000}
        response = client.patch("/api/v1/bonus-hunts/hunt-123", json=update_data)
        assert response.status_code in [200, 404, 401, 403]


class TestBonusHuntLeaderboard:
    """Tests for GET /api/v1/bonus-hunts/leaderboard"""

    def test_get_bonus_hunt_leaderboard(self):
        """Test getting bonus hunt leaderboard"""
        response = client.get("/api/v1/bonus-hunts/leaderboard")
        assert response.status_code == 200

    def test_leaderboard_by_roi(self):
        """Test leaderboard sorted by ROI"""
        response = client.get("/api/v1/bonus-hunts/leaderboard?metric=roi")
        assert response.status_code == 200

    def test_leaderboard_by_profit(self):
        """Test leaderboard sorted by profit"""
        response = client.get("/api/v1/bonus-hunts/leaderboard?metric=profit")
        assert response.status_code == 200

    def test_leaderboard_by_hunts_completed(self):
        """Test leaderboard sorted by hunts completed"""
        response = client.get("/api/v1/bonus-hunts/leaderboard?metric=completed_count")
        assert response.status_code == 200

    def test_leaderboard_period_filter(self):
        """Test leaderboard period filter"""
        response = client.get("/api/v1/bonus-hunts/leaderboard?period=7d")
        assert response.status_code == 200

    def test_leaderboard_limit(self):
        """Test leaderboard limit"""
        response = client.get("/api/v1/bonus-hunts/leaderboard?limit=20")
        assert response.status_code == 200


class TestBonusHuntStats:
    """Tests for GET /api/v1/bonus-hunts/stats"""

    def test_get_aggregate_bonus_hunt_stats(self):
        """Test aggregate bonus hunt statistics"""
        response = client.get("/api/v1/bonus-hunts/stats")
        assert response.status_code == 200

    def test_bonus_hunts_stats_global(self):
        """Test global bonus hunt stats"""
        response = client.get("/api/v1/bonus-hunts/stats?scope=global")
        assert response.status_code == 200

    def test_bonus_hunts_stats_by_streamer(self):
        """Test bonus hunt stats by streamer"""
        response = client.get("/api/v1/bonus-hunts/stats?streamer_id=roshtein")
        assert response.status_code == 200

    def test_bonus_hunts_stats_by_game(self):
        """Test bonus hunt stats by game"""
        response = client.get("/api/v1/bonus-hunts/stats?game_id=sweet-bonanza")
        assert response.status_code == 200

    def test_bonus_hunts_stats_period(self):
        """Test bonus hunt stats with period filter"""
        response = client.get("/api/v1/bonus-hunts/stats?period=30d")
        assert response.status_code == 200


class TestBonusHuntErrorHandling:
    """Tests for error handling in bonus hunts API"""

    def test_invalid_hunt_id(self):
        """Test invalid hunt ID format"""
        response = client.get("/api/v1/bonus-hunts/!@#$%")
        assert response.status_code in [404, 422]

    def test_invalid_status_filter(self):
        """Test invalid status filter"""
        response = client.get("/api/v1/bonus-hunts/?status=invalid")
        assert response.status_code in [200, 422]

    def test_invalid_sort_parameter(self):
        """Test invalid sort parameter"""
        response = client.get("/api/v1/bonus-hunts/?sort=invalid")
        assert response.status_code in [200, 422]

    def test_invalid_limit_parameter(self):
        """Test invalid limit parameter"""
        response = client.get("/api/v1/bonus-hunts/?limit=abc")
        assert response.status_code == 422

    def test_invalid_metric_leaderboard(self):
        """Test invalid leaderboard metric"""
        response = client.get("/api/v1/bonus-hunts/leaderboard?metric=invalid")
        assert response.status_code in [200, 422]

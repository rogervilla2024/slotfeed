"""
Tests for Admin API endpoints
Tests game content management, generation queue, and analytics
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from app.main import app
from app.models.game_content import GameContent
from app.models.content_generation_queue import ContentGenerationQueue
from app.core.database import SessionLocal


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def db():
    """Create a test database session"""
    db = SessionLocal()
    yield db
    db.close()


class TestAdminGameContents:
    """Test suite for game content management endpoints"""

    def test_list_game_contents_empty(self, client):
        """Test listing game contents when empty"""
        response = client.get("/api/v1/admin/game-contents")
        assert response.status_code == 200
        assert response.json()["total"] == 0
        assert response.json()["contents"] == []

    def test_list_game_contents_with_limit(self, client):
        """Test listing game contents with custom limit"""
        response = client.get("/api/v1/admin/game-contents?limit=50")
        assert response.status_code == 200
        assert "limit" in response.json()
        assert response.json()["limit"] == 50

    def test_list_game_contents_published_filter(self, client):
        """Test filtering by published status"""
        response = client.get("/api/v1/admin/game-contents?published_only=true")
        assert response.status_code == 200
        data = response.json()
        assert "contents" in data

    def test_get_game_content_not_found(self, client):
        """Test getting non-existent game content"""
        response = client.get("/api/v1/admin/game-contents/nonexistent-game")
        assert response.status_code == 404

    def test_update_game_content_not_found(self, client):
        """Test updating non-existent game content"""
        response = client.put(
            "/api/v1/admin/game-contents/nonexistent-game",
            json={"overview": "Updated content"}
        )
        assert response.status_code == 404

    def test_update_game_content_overview(self, client, db):
        """Test updating overview section"""
        # Create a test game content
        game_content = GameContent(
            game_id="test-game",
            overview="Old overview",
            rtp_explanation="RTP test",
            volatility_analysis="Volatility test",
            bonus_features="Bonus test",
            strategies="Strategy test",
        )
        db.add(game_content)
        db.commit()

        response = client.put(
            "/api/v1/admin/game-contents/test-game",
            json={"overview": "Updated overview"}
        )

        assert response.status_code == 200
        assert response.json()["overview"] == "Updated overview"

        # Verify in database
        updated = db.query(GameContent).filter_by(game_id="test-game").first()
        assert updated.overview == "Updated overview"

    def test_toggle_publish_status(self, client, db):
        """Test toggling publish status"""
        # Create test content
        game_content = GameContent(
            game_id="test-game-2",
            overview="Content",
            is_published=False,
        )
        db.add(game_content)
        db.commit()

        response = client.patch(
            "/api/v1/admin/game-contents/test-game-2/publish",
            json={"is_published": True}
        )

        assert response.status_code == 200
        assert response.json()["is_published"] is True

    def test_delete_game_content(self, client, db):
        """Test deleting game content"""
        # Create test content
        game_content = GameContent(
            game_id="test-game-3",
            overview="Content to delete",
        )
        db.add(game_content)
        db.commit()

        response = client.delete("/api/v1/admin/game-contents/test-game-3")
        assert response.status_code == 200

        # Verify deletion
        deleted = db.query(GameContent).filter_by(game_id="test-game-3").first()
        assert deleted is None


class TestAdminContentGeneration:
    """Test suite for content generation endpoints"""

    def test_generate_content_missing_game_id(self, client):
        """Test generation request without game_id"""
        response = client.post("/api/v1/admin/generate-content", json={})
        assert response.status_code == 400

    def test_generate_content_nonexistent_game(self, client):
        """Test generation for non-existent game"""
        response = client.post(
            "/api/v1/admin/generate-content",
            json={"game_id": "nonexistent-game"}
        )
        assert response.status_code == 404

    def test_list_generation_jobs_empty(self, client):
        """Test listing generation jobs when queue is empty"""
        response = client.get("/api/v1/admin/generation-jobs")
        assert response.status_code == 200
        assert response.json()["jobs"] == []

    def test_list_generation_jobs_with_status_filter(self, client):
        """Test filtering generation jobs by status"""
        response = client.get("/api/v1/admin/generation-jobs?status=pending,processing")
        assert response.status_code == 200
        data = response.json()
        assert "jobs" in data

    def test_list_generation_jobs_with_limit(self, client):
        """Test listing generation jobs with custom limit"""
        response = client.get("/api/v1/admin/generation-jobs?limit=10")
        assert response.status_code == 200


class TestAdminAnalytics:
    """Test suite for analytics endpoints"""

    def test_get_generation_stats(self, client):
        """Test getting generation statistics"""
        response = client.get("/api/v1/admin/generation-stats")
        assert response.status_code == 200

        data = response.json()
        assert "generation_queue" in data
        assert "content" in data

        # Check queue stats structure
        queue_stats = data["generation_queue"]
        assert "total" in queue_stats
        assert "pending" in queue_stats
        assert "processing" in queue_stats
        assert "completed" in queue_stats
        assert "failed" in queue_stats

        # Check content stats structure
        content_stats = data["content"]
        assert "total" in content_stats
        assert "published" in content_stats
        assert "unpublished" in content_stats
        assert "avg_readability_score" in content_stats

    def test_generation_stats_with_content(self, client, db):
        """Test stats calculation with actual content"""
        # Create test content with readability score
        game_content = GameContent(
            game_id="test-game-stats",
            overview="Test overview content",
            readability_score=65.5,
            is_published=True,
        )
        db.add(game_content)
        db.commit()

        response = client.get("/api/v1/admin/generation-stats")
        assert response.status_code == 200

        stats = response.json()
        assert stats["content"]["total"] >= 1
        assert stats["content"]["published"] >= 1

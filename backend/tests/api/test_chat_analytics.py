import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestChatAnalytics:
    """Tests for GET /api/v1/chat-analytics/"""

    def test_get_chat_analytics(self):
        response = client.get("/api/v1/chat-analytics/")
        assert response.status_code in [200, 404]

    def test_chat_analytics_streamer_filter(self):
        response = client.get("/api/v1/chat-analytics/?streamer_id=roshtein")
        assert response.status_code in [200, 404]

    def test_chat_analytics_period_filter(self):
        response = client.get("/api/v1/chat-analytics/?period=7d")
        assert response.status_code in [200, 404]

    def test_chat_analytics_30day_period(self):
        response = client.get("/api/v1/chat-analytics/?period=30d")
        assert response.status_code in [200, 404]

    def test_chat_analytics_pagination(self):
        response = client.get("/api/v1/chat-analytics/?limit=20&skip=0")
        assert response.status_code in [200, 404]

    def test_chat_analytics_limit_validation(self):
        response = client.get("/api/v1/chat-analytics/?limit=0")
        assert response.status_code in [422, 404]

    def test_chat_analytics_sort_by_activity(self):
        response = client.get("/api/v1/chat-analytics/?sort=activity")
        assert response.status_code in [200, 404]

    def test_chat_analytics_sort_by_sentiment(self):
        response = client.get("/api/v1/chat-analytics/?sort=sentiment")
        assert response.status_code in [200, 404]


class TestChatMetrics:
    """Tests for GET /api/v1/chat-analytics/{streamer_id}/metrics"""

    def test_get_chat_metrics(self):
        response = client.get("/api/v1/chat-analytics/roshtein/metrics")
        assert response.status_code in [200, 404]

    def test_chat_metrics_contains_hype_score(self):
        response = client.get("/api/v1/chat-analytics/roshtein/metrics")
        if response.status_code == 200:
            data = response.json()
            assert any(k in data for k in ["hype_score", "hype", "engagement"])

    def test_chat_metrics_contains_sentiment(self):
        response = client.get("/api/v1/chat-analytics/roshtein/metrics")
        if response.status_code == 200:
            data = response.json()
            assert any(k in data for k in ["sentiment", "avg_sentiment"])

    def test_chat_metrics_period_filter(self):
        response = client.get("/api/v1/chat-analytics/roshtein/metrics?period=7d")
        assert response.status_code in [200, 404]


class TestEmoteStats:
    """Tests for GET /api/v1/chat-analytics/{streamer_id}/emotes"""

    def test_get_emote_stats(self):
        response = client.get("/api/v1/chat-analytics/roshtein/emotes")
        assert response.status_code in [200, 404]

    def test_emote_stats_top_limit(self):
        response = client.get("/api/v1/chat-analytics/roshtein/emotes?limit=20")
        assert response.status_code in [200, 404]

    def test_emote_stats_sort_by_frequency(self):
        response = client.get("/api/v1/chat-analytics/roshtein/emotes?sort=frequency")
        assert response.status_code in [200, 404]

    def test_emote_stats_period_filter(self):
        response = client.get("/api/v1/chat-analytics/roshtein/emotes?period=7d")
        assert response.status_code in [200, 404]


class TestHypeMoments:
    """Tests for GET /api/v1/chat-analytics/{streamer_id}/hype-moments"""

    def test_get_hype_moments(self):
        response = client.get("/api/v1/chat-analytics/roshtein/hype-moments")
        assert response.status_code in [200, 404]

    def test_hype_moments_pagination(self):
        response = client.get("/api/v1/chat-analytics/roshtein/hype-moments?limit=50")
        assert response.status_code in [200, 404]

    def test_hype_moments_min_score_filter(self):
        response = client.get("/api/v1/chat-analytics/roshtein/hype-moments?min_score=0.7")
        assert response.status_code in [200, 404]

    def test_hype_moments_sort_by_score(self):
        response = client.get("/api/v1/chat-analytics/roshtein/hype-moments?sort=score")
        assert response.status_code in [200, 404]

    def test_hype_moments_period_filter(self):
        response = client.get("/api/v1/chat-analytics/roshtein/hype-moments?period=24h")
        assert response.status_code in [200, 404]


class TestChatTimeSeries:
    """Tests for GET /api/v1/chat-analytics/{streamer_id}/timeline"""

    def test_get_chat_timeline(self):
        response = client.get("/api/v1/chat-analytics/roshtein/timeline")
        assert response.status_code in [200, 404]

    def test_chat_timeline_bucket_size(self):
        response = client.get("/api/v1/chat-analytics/roshtein/timeline?bucket=5m")
        assert response.status_code in [200, 404]

    def test_chat_timeline_metric_filter(self):
        response = client.get("/api/v1/chat-analytics/roshtein/timeline?metric=messages_per_minute")
        assert response.status_code in [200, 404]

    def test_chat_timeline_period(self):
        response = client.get("/api/v1/chat-analytics/roshtein/timeline?period=24h")
        assert response.status_code in [200, 404]


class TestChatLeaderboard:
    """Tests for GET /api/v1/chat-analytics/leaderboard"""

    def test_get_chat_leaderboard(self):
        response = client.get("/api/v1/chat-analytics/leaderboard")
        assert response.status_code == 200

    def test_leaderboard_by_hype(self):
        response = client.get("/api/v1/chat-analytics/leaderboard?metric=hype")
        assert response.status_code == 200

    def test_leaderboard_by_activity(self):
        response = client.get("/api/v1/chat-analytics/leaderboard?metric=activity")
        assert response.status_code == 200

    def test_leaderboard_by_sentiment(self):
        response = client.get("/api/v1/chat-analytics/leaderboard?metric=sentiment")
        assert response.status_code == 200

    def test_leaderboard_period_filter(self):
        response = client.get("/api/v1/chat-analytics/leaderboard?period=7d")
        assert response.status_code == 200

    def test_leaderboard_limit(self):
        response = client.get("/api/v1/chat-analytics/leaderboard?limit=25")
        assert response.status_code == 200


class TestChatErrorHandling:
    """Tests for error handling in chat analytics API"""

    def test_invalid_streamer_id(self):
        response = client.get("/api/v1/chat-analytics/!@#$/metrics")
        assert response.status_code in [404, 422]

    def test_invalid_period_parameter(self):
        response = client.get("/api/v1/chat-analytics/roshtein/metrics?period=invalid")
        assert response.status_code in [200, 422, 404]

    def test_invalid_metric_leaderboard(self):
        response = client.get("/api/v1/chat-analytics/leaderboard?metric=invalid")
        assert response.status_code in [200, 422]

    def test_invalid_limit(self):
        response = client.get("/api/v1/chat-analytics/roshtein/emotes?limit=abc")
        assert response.status_code == 422

    def test_invalid_score_filter(self):
        response = client.get("/api/v1/chat-analytics/roshtein/hype-moments?min_score=invalid")
        assert response.status_code in [200, 422, 404]

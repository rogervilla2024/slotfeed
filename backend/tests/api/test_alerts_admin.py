import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAlertRules:
    """Tests for GET /api/v1/alerts/rules"""

    def test_get_alert_rules(self):
        response = client.get("/api/v1/alerts/rules")
        assert response.status_code in [200, 401, 403]

    def test_list_alert_rules(self):
        response = client.get("/api/v1/alerts/rules/?limit=20")
        assert response.status_code in [200, 401, 403]

    def test_alert_rules_user_filter(self):
        response = client.get("/api/v1/alerts/rules/?user_id=user123")
        assert response.status_code in [200, 401, 403]

    def test_alert_rules_status_filter(self):
        response = client.get("/api/v1/alerts/rules/?status=active")
        assert response.status_code in [200, 401, 403]

    def test_alert_rules_type_filter(self):
        response = client.get("/api/v1/alerts/rules/?type=big_win")
        assert response.status_code in [200, 401, 403]

    def test_alert_rules_pagination(self):
        response = client.get("/api/v1/alerts/rules/?skip=10&limit=20")
        assert response.status_code in [200, 401, 403]


class TestCreateAlert:
    """Tests for POST /api/v1/alerts/rules"""

    def test_create_alert_rule(self):
        alert_data = {
            "type": "big_win",
            "threshold": 100,
            "game_id": "sweet-bonanza",
            "enabled": True
        }
        response = client.post("/api/v1/alerts/rules", json=alert_data)
        assert response.status_code in [201, 200, 401, 403, 422]

    def test_create_alert_validation(self):
        invalid_data = {}
        response = client.post("/api/v1/alerts/rules", json=invalid_data)
        assert response.status_code in [422, 400, 401, 403]


class TestUpdateAlert:
    """Tests for PATCH /api/v1/alerts/rules/{rule_id}"""

    def test_update_alert_rule(self):
        update_data = {"enabled": False}
        response = client.patch("/api/v1/alerts/rules/rule-123", json=update_data)
        assert response.status_code in [200, 404, 401, 403]

    def test_update_alert_threshold(self):
        update_data = {"threshold": 150}
        response = client.patch("/api/v1/alerts/rules/rule-123", json=update_data)
        assert response.status_code in [200, 404, 401, 403]


class TestDeleteAlert:
    """Tests for DELETE /api/v1/alerts/rules/{rule_id}"""

    def test_delete_alert_rule(self):
        response = client.delete("/api/v1/alerts/rules/rule-123")
        assert response.status_code in [200, 204, 404, 401, 403]


class TestAlertHistory:
    """Tests for GET /api/v1/alerts/history"""

    def test_get_alert_history(self):
        response = client.get("/api/v1/alerts/history")
        assert response.status_code in [200, 401, 403]

    def test_alert_history_pagination(self):
        response = client.get("/api/v1/alerts/history?limit=50&skip=0")
        assert response.status_code in [200, 401, 403]

    def test_alert_history_date_range(self):
        response = client.get("/api/v1/alerts/history?start_date=2026-01-01&end_date=2026-01-31")
        assert response.status_code in [200, 401, 403]

    def test_alert_history_type_filter(self):
        response = client.get("/api/v1/alerts/history?type=big_win")
        assert response.status_code in [200, 401, 403]


class TestAdminStats:
    """Tests for GET /api/v1/admin/stats"""

    def test_get_admin_stats(self):
        response = client.get("/api/v1/admin/stats")
        assert response.status_code in [200, 401, 403]

    def test_admin_stats_platform_breakdown(self):
        response = client.get("/api/v1/admin/stats?breakdown=platform")
        assert response.status_code in [200, 401, 403]

    def test_admin_stats_game_breakdown(self):
        response = client.get("/api/v1/admin/stats?breakdown=game")
        assert response.status_code in [200, 401, 403]

    def test_admin_stats_period_filter(self):
        response = client.get("/api/v1/admin/stats?period=7d")
        assert response.status_code in [200, 401, 403]


class TestAdminUsers:
    """Tests for GET /api/v1/admin/users"""

    def test_list_admin_users(self):
        response = client.get("/api/v1/admin/users")
        assert response.status_code in [200, 401, 403]

    def test_list_users_pagination(self):
        response = client.get("/api/v1/admin/users?limit=20&skip=0")
        assert response.status_code in [200, 401, 403]

    def test_list_users_role_filter(self):
        response = client.get("/api/v1/admin/users?role=premium")
        assert response.status_code in [200, 401, 403]

    def test_list_users_status_filter(self):
        response = client.get("/api/v1/admin/users?status=active")
        assert response.status_code in [200, 401, 403]


class TestAdminModeration:
    """Tests for GET /api/v1/admin/moderation"""

    def test_get_moderation_queue(self):
        response = client.get("/api/v1/admin/moderation")
        assert response.status_code in [200, 401, 403]

    def test_moderation_by_type(self):
        response = client.get("/api/v1/admin/moderation?type=reported_content")
        assert response.status_code in [200, 401, 403]

    def test_moderation_by_status(self):
        response = client.get("/api/v1/admin/moderation?status=pending")
        assert response.status_code in [200, 401, 403]

    def test_moderation_pagination(self):
        response = client.get("/api/v1/admin/moderation?limit=50&skip=0")
        assert response.status_code in [200, 401, 403]


class TestAdminLogs:
    """Tests for GET /api/v1/admin/logs"""

    def test_get_admin_logs(self):
        response = client.get("/api/v1/admin/logs")
        assert response.status_code in [200, 401, 403]

    def test_admin_logs_event_filter(self):
        response = client.get("/api/v1/admin/logs?event=user_registration")
        assert response.status_code in [200, 401, 403]

    def test_admin_logs_date_range(self):
        response = client.get("/api/v1/admin/logs?start_date=2026-01-01&end_date=2026-01-31")
        assert response.status_code in [200, 401, 403]

    def test_admin_logs_user_filter(self):
        response = client.get("/api/v1/admin/logs?user_id=user123")
        assert response.status_code in [200, 401, 403]


class TestAdminDatabaseOps:
    """Tests for admin database operations"""

    def test_cache_invalidation(self):
        response = client.post("/api/v1/admin/cache/invalidate")
        assert response.status_code in [200, 401, 403]

    def test_cache_clear_by_key(self):
        response = client.delete("/api/v1/admin/cache/streamer:roshtein")
        assert response.status_code in [200, 204, 401, 403]

    def test_database_health_check(self):
        response = client.get("/api/v1/admin/health/database")
        assert response.status_code in [200, 401, 403]

    def test_redis_health_check(self):
        response = client.get("/api/v1/admin/health/redis")
        assert response.status_code in [200, 401, 403]


class TestAdminErrors:
    """Tests for error handling in admin/alerts APIs"""

    def test_unauthorized_access(self):
        response = client.get("/api/v1/admin/stats", headers={"Authorization": "Bearer invalid"})
        assert response.status_code in [401, 403]

    def test_invalid_rule_id(self):
        response = client.get("/api/v1/alerts/rules/!@#$%")
        assert response.status_code in [404, 422, 401, 403]

    def test_invalid_period_filter(self):
        response = client.get("/api/v1/admin/stats?period=invalid")
        assert response.status_code in [200, 422, 401, 403]

    def test_invalid_limit_parameter(self):
        response = client.get("/api/v1/admin/users?limit=abc")
        assert response.status_code in [422, 401, 403]

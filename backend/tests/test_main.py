import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "SlotFeed API"
    assert data["docs"] == "/docs"


def test_list_streamers():
    response = client.get("/api/v1/streamers/")
    assert response.status_code == 200
    data = response.json()
    assert "streamers" in data
    assert "total" in data


def test_list_games():
    response = client.get("/api/v1/games/")
    assert response.status_code == 200
    data = response.json()
    assert "games" in data
    assert "total" in data


def test_live_streams():
    response = client.get("/api/v1/live/streams")
    assert response.status_code == 200
    data = response.json()
    assert "streams" in data


def test_hot_cold_slots():
    response = client.get("/api/v1/games/hot-cold")
    assert response.status_code == 200
    data = response.json()
    assert "hot" in data
    assert "cold" in data

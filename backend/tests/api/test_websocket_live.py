"""
Tests for WebSocket live features
Tests hot/cold, big win, and RTP updates
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHotColdWebSocket:
    """Test hot/cold WebSocket endpoint"""

    def test_websocket_hot_cold_connection(self):
        """Test connecting to hot/cold WebSocket"""
        with client.websocket_connect("/api/v1/ws/hot-cold") as websocket:
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert "hot/cold" in data["message"].lower()

    def test_websocket_hot_cold_with_game_filter(self):
        """Test connecting with game ID filter"""
        with client.websocket_connect("/api/v1/ws/hot-cold?game_id=sweet-bonanza") as websocket:
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert "game:sweet-bonanza" in data["subscribed_channels"]

    def test_websocket_hot_cold_subscribe(self):
        """Test subscribing to hot/cold channel"""
        with client.websocket_connect("/api/v1/ws/hot-cold") as websocket:
            # Consume initial message
            websocket.receive_json()

            # Subscribe to a game
            websocket.send_json({"type": "subscribe", "channel": "game:test-game"})
            response = websocket.receive_json()
            assert response["type"] == "subscribed"
            assert response["channel"] == "game:test-game"

    def test_websocket_hot_cold_unsubscribe(self):
        """Test unsubscribing from hot/cold channel"""
        with client.websocket_connect("/api/v1/ws/hot-cold?game_id=test") as websocket:
            # Consume initial message
            websocket.receive_json()

            # Unsubscribe
            websocket.send_json({"type": "unsubscribe", "channel": "game:test"})


class TestBigWinsWebSocket:
    """Test big wins WebSocket endpoint"""

    def test_websocket_big_wins_connection(self):
        """Test connecting to big wins WebSocket"""
        with client.websocket_connect("/api/v1/ws/big-wins") as websocket:
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert "big wins" in data["message"].lower()

    def test_websocket_big_wins_ping_pong(self):
        """Test ping/pong on big wins connection"""
        with client.websocket_connect("/api/v1/ws/big-wins") as websocket:
            # Consume initial message
            websocket.receive_json()

            # Send ping
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"

    def test_websocket_big_wins_receives_messages(self):
        """Test big wins WebSocket can receive messages"""
        with client.websocket_connect("/api/v1/ws/big-wins") as websocket:
            # Consume initial message
            websocket.receive_json()

            # Test that connection is active by sending ping
            websocket.send_json({"type": "ping"})
            pong = websocket.receive_json(timeout=1)
            assert pong["type"] == "pong"


class TestRTPLiveWebSocket:
    """Test RTP live WebSocket endpoint"""

    def test_websocket_rtp_live_connection(self):
        """Test connecting to RTP live WebSocket"""
        with client.websocket_connect("/api/v1/ws/live/rtp") as websocket:
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert "RTP" in data["message"]

    def test_websocket_rtp_live_ping_pong(self):
        """Test ping/pong on RTP live connection"""
        with client.websocket_connect("/api/v1/ws/live/rtp") as websocket:
            # Consume initial message
            websocket.receive_json()

            # Send ping
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"

    def test_websocket_rtp_live_subscribe(self):
        """Test subscribing to RTP channel"""
        with client.websocket_connect("/api/v1/ws/live/rtp") as websocket:
            # Consume initial message
            websocket.receive_json()

            # Subscribe to specific channel
            websocket.send_json({"type": "subscribe", "channel": "game:sweet-bonanza"})
            # Just verify no error occurs


class TestWebSocketMultipleConnections:
    """Test multiple WebSocket connections"""

    def test_multiple_hot_cold_connections(self):
        """Test multiple clients can connect to hot/cold"""
        with client.websocket_connect("/api/v1/ws/hot-cold") as ws1:
            with client.websocket_connect("/api/v1/ws/hot-cold") as ws2:
                data1 = ws1.receive_json()
                data2 = ws2.receive_json()

                assert data1["type"] == "connected"
                assert data2["type"] == "connected"

    def test_multiple_big_wins_connections(self):
        """Test multiple clients can connect to big wins"""
        with client.websocket_connect("/api/v1/ws/big-wins") as ws1:
            with client.websocket_connect("/api/v1/ws/big-wins") as ws2:
                data1 = ws1.receive_json()
                data2 = ws2.receive_json()

                assert data1["type"] == "connected"
                assert data2["type"] == "connected"

    def test_multiple_rtp_connections(self):
        """Test multiple clients can connect to RTP"""
        with client.websocket_connect("/api/v1/ws/live/rtp") as ws1:
            with client.websocket_connect("/api/v1/ws/live/rtp") as ws2:
                data1 = ws1.receive_json()
                data2 = ws2.receive_json()

                assert data1["type"] == "connected"
                assert data2["type"] == "connected"


class TestWebSocketChannelManagement:
    """Test WebSocket channel subscriptions"""

    def test_game_specific_channels(self):
        """Test subscribing to game-specific channels"""
        games = ["game1", "game2", "game3"]

        for game in games:
            with client.websocket_connect(f"/api/v1/ws/hot-cold?game_id={game}") as ws:
                data = ws.receive_json()
                assert f"game:{game}" in data["subscribed_channels"]

    def test_channel_subscription_isolation(self):
        """Test that channels are isolated per subscription"""
        with client.websocket_connect("/api/v1/ws/hot-cold") as ws1:
            with client.websocket_connect("/api/v1/ws/hot-cold?game_id=game1") as ws2:
                data1 = ws1.receive_json()
                data2 = ws2.receive_json()

                # First connection should only have 'all'
                assert set(data1["subscribed_channels"]) == {"all"}

                # Second connection should have 'all' and specific game
                assert "all" in data2["subscribed_channels"]
                assert "game:game1" in data2["subscribed_channels"]


class TestWebSocketMessageFormat:
    """Test WebSocket message formats"""

    def test_connected_message_format(self):
        """Test connected message has required fields"""
        with client.websocket_connect("/api/v1/ws/hot-cold") as websocket:
            data = websocket.receive_json()

            assert "type" in data
            assert "message" in data
            assert "timestamp" in data
            assert data["type"] == "connected"

    def test_ping_pong_format(self):
        """Test ping/pong message format"""
        with client.websocket_connect("/api/v1/ws/big-wins") as websocket:
            # Consume initial message
            websocket.receive_json()

            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()

            assert "type" in response
            assert "timestamp" in response
            assert response["type"] == "pong"

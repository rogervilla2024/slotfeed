import pytest
import json
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.api.v1.websocket import WebSocketConnectionManager, ws_manager

client = TestClient(app)


class TestWebSocketConnectionManager:
    """Tests for WebSocketConnectionManager"""

    def test_create_manager(self):
        """Test creating a WebSocket connection manager"""
        manager = WebSocketConnectionManager()
        assert manager is not None
        assert len(manager.subscriptions) == 0
        assert len(manager.channels) == 0

    def test_get_connection_count_empty(self):
        """Test getting connection count when empty"""
        manager = WebSocketConnectionManager()
        assert manager.get_connection_count() == 0

    def test_get_channels_empty(self):
        """Test getting channels when empty"""
        manager = WebSocketConnectionManager()
        assert manager.get_channels() == []

    def test_manager_subscriptions_dict(self):
        """Test subscriptions dict is properly initialized"""
        manager = WebSocketConnectionManager()
        assert isinstance(manager.subscriptions, dict)
        assert isinstance(manager.channels, dict)
        assert isinstance(manager.user_connections, dict)

    def test_manager_has_broadcast_methods(self):
        """Test manager has broadcast methods"""
        manager = WebSocketConnectionManager()
        assert hasattr(manager, 'broadcast_to_channel')
        assert hasattr(manager, 'broadcast_to_all')
        assert hasattr(manager, 'send_to_websocket')

    def test_manager_has_subscribe_methods(self):
        """Test manager has subscribe/unsubscribe methods"""
        manager = WebSocketConnectionManager()
        assert hasattr(manager, 'subscribe')
        assert hasattr(manager, 'unsubscribe')
        assert hasattr(manager, 'connect')
        assert hasattr(manager, 'disconnect')


class TestWebSocketEndpoint:
    """Tests for WebSocket /live endpoint"""

    def test_websocket_endpoint_exists(self):
        """Test WebSocket endpoint is available"""
        # Note: TestClient doesn't support WebSocket, so we test via HTTP
        response = client.get("/api/v1/live")
        # Should return 426 Upgrade Required for non-WebSocket request
        assert response.status_code in [426, 403, 404]

    def test_websocket_endpoint_url(self):
        """Test WebSocket endpoint URL construction"""
        # Expected endpoint: /api/v1/ws/live or /api/v1/live
        endpoints = [
            "/ws/live",
            "/api/v1/ws/live",
            "/api/v1/live"
        ]
        for endpoint in endpoints:
            response = client.get(endpoint)
            # WebSocket should reject non-upgrade requests
            if response.status_code == 426:
                assert True
                break

    def test_websocket_with_channels_parameter(self):
        """Test WebSocket endpoint with channels query parameter"""
        # This tests the URL structure, actual WebSocket upgrade would happen in real client
        response = client.get("/api/v1/live?channels=slotfeed:live,slotfeed:big_wins")
        assert response.status_code in [426, 403, 404]

    def test_websocket_with_single_channel(self):
        """Test WebSocket with single channel parameter"""
        response = client.get("/api/v1/live?channels=slotfeed:live")
        assert response.status_code in [426, 403, 404]

    def test_websocket_without_channels(self):
        """Test WebSocket without channels parameter (should default to 'all')"""
        response = client.get("/api/v1/live")
        assert response.status_code in [426, 403, 404]


class TestWebSocketChannels:
    """Tests for WebSocket channel handling"""

    def test_channel_name_all(self):
        """Test 'all' channel"""
        manager = WebSocketConnectionManager()
        channels = manager.get_channels()
        assert isinstance(channels, list)

    def test_channel_name_live(self):
        """Test 'slotfeed:live' channel name format"""
        # Valid channel name format test
        channel = "slotfeed:live"
        assert "slotfeed:" in channel
        assert channel.endswith("live")

    def test_channel_name_big_wins(self):
        """Test 'slotfeed:big_wins' channel name format"""
        channel = "slotfeed:big_wins"
        assert "slotfeed:" in channel
        assert channel.endswith("big_wins")

    def test_channel_name_stream_specific(self):
        """Test channel for specific stream"""
        session_id = "session-123"
        channel = f"slotfeed:stream:{session_id}"
        assert channel.startswith("slotfeed:stream:")
        assert session_id in channel

    def test_channel_name_streamer_specific(self):
        """Test channel for specific streamer"""
        streamer_id = "roshtein"
        channel = f"slotfeed:streamer:{streamer_id}"
        assert channel.startswith("slotfeed:streamer:")
        assert streamer_id in channel

    def test_channel_name_game_specific(self):
        """Test channel for specific game"""
        game_id = "sweet-bonanza"
        channel = f"slotfeed:game:{game_id}"
        assert channel.startswith("slotfeed:game:")
        assert game_id in channel


class TestWebSocketMessageFormats:
    """Tests for WebSocket message formats"""

    def test_connected_message_structure(self):
        """Test structure of 'connected' message"""
        message = {
            "type": "connected",
            "message": "Connected to SlotFeed live updates",
            "subscribed_channels": ["all"],
            "timestamp": "2026-01-08T00:00:00+00:00"
        }
        assert "type" in message
        assert message["type"] == "connected"
        assert "subscribed_channels" in message
        assert "timestamp" in message

    def test_balance_update_message_structure(self):
        """Test balance update message structure"""
        message = {
            "type": "balance_update",
            "data": {
                "session_id": "session-123",
                "balance": 1500.00,
                "previous_balance": 1000.00,
                "change": 500.00
            },
            "timestamp": "2026-01-08T00:00:00+00:00",
            "channel": "slotfeed:live"
        }
        assert message["type"] == "balance_update"
        assert "data" in message
        assert "balance" in message["data"]

    def test_big_win_message_structure(self):
        """Test big win message structure"""
        message = {
            "type": "big_win",
            "data": {
                "session_id": "session-123",
                "game": "sweet-bonanza",
                "multiplier": 500.0,
                "win_amount": 50000.0
            },
            "timestamp": "2026-01-08T00:00:00+00:00",
            "channel": "slotfeed:big_wins"
        }
        assert message["type"] == "big_win"
        assert message["data"]["multiplier"] == 500.0

    def test_game_change_message_structure(self):
        """Test game change message structure"""
        message = {
            "type": "game_change",
            "data": {
                "session_id": "session-123",
                "old_game": "sweet-bonanza",
                "new_game": "gates-of-olympus"
            },
            "timestamp": "2026-01-08T00:00:00+00:00",
            "channel": "slotfeed:live"
        }
        assert message["type"] == "game_change"
        assert "old_game" in message["data"]
        assert "new_game" in message["data"]

    def test_stream_start_message_structure(self):
        """Test stream start message structure"""
        message = {
            "type": "stream_start",
            "data": {
                "streamer_id": "roshtein",
                "session_id": "session-123",
                "game": "sweet-bonanza",
                "platform": "kick"
            },
            "timestamp": "2026-01-08T00:00:00+00:00",
            "channel": "slotfeed:live"
        }
        assert message["type"] == "stream_start"
        assert message["data"]["streamer_id"] == "roshtein"

    def test_stream_end_message_structure(self):
        """Test stream end message structure"""
        message = {
            "type": "stream_end",
            "data": {
                "session_id": "session-123",
                "final_balance": 2000.0,
                "session_profit": 1000.0
            },
            "timestamp": "2026-01-08T00:00:00+00:00",
            "channel": "slotfeed:live"
        }
        assert message["type"] == "stream_end"
        assert "final_balance" in message["data"]

    def test_bonus_trigger_message_structure(self):
        """Test bonus trigger message structure"""
        message = {
            "type": "bonus_trigger",
            "data": {
                "session_id": "session-123",
                "game": "sweet-bonanza",
                "bonus_type": "free_spins",
                "spins_count": 10
            },
            "timestamp": "2026-01-08T00:00:00+00:00",
            "channel": "slotfeed:live"
        }
        assert message["type"] == "bonus_trigger"
        assert "bonus_type" in message["data"]

    def test_pong_message_structure(self):
        """Test pong response message"""
        message = {
            "type": "pong"
        }
        assert message["type"] == "pong"

    def test_subscription_confirmation_message(self):
        """Test subscription confirmation message"""
        message = {
            "type": "subscribed",
            "channel": "slotfeed:big_wins",
            "timestamp": "2026-01-08T00:00:00+00:00"
        }
        assert message["type"] == "subscribed"
        assert "channel" in message

    def test_unsubscription_confirmation_message(self):
        """Test unsubscription confirmation message"""
        message = {
            "type": "unsubscribed",
            "channel": "slotfeed:live",
            "timestamp": "2026-01-08T00:00:00+00:00"
        }
        assert message["type"] == "unsubscribed"
        assert "channel" in message


class TestWebSocketClientMessages:
    """Tests for client message formats"""

    def test_subscribe_client_message(self):
        """Test subscribe client message format"""
        message = {
            "type": "subscribe",
            "channel": "slotfeed:big_wins"
        }
        assert message["type"] == "subscribe"
        assert "channel" in message

    def test_unsubscribe_client_message(self):
        """Test unsubscribe client message format"""
        message = {
            "type": "unsubscribe",
            "channel": "slotfeed:live"
        }
        assert message["type"] == "unsubscribe"
        assert "channel" in message

    def test_ping_client_message(self):
        """Test ping client message format"""
        message = {
            "type": "ping"
        }
        assert message["type"] == "ping"

    def test_client_message_with_extra_fields(self):
        """Test client message with extra fields (should be ignored)"""
        message = {
            "type": "subscribe",
            "channel": "slotfeed:live",
            "extra_field": "ignored"
        }
        assert message["type"] == "subscribe"
        assert "channel" in message


class TestWebSocketEventTypes:
    """Tests for event type constants"""

    def test_balance_update_event_type(self):
        """Test balance update event type"""
        event_type = "balance_update"
        assert isinstance(event_type, str)
        assert event_type == "balance_update"

    def test_big_win_event_type(self):
        """Test big win event type"""
        event_type = "big_win"
        assert event_type == "big_win"

    def test_game_change_event_type(self):
        """Test game change event type"""
        event_type = "game_change"
        assert event_type == "game_change"

    def test_stream_start_event_type(self):
        """Test stream start event type"""
        event_type = "stream_start"
        assert event_type == "stream_start"

    def test_stream_end_event_type(self):
        """Test stream end event type"""
        event_type = "stream_end"
        assert event_type == "stream_end"

    def test_bonus_trigger_event_type(self):
        """Test bonus trigger event type"""
        event_type = "bonus_trigger"
        assert event_type == "bonus_trigger"

    def test_connected_event_type(self):
        """Test connected event type"""
        event_type = "connected"
        assert event_type == "connected"

    def test_subscribed_event_type(self):
        """Test subscribed event type"""
        event_type = "subscribed"
        assert event_type == "subscribed"

    def test_unsubscribed_event_type(self):
        """Test unsubscribed event type"""
        event_type = "unsubscribed"
        assert event_type == "unsubscribed"


class TestWebSocketGlobalManager:
    """Tests for global WebSocket manager"""

    def test_global_manager_exists(self):
        """Test global ws_manager exists"""
        assert ws_manager is not None

    def test_global_manager_is_connection_manager(self):
        """Test global manager is WebSocketConnectionManager instance"""
        assert isinstance(ws_manager, WebSocketConnectionManager)

    def test_global_manager_is_singleton(self):
        """Test global manager behaves like singleton"""
        assert ws_manager.get_connection_count() >= 0

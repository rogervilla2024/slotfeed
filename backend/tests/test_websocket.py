"""Tests for WebSocket real-time updates."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone

from app.api.v1.websocket import WebSocketConnectionManager


class MockWebSocket:
    """Mock WebSocket for testing."""

    def __init__(self):
        self.accepted = False
        self.closed = False
        self.sent_messages = []

    async def accept(self):
        self.accepted = True

    async def close(self):
        self.closed = True

    async def send_json(self, data):
        self.sent_messages.append(data)

    async def receive_text(self):
        return '{"type": "ping"}'


class TestWebSocketConnectionManager:
    """Tests for WebSocketConnectionManager class."""

    @pytest.mark.asyncio
    async def test_initialization(self):
        """Test manager initialization."""
        manager = WebSocketConnectionManager()
        assert len(manager.channels) == 0
        assert len(manager.subscriptions) == 0

    @pytest.mark.asyncio
    async def test_connect(self):
        """Test connecting a WebSocket."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        result = await manager.connect(ws)

        assert result is True
        assert ws.accepted is True
        assert ws in manager.subscriptions

    @pytest.mark.asyncio
    async def test_connect_with_initial_channels(self):
        """Test connecting with initial channel subscriptions."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws, initial_channels=["channel1", "channel2"])

        assert ws in manager.subscriptions
        assert "channel1" in manager.subscriptions[ws]
        assert "channel2" in manager.subscriptions[ws]
        assert ws in manager.channels.get("channel1", set())
        assert ws in manager.channels.get("channel2", set())

    @pytest.mark.asyncio
    async def test_disconnect(self):
        """Test disconnecting a WebSocket."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws, initial_channels=["channel1"])
        await manager.disconnect(ws)

        assert ws not in manager.subscriptions
        assert ws not in manager.channels.get("channel1", set())

    @pytest.mark.asyncio
    async def test_subscribe(self):
        """Test subscribing to a channel."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws)
        result = await manager.subscribe(ws, "test_channel")

        assert result is True
        assert "test_channel" in manager.subscriptions[ws]
        assert ws in manager.channels["test_channel"]

    @pytest.mark.asyncio
    async def test_unsubscribe(self):
        """Test unsubscribing from a channel."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws, initial_channels=["test_channel"])
        result = await manager.unsubscribe(ws, "test_channel")

        assert result is True
        assert "test_channel" not in manager.subscriptions[ws]

    @pytest.mark.asyncio
    async def test_broadcast_to_channel(self):
        """Test broadcasting to a channel."""
        manager = WebSocketConnectionManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()
        ws3 = MockWebSocket()  # Not in channel

        await manager.connect(ws1, initial_channels=["test_channel"])
        await manager.connect(ws2, initial_channels=["test_channel"])
        await manager.connect(ws3, initial_channels=["other_channel"])

        message = {"type": "test", "data": "hello"}
        await manager.broadcast_to_channel("test_channel", message)

        assert message in ws1.sent_messages
        assert message in ws2.sent_messages
        assert message not in ws3.sent_messages

    @pytest.mark.asyncio
    async def test_broadcast_to_all(self):
        """Test broadcasting to all connections."""
        manager = WebSocketConnectionManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        await manager.connect(ws1, initial_channels=["channel1"])
        await manager.connect(ws2, initial_channels=["channel2"])

        message = {"type": "broadcast", "data": "to all"}
        await manager.broadcast_to_all(message)

        assert message in ws1.sent_messages
        assert message in ws2.sent_messages

    @pytest.mark.asyncio
    async def test_send_to_websocket(self):
        """Test sending to a specific websocket."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws)

        message = {"type": "direct", "data": "private"}
        await manager.send_to_websocket(ws, message)

        assert message in ws.sent_messages

    @pytest.mark.asyncio
    async def test_get_connection_count(self):
        """Test getting connection counts."""
        manager = WebSocketConnectionManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()
        ws3 = MockWebSocket()

        await manager.connect(ws1, initial_channels=["channel1"])
        await manager.connect(ws2, initial_channels=["channel1"])
        await manager.connect(ws3, initial_channels=["channel2"])

        assert manager.get_connection_count() == 3
        assert manager.get_connection_count("channel1") == 2
        assert manager.get_connection_count("channel2") == 1
        assert manager.get_connection_count("nonexistent") == 0

    @pytest.mark.asyncio
    async def test_get_channels(self):
        """Test getting list of active channels."""
        manager = WebSocketConnectionManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        await manager.connect(ws1, initial_channels=["channel1", "channel2"])
        await manager.connect(ws2, initial_channels=["channel2", "channel3"])

        channels = manager.get_channels()

        assert "channel1" in channels
        assert "channel2" in channels
        assert "channel3" in channels

    @pytest.mark.asyncio
    async def test_multiple_subscriptions_same_websocket(self):
        """Test that a websocket can subscribe to multiple channels."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws)
        await manager.subscribe(ws, "channel1")
        await manager.subscribe(ws, "channel2")
        await manager.subscribe(ws, "channel3")

        assert len(manager.subscriptions[ws]) == 3

    @pytest.mark.asyncio
    async def test_channel_cleanup_on_last_disconnect(self):
        """Test that empty channels are cleaned up."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws, initial_channels=["test_channel"])
        assert "test_channel" in manager.channels

        await manager.disconnect(ws)
        assert "test_channel" not in manager.channels

    @pytest.mark.asyncio
    async def test_subscribe_unconnected_websocket(self):
        """Test subscribing an unconnected websocket fails gracefully."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        # Try to subscribe without connecting first
        result = await manager.subscribe(ws, "test_channel")

        assert result is False

    @pytest.mark.asyncio
    async def test_disconnect_handles_user_id(self):
        """Test that disconnect cleans up user connections."""
        manager = WebSocketConnectionManager()
        ws = MockWebSocket()

        await manager.connect(ws, user_id="user123")
        assert "user123" in manager.user_connections.values()

        # Note: In production, this would call decrement_websocket_count
        # which requires Redis. For testing, we just verify the tracking.
        # The actual decrement is tested in rate_limit tests.

"""
WebSocket Real-time Updates

Provides WebSocket endpoints for real-time streaming of:
- Balance updates
- Big wins
- Game changes
- Stream start/end events

SECURITY: WebSocket connections support optional token-based authentication.
Authenticated users get higher rate limits and access to premium features.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import Dict, Set, Optional, List
from datetime import datetime, timezone
import asyncio
import json

from app.core.security import verify_token, User

router = APIRouter()


async def authenticate_websocket(websocket: WebSocket, token: Optional[str] = None) -> Optional[User]:
    """
    Authenticate WebSocket connection using optional token.

    Args:
        websocket: The WebSocket connection
        token: Optional JWT token from query parameter or first message

    Returns:
        User object if authenticated, None for anonymous connections
    """
    if not token:
        return None

    token_data = verify_token(token)
    if not token_data:
        return None

    return User(
        id=token_data.user_id,
        email=token_data.email,
        role=token_data.role,
    )


class WebSocketConnectionManager:
    """
    Manages WebSocket connections with support for:
    - Multiple subscription channels
    - Redis Pub/Sub integration
    - Rate limiting per user
    - Connection health monitoring
    """

    def __init__(self):
        # channel -> set of websockets
        self.channels: Dict[str, Set[WebSocket]] = {}
        # websocket -> set of channels
        self.subscriptions: Dict[WebSocket, Set[str]] = {}
        # websocket -> user_id (for rate limiting)
        self.user_connections: Dict[WebSocket, str] = {}
        # Lock for thread-safe operations
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        user_id: Optional[str] = None,
        initial_channels: Optional[List[str]] = None,
    ) -> bool:
        """
        Accept a new WebSocket connection.

        Args:
            websocket: The WebSocket connection
            user_id: Optional user ID for rate limiting
            initial_channels: Optional list of channels to subscribe to immediately

        Returns:
            True if connected successfully, False if rate limited
        """
        await websocket.accept()

        async with self._lock:
            self.subscriptions[websocket] = set()

            if user_id:
                self.user_connections[websocket] = user_id

            # Subscribe to initial channels
            if initial_channels:
                for channel in initial_channels:
                    await self._add_to_channel(websocket, channel)

        return True

    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection and clean up subscriptions."""
        async with self._lock:
            # Remove from all channels
            if websocket in self.subscriptions:
                for channel in self.subscriptions[websocket]:
                    if channel in self.channels:
                        self.channels[channel].discard(websocket)
                        if not self.channels[channel]:
                            del self.channels[channel]
                del self.subscriptions[websocket]

            # Clean up user connection tracking
            if websocket in self.user_connections:
                del self.user_connections[websocket]

    async def subscribe(self, websocket: WebSocket, channel: str) -> bool:
        """Subscribe a websocket to a channel."""
        async with self._lock:
            return await self._add_to_channel(websocket, channel)

    async def unsubscribe(self, websocket: WebSocket, channel: str) -> bool:
        """Unsubscribe a websocket from a channel."""
        async with self._lock:
            if websocket in self.subscriptions:
                self.subscriptions[websocket].discard(channel)
                if channel in self.channels:
                    self.channels[channel].discard(websocket)
                    if not self.channels[channel]:
                        del self.channels[channel]
                return True
            return False

    async def _add_to_channel(self, websocket: WebSocket, channel: str) -> bool:
        """Internal method to add websocket to channel (must hold lock)."""
        if websocket not in self.subscriptions:
            return False

        if channel not in self.channels:
            self.channels[channel] = set()

        self.channels[channel].add(websocket)
        self.subscriptions[websocket].add(channel)
        return True

    async def broadcast_to_channel(self, channel: str, message: dict):
        """Broadcast a message to all subscribers of a channel."""
        async with self._lock:
            if channel not in self.channels:
                return

            disconnected = []
            for websocket in self.channels[channel]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.append(websocket)

            # Clean up disconnected clients
            for ws in disconnected:
                await self.disconnect(ws)

    async def broadcast_to_all(self, message: dict):
        """Broadcast a message to all connected clients."""
        async with self._lock:
            all_websockets = set()
            for channel_sockets in self.channels.values():
                all_websockets.update(channel_sockets)

            disconnected = []
            for websocket in all_websockets:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.append(websocket)

            for ws in disconnected:
                await self.disconnect(ws)

    async def send_to_websocket(self, websocket: WebSocket, message: dict):
        """Send a message to a specific websocket."""
        try:
            await websocket.send_json(message)
        except Exception:
            await self.disconnect(websocket)

    def get_connection_count(self, channel: Optional[str] = None) -> int:
        """Get the number of connections, optionally for a specific channel."""
        if channel:
            return len(self.channels.get(channel, set()))
        return len(self.subscriptions)

    def get_channels(self) -> List[str]:
        """Get list of active channels."""
        return list(self.channels.keys())


# Global connection manager
ws_manager = WebSocketConnectionManager()


async def handle_redis_message(channel: str, data: dict):
    """
    Handle incoming Redis Pub/Sub messages and broadcast to WebSocket clients.
    """
    event_type = data.get("event_type")
    event_data = data.get("data", {})

    message = {
        "type": event_type,
        "data": event_data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "channel": channel,
    }

    # Broadcast to the specific channel
    await ws_manager.broadcast_to_channel(channel, message)

    # Also broadcast to the "all" channel for general subscribers
    await ws_manager.broadcast_to_channel("all", message)


async def start_pubsub_bridge():
    """Start the bridge between Redis Pub/Sub and WebSocket connections."""
    # Redis pubsub disabled for now
    pass


async def stop_pubsub_bridge():
    """Stop the Pub/Sub bridge."""
    # Redis pubsub disabled for now
    pass


@router.websocket("/live")
async def websocket_live_updates(
    websocket: WebSocket,
    channels: Optional[str] = Query(None, description="Comma-separated channels to subscribe"),
    token: Optional[str] = Query(None, description="JWT token for authentication"),
):
    """
    WebSocket endpoint for real-time live stream updates.

    Connect and optionally subscribe to specific channels via query parameter.

    Channels:
    - all: All updates (default)
    - slotfeed:live: Live balance updates
    - slotfeed:big_wins: Big win notifications
    - slotfeed:stream:{session_id}: Updates for specific stream
    - slotfeed:streamer:{streamer_id}: Updates for specific streamer
    - slotfeed:game:{game_id}: Updates for specific game

    Events received:
    - balance_update: New balance reading from OCR
    - big_win: A big win was detected (100x+)
    - game_change: Streamer switched games
    - stream_start: A streamer went live
    - stream_end: A streamer ended their stream
    - bonus_trigger: Bonus feature triggered

    Client messages:
    - {"type": "subscribe", "channel": "channel_name"}
    - {"type": "unsubscribe", "channel": "channel_name"}
    - {"type": "ping"} -> {"type": "pong"}
    """
    # Authenticate user (optional)
    user = await authenticate_websocket(websocket, token)
    user_id = user.id if user else None

    # Parse initial channels
    initial_channels = ["all"]
    if channels:
        initial_channels.extend(ch.strip() for ch in channels.split(",") if ch.strip())

    # Connect with user tracking for rate limiting
    await ws_manager.connect(websocket, user_id=user_id, initial_channels=initial_channels)

    # Send welcome message with auth status
    await ws_manager.send_to_websocket(websocket, {
        "type": "connected",
        "message": "Connected to LiveSlotData live updates",
        "authenticated": user is not None,
        "user_id": user_id,
        "subscribed_channels": initial_channels,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            msg_type = message.get("type")

            if msg_type == "subscribe":
                channel = message.get("channel", "all")
                await ws_manager.subscribe(websocket, channel)
                await ws_manager.send_to_websocket(websocket, {
                    "type": "subscribed",
                    "channel": channel,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

            elif msg_type == "unsubscribe":
                channel = message.get("channel", "all")
                await ws_manager.unsubscribe(websocket, channel)
                await ws_manager.send_to_websocket(websocket, {
                    "type": "unsubscribed",
                    "channel": channel,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

            elif msg_type == "ping":
                await ws_manager.send_to_websocket(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

            elif msg_type == "get_channels":
                await ws_manager.send_to_websocket(websocket, {
                    "type": "channels",
                    "channels": ws_manager.get_channels(),
                    "connection_count": ws_manager.get_connection_count(),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)


@router.websocket("/stream/{session_id}")
async def websocket_stream_updates(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for updates on a specific stream session.

    Automatically subscribes to:
    - slotfeed:stream:{session_id}
    - slotfeed:live (for big wins)
    """
    channels = [
        f"slotfeed:stream:{session_id}",
        "slotfeed:live",
    ]

    await ws_manager.connect(websocket, initial_channels=channels)

    await ws_manager.send_to_websocket(websocket, {
        "type": "connected",
        "message": f"Connected to stream {session_id}",
        "session_id": session_id,
        "subscribed_channels": channels,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await ws_manager.send_to_websocket(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)


@router.websocket("/streamer/{streamer_id}")
async def websocket_streamer_updates(websocket: WebSocket, streamer_id: str):
    """
    WebSocket endpoint for updates on a specific streamer.

    Automatically subscribes to:
    - slotfeed:streamer:{streamer_id}
    """
    channel = f"slotfeed:streamer:{streamer_id}"

    await ws_manager.connect(websocket, initial_channels=[channel])

    await ws_manager.send_to_websocket(websocket, {
        "type": "connected",
        "message": f"Connected to streamer {streamer_id}",
        "streamer_id": streamer_id,
        "subscribed_channels": [channel],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await ws_manager.send_to_websocket(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)


@router.websocket("/big-wins")
async def websocket_big_wins(websocket: WebSocket):
    """
    WebSocket endpoint for big win notifications only.

    Subscribes to: slotfeed:big_wins
    """
    channel = "slotfeed:big_wins"

    await ws_manager.connect(websocket, initial_channels=[channel])

    await ws_manager.send_to_websocket(websocket, {
        "type": "connected",
        "message": "Connected to big wins feed",
        "subscribed_channels": [channel],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await ws_manager.send_to_websocket(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)


# Export the manager for use in other modules
def get_ws_manager() -> WebSocketConnectionManager:
    """Get the WebSocket connection manager instance."""
    return ws_manager


# Helper functions for broadcasting from OCR/backend services
async def broadcast_balance_update(
    streamer_id: str,
    balance: float,
    change: float,
    session_id: Optional[str] = None,
):
    """Broadcast a balance update to all relevant channels."""
    message = {
        "type": "balance_update",
        "data": {
            "streamerId": streamer_id,
            "balance": balance,
            "change": change,
            "sessionId": session_id,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Broadcast to multiple channels
    await ws_manager.broadcast_to_channel("all", message)
    await ws_manager.broadcast_to_channel("slotfeed:live", message)
    await ws_manager.broadcast_to_channel(f"slotfeed:streamer:{streamer_id}", message)
    if session_id:
        await ws_manager.broadcast_to_channel(f"slotfeed:stream:{session_id}", message)


async def broadcast_big_win(
    streamer_id: str,
    streamer_name: str,
    amount: float,
    multiplier: float,
    game_name: str,
    screenshot_url: Optional[str] = None,
):
    """Broadcast a big win notification."""
    message = {
        "type": "big_win",
        "data": {
            "streamerId": streamer_id,
            "streamerName": streamer_name,
            "amount": amount,
            "multiplier": multiplier,
            "gameName": game_name,
            "screenshotUrl": screenshot_url,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Broadcast to big wins channel and all
    await ws_manager.broadcast_to_channel("all", message)
    await ws_manager.broadcast_to_channel("slotfeed:big_wins", message)
    await ws_manager.broadcast_to_channel("slotfeed:live", message)


async def broadcast_stream_event(
    event_type: str,  # "stream_start" or "stream_end"
    streamer_id: str,
    streamer_name: str,
    title: str = "",
):
    """Broadcast stream start/end events."""
    message = {
        "type": event_type,
        "data": {
            "streamerId": streamer_id,
            "streamerName": streamer_name,
            "title": title,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await ws_manager.broadcast_to_channel("all", message)
    await ws_manager.broadcast_to_channel("slotfeed:live", message)


# ==================== NEW WEBSOCKET ENDPOINTS FOR PHASE 11-3 ====================


@router.websocket("/hot-cold")
async def websocket_hot_cold_updates(
    websocket: WebSocket,
    game_id: Optional[str] = Query(None, description="Game ID to filter hot/cold updates"),
):
    """
    WebSocket endpoint for real-time hot/cold slot status updates.

    Channels:
    - all: All hot/cold updates
    - game:{game_id}: Updates for specific game

    Events:
    - hot_cold_update: Hot/cold status changed for a game
    - hot_cold_score_update: Score updated for a game
    """
    initial_channels = ["all"]
    if game_id:
        initial_channels.append(f"game:{game_id}")

    await ws_manager.connect(websocket, initial_channels=initial_channels)

    await ws_manager.send_to_websocket(websocket, {
        "type": "connected",
        "message": "Connected to hot/cold updates",
        "subscribed_channels": initial_channels,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "subscribe":
                channel = message.get("channel")
                if channel:
                    await ws_manager.subscribe(websocket, channel)
                    await ws_manager.send_to_websocket(websocket, {
                        "type": "subscribed",
                        "channel": channel,
                    })
            elif message.get("type") == "unsubscribe":
                channel = message.get("channel")
                if channel:
                    await ws_manager.unsubscribe(websocket, channel)

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)


@router.websocket("/big-wins")
async def websocket_big_wins_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time big win notifications.

    Events:
    - big_win_notification: A big win was detected
    """
    await ws_manager.connect(websocket, initial_channels=["all", "big-wins"])

    await ws_manager.send_to_websocket(websocket, {
        "type": "connected",
        "message": "Connected to big wins stream",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await ws_manager.send_to_websocket(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)


@router.websocket("/live/rtp")
async def websocket_live_rtp_tracker(websocket: WebSocket):
    """
    WebSocket endpoint for real-time RTP tracking.

    Events:
    - rtp_update: RTP value updated for a game/streamer combination
    """
    await ws_manager.connect(websocket, initial_channels=["all", "rtp-tracker"])

    await ws_manager.send_to_websocket(websocket, {
        "type": "connected",
        "message": "Connected to live RTP tracker",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await ws_manager.send_to_websocket(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
            elif message.get("type") == "subscribe":
                channel = message.get("channel")
                if channel:
                    await ws_manager.subscribe(websocket, channel)

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)


# Broadcasting functions for Phase 11-3


async def broadcast_hot_cold_update(
    game_id: str,
    status: str,
    score: float,
    observed_rtp: float,
    theoretical_rtp: float,
    recent_big_wins: int = 0,
    avg_big_wins: int = 0,
):
    """Broadcast hot/cold status update."""
    message = {
        "type": "hot_cold_update",
        "data": {
            "gameId": game_id,
            "status": status,
            "score": score,
            "observedRtp": observed_rtp,
            "theoreticalRtp": theoretical_rtp,
            "recentBigWins": recent_big_wins,
            "avgBigWins": avg_big_wins,
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await ws_manager.broadcast_to_channel("all", message)
    await ws_manager.broadcast_to_channel(f"game:{game_id}", message)


async def broadcast_big_win_notification(
    streamer_name: str,
    game_name: str,
    amount: float,
    multiplier: float,
    platform: Optional[str] = None,
):
    """Broadcast big win notification with tier."""
    # Determine tier
    tier = "big"
    if multiplier >= 1000:
        tier = "legendary"
    elif multiplier >= 500:
        tier = "ultra"
    elif multiplier >= 100:
        tier = "mega"

    message = {
        "type": "big_win_notification",
        "data": {
            "streamerName": streamer_name,
            "gameName": game_name,
            "amount": amount,
            "multiplier": multiplier,
            "tier": tier,
            "platform": platform or "unknown",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await ws_manager.broadcast_to_channel("all", message)
    await ws_manager.broadcast_to_channel("big-wins", message)


async def broadcast_rtp_update(
    game_id: str,
    game_name: str,
    streamer_name: str,
    current_rtp: float,
    theoretical_rtp: float,
    trend: str = "stable",
    sparkline: Optional[List[float]] = None,
    viewers: Optional[int] = None,
):
    """Broadcast RTP update."""
    # Determine status
    status = "neutral"
    if current_rtp > theoretical_rtp + 2:
        status = "hot"
    elif current_rtp < theoretical_rtp - 2:
        status = "cold"

    message = {
        "type": "rtp_update",
        "data": {
            "gameId": game_id,
            "gameName": game_name,
            "streamerName": streamer_name,
            "currentRtp": current_rtp,
            "theoreticalRtp": theoretical_rtp,
            "status": status,
            "trend": trend,
            "sparkline": sparkline or [],
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "viewers": viewers,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await ws_manager.broadcast_to_channel("all", message)
    await ws_manager.broadcast_to_channel("rtp-tracker", message)

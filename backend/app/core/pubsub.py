import asyncio
import json
from typing import Callable, Dict, Set, Any, Optional
from dataclasses import dataclass
from enum import Enum
from app.core.redis import redis_client


class EventType(str, Enum):
    # Balance events
    BALANCE_UPDATE = "balance_update"
    BIG_WIN = "big_win"

    # Stream events
    STREAM_START = "stream_start"
    STREAM_END = "stream_end"
    GAME_CHANGE = "game_change"
    VIEWER_UPDATE = "viewer_update"

    # Bonus events
    BONUS_TRIGGER = "bonus_trigger"
    BONUS_HUNT_START = "bonus_hunt_start"
    BONUS_HUNT_END = "bonus_hunt_end"

    # Hot/Cold events
    SLOT_HOT = "slot_hot"
    SLOT_COLD = "slot_cold"

    # System events
    SYSTEM_ALERT = "system_alert"


@dataclass
class PubSubMessage:
    event_type: EventType
    channel: str
    data: Dict[str, Any]
    timestamp: Optional[str] = None


class PubSubManager:
    """Manages Redis Pub/Sub for real-time event distribution."""

    # Channel prefixes
    CHANNEL_LIVE = "slotfeed:live"
    CHANNEL_STREAM = "slotfeed:stream"
    CHANNEL_STREAMER = "slotfeed:streamer"
    CHANNEL_GAME = "slotfeed:game"
    CHANNEL_BIG_WINS = "slotfeed:big_wins"
    CHANNEL_ALERTS = "slotfeed:alerts"

    def __init__(self):
        self._handlers: Dict[str, Set[Callable]] = {}
        self._running = False
        self._listener_task: Optional[asyncio.Task] = None

    async def publish_event(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        channel: Optional[str] = None,
    ) -> int:
        """Publish an event to Redis Pub/Sub."""
        if channel is None:
            channel = self.CHANNEL_LIVE

        message = {
            "event_type": event_type.value,
            "data": data,
        }
        return await redis_client.publish_json(channel, message)

    async def publish_balance_update(
        self,
        session_id: str,
        streamer_id: str,
        balance: float,
        bet: Optional[float] = None,
        win: Optional[float] = None,
        multiplier: Optional[float] = None,
    ) -> int:
        """Publish a balance update event."""
        data = {
            "session_id": session_id,
            "streamer_id": streamer_id,
            "balance": balance,
            "bet": bet,
            "win": win,
            "multiplier": multiplier,
        }
        # Publish to both general live channel and stream-specific channel
        await self.publish_event(EventType.BALANCE_UPDATE, data, self.CHANNEL_LIVE)
        return await self.publish_event(
            EventType.BALANCE_UPDATE,
            data,
            f"{self.CHANNEL_STREAM}:{session_id}",
        )

    async def publish_big_win(
        self,
        session_id: str,
        streamer_id: str,
        game_id: str,
        bet_amount: float,
        win_amount: float,
        multiplier: float,
        screenshot_url: Optional[str] = None,
    ) -> int:
        """Publish a big win event."""
        data = {
            "session_id": session_id,
            "streamer_id": streamer_id,
            "game_id": game_id,
            "bet_amount": bet_amount,
            "win_amount": win_amount,
            "multiplier": multiplier,
            "screenshot_url": screenshot_url,
        }
        # Publish to multiple channels for different subscribers
        await self.publish_event(EventType.BIG_WIN, data, self.CHANNEL_LIVE)
        await self.publish_event(EventType.BIG_WIN, data, self.CHANNEL_BIG_WINS)
        await self.publish_event(
            EventType.BIG_WIN,
            data,
            f"{self.CHANNEL_STREAMER}:{streamer_id}",
        )
        return await self.publish_event(
            EventType.BIG_WIN,
            data,
            f"{self.CHANNEL_GAME}:{game_id}",
        )

    async def publish_stream_start(
        self,
        session_id: str,
        streamer_id: str,
        platform: str,
        stream_url: Optional[str] = None,
    ) -> int:
        """Publish stream start event."""
        data = {
            "session_id": session_id,
            "streamer_id": streamer_id,
            "platform": platform,
            "stream_url": stream_url,
        }
        await self.publish_event(EventType.STREAM_START, data, self.CHANNEL_LIVE)
        return await self.publish_event(
            EventType.STREAM_START,
            data,
            f"{self.CHANNEL_STREAMER}:{streamer_id}",
        )

    async def publish_stream_end(
        self,
        session_id: str,
        streamer_id: str,
        net_profit_loss: float,
        duration_minutes: int,
    ) -> int:
        """Publish stream end event."""
        data = {
            "session_id": session_id,
            "streamer_id": streamer_id,
            "net_profit_loss": net_profit_loss,
            "duration_minutes": duration_minutes,
        }
        await self.publish_event(EventType.STREAM_END, data, self.CHANNEL_LIVE)
        return await self.publish_event(
            EventType.STREAM_END,
            data,
            f"{self.CHANNEL_STREAMER}:{streamer_id}",
        )

    async def publish_game_change(
        self,
        session_id: str,
        streamer_id: str,
        game_id: str,
        game_name: str,
    ) -> int:
        """Publish game change event."""
        data = {
            "session_id": session_id,
            "streamer_id": streamer_id,
            "game_id": game_id,
            "game_name": game_name,
        }
        await self.publish_event(EventType.GAME_CHANGE, data, self.CHANNEL_LIVE)
        return await self.publish_event(
            EventType.GAME_CHANGE,
            data,
            f"{self.CHANNEL_STREAM}:{session_id}",
        )

    async def start_listener(self, handlers: Dict[str, Callable]) -> None:
        """Start listening for Pub/Sub messages."""
        self._handlers = {k: {v} for k, v in handlers.items()}
        self._running = True

        pubsub = await redis_client.psubscribe("slotfeed:*")

        async def listener():
            while self._running:
                try:
                    message = await pubsub.get_message(
                        ignore_subscribe_messages=True,
                        timeout=1.0,
                    )
                    if message and message["type"] == "pmessage":
                        channel = message["channel"]
                        data = json.loads(message["data"])

                        # Call registered handlers
                        for pattern, handler_set in self._handlers.items():
                            if channel.startswith(pattern.rstrip("*")):
                                for handler in handler_set:
                                    await handler(channel, data)
                except Exception as e:
                    print(f"PubSub listener error: {e}")
                    await asyncio.sleep(1)

        self._listener_task = asyncio.create_task(listener())

    async def stop_listener(self) -> None:
        """Stop the Pub/Sub listener."""
        self._running = False
        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass


# Global PubSub manager instance
pubsub_manager = PubSubManager()

import asyncio
from typing import Dict, List, Optional, Set
from datetime import datetime
from dataclasses import dataclass, field
from app.services.kick_api import kick_api, KickChannel
from app.core.pubsub import pubsub_manager, EventType
from app.services.cache import cache_service


@dataclass
class MonitoredStream:
    """Represents a monitored live stream."""
    username: str
    streamer_id: str
    session_id: Optional[str] = None
    is_live: bool = False
    last_check: Optional[datetime] = None
    viewer_count: int = 0
    current_game: Optional[str] = None
    playback_url: Optional[str] = None
    started_at: Optional[datetime] = None


@dataclass
class StreamMonitorConfig:
    """Configuration for stream monitoring."""
    check_interval: int = 30  # seconds between live checks
    batch_size: int = 10  # streamers to check per batch
    concurrent_checks: int = 5  # concurrent API calls
    retry_on_error: bool = True
    max_retries: int = 3


class StreamMonitor:
    """Monitors streamers for live status changes."""

    def __init__(self, config: Optional[StreamMonitorConfig] = None):
        self.config = config or StreamMonitorConfig()
        self._monitored: Dict[str, MonitoredStream] = {}
        self._running = False
        self._monitor_task: Optional[asyncio.Task] = None

    @property
    def monitored_count(self) -> int:
        return len(self._monitored)

    @property
    def live_count(self) -> int:
        return sum(1 for s in self._monitored.values() if s.is_live)

    def add_streamer(
        self,
        username: str,
        streamer_id: str,
    ) -> None:
        """Add a streamer to monitoring."""
        if username not in self._monitored:
            self._monitored[username] = MonitoredStream(
                username=username,
                streamer_id=streamer_id,
            )

    def remove_streamer(self, username: str) -> None:
        """Remove a streamer from monitoring."""
        self._monitored.pop(username, None)

    def get_live_streams(self) -> List[MonitoredStream]:
        """Get all currently live streams."""
        return [s for s in self._monitored.values() if s.is_live]

    async def check_streamer(
        self,
        username: str,
    ) -> Optional[MonitoredStream]:
        """Check single streamer's live status."""
        stream = self._monitored.get(username)
        if not stream:
            return None

        try:
            channel = await kick_api.get_channel(username)
            if not channel:
                return stream

            was_live = stream.is_live
            stream.is_live = channel.is_live
            stream.last_check = datetime.utcnow()

            if channel.is_live and channel.livestream:
                stream.viewer_count = channel.livestream.get("viewer_count", 0)

                # Get playback URL if newly live
                if not was_live:
                    stream.playback_url = await kick_api.get_playback_url(username)
                    stream.started_at = datetime.utcnow()

                    # Publish stream start event
                    await pubsub_manager.publish_stream_start(
                        session_id=stream.session_id or "",
                        streamer_id=stream.streamer_id,
                        platform="kick",
                        stream_url=stream.playback_url,
                    )

                # Update viewer count in cache
                if stream.session_id:
                    await cache_service.update_viewer_count(
                        stream.session_id,
                        stream.viewer_count,
                    )

            elif was_live and not channel.is_live:
                # Stream ended
                duration = 0
                if stream.started_at:
                    duration = int((datetime.utcnow() - stream.started_at).total_seconds() / 60)

                await pubsub_manager.publish_stream_end(
                    session_id=stream.session_id or "",
                    streamer_id=stream.streamer_id,
                    net_profit_loss=0,  # Will be calculated elsewhere
                    duration_minutes=duration,
                )

                stream.playback_url = None
                stream.started_at = None

            return stream

        except Exception as e:
            print(f"Error checking streamer {username}: {e}")
            return stream

    async def check_all(self) -> Dict[str, bool]:
        """Check all monitored streamers."""
        usernames = list(self._monitored.keys())
        results = {}

        # Process in batches
        for i in range(0, len(usernames), self.config.batch_size):
            batch = usernames[i:i + self.config.batch_size]

            # Check batch concurrently
            tasks = [self.check_streamer(username) for username in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for username, result in zip(batch, batch_results):
                if isinstance(result, MonitoredStream):
                    results[username] = result.is_live
                else:
                    results[username] = False

            # Small delay between batches to avoid rate limiting
            if i + self.config.batch_size < len(usernames):
                await asyncio.sleep(1)

        return results

    async def _monitor_loop(self) -> None:
        """Main monitoring loop."""
        while self._running:
            try:
                await self.check_all()

                # Update cached live sessions list
                live_streams = self.get_live_streams()
                live_data = [
                    {
                        "username": s.username,
                        "streamer_id": s.streamer_id,
                        "session_id": s.session_id,
                        "viewer_count": s.viewer_count,
                        "current_game": s.current_game,
                        "started_at": s.started_at.isoformat() if s.started_at else None,
                    }
                    for s in live_streams
                ]
                await cache_service.set_live_sessions_list(live_data)

            except Exception as e:
                print(f"Monitor loop error: {e}")

            await asyncio.sleep(self.config.check_interval)

    async def start(self) -> None:
        """Start the monitoring loop."""
        if self._running:
            return

        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
        print(f"Stream monitor started - tracking {self.monitored_count} streamers")

    async def stop(self) -> None:
        """Stop the monitoring loop."""
        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        print("Stream monitor stopped")


# Global stream monitor instance
stream_monitor = StreamMonitor()


# Tier 1 streamers to monitor
TIER_1_STREAMERS = [
    {"username": "roshtein", "id": "roshtein"},
    {"username": "trainwreckstv", "id": "trainwreckstv"},
    {"username": "classybeef", "id": "classybeef"},
    {"username": "xposed", "id": "xposed"},
    {"username": "deuceace", "id": "deuceace"},
    {"username": "casinodaddy", "id": "casinodaddy"},
    {"username": "mellstroy", "id": "mellstroy"},
    {"username": "maherco", "id": "maherco"},
    {"username": "bidule", "id": "bidule"},
    {"username": "fruityslots", "id": "fruityslots"},
    {"username": "nickslots", "id": "nickslots"},
    {"username": "letsgiveitaspin", "id": "letsgiveitaspin"},
    {"username": "jarttu84", "id": "jarttu84"},
    {"username": "vondice", "id": "vondice"},
    {"username": "westcol", "id": "westcol"},
]


async def initialize_stream_monitor() -> None:
    """Initialize stream monitor with Tier 1 streamers."""
    for streamer in TIER_1_STREAMERS:
        stream_monitor.add_streamer(
            username=streamer["username"],
            streamer_id=streamer["id"],
        )
    await stream_monitor.start()

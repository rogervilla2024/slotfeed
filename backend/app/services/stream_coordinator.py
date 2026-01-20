#!/usr/bin/env python3
"""
SLOTFEED - Stream Coordinator
Monitors Kick API for live streams and coordinates OCR processing
"""

import os
import sys
import json
import uuid
import signal
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

import cloudscraper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.workers.job_queue import JobQueue, StreamJob, get_job_queue

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | Coordinator | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Tier 1 streamers to monitor (priority=1)
TIER1_STREAMERS = [
    "roshtein", "trainwreckstv", "classybeef", "xposed", "deuceace",
    "casinodaddy", "mellstroy", "maherco", "bidule", "fruityslots",
    "nickslots", "letsgiveitaspin", "jarttu84", "vondice", "westcol"
]

# Tier 2 streamers (priority=2)
TIER2_STREAMERS = []


class StreamCoordinator:
    """
    Central coordinator for stream processing.
    - Monitors Kick API for live streams
    - Creates OCR jobs for each live stream
    - Manages stream lifecycle (start/end)
    - Distributes jobs across workers via Redis queue
    """

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379/0",
        database_url: Optional[str] = None,
        check_interval: int = 30,
        job_interval: int = 5,  # How often to create new jobs for active streams
    ):
        self.redis_url = redis_url
        self.database_url = database_url
        self.check_interval = check_interval
        self.job_interval = job_interval

        self.running = False
        self.job_queue: Optional[JobQueue] = None
        self.db_engine = None
        self.db_session_maker = None
        self.scraper = None

        # Track active streams
        self.active_streams: Dict[str, Dict] = {}  # username -> stream info
        self.stream_sessions: Dict[str, str] = {}  # username -> session_id

        # Stats
        self.stats = {
            "started_at": None,
            "streams_detected": 0,
            "jobs_created": 0,
            "api_calls": 0,
        }

        # Data directory
        self.data_dir = PROJECT_ROOT / "data"
        self.streamers_dir = self.data_dir / "streamers"
        self.streamers_dir.mkdir(parents=True, exist_ok=True)

        # Signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        logger.info(f"Received signal {signum}, shutting down...")
        self.running = False

    async def initialize(self) -> bool:
        """Initialize connections."""
        try:
            logger.info("Initializing Stream Coordinator...")

            # Redis connection
            self.job_queue = get_job_queue(self.redis_url)
            await self.job_queue.connect()

            # Database connection (optional)
            if self.database_url:
                db_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://")
                self.db_engine = create_async_engine(
                    db_url,
                    pool_size=5,
                    max_overflow=10,
                )
                self.db_session_maker = async_sessionmaker(
                    self.db_engine,
                    class_=AsyncSession,
                    expire_on_commit=False,
                )

            # HTTP client for Kick API
            self.scraper = cloudscraper.create_scraper()

            self.stats["started_at"] = datetime.utcnow().isoformat()
            logger.info("Initialization complete")
            return True

        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            return False

    def fetch_kick_channel(self, username: str) -> Optional[Dict]:
        """Fetch channel data from Kick API."""
        try:
            self.stats["api_calls"] += 1
            response = self.scraper.get(
                f"https://kick.com/api/v2/channels/{username}",
                timeout=15
            )

            if response.status_code == 200:
                data = response.json()

                # Cache to file
                filepath = self.streamers_dir / f"{username}.json"
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)

                return data

            return None

        except Exception as e:
            logger.debug(f"Error fetching {username}: {e}")
            return None

    async def check_streamers(self) -> List[Dict]:
        """Check all monitored streamers for live status."""
        live_streams = []
        all_streamers = TIER1_STREAMERS + TIER2_STREAMERS

        for username in all_streamers:
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(None, self.fetch_kick_channel, username)

            if data and data.get('livestream'):
                livestream = data['livestream']
                priority = 1 if username in TIER1_STREAMERS else 2

                stream_info = {
                    "username": username,
                    "playback_url": data.get('playback_url'),
                    "viewer_count": livestream.get('viewer_count', 0),
                    "session_title": livestream.get('session_title', ''),
                    "started_at": livestream.get('created_at'),
                    "priority": priority,
                }
                live_streams.append(stream_info)
                logger.info(f"[LIVE] {username}: {stream_info['viewer_count']} viewers")
            else:
                # Stream ended
                if username in self.active_streams:
                    await self.handle_stream_end(username)

            # Small delay between API calls
            await asyncio.sleep(0.5)

        return live_streams

    async def handle_stream_start(self, stream_info: Dict):
        """Handle a newly detected live stream."""
        username = stream_info['username']

        if username in self.active_streams:
            return  # Already tracking

        logger.info(f"Stream started: {username}")
        self.stats["streams_detected"] += 1

        session_id = None

        # Try to find existing session in database first
        if self.db_session_maker:
            try:
                from app.models import Streamer, Session as DBSession

                async with self.db_session_maker() as db:
                    # Find streamer
                    result = await db.execute(
                        select(Streamer).where(
                            (Streamer.username == username) |
                            (Streamer.slug == username)
                        )
                    )
                    streamer = result.scalar_one_or_none()

                    if streamer:
                        # Check for existing active session
                        result = await db.execute(
                            select(DBSession).where(
                                (DBSession.streamer_id == streamer.id) &
                                (DBSession.is_live == True)
                            ).order_by(DBSession.started_at.desc()).limit(1)
                        )
                        existing_session = result.scalar_one_or_none()

                        if existing_session:
                            session_id = str(existing_session.id)
                            logger.info(f"Found existing DB session for {username}: {session_id}")
                        else:
                            # Create new session
                            session_id = str(uuid.uuid4())
                            new_session = DBSession(
                                id=session_id,
                                streamer_id=streamer.id,
                                platform="kick",
                                started_at=datetime.now(timezone.utc),
                                is_live=True,
                                avg_viewers=stream_info.get('viewer_count', 0),
                            )
                            db.add(new_session)
                            await db.commit()
                            logger.info(f"Created DB session for {username}: {session_id}")
            except Exception as e:
                logger.error(f"Error handling DB session for {username}: {e}")

        # Fallback to generated UUID if no DB connection
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.warning(f"Using generated session_id for {username}: {session_id}")

        self.stream_sessions[username] = session_id
        self.active_streams[username] = stream_info

    async def handle_stream_end(self, username: str):
        """Handle stream going offline."""
        logger.info(f"Stream ended: {username}")

        if username in self.active_streams:
            del self.active_streams[username]

        session_id = self.stream_sessions.pop(username, None)

        # Update database session
        if session_id and self.db_session_maker:
            try:
                from app.models import Session as DBSession

                async with self.db_session_maker() as db:
                    result = await db.execute(
                        select(DBSession).where(DBSession.id == session_id)
                    )
                    session = result.scalar_one_or_none()

                    if session:
                        session.is_live = False
                        session.ended_at = datetime.now(timezone.utc)
                        if session.started_at:
                            duration = (session.ended_at - session.started_at).total_seconds() / 60
                            session.duration_minutes = int(duration)
                        await db.commit()
                        logger.info(f"Ended DB session for {username}")
            except Exception as e:
                logger.error(f"Error ending DB session for {username}: {e}")

    async def create_ocr_job(self, stream_info: Dict):
        """Create an OCR job for a live stream."""
        username = stream_info['username']
        session_id = self.stream_sessions.get(username, str(uuid.uuid4()))

        job = StreamJob(
            job_id=str(uuid.uuid4()),
            username=username,
            session_id=session_id,
            playback_url=stream_info.get('playback_url', ''),
            platform="kick",
            priority=stream_info.get('priority', 2),
        )

        success = await self.job_queue.enqueue_job(job)
        if success:
            self.stats["jobs_created"] += 1
            logger.debug(f"Created job for {username}")

    async def run_check_cycle(self):
        """Run one cycle of stream checking."""
        logger.info("Checking for live streams...")
        live_streams = await self.check_streamers()

        # Handle new streams
        for stream_info in live_streams:
            username = stream_info['username']
            if username not in self.active_streams:
                await self.handle_stream_start(stream_info)
            else:
                # Update viewer count and playback URL (tokens expire)
                self.active_streams[username]['viewer_count'] = stream_info['viewer_count']
                self.active_streams[username]['playback_url'] = stream_info['playback_url']

        logger.info(f"Live streams: {len(live_streams)}/{len(TIER1_STREAMERS + TIER2_STREAMERS)}")

    async def run_job_cycle(self):
        """Create jobs for all active streams."""
        for username, stream_info in self.active_streams.items():
            await self.create_ocr_job(stream_info)

    async def run(self):
        """Main coordinator loop."""
        logger.info("=" * 60)
        logger.info("SLOTFEED Stream Coordinator Starting")
        logger.info(f"Monitoring: {len(TIER1_STREAMERS)} Tier 1 + {len(TIER2_STREAMERS)} Tier 2 streamers")
        logger.info(f"Check interval: {self.check_interval}s, Job interval: {self.job_interval}s")
        logger.info("=" * 60)

        if not await self.initialize():
            logger.error("Failed to initialize, exiting")
            return

        self.running = True

        # Initial check
        await self.run_check_cycle()

        last_check = asyncio.get_event_loop().time()
        last_job = asyncio.get_event_loop().time()

        try:
            while self.running:
                current_time = asyncio.get_event_loop().time()

                # Check for live streams periodically
                if current_time - last_check >= self.check_interval:
                    await self.run_check_cycle()
                    last_check = current_time

                # Create jobs for active streams more frequently
                if current_time - last_job >= self.job_interval:
                    await self.run_job_cycle()
                    last_job = current_time

                # Clear stale active jobs
                await self.job_queue.clear_stale_active()

                await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"Coordinator error: {e}")
        finally:
            self.running = False
            if self.job_queue:
                await self.job_queue.close()
            if self.db_engine:
                await self.db_engine.dispose()
            logger.info("Coordinator stopped")
            logger.info(f"Stats: {json.dumps(self.stats, indent=2)}")


async def main():
    import argparse

    parser = argparse.ArgumentParser(description="SLOTFEED Stream Coordinator")
    parser.add_argument(
        "--redis-url",
        type=str,
        default="redis://localhost:6379/0",
        help="Redis connection URL"
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default=os.environ.get('DATABASE_URL'),
        help="PostgreSQL connection URL"
    )
    parser.add_argument(
        "--check-interval",
        type=int,
        default=30,
        help="Stream check interval in seconds"
    )
    parser.add_argument(
        "--job-interval",
        type=int,
        default=5,
        help="Job creation interval in seconds"
    )

    args = parser.parse_args()

    coordinator = StreamCoordinator(
        redis_url=args.redis_url,
        database_url=args.database_url,
        check_interval=args.check_interval,
        job_interval=args.job_interval,
    )

    await coordinator.run()


if __name__ == "__main__":
    asyncio.run(main())

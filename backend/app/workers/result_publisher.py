#!/usr/bin/env python3
"""
SLOTFEED - Result Publisher
Subscribes to OCR results and broadcasts to WebSocket clients + writes to database
"""

import os
import sys
import json
import signal
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, List
from collections import defaultdict

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

import redis.asyncio as redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.workers.job_queue import OCRResult

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | Publisher | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class ResultPublisher:
    """
    Subscribes to OCR results from Redis and:
    1. Broadcasts to WebSocket clients
    2. Batch writes to database
    3. Detects big wins and triggers alerts
    """

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379/0",
        database_url: Optional[str] = None,
        batch_interval: float = 2.0,  # Batch write every 2 seconds
        big_win_multiplier: float = 100.0,  # 100x is a big win
    ):
        self.redis_url = redis_url
        self.database_url = database_url
        self.batch_interval = batch_interval
        self.big_win_multiplier = big_win_multiplier

        self.running = False
        self._redis: Optional[redis.Redis] = None
        self._pubsub = None
        self.db_engine = None
        self.db_session_maker = None

        # Batch buffer for database writes
        self.result_buffer: List[OCRResult] = []
        self.buffer_lock = asyncio.Lock()

        # Track last known values per stream for change detection
        self.last_values: Dict[str, Dict] = defaultdict(dict)

        # WebSocket connections (managed externally)
        self.websocket_broadcast = None

        # Stats
        self.stats = {
            "started_at": None,
            "results_received": 0,
            "results_written": 0,
            "big_wins_detected": 0,
            "batches_written": 0,
        }

        # Signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        logger.info(f"Received signal {signum}, shutting down...")
        self.running = False

    async def initialize(self) -> bool:
        """Initialize connections."""
        try:
            logger.info("Initializing Result Publisher...")

            # Redis connection
            self._redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )

            # Database connection
            if self.database_url:
                db_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://")
                self.db_engine = create_async_engine(
                    db_url,
                    pool_size=10,
                    max_overflow=20,
                )
                self.db_session_maker = async_sessionmaker(
                    self.db_engine,
                    class_=AsyncSession,
                    expire_on_commit=False,
                )
                logger.info("Database connection established")

            self.stats["started_at"] = datetime.utcnow().isoformat()
            logger.info("Initialization complete")
            return True

        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            return False

    async def subscribe_to_results(self):
        """Subscribe to OCR results channel."""
        self._pubsub = self._redis.pubsub()
        await self._pubsub.subscribe("ocr:results")
        logger.info("Subscribed to ocr:results channel")

    async def process_result(self, result: OCRResult):
        """Process a single OCR result."""
        self.stats["results_received"] += 1

        username = result.username

        # Check for significant changes
        last = self.last_values.get(username, {})
        changed = False
        is_big_win = False

        if result.balance is not None:
            if last.get("balance") != result.balance:
                changed = True
                # Detect big win
                if last.get("balance") and result.balance > last["balance"]:
                    win_amount = result.balance - last["balance"]
                    bet = last.get("bet", result.bet)
                    if bet and bet > 0:
                        multiplier = win_amount / bet
                        if multiplier >= self.big_win_multiplier:
                            await self.handle_big_win(result, multiplier, win_amount)
                            is_big_win = True

                # Detect deposit: balance increased by 2x+ without being a big win
                if last.get("balance") and last["balance"] > 0:
                    increase_ratio = result.balance / last["balance"]
                    if increase_ratio >= 2.0 and not is_big_win:
                        await self.handle_deposit(result, last["balance"], result.balance)

        # Update last known values
        self.last_values[username] = {
            "balance": result.balance,
            "bet": result.bet,
            "win": result.win,
            "timestamp": result.timestamp,
        }

        # Add to batch buffer if changed or has balance
        if changed or result.balance:
            async with self.buffer_lock:
                self.result_buffer.append(result)

        # Broadcast to WebSocket (if callback set)
        if self.websocket_broadcast and result.balance:
            await self.broadcast_update(result)

    async def handle_big_win(self, result: OCRResult, multiplier: float, win_amount: float):
        """Handle a big win detection."""
        self.stats["big_wins_detected"] += 1
        logger.info(
            f"BIG WIN! {result.username}: ${win_amount:,.2f} "
            f"({multiplier:.0f}x multiplier)"
        )

        # Store big win in Redis for real-time alerts
        big_win_data = {
            "username": result.username,
            "session_id": result.session_id,
            "win_amount": win_amount,
            "multiplier": multiplier,
            "timestamp": result.timestamp,
        }
        await self._redis.lpush("ocr:big_wins", json.dumps(big_win_data))
        await self._redis.ltrim("ocr:big_wins", 0, 99)  # Keep last 100 big wins

        # Publish to big wins channel
        await self._redis.publish("ocr:big_wins:live", json.dumps(big_win_data))

    async def handle_deposit(self, result: OCRResult, old_balance: float, new_balance: float):
        """Handle deposit detection - update session start_balance."""
        deposit_amount = new_balance - old_balance
        self.stats["deposits_detected"] = self.stats.get("deposits_detected", 0) + 1

        logger.info(
            f"DEPOSIT DETECTED! {result.username}: ${old_balance:,.2f} -> ${new_balance:,.2f} "
            f"(+${deposit_amount:,.2f})"
        )

        # Update session's start_balance in database
        if self.db_session_maker:
            try:
                from app.models import Session as DBSession

                async with self.db_session_maker() as db:
                    from sqlalchemy import select, update

                    # Update starting_balance to new balance (reset P/L calculation)
                    stmt = (
                        update(DBSession)
                        .where(DBSession.id == result.session_id)
                        .values(starting_balance=new_balance)
                    )
                    await db.execute(stmt)
                    await db.commit()
                    logger.info(f"Updated start_balance for {result.username} to ${new_balance:,.2f}")
            except Exception as e:
                logger.error(f"Failed to update start_balance: {e}")

        # Store deposit event in Redis for tracking
        deposit_data = {
            "username": result.username,
            "session_id": result.session_id,
            "old_balance": old_balance,
            "new_balance": new_balance,
            "deposit_amount": deposit_amount,
            "timestamp": result.timestamp,
        }
        await self._redis.lpush("ocr:deposits", json.dumps(deposit_data))
        await self._redis.ltrim("ocr:deposits", 0, 99)  # Keep last 100 deposits

    async def broadcast_update(self, result: OCRResult):
        """Broadcast update to WebSocket clients."""
        if not self.websocket_broadcast:
            return

        try:
            message = {
                "type": "balance_update",
                "username": result.username,
                "balance": result.balance,
                "bet": result.bet,
                "win": result.win,
                "confidence": result.confidence,
                "timestamp": result.timestamp,
            }
            await self.websocket_broadcast(result.username, message)
        except Exception as e:
            logger.debug(f"WebSocket broadcast error: {e}")

    async def batch_write_loop(self):
        """Periodically write batched results to database."""
        while self.running:
            await asyncio.sleep(self.batch_interval)

            async with self.buffer_lock:
                if not self.result_buffer:
                    continue
                batch = self.result_buffer.copy()
                self.result_buffer.clear()

            if batch and self.db_session_maker:
                await self.write_batch(batch)

    async def write_batch(self, batch: List[OCRResult]):
        """Write a batch of results to database."""
        if not batch:
            return

        try:
            from app.models import BalanceEvent, Session as DBSession, Streamer

            async with self.db_session_maker() as db:
                events_to_insert = []

                for result in batch:
                    if not result.balance:
                        continue

                    # Parse timestamp
                    event_time = (
                        datetime.fromisoformat(result.timestamp.replace('Z', '+00:00'))
                        if result.timestamp else datetime.now(timezone.utc)
                    )

                    # Get previous balance from tracking
                    username = result.username
                    prev_balance = self.last_values.get(username, {}).get("prev_balance", result.balance)

                    # Calculate balance change
                    balance_change = result.balance - prev_balance if prev_balance else 0

                    # Determine event type
                    if result.win and result.win > 0:
                        event_type = "win"
                    elif result.bet and result.bet > 0:
                        event_type = "bet"
                    elif balance_change > 0:
                        event_type = "win"
                    elif balance_change < 0:
                        event_type = "bet"
                    else:
                        event_type = "update"

                    # Create balance event matching actual DB schema
                    event = BalanceEvent(
                        session_id=result.session_id,
                        previous_balance=prev_balance or result.balance,
                        new_balance=result.balance,
                        balance_change=balance_change,
                        event_type=event_type,
                        wagered=result.bet or 0,
                        won=result.win or 0,
                        timestamp=event_time,
                    )
                    events_to_insert.append(event)

                    # Update prev_balance for next iteration
                    self.last_values[username]["prev_balance"] = result.balance

                if events_to_insert:
                    db.add_all(events_to_insert)
                    await db.commit()
                    self.stats["results_written"] += len(events_to_insert)
                    self.stats["batches_written"] += 1
                    logger.info(f"Wrote {len(events_to_insert)} balance events to database")

        except Exception as e:
            logger.error(f"Batch write error: {e}")

    async def listen_for_results(self):
        """Main loop listening for OCR results."""
        await self.subscribe_to_results()

        while self.running:
            try:
                message = await self._pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0
                )

                if message and message["type"] == "message":
                    try:
                        result = OCRResult.from_json(message["data"])
                        await self.process_result(result)
                    except Exception as e:
                        logger.error(f"Error processing result: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Listen error: {e}")
                await asyncio.sleep(1)

    async def run(self):
        """Main publisher loop."""
        logger.info("=" * 60)
        logger.info("SLOTFEED Result Publisher Starting")
        logger.info(f"Batch interval: {self.batch_interval}s")
        logger.info(f"Big win threshold: {self.big_win_multiplier}x")
        logger.info("=" * 60)

        if not await self.initialize():
            logger.error("Failed to initialize, exiting")
            return

        self.running = True

        # Start batch write task
        batch_task = asyncio.create_task(self.batch_write_loop())

        try:
            await self.listen_for_results()
        except Exception as e:
            logger.error(f"Publisher error: {e}")
        finally:
            self.running = False
            batch_task.cancel()

            # Final batch write
            if self.result_buffer and self.db_session_maker:
                await self.write_batch(self.result_buffer)

            if self._pubsub:
                await self._pubsub.close()
            if self._redis:
                await self._redis.close()
            if self.db_engine:
                await self.db_engine.dispose()

            logger.info("Publisher stopped")
            logger.info(f"Stats: {json.dumps(self.stats, indent=2)}")


async def main():
    import argparse

    parser = argparse.ArgumentParser(description="SLOTFEED Result Publisher")
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
        "--batch-interval",
        type=float,
        default=2.0,
        help="Batch write interval in seconds (default: 2.0)"
    )

    args = parser.parse_args()

    publisher = ResultPublisher(
        redis_url=args.redis_url,
        database_url=args.database_url,
        batch_interval=args.batch_interval,
    )

    await publisher.run()


if __name__ == "__main__":
    asyncio.run(main())

"""
SLOTFEED - Redis Job Queue for OCR Processing
Distributes stream processing jobs across multiple workers
"""

import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from enum import Enum
import redis.asyncio as redis
import logging

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class StreamJob:
    """Job for processing a single stream."""
    job_id: str
    username: str
    session_id: str
    playback_url: str
    platform: str = "kick"
    priority: int = 1  # 1=highest (Tier 1), 3=lowest
    created_at: str = ""

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "StreamJob":
        return cls(**json.loads(data))


@dataclass
class OCRResult:
    """Result from OCR processing."""
    job_id: str
    username: str
    session_id: str
    worker_id: int
    balance: Optional[float]
    bet: Optional[float]
    win: Optional[float]
    confidence: float
    is_bonus_mode: bool
    raw_text: List[str]
    timestamp: str = ""
    error: Optional[str] = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> "OCRResult":
        return cls(**json.loads(data))


class JobQueue:
    """Redis-based job queue for OCR processing."""

    # Queue keys
    JOBS_KEY = "ocr:jobs"
    JOBS_HIGH_PRIORITY = "ocr:jobs:high"  # Tier 1 streamers
    JOBS_NORMAL = "ocr:jobs:normal"       # Tier 2-3 streamers
    RESULTS_KEY = "ocr:results"
    ACTIVE_STREAMS = "ocr:active"
    WORKER_HEARTBEAT = "ocr:workers:heartbeat"
    STATS_KEY = "ocr:stats"

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis."""
        if self._redis is None:
            self._redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def enqueue_job(self, job: StreamJob) -> bool:
        """Add a job to the queue."""
        r = await self.connect()

        # Check if this stream is already being processed
        if await r.sismember(self.ACTIVE_STREAMS, job.username):
            logger.debug(f"Stream {job.username} already being processed, skipping")
            return False

        # Add to appropriate priority queue
        queue_key = self.JOBS_HIGH_PRIORITY if job.priority == 1 else self.JOBS_NORMAL
        await r.lpush(queue_key, job.to_json())

        # Mark as active
        await r.sadd(self.ACTIVE_STREAMS, job.username)

        # Update stats
        await r.hincrby(self.STATS_KEY, "jobs_enqueued", 1)

        logger.info(f"Enqueued job for {job.username} (priority={job.priority})")
        return True

    async def get_job(self, timeout: int = 5) -> Optional[StreamJob]:
        """
        Get next job from queue.
        Prioritizes high priority queue, then normal.
        """
        r = await self.connect()

        # Try high priority first
        result = await r.brpop(self.JOBS_HIGH_PRIORITY, timeout=1)
        if result:
            _, job_data = result
            return StreamJob.from_json(job_data)

        # Then normal priority
        result = await r.brpop(self.JOBS_NORMAL, timeout=timeout)
        if result:
            _, job_data = result
            return StreamJob.from_json(job_data)

        return None

    async def complete_job(self, job: StreamJob):
        """Mark job as completed and remove from active."""
        r = await self.connect()
        await r.srem(self.ACTIVE_STREAMS, job.username)
        await r.hincrby(self.STATS_KEY, "jobs_completed", 1)

    async def fail_job(self, job: StreamJob, error: str):
        """Mark job as failed."""
        r = await self.connect()
        await r.srem(self.ACTIVE_STREAMS, job.username)
        await r.hincrby(self.STATS_KEY, "jobs_failed", 1)
        logger.error(f"Job failed for {job.username}: {error}")

    async def publish_result(self, result: OCRResult):
        """Publish OCR result to results channel."""
        r = await self.connect()

        # Publish to channel for real-time subscribers
        channel = f"ocr:results:{result.username}"
        await r.publish(channel, result.to_json())

        # Also publish to global results channel
        await r.publish(self.RESULTS_KEY, result.to_json())

        # Store latest result per stream
        await r.hset(
            f"ocr:latest:{result.username}",
            mapping={
                "balance": str(result.balance) if result.balance else "",
                "bet": str(result.bet) if result.bet else "",
                "win": str(result.win) if result.win else "",
                "confidence": str(result.confidence),
                "timestamp": result.timestamp,
                "worker_id": str(result.worker_id),
            }
        )

        # Expire after 5 minutes (stream might end)
        await r.expire(f"ocr:latest:{result.username}", 300)

    async def worker_heartbeat(self, worker_id: int):
        """Record worker heartbeat."""
        r = await self.connect()
        await r.hset(
            self.WORKER_HEARTBEAT,
            str(worker_id),
            datetime.utcnow().isoformat()
        )

    async def get_active_workers(self) -> Dict[str, str]:
        """Get all worker heartbeats."""
        r = await self.connect()
        return await r.hgetall(self.WORKER_HEARTBEAT)

    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics."""
        r = await self.connect()

        high_len = await r.llen(self.JOBS_HIGH_PRIORITY)
        normal_len = await r.llen(self.JOBS_NORMAL)
        active_count = await r.scard(self.ACTIVE_STREAMS)
        stats = await r.hgetall(self.STATS_KEY)
        workers = await self.get_active_workers()

        return {
            "queue_high_priority": high_len,
            "queue_normal": normal_len,
            "active_streams": active_count,
            "total_enqueued": int(stats.get("jobs_enqueued", 0)),
            "total_completed": int(stats.get("jobs_completed", 0)),
            "total_failed": int(stats.get("jobs_failed", 0)),
            "active_workers": len(workers),
            "worker_heartbeats": workers,
        }

    async def clear_stale_active(self, max_age_seconds: int = 120):
        """Clear streams that have been active too long (likely crashed)."""
        r = await self.connect()
        # For now, just clear all active streams periodically
        # In production, track timestamps per stream
        active = await r.smembers(self.ACTIVE_STREAMS)
        if len(active) > 20:  # Sanity check
            logger.warning(f"Too many active streams ({len(active)}), clearing stale")
            await r.delete(self.ACTIVE_STREAMS)

    async def get_latest_result(self, username: str) -> Optional[Dict]:
        """Get latest OCR result for a stream."""
        r = await self.connect()
        result = await r.hgetall(f"ocr:latest:{username}")
        if result:
            return {
                "balance": float(result["balance"]) if result.get("balance") else None,
                "bet": float(result["bet"]) if result.get("bet") else None,
                "win": float(result["win"]) if result.get("win") else None,
                "confidence": float(result.get("confidence", 0)),
                "timestamp": result.get("timestamp"),
                "worker_id": int(result.get("worker_id", 0)),
            }
        return None

    async def get_last_balance(self, username: str) -> Optional[float]:
        """Get last known valid balance for a stream."""
        r = await self.connect()
        balance_str = await r.hget(f"ocr:latest:{username}", "balance")
        if balance_str:
            try:
                return float(balance_str)
            except (ValueError, TypeError):
                pass
        return None


# Singleton instance
_job_queue: Optional[JobQueue] = None


def get_job_queue(redis_url: str = "redis://localhost:6379/0") -> JobQueue:
    """Get singleton job queue instance."""
    global _job_queue
    if _job_queue is None:
        _job_queue = JobQueue(redis_url)
    return _job_queue

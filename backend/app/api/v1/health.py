"""
Health Check Endpoints for SLOTFEED

Provides comprehensive health monitoring for all system components:
- Database connectivity
- Redis connectivity
- OCR worker status
- Queue depth and processing stats
"""

import os
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as redis

from ...core.database import get_db

router = APIRouter(prefix="/health", tags=["health"])

# Redis connection
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Get Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    return _redis_client


@router.get("")
@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Basic health check endpoint.
    Returns overall system health status.
    """
    status = "healthy"
    checks = {}

    # Database check
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = {"status": "healthy", "latency_ms": 0}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "error": str(e)}
        status = "unhealthy"

    # Redis check
    try:
        r = await get_redis()
        start = datetime.now()
        await r.ping()
        latency = (datetime.now() - start).total_seconds() * 1000
        checks["redis"] = {"status": "healthy", "latency_ms": round(latency, 2)}
    except Exception as e:
        checks["redis"] = {"status": "unhealthy", "error": str(e)}
        status = "degraded" if status == "healthy" else status

    return {
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }


@router.get("/workers")
async def health_workers():
    """
    Get OCR worker health status.
    Shows all workers, their last heartbeat, and health status.
    """
    try:
        r = await get_redis()

        # Get worker heartbeats
        heartbeats = await r.hgetall("ocr:workers:heartbeat")

        workers = []
        healthy_count = 0
        now = datetime.now(timezone.utc)

        for worker_id, last_heartbeat_str in heartbeats.items():
            try:
                last_heartbeat = datetime.fromisoformat(last_heartbeat_str.replace('Z', '+00:00'))
                age_seconds = (now - last_heartbeat).total_seconds()
                is_healthy = age_seconds < 60  # Healthy if heartbeat within 60 seconds

                if is_healthy:
                    healthy_count += 1

                workers.append({
                    "workerId": int(worker_id),
                    "lastHeartbeat": last_heartbeat_str,
                    "ageSeconds": round(age_seconds, 1),
                    "isHealthy": is_healthy,
                    "status": "active" if is_healthy else "stale",
                })
            except Exception:
                workers.append({
                    "workerId": int(worker_id),
                    "lastHeartbeat": last_heartbeat_str,
                    "isHealthy": False,
                    "status": "error",
                })

        # Sort by worker ID
        workers.sort(key=lambda w: w["workerId"])

        return {
            "status": "healthy" if healthy_count > 0 else "unhealthy",
            "totalWorkers": len(workers),
            "healthyWorkers": healthy_count,
            "unhealthyWorkers": len(workers) - healthy_count,
            "workers": workers,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "totalWorkers": 0,
            "healthyWorkers": 0,
            "unhealthyWorkers": 0,
            "workers": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/queue")
async def health_queue():
    """
    Get job queue health and statistics.
    Shows queue depth, processing rates, and backlog.
    """
    try:
        r = await get_redis()

        # Queue lengths
        high_priority_len = await r.llen("ocr:jobs:high")
        normal_len = await r.llen("ocr:jobs:normal")
        total_queue = high_priority_len + normal_len

        # Active streams
        active_count = await r.scard("ocr:active")

        # Processing stats
        stats = await r.hgetall("ocr:stats")
        jobs_enqueued = int(stats.get("jobs_enqueued", 0))
        jobs_completed = int(stats.get("jobs_completed", 0))
        jobs_failed = int(stats.get("jobs_failed", 0))

        # Calculate rates (rough estimate)
        success_rate = (jobs_completed / jobs_enqueued * 100) if jobs_enqueued > 0 else 0
        failure_rate = (jobs_failed / jobs_enqueued * 100) if jobs_enqueued > 0 else 0

        # Determine health based on queue depth
        if total_queue > 100:
            status = "unhealthy"
            message = "Queue backlog too high"
        elif total_queue > 50:
            status = "degraded"
            message = "Queue backlog building up"
        else:
            status = "healthy"
            message = "Queue processing normally"

        return {
            "status": status,
            "message": message,
            "queue": {
                "highPriority": high_priority_len,
                "normal": normal_len,
                "total": total_queue,
            },
            "activeStreams": active_count,
            "stats": {
                "jobsEnqueued": jobs_enqueued,
                "jobsCompleted": jobs_completed,
                "jobsFailed": jobs_failed,
                "successRate": round(success_rate, 2),
                "failureRate": round(failure_rate, 2),
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "queue": {"highPriority": 0, "normal": 0, "total": 0},
            "activeStreams": 0,
            "stats": {
                "jobsEnqueued": 0,
                "jobsCompleted": 0,
                "jobsFailed": 0,
                "successRate": 0,
                "failureRate": 0,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/ocr")
async def health_ocr():
    """
    Get OCR processing statistics.
    Shows frames processed, accuracy metrics, and performance.
    """
    try:
        r = await get_redis()

        # Get stats
        stats = await r.hgetall("ocr:stats")
        jobs_completed = int(stats.get("jobs_completed", 0))
        jobs_failed = int(stats.get("jobs_failed", 0))

        # Get worker heartbeats for active count
        heartbeats = await r.hgetall("ocr:workers:heartbeat")
        active_workers = 0
        now = datetime.now(timezone.utc)

        for _, last_heartbeat_str in heartbeats.items():
            try:
                last_heartbeat = datetime.fromisoformat(last_heartbeat_str.replace('Z', '+00:00'))
                if (now - last_heartbeat).total_seconds() < 60:
                    active_workers += 1
            except Exception:
                pass

        # Get recent big wins count
        big_wins_count = await r.llen("ocr:big_wins")

        # Calculate throughput estimate
        # Assuming each job takes ~5 seconds, with N active workers
        estimated_throughput = active_workers * 12  # jobs per minute

        return {
            "status": "healthy" if active_workers > 0 else "inactive",
            "activeWorkers": active_workers,
            "processing": {
                "framesProcessed": jobs_completed,
                "framesFailed": jobs_failed,
                "totalFrames": jobs_completed + jobs_failed,
                "estimatedThroughput": f"{estimated_throughput} frames/min",
            },
            "detections": {
                "bigWinsDetected": big_wins_count,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "activeWorkers": 0,
            "processing": {
                "framesProcessed": 0,
                "framesFailed": 0,
                "totalFrames": 0,
                "estimatedThroughput": "0 frames/min",
            },
            "detections": {
                "bigWinsDetected": 0,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/full")
async def health_full(db: AsyncSession = Depends(get_db)):
    """
    Comprehensive health check of all system components.
    Combines all health endpoints into a single response.
    """
    # Basic health
    basic = await health_check(db)

    # Workers health
    workers = await health_workers()

    # Queue health
    queue = await health_queue()

    # OCR health
    ocr = await health_ocr()

    # Determine overall status
    statuses = [basic["status"], workers["status"], queue["status"], ocr["status"]]

    if "error" in statuses or "unhealthy" in statuses:
        overall_status = "unhealthy"
    elif "degraded" in statuses or "inactive" in statuses:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "basic": basic,
            "workers": workers,
            "queue": queue,
            "ocr": ocr,
        },
    }

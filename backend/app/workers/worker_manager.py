#!/usr/bin/env python3
"""
SLOTFEED - OCR Worker Manager
Spawns and manages multiple OCR worker processes
"""

import os
import sys
import time
import signal
import asyncio
import argparse
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional
from multiprocessing import Process, Event

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | Manager | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def run_worker(worker_id: int, redis_url: str, stop_event: Event):
    """Run a single OCR worker in a subprocess."""
    import asyncio
    from app.workers.ocr_worker import OCRWorker

    async def _run():
        worker = OCRWorker(worker_id=worker_id, redis_url=redis_url)
        await worker.run()

    # Run until stop event is set
    asyncio.run(_run())


class WorkerManager:
    """
    Manages multiple OCR worker processes.
    - Spawns N worker processes
    - Monitors health via heartbeats
    - Restarts dead workers
    - Provides graceful shutdown
    """

    def __init__(
        self,
        num_workers: int = 4,
        redis_url: str = "redis://localhost:6379/0",
        health_check_interval: int = 30,
    ):
        self.num_workers = num_workers
        self.redis_url = redis_url
        self.health_check_interval = health_check_interval

        self.workers: Dict[int, Process] = {}
        self.stop_events: Dict[int, Event] = {}
        self.running = False

        # Stats
        self.stats = {
            "started_at": None,
            "workers_spawned": 0,
            "workers_restarted": 0,
        }

        # Signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        logger.info(f"Received signal {signum}, initiating shutdown...")
        self.running = False

    def spawn_worker(self, worker_id: int):
        """Spawn a single worker process."""
        if worker_id in self.workers and self.workers[worker_id].is_alive():
            logger.warning(f"Worker {worker_id} already running")
            return

        stop_event = Event()
        process = Process(
            target=run_worker,
            args=(worker_id, self.redis_url, stop_event),
            name=f"ocr-worker-{worker_id}",
            daemon=True,
        )
        process.start()

        self.workers[worker_id] = process
        self.stop_events[worker_id] = stop_event
        self.stats["workers_spawned"] += 1

        logger.info(f"Spawned worker {worker_id} (PID={process.pid})")

    def stop_worker(self, worker_id: int, timeout: int = 10):
        """Stop a worker process gracefully."""
        if worker_id not in self.workers:
            return

        process = self.workers[worker_id]
        if not process.is_alive():
            return

        # Signal stop
        if worker_id in self.stop_events:
            self.stop_events[worker_id].set()

        # Wait for graceful shutdown
        process.join(timeout=timeout)

        # Force kill if still alive
        if process.is_alive():
            logger.warning(f"Worker {worker_id} did not stop gracefully, killing")
            process.terminate()
            process.join(timeout=5)
            if process.is_alive():
                process.kill()

        logger.info(f"Worker {worker_id} stopped")

    def check_worker_health(self, worker_id: int) -> bool:
        """Check if a worker is healthy."""
        if worker_id not in self.workers:
            return False

        process = self.workers[worker_id]
        return process.is_alive()

    def restart_worker(self, worker_id: int):
        """Restart a dead worker."""
        logger.info(f"Restarting worker {worker_id}")
        self.stop_worker(worker_id)
        time.sleep(1)
        self.spawn_worker(worker_id)
        self.stats["workers_restarted"] += 1

    async def monitor_workers(self):
        """Monitor worker health and restart dead workers."""
        while self.running:
            for worker_id in range(1, self.num_workers + 1):
                if not self.check_worker_health(worker_id):
                    logger.warning(f"Worker {worker_id} is dead, restarting")
                    self.restart_worker(worker_id)

            await asyncio.sleep(self.health_check_interval)

    async def run(self):
        """Main manager loop."""
        logger.info("=" * 60)
        logger.info("SLOTFEED OCR Worker Manager Starting")
        logger.info(f"Workers: {self.num_workers}")
        logger.info(f"Redis: {self.redis_url}")
        logger.info("=" * 60)

        self.running = True
        self.stats["started_at"] = datetime.utcnow().isoformat()

        # Spawn workers
        for worker_id in range(1, self.num_workers + 1):
            self.spawn_worker(worker_id)
            time.sleep(2)  # Stagger startup to avoid resource spikes

        logger.info(f"All {self.num_workers} workers spawned")

        # Monitor workers
        try:
            await self.monitor_workers()
        except Exception as e:
            logger.error(f"Manager error: {e}")
        finally:
            self.shutdown()

    def shutdown(self):
        """Graceful shutdown of all workers."""
        logger.info("Shutting down all workers...")
        self.running = False

        for worker_id in list(self.workers.keys()):
            self.stop_worker(worker_id, timeout=15)

        logger.info("All workers stopped")
        logger.info(f"Stats: {self.stats}")

    def get_status(self) -> Dict:
        """Get manager and worker status."""
        worker_status = {}
        for worker_id, process in self.workers.items():
            worker_status[worker_id] = {
                "pid": process.pid,
                "alive": process.is_alive(),
                "exitcode": process.exitcode,
            }

        return {
            "running": self.running,
            "num_workers": self.num_workers,
            "workers": worker_status,
            "stats": self.stats,
        }


async def main():
    parser = argparse.ArgumentParser(description="SLOTFEED OCR Worker Manager")
    parser.add_argument(
        "--workers", "-n",
        type=int,
        default=4,
        help="Number of workers to spawn (default: 4)"
    )
    parser.add_argument(
        "--redis-url",
        type=str,
        default="redis://localhost:6379/0",
        help="Redis connection URL"
    )
    parser.add_argument(
        "--health-interval",
        type=int,
        default=30,
        help="Health check interval in seconds (default: 30)"
    )

    args = parser.parse_args()

    manager = WorkerManager(
        num_workers=args.workers,
        redis_url=args.redis_url,
        health_check_interval=args.health_interval,
    )

    await manager.run()


if __name__ == "__main__":
    asyncio.run(main())

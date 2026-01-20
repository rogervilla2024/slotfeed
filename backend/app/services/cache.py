from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
from app.core.redis import redis_client


class CacheService:
    """Service for caching frequently accessed data."""

    # Cache key prefixes
    PREFIX_STREAMER = "cache:streamer"
    PREFIX_GAME = "cache:game"
    PREFIX_SESSION = "cache:session"
    PREFIX_LIVE = "cache:live"
    PREFIX_LEADERBOARD = "cache:leaderboard"
    PREFIX_HOT_COLD = "cache:hot_cold"

    # Default TTL values (in seconds)
    TTL_STREAMER = 300  # 5 minutes
    TTL_GAME = 600  # 10 minutes
    TTL_SESSION = 30  # 30 seconds (live sessions update frequently)
    TTL_LIVE_LIST = 10  # 10 seconds
    TTL_LEADERBOARD = 300  # 5 minutes
    TTL_HOT_COLD = 60  # 1 minute

    # Streamer caching
    async def get_streamer(self, streamer_id: str) -> Optional[Dict]:
        return await redis_client.get_json(f"{self.PREFIX_STREAMER}:{streamer_id}")

    async def set_streamer(self, streamer_id: str, data: Dict) -> bool:
        return await redis_client.set_json(
            f"{self.PREFIX_STREAMER}:{streamer_id}",
            data,
            expire=self.TTL_STREAMER,
        )

    async def invalidate_streamer(self, streamer_id: str) -> int:
        return await redis_client.delete(f"{self.PREFIX_STREAMER}:{streamer_id}")

    # Game caching
    async def get_game(self, game_id: str) -> Optional[Dict]:
        return await redis_client.get_json(f"{self.PREFIX_GAME}:{game_id}")

    async def set_game(self, game_id: str, data: Dict) -> bool:
        return await redis_client.set_json(
            f"{self.PREFIX_GAME}:{game_id}",
            data,
            expire=self.TTL_GAME,
        )

    async def invalidate_game(self, game_id: str) -> int:
        return await redis_client.delete(f"{self.PREFIX_GAME}:{game_id}")

    # Live session caching
    async def get_live_session(self, session_id: str) -> Optional[Dict]:
        return await redis_client.get_json(f"{self.PREFIX_SESSION}:{session_id}")

    async def set_live_session(self, session_id: str, data: Dict) -> bool:
        return await redis_client.set_json(
            f"{self.PREFIX_SESSION}:{session_id}",
            data,
            expire=self.TTL_SESSION,
        )

    async def get_live_sessions_list(self) -> Optional[List[Dict]]:
        data = await redis_client.get_json(f"{self.PREFIX_LIVE}:list")
        return data

    async def set_live_sessions_list(self, sessions: List[Dict]) -> bool:
        return await redis_client.set_json(
            f"{self.PREFIX_LIVE}:list",
            sessions,
            expire=self.TTL_LIVE_LIST,
        )

    # Track active sessions in a Set
    async def add_live_session_id(self, session_id: str) -> int:
        return await redis_client.sadd(f"{self.PREFIX_LIVE}:active", session_id)

    async def remove_live_session_id(self, session_id: str) -> int:
        return await redis_client.srem(f"{self.PREFIX_LIVE}:active", session_id)

    async def get_live_session_ids(self) -> set:
        return await redis_client.smembers(f"{self.PREFIX_LIVE}:active")

    # Leaderboard caching
    async def get_leaderboard(self, category: str, period: str) -> Optional[List[Dict]]:
        return await redis_client.get_json(
            f"{self.PREFIX_LEADERBOARD}:{category}:{period}"
        )

    async def set_leaderboard(
        self, category: str, period: str, data: List[Dict]
    ) -> bool:
        return await redis_client.set_json(
            f"{self.PREFIX_LEADERBOARD}:{category}:{period}",
            data,
            expire=self.TTL_LEADERBOARD,
        )

    # Hot/Cold caching
    async def get_hot_cold(self) -> Optional[Dict]:
        return await redis_client.get_json(f"{self.PREFIX_HOT_COLD}:current")

    async def set_hot_cold(self, data: Dict) -> bool:
        return await redis_client.set_json(
            f"{self.PREFIX_HOT_COLD}:current",
            data,
            expire=self.TTL_HOT_COLD,
        )

    # Session balance tracking (for real-time updates)
    async def update_session_balance(
        self,
        session_id: str,
        balance: float,
        timestamp: datetime,
    ) -> None:
        """Store latest balance for a session."""
        key = f"{self.PREFIX_SESSION}:{session_id}:balance"
        await redis_client.set_json(
            key,
            {
                "balance": balance,
                "timestamp": timestamp.isoformat(),
            },
            expire=self.TTL_SESSION,
        )

    async def get_session_balance(self, session_id: str) -> Optional[Dict]:
        return await redis_client.get_json(
            f"{self.PREFIX_SESSION}:{session_id}:balance"
        )

    # Recent balance history (for charts)
    async def add_balance_to_history(
        self,
        session_id: str,
        balance: float,
        timestamp: datetime,
    ) -> None:
        """Add balance point to session history (keep last 100 points)."""
        key = f"{self.PREFIX_SESSION}:{session_id}:history"
        point = json.dumps({"balance": balance, "timestamp": timestamp.isoformat()})

        await redis_client.lpush(key, point)
        await redis_client.ltrim(key, 0, 99)  # Keep only last 100
        await redis_client.expire(key, 3600)  # 1 hour TTL

    async def get_balance_history(
        self, session_id: str, limit: int = 100
    ) -> List[Dict]:
        """Get balance history for a session."""
        key = f"{self.PREFIX_SESSION}:{session_id}:history"
        data = await redis_client.lrange(key, 0, limit - 1)
        return [json.loads(point) for point in data]

    # Viewer count tracking
    async def update_viewer_count(
        self, session_id: str, viewer_count: int
    ) -> None:
        """Update viewer count for a session."""
        key = f"{self.PREFIX_SESSION}:{session_id}:viewers"
        await redis_client.set(key, str(viewer_count), expire=60)

    async def get_viewer_count(self, session_id: str) -> Optional[int]:
        count = await redis_client.get(f"{self.PREFIX_SESSION}:{session_id}:viewers")
        return int(count) if count else None

    # Big wins counter (for daily stats)
    async def increment_big_wins_today(self) -> int:
        """Increment today's big win counter."""
        key = f"stats:big_wins:{datetime.utcnow().strftime('%Y-%m-%d')}"
        count = await redis_client.incr(key)
        if count == 1:
            # Set expiry at end of day + buffer
            await redis_client.expire(key, 90000)  # 25 hours
        return count

    async def get_big_wins_today(self) -> int:
        """Get today's big win count."""
        key = f"stats:big_wins:{datetime.utcnow().strftime('%Y-%m-%d')}"
        count = await redis_client.get(key)
        return int(count) if count else 0


# Global cache service instance
cache_service = CacheService()

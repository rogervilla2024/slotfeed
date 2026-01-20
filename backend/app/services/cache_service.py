"""
Phase 11-5-E: Redis Caching Service

Implements caching layer for performance optimization.
Target: 80%+ cache hit ratio, reduce API response time to < 200ms (p95)
"""

import json
import hashlib
from typing import Any, Optional, Callable, Type
from functools import wraps
from datetime import timedelta
import logging

try:
    import redis
    from redis import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

# ============================================
# CACHE CONFIGURATION
# ============================================

class CacheConfig:
    """Cache configuration with TTLs by endpoint"""

    # Default TTLs (seconds)
    DEFAULT_TTL = 60
    SHORT_TTL = 30      # Real-time data (big wins, live stats)
    MEDIUM_TTL = 300    # (5 minutes) - Game stats, chat analytics
    LONG_TTL = 3600    # (1 hour) - Streamer profiles, game details
    VERY_LONG_TTL = 86400  # (1 day) - Historical data

    # TTLs by endpoint
    ENDPOINT_TTLS = {
        # Streamers (1 hour)
        "/api/v1/streamers": LONG_TTL,
        "/api/v1/streamers/{id}": LONG_TTL,
        "/api/v1/streamers/{id}/stats": MEDIUM_TTL,
        "/api/v1/streamers/{id}/sessions": MEDIUM_TTL,

        # Games (1 hour)
        "/api/v1/games": LONG_TTL,
        "/api/v1/games/{id}": LONG_TTL,
        "/api/v1/games/{id}/stats": MEDIUM_TTL,
        "/api/v1/games/{id}/content": LONG_TTL,

        # Hot/Cold (30 minutes)
        "/api/v1/hot-cold": MEDIUM_TTL,
        "/api/v1/hot-cold/{id}": MEDIUM_TTL,
        "/api/v1/games/hot-cold": MEDIUM_TTL,

        # Sessions (5 minutes)
        "/api/v1/sessions": MEDIUM_TTL,
        "/api/v1/sessions/{id}": MEDIUM_TTL,
        "/api/v1/sessions/{id}/balance-history": MEDIUM_TTL,
        "/api/v1/sessions/{id}/game-breakdown": MEDIUM_TTL,

        # Big Wins (30 seconds - real-time)
        "/api/v1/big-wins": SHORT_TTL,
        "/api/v1/live/big-wins": SHORT_TTL,

        # Bonus Hunts (5 minutes)
        "/api/v1/bonus-hunts": MEDIUM_TTL,
        "/api/v1/bonus-hunts/{id}": MEDIUM_TTL,
        "/api/v1/bonus-hunts/leaderboard": MEDIUM_TTL,
        "/api/v1/bonus-hunts/stats": MEDIUM_TTL,

        # Chat Analytics (5 minutes)
        "/api/v1/chat-analytics": MEDIUM_TTL,
        "/api/v1/chat-analytics/{id}/metrics": MEDIUM_TTL,
        "/api/v1/chat-analytics/leaderboard": MEDIUM_TTL,

        # Live Data (30 seconds)
        "/api/v1/live/streams": SHORT_TTL,
        "/api/v1/live/rtp-tracker": SHORT_TTL,
        "/api/v1/live/chat-activity": SHORT_TTL,

        # Leaderboards (15 minutes)
        "/api/v1/leaderboards": 900,
    }

    # Patterns to never cache
    NEVER_CACHE_PATTERNS = [
        "/api/v1/admin",
        "/api/v1/auth",
        "/api/v1/user",
        "POST", "PUT", "PATCH", "DELETE",  # Mutations
    ]


# ============================================
# CACHE SERVICE
# ============================================

class CacheService:
    """Redis-based caching service"""

    def __init__(self, redis_url: Optional[str] = None):
        """Initialize cache service"""
        self.enabled = REDIS_AVAILABLE
        self.redis_client: Optional[Redis] = None
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
        }

        if redis_url and REDIS_AVAILABLE:
            try:
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                # Test connection
                self.redis_client.ping()
                logger.info("✅ Redis cache connected")
                self.enabled = True
            except Exception as e:
                logger.warning(f"⚠️ Redis connection failed: {e}. Using in-memory cache")
                self.enabled = False
        else:
            if not REDIS_AVAILABLE:
                logger.warning("⚠️ Redis not available. Install with: pip install redis")

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled or not self.redis_client:
            return None

        try:
            value = self.redis_client.get(key)
            if value:
                self.stats["hits"] += 1
                logger.debug(f"📦 Cache hit: {key}")
                return json.loads(value)
            else:
                self.stats["misses"] += 1
                return None
        except Exception as e:
            logger.error(f"❌ Cache get error: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = CacheConfig.DEFAULT_TTL) -> bool:
        """Set value in cache"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            self.redis_client.setex(key, ttl, json.dumps(value))
            logger.debug(f"💾 Cache set: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"❌ Cache set error: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            self.redis_client.delete(key)
            self.stats["evictions"] += 1
            logger.debug(f"🗑️ Cache delete: {key}")
            return True
        except Exception as e:
            logger.error(f"❌ Cache delete error: {e}")
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        if not self.enabled or not self.redis_client:
            return 0

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                self.stats["evictions"] += deleted
                logger.info(f"🗑️ Invalidated {deleted} cache keys matching {pattern}")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"❌ Cache invalidate_pattern error: {e}")
            return 0

    def clear(self) -> bool:
        """Clear all cache"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            self.redis_client.flushdb()
            logger.info("🗑️ Cache cleared")
            return True
        except Exception as e:
            logger.error(f"❌ Cache clear error: {e}")
            return False

    def get_stats(self) -> dict:
        """Get cache statistics"""
        if self.redis_client:
            try:
                info = self.redis_client.info()
                return {
                    **self.stats,
                    "hit_ratio": (self.stats["hits"] / (self.stats["hits"] + self.stats["misses"]))
                              if (self.stats["hits"] + self.stats["misses"]) > 0 else 0,
                    "memory_usage_mb": info.get("used_memory", 0) / 1024 / 1024,
                    "connected_clients": info.get("connected_clients", 0),
                    "total_commands_processed": info.get("total_commands_processed", 0),
                }
            except Exception as e:
                logger.error(f"❌ Cache stats error: {e}")

        return self.stats


# ============================================
# CACHE DECORATORS
# ============================================

def cache_result(
    ttl: int = CacheConfig.DEFAULT_TTL,
    key_prefix: str = ""
):
    """Decorator to cache function results"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            key_parts = [
                key_prefix or func.__name__,
                str(args),
                str(sorted(kwargs.items()))
            ]
            cache_key = hashlib.md5("|".join(key_parts).encode()).hexdigest()

            # Try cache
            cache = _get_cache_instance()
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

            # Call function
            result = await func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl)

            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            key_parts = [
                key_prefix or func.__name__,
                str(args),
                str(sorted(kwargs.items()))
            ]
            cache_key = hashlib.md5("|".join(key_parts).encode()).hexdigest()

            # Try cache
            cache = _get_cache_instance()
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

            # Call function
            result = func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl)

            return result

        # Return appropriate wrapper
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


# ============================================
# GLOBAL CACHE INSTANCE
# ============================================

_cache_instance: Optional[CacheService] = None


def initialize_cache(redis_url: Optional[str] = None) -> CacheService:
    """Initialize global cache instance"""
    global _cache_instance
    _cache_instance = CacheService(redis_url)
    return _cache_instance


def _get_cache_instance() -> CacheService:
    """Get global cache instance"""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService()
    return _cache_instance


def get_cache() -> CacheService:
    """Get cache service instance"""
    return _get_cache_instance()


# ============================================
# CACHE INVALIDATION PATTERNS
# ============================================

class CacheInvalidation:
    """Centralized cache invalidation patterns"""

    @staticmethod
    def streamer_updated(streamer_id: str):
        """Invalidate cache when streamer updated"""
        cache = get_cache()
        cache.invalidate_pattern(f"*streamer:{streamer_id}*")
        cache.invalidate_pattern(f"*/streamers/{streamer_id}*")

    @staticmethod
    def game_updated(game_id: str):
        """Invalidate cache when game updated"""
        cache = get_cache()
        cache.invalidate_pattern(f"*game:{game_id}*")
        cache.invalidate_pattern(f"*/games/{game_id}*")
        cache.invalidate_pattern("*hot-cold*")

    @staticmethod
    def session_updated(session_id: str):
        """Invalidate cache when session updated"""
        cache = get_cache()
        cache.invalidate_pattern(f"*session:{session_id}*")
        cache.invalidate_pattern(f"*/sessions/{session_id}*")

    @staticmethod
    def big_win_detected():
        """Invalidate cache when big win detected"""
        cache = get_cache()
        cache.invalidate_pattern("*/big-wins*")
        cache.invalidate_pattern("*/live/big-wins*")

    @staticmethod
    def bonus_hunt_updated(hunt_id: str):
        """Invalidate cache when bonus hunt updated"""
        cache = get_cache()
        cache.invalidate_pattern(f"*hunt:{hunt_id}*")
        cache.invalidate_pattern(f"*/bonus-hunts/{hunt_id}*")
        cache.invalidate_pattern("*/bonus-hunts/leaderboard*")

    @staticmethod
    def chat_analytics_updated(streamer_id: str):
        """Invalidate cache when chat analytics updated"""
        cache = get_cache()
        cache.invalidate_pattern(f"*chat:{streamer_id}*")
        cache.invalidate_pattern(f"*/chat-analytics/{streamer_id}*")


# ============================================
# EXPORTS
# ============================================

__all__ = [
    "CacheService",
    "CacheConfig",
    "CacheInvalidation",
    "cache_result",
    "initialize_cache",
    "get_cache",
]

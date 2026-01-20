import redis.asyncio as redis
from typing import Optional, Any
import json
from datetime import timedelta
from app.core.config import settings


class RedisClient:
    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._pubsub: Optional[redis.client.PubSub] = None

    async def connect(self) -> None:
        """Initialize Redis connection."""
        self._redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._pubsub:
            await self._pubsub.close()
        if self._redis:
            await self._redis.close()

    @property
    def client(self) -> redis.Redis:
        if not self._redis:
            raise RuntimeError("Redis not connected. Call connect() first.")
        return self._redis

    # Basic operations
    async def get(self, key: str) -> Optional[str]:
        return await self.client.get(key)

    async def set(
        self,
        key: str,
        value: str,
        expire: Optional[int] = None,
    ) -> bool:
        return await self.client.set(key, value, ex=expire)

    async def delete(self, key: str) -> int:
        return await self.client.delete(key)

    async def exists(self, key: str) -> bool:
        return await self.client.exists(key) > 0

    async def expire(self, key: str, seconds: int) -> bool:
        return await self.client.expire(key, seconds)

    async def ttl(self, key: str) -> int:
        return await self.client.ttl(key)

    # JSON operations
    async def get_json(self, key: str) -> Optional[Any]:
        data = await self.get(key)
        if data:
            return json.loads(data)
        return None

    async def set_json(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None,
    ) -> bool:
        return await self.set(key, json.dumps(value), expire)

    # Hash operations
    async def hget(self, name: str, key: str) -> Optional[str]:
        return await self.client.hget(name, key)

    async def hset(self, name: str, key: str, value: str) -> int:
        return await self.client.hset(name, key, value)

    async def hgetall(self, name: str) -> dict:
        return await self.client.hgetall(name)

    async def hdel(self, name: str, *keys: str) -> int:
        return await self.client.hdel(name, *keys)

    # List operations
    async def lpush(self, key: str, *values: str) -> int:
        return await self.client.lpush(key, *values)

    async def rpush(self, key: str, *values: str) -> int:
        return await self.client.rpush(key, *values)

    async def lrange(self, key: str, start: int, end: int) -> list:
        return await self.client.lrange(key, start, end)

    async def ltrim(self, key: str, start: int, end: int) -> bool:
        return await self.client.ltrim(key, start, end)

    # Set operations
    async def sadd(self, key: str, *values: str) -> int:
        return await self.client.sadd(key, *values)

    async def srem(self, key: str, *values: str) -> int:
        return await self.client.srem(key, *values)

    async def smembers(self, key: str) -> set:
        return await self.client.smembers(key)

    async def sismember(self, key: str, value: str) -> bool:
        return await self.client.sismember(key, value)

    # Sorted set operations (for leaderboards)
    async def zadd(self, key: str, mapping: dict, nx: bool = False) -> int:
        return await self.client.zadd(key, mapping, nx=nx)

    async def zrange(
        self,
        key: str,
        start: int,
        end: int,
        withscores: bool = False,
    ) -> list:
        return await self.client.zrange(key, start, end, withscores=withscores)

    async def zrevrange(
        self,
        key: str,
        start: int,
        end: int,
        withscores: bool = False,
    ) -> list:
        return await self.client.zrevrange(key, start, end, withscores=withscores)

    async def zrank(self, key: str, member: str) -> Optional[int]:
        return await self.client.zrank(key, member)

    async def zscore(self, key: str, member: str) -> Optional[float]:
        return await self.client.zscore(key, member)

    # Pub/Sub operations
    async def publish(self, channel: str, message: str) -> int:
        """Publish a message to a channel."""
        return await self.client.publish(channel, message)

    async def publish_json(self, channel: str, message: Any) -> int:
        """Publish a JSON message to a channel."""
        return await self.publish(channel, json.dumps(message))

    async def subscribe(self, *channels: str) -> redis.client.PubSub:
        """Subscribe to channels and return PubSub object."""
        if not self._pubsub:
            self._pubsub = self.client.pubsub()
        await self._pubsub.subscribe(*channels)
        return self._pubsub

    async def psubscribe(self, *patterns: str) -> redis.client.PubSub:
        """Subscribe to channel patterns and return PubSub object."""
        if not self._pubsub:
            self._pubsub = self.client.pubsub()
        await self._pubsub.psubscribe(*patterns)
        return self._pubsub

    # Increment operations (for counters/rate limiting)
    async def incr(self, key: str) -> int:
        return await self.client.incr(key)

    async def incrby(self, key: str, amount: int) -> int:
        return await self.client.incrby(key, amount)

    async def decr(self, key: str) -> int:
        return await self.client.decr(key)


# Global Redis client instance
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """Dependency for getting Redis client."""
    return redis_client

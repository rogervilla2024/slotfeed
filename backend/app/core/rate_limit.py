from typing import Optional, Tuple
from datetime import datetime, timezone
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.redis import redis_client


class RateLimitConfig:
    """Rate limit configuration per subscription tier."""

    # Requests per minute by tier
    LIMITS = {
        "free": 30,
        "pro": 100,
        "premium": 300,
        "unlimited": 10000,  # For internal/admin use
    }

    # WebSocket connections per user
    WS_LIMITS = {
        "free": 2,
        "pro": 5,
        "premium": 10,
        "unlimited": 100,
    }


async def check_rate_limit(
    identifier: str,
    tier: str = "free",
    window_seconds: int = 60,
) -> Tuple[bool, int, int]:
    """
    Check if a request is within rate limits.

    Returns:
        Tuple of (is_allowed, remaining_requests, reset_time)
    """
    limit = RateLimitConfig.LIMITS.get(tier, RateLimitConfig.LIMITS["free"])
    key = f"ratelimit:{identifier}:{datetime.now(timezone.utc).minute}"

    # Get current count
    current = await redis_client.get(key)
    count = int(current) if current else 0

    if count >= limit:
        ttl = await redis_client.ttl(key)
        return False, 0, ttl if ttl > 0 else window_seconds

    # Increment counter
    new_count = await redis_client.incr(key)

    # Set expiry on first request
    if new_count == 1:
        await redis_client.expire(key, window_seconds)

    remaining = max(0, limit - new_count)
    ttl = await redis_client.ttl(key)

    return True, remaining, ttl if ttl > 0 else window_seconds


async def get_client_identifier(request: Request) -> str:
    """Get unique identifier for rate limiting (IP or user ID)."""
    # Try to get user ID from auth context first
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    # Fall back to IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"

    return f"ip:{ip}"


async def get_user_tier(request: Request) -> str:
    """Get user subscription tier from request context."""
    tier = getattr(request.state, "user_tier", None)
    return tier if tier else "free"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce rate limits on API requests."""

    # Paths to exclude from rate limiting
    EXCLUDED_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
    }

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for excluded paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Skip rate limiting for WebSocket upgrades (handled separately)
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        try:
            identifier = await get_client_identifier(request)
            tier = await get_user_tier(request)

            is_allowed, remaining, reset_time = await check_rate_limit(
                identifier, tier
            )

            if not is_allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "retry_after": reset_time,
                    },
                    headers={
                        "X-RateLimit-Limit": str(
                            RateLimitConfig.LIMITS.get(tier, 30)
                        ),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(reset_time),
                        "Retry-After": str(reset_time),
                    },
                )

            response = await call_next(request)

            # Add rate limit headers to response
            response.headers["X-RateLimit-Limit"] = str(
                RateLimitConfig.LIMITS.get(tier, 30)
            )
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(reset_time)

            return response

        except HTTPException:
            raise
        except Exception:
            # If Redis is down, allow request but log warning
            return await call_next(request)


async def check_websocket_limit(user_id: str, tier: str = "free") -> bool:
    """Check if user can open another WebSocket connection."""
    limit = RateLimitConfig.WS_LIMITS.get(tier, RateLimitConfig.WS_LIMITS["free"])
    key = f"ws_connections:{user_id}"

    current = await redis_client.get(key)
    count = int(current) if current else 0

    return count < limit


async def increment_websocket_count(user_id: str) -> int:
    """Increment WebSocket connection count for user."""
    key = f"ws_connections:{user_id}"
    return await redis_client.incr(key)


async def decrement_websocket_count(user_id: str) -> int:
    """Decrement WebSocket connection count for user."""
    key = f"ws_connections:{user_id}"
    count = await redis_client.decr(key)
    if count <= 0:
        await redis_client.delete(key)
    return max(0, count)

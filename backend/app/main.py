from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import router as api_v1_router
from app.core.rate_limit import RateLimitMiddleware
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Try to import Redis (optional)
try:
    from app.core.redis import redis_client
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis_client = None

# Import scheduler
try:
    from app.services.scheduler import start_scheduler, stop_scheduler, run_sync_now
    SCHEDULER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Scheduler not available: {e}")
    SCHEDULER_AVAILABLE = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting SlotFeed API v{settings.VERSION}")

    # Connect to Redis (optional)
    if REDIS_AVAILABLE and redis_client:
        try:
            await redis_client.connect()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}")

    # Start background scheduler
    if SCHEDULER_AVAILABLE:
        try:
            start_scheduler()
            logger.info("Background scheduler started")
            # Run initial sync
            await run_sync_now()
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")

    yield

    # Shutdown
    logger.info("Shutting down SlotFeed API")

    # Stop scheduler
    if SCHEDULER_AVAILABLE:
        try:
            stop_scheduler()
            logger.info("Background scheduler stopped")
        except Exception:
            pass

    # Disconnect from Redis
    if REDIS_AVAILABLE and redis_client:
        try:
            await redis_client.disconnect()
            logger.info("Disconnected from Redis")
        except Exception:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-time slot streaming analytics API",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting middleware - ENABLED for security
if REDIS_AVAILABLE:
    app.add_middleware(RateLimitMiddleware)

# CORS middleware - Restricted methods and headers for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-API-Key",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],
    expose_headers=[
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
)


@app.get("/health")
async def health_check():
    # Check Redis connection (optional)
    redis_status = "disabled"
    if REDIS_AVAILABLE and redis_client:
        try:
            await redis_client.client.ping()
            redis_status = "connected"
        except Exception:
            redis_status = "disconnected"

    return {
        "status": "healthy",
        "version": settings.VERSION,
        "services": {
            "redis": redis_status,
            "scheduler": "running" if SCHEDULER_AVAILABLE else "disabled",
        },
    }


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


# Include API router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

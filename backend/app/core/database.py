from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
from app.core.config import settings


class Base(DeclarativeBase):
    pass


# Create async engine with increased connection pool for high-frequency operations
# Configured for ~500K balance_events/day with 15 concurrent streamers
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    if settings.DATABASE_URL else "postgresql+asyncpg://localhost/slotfeed",
    echo=False,
    pool_size=20,          # Increased from 10 for higher concurrency
    max_overflow=40,       # Increased from 20 for burst handling
    pool_timeout=30,       # Wait up to 30s for connection
    pool_recycle=1800,     # Recycle connections after 30 minutes
    pool_pre_ping=True,    # Verify connections before use
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from contextlib import asynccontextmanager

@asynccontextmanager
async def get_db_context():
    """Context manager for database sessions outside of FastAPI."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

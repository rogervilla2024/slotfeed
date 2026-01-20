"""
SLOTFEED Database Connection Module
Handles PostgreSQL/Supabase connections for the backend and monitoring scripts.
"""

import os
from typing import Optional, AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import dataclass

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from supabase import create_client, Client


@dataclass
class DatabaseConfig:
    """Database configuration."""
    host: str = "localhost"
    port: int = 5432
    database: str = "slotfeed"
    user: str = "postgres"
    password: str = ""
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        """Load configuration from environment variables."""
        return cls(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "slotfeed"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY"),
        )

    @property
    def sync_url(self) -> str:
        """Get synchronous database URL."""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"

    @property
    def async_url(self) -> str:
        """Get asynchronous database URL."""
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


class Database:
    """Database connection manager."""

    def __init__(self, config: Optional[DatabaseConfig] = None):
        self.config = config or DatabaseConfig.from_env()
        self._sync_engine = None
        self._async_engine = None
        self._sync_session_factory = None
        self._async_session_factory = None
        self._supabase_client: Optional[Client] = None

    def get_sync_engine(self):
        """Get synchronous SQLAlchemy engine."""
        if self._sync_engine is None:
            self._sync_engine = create_engine(
                self.config.sync_url,
                pool_size=15,
                max_overflow=30,
                pool_pre_ping=True,
                pool_recycle=3600,  # Recycle connections after 1 hour
            )
        return self._sync_engine

    def get_async_engine(self):
        """Get asynchronous SQLAlchemy engine."""
        if self._async_engine is None:
            self._async_engine = create_async_engine(
                self.config.async_url,
                pool_size=15,
                max_overflow=30,
                pool_pre_ping=True,
                pool_recycle=3600,  # Recycle connections after 1 hour
            )
        return self._async_engine

    def get_sync_session(self) -> Session:
        """Get a synchronous database session."""
        if self._sync_session_factory is None:
            self._sync_session_factory = sessionmaker(
                bind=self.get_sync_engine(),
                autocommit=False,
                autoflush=False,
            )
        return self._sync_session_factory()

    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get an asynchronous database session."""
        if self._async_session_factory is None:
            self._async_session_factory = async_sessionmaker(
                bind=self.get_async_engine(),
                class_=AsyncSession,
                expire_on_commit=False,
            )

        session = self._async_session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    def get_supabase_client(self) -> Optional[Client]:
        """Get Supabase client for direct API access."""
        if self._supabase_client is None:
            if self.config.supabase_url and self.config.supabase_key:
                self._supabase_client = create_client(
                    self.config.supabase_url,
                    self.config.supabase_key
                )
        return self._supabase_client

    async def close(self):
        """Close all database connections."""
        if self._async_engine:
            await self._async_engine.dispose()
        if self._sync_engine:
            self._sync_engine.dispose()


# Singleton instance
_db: Optional[Database] = None


def get_database() -> Database:
    """Get the singleton database instance."""
    global _db
    if _db is None:
        _db = Database()
    return _db


def get_sync_session() -> Session:
    """Convenience function to get a sync session."""
    return get_database().get_sync_session()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Convenience function to get an async session."""
    async with get_database().get_async_session() as session:
        yield session

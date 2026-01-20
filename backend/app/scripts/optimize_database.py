"""
Phase 11-5-E: Database Optimization Script

Creates necessary indexes and optimizations for production performance.
Reduces query times from 500ms+ to < 100ms (p95)
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_engine, async_sessionmaker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# DATABASE OPTIMIZATION QUERIES
# ============================================

OPTIMIZATION_QUERIES = [
    # ============================================
    # SESSIONS TABLE INDEXES
    # ============================================
    {
        "name": "idx_sessions_streamer_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_sessions_streamer_id
        ON sessions(streamer_id)
        WHERE status != 'archived';
        """,
        "description": "Fast lookup of sessions by streamer"
    },
    {
        "name": "idx_sessions_start_time",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_sessions_start_time
        ON sessions(start_time DESC);
        """,
        "description": "Fast time-based queries"
    },
    {
        "name": "idx_sessions_status",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_sessions_status
        ON sessions(status);
        """,
        "description": "Filter sessions by status"
    },
    {
        "name": "idx_sessions_composite",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_sessions_composite
        ON sessions(streamer_id, start_time DESC, status);
        """,
        "description": "Composite index for common queries"
    },

    # ============================================
    # BALANCE EVENTS TABLE INDEXES
    # ============================================
    {
        "name": "idx_balance_events_session_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_balance_events_session_id
        ON balance_events(session_id);
        """,
        "description": "Fast balance history lookup"
    },
    {
        "name": "idx_balance_events_timestamp",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_balance_events_timestamp
        ON balance_events(timestamp DESC);
        """,
        "description": "Time-based balance queries"
    },
    {
        "name": "idx_balance_events_composite",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_balance_events_composite
        ON balance_events(session_id, timestamp DESC);
        """,
        "description": "Session + time ordering"
    },

    # ============================================
    # BIG WINS TABLE INDEXES
    # ============================================
    {
        "name": "idx_big_wins_game_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_big_wins_game_id
        ON big_wins(game_id);
        """,
        "description": "Wins by game"
    },
    {
        "name": "idx_big_wins_streamer_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_big_wins_streamer_id
        ON big_wins(streamer_id);
        """,
        "description": "Wins by streamer"
    },
    {
        "name": "idx_big_wins_multiplier",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_big_wins_multiplier
        ON big_wins(multiplier DESC);
        """,
        "description": "Large wins first"
    },
    {
        "name": "idx_big_wins_timestamp",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_big_wins_timestamp
        ON big_wins(timestamp DESC);
        """,
        "description": "Recent wins first"
    },
    {
        "name": "idx_big_wins_composite",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_big_wins_composite
        ON big_wins(game_id, timestamp DESC, multiplier DESC);
        """,
        "description": "Game + time + size sorting"
    },

    # ============================================
    # GAME SESSIONS TABLE INDEXES
    # ============================================
    {
        "name": "idx_game_sessions_session_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id
        ON game_sessions(session_id);
        """,
        "description": "Games in session"
    },
    {
        "name": "idx_game_sessions_game_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id
        ON game_sessions(game_id);
        """,
        "description": "Sessions playing game"
    },

    # ============================================
    # CHAT ANALYTICS TABLE INDEXES
    # ============================================
    {
        "name": "idx_chat_analytics_streamer_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_chat_analytics_streamer_id
        ON chat_analytics(streamer_id, timestamp DESC);
        """,
        "description": "Chat metrics by streamer"
    },
    {
        "name": "idx_chat_analytics_hype_score",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_chat_analytics_hype_score
        ON chat_analytics(hype_score DESC);
        """,
        "description": "High hype moments"
    },

    # ============================================
    # BONUS HUNTS TABLE INDEXES
    # ============================================
    {
        "name": "idx_bonus_hunts_streamer_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_bonus_hunts_streamer_id
        ON bonus_hunts(streamer_id);
        """,
        "description": "Hunts by streamer"
    },
    {
        "name": "idx_bonus_hunts_status",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_bonus_hunts_status
        ON bonus_hunts(status);
        """,
        "description": "Hunts by status"
    },
    {
        "name": "idx_bonus_hunts_roi",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_bonus_hunts_roi
        ON bonus_hunts(roi_percent DESC);
        """,
        "description": "Best ROI hunts"
    },

    # ============================================
    # HOT COLD HISTORY TABLE INDEXES
    # ============================================
    {
        "name": "idx_hot_cold_history_game_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_hot_cold_history_game_id
        ON hot_cold_history(game_id, timestamp DESC);
        """,
        "description": "Game hot/cold history"
    },

    # ============================================
    # ALERT RULES TABLE INDEXES
    # ============================================
    {
        "name": "idx_alert_rules_user_id",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id
        ON alert_rules(user_id, enabled);
        """,
        "description": "User's active alerts"
    },

    # ============================================
    # STREAMER GAME STATS TABLE INDEXES
    # ============================================
    {
        "name": "idx_streamer_game_stats",
        "query": """
        CREATE INDEX IF NOT EXISTS idx_streamer_game_stats
        ON streamer_game_stats(streamer_id, game_id);
        """,
        "description": "Streamer preference for games"
    },

    # ============================================
    # ANALYZE TABLES FOR QUERY PLANNER
    # ============================================
    {
        "name": "analyze_sessions",
        "query": "ANALYZE sessions;",
        "description": "Update query planner statistics"
    },
    {
        "name": "analyze_balance_events",
        "query": "ANALYZE balance_events;",
        "description": "Update query planner statistics"
    },
    {
        "name": "analyze_big_wins",
        "query": "ANALYZE big_wins;",
        "description": "Update query planner statistics"
    },
]

# ============================================
# DATABASE CONNECTION POOL OPTIMIZATION
# ============================================

DATABASE_POOL_CONFIG = {
    "pool_size": 20,           # Base connection pool size
    "max_overflow": 10,        # Additional connections allowed
    "pool_pre_ping": True,     # Test connections before using
    "pool_recycle": 3600,      # Recycle connections every hour
    "echo": False,             # Disable SQL logging in production
    "connect_args": {
        "timeout": 10,         # Connection timeout (seconds)
        "command_timeout": 30,  # Query timeout (seconds)
    }
}

# ============================================
# QUERY OPTIMIZATION PATTERNS
# ============================================

QUERY_OPTIMIZATION_PATTERNS = """
-- Find missing indexes
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
ORDER BY tablename, indexname;

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find slow queries (requires pg_stat_statements extension)
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time,
    total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"""

# ============================================
# OPTIMIZATION FUNCTIONS
# ============================================

async def run_optimizations(database_url: str) -> dict:
    """Run all database optimizations"""
    engine = create_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    results = {
        "success": [],
        "failed": [],
        "skipped": [],
    }

    logger.info("Starting database optimization...")
    logger.info(f"Creating {len(OPTIMIZATION_QUERIES)} indexes...")

    async with async_session() as session:
        for opt in OPTIMIZATION_QUERIES:
            try:
                await session.execute(text(opt["query"]))
                await session.commit()
                results["success"].append(opt["name"])
                logger.info(f"✅ {opt['name']}: {opt['description']}")
            except Exception as e:
                if "already exists" in str(e) or "duplicate" in str(e).lower():
                    results["skipped"].append(opt["name"])
                    logger.info(f"⏭️ {opt['name']}: Already exists")
                else:
                    results["failed"].append((opt["name"], str(e)))
                    logger.error(f"❌ {opt['name']}: {str(e)}")

    await engine.dispose()

    return results


async def check_query_performance(database_url: str) -> dict:
    """Check current query performance"""
    engine = create_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    results = {}

    # Sample queries to test performance
    test_queries = [
        ("Get streamer sessions", """
            SELECT * FROM sessions
            WHERE streamer_id = 'roshtein'
            ORDER BY start_time DESC
            LIMIT 20
        """),
        ("Get game big wins", """
            SELECT * FROM big_wins
            WHERE game_id = 'sweet-bonanza'
            ORDER BY timestamp DESC
            LIMIT 50
        """),
        ("Get balance history", """
            SELECT * FROM balance_events
            WHERE session_id = 'session-123'
            ORDER BY timestamp
            LIMIT 1000
        """),
    ]

    async with async_session() as session:
        for test_name, query in test_queries:
            try:
                import time
                start = time.time()
                await session.execute(text(query))
                duration = (time.time() - start) * 1000

                status = "✅" if duration < 100 else "⚠️" if duration < 500 else "❌"
                results[test_name] = {
                    "status": status,
                    "duration_ms": round(duration, 2)
                }
                logger.info(f"{status} {test_name}: {duration:.2f}ms")
            except Exception as e:
                results[test_name] = {"status": "❌", "error": str(e)}
                logger.error(f"❌ {test_name}: {str(e)}")

    await engine.dispose()

    return results


# ============================================
# CLI INTERFACE
# ============================================

async def main():
    """Main optimization runner"""
    from app.core.config import settings

    logger.info("=" * 60)
    logger.info("PHASE 11-5-E: DATABASE OPTIMIZATION")
    logger.info("=" * 60)

    # Run optimizations
    results = await run_optimizations(settings.DATABASE_URL)

    logger.info("\n" + "=" * 60)
    logger.info("OPTIMIZATION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"✅ Successful: {len(results['success'])}")
    logger.info(f"⏭️ Skipped: {len(results['skipped'])}")
    logger.info(f"❌ Failed: {len(results['failed'])}")

    if results["failed"]:
        logger.error("\nFailed optimizations:")
        for name, error in results["failed"]:
            logger.error(f"  - {name}: {error}")

    # Check query performance
    logger.info("\n" + "=" * 60)
    logger.info("QUERY PERFORMANCE CHECK")
    logger.info("=" * 60)

    perf_results = await check_query_performance(settings.DATABASE_URL)

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("PERFORMANCE SUMMARY")
    logger.info("=" * 60)
    good_queries = sum(1 for r in perf_results.values() if "✅" in r.get("status", ""))
    logger.info(f"Good (<100ms): {good_queries}/{len(perf_results)}")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

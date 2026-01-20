#!/usr/bin/env python3
"""
Phase 14: Database Migration Runner

Runs all database migrations in order:
1. Initialize database schema
2. Create tables
3. Add indexes
4. Add constraints
5. Seed initial data
"""

import os
import sys
import logging
from pathlib import Path
import asyncio

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Migration files in order
MIGRATIONS = [
    "database/migrations/001_initial_schema.sql",
    "database/migrations/002_add_ml_analytics.sql",
    "database/migrations/003_add_indexes.sql",
    "database/migrations/004_add_constraints.sql",
]


def get_database_url():
    """Get database URL from environment or use default"""
    db_user = os.getenv('DB_USER', 'slotfeed')
    db_password = os.getenv('DB_PASSWORD', 'slotfeed_dev')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'slotfeed')

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


def run_migration_file(connection, migration_path):
    """Run a single migration file"""
    try:
        with open(migration_path, 'r') as f:
            sql = f.read()

        if not sql.strip():
            logger.warning(f"Migration file is empty: {migration_path}")
            return

        logger.info(f"Running migration: {migration_path}")

        # Split by semicolons and execute each statement
        statements = sql.split(';')
        for statement in statements:
            statement = statement.strip()
            if statement:
                connection.execute(text(statement))

        connection.commit()
        logger.info(f"✓ Migration completed: {migration_path}")

    except Exception as e:
        logger.error(f"✗ Migration failed: {migration_path}")
        logger.error(f"Error: {e}")
        connection.rollback()
        raise


def run_all_migrations():
    """Run all migrations in order"""
    db_url = get_database_url()
    logger.info(f"Connecting to database: {db_url}")

    # Create engine with connection pooling disabled
    engine = create_engine(db_url, poolclass=NullPool)

    try:
        with engine.connect() as connection:
            logger.info("Starting database migrations...")

            for migration in MIGRATIONS:
                migration_path = Path(__file__).parent.parent / migration

                if not migration_path.exists():
                    logger.warning(f"Migration file not found: {migration_path}")
                    continue

                run_migration_file(connection, migration_path)

            logger.info("✓ All migrations completed successfully!")

    except Exception as e:
        logger.error(f"✗ Migration process failed: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    run_all_migrations()

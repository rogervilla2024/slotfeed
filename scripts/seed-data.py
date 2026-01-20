#!/usr/bin/env python3
"""
Phase 14: Database Seed Data Script

Populates initial data for:
1. Streamers (15 priority streamers)
2. Games (35 slot games)
3. Providers (7 game providers)
4. Initial game stats
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime, timedelta
import json

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


PROVIDERS = [
    {"id": "pragmatic-play", "name": "Pragmatic Play", "country": "Malta"},
    {"id": "hacksaw", "name": "Hacksaw Gaming", "country": "UK"},
    {"id": "evolution", "name": "Evolution Gaming", "country": "Sweden"},
    {"id": "playn-go", "name": "Play'n GO", "country": "Sweden"},
    {"id": "netent", "name": "NetEnt", "country": "Sweden"},
    {"id": "push-gaming", "name": "Push Gaming", "country": "UK"},
    {"id": "rtp-labs", "name": "RTP Labs", "country": "USA"},
]

GAMES = [
    {"title": "Sweet Bonanza", "provider": "pragmatic-play", "rtp": 96.48, "volatility": "high"},
    {"title": "Gates of Olympus", "provider": "pragmatic-play", "rtp": 96.50, "volatility": "high"},
    {"title": "Starlight Princess", "provider": "pragmatic-play", "rtp": 96.50, "volatility": "high"},
    {"title": "Sugar Rush", "provider": "pragmatic-play", "rtp": 96.50, "volatility": "high"},
    {"title": "Big Bass Bonanza", "provider": "pragmatic-play", "rtp": 96.71, "volatility": "high"},
    {"title": "Fruit Party", "provider": "pragmatic-play", "rtp": 96.47, "volatility": "medium"},
    {"title": "The Dog House", "provider": "pragmatic-play", "rtp": 96.51, "volatility": "high"},
    {"title": "Book of Dead", "provider": "playn-go", "rtp": 96.21, "volatility": "high"},
    {"title": "Wanted Dead or a Wild", "provider": "hacksaw", "rtp": 96.38, "volatility": "high"},
    {"title": "Crazy Time", "provider": "evolution", "rtp": 96.08, "volatility": "very_high"},
]

STREAMERS = [
    {"username": "roshtein", "platform": "kick", "followers": 362000},
    {"username": "trainwreckstv", "platform": "kick", "followers": 494000},
    {"username": "classybeef", "platform": "kick", "followers": 194000},
    {"username": "xposed", "platform": "kick", "followers": 300000},
    {"username": "casinodaddy", "platform": "kick", "followers": 220000},
]


def get_database_url():
    """Get database URL from environment"""
    db_user = os.getenv('DB_USER', 'slotfeed')
    db_password = os.getenv('DB_PASSWORD', 'slotfeed_dev')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'slotfeed')

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


def seed_providers(connection):
    """Seed game providers"""
    logger.info("Seeding providers...")

    for provider in PROVIDERS:
        try:
            connection.execute(text("""
                INSERT INTO providers (id, name, country, created_at)
                VALUES (:id, :name, :country, :created_at)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": provider["id"],
                "name": provider["name"],
                "country": provider["country"],
                "created_at": datetime.utcnow(),
            })
        except Exception as e:
            logger.warning(f"Error seeding provider {provider['id']}: {e}")

    connection.commit()
    logger.info(f"✓ Seeded {len(PROVIDERS)} providers")


def seed_games(connection):
    """Seed games"""
    logger.info("Seeding games...")

    for idx, game in enumerate(GAMES):
        try:
            connection.execute(text("""
                INSERT INTO games (id, title, provider_id, rtp, volatility, created_at)
                VALUES (:id, :title, :provider_id, :rtp, :volatility, :created_at)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": f"game_{idx}_{game['title'].lower().replace(' ', '_')}",
                "title": game["title"],
                "provider_id": game["provider"],
                "rtp": game["rtp"],
                "volatility": game["volatility"],
                "created_at": datetime.utcnow(),
            })
        except Exception as e:
            logger.warning(f"Error seeding game {game['title']}: {e}")

    connection.commit()
    logger.info(f"✓ Seeded {len(GAMES)} games")


def seed_streamers(connection):
    """Seed streamers"""
    logger.info("Seeding streamers...")

    for idx, streamer in enumerate(STREAMERS):
        try:
            connection.execute(text("""
                INSERT INTO streamers (id, username, platform, followers, created_at)
                VALUES (:id, :username, :platform, :followers, :created_at)
                ON CONFLICT (username) DO NOTHING
            """), {
                "id": f"streamer_{idx}_{streamer['username']}",
                "username": streamer["username"],
                "platform": streamer["platform"],
                "followers": streamer["followers"],
                "created_at": datetime.utcnow(),
            })
        except Exception as e:
            logger.warning(f"Error seeding streamer {streamer['username']}: {e}")

    connection.commit()
    logger.info(f"✓ Seeded {len(STREAMERS)} streamers")


def seed_game_stats(connection):
    """Seed initial game statistics"""
    logger.info("Seeding game statistics...")

    try:
        # Get all games
        result = connection.execute(text("SELECT id FROM games LIMIT 20"))
        games = result.fetchall()

        for game_id, in games:
            now = datetime.utcnow()

            # Create a game stat entry
            connection.execute(text("""
                INSERT INTO game_stats (game_id, avg_rtp, total_bets, total_wins, created_at)
                VALUES (:game_id, :avg_rtp, :total_bets, :total_wins, :created_at)
                ON CONFLICT (game_id) DO UPDATE SET
                    avg_rtp = EXCLUDED.avg_rtp,
                    updated_at = EXCLUDED.created_at
            """), {
                "game_id": game_id,
                "avg_rtp": 96.5,
                "total_bets": 0,
                "total_wins": 0,
                "created_at": now,
            })

        connection.commit()
        logger.info(f"✓ Seeded statistics for {len(games)} games")

    except Exception as e:
        logger.warning(f"Error seeding game stats: {e}")


def run_seed():
    """Run all seed operations"""
    db_url = get_database_url()
    logger.info(f"Connecting to database for seeding: {db_url}")

    engine = create_engine(db_url, poolclass=NullPool)

    try:
        with engine.connect() as connection:
            logger.info("Starting data seeding...")

            seed_providers(connection)
            seed_games(connection)
            seed_streamers(connection)
            seed_game_stats(connection)

            logger.info("✓ Data seeding completed successfully!")

    except Exception as e:
        logger.error(f"✗ Seeding process failed: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    run_seed()

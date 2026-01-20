#!/usr/bin/env python3
"""
Database seeding CLI script.

Usage:
    python -m database.seeds.seed_all [--streamers] [--games] [--all]

This script populates the database with initial seed data.
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


async def seed_streamers_async():
    """Seed Tier 1 streamers into the database."""
    from backend.app.core.database import get_db
    from database.seeds.tier1_streamers import seed_streamers

    async for session in get_db():
        count = await seed_streamers(session)
        print(f"Seeded {count} streamers.")
        return count

    return 0


async def seed_games_async():
    """Seed top games into the database."""
    # TODO: Implement in TASK-013
    print("Game seeding not yet implemented (TASK-013).")
    return 0


async def main(args):
    """Main entry point for seeding."""
    print("=" * 60)
    print("SLOTFEED Database Seeder")
    print("=" * 60)
    print()

    if args.all or args.streamers:
        print("Seeding streamers...")
        try:
            count = await seed_streamers_async()
            print(f"  -> {count} streamers seeded successfully.")
        except Exception as e:
            print(f"  -> Error seeding streamers: {e}")
            if not args.all:
                return 1

    if args.all or args.games:
        print("Seeding games...")
        try:
            count = await seed_games_async()
            print(f"  -> {count} games seeded successfully.")
        except Exception as e:
            print(f"  -> Error seeding games: {e}")
            if not args.all:
                return 1

    print()
    print("=" * 60)
    print("Seeding complete!")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed the SLOTFEED database with initial data."
    )
    parser.add_argument(
        "--streamers",
        action="store_true",
        help="Seed Tier 1 streamers"
    )
    parser.add_argument(
        "--games",
        action="store_true",
        help="Seed top games (not yet implemented)"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Seed all data types"
    )

    args = parser.parse_args()

    # Default to --all if no options specified
    if not any([args.streamers, args.games, args.all]):
        args.all = True

    exit_code = asyncio.run(main(args))
    sys.exit(exit_code)

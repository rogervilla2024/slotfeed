"""
Database seeding script for SLOTFEED
Populates the database with initial mock data for development and testing
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
import uuid
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker

# Import models
from app.core.database import Base
from app.models import (
    Provider,
    Game,
    Streamer,
    Session,
    GameSession,
    BalanceEvent,
    BigWin,
    BonusHunt,
    BonusHuntEntry,
    User,
)
from app.core.config import settings


async def seed_database():
    """
    Seed the database with comprehensive mock data
    """
    print("\n- Seeding database with mock data...")

    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL or "postgresql+asyncpg://localhost/slotfeed",
        echo=False,
    )

    # Create session maker
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with engine.begin() as conn:
            # Create all tables
            print("  - Creating database tables...")
            await conn.run_sync(Base.metadata.create_all)

        async with async_session() as session:
            # Check if data already exists
            result = await session.execute(text("SELECT COUNT(*) FROM streamers"))
            if result.scalar() > 0:
                print("  - Database already seeded, skipping...")
                return

            print("  - Inserting providers...")
            providers = await seed_providers(session)

            print("  - Inserting games...")
            games = await seed_games(session, providers)

            print("  - Inserting streamers...")
            streamers = await seed_streamers(session)

            print("  - Inserting users...")
            users = await seed_users(session)

            print("  - Inserting sessions and related data...")
            await seed_sessions(session, streamers, games)

            print("  - Inserting bonus hunts...")
            await seed_bonus_hunts(session, streamers, games)

            # Commit all changes
            await session.commit()
            print("  - Database seeding complete!")

    except Exception as e:
        print(f"  - Error seeding database: {str(e)}")
        raise
    finally:
        await engine.dispose()


async def seed_providers(session: AsyncSession) -> list[Provider]:
    """Seed provider data"""
    providers_data = [
        {
            "name": "Pragmatic Play",
            "slug": "pragmatic-play",
            "logo_url": "https://example.com/pragmatic.png",
            "website_url": "https://www.pragmaticplay.com",
            "total_games": 10,
            "avg_rtp": Decimal("96.50"),
        },
        {
            "name": "Hacksaw Gaming",
            "slug": "hacksaw-gaming",
            "logo_url": "https://example.com/hacksaw.png",
            "website_url": "https://www.hacksawgaming.com",
            "total_games": 8,
            "avg_rtp": Decimal("96.38"),
        },
        {
            "name": "Play'n GO",
            "slug": "playn-go",
            "logo_url": "https://example.com/playngo.png",
            "website_url": "https://www.playngo.com",
            "total_games": 7,
            "avg_rtp": Decimal("96.21"),
        },
        {
            "name": "Relax Gaming",
            "slug": "relax-gaming",
            "logo_url": "https://example.com/relax.png",
            "website_url": "https://www.relaxgaming.com",
            "total_games": 5,
            "avg_rtp": Decimal("96.00"),
        },
        {
            "name": "Evolution",
            "slug": "evolution",
            "logo_url": "https://example.com/evolution.png",
            "website_url": "https://www.evolutiongaming.com",
            "total_games": 6,
            "avg_rtp": Decimal("96.08"),
        },
    ]

    providers = []
    for data in providers_data:
        provider = Provider(
            id=str(uuid.uuid4()),
            **data,
        )
        session.add(provider)
        providers.append(provider)

    await session.flush()
    return providers


async def seed_games(session: AsyncSession, providers: list[Provider]) -> list[Game]:
    """Seed game data"""
    games_data = [
        # Pragmatic Play games
        {
            "provider_id": providers[0].id,
            "name": "Sweet Bonanza",
            "slug": "sweet-bonanza",
            "rtp": Decimal("96.48"),
            "volatility": "high",
            "description": "A popular slot game with candy theme",
            "max_multiplier": 21600,
            "has_free_spins": True,
            "has_bonus": True,
            "has_multiplier": True,
        },
        {
            "provider_id": providers[0].id,
            "name": "Gates of Olympus",
            "slug": "gates-of-olympus",
            "rtp": Decimal("96.50"),
            "volatility": "high",
            "description": "Ancient Greek themed slot",
            "max_multiplier": 5000,
            "has_free_spins": True,
            "has_bonus": True,
            "has_multiplier": True,
        },
        {
            "provider_id": providers[0].id,
            "name": "Big Bass Bonanza",
            "slug": "big-bass-bonanza",
            "rtp": Decimal("96.71"),
            "volatility": "medium",
            "description": "Fishing themed slot game",
            "max_multiplier": 2100,
            "has_free_spins": True,
            "has_bonus": True,
            "has_multiplier": True,
        },
        # Hacksaw Gaming games
        {
            "provider_id": providers[1].id,
            "name": "Wanted Dead or a Wild",
            "slug": "wanted-dead-or-a-wild",
            "rtp": Decimal("96.38"),
            "volatility": "high",
            "description": "Western themed slot",
            "max_multiplier": 2500,
            "has_free_spins": True,
            "has_bonus": True,
            "has_multiplier": False,
        },
        {
            "provider_id": providers[1].id,
            "name": "Hack O'Lantern",
            "slug": "hack-o-lantern",
            "rtp": Decimal("96.20"),
            "volatility": "medium",
            "description": "Halloween themed slot",
            "max_multiplier": 5000,
            "has_free_spins": True,
            "has_bonus": True,
            "has_multiplier": True,
        },
        # Play'n GO games
        {
            "provider_id": providers[2].id,
            "name": "Book of Dead",
            "slug": "book-of-dead",
            "rtp": Decimal("96.21"),
            "volatility": "high",
            "description": "Egyptian adventure slot",
            "max_multiplier": 5000,
            "has_free_spins": True,
            "has_bonus": True,
            "has_multiplier": False,
        },
        {
            "provider_id": providers[2].id,
            "name": "Moon Princess",
            "slug": "moon-princess",
            "rtp": Decimal("96.50"),
            "volatility": "medium",
            "description": "Magical princess themed slot",
            "max_multiplier": 1000,
            "has_free_spins": True,
            "has_bonus": True,
            "has_multiplier": True,
        },
    ]

    games = []
    for data in games_data:
        game = Game(
            id=str(uuid.uuid4()),
            **data,
        )
        session.add(game)
        games.append(game)

    await session.flush()
    return games


async def seed_streamers(session: AsyncSession) -> list[Streamer]:
    """Seed streamer data"""
    streamers_data = [
        {
            "kick_id": "roshtein",
            "username": "roshtein",
            "display_name": "Roshtein",
            "slug": "roshtein",
            "country": "IS",
            "language": "en",
            "kick_url": "https://kick.com/roshtein",
            "total_wagered": Decimal("500000.00"),
            "total_won": Decimal("450000.00"),
            "net_profit_loss": Decimal("-50000.00"),
            "lifetime_rtp": Decimal("90.00"),
            "total_stream_hours": 2000,
            "total_sessions": 500,
            "biggest_win": Decimal("25000.00"),
            "biggest_multiplier": Decimal("500.00"),
            "followers_count": 362000,
            "avg_viewers": 5000,
            "tier": 5,
        },
        {
            "kick_id": "trainwreckstv",
            "username": "trainwreckstv",
            "display_name": "Trainwreckstv",
            "slug": "trainwreckstv",
            "country": "US",
            "language": "en",
            "kick_url": "https://kick.com/trainwreckstv",
            "total_wagered": Decimal("750000.00"),
            "total_won": Decimal("700000.00"),
            "net_profit_loss": Decimal("-50000.00"),
            "lifetime_rtp": Decimal("93.33"),
            "total_stream_hours": 1500,
            "total_sessions": 300,
            "biggest_win": Decimal("50000.00"),
            "biggest_multiplier": Decimal("1000.00"),
            "followers_count": 494000,
            "avg_viewers": 8000,
            "tier": 5,
        },
        {
            "kick_id": "classybeef",
            "username": "classybeef",
            "display_name": "ClassyBeef",
            "slug": "classybeef",
            "country": "US",
            "language": "en",
            "kick_url": "https://kick.com/classybeef",
            "total_wagered": Decimal("1000000.00"),
            "total_won": Decimal("950000.00"),
            "net_profit_loss": Decimal("-50000.00"),
            "lifetime_rtp": Decimal("95.00"),
            "total_stream_hours": 3000,
            "total_sessions": 600,
            "biggest_win": Decimal("100000.00"),
            "biggest_multiplier": Decimal("2000.00"),
            "followers_count": 194000,
            "avg_viewers": 3000,
            "tier": 4,
        },
        {
            "kick_id": "xposed",
            "username": "xposed",
            "display_name": "Xposed",
            "slug": "xposed",
            "country": "GB",
            "language": "en",
            "kick_url": "https://kick.com/xposed",
            "total_wagered": Decimal("600000.00"),
            "total_won": Decimal("580000.00"),
            "net_profit_loss": Decimal("-20000.00"),
            "lifetime_rtp": Decimal("96.67"),
            "total_stream_hours": 1200,
            "total_sessions": 250,
            "biggest_win": Decimal("30000.00"),
            "biggest_multiplier": Decimal("600.00"),
            "followers_count": 300000,
            "avg_viewers": 4000,
            "tier": 4,
        },
        {
            "kick_id": "deuceace",
            "username": "deuceace",
            "display_name": "DeuceAce",
            "slug": "deuceace",
            "country": "US",
            "language": "en",
            "kick_url": "https://kick.com/deuceace",
            "total_wagered": Decimal("400000.00"),
            "total_won": Decimal("380000.00"),
            "net_profit_loss": Decimal("-20000.00"),
            "lifetime_rtp": Decimal("95.00"),
            "total_stream_hours": 800,
            "total_sessions": 150,
            "biggest_win": Decimal("15000.00"),
            "biggest_multiplier": Decimal("250.00"),
            "followers_count": 177000,
            "avg_viewers": 2500,
            "tier": 3,
        },
        {
            "kick_id": "mellstroy",
            "username": "mellstroy",
            "display_name": "Mellstroy",
            "slug": "mellstroy",
            "country": "RU",
            "language": "ru",
            "kick_url": "https://kick.com/mellstroy",
            "total_wagered": Decimal("200000000.00"),
            "total_won": Decimal("197000000.00"),
            "net_profit_loss": Decimal("-3000000.00"),
            "lifetime_rtp": Decimal("98.50"),
            "total_stream_hours": 2500,
            "total_sessions": 400,
            "biggest_win": Decimal("3500000.00"),
            "biggest_multiplier": Decimal("1500.00"),
            "followers_count": 452000,
            "avg_viewers": 15000,
            "tier": 5,
        },
        {
            "kick_id": "ayezee",
            "username": "ayezee",
            "display_name": "Ayezee",
            "slug": "ayezee",
            "country": "IE",
            "language": "en",
            "kick_url": "https://kick.com/ayezee",
            "total_wagered": Decimal("80000000.00"),
            "total_won": Decimal("78000000.00"),
            "net_profit_loss": Decimal("-2000000.00"),
            "lifetime_rtp": Decimal("97.50"),
            "total_stream_hours": 1800,
            "total_sessions": 350,
            "biggest_win": Decimal("1200000.00"),
            "biggest_multiplier": Decimal("800.00"),
            "followers_count": 280000,
            "avg_viewers": 6000,
            "tier": 4,
        },
        {
            "kick_id": "bidule",
            "username": "bidule",
            "display_name": "Bidule",
            "slug": "bidule",
            "country": "FR",
            "language": "fr",
            "kick_url": "https://kick.com/bidule",
            "total_wagered": Decimal("25000000.00"),
            "total_won": Decimal("25300000.00"),
            "net_profit_loss": Decimal("300000.00"),
            "lifetime_rtp": Decimal("101.20"),
            "total_stream_hours": 1400,
            "total_sessions": 280,
            "biggest_win": Decimal("600000.00"),
            "biggest_multiplier": Decimal("400.00"),
            "followers_count": 150000,
            "avg_viewers": 3500,
            "tier": 3,
        },
        {
            "kick_id": "vondice",
            "username": "vondice",
            "display_name": "VonDice",
            "slug": "vondice",
            "country": "DE",
            "language": "de",
            "kick_url": "https://kick.com/vondice",
            "total_wagered": Decimal("45000000.00"),
            "total_won": Decimal("44500000.00"),
            "net_profit_loss": Decimal("-500000.00"),
            "lifetime_rtp": Decimal("98.89"),
            "total_stream_hours": 1100,
            "total_sessions": 220,
            "biggest_win": Decimal("800000.00"),
            "biggest_multiplier": Decimal("500.00"),
            "followers_count": 185000,
            "avg_viewers": 4500,
            "tier": 3,
        },
        {
            "kick_id": "casinodaddy",
            "username": "casinodaddy",
            "display_name": "CasinoDaddy",
            "slug": "casinodaddy",
            "country": "SE",
            "language": "en",
            "kick_url": "https://kick.com/casinodaddy",
            "total_wagered": Decimal("30000000.00"),
            "total_won": Decimal("30500000.00"),
            "net_profit_loss": Decimal("500000.00"),
            "lifetime_rtp": Decimal("101.70"),
            "total_stream_hours": 2200,
            "total_sessions": 450,
            "biggest_win": Decimal("750000.00"),
            "biggest_multiplier": Decimal("350.00"),
            "followers_count": 220000,
            "avg_viewers": 3000,
            "tier": 4,
        },
        {
            "kick_id": "slotbox",
            "username": "slotbox",
            "display_name": "SlotBox",
            "slug": "slotbox",
            "country": "MT",
            "language": "en",
            "kick_url": "https://kick.com/slotbox",
            "total_wagered": Decimal("18000000.00"),
            "total_won": Decimal("17800000.00"),
            "net_profit_loss": Decimal("-200000.00"),
            "lifetime_rtp": Decimal("98.89"),
            "total_stream_hours": 900,
            "total_sessions": 180,
            "biggest_win": Decimal("450000.00"),
            "biggest_multiplier": Decimal("300.00"),
            "followers_count": 95000,
            "avg_viewers": 2000,
            "tier": 2,
        },
        {
            "kick_id": "chipmonkz",
            "username": "chipmonkz",
            "display_name": "Chipmonkz",
            "slug": "chipmonkz",
            "country": "US",
            "language": "en",
            "kick_url": "https://kick.com/chipmonkz",
            "total_wagered": Decimal("22000000.00"),
            "total_won": Decimal("21500000.00"),
            "net_profit_loss": Decimal("-500000.00"),
            "lifetime_rtp": Decimal("97.73"),
            "total_stream_hours": 1000,
            "total_sessions": 200,
            "biggest_win": Decimal("550000.00"),
            "biggest_multiplier": Decimal("280.00"),
            "followers_count": 110000,
            "avg_viewers": 2500,
            "tier": 2,
        },
        {
            "kick_id": "mrlowroller",
            "username": "mrlowroller",
            "display_name": "MrLowRoller",
            "slug": "mrlowroller",
            "country": "US",
            "language": "en",
            "kick_url": "https://kick.com/mrlowroller",
            "total_wagered": Decimal("5000000.00"),
            "total_won": Decimal("4900000.00"),
            "net_profit_loss": Decimal("-100000.00"),
            "lifetime_rtp": Decimal("98.00"),
            "total_stream_hours": 600,
            "total_sessions": 120,
            "biggest_win": Decimal("150000.00"),
            "biggest_multiplier": Decimal("150.00"),
            "followers_count": 75000,
            "avg_viewers": 1500,
            "tier": 2,
        },
        {
            "kick_id": "fruityslots",
            "username": "fruityslots",
            "display_name": "FruitySlots",
            "slug": "fruityslots",
            "country": "GB",
            "language": "en",
            "kick_url": "https://kick.com/fruityslots",
            "total_wagered": Decimal("20000000.00"),
            "total_won": Decimal("20150000.00"),
            "net_profit_loss": Decimal("150000.00"),
            "lifetime_rtp": Decimal("100.75"),
            "total_stream_hours": 1600,
            "total_sessions": 320,
            "biggest_win": Decimal("450000.00"),
            "biggest_multiplier": Decimal("220.00"),
            "followers_count": 180000,
            "avg_viewers": 2800,
            "tier": 3,
        },
        {
            "kick_id": "spintwix",
            "username": "spintwix",
            "display_name": "SpinTwix",
            "slug": "spintwix",
            "country": "CA",
            "language": "en",
            "kick_url": "https://kick.com/spintwix",
            "total_wagered": Decimal("12000000.00"),
            "total_won": Decimal("11800000.00"),
            "net_profit_loss": Decimal("-200000.00"),
            "lifetime_rtp": Decimal("98.33"),
            "total_stream_hours": 750,
            "total_sessions": 150,
            "biggest_win": Decimal("320000.00"),
            "biggest_multiplier": Decimal("180.00"),
            "followers_count": 88000,
            "avg_viewers": 1800,
            "tier": 2,
        },
        {
            "kick_id": "jarttu84",
            "username": "jarttu84",
            "display_name": "Jarttu84",
            "slug": "jarttu84",
            "country": "FI",
            "language": "fi",
            "kick_url": "https://kick.com/jarttu84",
            "total_wagered": Decimal("15000000.00"),
            "total_won": Decimal("14900000.00"),
            "net_profit_loss": Decimal("-100000.00"),
            "lifetime_rtp": Decimal("99.33"),
            "total_stream_hours": 1300,
            "total_sessions": 260,
            "biggest_win": Decimal("350000.00"),
            "biggest_multiplier": Decimal("200.00"),
            "followers_count": 120000,
            "avg_viewers": 2200,
            "tier": 3,
        },
        {
            "kick_id": "nickslots",
            "username": "nickslots",
            "display_name": "NickSlots",
            "slug": "nickslots",
            "country": "GB",
            "language": "en",
            "kick_url": "https://kick.com/nickslots",
            "total_wagered": Decimal("8000000.00"),
            "total_won": Decimal("7850000.00"),
            "net_profit_loss": Decimal("-150000.00"),
            "lifetime_rtp": Decimal("98.13"),
            "total_stream_hours": 850,
            "total_sessions": 170,
            "biggest_win": Decimal("280000.00"),
            "biggest_multiplier": Decimal("160.00"),
            "followers_count": 92000,
            "avg_viewers": 1600,
            "tier": 2,
        },
        {
            "kick_id": "prodigy",
            "username": "prodigy",
            "display_name": "Prodigy",
            "slug": "prodigy",
            "country": "US",
            "language": "en",
            "kick_url": "https://kick.com/prodigy",
            "total_wagered": Decimal("35000000.00"),
            "total_won": Decimal("34200000.00"),
            "net_profit_loss": Decimal("-800000.00"),
            "lifetime_rtp": Decimal("97.71"),
            "total_stream_hours": 1100,
            "total_sessions": 220,
            "biggest_win": Decimal("680000.00"),
            "biggest_multiplier": Decimal("320.00"),
            "followers_count": 165000,
            "avg_viewers": 3200,
            "tier": 3,
        },
    ]

    streamers = []
    for data in streamers_data:
        streamer = Streamer(
            id=str(uuid.uuid4()),
            **data,
        )
        session.add(streamer)
        streamers.append(streamer)

    await session.flush()
    return streamers


async def seed_users(session: AsyncSession) -> list[User]:
    """Seed user data"""
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    users_data = [
        {
            "email": "admin@slotfeed.com",
            "username": "admin",
            "display_name": "Administrator",
            "password_hash": pwd_context.hash("Admin123!"),
            "is_active": True,
            "email_verified": True,
            "subscription_tier": "premium",
        },
        {
            "email": "user@example.com",
            "username": "user1",
            "display_name": "Test User",
            "password_hash": pwd_context.hash("User123!"),
            "is_active": True,
            "email_verified": True,
            "subscription_tier": "pro",
        },
    ]

    users = []
    for data in users_data:
        user = User(
            id=str(uuid.uuid4()),
            **data,
        )
        session.add(user)
        users.append(user)

    await session.flush()
    return users


async def seed_sessions(
    session: AsyncSession, streamers: list[Streamer], games: list[Game]
):
    """Seed session and related data"""
    now = datetime.utcnow()

    for streamer in streamers[:3]:  # Seed sessions for first 3 streamers
        for i in range(5):  # 5 sessions per streamer
            session_start = now - timedelta(days=30 - (i * 5))
            session_end = session_start + timedelta(hours=2 + i)

            # Create session
            new_session = Session(
                id=str(uuid.uuid4()),
                streamer_id=streamer.id,
                platform="kick",
                started_at=session_start,
                ended_at=session_end,
                duration_minutes=120 + (i * 30),
                starting_balance=Decimal("1000.00"),
                ending_balance=Decimal("1200.00") + Decimal(i * 100),
                total_wagered=Decimal("5000.00") + Decimal(i * 1000),
                total_won=Decimal("4800.00") + Decimal(i * 1200),
                net_profit_loss=Decimal("-200.00") + Decimal(i * 200),
                session_rtp=Decimal("96.00"),
                biggest_win=Decimal("500.00") + Decimal(i * 100),
                biggest_multiplier=Decimal("10.00") + Decimal(i),
                games_played=len(games[:3]),
                bonus_count=2 + i,
                peak_viewers=5000 + (i * 500),
                avg_viewers=3000 + (i * 200),
                is_live=False,
            )
            session.add(new_session)
            await session.flush()

            # Create game sessions
            for game in games[:3]:
                game_session = GameSession(
                    id=str(uuid.uuid4()),
                    session_id=new_session.id,
                    game_id=game.id,
                    total_wagered=Decimal("1500.00"),
                    total_won=Decimal("1400.00"),
                    spins=300,
                    observed_rtp=Decimal("93.33"),
                    biggest_win=Decimal("300.00"),
                    biggest_multiplier=Decimal("5.00"),
                    start_time=session_start,
                    end_time=session_end,
                )
                session.add(game_session)

            # Create balance events (sample)
            current_balance = Decimal("1000.00")
            for j in range(10):
                event_time = session_start + timedelta(minutes=j * 12)
                bet_amount = Decimal("50.00")
                win_amount = Decimal("45.00") if j % 2 == 0 else Decimal("0.00")
                new_balance = current_balance - bet_amount + win_amount

                balance_event = BalanceEvent(
                    id=str(uuid.uuid4()),
                    session_id=new_session.id,
                    previous_balance=current_balance,
                    new_balance=new_balance,
                    balance_change=new_balance - current_balance,
                    event_type="spin",
                    wagered=bet_amount,
                    won=win_amount,
                    timestamp=event_time,
                )
                session.add(balance_event)
                current_balance = new_balance

            # Create a big win
            if i % 2 == 0:
                big_win = BigWin(
                    id=str(uuid.uuid4()),
                    session_id=new_session.id,
                    game_id=games[0].id,
                    streamer_id=streamer.id,
                    amount=Decimal("2500.00"),
                    multiplier=Decimal("50.00"),
                    bet_amount=Decimal("50.00"),
                    balance_before=Decimal("1500.00"),
                    balance_after=Decimal("4000.00"),
                    timestamp=session_start + timedelta(hours=1),
                )
                session.add(big_win)

    await session.flush()


async def seed_bonus_hunts(
    session: AsyncSession, streamers: list[Streamer], games: list[Game]
):
    """Seed bonus hunt data"""
    for streamer in streamers[:2]:
        for game_idx, game in enumerate(games[:2]):
            bonus_hunt = BonusHunt(
                id=str(uuid.uuid4()),
                streamer_id=streamer.id,
                game_id=game.id,
                status="completed",
                total_cost=Decimal("500.00"),
                entry_count=10,
                opened_count=10,
                total_payout=Decimal("600.00"),
                roi_percent=Decimal("20.00"),
                completed_at=datetime.utcnow() - timedelta(days=7 - game_idx),
            )
            session.add(bonus_hunt)
            await session.flush()

            # Add entries
            for entry_num in range(1, 11):
                entry = BonusHuntEntry(
                    id=str(uuid.uuid4()),
                    bonus_hunt_id=bonus_hunt.id,
                    entry_number=entry_num,
                    cost=Decimal("50.00"),
                    status="opened",
                    payout=Decimal("60.00"),
                    multiplier=Decimal("1.2"),
                    opened_at=datetime.utcnow() - timedelta(days=7 - game_idx),
                )
                session.add(entry)

    await session.flush()


async def main():
    """Main entry point"""
    print("\n" + "=" * 50)
    print("SLOTFEED Database Seeding")
    print("=" * 50)

    try:
        await seed_database()
        print("\n" + "=" * 50)
        print("Seeding completed successfully!")
        print("=" * 50 + "\n")
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback

        traceback.print_exc()
        exit(1)


if __name__ == "__main__":
    asyncio.run(main())

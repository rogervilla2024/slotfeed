"""
Seed data for Top 20 Slot Games and Providers

This module contains the initial seed data for the top slot games
and their providers. Data includes official RTP, volatility, and features.

Usage:
    python -m database.seeds.top_games
"""

import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any
from uuid import uuid4

# Game Providers
PROVIDERS: List[Dict[str, Any]] = [
    {
        "id": str(uuid4()),
        "name": "Pragmatic Play",
        "slug": "pragmatic-play",
        "logo_url": "https://pragmaticplay.com/logo.png",
        "website": "https://pragmaticplay.com",
        "headquarters": "Malta",
        "founded_year": 2015,
        "notes": "Leading provider, known for Sweet Bonanza, Gates of Olympus"
    },
    {
        "id": str(uuid4()),
        "name": "Hacksaw Gaming",
        "slug": "hacksaw-gaming",
        "logo_url": "https://hacksawgaming.com/logo.png",
        "website": "https://hacksawgaming.com",
        "headquarters": "Malta",
        "founded_year": 2018,
        "notes": "Known for Wanted Dead or a Wild, high volatility slots"
    },
    {
        "id": str(uuid4()),
        "name": "Play'n GO",
        "slug": "playn-go",
        "logo_url": "https://playngo.com/logo.png",
        "website": "https://playngo.com",
        "headquarters": "Sweden",
        "founded_year": 2005,
        "notes": "Classic provider, Book of Dead series"
    },
    {
        "id": str(uuid4()),
        "name": "Evolution Gaming",
        "slug": "evolution",
        "logo_url": "https://evolution.com/logo.png",
        "website": "https://evolution.com",
        "headquarters": "Malta",
        "founded_year": 2006,
        "notes": "Live casino leader, Crazy Time, Monopoly Live"
    },
    {
        "id": str(uuid4()),
        "name": "NetEnt",
        "slug": "netent",
        "logo_url": "https://netent.com/logo.png",
        "website": "https://netent.com",
        "headquarters": "Sweden",
        "founded_year": 1996,
        "notes": "Pioneer in online slots, Starburst, Gonzo's Quest"
    },
    {
        "id": str(uuid4()),
        "name": "Push Gaming",
        "slug": "push-gaming",
        "logo_url": "https://pushgaming.com/logo.png",
        "website": "https://pushgaming.com",
        "headquarters": "London",
        "founded_year": 2010,
        "notes": "Jammin' Jars, innovative mechanics"
    },
    {
        "id": str(uuid4()),
        "name": "Nolimit City",
        "slug": "nolimit-city",
        "logo_url": "https://nolimitcity.com/logo.png",
        "website": "https://nolimitcity.com",
        "headquarters": "Malta",
        "founded_year": 2014,
        "notes": "Ultra high volatility, Mental series"
    },
    {
        "id": str(uuid4()),
        "name": "Relax Gaming",
        "slug": "relax-gaming",
        "logo_url": "https://relax-gaming.com/logo.png",
        "website": "https://relax-gaming.com",
        "headquarters": "Malta",
        "founded_year": 2010,
        "notes": "Money Train series"
    },
    {
        "id": str(uuid4()),
        "name": "Big Time Gaming",
        "slug": "big-time-gaming",
        "logo_url": "https://bigtimegaming.com/logo.png",
        "website": "https://bigtimegaming.com",
        "headquarters": "Australia",
        "founded_year": 2011,
        "notes": "Megaways inventor, Bonanza"
    },
    {
        "id": str(uuid4()),
        "name": "Blueprint Gaming",
        "slug": "blueprint-gaming",
        "logo_url": "https://blueprintgaming.com/logo.png",
        "website": "https://blueprintgaming.com",
        "headquarters": "UK",
        "founded_year": 2001,
        "notes": "Eye of Horus Megaways"
    }
]

# Get provider ID by slug
def get_provider_id(slug: str) -> str:
    for p in PROVIDERS:
        if p["slug"] == slug:
            return p["id"]
    return ""


# Top 20 Slot Games (from CLAUDE.md + additional popular games)
TOP_GAMES: List[Dict[str, Any]] = [
    # Pragmatic Play (7 games)
    {
        "id": str(uuid4()),
        "name": "Sweet Bonanza",
        "slug": "sweet-bonanza",
        "provider_slug": "pragmatic-play",
        "rtp": 96.48,
        "volatility": "high",
        "max_multiplier": 21175,
        "features": ["Tumble", "Free Spins", "Multipliers", "Scatter Pays"],
        "release_date": "2019-06-27",
        "theme": "Candy",
        "paylines": "Scatter Pays",
        "notes": "#1 streamer slot, high multiplier potential"
    },
    {
        "id": str(uuid4()),
        "name": "Gates of Olympus",
        "slug": "gates-of-olympus",
        "provider_slug": "pragmatic-play",
        "rtp": 96.50,
        "volatility": "high",
        "max_multiplier": 5000,
        "features": ["Tumble", "Free Spins", "Multipliers", "Ante Bet"],
        "release_date": "2021-02-13",
        "theme": "Greek Mythology",
        "paylines": "Scatter Pays",
        "notes": "#2 streamer slot, Zeus theme"
    },
    {
        "id": str(uuid4()),
        "name": "Sugar Rush",
        "slug": "sugar-rush",
        "provider_slug": "pragmatic-play",
        "rtp": 96.50,
        "volatility": "high",
        "max_multiplier": 5000,
        "features": ["Tumble", "Free Spins", "Multipliers", "Grid"],
        "release_date": "2022-07-28",
        "theme": "Candy",
        "paylines": "Cluster Pays",
        "notes": "Cluster pays mechanic, sweet theme"
    },
    {
        "id": str(uuid4()),
        "name": "Big Bass Bonanza",
        "slug": "big-bass-bonanza",
        "provider_slug": "pragmatic-play",
        "rtp": 96.71,
        "volatility": "high",
        "max_multiplier": 2100,
        "features": ["Free Spins", "Money Collect", "Fisherman Wild"],
        "release_date": "2020-12-04",
        "theme": "Fishing",
        "paylines": 10,
        "notes": "Popular fishing series, many sequels"
    },
    {
        "id": str(uuid4()),
        "name": "Fruit Party",
        "slug": "fruit-party",
        "provider_slug": "pragmatic-play",
        "rtp": 96.47,
        "volatility": "high",
        "max_multiplier": 5000,
        "features": ["Tumble", "Free Spins", "Random Multipliers"],
        "release_date": "2020-07-30",
        "theme": "Fruit",
        "paylines": "Cluster Pays",
        "notes": "Cluster pays, similar to Sweet Bonanza"
    },
    {
        "id": str(uuid4()),
        "name": "The Dog House",
        "slug": "the-dog-house",
        "provider_slug": "pragmatic-play",
        "rtp": 96.51,
        "volatility": "high",
        "max_multiplier": 6750,
        "features": ["Sticky Wilds", "Free Spins", "Multipliers"],
        "release_date": "2019-05-23",
        "theme": "Animals",
        "paylines": 20,
        "notes": "Sticky wilds with multipliers"
    },
    {
        "id": str(uuid4()),
        "name": "Starlight Princess",
        "slug": "starlight-princess",
        "provider_slug": "pragmatic-play",
        "rtp": 96.50,
        "volatility": "high",
        "max_multiplier": 5000,
        "features": ["Tumble", "Free Spins", "Multipliers", "Ante Bet"],
        "release_date": "2022-01-20",
        "theme": "Fantasy",
        "paylines": "Scatter Pays",
        "notes": "Similar to Gates of Olympus, anime style"
    },

    # Hacksaw Gaming (3 games)
    {
        "id": str(uuid4()),
        "name": "Wanted Dead or a Wild",
        "slug": "wanted-dead-or-a-wild",
        "provider_slug": "hacksaw-gaming",
        "rtp": 96.38,
        "volatility": "very_high",
        "max_multiplier": 12500,
        "features": ["Duel Feature", "VS Spins", "Dead or Wild Spins"],
        "release_date": "2021-11-08",
        "theme": "Western",
        "paylines": "Variable",
        "notes": "Extremely high volatility, big win potential"
    },
    {
        "id": str(uuid4()),
        "name": "Chaos Crew",
        "slug": "chaos-crew",
        "provider_slug": "hacksaw-gaming",
        "rtp": 96.28,
        "volatility": "very_high",
        "max_multiplier": 10000,
        "features": ["Chaos Spins", "Cranky/Sketchy Features"],
        "release_date": "2021-05-20",
        "theme": "Urban",
        "paylines": "Cluster Pays",
        "notes": "Popular bonus buy slot"
    },
    {
        "id": str(uuid4()),
        "name": "Stick 'Em",
        "slug": "stick-em",
        "provider_slug": "hacksaw-gaming",
        "rtp": 96.25,
        "volatility": "very_high",
        "max_multiplier": 10000,
        "features": ["Sticky Respins", "Multipliers"],
        "release_date": "2022-03-24",
        "theme": "Abstract",
        "paylines": 5,
        "notes": "Simple mechanics, high volatility"
    },

    # Evolution (2 games)
    {
        "id": str(uuid4()),
        "name": "Crazy Time",
        "slug": "crazy-time",
        "provider_slug": "evolution",
        "rtp": 96.08,
        "volatility": "high",
        "max_multiplier": 25000,
        "features": ["Coin Flip", "Pachinko", "Cash Hunt", "Crazy Time Wheel"],
        "release_date": "2020-07-01",
        "theme": "Game Show",
        "paylines": "Live Wheel",
        "notes": "Live game show format"
    },
    {
        "id": str(uuid4()),
        "name": "Monopoly Live",
        "slug": "monopoly-live",
        "provider_slug": "evolution",
        "rtp": 96.23,
        "volatility": "medium",
        "max_multiplier": 10000,
        "features": ["Mr. Monopoly", "2 Rolls", "4 Rolls", "Chance"],
        "release_date": "2019-04-01",
        "theme": "Board Game",
        "paylines": "Live Wheel",
        "notes": "Licensed Monopoly theme"
    },

    # Play'n GO (2 games)
    {
        "id": str(uuid4()),
        "name": "Book of Dead",
        "slug": "book-of-dead",
        "provider_slug": "playn-go",
        "rtp": 96.21,
        "volatility": "high",
        "max_multiplier": 5000,
        "features": ["Expanding Symbols", "Free Spins", "Gamble"],
        "release_date": "2016-01-28",
        "theme": "Egyptian",
        "paylines": 10,
        "notes": "Classic slot, Rich Wilde series"
    },
    {
        "id": str(uuid4()),
        "name": "Reactoonz",
        "slug": "reactoonz",
        "provider_slug": "playn-go",
        "rtp": 96.51,
        "volatility": "high",
        "max_multiplier": 4570,
        "features": ["Cluster Pays", "Fluctometer", "Quantumeter", "Gargantoon"],
        "release_date": "2017-10-24",
        "theme": "Aliens",
        "paylines": "Cluster Pays",
        "notes": "Popular cluster pays slot"
    },

    # Nolimit City (2 games)
    {
        "id": str(uuid4()),
        "name": "Mental",
        "slug": "mental",
        "provider_slug": "nolimit-city",
        "rtp": 96.08,
        "volatility": "very_high",
        "max_multiplier": 66666,
        "features": ["Lobotomy Spins", "Mental Spins", "xWays", "xNudge"],
        "release_date": "2022-04-18",
        "theme": "Horror",
        "paylines": "Variable",
        "notes": "Ultra high volatility, controversial theme"
    },
    {
        "id": str(uuid4()),
        "name": "San Quentin",
        "slug": "san-quentin",
        "provider_slug": "nolimit-city",
        "rtp": 96.03,
        "volatility": "very_high",
        "max_multiplier": 150000,
        "features": ["Lockdown Spins", "Razor Split", "xNudge Wilds"],
        "release_date": "2021-02-01",
        "theme": "Prison",
        "paylines": "Variable",
        "notes": "Highest max win potential"
    },

    # Push Gaming (1 game)
    {
        "id": str(uuid4()),
        "name": "Jammin' Jars",
        "slug": "jammin-jars",
        "provider_slug": "push-gaming",
        "rtp": 96.83,
        "volatility": "high",
        "max_multiplier": 20000,
        "features": ["Cluster Pays", "Roaming Wilds", "Rainbow Feature"],
        "release_date": "2018-09-06",
        "theme": "Fruit",
        "paylines": "Cluster Pays",
        "notes": "Original cluster pays hit"
    },

    # Relax Gaming (1 game)
    {
        "id": str(uuid4()),
        "name": "Money Train 3",
        "slug": "money-train-3",
        "provider_slug": "relax-gaming",
        "rtp": 96.10,
        "volatility": "very_high",
        "max_multiplier": 100000,
        "features": ["Money Cart Bonus", "Persistent Symbols", "Bonus Buy"],
        "release_date": "2022-09-22",
        "theme": "Western",
        "paylines": 40,
        "notes": "Popular series, high max win"
    },

    # Big Time Gaming (1 game)
    {
        "id": str(uuid4()),
        "name": "Bonanza Megaways",
        "slug": "bonanza-megaways",
        "provider_slug": "big-time-gaming",
        "rtp": 96.00,
        "volatility": "high",
        "max_multiplier": 10000,
        "features": ["Megaways", "Reactions", "Free Spins", "Unlimited Multiplier"],
        "release_date": "2016-12-07",
        "theme": "Mining",
        "paylines": "Megaways (up to 117649)",
        "notes": "Original Megaways slot"
    },

    # NetEnt (1 game)
    {
        "id": str(uuid4()),
        "name": "Starburst",
        "slug": "starburst",
        "provider_slug": "netent",
        "rtp": 96.09,
        "volatility": "low",
        "max_multiplier": 500,
        "features": ["Expanding Wilds", "Re-spins", "Both Ways"],
        "release_date": "2012-01-01",
        "theme": "Space/Gems",
        "paylines": 10,
        "notes": "Classic slot, low volatility"
    },

    # ============= EXPANSION GAMES (15 more) =============

    # Pragmatic Play (4 more games)
    {
        "id": str(uuid4()),
        "name": "Gates of Olympus 1000",
        "slug": "gates-of-olympus-1000",
        "provider_slug": "pragmatic-play",
        "rtp": 96.50,
        "volatility": "very_high",
        "max_multiplier": 15000,
        "features": ["Tumble", "Free Spins", "Multipliers", "Ante Bet", "1000x Max Mult"],
        "release_date": "2023-12-07",
        "theme": "Greek Mythology",
        "paylines": "Scatter Pays",
        "notes": "Enhanced version with 1000x multipliers in bonus"
    },
    {
        "id": str(uuid4()),
        "name": "Sweet Bonanza 1000",
        "slug": "sweet-bonanza-1000",
        "provider_slug": "pragmatic-play",
        "rtp": 96.53,
        "volatility": "very_high",
        "max_multiplier": 25000,
        "features": ["Tumble", "Free Spins", "Multipliers", "1000x Max Mult"],
        "release_date": "2024-02-22",
        "theme": "Candy",
        "paylines": "Scatter Pays",
        "notes": "Enhanced version with higher volatility"
    },
    {
        "id": str(uuid4()),
        "name": "Zeus vs Hades: Gods of War",
        "slug": "zeus-vs-hades",
        "provider_slug": "pragmatic-play",
        "rtp": 96.07,
        "volatility": "high",
        "max_multiplier": 15000,
        "features": ["Zeus Spins", "Hades Spins", "Multipliers", "Free Spins"],
        "release_date": "2023-02-02",
        "theme": "Greek Mythology",
        "paylines": "Scatter Pays",
        "notes": "Dual feature mechanics, popular streamer slot"
    },
    {
        "id": str(uuid4()),
        "name": "Big Bass Splash",
        "slug": "big-bass-splash",
        "provider_slug": "pragmatic-play",
        "rtp": 96.71,
        "volatility": "high",
        "max_multiplier": 5000,
        "features": ["Free Spins", "Money Collect", "Extra Fishermen", "Lives System"],
        "release_date": "2022-08-18",
        "theme": "Fishing",
        "paylines": 10,
        "notes": "Popular sequel in the Big Bass series"
    },

    # Hacksaw Gaming (3 more games)
    {
        "id": str(uuid4()),
        "name": "Dork Unit",
        "slug": "dork-unit",
        "provider_slug": "hacksaw-gaming",
        "rtp": 96.27,
        "volatility": "very_high",
        "max_multiplier": 55555,
        "features": ["Sticky Multipliers", "Free Spins", "Full Screen Wins"],
        "release_date": "2022-07-21",
        "theme": "Cartoon/Characters",
        "paylines": "Cluster Pays",
        "notes": "Extremely high max win potential"
    },
    {
        "id": str(uuid4()),
        "name": "RIP City",
        "slug": "rip-city",
        "provider_slug": "hacksaw-gaming",
        "rtp": 96.30,
        "volatility": "very_high",
        "max_multiplier": 10000,
        "features": ["Grim Spins", "RIP Spins", "Multiplier Wilds"],
        "release_date": "2023-09-07",
        "theme": "Horror/Urban",
        "paylines": 10,
        "notes": "Dark theme with dual bonus features"
    },
    {
        "id": str(uuid4()),
        "name": "Hand of Anubis",
        "slug": "hand-of-anubis",
        "provider_slug": "hacksaw-gaming",
        "rtp": 96.27,
        "volatility": "very_high",
        "max_multiplier": 15000,
        "features": ["Sticky Multipliers", "Free Spins", "Expanding Wilds"],
        "release_date": "2023-05-25",
        "theme": "Egyptian",
        "paylines": "Cluster Pays",
        "notes": "Egyptian themed high volatility slot"
    },

    # Nolimit City (3 more games)
    {
        "id": str(uuid4()),
        "name": "Tombstone RIP",
        "slug": "tombstone-rip",
        "provider_slug": "nolimit-city",
        "rtp": 96.08,
        "volatility": "very_high",
        "max_multiplier": 300000,
        "features": ["Boothill Spins", "Hang Em High Spins", "xNudge Wilds"],
        "release_date": "2021-09-20",
        "theme": "Western",
        "paylines": "Variable",
        "notes": "Highest max win in the industry"
    },
    {
        "id": str(uuid4()),
        "name": "Fire in the Hole",
        "slug": "fire-in-the-hole",
        "provider_slug": "nolimit-city",
        "rtp": 96.06,
        "volatility": "very_high",
        "max_multiplier": 60000,
        "features": ["Lucky Wagon Spins", "xBomb Wilds", "Drill Feature"],
        "release_date": "2020-10-12",
        "theme": "Mining",
        "paylines": "Variable",
        "notes": "Mining theme with explosive features"
    },
    {
        "id": str(uuid4()),
        "name": "Misery Mining",
        "slug": "misery-mining",
        "provider_slug": "nolimit-city",
        "rtp": 96.07,
        "volatility": "very_high",
        "max_multiplier": 52550,
        "features": ["Misery Spins", "xNudge Wilds", "Infectious"],
        "release_date": "2023-10-16",
        "theme": "Mining/Horror",
        "paylines": "Variable",
        "notes": "Dark mining theme with high potential"
    },

    # Relax Gaming (2 more games)
    {
        "id": str(uuid4()),
        "name": "Money Train 4",
        "slug": "money-train-4",
        "provider_slug": "relax-gaming",
        "rtp": 96.00,
        "volatility": "very_high",
        "max_multiplier": 150000,
        "features": ["Money Cart Bonus", "Persistent Symbols", "Tommy Guns Feature"],
        "release_date": "2024-04-02",
        "theme": "Western",
        "paylines": 40,
        "notes": "Latest in the Money Train series"
    },
    {
        "id": str(uuid4()),
        "name": "Dream Drop Jackpot",
        "slug": "dream-drop-jackpot",
        "provider_slug": "relax-gaming",
        "rtp": 94.00,
        "volatility": "high",
        "max_multiplier": 25000000,
        "features": ["Progressive Jackpot", "Dream Drop Bonus", "5 Jackpot Tiers"],
        "release_date": "2022-03-24",
        "theme": "Fantasy",
        "paylines": "Various",
        "notes": "Multi-million jackpot system"
    },

    # Big Time Gaming (2 more games)
    {
        "id": str(uuid4()),
        "name": "Danger! High Voltage Megaways",
        "slug": "danger-high-voltage-megaways",
        "provider_slug": "big-time-gaming",
        "rtp": 96.22,
        "volatility": "high",
        "max_multiplier": 22960,
        "features": ["Megaways", "Gates of Hell", "High Voltage Spins"],
        "release_date": "2020-09-24",
        "theme": "Disco/Music",
        "paylines": "Megaways (up to 15746)",
        "notes": "Electric slide themed with dual bonuses"
    },
    {
        "id": str(uuid4()),
        "name": "Extra Chilli Megaways",
        "slug": "extra-chilli-megaways",
        "provider_slug": "big-time-gaming",
        "rtp": 96.15,
        "volatility": "very_high",
        "max_multiplier": 20000,
        "features": ["Megaways", "Extra Spins", "Gamble Feature"],
        "release_date": "2018-08-15",
        "theme": "Mexican Food",
        "paylines": "Megaways (up to 117649)",
        "notes": "Megaways classic with gamble feature"
    },

    # Push Gaming (1 more game)
    {
        "id": str(uuid4()),
        "name": "Jammin' Jars 2",
        "slug": "jammin-jars-2",
        "provider_slug": "push-gaming",
        "rtp": 96.40,
        "volatility": "very_high",
        "max_multiplier": 50000,
        "features": ["Cluster Pays", "Giga Jar", "Level Up Multipliers"],
        "release_date": "2021-06-03",
        "theme": "Fruit/Disco",
        "paylines": "Cluster Pays",
        "notes": "Sequel with Giga Jar feature"
    }
]


def get_providers() -> List[Dict[str, Any]]:
    """Return list of provider seed data."""
    return PROVIDERS


def get_top_games() -> List[Dict[str, Any]]:
    """Return list of top games seed data with provider IDs resolved."""
    games = []
    for game in TOP_GAMES:
        game_copy = game.copy()
        game_copy["provider_id"] = get_provider_id(game["provider_slug"])
        games.append(game_copy)
    return games


def get_game_by_slug(slug: str) -> Dict[str, Any] | None:
    """Find a game by slug."""
    for game in TOP_GAMES:
        if game["slug"] == slug:
            game_copy = game.copy()
            game_copy["provider_id"] = get_provider_id(game["provider_slug"])
            return game_copy
    return None


def get_games_by_provider(provider_slug: str) -> List[Dict[str, Any]]:
    """Get all games for a provider."""
    return [g for g in get_top_games() if g.get("provider_slug") == provider_slug]


async def seed_providers(db_session) -> int:
    """Seed providers into the database."""
    from backend.app.models import Provider

    created_count = 0
    now = datetime.now(timezone.utc)

    for provider_data in PROVIDERS:
        existing = await db_session.execute(
            Provider.__table__.select().where(
                Provider.slug == provider_data["slug"]
            )
        )
        if existing.scalar():
            continue

        provider = Provider(
            id=provider_data["id"],
            name=provider_data["name"],
            slug=provider_data["slug"],
            logo_url=provider_data.get("logo_url"),
            game_count=len(get_games_by_provider(provider_data["slug"])),
            created_at=now,
            updated_at=now
        )
        db_session.add(provider)
        created_count += 1

    await db_session.commit()
    return created_count


async def seed_games(db_session) -> int:
    """Seed games into the database."""
    from backend.app.models import Game

    created_count = 0
    now = datetime.now(timezone.utc)

    for game_data in get_top_games():
        existing = await db_session.execute(
            Game.__table__.select().where(Game.slug == game_data["slug"])
        )
        if existing.scalar():
            continue

        game = Game(
            id=game_data["id"],
            name=game_data["name"],
            slug=game_data["slug"],
            provider_id=game_data["provider_id"],
            rtp=game_data["rtp"],
            volatility=game_data["volatility"],
            max_multiplier=game_data["max_multiplier"],
            thumbnail_url=None,
            ocr_template_id=game_data["slug"],  # Use slug as template ID
            is_active=True,
            created_at=now,
            updated_at=now
        )
        db_session.add(game)
        created_count += 1

    await db_session.commit()
    return created_count


if __name__ == "__main__":
    print("=" * 70)
    print("SLOTFEED - Top 35 Slot Games Seed Data")
    print("=" * 70)
    print()

    # Print providers
    print("PROVIDERS:")
    print("-" * 70)
    for i, provider in enumerate(PROVIDERS, 1):
        game_count = len(get_games_by_provider(provider["slug"]))
        print(f"{i:2}. {provider['name']:<25} ({game_count} games)")
    print()

    # Print games by provider
    print("GAMES:")
    print("-" * 70)
    for i, game in enumerate(TOP_GAMES, 1):
        vol_indicator = {
            "low": "L",
            "medium": "M",
            "high": "H",
            "very_high": "VH"
        }.get(game["volatility"], "?")

        print(f"{i:2}. {game['name']:<30} [{vol_indicator:>2}] "
              f"RTP: {game['rtp']:>5.2f}% | Max: {game['max_multiplier']:>6,}x")

    print()
    print("-" * 70)
    print(f"Total Providers: {len(PROVIDERS)}")
    print(f"Total Games: {len(TOP_GAMES)}")

    # Stats
    volatility_counts = {}
    for g in TOP_GAMES:
        v = g["volatility"]
        volatility_counts[v] = volatility_counts.get(v, 0) + 1
    print(f"Volatility: {volatility_counts}")

    avg_rtp = sum(g["rtp"] for g in TOP_GAMES) / len(TOP_GAMES)
    print(f"Average RTP: {avg_rtp:.2f}%")
    print("=" * 70)

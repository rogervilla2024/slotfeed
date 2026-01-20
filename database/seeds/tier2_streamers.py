"""
Seed data for Tier 2 Streamers (35 Additional Streamers)

This module contains seed data for the next 35 slot streamers to track,
bringing total coverage to 50 streamers. Includes regional expansion
to cover more European, Asian, and Latin American markets.

Usage:
    python -m database.seeds.tier2_streamers
"""

from datetime import datetime, timezone
from typing import List, Dict, Any
from uuid import uuid4


# Tier 2 Streamers - Regional Expansion
TIER2_STREAMERS: List[Dict[str, Any]] = [
    # === EUROPEAN STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "spintwix",
        "display_name": "SpinTwix",
        "platform": "kick",
        "platform_id": "6234",
        "avatar_url": None,
        "bio": "German slot streamer. Known for high-stakes bonus hunts.",
        "follower_count": 85000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": "18:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/spintwix"},
        "region": "EU",
        "language": "German",
        "notes": "German market"
    },
    {
        "id": str(uuid4()),
        "username": "thebigpayback",
        "display_name": "TheBigPayback",
        "platform": "kick",
        "platform_id": "7123",
        "avatar_url": None,
        "bio": "UK slots veteran. Focus on classic slots and jackpots.",
        "follower_count": 95000,
        "stream_schedule": {
            "timezone": "GMT",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "17:00",
            "duration_hours": 7
        },
        "social_links": {"kick": "https://kick.com/thebigpayback"},
        "region": "EU",
        "language": "English",
        "notes": "UK market, jackpot focus"
    },
    {
        "id": str(uuid4()),
        "username": "chipmonkz",
        "display_name": "Chipmonkz",
        "platform": "kick",
        "platform_id": "5890",
        "avatar_url": None,
        "bio": "British streamer. Entertaining commentary and reactions.",
        "follower_count": 72000,
        "stream_schedule": {
            "timezone": "GMT",
            "days": ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "19:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/chipmonkz"},
        "region": "EU",
        "language": "English",
        "notes": "UK market"
    },
    {
        "id": str(uuid4()),
        "username": "slotspinner",
        "display_name": "SlotSpinner",
        "platform": "kick",
        "platform_id": "4567",
        "avatar_url": None,
        "bio": "European slot enthusiast. Variety of games and providers.",
        "follower_count": 68000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Wednesday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/slotspinner"},
        "region": "EU",
        "language": "English",
        "notes": "Pan-European"
    },
    {
        "id": str(uuid4()),
        "username": "jamjarboy",
        "display_name": "JamJarBoy",
        "platform": "kick",
        "platform_id": "6789",
        "avatar_url": None,
        "bio": "Scottish streamer. High energy and entertaining content.",
        "follower_count": 55000,
        "stream_schedule": {
            "timezone": "GMT",
            "days": ["Tuesday", "Thursday", "Friday", "Saturday"],
            "start_time": "18:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/jamjarboy"},
        "region": "EU",
        "language": "English",
        "notes": "Scottish, high energy"
    },
    {
        "id": str(uuid4()),
        "username": "daskelelansen",
        "display_name": "Daskelelansen",
        "platform": "kick",
        "platform_id": "5432",
        "avatar_url": None,
        "bio": "Swedish slot streamer. Bonus hunt specialist.",
        "follower_count": 78000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": "17:00",
            "duration_hours": 8
        },
        "social_links": {"kick": "https://kick.com/daskelelansen"},
        "region": "EU",
        "language": "Swedish",
        "notes": "Swedish market"
    },
    {
        "id": str(uuid4()),
        "username": "hideous",
        "display_name": "Hideous",
        "platform": "kick",
        "platform_id": "3456",
        "avatar_url": None,
        "bio": "Nordic slot streamer. Known for big multiplier chases.",
        "follower_count": 88000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 7
        },
        "social_links": {"kick": "https://kick.com/hideous"},
        "region": "EU",
        "language": "English",
        "notes": "Nordic region"
    },
    {
        "id": str(uuid4()),
        "username": "prodigy",
        "display_name": "Prodigy",
        "platform": "kick",
        "platform_id": "7890",
        "avatar_url": None,
        "bio": "Danish streamer. Professional slot content creator.",
        "follower_count": 62000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"],
            "start_time": "18:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/prodigy"},
        "region": "EU",
        "language": "Danish",
        "notes": "Danish market"
    },
    {
        "id": str(uuid4()),
        "username": "slotplayer",
        "display_name": "SlotPlayer",
        "platform": "kick",
        "platform_id": "4321",
        "avatar_url": None,
        "bio": "Dutch streamer. Pragmatic Play specialist.",
        "follower_count": 45000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Tuesday", "Thursday", "Saturday", "Sunday"],
            "start_time": "20:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/slotplayer"},
        "region": "EU",
        "language": "Dutch",
        "notes": "Dutch market"
    },
    {
        "id": str(uuid4()),
        "username": "casinokalle",
        "display_name": "CasinoKalle",
        "platform": "kick",
        "platform_id": "8765",
        "avatar_url": None,
        "bio": "Norwegian slot enthusiast. Regular bonus hunts.",
        "follower_count": 52000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/casinokalle"},
        "region": "EU",
        "language": "Norwegian",
        "notes": "Norwegian market"
    },

    # === RUSSIAN/CIS STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "yassuo_slots",
        "display_name": "YassuoSlots",
        "platform": "kick",
        "platform_id": "2345",
        "avatar_url": None,
        "bio": "Russian slot streamer. High stakes and exciting content.",
        "follower_count": 125000,
        "stream_schedule": {
            "timezone": "MSK",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "17:00",
            "duration_hours": 8
        },
        "social_links": {"kick": "https://kick.com/yassuo_slots"},
        "region": "CIS",
        "language": "Russian",
        "notes": "Russian market, high stakes"
    },
    {
        "id": str(uuid4()),
        "username": "vituss",
        "display_name": "Vituss",
        "platform": "kick",
        "platform_id": "3678",
        "avatar_url": None,
        "bio": "Ukrainian streamer. Growing audience in CIS region.",
        "follower_count": 95000,
        "stream_schedule": {
            "timezone": "EET",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "18:00",
            "duration_hours": 7
        },
        "social_links": {"kick": "https://kick.com/vituss"},
        "region": "CIS",
        "language": "Ukrainian",
        "notes": "Ukrainian market"
    },
    {
        "id": str(uuid4()),
        "username": "gambino_ru",
        "display_name": "GambinoRU",
        "platform": "kick",
        "platform_id": "4890",
        "avatar_url": None,
        "bio": "Russian slots expert. Known for game analysis.",
        "follower_count": 88000,
        "stream_schedule": {
            "timezone": "MSK",
            "days": ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/gambino_ru"},
        "region": "CIS",
        "language": "Russian",
        "notes": "Russian market, analytical"
    },

    # === LATIN AMERICAN STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "elslotero",
        "display_name": "ElSlotero",
        "platform": "kick",
        "platform_id": "5678",
        "avatar_url": None,
        "bio": "Mexican slot streamer. Growing LATAM audience.",
        "follower_count": 145000,
        "stream_schedule": {
            "timezone": "CST",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/elslotero"},
        "region": "LATAM",
        "language": "Spanish",
        "notes": "Mexican market"
    },
    {
        "id": str(uuid4()),
        "username": "bfrags",
        "display_name": "BFrags",
        "platform": "kick",
        "platform_id": "6543",
        "avatar_url": None,
        "bio": "Brazilian slot and casino streamer. Portuguese content.",
        "follower_count": 180000,
        "stream_schedule": {
            "timezone": "BRT",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "19:00",
            "duration_hours": 7
        },
        "social_links": {"kick": "https://kick.com/bfrags"},
        "region": "LATAM",
        "language": "Portuguese",
        "notes": "Brazilian market, large audience"
    },
    {
        "id": str(uuid4()),
        "username": "casinoarg",
        "display_name": "CasinoArg",
        "platform": "kick",
        "platform_id": "7654",
        "avatar_url": None,
        "bio": "Argentine casino streamer. Spanish speaking audience.",
        "follower_count": 72000,
        "stream_schedule": {
            "timezone": "ART",
            "days": ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "21:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/casinoarg"},
        "region": "LATAM",
        "language": "Spanish",
        "notes": "Argentine market"
    },
    {
        "id": str(uuid4()),
        "username": "slotschile",
        "display_name": "SlotsChile",
        "platform": "kick",
        "platform_id": "8901",
        "avatar_url": None,
        "bio": "Chilean slot enthusiast. Growing presence in South America.",
        "follower_count": 48000,
        "stream_schedule": {
            "timezone": "CLT",
            "days": ["Tuesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/slotschile"},
        "region": "LATAM",
        "language": "Spanish",
        "notes": "Chilean market"
    },
    {
        "id": str(uuid4()),
        "username": "lafortunabr",
        "display_name": "LaFortunaBR",
        "platform": "kick",
        "platform_id": "9012",
        "avatar_url": None,
        "bio": "Brazilian streamer. Known for big wins and celebrations.",
        "follower_count": 110000,
        "stream_schedule": {
            "timezone": "BRT",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": "18:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/lafortunabr"},
        "region": "LATAM",
        "language": "Portuguese",
        "notes": "Brazilian market"
    },

    # === NORTH AMERICAN STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "spinmaster",
        "display_name": "SpinMaster",
        "platform": "kick",
        "platform_id": "1234",
        "avatar_url": None,
        "bio": "US-based slot streamer. Late night content for NA audience.",
        "follower_count": 98000,
        "stream_schedule": {
            "timezone": "EST",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "22:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/spinmaster"},
        "region": "NA",
        "language": "English",
        "notes": "US market, late night"
    },
    {
        "id": str(uuid4()),
        "username": "slotgrinder",
        "display_name": "SlotGrinder",
        "platform": "kick",
        "platform_id": "2109",
        "avatar_url": None,
        "bio": "Canadian slot enthusiast. Marathon streaming sessions.",
        "follower_count": 76000,
        "stream_schedule": {
            "timezone": "EST",
            "days": ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"],
            "start_time": "19:00",
            "duration_hours": 8
        },
        "social_links": {"kick": "https://kick.com/slotgrinder"},
        "region": "NA",
        "language": "English",
        "notes": "Canadian market"
    },
    {
        "id": str(uuid4()),
        "username": "vegasvibes",
        "display_name": "VegasVibes",
        "platform": "kick",
        "platform_id": "3210",
        "avatar_url": None,
        "bio": "Las Vegas based streamer. Land-based and online slots.",
        "follower_count": 85000,
        "stream_schedule": {
            "timezone": "PST",
            "days": ["Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "20:00",
            "duration_hours": 7
        },
        "social_links": {"kick": "https://kick.com/vegasvibes"},
        "region": "NA",
        "language": "English",
        "notes": "Vegas based"
    },

    # === ASIAN STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "slotking_jp",
        "display_name": "SlotKingJP",
        "platform": "kick",
        "platform_id": "4109",
        "avatar_url": None,
        "bio": "Japanese slot streamer. Pachinko and online slots.",
        "follower_count": 65000,
        "stream_schedule": {
            "timezone": "JST",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/slotking_jp"},
        "region": "APAC",
        "language": "Japanese",
        "notes": "Japanese market"
    },
    {
        "id": str(uuid4()),
        "username": "luckydragon888",
        "display_name": "LuckyDragon888",
        "platform": "kick",
        "platform_id": "5210",
        "avatar_url": None,
        "bio": "Asian market streamer. English and Mandarin content.",
        "follower_count": 92000,
        "stream_schedule": {
            "timezone": "HKT",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": "19:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/luckydragon888"},
        "region": "APAC",
        "language": "Mandarin",
        "notes": "Asian market, bilingual"
    },
    {
        "id": str(uuid4()),
        "username": "slotace_kr",
        "display_name": "SlotAceKR",
        "platform": "kick",
        "platform_id": "6321",
        "avatar_url": None,
        "bio": "Korean slot enthusiast. Growing Korean gambling community.",
        "follower_count": 55000,
        "stream_schedule": {
            "timezone": "KST",
            "days": ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "21:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/slotace_kr"},
        "region": "APAC",
        "language": "Korean",
        "notes": "Korean market"
    },
    {
        "id": str(uuid4()),
        "username": "casinothai",
        "display_name": "CasinoThai",
        "platform": "kick",
        "platform_id": "7432",
        "avatar_url": None,
        "bio": "Thai casino streamer. Southeast Asian audience.",
        "follower_count": 48000,
        "stream_schedule": {
            "timezone": "ICT",
            "days": ["Tuesday", "Thursday", "Friday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/casinothai"},
        "region": "APAC",
        "language": "Thai",
        "notes": "Thai market"
    },

    # === ADDITIONAL EUROPEAN STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "casinoitalia",
        "display_name": "CasinoItalia",
        "platform": "kick",
        "platform_id": "8543",
        "avatar_url": None,
        "bio": "Italian slot streamer. Mediterranean gambling content.",
        "follower_count": 58000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/casinoitalia"},
        "region": "EU",
        "language": "Italian",
        "notes": "Italian market"
    },
    {
        "id": str(uuid4()),
        "username": "slotsgr",
        "display_name": "SlotsGR",
        "platform": "kick",
        "platform_id": "9654",
        "avatar_url": None,
        "bio": "Greek slot enthusiast. Pragmatic Play favorites.",
        "follower_count": 42000,
        "stream_schedule": {
            "timezone": "EET",
            "days": ["Tuesday", "Thursday", "Friday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/slotsgr"},
        "region": "EU",
        "language": "Greek",
        "notes": "Greek market"
    },
    {
        "id": str(uuid4()),
        "username": "casino_pl",
        "display_name": "CasinoPL",
        "platform": "kick",
        "platform_id": "1098",
        "avatar_url": None,
        "bio": "Polish casino streamer. Growing Eastern European audience.",
        "follower_count": 67000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": "18:00",
            "duration_hours": 6
        },
        "social_links": {"kick": "https://kick.com/casino_pl"},
        "region": "EU",
        "language": "Polish",
        "notes": "Polish market"
    },
    {
        "id": str(uuid4()),
        "username": "slotzes",
        "display_name": "SlotsES",
        "platform": "kick",
        "platform_id": "2187",
        "avatar_url": None,
        "bio": "Spanish slot streamer. Iberian market coverage.",
        "follower_count": 73000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "21:00",
            "duration_hours": 5
        },
        "social_links": {"kick": "https://kick.com/slotses"},
        "region": "EU",
        "language": "Spanish",
        "notes": "Spanish market"
    },
    {
        "id": str(uuid4()),
        "username": "casinoturk",
        "display_name": "CasinoTurk",
        "platform": "kick",
        "platform_id": "3298",
        "avatar_url": None,
        "bio": "Turkish casino streamer. High engagement community.",
        "follower_count": 115000,
        "stream_schedule": {
            "timezone": "TRT",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 7
        },
        "social_links": {"kick": "https://kick.com/casinoturk"},
        "region": "EU",
        "language": "Turkish",
        "notes": "Turkish market, high engagement"
    },

    # === YOUTUBE STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "bigwinboard",
        "display_name": "BigWinBoard",
        "platform": "youtube",
        "platform_id": "UCbigwinboard",
        "avatar_url": None,
        "bio": "YouTube slot compilation channel. Big win highlights.",
        "follower_count": 320000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Wednesday", "Friday"],
            "start_time": "18:00",
            "duration_hours": 3
        },
        "social_links": {"youtube": "https://youtube.com/bigwinboard"},
        "region": "EU",
        "language": "English",
        "notes": "YouTube, compilations"
    },
    {
        "id": str(uuid4()),
        "username": "casinotest24",
        "display_name": "CasinoTest24",
        "platform": "youtube",
        "platform_id": "UCcasinotest24",
        "avatar_url": None,
        "bio": "German YouTube channel. Slot reviews and tests.",
        "follower_count": 180000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Tuesday", "Thursday", "Saturday"],
            "start_time": "17:00",
            "duration_hours": 4
        },
        "social_links": {"youtube": "https://youtube.com/casinotest24"},
        "region": "EU",
        "language": "German",
        "notes": "German YouTube, reviews"
    },

    # === TWITCH STREAMERS ===
    {
        "id": str(uuid4()),
        "username": "slotlady",
        "display_name": "SlotLady",
        "platform": "twitch",
        "platform_id": "slotlady",
        "avatar_url": None,
        "bio": "Popular female slot streamer. Land-based casino content.",
        "follower_count": 250000,
        "stream_schedule": {
            "timezone": "PST",
            "days": ["Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "18:00",
            "duration_hours": 6
        },
        "social_links": {"twitch": "https://twitch.tv/slotlady"},
        "region": "NA",
        "language": "English",
        "notes": "Twitch, land-based casinos"
    },
    {
        "id": str(uuid4()),
        "username": "classy_slots",
        "display_name": "ClassySlots",
        "platform": "twitch",
        "platform_id": "classy_slots",
        "avatar_url": None,
        "bio": "Twitch slot streamer. Variety of games and providers.",
        "follower_count": 125000,
        "stream_schedule": {
            "timezone": "EST",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 5
        },
        "social_links": {"twitch": "https://twitch.tv/classy_slots"},
        "region": "NA",
        "language": "English",
        "notes": "Twitch platform"
    },
]


def get_tier2_streamers() -> List[Dict[str, Any]]:
    """Return list of Tier 2 streamer seed data."""
    return TIER2_STREAMERS


def get_streamer_by_username(username: str) -> Dict[str, Any] | None:
    """Find a streamer by username."""
    for streamer in TIER2_STREAMERS:
        if streamer["username"].lower() == username.lower():
            return streamer
    return None


def get_streamers_by_region(region: str) -> List[Dict[str, Any]]:
    """Get all streamers in a specific region."""
    return [s for s in TIER2_STREAMERS if s.get("region") == region]


def get_streamers_by_language(language: str) -> List[Dict[str, Any]]:
    """Get all streamers by primary language."""
    return [s for s in TIER2_STREAMERS if s.get("language", "").lower() == language.lower()]


async def seed_tier2_streamers(db_session) -> int:
    """
    Seed the database with Tier 2 streamers.

    Args:
        db_session: AsyncSession from SQLAlchemy

    Returns:
        Number of streamers created
    """
    from datetime import datetime, timezone
    from backend.app.models import Streamer

    created_count = 0
    now = datetime.now(timezone.utc)

    for streamer_data in TIER2_STREAMERS:
        # Check if streamer already exists
        existing = await db_session.execute(
            Streamer.__table__.select().where(
                Streamer.username == streamer_data["username"]
            )
        )
        if existing.scalar():
            continue

        streamer = Streamer(
            id=streamer_data["id"],
            username=streamer_data["username"],
            display_name=streamer_data["display_name"],
            platform=streamer_data["platform"],
            platform_id=streamer_data["platform_id"],
            avatar_url=streamer_data.get("avatar_url"),
            bio=streamer_data.get("bio"),
            follower_count=streamer_data.get("follower_count", 0),
            is_live=False,
            # Lifetime stats start at 0
            total_sessions=0,
            total_hours_streamed=0.0,
            total_wagered=0.0,
            total_won=0.0,
            biggest_win=0.0,
            biggest_multiplier=0.0,
            average_rtp=0.0,
            created_at=now,
            updated_at=now
        )
        db_session.add(streamer)
        created_count += 1

    await db_session.commit()
    return created_count


if __name__ == "__main__":
    # Print streamer summary for verification
    print("=" * 70)
    print("SLOTFEED - Tier 2 Streamers Seed Data (Regional Expansion)")
    print("=" * 70)
    print()

    # Group by region
    regions = {}
    for streamer in TIER2_STREAMERS:
        region = streamer.get("region", "Unknown")
        if region not in regions:
            regions[region] = []
        regions[region].append(streamer)

    total_followers = 0
    streamer_count = 0

    for region, streamers in sorted(regions.items()):
        print(f"\n=== {region} ({len(streamers)} streamers) ===")
        for streamer in streamers:
            total_followers += streamer["follower_count"]
            streamer_count += 1
            platform_badge = {
                "kick": "K",
                "twitch": "T",
                "youtube": "Y"
            }.get(streamer["platform"], "?")

            print(f"  [{platform_badge}] {streamer['display_name']:<20} "
                  f"({streamer['follower_count']:>8,}) - {streamer.get('language', 'EN')}")

    print()
    print("-" * 70)
    print(f"Total Tier 2 Streamers: {len(TIER2_STREAMERS)}")
    print(f"Total Followers: {total_followers:,}")
    print(f"Regions: {', '.join(sorted(regions.keys()))}")
    print(f"Platforms: Kick ({sum(1 for s in TIER2_STREAMERS if s['platform']=='kick')}), "
          f"YouTube ({sum(1 for s in TIER2_STREAMERS if s['platform']=='youtube')}), "
          f"Twitch ({sum(1 for s in TIER2_STREAMERS if s['platform']=='twitch')})")
    print("=" * 70)

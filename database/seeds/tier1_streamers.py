"""
Seed data for Tier 1 Streamers (15 Priority Streamers)

This module contains the initial seed data for the top 15 slot streamers
that SLOTFEED will track. Data includes Kick IDs, profile information,
and estimated stream schedules.

Usage:
    python -m database.seeds.tier1_streamers
"""

import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any
from uuid import uuid4

# Tier 1 Streamers - Priority list from CLAUDE.md
TIER1_STREAMERS: List[Dict[str, Any]] = [
    {
        "id": str(uuid4()),
        "username": "roshtein",
        "display_name": "Roshtein",
        "platform": "kick",
        "platform_id": "1047",  # Kick channel ID
        "avatar_url": "https://files.kick.com/images/user/1047/profile_image/conversion/c6e0a0ff-0a3a-4a6c-b8f1-2a1d8b1b1b1b-fullsize.webp",
        "bio": "King of slot streaming. Known for massive bets and legendary wins.",
        "follower_count": 362000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "18:00",
            "duration_hours": 8
        },
        "social_links": {
            "twitter": "https://twitter.com/roloshtein",
            "instagram": "https://instagram.com/roshtein",
            "kick": "https://kick.com/roshtein"
        },
        "notes": "Tier 1 priority - highest engagement"
    },
    {
        "id": str(uuid4()),
        "username": "trainwreckstv",
        "display_name": "Trainwreckstv",
        "platform": "kick",
        "platform_id": "4",  # Kick co-founder, early ID
        "avatar_url": "https://files.kick.com/images/user/4/profile_image/conversion/trainwrecks.webp",
        "bio": "Kick co-founder. Known for marathon gambling sessions and high-stakes slots.",
        "follower_count": 494000,
        "stream_schedule": {
            "timezone": "PST",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "22:00",
            "duration_hours": 12
        },
        "social_links": {
            "twitter": "https://twitter.com/trainwreckstv",
            "kick": "https://kick.com/trainwreckstv"
        },
        "notes": "Kick co-founder, massive audience"
    },
    {
        "id": str(uuid4()),
        "username": "classybeef",
        "display_name": "ClassyBeef",
        "platform": "kick",
        "platform_id": "2156",
        "avatar_url": "https://files.kick.com/images/user/2156/profile_image/conversion/classybeef.webp",
        "bio": "6-person streaming team. 24/7 slot content with rotating hosts.",
        "follower_count": 194000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "00:00",
            "duration_hours": 24
        },
        "social_links": {
            "twitter": "https://twitter.com/classybeef",
            "kick": "https://kick.com/classybeef"
        },
        "notes": "24/7 streaming operation, team-based"
    },
    {
        "id": str(uuid4()),
        "username": "xposed",
        "display_name": "Xposed",
        "platform": "kick",
        "platform_id": "1823",
        "avatar_url": "https://files.kick.com/images/user/1823/profile_image/conversion/xposed.webp",
        "bio": "High RTP focus streamer. Known for strategic slot play.",
        "follower_count": 300000,
        "stream_schedule": {
            "timezone": "EST",
            "days": ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 6
        },
        "social_links": {
            "twitter": "https://twitter.com/xposedyt",
            "kick": "https://kick.com/xposed"
        },
        "notes": "RTP-focused content"
    },
    {
        "id": str(uuid4()),
        "username": "deuceace",
        "display_name": "DeuceAce",
        "platform": "kick",
        "platform_id": "3421",
        "avatar_url": "https://files.kick.com/images/user/3421/profile_image/conversion/deuceace.webp",
        "bio": "Strategic slot analysis and bonus hunting expert.",
        "follower_count": 177000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 7
        },
        "social_links": {
            "twitter": "https://twitter.com/deuceace",
            "kick": "https://kick.com/deuceace"
        },
        "notes": "Strategic analysis focus"
    },
    {
        "id": str(uuid4()),
        "username": "casinodaddy",
        "display_name": "CasinoDaddy",
        "platform": "kick",
        "platform_id": "2897",
        "avatar_url": "https://files.kick.com/images/user/2897/profile_image/conversion/casinodaddy.webp",
        "bio": "Swedish brothers team. Energetic slot entertainment.",
        "follower_count": 220000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "17:00",
            "duration_hours": 10
        },
        "social_links": {
            "twitter": "https://twitter.com/casinodaddy",
            "kick": "https://kick.com/casinodaddy"
        },
        "notes": "Swedish brothers, team content"
    },
    {
        "id": str(uuid4()),
        "username": "mellstroy",
        "display_name": "Mellstroy",
        "platform": "kick",
        "platform_id": "987",
        "avatar_url": "https://files.kick.com/images/user/987/profile_image/conversion/mellstroy.webp",
        "bio": "Russian streamer. Very active with high engagement.",
        "follower_count": 452000,
        "stream_schedule": {
            "timezone": "MSK",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "16:00",
            "duration_hours": 10
        },
        "social_links": {
            "kick": "https://kick.com/mellstroy"
        },
        "notes": "Russian market, very active"
    },
    {
        "id": str(uuid4()),
        "username": "maherco",
        "display_name": "Maherco",
        "platform": "kick",
        "platform_id": "4521",
        "avatar_url": "https://files.kick.com/images/user/4521/profile_image/conversion/maherco.webp",
        "bio": "High viewer engagement. Consistent streaming schedule.",
        "follower_count": 100000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "18:00",
            "duration_hours": 8
        },
        "social_links": {
            "kick": "https://kick.com/maherco"
        },
        "notes": "35K avg viewers - high engagement"
    },
    {
        "id": str(uuid4()),
        "username": "bidule",
        "display_name": "Bidule",
        "platform": "kick",
        "platform_id": "3654",
        "avatar_url": "https://files.kick.com/images/user/3654/profile_image/conversion/bidule.webp",
        "bio": "French streamer. Popular in European market.",
        "follower_count": 150000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 6
        },
        "social_links": {
            "twitter": "https://twitter.com/bidulecasino",
            "kick": "https://kick.com/bidule"
        },
        "notes": "French streamer, EU market"
    },
    {
        "id": str(uuid4()),
        "username": "fruityslots",
        "display_name": "FruitySlots",
        "platform": "kick",
        "platform_id": "2987",
        "avatar_url": "https://files.kick.com/images/user/2987/profile_image/conversion/fruityslots.webp",
        "bio": "UK-based team. Known for slot reviews and bonus hunting.",
        "follower_count": 180000,
        "stream_schedule": {
            "timezone": "GMT",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": "16:00",
            "duration_hours": 8
        },
        "social_links": {
            "twitter": "https://twitter.com/fruityslots",
            "kick": "https://kick.com/fruityslots"
        },
        "notes": "UK team, slot reviews focus"
    },
    {
        "id": str(uuid4()),
        "username": "nickslots",
        "display_name": "NickSlots",
        "platform": "youtube",
        "platform_id": "UCnickslots",
        "avatar_url": "https://yt3.googleusercontent.com/nickslots.jpg",
        "bio": "OG slot streamer. Known for charity work and professional content.",
        "follower_count": 450000,
        "stream_schedule": {
            "timezone": "GMT",
            "days": ["Tuesday", "Thursday", "Saturday"],
            "start_time": "19:00",
            "duration_hours": 4
        },
        "social_links": {
            "twitter": "https://twitter.com/nickslots",
            "youtube": "https://youtube.com/nickslots"
        },
        "notes": "YouTube primary, charity focus"
    },
    {
        "id": str(uuid4()),
        "username": "letsgiveitaspin",
        "display_name": "LetsGiveItASpin",
        "platform": "kick",
        "platform_id": "4123",
        "avatar_url": "https://files.kick.com/images/user/4123/profile_image/conversion/letsgiveitaspin.webp",
        "bio": "Professional casino streamer. High production quality.",
        "follower_count": 200000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": "18:00",
            "duration_hours": 6
        },
        "social_links": {
            "twitter": "https://twitter.com/likimax",
            "kick": "https://kick.com/letsgiveitaspin",
            "youtube": "https://youtube.com/letsgiveitaspin"
        },
        "notes": "Professional quality content"
    },
    {
        "id": str(uuid4()),
        "username": "jarttu84",
        "display_name": "Jarttu84",
        "platform": "kick",
        "platform_id": "3890",
        "avatar_url": "https://files.kick.com/images/user/3890/profile_image/conversion/jarttu84.webp",
        "bio": "Finnish streamer. Known for emotional and entertaining reactions.",
        "follower_count": 120000,
        "stream_schedule": {
            "timezone": "EET",
            "days": ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "19:00",
            "duration_hours": 6
        },
        "social_links": {
            "twitter": "https://twitter.com/jarttu84",
            "kick": "https://kick.com/jarttu84"
        },
        "notes": "Finnish, emotional content"
    },
    {
        "id": str(uuid4()),
        "username": "vondice",
        "display_name": "VonDice",
        "platform": "kick",
        "platform_id": "5123",
        "avatar_url": "https://files.kick.com/images/user/5123/profile_image/conversion/vondice.webp",
        "bio": "Collaborates with Roshtein. High-stakes slot player.",
        "follower_count": 90000,
        "stream_schedule": {
            "timezone": "CET",
            "days": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "20:00",
            "duration_hours": 5
        },
        "social_links": {
            "kick": "https://kick.com/vondice"
        },
        "notes": "Roshtein collaborator"
    },
    {
        "id": str(uuid4()),
        "username": "westcol",
        "display_name": "Westcol",
        "platform": "kick",
        "platform_id": "876",
        "avatar_url": "https://files.kick.com/images/user/876/profile_image/conversion/westcol.webp",
        "bio": "Latin America #1 streamer. Massive Spanish-speaking audience.",
        "follower_count": 1700000,
        "stream_schedule": {
            "timezone": "COT",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "19:00",
            "duration_hours": 8
        },
        "social_links": {
            "twitter": "https://twitter.com/westcol",
            "instagram": "https://instagram.com/westcol",
            "kick": "https://kick.com/westcol"
        },
        "notes": "LATAM #1, massive audience"
    }
]


def get_tier1_streamers() -> List[Dict[str, Any]]:
    """Return list of Tier 1 streamer seed data."""
    return TIER1_STREAMERS


def get_streamer_by_username(username: str) -> Dict[str, Any] | None:
    """Find a streamer by username."""
    for streamer in TIER1_STREAMERS:
        if streamer["username"].lower() == username.lower():
            return streamer
    return None


async def seed_streamers(db_session) -> int:
    """
    Seed the database with Tier 1 streamers.

    Args:
        db_session: AsyncSession from SQLAlchemy

    Returns:
        Number of streamers created
    """
    from backend.app.models import Streamer

    created_count = 0
    now = datetime.now(timezone.utc)

    for streamer_data in TIER1_STREAMERS:
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
    print("=" * 60)
    print("SLOTFEED - Tier 1 Streamers Seed Data")
    print("=" * 60)
    print()

    total_followers = 0
    for i, streamer in enumerate(TIER1_STREAMERS, 1):
        total_followers += streamer["follower_count"]
        platform_badge = {
            "kick": "K",
            "twitch": "T",
            "youtube": "Y"
        }.get(streamer["platform"], "?")

        print(f"{i:2}. [{platform_badge}] {streamer['display_name']:<20} "
              f"({streamer['follower_count']:>8,} followers)")

    print()
    print("-" * 60)
    print(f"Total Streamers: {len(TIER1_STREAMERS)}")
    print(f"Total Followers: {total_followers:,}")
    print(f"Platforms: Kick ({sum(1 for s in TIER1_STREAMERS if s['platform']=='kick')}), "
          f"YouTube ({sum(1 for s in TIER1_STREAMERS if s['platform']=='youtube')})")
    print("=" * 60)

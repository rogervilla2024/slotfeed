"""
Comprehensive Mock Data Generator for SLOTFEED
Generates realistic data for all API endpoints including:
- Streamers with complete profiles
- Sessions with balance history
- Games with stats
- Streamer-game breakdowns
- Sessions for leaderboard
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# Data directory
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# Streamers data
STREAMERS_DATA = [
    {
        "slug": "roshtein",
        "id": 1,
        "user": {
            "username": "Roshtein",
            "profile_pic": "https://files.kick.com/images/user/1/profile_pic.jpg",
            "bio": "Professional slot streamer | Big wins daily",
            "created_at": "2021-01-15T10:00:00Z",
            "updated_at": "2024-01-07T10:00:00Z"
        },
        "followers_count": 362000,
        "livestream": None
    },
    {
        "slug": "trainwreckstv",
        "id": 2,
        "user": {
            "username": "Trainwreckstv",
            "profile_pic": "https://files.kick.com/images/user/2/profile_pic.jpg",
            "bio": "Kick co-founder | Slots & Gaming",
            "created_at": "2020-06-10T10:00:00Z",
            "updated_at": "2024-01-07T10:00:00Z"
        },
        "followers_count": 494000,
        "livestream": None
    },
    {
        "slug": "classybeef",
        "id": 3,
        "user": {
            "username": "ClassyBeef",
            "profile_pic": "https://files.kick.com/images/user/3/profile_pic.jpg",
            "bio": "24/7 Slot Streaming Team",
            "created_at": "2021-03-20T10:00:00Z",
            "updated_at": "2024-01-07T10:00:00Z"
        },
        "followers_count": 194000,
        "livestream": None
    },
    {
        "slug": "xposed",
        "id": 4,
        "user": {
            "username": "Xposed",
            "profile_pic": "https://files.kick.com/images/user/4/profile_pic.jpg",
            "bio": "High RTP slots focus",
            "created_at": "2021-05-12T10:00:00Z",
            "updated_at": "2024-01-07T10:00:00Z"
        },
        "followers_count": 300000,
        "livestream": None
    },
    {
        "slug": "deucace",
        "id": 5,
        "user": {
            "username": "DeuceAce",
            "profile_pic": "https://files.kick.com/images/user/5/profile_pic.jpg",
            "bio": "Strategic slot play",
            "created_at": "2021-07-08T10:00:00Z",
            "updated_at": "2024-01-07T10:00:00Z"
        },
        "followers_count": 177000,
        "livestream": None
    },
]

GAMES_LIST = [
    {"id": "sweet-bonanza", "name": "Sweet Bonanza", "provider": "Pragmatic Play", "rtp": 96.48},
    {"id": "gates-of-olympus", "name": "Gates of Olympus", "provider": "Pragmatic Play", "rtp": 96.50},
    {"id": "big-bass-bonanza", "name": "Big Bass Bonanza", "provider": "Pragmatic Play", "rtp": 96.71},
    {"id": "fruit-party", "name": "Fruit Party", "provider": "Pragmatic Play", "rtp": 96.47},
    {"id": "sugar-rush", "name": "Sugar Rush", "provider": "Pragmatic Play", "rtp": 96.50},
    {"id": "starlight-princess", "name": "Starlight Princess", "provider": "Pragmatic Play", "rtp": 96.50},
    {"id": "the-dog-house", "name": "The Dog House", "provider": "Pragmatic Play", "rtp": 96.51},
    {"id": "wanted-dead-or-alive", "name": "Wanted Dead or a Wild", "provider": "Hacksaw", "rtp": 96.38},
    {"id": "dragons-fire", "name": "Dragon's Fire", "provider": "Hacksaw", "rtp": 96.20},
    {"id": "crazy-time", "name": "Crazy Time", "provider": "Evolution", "rtp": 96.08},
    {"id": "book-of-dead", "name": "Book of Dead", "provider": "Play'n GO", "rtp": 96.21},
]


def generate_sessions_for_streamer(streamer_slug: str, num_sessions: int = 15) -> list:
    """Generate realistic sessions for a streamer."""
    sessions = []
    base_time = datetime.utcnow() - timedelta(days=30)

    for i in range(num_sessions):
        start_time = base_time + timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        duration = random.randint(60, 480)  # 1 to 8 hours
        end_time = start_time + timedelta(minutes=duration)

        start_balance = random.uniform(100, 5000)
        peak_balance = start_balance * random.uniform(1.0, 3.0)
        lowest_balance = start_balance * random.uniform(0.1, 0.9)
        end_balance = start_balance + random.uniform(-2000, 3000)

        total_wagered = random.uniform(5000, 50000)
        total_won = total_wagered * random.uniform(0.8, 1.2)

        # Generate balance history
        balance_history = []
        current_balance = start_balance
        num_entries = random.randint(20, 100)

        for j in range(num_entries):
            change = random.uniform(-500, 1000)
            current_balance += change
            balance_history.append({
                "timestamp": (start_time + timedelta(minutes=j * (duration // num_entries))).isoformat(),
                "balance": round(current_balance, 2),
                "wagered": round(abs(change) if change < 0 else 0, 2),
                "won": round(change if change > 0 else 0, 2),
                "balanceChange": round(change, 2)
            })

        # Generate game breakdown
        selected_games = random.sample(GAMES_LIST, k=random.randint(2, 5))
        game_breakdown = []
        remaining_wagered = total_wagered

        for idx, game in enumerate(selected_games):
            is_last = idx == len(selected_games) - 1
            game_wagered = remaining_wagered / (len(selected_games) - idx) if not is_last else remaining_wagered
            remaining_wagered -= game_wagered

            observed_rtp = game["rtp"] + random.uniform(-2, 2)
            game_breakdown.append({
                "gameId": game["id"],
                "gameName": game["name"],
                "sessionsCount": 1,
                "totalWagered": round(game_wagered, 2),
                "totalWon": round(game_wagered * (observed_rtp / 100), 2),
                "observedRtp": round(observed_rtp, 2),
                "theoreticalRtp": game["rtp"]
            })

        # Generate big wins
        big_wins = []
        if random.random() < 0.7:  # 70% chance of big wins
            num_big_wins = random.randint(1, 5)
            for _ in range(num_big_wins):
                win_time = start_time + timedelta(minutes=random.randint(0, duration))
                big_wins.append({
                    "id": f"win-{random.randint(100000, 999999)}",
                    "timestamp": win_time.isoformat(),
                    "gameName": random.choice(selected_games)["name"],
                    "amount": round(random.uniform(100, 5000), 2),
                    "multiplier": round(random.uniform(10, 500), 1),
                    "balanceBefore": round(random.uniform(start_balance, peak_balance), 2),
                    "balanceAfter": round(random.uniform(start_balance, peak_balance), 2)
                })

        session = {
            "id": f"session-{streamer_slug}-{i}",
            "streamerName": streamer_slug.capitalize(),
            "streamerId": streamer_slug,
            "platform": "kick",
            "startTime": start_time.isoformat(),
            "endTime": end_time.isoformat(),
            "duration": duration * 60,  # in seconds
            "startBalance": round(start_balance, 2),
            "endBalance": round(end_balance, 2),
            "peakBalance": round(peak_balance, 2),
            "lowestBalance": round(lowest_balance, 2),
            "totalWagered": round(total_wagered, 2),
            "totalPayouts": round(total_won, 2),
            "profitLoss": round(end_balance - start_balance, 2),
            "roi": round((end_balance - start_balance) / start_balance * 100, 2),
            "averageRtp": round((total_won / total_wagered * 100) if total_wagered > 0 else 0, 2),
            "biggestWin": round(max([w["amount"] for w in big_wins], default=0), 2),
            "biggestWinMultiplier": round(max([w["multiplier"] for w in big_wins], default=0), 1),
            "sessionStatus": "completed",
            "gameBreakdown": game_breakdown,
            "bigWins": big_wins,
            "balanceHistory": balance_history
        }

        sessions.append(session)

    return sessions


def generate_all_data():
    """Generate all comprehensive data files."""

    print("Generating comprehensive mock data...")

    # 1. Generate streamer data files
    print("  - Generating streamer profiles...")
    streamers_dir = DATA_DIR / "streamers"
    streamers_dir.mkdir(exist_ok=True)

    for streamer in STREAMERS_DATA:
        with open(streamers_dir / f"{streamer['slug']}.json", "w") as f:
            json.dump(streamer, f, indent=2)

    # 2. Generate sessions data
    print("  - Generating sessions data...")
    all_sessions = []
    for streamer in STREAMERS_DATA:
        sessions = generate_sessions_for_streamer(streamer["slug"])
        all_sessions.extend(sessions)

    with open(DATA_DIR / "sessions.json", "w") as f:
        json.dump({"sessions": all_sessions}, f, indent=2)

    # 3. Generate game stats per streamer
    print("  - Generating game stats...")
    game_stats = {}

    for streamer in STREAMERS_DATA:
        stats = {}
        for game in GAMES_LIST:
            stats[game["id"]] = {
                "gameId": game["id"],
                "gameName": game["name"],
                "provider": game["provider"],
                "sessionsPlayed": random.randint(5, 50),
                "totalWagered": round(random.uniform(10000, 100000), 2),
                "totalWon": round(random.uniform(8000, 120000), 2),
                "biggestWin": round(random.uniform(500, 5000), 2),
                "observedRtp": round(game["rtp"] + random.uniform(-2, 2), 2),
                "theoreticalRtp": game["rtp"]
            }
        game_stats[streamer["slug"]] = stats

    with open(DATA_DIR / "game_stats.json", "w") as f:
        json.dump({"stats": game_stats}, f, indent=2)

    # 4. Generate leaderboard data (aggregated stats)
    print("  - Generating leaderboard data...")
    leaderboard = []

    for streamer in STREAMERS_DATA:
        sessions = [s for s in all_sessions if s["streamerId"] == streamer["slug"]]

        total_wagered = sum(s["totalWagered"] for s in sessions)
        total_payouts = sum(s["totalPayouts"] for s in sessions)
        profit_loss = sum(s["profitLoss"] for s in sessions)

        leaderboard.append({
            "id": streamer["slug"],
            "name": streamer["user"]["username"],
            "followers": streamer["followers_count"],
            "totalSessions": len(sessions),
            "totalWagered": round(total_wagered, 2),
            "totalPayouts": round(total_payouts, 2),
            "profitLoss": round(profit_loss, 2),
            "roi": round((profit_loss / total_wagered * 100) if total_wagered > 0 else 0, 2),
            "averageRtp": round((total_payouts / total_wagered * 100) if total_wagered > 0 else 0, 2),
            "platform": "kick"
        })

    # Sort by profit
    leaderboard.sort(key=lambda x: x["profitLoss"], reverse=True)

    with open(DATA_DIR / "leaderboard.json", "w") as f:
        json.dump({"streamers": leaderboard}, f, indent=2)

    print("Generated data files:")
    print(f"   - {len(STREAMERS_DATA)} streamer profiles")
    print(f"   - {len(all_sessions)} sessions")
    print(f"   - {len(leaderboard)} leaderboard entries")
    print(f"   - Game stats for {len(STREAMERS_DATA)} streamers")
    print(f"\nData saved to: {DATA_DIR}")


if __name__ == "__main__":
    generate_all_data()

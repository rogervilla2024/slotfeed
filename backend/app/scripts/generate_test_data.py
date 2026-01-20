"""
Test Data Generator for SlotFeed API

Generates realistic mock data for all API endpoints including:
- Hot/Cold slots data
- Live streams data
- Big wins events
- Live RTP tracker data
- Bonus hunts data
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Sample games data
GAMES = [
    {"id": "sweet-bonanza", "name": "Sweet Bonanza", "provider": "Pragmatic Play", "rtp": 96.48},
    {"id": "gates-of-olympus", "name": "Gates of Olympus", "provider": "Pragmatic Play", "rtp": 96.50},
    {"id": "big-bass-bonanza", "name": "Big Bass Bonanza", "provider": "Pragmatic Play", "rtp": 96.71},
    {"id": "fruit-party", "name": "Fruit Party", "provider": "Pragmatic Play", "rtp": 96.47},
    {"id": "sugar-rush", "name": "Sugar Rush", "provider": "Pragmatic Play", "rtp": 96.50},
    {"id": "wanted-dead-or-alive", "name": "Wanted Dead or a Wild", "provider": "Hacksaw", "rtp": 96.38},
    {"id": "dragons-fire", "name": "Dragon's Fire", "provider": "Hacksaw", "rtp": 96.20},
    {"id": "crazy-time", "name": "Crazy Time", "provider": "Evolution", "rtp": 96.08},
    {"id": "book-of-dead", "name": "Book of Dead", "provider": "Play'n GO", "rtp": 96.21},
    {"id": "starlight-princess", "name": "Starlight Princess", "provider": "Pragmatic Play", "rtp": 96.50},
]

STREAMERS = [
    "Roshtein",
    "Trainwreckstv",
    "ClassyBeef",
    "Xposed",
    "DeuceAce",
    "CasinoDaddy",
    "Mellstroy",
    "Maherco",
    "Bidule",
    "FruitySlots",
]

PLATFORMS = ["kick", "twitch", "youtube"]


def generate_hot_cold_data() -> List[Dict[str, Any]]:
    """Generate hot/cold slot status data"""
    data = []
    for game in GAMES:
        # Randomly assign status with weighted distribution
        status_rand = random.random()
        if status_rand < 0.3:
            status = "hot"
            score = random.uniform(0.6, 1.0)
        elif status_rand < 0.6:
            status = "cold"
            score = random.uniform(-1.0, -0.6)
        else:
            status = "neutral"
            score = random.uniform(-0.3, 0.3)

        data.append({
            "gameId": game["id"],
            "gameName": game["name"],
            "provider": game["provider"],
            "status": status,
            "score": round(score, 2),
            "recentRtp": round(game["rtp"] + random.uniform(-1, 1), 2),
            "theoreticalRtp": game["rtp"],
            "sampleSize": random.randint(100000, 5000000),
            "lastUpdated": (datetime.utcnow() - timedelta(minutes=random.randint(1, 60))).isoformat(),
        })
    return data


def generate_live_streams_data() -> List[Dict[str, Any]]:
    """Generate live streams data grouped by game"""
    data = []

    # Select 5-7 random games that have active streams
    active_games = random.sample(GAMES, random.randint(5, 7))

    for game in active_games:
        streamer_count = random.randint(2, 8)
        streamers = []

        for _ in range(streamer_count):
            streamer = random.choice(STREAMERS)
            streamers.append({
                "id": f"{streamer.lower()}-{random.randint(1000, 9999)}",
                "name": streamer,
                "platform": random.choice(PLATFORMS),
                "viewers": random.randint(100, 50000),
                "url": f"https://kick.com/{streamer.lower()}",
            })

        data.append({
            "gameId": game["id"],
            "gameName": game["name"],
            "streamersCount": streamer_count,
            "streamers": streamers,
            "lastUpdated": (datetime.utcnow() - timedelta(minutes=random.randint(1, 30))).isoformat(),
        })

    return data


def generate_big_wins() -> List[Dict[str, Any]]:
    """Generate recent big win events"""
    data = []

    for _ in range(random.randint(8, 15)):
        game = random.choice(GAMES)
        streamer = random.choice(STREAMERS)
        multiplier = random.choice([
            random.uniform(100, 500),
            random.uniform(50, 200),
            random.uniform(20, 100),
            random.uniform(10, 50),
        ])

        data.append({
            "id": f"win-{random.randint(100000, 999999)}",
            "streamerName": streamer,
            "gameName": game["name"],
            "amount": round(random.uniform(50, 5000), 2),
            "multiplier": round(multiplier, 2),
            "timestamp": (datetime.utcnow() - timedelta(hours=random.randint(0, 24),
                                                         minutes=random.randint(0, 60))).isoformat(),
            "platform": random.choice(PLATFORMS),
            "videoUrl": f"https://example.com/clip/{random.randint(1000, 9999)}",
        })

    # Sort by timestamp, newest first
    data.sort(key=lambda x: x["timestamp"], reverse=True)
    return data


def generate_live_rtp_tracker() -> List[Dict[str, Any]]:
    """Generate live RTP tracker data (active streams with real-time RTP)"""
    data = []

    # Get live streams
    live_streams = generate_live_streams_data()

    for stream_group in live_streams:
        game = next(g for g in GAMES if g["id"] == stream_group["gameId"])

        for streamer in stream_group["streamers"]:
            # Generate sparkline (last 10 RTP updates)
            sparkline = [round(game["rtp"] + random.uniform(-2, 2), 2) for _ in range(10)]

            current_rtp = sparkline[-1]

            # Determine trend
            if sparkline[-1] > sparkline[0]:
                trend = "up"
            elif sparkline[-1] < sparkline[0]:
                trend = "down"
            else:
                trend = "stable"

            # Determine hot/cold status based on difference from theoretical
            diff = current_rtp - game["rtp"]
            if diff > 1:
                status = "hot"
            elif diff < -1:
                status = "cold"
            else:
                status = "neutral"

            data.append({
                "gameId": game["id"],
                "gameName": game["name"],
                "streamerName": streamer["name"],
                "currentRtp": round(current_rtp, 2),
                "theoreticalRtp": game["rtp"],
                "status": status,
                "trend": trend,
                "sparkline": sparkline,
                "lastUpdated": (datetime.utcnow() - timedelta(minutes=random.randint(1, 10))).isoformat(),
            })

    return data


def generate_bonus_hunts() -> List[Dict[str, Any]]:
    """Generate bonus hunt tracking data"""
    data = []

    statuses = ["collecting", "opening", "completed"]

    for _ in range(random.randint(10, 20)):
        game = random.choice(GAMES)
        streamer = random.choice(STREAMERS)
        status = random.choice(statuses)

        total_cost = random.uniform(100, 5000)
        entry_count = random.randint(5, 50)

        if status == "completed":
            opened_count = entry_count
            total_payout = total_cost * random.uniform(0.8, 1.5)
        elif status == "opening":
            opened_count = random.randint(1, entry_count - 1)
            total_payout = opened_count * (total_cost / entry_count) * random.uniform(0.7, 1.2)
        else:  # collecting
            opened_count = 0
            total_payout = 0

        roi_percent = ((total_payout - total_cost) / total_cost * 100) if total_cost > 0 else 0

        data.append({
            "id": f"hunt-{random.randint(100000, 999999)}",
            "streamer_id": f"streamer-{streamer.lower()}",
            "streamer_name": streamer,
            "game_id": game["id"],
            "game_name": game["name"],
            "status": status,
            "created_at": (datetime.utcnow() - timedelta(days=random.randint(0, 30))).isoformat(),
            "completed_at": (datetime.utcnow() - timedelta(days=random.randint(0, 15))).isoformat() if status == "completed" else None,
            "total_cost": round(total_cost, 2),
            "entry_count": entry_count,
            "opened_count": opened_count,
            "total_payout": round(total_payout, 2),
            "roi_percent": round(roi_percent, 2),
        })

    # Sort by created_at, newest first
    data.sort(key=lambda x: x["created_at"], reverse=True)
    return data


def generate_all_test_data() -> Dict[str, Any]:
    """Generate all test data"""
    return {
        "hot_cold": generate_hot_cold_data(),
        "live_streams": generate_live_streams_data(),
        "big_wins": generate_big_wins(),
        "live_rtp_tracker": generate_live_rtp_tracker(),
        "bonus_hunts": generate_bonus_hunts(),
    }


if __name__ == "__main__":
    # Generate test data
    test_data = generate_all_test_data()

    # Save to JSON file
    output_file = "test_data.json"
    with open(output_file, "w") as f:
        json.dump(test_data, f, indent=2)

    print(f"✅ Test data generated successfully!")
    print(f"📁 Saved to: {output_file}")
    print(f"\n📊 Generated data:")
    print(f"   - Hot/Cold slots: {len(test_data['hot_cold'])}")
    print(f"   - Live streams: {len(test_data['live_streams'])}")
    print(f"   - Big wins: {len(test_data['big_wins'])}")
    print(f"   - RTP tracker entries: {len(test_data['live_rtp_tracker'])}")
    print(f"   - Bonus hunts: {len(test_data['bonus_hunts'])}")

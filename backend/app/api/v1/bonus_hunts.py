"""Bonus hunt tracking endpoints"""
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Query

router = APIRouter()

GAMES = [
    {"id": "sweet-bonanza", "name": "Sweet Bonanza"},
    {"id": "gates-of-olympus", "name": "Gates of Olympus"},
    {"id": "big-bass-bonanza", "name": "Big Bass Bonanza"},
]

STREAMERS = ["Roshtein", "ClassyBeef", "Trainwreckstv"]

@router.get("/bonus-hunts")
async def list_bonus_hunts(status: str = Query(None), limit: int = Query(20)):
    statuses = ["collecting", "opening", "completed"]
    data = []
    
    for _ in range(min(limit, random.randint(10, 15))):
        hunt_status = status if status else random.choice(statuses)
        game = random.choice(GAMES)
        streamer = random.choice(STREAMERS)
        total_cost = random.uniform(100, 5000)
        entry_count = random.randint(5, 50)
        
        if hunt_status == "completed":
            opened_count = entry_count
            total_payout = total_cost * random.uniform(0.8, 1.5)
        elif hunt_status == "opening":
            opened_count = random.randint(1, entry_count - 1)
            total_payout = opened_count * (total_cost / entry_count) * random.uniform(0.7, 1.2)
        else:
            opened_count = 0
            total_payout = 0
        
        roi_percent = ((total_payout - total_cost) / total_cost * 100) if total_cost > 0 else 0
        
        data.append({
            "id": f"hunt-{random.randint(100000, 999999)}",
            "streamer_id": f"s_{streamer.lower()}",
            "streamer_name": streamer,
            "game_id": game["id"],
            "game_name": game["name"],
            "status": hunt_status,
            "created_at": (datetime.utcnow() - timedelta(days=random.randint(0, 30))).isoformat(),
            "completed_at": None,
            "total_cost": round(total_cost, 2),
            "entry_count": entry_count,
            "opened_count": opened_count,
            "total_payout": round(total_payout, 2),
            "roi_percent": round(roi_percent, 2),
        })
    
    data.sort(key=lambda x: x["created_at"], reverse=True)
    return {"data": data, "total": len(data)}

@router.get("/bonus-hunts/{hunt_id}")
async def get_bonus_hunt(hunt_id: str):
    return {
        "id": hunt_id,
        "status": "opening",
        "total_cost": 500.0,
        "total_payout": 400.0,
    }

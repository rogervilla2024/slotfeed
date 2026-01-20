import os
import json
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional

router = APIRouter()

# Path to sessions file
SESSIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "sessions.json")


def load_sessions() -> dict:
    """Load sessions from file."""
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"sessions": []}


@router.get("/")
async def list_sessions(
    streamer_id: Optional[str] = Query(None, description="Filter by streamer"),
    status: Optional[str] = Query(None, description="Filter by status (live, ended)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    List all sessions with optional filters.
    """
    data = load_sessions()
    sessions = data.get("sessions", [])

    # Apply filters
    if streamer_id:
        sessions = [s for s in sessions if s.get("streamerId") == streamer_id]
    if status:
        sessions = [s for s in sessions if s.get("status") == status]

    # Sort by start time (newest first)
    sessions.sort(key=lambda x: x.get("startTime", ""), reverse=True)

    total = len(sessions)
    sessions = sessions[skip:skip + limit]

    return {
        "sessions": sessions,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{session_id}")
async def get_session(session_id: str):
    """
    Get detailed information about a specific session.
    """
    data = load_sessions()

    for session in data.get("sessions", []):
        if session.get("id") == session_id:
            return session

    raise HTTPException(status_code=404, detail="Session not found")


@router.get("/{session_id}/balance-history")
async def get_session_balance_history(
    session_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """
    Get balance history for a specific session.
    """
    data = load_sessions()

    for session in data.get("sessions", []):
        if session.get("id") == session_id:
            history = session.get("balanceHistory", [])
            total = len(history)

            return {
                "sessionId": session_id,
                "history": history[skip:skip + limit],
                "total": total,
                "skip": skip,
                "limit": limit,
            }

    raise HTTPException(status_code=404, detail="Session not found")


@router.get("/game/{game_id}")
async def get_game_sessions(
    game_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get all sessions where a specific game was played.
    Useful for finding session history for a particular slot game.
    """
    data = load_sessions()
    sessions = []

    for session in data.get("sessions", []):
        # Check if game is in this session's game list
        games = session.get("gameList", [])
        if any(g.get("gameId") == game_id for g in games):
            sessions.append(session)

    # Sort by start time (newest first)
    sessions.sort(key=lambda x: x.get("startTime", ""), reverse=True)

    total = len(sessions)
    sessions = sessions[skip:skip + limit]

    # Format sessions for display
    formatted = []
    for s in sessions:
        formatted.append({
            "id": s.get("id"),
            "streamerId": s.get("streamerId"),
            "streamerName": s.get("streamerName"),
            "startTime": s.get("startTime"),
            "endTime": s.get("endTime"),
            "status": s.get("status"),
            "startBalance": s.get("startBalance", 0),
            "endBalance": s.get("endBalance", 0),
            "peakBalance": s.get("peakBalance", 0),
            "lowestBalance": s.get("lowestBalance", 0),
            "profitLoss": s.get("profitLoss", 0),
            "totalWagered": s.get("totalWagered", 0),
            "totalWon": s.get("totalWon", 0),
        })

    return {
        "gameId": game_id,
        "sessions": formatted,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/streamer/{streamer_id}")
async def get_streamer_sessions(
    streamer_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get all sessions for a specific streamer.
    """
    data = load_sessions()
    sessions = [s for s in data.get("sessions", []) if s.get("streamerId") == streamer_id]

    # Sort by start time (newest first)
    sessions.sort(key=lambda x: x.get("startTime", ""), reverse=True)

    total = len(sessions)
    sessions = sessions[skip:skip + limit]

    # Format sessions for display
    formatted = []
    for s in sessions:
        formatted.append({
            "id": s.get("id"),
            "streamerId": s.get("streamerId"),
            "startTime": s.get("startTime"),
            "endTime": s.get("endTime"),
            "status": s.get("status"),
            "startBalance": s.get("startBalance", 0),
            "endBalance": s.get("endBalance", 0),
            "peakBalance": s.get("peakBalance", 0),
            "lowestBalance": s.get("lowestBalance", 0),
            "profitLoss": s.get("profitLoss", 0),
            "totalWagered": s.get("totalWagered", 0),
            "totalWon": s.get("totalWon", 0),
        })

    return {
        "streamerId": streamer_id,
        "sessions": formatted,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

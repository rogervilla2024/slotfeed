#!/usr/bin/env python3
"""
SLOTFEED - Session Manager
Tracks streaming sessions and saves historical data
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional
import uuid

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SESSIONS_FILE = os.path.join(project_root, "data", "sessions.json")
BALANCE_HISTORY_FILE = os.path.join(project_root, "data", "balance_history.json")

# Validation thresholds
MAX_BALANCE = 10_000_000  # $10M max balance (high rollers like roshtein)
MAX_CHANGE = 5_000_000    # $5M max change (high roller reloads and jackpots)


class SessionManager:
    """Manages streaming sessions."""

    def __init__(self):
        self.sessions = self._load_sessions()
        self.active_sessions: Dict[str, str] = {}  # username -> session_id

    def _load_sessions(self) -> Dict:
        """Load sessions from file."""
        if os.path.exists(SESSIONS_FILE):
            try:
                with open(SESSIONS_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {"sessions": []}

    def _save_sessions(self):
        """Save sessions to file."""
        with open(SESSIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.sessions, f, indent=2, default=str)

    def start_session(self, username: str, kick_session_id: str = None) -> str:
        """Start a new session for a streamer."""
        session_id = str(uuid.uuid4())[:8]

        session = {
            "id": session_id,
            "streamerId": username,
            "kickSessionId": kick_session_id,
            "startTime": datetime.now().isoformat(),
            "endTime": None,
            "status": "live",
            "startBalance": 0,
            "endBalance": 0,
            "peakBalance": 0,
            "lowestBalance": 0,
            "totalWagered": 0,
            "totalWon": 0,
            "profitLoss": 0,
            "balanceHistory": [],
            "gamesPlayed": [],
        }

        self.sessions["sessions"].append(session)
        self.active_sessions[username] = session_id
        self._save_sessions()

        return session_id

    def update_session(self, username: str, balance_data: Dict):
        """Update session with new balance data."""
        session_id = self.active_sessions.get(username)
        if not session_id:
            # Start new session if none active
            session_id = self.start_session(username)

        # Find session
        session = None
        for s in self.sessions["sessions"]:
            if s["id"] == session_id:
                session = s
                break

        if not session:
            return

        current_balance = balance_data.get("balance", 0)
        timestamp = datetime.now().isoformat()

        # Validate balance - reject unrealistic values
        if current_balance > MAX_BALANCE or current_balance < 0:
            return  # Silently reject invalid balance

        # Check change amount
        if session.get("endBalance", 0) > 0:
            change = abs(current_balance - session["endBalance"])
            if change > MAX_CHANGE:
                return  # Reject unrealistic change

        # Set start balance if first update
        if session["startBalance"] == 0:
            session["startBalance"] = current_balance
            session["lowestBalance"] = current_balance

        # Update stats
        session["peakBalance"] = max(session["peakBalance"], current_balance)
        session["lowestBalance"] = min(session["lowestBalance"], current_balance) if session["lowestBalance"] > 0 else current_balance

        # Track balance change
        prev_balance = session["balanceHistory"][-1]["balance"] if session["balanceHistory"] else current_balance
        change = current_balance - prev_balance

        if abs(change) > 0.01:  # Only track meaningful changes
            session["balanceHistory"].append({
                "timestamp": timestamp,
                "balance": current_balance,
                "change": change,
            })

            # Update wagered/won
            if change < 0:
                session["totalWagered"] += abs(change)
            else:
                session["totalWon"] += change

        # Update current balance and P/L
        session["endBalance"] = current_balance
        session["profitLoss"] = current_balance - session["startBalance"]

        # Keep last 500 balance entries per session
        if len(session["balanceHistory"]) > 500:
            session["balanceHistory"] = session["balanceHistory"][-500:]

        self._save_sessions()

    def end_session(self, username: str):
        """End a session."""
        session_id = self.active_sessions.get(username)
        if not session_id:
            return

        for session in self.sessions["sessions"]:
            if session["id"] == session_id:
                session["status"] = "ended"
                session["endTime"] = datetime.now().isoformat()
                break

        del self.active_sessions[username]
        self._save_sessions()

    def get_streamer_sessions(self, username: str, limit: int = 20) -> List[Dict]:
        """Get sessions for a streamer."""
        sessions = [s for s in self.sessions["sessions"] if s["streamerId"] == username]
        sessions.sort(key=lambda x: x["startTime"], reverse=True)
        return sessions[:limit]

    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get a specific session."""
        for session in self.sessions["sessions"]:
            if session["id"] == session_id:
                return session
        return None

    def check_stream_status(self, username: str, is_live: bool, kick_session_id: str = None):
        """Check and update session based on stream status."""
        has_active = username in self.active_sessions

        if is_live and not has_active:
            # Stream started - create new session
            self.start_session(username, kick_session_id)
            print(f"[SESSION] Started new session for {username}")

        elif not is_live and has_active:
            # Stream ended - close session
            self.end_session(username)
            print(f"[SESSION] Ended session for {username}")


# Global instance
session_manager = SessionManager()

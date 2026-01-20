#!/usr/bin/env python3
"""
SLOTFEED - Game Stats Aggregator
Computes and stores aggregated game statistics per streamer.
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from ocr.templates.template_loader import get_template_loader


# File paths
GAME_STATS_FILE = os.path.join(project_root, "data", "game_stats.json")


class GameStatsAggregator:
    """
    Aggregates and stores game statistics per streamer.

    Stats structure:
    {
        "streamer_username": {
            "game-id": {
                "gameId": "game-id",
                "gameName": "Game Name",
                "provider": "provider-name",
                "sessionsPlayed": 45,
                "totalWagered": 150000.0,
                "totalWon": 142500.0,
                "biggestWin": 25000.0,
                "observedRtp": 95.0,
                "theoreticalRtp": 96.48,
                "lastPlayedAt": "2026-01-04T15:30:22"
            }
        }
    }
    """

    def __init__(self):
        self.template_loader = get_template_loader()
        self.stats = self._load_stats()

    def _load_stats(self) -> Dict:
        """Load stats from file."""
        if os.path.exists(GAME_STATS_FILE):
            try:
                with open(GAME_STATS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get("stats", {})
            except Exception as e:
                print(f"[STATS] Error loading game stats: {e}")
        return {}

    def _save_stats(self):
        """Save stats to file."""
        try:
            data = {
                "version": "1.0",
                "last_updated": datetime.now().isoformat(),
                "stats": self.stats
            }
            with open(GAME_STATS_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"[STATS] Error saving game stats: {e}")

    def _calculate_rtp(self, total_wagered: float, total_won: float) -> float:
        """Calculate observed RTP percentage."""
        if total_wagered <= 0:
            return 0.0
        return min(200.0, max(0.0, (total_won / total_wagered) * 100))

    def update_stats(
        self,
        username: str,
        game_id: str,
        game_name: str,
        provider: str,
        balance_change: float,
        is_win: bool = False
    ):
        """
        Update stats for a streamer-game combination.

        Args:
            username: Streamer username
            game_id: Game identifier
            game_name: Display name of the game
            provider: Game provider
            balance_change: Positive for wins, negative for losses
            is_win: True if this was a win event
        """
        if username not in self.stats:
            self.stats[username] = {}

        if game_id not in self.stats[username]:
            theoretical_rtp = self.template_loader.get_theoretical_rtp(game_id)
            self.stats[username][game_id] = {
                "gameId": game_id,
                "gameName": game_name,
                "provider": provider,
                "sessionsPlayed": 1,
                "totalWagered": 0.0,
                "totalWon": 0.0,
                "biggestWin": 0.0,
                "observedRtp": 0.0,
                "theoreticalRtp": theoretical_rtp,
                "lastPlayedAt": datetime.now().isoformat()
            }

        game_stats = self.stats[username][game_id]

        # Update wagered/won based on balance change
        if balance_change < 0:
            # Loss = wagered amount
            game_stats["totalWagered"] += abs(balance_change)
        else:
            # Win
            game_stats["totalWon"] += balance_change
            if balance_change > game_stats["biggestWin"]:
                game_stats["biggestWin"] = balance_change

        # Recalculate RTP
        game_stats["observedRtp"] = self._calculate_rtp(
            game_stats["totalWagered"],
            game_stats["totalWon"]
        )

        # Update last played
        game_stats["lastPlayedAt"] = datetime.now().isoformat()

        # Save periodically (every update for now)
        self._save_stats()

    def increment_session(self, username: str, game_id: str):
        """Increment session count when a new game session starts."""
        if username in self.stats and game_id in self.stats[username]:
            self.stats[username][game_id]["sessionsPlayed"] += 1
            self._save_stats()

    def register_game_session(
        self,
        username: str,
        game_id: str,
        game_name: str,
        provider: str
    ):
        """
        Register that a streamer is playing a game (without balance tracking).
        Used when we detect the game but don't have confirmed balance data.
        Only creates the entry if it doesn't exist, or updates lastPlayedAt.
        """
        if username not in self.stats:
            self.stats[username] = {}

        if game_id not in self.stats[username]:
            theoretical_rtp = self.template_loader.get_theoretical_rtp(game_id)
            self.stats[username][game_id] = {
                "gameId": game_id,
                "gameName": game_name,
                "provider": provider,
                "sessionsPlayed": 1,
                "totalWagered": 0.0,
                "totalWon": 0.0,
                "biggestWin": 0.0,
                "observedRtp": 0.0,
                "theoreticalRtp": theoretical_rtp,
                "lastPlayedAt": datetime.now().isoformat()
            }
            self._save_stats()
        else:
            # Update lastPlayedAt if game already exists
            game_stats = self.stats[username][game_id]
            game_stats["lastPlayedAt"] = datetime.now().isoformat()
            # Save periodically for existing games too
            self._save_stats()

    def get_streamer_game_stats(self, username: str) -> List[Dict]:
        """
        Get game statistics for a specific streamer.
        Returns list sorted by sessions played (most played first).
        """
        if username not in self.stats:
            return []

        games = list(self.stats[username].values())
        # Sort by sessions played descending
        games.sort(key=lambda x: x.get("sessionsPlayed", 0), reverse=True)
        return games

    def get_game_global_stats(self, game_id: str) -> Dict:
        """Get aggregated stats for a game across all streamers."""
        total_wagered = 0.0
        total_won = 0.0
        biggest_win = 0.0
        total_sessions = 0
        streamers = []

        for username, games in self.stats.items():
            if game_id in games:
                game = games[game_id]
                total_wagered += game.get("totalWagered", 0)
                total_won += game.get("totalWon", 0)
                total_sessions += game.get("sessionsPlayed", 0)
                if game.get("biggestWin", 0) > biggest_win:
                    biggest_win = game["biggestWin"]
                streamers.append(username)

        return {
            "gameId": game_id,
            "totalStreamers": len(streamers),
            "totalSessions": total_sessions,
            "totalWagered": total_wagered,
            "totalWon": total_won,
            "biggestWin": biggest_win,
            "observedRtp": self._calculate_rtp(total_wagered, total_won),
            "streamers": streamers
        }

    def get_all_stats(self) -> Dict:
        """Get all stats (for debugging/admin)."""
        return self.stats


# Singleton instance
_aggregator: Optional[GameStatsAggregator] = None


def get_game_stats_aggregator() -> GameStatsAggregator:
    """Get singleton aggregator instance."""
    global _aggregator
    if _aggregator is None:
        _aggregator = GameStatsAggregator()
    return _aggregator


# Convenience functions
def update_game_stats(
    username: str,
    game_id: str,
    game_name: str,
    provider: str,
    balance_change: float
):
    """Convenience function to update game stats."""
    return get_game_stats_aggregator().update_stats(
        username, game_id, game_name, provider, balance_change
    )


def get_streamer_games(username: str) -> List[Dict]:
    """Convenience function to get streamer's game stats."""
    return get_game_stats_aggregator().get_streamer_game_stats(username)


if __name__ == "__main__":
    # Test the aggregator
    aggregator = GameStatsAggregator()

    # Simulate some updates
    print("Testing Game Stats Aggregator")
    print("=" * 60)

    # Simulate playing Sweet Bonanza
    aggregator.update_stats("testuser", "sweet-bonanza", "Sweet Bonanza", "pragmatic-play", -100)
    aggregator.update_stats("testuser", "sweet-bonanza", "Sweet Bonanza", "pragmatic-play", 250)
    aggregator.update_stats("testuser", "sweet-bonanza", "Sweet Bonanza", "pragmatic-play", -100)
    aggregator.update_stats("testuser", "sweet-bonanza", "Sweet Bonanza", "pragmatic-play", -100)
    aggregator.update_stats("testuser", "sweet-bonanza", "Sweet Bonanza", "pragmatic-play", 500)

    # Simulate playing Gates of Olympus
    aggregator.update_stats("testuser", "gates-of-olympus-1000", "Gates of Olympus 1000", "pragmatic-play", -200)
    aggregator.update_stats("testuser", "gates-of-olympus-1000", "Gates of Olympus 1000", "pragmatic-play", 1000)

    # Get stats
    stats = aggregator.get_streamer_game_stats("testuser")
    print("\nStreamer 'testuser' game stats:")
    for game in stats:
        print(f"\n  {game['gameName']}:")
        print(f"    Sessions: {game['sessionsPlayed']}")
        print(f"    Wagered: ${game['totalWagered']:,.2f}")
        print(f"    Won: ${game['totalWon']:,.2f}")
        print(f"    Biggest Win: ${game['biggestWin']:,.2f}")
        print(f"    Observed RTP: {game['observedRtp']:.2f}%")
        print(f"    Theoretical RTP: {game['theoreticalRtp']:.2f}%")

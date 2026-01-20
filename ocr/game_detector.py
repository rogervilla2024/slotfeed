#!/usr/bin/env python3
"""
SLOTFEED - Game Detector
Detects which slot game is being played from stream title and OCR text.
"""

import os
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from ocr.templates.template_loader import get_template_loader, GameTemplate


@dataclass
class DetectedGame:
    """Represents a detected game."""
    game_id: str
    game_name: str
    provider: str
    confidence: float
    detection_source: str  # 'stream_title', 'ocr_text', 'fallback'
    detected_at: str


# Common game name patterns for title matching
# Format: (pattern, game_id, game_name, provider)
GAME_PATTERNS = [
    # Pragmatic Play
    (r'sweet\s*bonanza(?:\s*1000)?', 'sweet-bonanza', 'Sweet Bonanza', 'pragmatic-play'),
    (r'gates\s*of\s*olympus(?:\s*1000)?', 'gates-of-olympus-1000', 'Gates of Olympus', 'pragmatic-play'),
    (r'sugar\s*rush', 'sugar-rush', 'Sugar Rush', 'pragmatic-play'),
    (r'big\s*bass\s*bonanza', 'big-bass-bonanza', 'Big Bass Bonanza', 'pragmatic-play'),
    (r'fruit\s*party', 'fruit-party', 'Fruit Party', 'pragmatic-play'),
    (r'dog\s*house', 'the-dog-house', 'The Dog House', 'pragmatic-play'),
    (r'starlight\s*princess', 'starlight-princess', 'Starlight Princess', 'pragmatic-play'),

    # Hacksaw Gaming
    (r'wanted\s*dead\s*(?:or|&)?\s*(?:a\s*)?wild', 'wanted-dead-or-wild', 'Wanted Dead or a Wild', 'hacksaw'),
    (r'fire\s*in\s*the\s*hole', 'fire-in-the-hole', 'Fire in the Hole', 'hacksaw'),
    (r'hand\s*of\s*anubis', 'hand-of-anubis', 'Hand of Anubis', 'hacksaw'),
    (r'dork\s*unit', 'dork-unit', 'Dork Unit', 'hacksaw'),

    # Nolimit City
    (r'tombstone\s*r\.?i\.?p\.?', 'tombstone-rip', 'Tombstone RIP', 'nolimit-city'),
    (r'mental', 'mental', 'Mental', 'nolimit-city'),
    (r'san\s*quentin', 'san-quentin', 'San Quentin', 'nolimit-city'),

    # Relax Gaming
    (r'money\s*train\s*[234]?', 'money-train-4', 'Money Train 4', 'relax-gaming'),

    # Pragmatic Play Live
    (r'zeus\s*vs\s*hades', 'zeus-vs-hades', 'Zeus vs Hades', 'pragmatic-play'),

    # Generic bonus hunt/slot hunt detection
    (r'bonus\s*(hunt|opening)', 'bonus-hunt', 'Bonus Hunt', 'various'),
    (r'slot\s*hunt', 'bonus-hunt', 'Slot Hunt', 'various'),

    # Popular games
    (r'crazy\s*time', 'crazy-time', 'Crazy Time', 'evolution'),
    (r'book\s*of\s*dead', 'book-of-dead', 'Book of Dead', 'playngo'),
    (r'reactoonz', 'reactoonz', 'Reactoonz', 'playngo'),
    (r'razor\s*shark', 'razor-shark', 'Razor Shark', 'push-gaming'),
    (r'jammin\s*jars', 'jammin-jars', 'Jammin Jars', 'push-gaming'),
]


class GameDetector:
    """
    Detects which game is being played from multiple sources.

    Detection priority:
    1. Stream title (most reliable)
    2. OCR text (fallback)
    3. Generic slot if no match
    """

    def __init__(self):
        self.template_loader = get_template_loader()
        self._current_games: Dict[str, DetectedGame] = {}  # username -> current game
        self._game_start_times: Dict[str, str] = {}  # username -> start timestamp
        self._min_game_duration = 30  # seconds - prevent rapid switching

    def detect_from_stream_title(self, title: str) -> Optional[DetectedGame]:
        """
        Detect game from stream title.
        Returns DetectedGame with confidence score.
        """
        if not title:
            return None

        title_lower = title.lower()

        # Try pattern matching
        for pattern, game_id, game_name, provider in GAME_PATTERNS:
            if re.search(pattern, title_lower):
                return DetectedGame(
                    game_id=game_id,
                    game_name=game_name,
                    provider=provider,
                    confidence=0.9,  # High confidence for title match
                    detection_source='stream_title',
                    detected_at=datetime.now().isoformat()
                )

        # Try template loader's game name map
        template = self.template_loader.detect_game(title_lower)
        if template and template.game_id != 'slot_game_generic':
            return DetectedGame(
                game_id=template.game_id,
                game_name=template.game_name,
                provider=template.provider,
                confidence=0.85,
                detection_source='stream_title',
                detected_at=datetime.now().isoformat()
            )

        return None

    def detect_from_ocr_text(self, ocr_texts: List[str]) -> Optional[DetectedGame]:
        """
        Detect game from OCR extracted text.
        Lower confidence than stream title.
        """
        if not ocr_texts:
            return None

        combined_text = ' '.join(ocr_texts).lower()

        # Try pattern matching
        for pattern, game_id, game_name, provider in GAME_PATTERNS:
            if re.search(pattern, combined_text):
                return DetectedGame(
                    game_id=game_id,
                    game_name=game_name,
                    provider=provider,
                    confidence=0.7,  # Lower confidence for OCR
                    detection_source='ocr_text',
                    detected_at=datetime.now().isoformat()
                )

        # Try template loader
        template = self.template_loader.detect_game(combined_text)
        if template and template.game_id != 'slot_game_generic':
            return DetectedGame(
                game_id=template.game_id,
                game_name=template.game_name,
                provider=template.provider,
                confidence=0.6,
                detection_source='ocr_text',
                detected_at=datetime.now().isoformat()
            )

        return None

    def detect_game(
        self,
        username: str,
        stream_title: Optional[str] = None,
        ocr_texts: Optional[List[str]] = None
    ) -> DetectedGame:
        """
        Detect game using all available sources.

        Priority:
        1. Stream title (primary)
        2. OCR text (fallback)
        3. Generic game (last resort)

        Also handles game change tracking.
        """
        detected = None

        # Try stream title first (highest priority)
        if stream_title:
            detected = self.detect_from_stream_title(stream_title)

        # Fallback to OCR text
        if not detected and ocr_texts:
            detected = self.detect_from_ocr_text(ocr_texts)

        # Last resort: generic game
        if not detected:
            detected = DetectedGame(
                game_id='generic',
                game_name='Unknown Slot',
                provider='unknown',
                confidence=0.0,
                detection_source='fallback',
                detected_at=datetime.now().isoformat()
            )

        # Track game changes
        current = self._current_games.get(username)
        if current and current.game_id != detected.game_id:
            # Game changed - update tracking
            self._current_games[username] = detected
            self._game_start_times[username] = detected.detected_at
        elif not current:
            # First detection for this user
            self._current_games[username] = detected
            self._game_start_times[username] = detected.detected_at

        return detected

    def get_current_game(self, username: str) -> Optional[DetectedGame]:
        """Get the currently tracked game for a streamer."""
        return self._current_games.get(username)

    def get_game_start_time(self, username: str) -> Optional[str]:
        """Get when the current game session started."""
        return self._game_start_times.get(username)

    def clear_streamer(self, username: str):
        """Clear game tracking for a streamer (when they go offline)."""
        self._current_games.pop(username, None)
        self._game_start_times.pop(username, None)


# Singleton instance
_detector: Optional[GameDetector] = None


def get_game_detector() -> GameDetector:
    """Get singleton game detector instance."""
    global _detector
    if _detector is None:
        _detector = GameDetector()
    return _detector


# Convenience functions
def detect_game(
    username: str,
    stream_title: Optional[str] = None,
    ocr_texts: Optional[List[str]] = None
) -> DetectedGame:
    """Convenience function to detect game."""
    return get_game_detector().detect_game(username, stream_title, ocr_texts)


def get_current_game(username: str) -> Optional[DetectedGame]:
    """Convenience function to get current game."""
    return get_game_detector().get_current_game(username)


if __name__ == "__main__":
    # Test the detector
    detector = GameDetector()

    test_titles = [
        "SOON $100,000 (84) BONUS OPENING! RACE FOR $25,000 RACE STAKE FOR 200% BONUS",
        "Sweet Bonanza $1000 Spins - Big Win Hunting!",
        "Gates of Olympus 1000x Hunting Today!",
        "Playing some slots - Wanted Dead or Wild",
        "Fire in the Hole x5000 MAX WIN ATTEMPT",
        "Random stream title with no game",
    ]

    print("Game Detection Test")
    print("=" * 60)

    for title in test_titles:
        result = detector.detect_from_stream_title(title)
        if result:
            print(f"\nTitle: {title[:50]}...")
            print(f"  Game: {result.game_name} ({result.game_id})")
            print(f"  Provider: {result.provider}")
            print(f"  Confidence: {result.confidence:.0%}")
        else:
            print(f"\nTitle: {title[:50]}...")
            print("  No game detected")

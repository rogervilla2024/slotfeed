"""
Tests for the BigWinDetector service.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from app.services.big_win_detector import (
    BigWinDetector,
    BigWinEvent,
    BigWinTier,
    DetectorConfig,
    create_detector,
)


class TestBigWinDetector:
    """Tests for the BigWinDetector class."""

    def test_initialization_default_config(self):
        """Test detector initializes with default config."""
        detector = BigWinDetector()

        assert detector.config.min_multiplier == 100.0
        assert detector.config.mega_threshold == 500.0
        assert detector.config.ultra_threshold == 1000.0
        assert detector.config.legendary_threshold == 5000.0
        assert detector.config.capture_screenshot is True

    def test_initialization_custom_config(self):
        """Test detector initializes with custom config."""
        config = DetectorConfig(
            min_multiplier=50.0,
            mega_threshold=250.0,
            capture_screenshot=False,
        )
        detector = BigWinDetector(config)

        assert detector.config.min_multiplier == 50.0
        assert detector.config.mega_threshold == 250.0
        assert detector.config.capture_screenshot is False

    def test_detect_below_threshold(self):
        """Test that wins below threshold are not detected."""
        detector = BigWinDetector()

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=50.0,  # 50x multiplier
            balance_before=100.0,
            balance_after=150.0,
        )

        assert result is None
        assert detector.get_stats()["total_detected"] == 0

    def test_detect_big_win(self):
        """Test detection of a big win (100x+)."""
        detector = BigWinDetector()

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,  # 150x multiplier
            balance_before=100.0,
            balance_after=250.0,
        )

        assert result is not None
        assert result.multiplier == 150.0
        assert result.tier == BigWinTier.BIG
        assert detector.get_stats()["total_detected"] == 1

    def test_detect_mega_win(self):
        """Test detection of a mega win (500x+)."""
        detector = BigWinDetector()

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=750.0,  # 750x multiplier
            balance_before=100.0,
            balance_after=850.0,
        )

        assert result is not None
        assert result.tier == BigWinTier.MEGA

    def test_detect_ultra_win(self):
        """Test detection of an ultra win (1000x+)."""
        detector = BigWinDetector()

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=2500.0,  # 2500x multiplier
            balance_before=100.0,
            balance_after=2600.0,
        )

        assert result is not None
        assert result.tier == BigWinTier.ULTRA

    def test_detect_legendary_win(self):
        """Test detection of a legendary win (5000x+)."""
        detector = BigWinDetector()

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=10000.0,  # 10000x multiplier
            balance_before=100.0,
            balance_after=10100.0,
        )

        assert result is not None
        assert result.tier == BigWinTier.LEGENDARY
        assert detector.get_stats()["legendary_wins"] == 1

    def test_detect_zero_bet(self):
        """Test that zero bet amounts are rejected."""
        detector = BigWinDetector()

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=0.0,
            win_amount=100.0,
            balance_before=100.0,
            balance_after=200.0,
        )

        assert result is None

    def test_detect_zero_win(self):
        """Test that zero win amounts are rejected."""
        detector = BigWinDetector()

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=0.0,
            balance_before=100.0,
            balance_after=100.0,
        )

        assert result is None

    def test_detect_below_min_bet(self):
        """Test that bets below minimum are filtered."""
        config = DetectorConfig(min_bet_amount=1.0)
        detector = BigWinDetector(config)

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=0.5,  # Below minimum
            win_amount=100.0,  # 200x
            balance_before=100.0,
            balance_after=200.0,
        )

        assert result is None

    def test_pending_events(self):
        """Test that detected events are added to pending list."""
        detector = BigWinDetector()

        detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            balance_before=100.0,
            balance_after=250.0,
        )

        pending = detector.get_pending_events()
        assert len(pending) == 1
        assert pending[0].multiplier == 150.0

    def test_stats_tracking(self):
        """Test that statistics are properly tracked."""
        detector = BigWinDetector()

        # Detect a few wins
        detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            balance_before=100.0,
            balance_after=250.0,
        )

        detector.detect(
            session_id="session-2",
            game_session_id="game-session-2",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=2.0,
            win_amount=1200.0,  # 600x - mega
            balance_before=100.0,
            balance_after=1300.0,
        )

        stats = detector.get_stats()
        assert stats["total_detected"] == 2
        assert stats["total_value"] == 1350.0  # 150 + 1200
        assert stats["largest_multiplier"] == 600.0

    def test_reset_stats(self):
        """Test that stats can be reset."""
        detector = BigWinDetector()

        detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            balance_before=100.0,
            balance_after=250.0,
        )

        detector.reset_stats()
        stats = detector.get_stats()

        assert stats["total_detected"] == 0
        assert stats["total_value"] == 0.0

    def test_custom_timestamp(self):
        """Test that custom timestamp is used."""
        detector = BigWinDetector()
        custom_time = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            balance_before=100.0,
            balance_after=250.0,
            timestamp=custom_time,
        )

        assert result.timestamp == custom_time

    def test_metadata(self):
        """Test that metadata is stored."""
        detector = BigWinDetector()
        meta = {"spin_number": 42, "feature": "free_spins"}

        result = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            balance_before=100.0,
            balance_after=250.0,
            metadata=meta,
        )

        assert result.metadata["spin_number"] == 42
        assert result.metadata["feature"] == "free_spins"

    def test_create_notification_payload(self):
        """Test notification payload creation."""
        detector = BigWinDetector()

        event = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            balance_before=100.0,
            balance_after=250.0,
        )

        payload = detector.create_notification_payload(event)

        assert payload["type"] == "big_win"
        assert payload["tier"] == "big"
        assert payload["emoji"] == "🎰"
        assert payload["data"]["multiplier"] == 150.0

    def test_legendary_notification_emoji(self):
        """Test that legendary wins get crown emoji."""
        detector = BigWinDetector()

        event = detector.detect(
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=10000.0,
            balance_before=100.0,
            balance_after=10100.0,
        )

        payload = detector.create_notification_payload(event)
        assert payload["emoji"] == "👑"


class TestCreateDetectorFactory:
    """Tests for the create_detector factory function."""

    def test_create_with_defaults(self):
        """Test creating detector with default settings."""
        detector = create_detector()

        assert detector.config.min_multiplier == 100.0
        assert detector.config.capture_screenshot is True

    def test_create_with_custom_multiplier(self):
        """Test creating detector with custom multiplier."""
        detector = create_detector(min_multiplier=50.0)

        assert detector.config.min_multiplier == 50.0

    def test_create_without_screenshots(self):
        """Test creating detector without screenshot capture."""
        detector = create_detector(capture_screenshot=False)

        assert detector.config.capture_screenshot is False


class TestBigWinEvent:
    """Tests for the BigWinEvent dataclass."""

    def test_event_creation(self):
        """Test creating a big win event."""
        event = BigWinEvent(
            id="event-1",
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            multiplier=150.0,
            tier=BigWinTier.BIG,
            timestamp=datetime.now(timezone.utc),
            balance_before=100.0,
            balance_after=250.0,
        )

        assert event.id == "event-1"
        assert event.multiplier == 150.0
        assert event.is_verified is False
        assert event.verification_status == "pending"

    def test_event_default_metadata(self):
        """Test that metadata defaults to empty dict."""
        event = BigWinEvent(
            id="event-1",
            session_id="session-1",
            game_session_id="game-session-1",
            game_id="game-1",
            streamer_id="streamer-1",
            bet_amount=1.0,
            win_amount=150.0,
            multiplier=150.0,
            tier=BigWinTier.BIG,
            timestamp=datetime.now(timezone.utc),
            balance_before=100.0,
            balance_after=250.0,
        )

        assert event.metadata == {}


class TestBigWinTier:
    """Tests for the BigWinTier enum."""

    def test_tier_values(self):
        """Test tier enum values."""
        assert BigWinTier.BIG.value == "big"
        assert BigWinTier.MEGA.value == "mega"
        assert BigWinTier.ULTRA.value == "ultra"
        assert BigWinTier.LEGENDARY.value == "legendary"

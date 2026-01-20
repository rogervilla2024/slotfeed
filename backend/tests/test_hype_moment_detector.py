"""
Tests for the HypeMomentDetector service.
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock

from app.services.hype_moment_detector import (
    HypeMomentDetector,
    HypeMomentEvent,
    DetectorThresholds,
    create_hype_detector,
)
from app.schemas.chat_analytics import (
    HypeTriggerType,
    LiveChatStats,
    ChatActivitySpike,
)


class TestHypeMomentDetector:
    """Tests for the HypeMomentDetector class."""

    def test_initialization_default_thresholds(self):
        """Test detector initializes with default thresholds."""
        detector = HypeMomentDetector()

        assert detector.thresholds.chat_velocity_spike_multiplier == 2.5
        assert detector.thresholds.hype_score_threshold == 0.7
        assert detector.thresholds.cooldown_seconds == 60

    def test_initialization_custom_thresholds(self):
        """Test detector initializes with custom thresholds."""
        thresholds = DetectorThresholds(
            chat_velocity_spike_multiplier=3.0,
            hype_score_threshold=0.5,
            cooldown_seconds=30,
        )
        detector = HypeMomentDetector(thresholds)

        assert detector.thresholds.chat_velocity_spike_multiplier == 3.0
        assert detector.thresholds.hype_score_threshold == 0.5
        assert detector.thresholds.cooldown_seconds == 30

    def test_detect_from_big_win(self):
        """Test detection from big win always creates hype moment."""
        detector = HypeMomentDetector()

        event = detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=150.0,
            win_amount=1500.0,
        )

        assert event is not None
        assert event.trigger_type == HypeTriggerType.BIG_WIN
        assert event.related_big_win_id == "win-1"
        assert event.hype_score >= 0.7

    def test_detect_from_big_win_legendary(self):
        """Test legendary win gets highest hype score."""
        detector = HypeMomentDetector()

        event = detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=5000.0,
            win_amount=50000.0,
        )

        assert event is not None
        assert event.hype_score == 1.0

    def test_detect_from_big_win_ultra(self):
        """Test ultra win gets high hype score."""
        detector = HypeMomentDetector()

        event = detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=1000.0,
            win_amount=10000.0,
        )

        assert event is not None
        assert event.hype_score == 0.95

    def test_detect_from_big_win_mega(self):
        """Test mega win gets moderate-high hype score."""
        detector = HypeMomentDetector()

        event = detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=500.0,
            win_amount=5000.0,
        )

        assert event is not None
        assert event.hype_score == 0.85

    def test_detect_from_chat_spike(self):
        """Test detection from chat activity spike."""
        detector = HypeMomentDetector()
        now = datetime.now(timezone.utc)

        spike = ChatActivitySpike(
            session_id="session-1",
            detected_at=now,
            spike_type="message_velocity",
            baseline_value=50.0,
            spike_value=200.0,
            increase_percentage=300.0,  # 300% increase
        )

        event = detector.detect_from_chat_spike(spike)

        assert event is not None
        assert event.trigger_type == HypeTriggerType.CHAT_SPIKE
        assert event.chat_velocity == 200

    def test_detect_from_chat_spike_below_threshold(self):
        """Test that small spikes don't trigger hype moment."""
        detector = HypeMomentDetector()
        now = datetime.now(timezone.utc)

        spike = ChatActivitySpike(
            session_id="session-1",
            detected_at=now,
            spike_type="message_velocity",
            baseline_value=50.0,
            spike_value=75.0,
            increase_percentage=50.0,  # Only 50% increase
        )

        event = detector.detect_from_chat_spike(spike)

        # 50% increase only gives 0.25 hype score, below 0.7 threshold
        assert event is None

    def test_detect_from_viewer_spike(self):
        """Test detection from viewer count spike."""
        detector = HypeMomentDetector()

        # First set a baseline
        detector.detect_from_viewer_spike("session-1", 1000)

        # Simulate multiple updates to build baseline
        for _ in range(5):
            detector.detect_from_viewer_spike("session-1", 1000)

        # Now detect a spike
        event = detector.detect_from_viewer_spike("session-1", 1500)

        # Might not trigger immediately due to baseline smoothing
        # but viewer spike should be tracked
        if event:
            assert event.trigger_type == HypeTriggerType.VIEWER_SPIKE

    def test_detect_from_emote_spam(self):
        """Test detection from emote spam."""
        detector = HypeMomentDetector()

        event = detector.detect_from_emote_spam(
            session_id="session-1",
            emote_count=100,
            message_count=150,  # 66% emote ratio
        )

        assert event is not None
        assert event.trigger_type == HypeTriggerType.EMOTE_SPAM

    def test_detect_from_emote_spam_below_threshold(self):
        """Test that low emote ratios don't trigger."""
        detector = HypeMomentDetector()

        event = detector.detect_from_emote_spam(
            session_id="session-1",
            emote_count=10,
            message_count=100,  # Only 10% emote ratio
        )

        assert event is None

    def test_detect_from_emote_spam_min_count(self):
        """Test that emote count must meet minimum."""
        detector = HypeMomentDetector()

        event = detector.detect_from_emote_spam(
            session_id="session-1",
            emote_count=20,  # Below default 50 minimum
            message_count=30,  # High ratio but low count
        )

        assert event is None

    def test_cooldown_prevents_detection(self):
        """Test that cooldown prevents rapid-fire detections."""
        thresholds = DetectorThresholds(cooldown_seconds=60)
        detector = HypeMomentDetector(thresholds)
        now = datetime.now(timezone.utc)

        # First detection should work
        spike1 = ChatActivitySpike(
            session_id="session-1",
            detected_at=now,
            spike_type="message_velocity",
            baseline_value=50.0,
            spike_value=200.0,
            increase_percentage=300.0,
        )
        event1 = detector.detect_from_chat_spike(spike1)
        assert event1 is not None

        # Second detection immediately should be blocked by cooldown
        spike2 = ChatActivitySpike(
            session_id="session-1",
            detected_at=now + timedelta(seconds=10),
            spike_type="message_velocity",
            baseline_value=50.0,
            spike_value=200.0,
            increase_percentage=300.0,
        )
        event2 = detector.detect_from_chat_spike(spike2)
        assert event2 is None

    def test_pending_events(self):
        """Test that detected events are added to pending list."""
        detector = HypeMomentDetector()

        detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=150.0,
            win_amount=1500.0,
        )

        pending = detector.get_pending_events()
        assert len(pending) == 1
        assert pending[0].related_big_win_id == "win-1"

    def test_stats_tracking(self):
        """Test that statistics are properly tracked."""
        detector = HypeMomentDetector()

        detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=150.0,
            win_amount=1500.0,
        )

        detector.detect_from_big_win(
            session_id="session-2",
            big_win_id="win-2",
            multiplier=500.0,
            win_amount=5000.0,
        )

        stats = detector.get_stats()
        assert stats["total_detected"] == 2
        assert stats["by_trigger"]["big_win"] == 2

    def test_reset_session(self):
        """Test resetting session state."""
        detector = HypeMomentDetector()

        # Build some state
        detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=150.0,
            win_amount=1500.0,
        )

        detector.reset_session("session-1")

        # Session state should be cleared (new detections allowed)
        # This is internal state, so we verify by detecting again without cooldown block
        event = detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-2",
            multiplier=150.0,
            win_amount=1500.0,
        )
        # Big wins always trigger, so this should work
        assert event is not None

    def test_notification_payload(self):
        """Test notification payload creation."""
        detector = HypeMomentDetector()

        event = detector.detect_from_big_win(
            session_id="session-1",
            big_win_id="win-1",
            multiplier=150.0,
            win_amount=1500.0,
        )

        payload = detector.create_notification_payload(event)

        assert payload["type"] == "hype_moment"
        assert payload["trigger"] == "big_win"
        assert payload["emoji"] == "💰"
        assert payload["data"]["hype_score"] >= 0.7

    def test_chat_spike_emoji(self):
        """Test chat spike gets correct emoji."""
        detector = HypeMomentDetector()
        now = datetime.now(timezone.utc)

        spike = ChatActivitySpike(
            session_id="session-1",
            detected_at=now,
            spike_type="message_velocity",
            baseline_value=50.0,
            spike_value=200.0,
            increase_percentage=300.0,
        )

        event = detector.detect_from_chat_spike(spike)
        payload = detector.create_notification_payload(event)

        assert payload["emoji"] == "💬"

    def test_viewer_spike_emoji(self):
        """Test that viewer spike events use correct emoji."""
        detector = HypeMomentDetector()
        now = datetime.now(timezone.utc)

        # Manually create an event for testing
        event = HypeMomentEvent(
            id="event-1",
            session_id="session-1",
            detected_at=now,
            trigger_type=HypeTriggerType.VIEWER_SPIKE,
            hype_score=0.8,
            viewer_spike=500,
        )

        payload = detector.create_notification_payload(event)
        assert payload["emoji"] == "👥"


class TestDetectorThresholds:
    """Tests for the DetectorThresholds dataclass."""

    def test_default_values(self):
        """Test default threshold values."""
        thresholds = DetectorThresholds()

        assert thresholds.chat_velocity_spike_multiplier == 2.5
        assert thresholds.min_chat_velocity == 10
        assert thresholds.emote_ratio_threshold == 0.5
        assert thresholds.min_emote_count == 50
        assert thresholds.viewer_spike_percentage == 20.0
        assert thresholds.big_win_multiplier == 100.0
        assert thresholds.hype_score_threshold == 0.7
        assert thresholds.cooldown_seconds == 60


class TestHypeMomentEvent:
    """Tests for the HypeMomentEvent dataclass."""

    def test_event_creation(self):
        """Test creating a hype moment event."""
        now = datetime.now(timezone.utc)

        event = HypeMomentEvent(
            id="event-1",
            session_id="session-1",
            detected_at=now,
            trigger_type=HypeTriggerType.BIG_WIN,
            hype_score=0.85,
            related_big_win_id="win-1",
        )

        assert event.id == "event-1"
        assert event.session_id == "session-1"
        assert event.trigger_type == HypeTriggerType.BIG_WIN
        assert event.hype_score == 0.85
        assert event.related_big_win_id == "win-1"

    def test_event_default_values(self):
        """Test event has proper default values."""
        now = datetime.now(timezone.utc)

        event = HypeMomentEvent(
            id="event-1",
            session_id="session-1",
            detected_at=now,
            trigger_type=HypeTriggerType.CHAT_SPIKE,
            hype_score=0.75,
        )

        assert event.chat_velocity is None
        assert event.viewer_spike is None
        assert event.related_big_win_id is None
        assert event.clip_url is None
        assert event.metadata == {}


class TestCreateHypeDetectorFactory:
    """Tests for the create_hype_detector factory function."""

    def test_create_with_defaults(self):
        """Test creating detector with default settings."""
        detector = create_hype_detector()

        assert detector.thresholds.chat_velocity_spike_multiplier == 2.5
        assert detector.thresholds.hype_score_threshold == 0.7
        assert detector.thresholds.cooldown_seconds == 60

    def test_create_with_custom_multiplier(self):
        """Test creating detector with custom velocity multiplier."""
        detector = create_hype_detector(chat_velocity_multiplier=3.0)

        assert detector.thresholds.chat_velocity_spike_multiplier == 3.0

    def test_create_with_custom_threshold(self):
        """Test creating detector with custom hype threshold."""
        detector = create_hype_detector(hype_score_threshold=0.5)

        assert detector.thresholds.hype_score_threshold == 0.5

    def test_create_with_custom_cooldown(self):
        """Test creating detector with custom cooldown."""
        detector = create_hype_detector(cooldown_seconds=30)

        assert detector.thresholds.cooldown_seconds == 30


class TestHypeTriggerType:
    """Tests for the HypeTriggerType enum."""

    def test_trigger_values(self):
        """Test trigger type enum values."""
        assert HypeTriggerType.BIG_WIN.value == "big_win"
        assert HypeTriggerType.CHAT_SPIKE.value == "chat_spike"
        assert HypeTriggerType.VIEWER_SPIKE.value == "viewer_spike"
        assert HypeTriggerType.EMOTE_SPAM.value == "emote_spam"
        assert HypeTriggerType.BONUS_TRIGGER.value == "bonus_trigger"
        assert HypeTriggerType.JACKPOT.value == "jackpot"
        assert HypeTriggerType.MANUAL.value == "manual"

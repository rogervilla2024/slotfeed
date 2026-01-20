"""
Tests for the ChatAnalyticsService.
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock

from app.services.chat_analytics_service import (
    ChatAnalyticsService,
    ChatAnalyticsConfig,
    ChatBucket,
    create_chat_analytics_service,
)
from app.schemas.chat_analytics import ChatMessage


class TestChatAnalyticsService:
    """Tests for the ChatAnalyticsService class."""

    def test_initialization_default_config(self):
        """Test service initializes with default config."""
        service = ChatAnalyticsService()

        assert service.config.bucket_size_minutes == 5
        assert service.config.hype_threshold == 0.7
        assert service.config.sentiment_enabled is True
        assert service.config.language_detection_enabled is True

    def test_initialization_custom_config(self):
        """Test service initializes with custom config."""
        config = ChatAnalyticsConfig(
            bucket_size_minutes=10,
            hype_threshold=0.5,
            sentiment_enabled=False,
        )
        service = ChatAnalyticsService(config)

        assert service.config.bucket_size_minutes == 10
        assert service.config.hype_threshold == 0.5
        assert service.config.sentiment_enabled is False

    def test_process_single_message(self):
        """Test processing a single chat message."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        message = ChatMessage(
            id="msg-1",
            session_id="session-1",
            username="user123",
            message="Hello world!",
            timestamp=now,
            is_subscriber=False,
            is_moderator=False,
            emotes=[],
            badges=[],
        )

        result = service.process_message(message)

        # First message shouldn't trigger a spike
        assert result is None

        # Check bucket was created
        bucket = service.get_active_bucket("session-1")
        assert bucket is not None
        assert bucket.message_count == 1
        assert "user123" in bucket.usernames

    def test_process_multiple_messages(self):
        """Test processing multiple messages accumulates correctly."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        for i in range(10):
            message = ChatMessage(
                id=f"msg-{i}",
                session_id="session-1",
                username=f"user{i}",
                message="Test message",
                timestamp=now,
                is_subscriber=False,
                is_moderator=False,
                emotes=[],
                badges=[],
            )
            service.process_message(message)

        bucket = service.get_active_bucket("session-1")
        assert bucket.message_count == 10
        assert bucket.unique_chatters == 10

    def test_emote_extraction(self):
        """Test that emotes are extracted from messages."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        message = ChatMessage(
            id="msg-1",
            session_id="session-1",
            username="user1",
            message="This is so funny KEKW LUL",
            timestamp=now,
            is_subscriber=False,
            is_moderator=False,
            emotes=["PogChamp"],
            badges=[],
        )

        service.process_message(message)

        bucket = service.get_active_bucket("session-1")
        assert bucket.emote_count > 0
        # Check that at least one emote was found
        assert "KEKW" in bucket.emote_counts or "LUL" in bucket.emote_counts or "PogChamp" in bucket.emote_counts

    def test_sentiment_analysis_positive(self):
        """Test positive sentiment detection."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        message = ChatMessage(
            id="msg-1",
            session_id="session-1",
            username="user1",
            message="This is amazing great win nice",
            timestamp=now,
            is_subscriber=False,
            is_moderator=False,
            emotes=[],
            badges=[],
        )

        service.process_message(message)

        bucket = service.get_active_bucket("session-1")
        assert len(bucket.sentiment_scores) == 1
        # Positive words should result in positive sentiment
        assert bucket.sentiment_scores[0] > 0

    def test_sentiment_analysis_negative(self):
        """Test negative sentiment detection."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        message = ChatMessage(
            id="msg-1",
            session_id="session-1",
            username="user1",
            message="This is bad trash garbage rip",
            timestamp=now,
            is_subscriber=False,
            is_moderator=False,
            emotes=[],
            badges=[],
        )

        service.process_message(message)

        bucket = service.get_active_bucket("session-1")
        assert len(bucket.sentiment_scores) == 1
        # Negative words should result in negative sentiment
        assert bucket.sentiment_scores[0] < 0

    def test_sentiment_analysis_neutral(self):
        """Test neutral sentiment for neutral text."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        message = ChatMessage(
            id="msg-1",
            session_id="session-1",
            username="user1",
            message="The stream is starting now",
            timestamp=now,
            is_subscriber=False,
            is_moderator=False,
            emotes=[],
            badges=[],
        )

        service.process_message(message)

        bucket = service.get_active_bucket("session-1")
        assert len(bucket.sentiment_scores) == 1
        assert bucket.sentiment_scores[0] == 0.0

    def test_bucket_rotation(self):
        """Test that buckets rotate after bucket size exceeded."""
        config = ChatAnalyticsConfig(bucket_size_minutes=5)
        service = ChatAnalyticsService(config)

        # First message
        time1 = datetime.now(timezone.utc)
        msg1 = ChatMessage(
            id="msg-1",
            session_id="session-1",
            username="user1",
            message="First",
            timestamp=time1,
            is_subscriber=False,
            is_moderator=False,
            emotes=[],
            badges=[],
        )
        service.process_message(msg1)

        # Message 6 minutes later (new bucket)
        time2 = time1 + timedelta(minutes=6)
        msg2 = ChatMessage(
            id="msg-2",
            session_id="session-1",
            username="user2",
            message="Second",
            timestamp=time2,
            is_subscriber=False,
            is_moderator=False,
            emotes=[],
            badges=[],
        )
        service.process_message(msg2)

        bucket = service.get_active_bucket("session-1")
        # New bucket should only have the second message
        assert bucket.message_count == 1
        assert "user2" in bucket.usernames

    def test_live_stats_no_bucket(self):
        """Test live stats returns None for unknown session."""
        service = ChatAnalyticsService()
        stats = service.get_live_stats("unknown-session")
        assert stats is None

    def test_live_stats_with_bucket(self):
        """Test live stats returns data for active session."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        for i in range(5):
            message = ChatMessage(
                id=f"msg-{i}",
                session_id="session-1",
                username=f"user{i}",
                message="Test KEKW",
                timestamp=now,
                is_subscriber=False,
                is_moderator=False,
                emotes=[],
                badges=[],
            )
            service.process_message(message)

        stats = service.get_live_stats("session-1")
        assert stats is not None
        assert stats.session_id == "session-1"
        assert stats.unique_chatters_5min == 5

    def test_clear_session(self):
        """Test clearing session data."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        message = ChatMessage(
            id="msg-1",
            session_id="session-1",
            username="user1",
            message="Test",
            timestamp=now,
            is_subscriber=False,
            is_moderator=False,
            emotes=[],
            badges=[],
        )
        service.process_message(message)

        assert service.get_active_bucket("session-1") is not None

        service.clear_session("session-1")

        assert service.get_active_bucket("session-1") is None

    def test_stats_tracking(self):
        """Test that service stats are tracked."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        for i in range(5):
            message = ChatMessage(
                id=f"msg-{i}",
                session_id="session-1",
                username=f"user{i}",
                message="Test",
                timestamp=now,
                is_subscriber=False,
                is_moderator=False,
                emotes=[],
                badges=[],
            )
            service.process_message(message)

        stats = service.get_stats()
        assert stats["total_messages_processed"] == 5

    def test_process_batch(self):
        """Test processing a batch of messages."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        messages = [
            ChatMessage(
                id=f"msg-{i}",
                session_id="session-1",
                username=f"user{i}",
                message="Test",
                timestamp=now,
                is_subscriber=False,
                is_moderator=False,
                emotes=[],
                badges=[],
            )
            for i in range(10)
        ]

        spikes = service.process_messages_batch(messages)

        # Batch processing should work
        bucket = service.get_active_bucket("session-1")
        assert bucket.message_count == 10

    def test_same_user_multiple_messages(self):
        """Test that same user is only counted once in unique chatters."""
        service = ChatAnalyticsService()
        now = datetime.now(timezone.utc)

        for i in range(5):
            message = ChatMessage(
                id=f"msg-{i}",
                session_id="session-1",
                username="same_user",
                message="Test",
                timestamp=now,
                is_subscriber=False,
                is_moderator=False,
                emotes=[],
                badges=[],
            )
            service.process_message(message)

        bucket = service.get_active_bucket("session-1")
        assert bucket.message_count == 5
        assert bucket.unique_chatters == 1


class TestChatBucket:
    """Tests for the ChatBucket dataclass."""

    def test_bucket_creation(self):
        """Test creating a chat bucket."""
        now = datetime.now(timezone.utc)
        bucket = ChatBucket(
            session_id="session-1",
            bucket_start=now,
            bucket_end=now + timedelta(minutes=5),
        )

        assert bucket.session_id == "session-1"
        assert bucket.message_count == 0
        assert bucket.unique_chatters == 0
        assert bucket.emote_count == 0
        assert bucket.avg_sentiment is None

    def test_bucket_avg_sentiment_calculation(self):
        """Test average sentiment calculation."""
        now = datetime.now(timezone.utc)
        bucket = ChatBucket(
            session_id="session-1",
            bucket_start=now,
            bucket_end=now + timedelta(minutes=5),
        )

        bucket.sentiment_scores.extend([0.5, 0.3, 0.2])
        assert bucket.avg_sentiment == pytest.approx(0.333, rel=0.01)


class TestCreateChatAnalyticsServiceFactory:
    """Tests for the create_chat_analytics_service factory function."""

    def test_create_with_defaults(self):
        """Test creating service with default settings."""
        service = create_chat_analytics_service()

        assert service.config.bucket_size_minutes == 5
        assert service.config.hype_threshold == 0.7

    def test_create_with_custom_bucket_size(self):
        """Test creating service with custom bucket size."""
        service = create_chat_analytics_service(bucket_size_minutes=10)

        assert service.config.bucket_size_minutes == 10

    def test_create_with_custom_hype_threshold(self):
        """Test creating service with custom hype threshold."""
        service = create_chat_analytics_service(hype_threshold=0.5)

        assert service.config.hype_threshold == 0.5


class TestChatAnalyticsConfig:
    """Tests for the ChatAnalyticsConfig dataclass."""

    def test_default_values(self):
        """Test default config values."""
        config = ChatAnalyticsConfig()

        assert config.bucket_size_minutes == 5
        assert config.hype_threshold == 0.7
        assert config.sentiment_enabled is True
        assert config.language_detection_enabled is True
        assert config.spike_detection_multiplier == 2.0
        assert config.baseline_window_minutes == 30

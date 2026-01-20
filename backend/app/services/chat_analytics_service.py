"""
Chat Analytics Service

Handles processing and analysis of chat data from live streams:
- Message aggregation into 5-minute buckets
- Sentiment analysis
- Emote tracking
- Language detection
- Real-time statistics

Features:
- Sliding window analysis for real-time metrics
- Configurable bucket sizes
- Redis caching for live stats
- Database storage for historical data
"""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Set
from uuid import uuid4
from dataclasses import dataclass, field
from collections import defaultdict
import re

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import ChatAnalytics, Session
from ..schemas.chat_analytics import (
    ChatMessage,
    ChatAnalyticsBucketCreate,
    ChatAnalyticsSessionStats,
    LiveChatStats,
    SentimentLevel,
    ChatActivitySpike,
)


@dataclass
class ChatBucket:
    """In-memory bucket for accumulating chat data."""
    session_id: str
    bucket_start: datetime
    bucket_end: datetime
    messages: List[ChatMessage] = field(default_factory=list)
    usernames: Set[str] = field(default_factory=set)
    emote_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    language_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    sentiment_scores: List[float] = field(default_factory=list)

    @property
    def message_count(self) -> int:
        return len(self.messages)

    @property
    def unique_chatters(self) -> int:
        return len(self.usernames)

    @property
    def emote_count(self) -> int:
        return sum(self.emote_counts.values())

    @property
    def avg_sentiment(self) -> Optional[float]:
        if not self.sentiment_scores:
            return None
        return sum(self.sentiment_scores) / len(self.sentiment_scores)


@dataclass
class ChatAnalyticsConfig:
    """Configuration for chat analytics processing."""
    bucket_size_minutes: int = 5
    hype_threshold: float = 0.7
    sentiment_enabled: bool = True
    language_detection_enabled: bool = True
    spike_detection_multiplier: float = 2.0
    baseline_window_minutes: int = 30


class ChatAnalyticsService:
    """
    Service for processing and analyzing chat data from live streams.

    Handles:
    - Real-time message processing
    - 5-minute bucket aggregation
    - Sentiment analysis
    - Emote and language tracking
    - Spike detection
    """

    # Common emote patterns (can be extended)
    EMOTE_PATTERNS = [
        r':\w+:',  # Discord/Slack style :emote:
        r'\b(LUL|KEKW|PogChamp|Pog|OMEGALUL|LULW|Kappa|monkaS|monkaW|PepeLaugh|POGGERS|Sadge|Copium|COPIUM|EZ|GG|W|L)\b',
    ]

    # Positive/negative word lists for simple sentiment analysis
    POSITIVE_WORDS = {'win', 'nice', 'good', 'great', 'amazing', 'pog', 'poggers', 'lets go', 'gg', 'w', 'huge', 'insane', 'crazy', 'ez', 'clutch'}
    NEGATIVE_WORDS = {'lose', 'bad', 'rip', 'f', 'sad', 'sadge', 'unlucky', 'scam', 'rigged', 'trash', 'garbage', 'l', 'dead'}

    def __init__(self, config: Optional[ChatAnalyticsConfig] = None):
        """
        Initialize the ChatAnalyticsService.

        Args:
            config: Service configuration. Uses defaults if not provided.
        """
        self.config = config or ChatAnalyticsConfig()
        self._active_buckets: Dict[str, ChatBucket] = {}  # session_id -> bucket
        self._session_baselines: Dict[str, Dict[str, float]] = {}  # session_id -> metrics
        self._compiled_emote_patterns = [re.compile(p, re.IGNORECASE) for p in self.EMOTE_PATTERNS]

        # Stats
        self._stats = {
            "total_messages_processed": 0,
            "total_buckets_created": 0,
            "total_spikes_detected": 0,
        }

    def process_message(
        self,
        message: ChatMessage,
    ) -> Optional[ChatActivitySpike]:
        """
        Process a single chat message.

        Args:
            message: The chat message to process

        Returns:
            ChatActivitySpike if a spike is detected, None otherwise
        """
        session_id = message.session_id

        # Get or create bucket for this session
        bucket = self._get_or_create_bucket(session_id, message.timestamp)

        # Check if we need to rotate to a new bucket
        if message.timestamp >= bucket.bucket_end:
            # Finalize current bucket
            self._finalize_bucket(bucket)
            # Create new bucket
            bucket = self._create_bucket(session_id, message.timestamp)
            self._active_buckets[session_id] = bucket

        # Add message to bucket
        bucket.messages.append(message)
        bucket.usernames.add(message.username)

        # Extract and count emotes
        emotes = self._extract_emotes(message.message)
        emotes.extend(message.emotes)  # Add platform-provided emotes
        for emote in emotes:
            bucket.emote_counts[emote] += 1

        # Analyze sentiment
        if self.config.sentiment_enabled:
            sentiment = self._analyze_sentiment(message.message)
            bucket.sentiment_scores.append(sentiment)

        # Update stats
        self._stats["total_messages_processed"] += 1

        # Check for activity spike
        spike = self._detect_spike(session_id, bucket)
        if spike:
            self._stats["total_spikes_detected"] += 1

        return spike

    def process_messages_batch(
        self,
        messages: List[ChatMessage],
    ) -> List[ChatActivitySpike]:
        """
        Process a batch of chat messages.

        Args:
            messages: List of chat messages to process

        Returns:
            List of detected activity spikes
        """
        spikes = []
        for message in messages:
            spike = self.process_message(message)
            if spike:
                spikes.append(spike)
        return spikes

    def get_live_stats(self, session_id: str) -> Optional[LiveChatStats]:
        """
        Get real-time chat statistics for a session.

        Args:
            session_id: ID of the session

        Returns:
            LiveChatStats if session is active, None otherwise
        """
        bucket = self._active_buckets.get(session_id)
        if not bucket:
            return None

        now = datetime.now(timezone.utc)
        bucket_duration = (now - bucket.bucket_start).total_seconds() / 60
        messages_per_minute = int(bucket.message_count / max(bucket_duration, 0.1))

        # Get top 5 trending emotes
        sorted_emotes = sorted(
            bucket.emote_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        trending_emotes = [emote for emote, _ in sorted_emotes]

        # Calculate hype score based on activity
        hype_score = self._calculate_hype_score(bucket, messages_per_minute)

        return LiveChatStats(
            session_id=session_id,
            streamer_id="",  # Would be populated from session lookup
            timestamp=now,
            messages_per_minute=messages_per_minute,
            unique_chatters_5min=bucket.unique_chatters,
            current_sentiment=bucket.avg_sentiment,
            current_hype_score=hype_score,
            trending_emotes=trending_emotes,
            is_hype_moment=hype_score is not None and hype_score >= self.config.hype_threshold,
        )

    async def store_bucket(
        self,
        bucket: ChatBucket,
        db: AsyncSession,
    ) -> ChatAnalytics:
        """
        Store a finalized chat bucket to the database.

        Args:
            bucket: The chat bucket to store
            db: Database session

        Returns:
            The created ChatAnalytics record
        """
        # Calculate hype score
        bucket_duration = (bucket.bucket_end - bucket.bucket_start).total_seconds() / 60
        messages_per_minute = bucket.message_count / max(bucket_duration, 0.1)
        hype_score = self._calculate_hype_score(bucket, messages_per_minute)

        # Prepare top emotes (top 10)
        sorted_emotes = sorted(
            bucket.emote_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        top_emotes = dict(sorted_emotes) if sorted_emotes else None

        # Prepare language distribution
        language_dist = dict(bucket.language_counts) if bucket.language_counts else None

        chat_analytics = ChatAnalytics(
            id=str(uuid4()),
            session_id=bucket.session_id,
            bucket_start=bucket.bucket_start,
            bucket_end=bucket.bucket_end,
            message_count=bucket.message_count,
            unique_chatters=bucket.unique_chatters,
            emote_count=bucket.emote_count,
            sentiment_score=bucket.avg_sentiment,
            hype_score=hype_score,
            top_emotes=top_emotes,
            language_distribution=language_dist,
        )

        db.add(chat_analytics)
        await db.commit()
        await db.refresh(chat_analytics)

        self._stats["total_buckets_created"] += 1

        return chat_analytics

    async def get_session_stats(
        self,
        session_id: str,
        db: AsyncSession,
    ) -> ChatAnalyticsSessionStats:
        """
        Get aggregated chat statistics for a session.

        Args:
            session_id: ID of the session
            db: Database session

        Returns:
            Aggregated session statistics
        """
        # Query all buckets for this session
        result = await db.execute(
            select(ChatAnalytics)
            .where(ChatAnalytics.session_id == session_id)
            .order_by(ChatAnalytics.bucket_start)
        )
        buckets = result.scalars().all()

        if not buckets:
            return ChatAnalyticsSessionStats(session_id=session_id)

        # Aggregate stats
        total_messages = sum(b.message_count for b in buckets)
        total_emotes = sum(b.emote_count for b in buckets)
        all_chatters: Set[str] = set()  # Would need to track this differently in practice

        # Calculate averages
        sentiment_scores = [b.sentiment_score for b in buckets if b.sentiment_score is not None]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else None

        hype_scores = [b.hype_score for b in buckets if b.hype_score is not None]
        peak_hype = max(hype_scores) if hype_scores else None

        peak_mpm = max(b.message_count for b in buckets) // 5 if buckets else 0  # 5-minute buckets

        # Aggregate emotes
        all_emotes: Dict[str, int] = defaultdict(int)
        for bucket in buckets:
            if bucket.top_emotes:
                for emote, count in bucket.top_emotes.items():
                    all_emotes[emote] += count

        sorted_emotes = dict(sorted(all_emotes.items(), key=lambda x: x[1], reverse=True)[:20])

        # Aggregate language distribution
        all_languages: Dict[str, int] = defaultdict(int)
        for bucket in buckets:
            if bucket.language_distribution:
                for lang, count in bucket.language_distribution.items():
                    all_languages[lang] += count

        return ChatAnalyticsSessionStats(
            session_id=session_id,
            total_messages=total_messages,
            unique_chatters=len(all_chatters),  # Approximate
            total_emotes=total_emotes,
            avg_sentiment=avg_sentiment,
            peak_hype_score=peak_hype,
            peak_messages_per_minute=peak_mpm,
            top_emotes=sorted_emotes,
            language_distribution=dict(all_languages),
            hype_moments_count=0,  # Would be counted from hype_moments table
        )

    async def get_buckets(
        self,
        session_id: str,
        db: AsyncSession,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[ChatAnalytics]:
        """
        Get chat analytics buckets for a session.

        Args:
            session_id: ID of the session
            db: Database session
            start_time: Optional start time filter
            end_time: Optional end time filter
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            List of ChatAnalytics records
        """
        query = select(ChatAnalytics).where(
            ChatAnalytics.session_id == session_id
        )

        if start_time:
            query = query.where(ChatAnalytics.bucket_start >= start_time)
        if end_time:
            query = query.where(ChatAnalytics.bucket_end <= end_time)

        query = query.order_by(ChatAnalytics.bucket_start.desc())
        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        return list(result.scalars().all())

    def get_active_bucket(self, session_id: str) -> Optional[ChatBucket]:
        """Get the active bucket for a session."""
        return self._active_buckets.get(session_id)

    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics."""
        return self._stats.copy()

    def clear_session(self, session_id: str) -> None:
        """Clear all data for a session."""
        self._active_buckets.pop(session_id, None)
        self._session_baselines.pop(session_id, None)

    # ============= Private Methods =============

    def _get_or_create_bucket(
        self,
        session_id: str,
        timestamp: datetime,
    ) -> ChatBucket:
        """Get existing bucket or create new one for timestamp."""
        bucket = self._active_buckets.get(session_id)

        if bucket is None or timestamp >= bucket.bucket_end:
            bucket = self._create_bucket(session_id, timestamp)
            self._active_buckets[session_id] = bucket

        return bucket

    def _create_bucket(
        self,
        session_id: str,
        timestamp: datetime,
    ) -> ChatBucket:
        """Create a new bucket starting at the given timestamp."""
        bucket_minutes = self.config.bucket_size_minutes

        # Align bucket start to bucket boundary
        minute = timestamp.minute - (timestamp.minute % bucket_minutes)
        bucket_start = timestamp.replace(minute=minute, second=0, microsecond=0)
        bucket_end = bucket_start + timedelta(minutes=bucket_minutes)

        return ChatBucket(
            session_id=session_id,
            bucket_start=bucket_start,
            bucket_end=bucket_end,
        )

    def _finalize_bucket(self, bucket: ChatBucket) -> None:
        """Finalize a bucket (called when rotating to new bucket)."""
        # Update session baselines
        session_id = bucket.session_id
        if session_id not in self._session_baselines:
            self._session_baselines[session_id] = {
                "messages_per_minute": [],
                "unique_chatters": [],
            }

        bucket_duration = (bucket.bucket_end - bucket.bucket_start).total_seconds() / 60
        mpm = bucket.message_count / max(bucket_duration, 0.1)

        baselines = self._session_baselines[session_id]
        baselines["messages_per_minute"].append(mpm)
        baselines["unique_chatters"].append(bucket.unique_chatters)

        # Keep only last N buckets for baseline
        max_history = self.config.baseline_window_minutes // self.config.bucket_size_minutes
        for key in baselines:
            if len(baselines[key]) > max_history:
                baselines[key] = baselines[key][-max_history:]

    def _extract_emotes(self, text: str) -> List[str]:
        """Extract emotes from message text."""
        emotes = []
        for pattern in self._compiled_emote_patterns:
            matches = pattern.findall(text)
            emotes.extend(matches)
        return emotes

    def _analyze_sentiment(self, text: str) -> float:
        """
        Simple sentiment analysis based on word matching.
        Returns score from -1 (negative) to 1 (positive).
        """
        text_lower = text.lower()
        words = set(text_lower.split())

        positive_count = len(words & self.POSITIVE_WORDS)
        negative_count = len(words & self.NEGATIVE_WORDS)

        total = positive_count + negative_count
        if total == 0:
            return 0.0

        return (positive_count - negative_count) / total

    def _calculate_hype_score(
        self,
        bucket: ChatBucket,
        messages_per_minute: float,
    ) -> Optional[float]:
        """
        Calculate hype score based on various metrics.
        Returns score from 0 to 1.
        """
        if bucket.message_count == 0:
            return 0.0

        session_id = bucket.session_id
        baselines = self._session_baselines.get(session_id, {})

        # Get baseline MPM
        baseline_mpm_history = baselines.get("messages_per_minute", [])
        if baseline_mpm_history:
            baseline_mpm = sum(baseline_mpm_history) / len(baseline_mpm_history)
        else:
            baseline_mpm = messages_per_minute

        # Calculate activity ratio
        activity_ratio = messages_per_minute / max(baseline_mpm, 1) if baseline_mpm > 0 else 1

        # Emote ratio (emotes indicate excitement)
        emote_ratio = bucket.emote_count / max(bucket.message_count, 1)

        # Sentiment factor (positive sentiment increases hype)
        sentiment = bucket.avg_sentiment or 0
        sentiment_factor = (sentiment + 1) / 2  # Convert -1..1 to 0..1

        # Combine factors with weights
        hype_score = (
            0.5 * min(activity_ratio / 2, 1) +  # Activity spike (max 2x baseline = 1.0)
            0.3 * min(emote_ratio * 2, 1) +     # Emote usage
            0.2 * sentiment_factor               # Sentiment
        )

        return min(hype_score, 1.0)

    def _detect_spike(
        self,
        session_id: str,
        bucket: ChatBucket,
    ) -> Optional[ChatActivitySpike]:
        """Detect if current activity represents a spike."""
        baselines = self._session_baselines.get(session_id, {})
        baseline_mpm_history = baselines.get("messages_per_minute", [])

        if not baseline_mpm_history:
            return None

        baseline_mpm = sum(baseline_mpm_history) / len(baseline_mpm_history)

        # Calculate current MPM
        now = datetime.now(timezone.utc)
        bucket_duration = (now - bucket.bucket_start).total_seconds() / 60
        current_mpm = bucket.message_count / max(bucket_duration, 0.1)

        # Check if it's a spike
        if current_mpm > baseline_mpm * self.config.spike_detection_multiplier:
            increase_pct = ((current_mpm - baseline_mpm) / baseline_mpm) * 100

            return ChatActivitySpike(
                session_id=session_id,
                detected_at=now,
                spike_type="message_velocity",
                baseline_value=baseline_mpm,
                spike_value=current_mpm,
                increase_percentage=increase_pct,
            )

        return None


def create_chat_analytics_service(
    bucket_size_minutes: int = 5,
    hype_threshold: float = 0.7,
) -> ChatAnalyticsService:
    """
    Factory function to create a ChatAnalyticsService with custom configuration.

    Args:
        bucket_size_minutes: Size of analytics buckets in minutes
        hype_threshold: Threshold for hype moment detection

    Returns:
        Configured ChatAnalyticsService instance
    """
    config = ChatAnalyticsConfig(
        bucket_size_minutes=bucket_size_minutes,
        hype_threshold=hype_threshold,
    )
    return ChatAnalyticsService(config)

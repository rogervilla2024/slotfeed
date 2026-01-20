"""
Hype Moment Detection Service

Automatically detects significant moments during slot streaming sessions:
- Chat activity spikes
- Big win occurrences
- Viewer count spikes
- Emote spam waves
- Bonus triggers

Features:
- Multi-signal detection
- Configurable thresholds
- Redis real-time notifications
- Database storage
- Clip URL integration
"""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from uuid import uuid4
from dataclasses import dataclass, field
from enum import Enum
from collections import deque

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from ..models import HypeMoment, Session, BigWin
from ..schemas.chat_analytics import (
    HypeTriggerType,
    HypeMomentCreate,
    ChatActivitySpike,
    LiveChatStats,
)


@dataclass
class DetectorThresholds:
    """Thresholds for hype moment detection."""
    # Chat velocity thresholds
    chat_velocity_spike_multiplier: float = 2.5  # x times baseline
    min_chat_velocity: int = 10  # Minimum messages/second to consider

    # Emote spam thresholds
    emote_ratio_threshold: float = 0.5  # Emote ratio in messages
    min_emote_count: int = 50  # Minimum emotes in window

    # Viewer spike thresholds
    viewer_spike_percentage: float = 20.0  # % increase to trigger

    # Big win thresholds (from BigWinDetector)
    big_win_multiplier: float = 100.0

    # Hype score thresholds
    hype_score_threshold: float = 0.7

    # Cooldown between detections (same type)
    cooldown_seconds: int = 60


@dataclass
class HypeMomentEvent:
    """Represents a detected hype moment event."""
    id: str
    session_id: str
    detected_at: datetime
    trigger_type: HypeTriggerType
    hype_score: float
    chat_velocity: Optional[int] = None
    viewer_spike: Optional[int] = None
    related_big_win_id: Optional[str] = None
    clip_url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionState:
    """Tracking state for a streaming session."""
    session_id: str
    baseline_chat_velocity: float = 0.0
    baseline_viewers: int = 0
    chat_velocity_history: deque = field(default_factory=lambda: deque(maxlen=30))
    viewer_history: deque = field(default_factory=lambda: deque(maxlen=30))
    last_detections: Dict[str, datetime] = field(default_factory=dict)
    total_hype_moments: int = 0


class HypeMomentDetector:
    """
    Detects and records hype moments from slot streaming sessions.

    Monitors multiple signals to identify significant moments that
    warrant special attention, clips, or notifications.
    """

    def __init__(self, thresholds: Optional[DetectorThresholds] = None):
        """
        Initialize the HypeMomentDetector.

        Args:
            thresholds: Detection thresholds. Uses defaults if not provided.
        """
        self.thresholds = thresholds or DetectorThresholds()
        self._session_states: Dict[str, SessionState] = {}
        self._pending_events: List[HypeMomentEvent] = []
        self._stats = {
            "total_detected": 0,
            "by_trigger": {t.value: 0 for t in HypeTriggerType},
            "highest_hype_score": 0.0,
        }

    def detect_from_chat_stats(
        self,
        session_id: str,
        chat_stats: LiveChatStats,
    ) -> Optional[HypeMomentEvent]:
        """
        Detect hype moment from live chat statistics.

        Args:
            session_id: ID of the streaming session
            chat_stats: Current live chat statistics

        Returns:
            HypeMomentEvent if detected, None otherwise
        """
        state = self._get_or_create_state(session_id)
        now = chat_stats.timestamp

        # Update velocity history
        state.chat_velocity_history.append(chat_stats.messages_per_minute)

        # Update baseline (exponential moving average)
        if state.baseline_chat_velocity == 0:
            state.baseline_chat_velocity = chat_stats.messages_per_minute
        else:
            alpha = 0.1  # Smoothing factor
            state.baseline_chat_velocity = (
                alpha * chat_stats.messages_per_minute +
                (1 - alpha) * state.baseline_chat_velocity
            )

        # Check for chat spike
        if self._check_cooldown(state, HypeTriggerType.CHAT_SPIKE):
            if chat_stats.messages_per_minute > state.baseline_chat_velocity * self.thresholds.chat_velocity_spike_multiplier:
                return self._create_event(
                    session_id=session_id,
                    trigger_type=HypeTriggerType.CHAT_SPIKE,
                    hype_score=chat_stats.current_hype_score or 0.8,
                    chat_velocity=chat_stats.messages_per_minute,
                    detected_at=now,
                    state=state,
                )

        # Check for high hype score
        if chat_stats.current_hype_score and chat_stats.current_hype_score >= self.thresholds.hype_score_threshold:
            if self._check_cooldown(state, HypeTriggerType.CHAT_SPIKE):
                return self._create_event(
                    session_id=session_id,
                    trigger_type=HypeTriggerType.CHAT_SPIKE,
                    hype_score=chat_stats.current_hype_score,
                    chat_velocity=chat_stats.messages_per_minute,
                    detected_at=now,
                    state=state,
                )

        return None

    def detect_from_chat_spike(
        self,
        spike: ChatActivitySpike,
    ) -> Optional[HypeMomentEvent]:
        """
        Detect hype moment from a chat activity spike.

        Args:
            spike: Detected chat activity spike

        Returns:
            HypeMomentEvent if detected, None otherwise
        """
        state = self._get_or_create_state(spike.session_id)

        if not self._check_cooldown(state, HypeTriggerType.CHAT_SPIKE):
            return None

        # Calculate hype score from spike intensity
        hype_score = min(spike.increase_percentage / 200, 1.0)  # 200% increase = 1.0

        if hype_score >= self.thresholds.hype_score_threshold:
            return self._create_event(
                session_id=spike.session_id,
                trigger_type=HypeTriggerType.CHAT_SPIKE,
                hype_score=hype_score,
                chat_velocity=int(spike.spike_value),
                detected_at=spike.detected_at,
                state=state,
            )

        return None

    def detect_from_big_win(
        self,
        session_id: str,
        big_win_id: str,
        multiplier: float,
        win_amount: float,
    ) -> HypeMomentEvent:
        """
        Detect hype moment from a big win event.

        Args:
            session_id: ID of the streaming session
            big_win_id: ID of the big win
            multiplier: Win multiplier
            win_amount: Total win amount

        Returns:
            HypeMomentEvent (big wins always trigger hype)
        """
        state = self._get_or_create_state(session_id)
        now = datetime.now(timezone.utc)

        # Calculate hype score based on multiplier
        # 100x = 0.7, 500x = 0.85, 1000x = 0.95, 5000x+ = 1.0
        if multiplier >= 5000:
            hype_score = 1.0
        elif multiplier >= 1000:
            hype_score = 0.95
        elif multiplier >= 500:
            hype_score = 0.85
        else:
            hype_score = 0.7 + (multiplier - 100) / 2000 * 0.15

        return self._create_event(
            session_id=session_id,
            trigger_type=HypeTriggerType.BIG_WIN,
            hype_score=min(hype_score, 1.0),
            related_big_win_id=big_win_id,
            detected_at=now,
            state=state,
            metadata={"multiplier": multiplier, "win_amount": win_amount},
        )

    def detect_from_viewer_spike(
        self,
        session_id: str,
        current_viewers: int,
    ) -> Optional[HypeMomentEvent]:
        """
        Detect hype moment from a viewer count spike.

        Args:
            session_id: ID of the streaming session
            current_viewers: Current viewer count

        Returns:
            HypeMomentEvent if detected, None otherwise
        """
        state = self._get_or_create_state(session_id)
        now = datetime.now(timezone.utc)

        # Update viewer history
        state.viewer_history.append(current_viewers)

        # Update baseline
        if state.baseline_viewers == 0:
            state.baseline_viewers = current_viewers
        else:
            alpha = 0.1
            state.baseline_viewers = int(
                alpha * current_viewers +
                (1 - alpha) * state.baseline_viewers
            )

        # Check for spike
        if state.baseline_viewers > 0 and self._check_cooldown(state, HypeTriggerType.VIEWER_SPIKE):
            increase_pct = ((current_viewers - state.baseline_viewers) / state.baseline_viewers) * 100

            if increase_pct >= self.thresholds.viewer_spike_percentage:
                hype_score = min(increase_pct / 100, 1.0)

                return self._create_event(
                    session_id=session_id,
                    trigger_type=HypeTriggerType.VIEWER_SPIKE,
                    hype_score=hype_score,
                    viewer_spike=current_viewers - state.baseline_viewers,
                    detected_at=now,
                    state=state,
                )

        return None

    def detect_from_emote_spam(
        self,
        session_id: str,
        emote_count: int,
        message_count: int,
    ) -> Optional[HypeMomentEvent]:
        """
        Detect hype moment from emote spam.

        Args:
            session_id: ID of the streaming session
            emote_count: Number of emotes in time window
            message_count: Number of messages in time window

        Returns:
            HypeMomentEvent if detected, None otherwise
        """
        state = self._get_or_create_state(session_id)
        now = datetime.now(timezone.utc)

        if message_count == 0 or not self._check_cooldown(state, HypeTriggerType.EMOTE_SPAM):
            return None

        emote_ratio = emote_count / message_count

        if (emote_ratio >= self.thresholds.emote_ratio_threshold and
            emote_count >= self.thresholds.min_emote_count):

            hype_score = min(emote_ratio * 1.5, 1.0)

            return self._create_event(
                session_id=session_id,
                trigger_type=HypeTriggerType.EMOTE_SPAM,
                hype_score=hype_score,
                detected_at=now,
                state=state,
                metadata={"emote_count": emote_count, "emote_ratio": emote_ratio},
            )

        return None

    async def store_hype_moment(
        self,
        event: HypeMomentEvent,
        db: AsyncSession,
    ) -> HypeMoment:
        """
        Store a hype moment event in the database.

        Args:
            event: The hype moment event to store
            db: Database session

        Returns:
            The created HypeMoment database model
        """
        hype_moment = HypeMoment(
            id=event.id,
            session_id=event.session_id,
            detected_at=event.detected_at,
            trigger_type=event.trigger_type.value,
            hype_score=event.hype_score,
            related_big_win_id=event.related_big_win_id,
            chat_velocity=event.chat_velocity,
            viewer_spike=event.viewer_spike,
            clip_url=event.clip_url,
        )

        db.add(hype_moment)
        await db.commit()
        await db.refresh(hype_moment)

        # Remove from pending
        self._pending_events = [e for e in self._pending_events if e.id != event.id]

        return hype_moment

    async def get_hype_moments(
        self,
        db: AsyncSession,
        session_id: Optional[str] = None,
        streamer_id: Optional[str] = None,
        trigger_type: Optional[HypeTriggerType] = None,
        min_hype_score: Optional[float] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[HypeMoment]:
        """
        Retrieve hype moments from the database.

        Args:
            db: Database session
            session_id: Filter by session ID
            streamer_id: Filter by streamer ID (via session)
            trigger_type: Filter by trigger type
            min_hype_score: Minimum hype score filter
            start_time: Start time filter
            end_time: End time filter
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            List of HypeMoment records
        """
        query = select(HypeMoment).order_by(HypeMoment.detected_at.desc())

        if session_id:
            query = query.where(HypeMoment.session_id == session_id)
        if trigger_type:
            query = query.where(HypeMoment.trigger_type == trigger_type.value)
        if min_hype_score is not None:
            query = query.where(HypeMoment.hype_score >= min_hype_score)
        if start_time:
            query = query.where(HypeMoment.detected_at >= start_time)
        if end_time:
            query = query.where(HypeMoment.detected_at <= end_time)

        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_session_hype_summary(
        self,
        session_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Get a summary of hype moments for a session.

        Args:
            session_id: ID of the session
            db: Database session

        Returns:
            Dictionary with hype moment summary
        """
        result = await db.execute(
            select(HypeMoment)
            .where(HypeMoment.session_id == session_id)
            .order_by(HypeMoment.detected_at)
        )
        moments = result.scalars().all()

        if not moments:
            return {
                "session_id": session_id,
                "total_moments": 0,
                "by_trigger": {},
                "highest_hype_score": None,
                "timeline": [],
            }

        by_trigger: Dict[str, int] = {}
        for moment in moments:
            trigger = moment.trigger_type
            by_trigger[trigger] = by_trigger.get(trigger, 0) + 1

        highest = max(m.hype_score for m in moments if m.hype_score)

        timeline = [
            {
                "id": m.id,
                "detected_at": m.detected_at.isoformat(),
                "trigger_type": m.trigger_type,
                "hype_score": float(m.hype_score) if m.hype_score else None,
            }
            for m in moments
        ]

        return {
            "session_id": session_id,
            "total_moments": len(moments),
            "by_trigger": by_trigger,
            "highest_hype_score": float(highest) if highest else None,
            "timeline": timeline,
        }

    def get_pending_events(self) -> List[HypeMomentEvent]:
        """Get all pending (not yet stored) hype moment events."""
        return self._pending_events.copy()

    def get_stats(self) -> Dict[str, Any]:
        """Get detection statistics."""
        return self._stats.copy()

    def reset_session(self, session_id: str) -> None:
        """Reset state for a session."""
        self._session_states.pop(session_id, None)

    def create_notification_payload(self, event: HypeMomentEvent) -> Dict[str, Any]:
        """
        Create a notification payload for a hype moment event.

        Args:
            event: The hype moment event

        Returns:
            Dictionary with notification data
        """
        trigger_emoji = {
            HypeTriggerType.BIG_WIN: "💰",
            HypeTriggerType.CHAT_SPIKE: "💬",
            HypeTriggerType.VIEWER_SPIKE: "👥",
            HypeTriggerType.EMOTE_SPAM: "🎉",
            HypeTriggerType.BONUS_TRIGGER: "🎰",
            HypeTriggerType.JACKPOT: "🎯",
            HypeTriggerType.MANUAL: "📌",
        }

        return {
            "type": "hype_moment",
            "trigger": event.trigger_type.value,
            "emoji": trigger_emoji.get(event.trigger_type, "🔥"),
            "data": {
                "id": event.id,
                "session_id": event.session_id,
                "detected_at": event.detected_at.isoformat(),
                "hype_score": event.hype_score,
                "chat_velocity": event.chat_velocity,
                "viewer_spike": event.viewer_spike,
                "related_big_win_id": event.related_big_win_id,
                "clip_url": event.clip_url,
            },
        }

    # ============= Private Methods =============

    def _get_or_create_state(self, session_id: str) -> SessionState:
        """Get or create session state."""
        if session_id not in self._session_states:
            self._session_states[session_id] = SessionState(session_id=session_id)
        return self._session_states[session_id]

    def _check_cooldown(
        self,
        state: SessionState,
        trigger_type: HypeTriggerType,
    ) -> bool:
        """Check if cooldown has passed for this trigger type."""
        now = datetime.now(timezone.utc)
        last = state.last_detections.get(trigger_type.value)

        if last is None:
            return True

        elapsed = (now - last).total_seconds()
        return elapsed >= self.thresholds.cooldown_seconds

    def _create_event(
        self,
        session_id: str,
        trigger_type: HypeTriggerType,
        hype_score: float,
        detected_at: datetime,
        state: SessionState,
        chat_velocity: Optional[int] = None,
        viewer_spike: Optional[int] = None,
        related_big_win_id: Optional[str] = None,
        clip_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> HypeMomentEvent:
        """Create a hype moment event and update state."""
        event = HypeMomentEvent(
            id=str(uuid4()),
            session_id=session_id,
            detected_at=detected_at,
            trigger_type=trigger_type,
            hype_score=hype_score,
            chat_velocity=chat_velocity,
            viewer_spike=viewer_spike,
            related_big_win_id=related_big_win_id,
            clip_url=clip_url,
            metadata=metadata or {},
        )

        # Update state
        state.last_detections[trigger_type.value] = detected_at
        state.total_hype_moments += 1

        # Update stats
        self._stats["total_detected"] += 1
        self._stats["by_trigger"][trigger_type.value] += 1
        if hype_score > self._stats["highest_hype_score"]:
            self._stats["highest_hype_score"] = hype_score

        # Add to pending
        self._pending_events.append(event)

        return event


def create_hype_detector(
    chat_velocity_multiplier: float = 2.5,
    hype_score_threshold: float = 0.7,
    cooldown_seconds: int = 60,
) -> HypeMomentDetector:
    """
    Factory function to create a HypeMomentDetector with custom configuration.

    Args:
        chat_velocity_multiplier: Multiplier over baseline for chat spike detection
        hype_score_threshold: Minimum hype score to trigger detection
        cooldown_seconds: Cooldown between detections of same type

    Returns:
        Configured HypeMomentDetector instance
    """
    thresholds = DetectorThresholds(
        chat_velocity_spike_multiplier=chat_velocity_multiplier,
        hype_score_threshold=hype_score_threshold,
        cooldown_seconds=cooldown_seconds,
    )
    return HypeMomentDetector(thresholds)

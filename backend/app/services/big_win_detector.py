"""
Big Win Detection Service

This service handles detection and recording of big wins from slot sessions.
A big win is defined as any win that meets or exceeds the configured multiplier threshold.

Default threshold: 100x (configurable)

Features:
- Real-time big win detection from balance events
- Screenshot capture trigger
- Database storage with verification workflow
- Redis pub/sub notifications
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import uuid4
from dataclasses import dataclass, field
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import BigWin, Session, Game, Streamer, GameSession


class BigWinTier(str, Enum):
    """Classification tiers for big wins based on multiplier."""
    BIG = "big"           # 100x - 499x
    MEGA = "mega"         # 500x - 999x
    ULTRA = "ultra"       # 1000x - 4999x
    LEGENDARY = "legendary"  # 5000x+


@dataclass
class BigWinEvent:
    """Represents a detected big win event."""
    id: str
    session_id: str
    game_session_id: Optional[str]
    game_id: str
    streamer_id: str
    bet_amount: float
    win_amount: float
    multiplier: float
    tier: BigWinTier
    timestamp: datetime
    balance_before: float
    balance_after: float
    screenshot_url: Optional[str] = None
    is_verified: bool = False
    verification_status: str = "pending"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DetectorConfig:
    """Configuration for the big win detector."""
    min_multiplier: float = 100.0  # Minimum multiplier to be considered a big win
    mega_threshold: float = 500.0
    ultra_threshold: float = 1000.0
    legendary_threshold: float = 5000.0
    capture_screenshot: bool = True
    notify_on_detection: bool = True
    min_bet_amount: float = 0.0  # Minimum bet to track (filter small bets)


class BigWinDetector:
    """
    Detects and records big wins from slot streaming sessions.

    The detector monitors balance changes and identifies significant wins
    based on the multiplier (win_amount / bet_amount).
    """

    def __init__(self, config: Optional[DetectorConfig] = None):
        """
        Initialize the BigWinDetector.

        Args:
            config: Detector configuration. Uses defaults if not provided.
        """
        self.config = config or DetectorConfig()
        self._pending_events: List[BigWinEvent] = []
        self._stats = {
            "total_detected": 0,
            "big_wins": 0,
            "mega_wins": 0,
            "ultra_wins": 0,
            "legendary_wins": 0,
            "total_value": 0.0,
            "largest_multiplier": 0.0,
        }

    def detect(
        self,
        session_id: str,
        game_session_id: Optional[str],
        game_id: str,
        streamer_id: str,
        bet_amount: float,
        win_amount: float,
        balance_before: float,
        balance_after: float,
        timestamp: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[BigWinEvent]:
        """
        Analyze a win event and detect if it qualifies as a big win.

        Args:
            session_id: ID of the streaming session
            game_session_id: ID of the game session within the stream
            game_id: ID of the slot game
            streamer_id: ID of the streamer
            bet_amount: The bet amount for this spin
            win_amount: The win amount for this spin
            balance_before: Balance before the win
            balance_after: Balance after the win
            timestamp: Time of the event (defaults to now)
            metadata: Additional metadata about the win

        Returns:
            BigWinEvent if a big win is detected, None otherwise
        """
        # Validate inputs
        if bet_amount <= 0 or win_amount <= 0:
            return None

        if bet_amount < self.config.min_bet_amount:
            return None

        # Calculate multiplier
        multiplier = win_amount / bet_amount

        # Check if it meets the threshold
        if multiplier < self.config.min_multiplier:
            return None

        # Determine the tier
        tier = self._classify_tier(multiplier)

        # Create the big win event
        event = BigWinEvent(
            id=str(uuid4()),
            session_id=session_id,
            game_session_id=game_session_id,
            game_id=game_id,
            streamer_id=streamer_id,
            bet_amount=bet_amount,
            win_amount=win_amount,
            multiplier=multiplier,
            tier=tier,
            timestamp=timestamp or datetime.now(timezone.utc),
            balance_before=balance_before,
            balance_after=balance_after,
            metadata=metadata or {},
        )

        # Update stats
        self._update_stats(event)

        # Add to pending events
        self._pending_events.append(event)

        return event

    def _classify_tier(self, multiplier: float) -> BigWinTier:
        """Classify the big win tier based on multiplier."""
        if multiplier >= self.config.legendary_threshold:
            return BigWinTier.LEGENDARY
        elif multiplier >= self.config.ultra_threshold:
            return BigWinTier.ULTRA
        elif multiplier >= self.config.mega_threshold:
            return BigWinTier.MEGA
        else:
            return BigWinTier.BIG

    def _update_stats(self, event: BigWinEvent) -> None:
        """Update internal statistics."""
        self._stats["total_detected"] += 1
        self._stats["total_value"] += event.win_amount

        if event.multiplier > self._stats["largest_multiplier"]:
            self._stats["largest_multiplier"] = event.multiplier

        tier_key = f"{event.tier.value}_wins"
        if tier_key in self._stats:
            self._stats[tier_key] += 1

    async def store_big_win(
        self,
        event: BigWinEvent,
        db: AsyncSession,
        screenshot_url: Optional[str] = None,
    ) -> BigWin:
        """
        Store a big win event in the database.

        Args:
            event: The big win event to store
            db: Database session
            screenshot_url: URL of the captured screenshot

        Returns:
            The created BigWin database model
        """
        big_win = BigWin(
            id=event.id,
            session_id=event.session_id,
            game_id=event.game_id,
            streamer_id=event.streamer_id,
            bet_amount=event.bet_amount,
            win_amount=event.win_amount,
            multiplier=event.multiplier,
            screenshot_url=screenshot_url or event.screenshot_url,
            is_verified=event.is_verified,
            timestamp=event.timestamp,
        )

        db.add(big_win)
        await db.commit()
        await db.refresh(big_win)

        # Remove from pending events
        self._pending_events = [e for e in self._pending_events if e.id != event.id]

        return big_win

    async def get_big_wins(
        self,
        db: AsyncSession,
        streamer_id: Optional[str] = None,
        game_id: Optional[str] = None,
        min_multiplier: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[BigWin]:
        """
        Retrieve big wins from the database.

        Args:
            db: Database session
            streamer_id: Filter by streamer ID
            game_id: Filter by game ID
            min_multiplier: Minimum multiplier filter
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            List of BigWin records
        """
        query = select(BigWin).order_by(BigWin.timestamp.desc())

        if streamer_id:
            query = query.where(BigWin.streamer_id == streamer_id)
        if game_id:
            query = query.where(BigWin.game_id == game_id)
        if min_multiplier:
            query = query.where(BigWin.multiplier >= min_multiplier)

        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def verify_big_win(
        self,
        big_win_id: str,
        db: AsyncSession,
        verified: bool = True,
        verifier_notes: Optional[str] = None,
    ) -> Optional[BigWin]:
        """
        Verify or reject a big win.

        Args:
            big_win_id: ID of the big win to verify
            db: Database session
            verified: Whether the big win is verified
            verifier_notes: Optional notes from the verifier

        Returns:
            Updated BigWin record or None if not found
        """
        result = await db.execute(
            select(BigWin).where(BigWin.id == big_win_id)
        )
        big_win = result.scalar_one_or_none()

        if not big_win:
            return None

        big_win.is_verified = verified
        await db.commit()
        await db.refresh(big_win)

        return big_win

    def get_pending_events(self) -> List[BigWinEvent]:
        """Get all pending (not yet stored) big win events."""
        return self._pending_events.copy()

    def get_stats(self) -> Dict[str, Any]:
        """Get detection statistics."""
        return self._stats.copy()

    def reset_stats(self) -> None:
        """Reset detection statistics."""
        self._stats = {
            "total_detected": 0,
            "big_wins": 0,
            "mega_wins": 0,
            "ultra_wins": 0,
            "legendary_wins": 0,
            "total_value": 0.0,
            "largest_multiplier": 0.0,
        }

    def create_notification_payload(self, event: BigWinEvent) -> Dict[str, Any]:
        """
        Create a notification payload for a big win event.

        Args:
            event: The big win event

        Returns:
            Dictionary with notification data
        """
        tier_emoji = {
            BigWinTier.BIG: "🎰",
            BigWinTier.MEGA: "🔥",
            BigWinTier.ULTRA: "💎",
            BigWinTier.LEGENDARY: "👑",
        }

        return {
            "type": "big_win",
            "tier": event.tier.value,
            "emoji": tier_emoji.get(event.tier, "🎰"),
            "data": {
                "id": event.id,
                "session_id": event.session_id,
                "game_id": event.game_id,
                "streamer_id": event.streamer_id,
                "bet_amount": event.bet_amount,
                "win_amount": event.win_amount,
                "multiplier": event.multiplier,
                "timestamp": event.timestamp.isoformat(),
            },
        }


def create_detector(
    min_multiplier: float = 100.0,
    capture_screenshot: bool = True,
) -> BigWinDetector:
    """
    Factory function to create a BigWinDetector with custom configuration.

    Args:
        min_multiplier: Minimum multiplier to trigger big win detection
        capture_screenshot: Whether to capture screenshots

    Returns:
        Configured BigWinDetector instance
    """
    config = DetectorConfig(
        min_multiplier=min_multiplier,
        capture_screenshot=capture_screenshot,
    )
    return BigWinDetector(config)

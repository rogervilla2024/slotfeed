"""
Balance Event Processing Service

Handles real-time balance extraction, validation, confidence scoring,
outlier rejection, and storage to the database.
"""

from typing import Optional, List, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
import statistics
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.balance_event import BalanceEvent
from app.models.game_session import GameSession
from app.core.config import settings


@dataclass
class BalanceReading:
    """A single balance reading from OCR."""
    balance: float
    bet: Optional[float] = None
    win: Optional[float] = None
    balance_confidence: float = 0.0
    bet_confidence: float = 0.0
    win_confidence: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    frame_url: Optional[str] = None


@dataclass
class ProcessedBalanceEvent:
    """Processed and validated balance event ready for storage."""
    balance: float
    bet_amount: Optional[float] = None
    win_amount: Optional[float] = None
    balance_change: Optional[float] = None
    is_bonus: bool = False
    multiplier: Optional[float] = None
    ocr_confidence: float = 0.0
    is_valid: bool = True
    rejection_reason: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    frame_url: Optional[str] = None


class BalanceProcessor:
    """
    Processes balance readings from OCR, validates them, detects outliers,
    and stores valid events to the database.
    """

    def __init__(
        self,
        confidence_threshold: float = 0.85,
        outlier_std_threshold: float = 3.0,
        history_window: int = 20,
    ):
        self.confidence_threshold = confidence_threshold
        self.outlier_std_threshold = outlier_std_threshold
        self.history_window = history_window

        # Per-session state
        self._session_histories: dict[str, List[float]] = {}
        self._last_balances: dict[str, float] = {}
        self._last_bets: dict[str, float] = {}

    def process_reading(
        self,
        reading: BalanceReading,
        session_id: str,
        game_session_id: Optional[str] = None,
    ) -> ProcessedBalanceEvent:
        """
        Process a single balance reading.

        Args:
            reading: The raw OCR reading
            session_id: The streaming session ID
            game_session_id: Optional game session ID

        Returns:
            ProcessedBalanceEvent with validation results
        """
        # Initialize session history if needed
        if session_id not in self._session_histories:
            self._session_histories[session_id] = []
            self._last_balances[session_id] = 0.0
            self._last_bets[session_id] = 0.0

        history = self._session_histories[session_id]
        last_balance = self._last_balances[session_id]
        last_bet = self._last_bets[session_id]

        # Calculate combined confidence
        confidences = [reading.balance_confidence]
        if reading.bet_confidence > 0:
            confidences.append(reading.bet_confidence)
        if reading.win_confidence > 0:
            confidences.append(reading.win_confidence)
        avg_confidence = sum(confidences) / len(confidences)

        # Check confidence threshold
        if avg_confidence < self.confidence_threshold:
            return ProcessedBalanceEvent(
                balance=reading.balance,
                bet_amount=reading.bet,
                win_amount=reading.win,
                ocr_confidence=avg_confidence,
                is_valid=False,
                rejection_reason=f"Low confidence: {avg_confidence:.2f} < {self.confidence_threshold}",
                timestamp=reading.timestamp,
                frame_url=reading.frame_url,
            )

        # Check for outliers
        if len(history) >= 5:
            is_outlier, reason = self._check_outlier(reading.balance, history)
            if is_outlier:
                return ProcessedBalanceEvent(
                    balance=reading.balance,
                    bet_amount=reading.bet,
                    win_amount=reading.win,
                    ocr_confidence=avg_confidence,
                    is_valid=False,
                    rejection_reason=reason,
                    timestamp=reading.timestamp,
                    frame_url=reading.frame_url,
                )

        # Validate balance is positive
        if reading.balance < 0:
            return ProcessedBalanceEvent(
                balance=reading.balance,
                bet_amount=reading.bet,
                win_amount=reading.win,
                ocr_confidence=avg_confidence,
                is_valid=False,
                rejection_reason="Negative balance detected",
                timestamp=reading.timestamp,
                frame_url=reading.frame_url,
            )

        # Validate bet doesn't exceed balance
        if reading.bet and reading.bet > reading.balance:
            return ProcessedBalanceEvent(
                balance=reading.balance,
                bet_amount=reading.bet,
                win_amount=reading.win,
                ocr_confidence=avg_confidence,
                is_valid=False,
                rejection_reason="Bet exceeds balance",
                timestamp=reading.timestamp,
                frame_url=reading.frame_url,
            )

        # Calculate balance change
        balance_change = None
        if last_balance > 0:
            balance_change = reading.balance - last_balance

        # Detect bonus/big win
        is_bonus = False
        multiplier = None
        if reading.win and reading.bet and reading.bet > 0:
            multiplier = reading.win / reading.bet
            # Bonus typically has high multiplier
            if multiplier >= 10:
                is_bonus = True

        # Update history
        history.append(reading.balance)
        if len(history) > self.history_window:
            history.pop(0)

        # Update last values
        self._last_balances[session_id] = reading.balance
        if reading.bet:
            self._last_bets[session_id] = reading.bet

        return ProcessedBalanceEvent(
            balance=reading.balance,
            bet_amount=reading.bet,
            win_amount=reading.win,
            balance_change=balance_change,
            is_bonus=is_bonus,
            multiplier=multiplier,
            ocr_confidence=avg_confidence,
            is_valid=True,
            timestamp=reading.timestamp,
            frame_url=reading.frame_url,
        )

    def _check_outlier(
        self,
        value: float,
        history: List[float],
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if a value is an outlier based on history.

        Uses Z-score method: outlier if |z| > threshold
        """
        if len(history) < 5:
            return False, None

        try:
            mean = statistics.mean(history)
            stdev = statistics.stdev(history)

            if stdev == 0:
                # No variation, check if value differs significantly
                if abs(value - mean) > mean * 0.5:  # 50% difference
                    return True, f"Value differs too much from constant: {value} vs {mean}"
                return False, None

            z_score = abs(value - mean) / stdev

            if z_score > self.outlier_std_threshold:
                return True, f"Outlier detected: z-score {z_score:.2f} > {self.outlier_std_threshold}"

            return False, None

        except statistics.StatisticsError:
            return False, None

    async def store_event(
        self,
        event: ProcessedBalanceEvent,
        session_id: str,
        db: AsyncSession,
        game_session_id: Optional[str] = None,
    ) -> Optional[BalanceEvent]:
        """
        Store a valid balance event to the database.

        Args:
            event: The processed balance event
            session_id: The streaming session ID
            db: Database session
            game_session_id: Optional game session ID

        Returns:
            The created BalanceEvent or None if invalid
        """
        if not event.is_valid:
            return None

        balance_event = BalanceEvent(
            session_id=session_id,
            game_session_id=game_session_id,
            captured_at=event.timestamp,
            balance=Decimal(str(event.balance)),
            bet_amount=Decimal(str(event.bet_amount)) if event.bet_amount else None,
            win_amount=Decimal(str(event.win_amount)) if event.win_amount else None,
            balance_change=Decimal(str(event.balance_change)) if event.balance_change else None,
            is_bonus=event.is_bonus,
            multiplier=Decimal(str(event.multiplier)) if event.multiplier else None,
            ocr_confidence=Decimal(str(event.ocr_confidence)),
            frame_url=event.frame_url,
        )

        db.add(balance_event)
        await db.commit()
        await db.refresh(balance_event)

        return balance_event

    async def process_and_store(
        self,
        reading: BalanceReading,
        session_id: str,
        db: AsyncSession,
        game_session_id: Optional[str] = None,
    ) -> Tuple[ProcessedBalanceEvent, Optional[BalanceEvent]]:
        """
        Process a reading and store it if valid.

        Args:
            reading: The raw OCR reading
            session_id: The streaming session ID
            db: Database session
            game_session_id: Optional game session ID

        Returns:
            Tuple of (ProcessedBalanceEvent, Optional[BalanceEvent])
        """
        event = self.process_reading(reading, session_id, game_session_id)
        stored = await self.store_event(event, session_id, db, game_session_id)
        return event, stored

    async def get_session_events(
        self,
        session_id: str,
        db: AsyncSession,
        limit: int = 100,
    ) -> List[BalanceEvent]:
        """Get recent balance events for a session."""
        result = await db.execute(
            select(BalanceEvent)
            .where(BalanceEvent.session_id == session_id)
            .order_by(BalanceEvent.captured_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_game_session_stats(
        self,
        game_session_id: str,
        db: AsyncSession,
    ) -> Optional[GameSession]:
        """
        Update game session statistics based on balance events.

        Args:
            game_session_id: The game session ID
            db: Database session

        Returns:
            Updated GameSession or None
        """
        # Get the game session
        result = await db.execute(
            select(GameSession).where(GameSession.id == game_session_id)
        )
        game_session = result.scalar_one_or_none()

        if not game_session:
            return None

        # Get all balance events for this game session
        events_result = await db.execute(
            select(BalanceEvent)
            .where(BalanceEvent.game_session_id == game_session_id)
            .order_by(BalanceEvent.captured_at.asc())
        )
        events = list(events_result.scalars().all())

        if not events:
            return game_session

        # Calculate statistics
        first_event = events[0]
        last_event = events[-1]

        game_session.starting_balance = first_event.balance
        game_session.ending_balance = last_event.balance

        # Calculate totals
        total_wagered = Decimal("0")
        total_won = Decimal("0")
        biggest_win = Decimal("0")
        biggest_multiplier = Decimal("0")
        bonus_count = 0
        spins_count = 0

        bets = []
        for event in events:
            if event.bet_amount:
                total_wagered += Decimal(str(event.bet_amount))
                bets.append(float(event.bet_amount))
                spins_count += 1

            if event.win_amount:
                total_won += Decimal(str(event.win_amount))
                if event.win_amount > float(biggest_win):
                    biggest_win = Decimal(str(event.win_amount))

            if event.multiplier:
                if event.multiplier > float(biggest_multiplier):
                    biggest_multiplier = Decimal(str(event.multiplier))

            if event.is_bonus:
                bonus_count += 1

        game_session.total_wagered = total_wagered
        game_session.total_won = total_won
        game_session.net_profit_loss = total_won - total_wagered
        game_session.biggest_win = biggest_win
        game_session.biggest_multiplier = biggest_multiplier
        game_session.bonus_count = bonus_count
        game_session.spins_count = spins_count

        if bets:
            game_session.avg_bet = Decimal(str(statistics.mean(bets)))

        # Calculate observed RTP
        if total_wagered > 0:
            game_session.game_rtp = (total_won / total_wagered) * 100

        await db.commit()
        await db.refresh(game_session)

        return game_session

    def reset_session(self, session_id: str) -> None:
        """Reset session-specific state."""
        self._session_histories.pop(session_id, None)
        self._last_balances.pop(session_id, None)
        self._last_bets.pop(session_id, None)

    def reset_all(self) -> None:
        """Reset all state."""
        self._session_histories.clear()
        self._last_balances.clear()
        self._last_bets.clear()


# Global processor instance
balance_processor = BalanceProcessor(
    confidence_threshold=settings.OCR_CONFIDENCE_THRESHOLD,
)

"""
Stream Data Service
Handles saving OCR-captured data from stream monitoring to the database.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4

from sqlalchemy.orm import Session as DBSession
from sqlalchemy import select, and_

from ..db import (
    get_sync_session,
    Streamer,
    Session,
    BalanceEvent,
    BigWin,
    Game,
)


class StreamDataService:
    """Service for saving stream monitoring data to PostgreSQL."""

    def __init__(self, db_session: Optional[DBSession] = None):
        self._session = db_session

    @property
    def session(self) -> DBSession:
        """Get or create a database session."""
        if self._session is None:
            self._session = get_sync_session()
        return self._session

    def get_or_create_streamer(self, username: str, platform: str = "kick") -> Streamer:
        """Get existing streamer or create a new one."""
        streamer = self.session.query(Streamer).filter(
            Streamer.username == username
        ).first()

        if not streamer:
            streamer = Streamer(
                id=uuid4(),
                username=username,
                display_name=username.title(),
                slug=username.lower(),
                kick_id=username if platform == "kick" else None,
                kick_url=f"https://kick.com/{username}" if platform == "kick" else None,
                tier=2,
                is_active=True,
            )
            self.session.add(streamer)
            self.session.commit()

        return streamer

    def start_session(
        self,
        streamer_id: UUID,
        platform: str = "kick",
        starting_balance: Optional[float] = None,
    ) -> Session:
        """Start a new streaming session."""
        session = Session(
            id=uuid4(),
            streamer_id=streamer_id,
            platform=platform,
            started_at=datetime.utcnow(),
            starting_balance=Decimal(str(starting_balance)) if starting_balance else None,
            is_live=True,
        )
        self.session.add(session)
        self.session.commit()
        return session

    def end_session(
        self,
        session_id: UUID,
        ending_balance: Optional[float] = None,
        stats: Optional[Dict[str, Any]] = None,
    ) -> Session:
        """End a streaming session with final stats."""
        session = self.session.query(Session).filter(Session.id == session_id).first()
        if session:
            session.ended_at = datetime.utcnow()
            session.is_live = False
            session.ending_balance = Decimal(str(ending_balance)) if ending_balance else None

            if session.started_at:
                duration = (session.ended_at - session.started_at).total_seconds() / 60
                session.duration_minutes = int(duration)

            if session.starting_balance and session.ending_balance:
                session.net_profit_loss = session.ending_balance - session.starting_balance

            if stats:
                session.total_wagered = Decimal(str(stats.get("total_wagered", 0)))
                session.peak_balance = Decimal(str(stats.get("peak_balance", 0)))
                session.lowest_balance = Decimal(str(stats.get("lowest_balance", 0)))
                session.biggest_win = Decimal(str(stats.get("biggest_win", 0)))
                session.biggest_multiplier = Decimal(str(stats.get("biggest_multiplier", 0)))
                session.peak_viewers = stats.get("peak_viewers", 0)
                session.avg_viewers = stats.get("avg_viewers", 0)

            self.session.commit()
        return session

    def save_balance_event(
        self,
        session_id: UUID,
        balance: float,
        bet: Optional[float] = None,
        win: Optional[float] = None,
        multiplier: Optional[float] = None,
        is_bonus: bool = False,
        ocr_confidence: Optional[float] = None,
        frame_url: Optional[str] = None,
    ) -> BalanceEvent:
        """Save a balance event from OCR capture."""
        now = datetime.utcnow()

        # Get previous balance to calculate change
        prev_event = self.session.query(BalanceEvent).filter(
            BalanceEvent.session_id == session_id
        ).order_by(BalanceEvent.captured_at.desc()).first()

        balance_change = None
        if prev_event:
            balance_change = Decimal(str(balance)) - prev_event.balance

        event = BalanceEvent(
            id=uuid4(),
            session_id=session_id,
            captured_at=now,
            balance=Decimal(str(balance)),
            bet_amount=Decimal(str(bet)) if bet else None,
            win_amount=Decimal(str(win)) if win else None,
            balance_change=balance_change,
            is_bonus=is_bonus,
            multiplier=Decimal(str(multiplier)) if multiplier else None,
            ocr_confidence=Decimal(str(ocr_confidence)) if ocr_confidence else None,
            frame_url=frame_url,
        )
        self.session.add(event)
        self.session.commit()

        # Update session stats
        self._update_session_stats(session_id, balance, multiplier)

        return event

    def _update_session_stats(
        self,
        session_id: UUID,
        current_balance: float,
        multiplier: Optional[float] = None,
    ):
        """Update session running statistics."""
        session = self.session.query(Session).filter(Session.id == session_id).first()
        if session:
            balance = Decimal(str(current_balance))

            # Update peak and lowest
            if session.peak_balance is None or balance > session.peak_balance:
                session.peak_balance = balance
            if session.lowest_balance is None or balance < session.lowest_balance:
                session.lowest_balance = balance

            # Update biggest multiplier
            if multiplier:
                mult = Decimal(str(multiplier))
                if session.biggest_multiplier is None or mult > session.biggest_multiplier:
                    session.biggest_multiplier = mult

            # Update ending balance (current)
            session.ending_balance = balance

            self.session.commit()

    def save_big_win(
        self,
        session_id: UUID,
        streamer_id: UUID,
        game_id: Optional[UUID],
        bet_amount: float,
        win_amount: float,
        multiplier: float,
        is_bonus_win: bool = True,
        screenshot_url: Optional[str] = None,
        viewer_count: Optional[int] = None,
    ) -> BigWin:
        """Save a big win (100x+)."""
        big_win = BigWin(
            id=uuid4(),
            session_id=session_id,
            streamer_id=streamer_id,
            game_id=game_id,
            won_at=datetime.utcnow(),
            bet_amount=Decimal(str(bet_amount)),
            win_amount=Decimal(str(win_amount)),
            multiplier=Decimal(str(multiplier)),
            is_bonus_win=is_bonus_win,
            screenshot_url=screenshot_url,
            viewer_count=viewer_count,
        )
        self.session.add(big_win)
        self.session.commit()
        return big_win

    def get_active_session(self, streamer_id: UUID) -> Optional[Session]:
        """Get the current active session for a streamer."""
        return self.session.query(Session).filter(
            and_(
                Session.streamer_id == streamer_id,
                Session.is_live == True
            )
        ).first()

    def close(self):
        """Close the database session."""
        if self._session:
            self._session.close()
            self._session = None


# Convenience function for scripts
def get_stream_data_service() -> StreamDataService:
    """Get a new stream data service instance."""
    return StreamDataService()

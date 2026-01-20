"""
Bonus Hunt Service

Manages bonus hunt tracking including:
- Creating and managing bonus hunts
- Adding/removing entries
- Opening bonuses and calculating statistics
- ROI tracking and leaderboards
"""

from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bonus_hunt import BonusHunt
from app.models.bonus_hunt_entry import BonusHuntEntry
from app.models.game import Game
from app.models.streamer import Streamer
from app.schemas.bonus_hunt import (
    BonusHuntStatus,
    BonusHuntCreate,
    BonusHuntEntryCreate,
    BonusHuntStats,
    BonusHuntResponse,
    BonusHuntSummary,
    BonusHuntEntryResponse,
)


class BonusHuntService:
    """Service for managing bonus hunts."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_bonus_hunt(
        self,
        session_id: str,
        streamer_id: str,
    ) -> BonusHunt:
        """Create a new bonus hunt."""
        bonus_hunt = BonusHunt(
            session_id=session_id,
            streamer_id=streamer_id,
            started_at=datetime.now(timezone.utc),
            status=BonusHuntStatus.COLLECTING.value,
            total_cost=0,
            total_payout=0,
            bonus_count=0,
            bonuses_opened=0,
        )
        self.db.add(bonus_hunt)
        await self.db.commit()
        await self.db.refresh(bonus_hunt)
        return bonus_hunt

    async def get_bonus_hunt(
        self,
        bonus_hunt_id: str,
        include_entries: bool = True,
    ) -> Optional[BonusHunt]:
        """Get a bonus hunt by ID."""
        query = select(BonusHunt).where(BonusHunt.id == bonus_hunt_id)
        if include_entries:
            query = query.options(selectinload(BonusHunt.entries))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_bonus_hunt_with_details(
        self,
        bonus_hunt_id: str,
    ) -> Optional[BonusHuntResponse]:
        """Get a bonus hunt with full details including stats."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id, include_entries=True)
        if not bonus_hunt:
            return None

        # Get streamer name
        streamer_result = await self.db.execute(
            select(Streamer.display_name).where(Streamer.id == bonus_hunt.streamer_id)
        )
        streamer_name = streamer_result.scalar_one_or_none()

        # Build entries with game info
        entries = []
        for entry in sorted(bonus_hunt.entries, key=lambda e: e.position):
            game_result = await self.db.execute(
                select(Game.name, Game.slug).where(Game.id == entry.game_id)
            )
            game_row = game_result.one_or_none()
            game_name = game_row[0] if game_row else None
            game_slug = game_row[1] if game_row else None

            entries.append(BonusHuntEntryResponse(
                id=entry.id,
                bonus_hunt_id=entry.bonus_hunt_id,
                game_id=entry.game_id,
                position=entry.position,
                bet_amount=float(entry.bet_amount),
                is_opened=entry.is_opened,
                opened_at=entry.opened_at,
                payout=float(entry.payout) if entry.payout else None,
                multiplier=float(entry.multiplier) if entry.multiplier else None,
                screenshot_url=entry.screenshot_url,
                game_name=game_name,
                game_slug=game_slug,
                created_at=entry.created_at,
            ))

        # Calculate stats
        stats = self._calculate_stats(bonus_hunt, entries)

        return BonusHuntResponse(
            id=bonus_hunt.id,
            session_id=bonus_hunt.session_id,
            streamer_id=bonus_hunt.streamer_id,
            streamer_name=streamer_name,
            status=bonus_hunt.status,
            started_at=bonus_hunt.started_at,
            opening_started_at=bonus_hunt.opening_started_at,
            ended_at=bonus_hunt.ended_at,
            stats=stats,
            entries=entries,
            created_at=bonus_hunt.created_at,
            updated_at=bonus_hunt.updated_at,
        )

    def _calculate_stats(
        self,
        bonus_hunt: BonusHunt,
        entries: List[BonusHuntEntryResponse],
    ) -> BonusHuntStats:
        """Calculate statistics for a bonus hunt."""
        total_cost = sum(e.bet_amount for e in entries)
        opened_entries = [e for e in entries if e.is_opened and e.payout is not None]
        total_payout = sum(e.payout for e in opened_entries)
        profit_loss = total_payout - total_cost

        # ROI calculation
        roi_percentage = None
        if total_cost > 0:
            roi_percentage = ((total_payout - total_cost) / total_cost) * 100

        # Multiplier stats
        multipliers = [e.multiplier for e in opened_entries if e.multiplier is not None]
        best_multiplier = max(multipliers) if multipliers else None
        worst_multiplier = min(multipliers) if multipliers else None
        avg_multiplier = sum(multipliers) / len(multipliers) if multipliers else None

        # Calculate average needed to break even
        remaining_entries = [e for e in entries if not e.is_opened]
        remaining_cost = sum(e.bet_amount for e in remaining_entries)
        current_avg_needed = None
        if remaining_cost > 0 and len(remaining_entries) > 0:
            needed_payout = total_cost - total_payout
            if needed_payout > 0:
                current_avg_needed = needed_payout / remaining_cost

        return BonusHuntStats(
            total_cost=total_cost,
            total_payout=total_payout,
            profit_loss=profit_loss,
            roi_percentage=roi_percentage,
            bonus_count=len(entries),
            bonuses_opened=len(opened_entries),
            bonuses_remaining=len(remaining_entries),
            best_multiplier=best_multiplier,
            worst_multiplier=worst_multiplier,
            avg_multiplier=avg_multiplier,
            current_avg_needed=current_avg_needed,
        )

    async def add_entry(
        self,
        bonus_hunt_id: str,
        game_id: str,
        bet_amount: float,
    ) -> Optional[BonusHuntEntry]:
        """Add an entry to a bonus hunt."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id, include_entries=True)
        if not bonus_hunt:
            return None

        if bonus_hunt.status != BonusHuntStatus.COLLECTING.value:
            raise ValueError("Cannot add entries to a bonus hunt that is not collecting")

        # Get next position
        next_position = len(bonus_hunt.entries) + 1

        entry = BonusHuntEntry(
            bonus_hunt_id=bonus_hunt_id,
            game_id=game_id,
            position=next_position,
            bet_amount=bet_amount,
            is_opened=False,
        )
        self.db.add(entry)

        # Update bonus hunt stats
        bonus_hunt.bonus_count = next_position
        bonus_hunt.total_cost = float(bonus_hunt.total_cost or 0) + bet_amount

        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def add_bulk_entries(
        self,
        bonus_hunt_id: str,
        entries: List[BonusHuntEntryCreate],
    ) -> List[BonusHuntEntry]:
        """Add multiple entries to a bonus hunt."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id, include_entries=True)
        if not bonus_hunt:
            return []

        if bonus_hunt.status != BonusHuntStatus.COLLECTING.value:
            raise ValueError("Cannot add entries to a bonus hunt that is not collecting")

        current_position = len(bonus_hunt.entries)
        created_entries = []
        total_cost_added = 0

        for i, entry_data in enumerate(entries):
            entry = BonusHuntEntry(
                bonus_hunt_id=bonus_hunt_id,
                game_id=entry_data.game_id,
                position=current_position + i + 1,
                bet_amount=entry_data.bet_amount,
                is_opened=False,
            )
            self.db.add(entry)
            created_entries.append(entry)
            total_cost_added += entry_data.bet_amount

        # Update bonus hunt stats
        bonus_hunt.bonus_count = current_position + len(entries)
        bonus_hunt.total_cost = float(bonus_hunt.total_cost or 0) + total_cost_added

        await self.db.commit()
        for entry in created_entries:
            await self.db.refresh(entry)

        return created_entries

    async def remove_entry(
        self,
        bonus_hunt_id: str,
        entry_id: str,
    ) -> bool:
        """Remove an entry from a bonus hunt."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id, include_entries=True)
        if not bonus_hunt:
            return False

        if bonus_hunt.status != BonusHuntStatus.COLLECTING.value:
            raise ValueError("Cannot remove entries from a bonus hunt that is not collecting")

        # Find the entry
        entry = next((e for e in bonus_hunt.entries if e.id == entry_id), None)
        if not entry:
            return False

        # Update total cost
        bonus_hunt.total_cost = float(bonus_hunt.total_cost or 0) - float(entry.bet_amount)
        bonus_hunt.bonus_count = max(0, bonus_hunt.bonus_count - 1)

        # Delete entry
        await self.db.delete(entry)

        # Reorder remaining entries
        remaining_entries = sorted(
            [e for e in bonus_hunt.entries if e.id != entry_id],
            key=lambda e: e.position
        )
        for i, e in enumerate(remaining_entries):
            e.position = i + 1

        await self.db.commit()
        return True

    async def start_opening(
        self,
        bonus_hunt_id: str,
    ) -> Optional[BonusHunt]:
        """Start opening phase of a bonus hunt."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id)
        if not bonus_hunt:
            return None

        if bonus_hunt.status != BonusHuntStatus.COLLECTING.value:
            raise ValueError("Bonus hunt is not in collecting phase")

        if bonus_hunt.bonus_count == 0:
            raise ValueError("Cannot start opening with no bonuses")

        bonus_hunt.status = BonusHuntStatus.OPENING.value
        bonus_hunt.opening_started_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(bonus_hunt)
        return bonus_hunt

    async def open_entry(
        self,
        bonus_hunt_id: str,
        entry_id: str,
        payout: float,
        screenshot_url: Optional[str] = None,
    ) -> Optional[BonusHuntEntry]:
        """Open a bonus hunt entry and record the result."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id, include_entries=True)
        if not bonus_hunt:
            return None

        if bonus_hunt.status != BonusHuntStatus.OPENING.value:
            raise ValueError("Bonus hunt is not in opening phase")

        # Find the entry
        entry = next((e for e in bonus_hunt.entries if e.id == entry_id), None)
        if not entry:
            return None

        if entry.is_opened:
            raise ValueError("Entry has already been opened")

        # Calculate multiplier
        multiplier = payout / float(entry.bet_amount) if entry.bet_amount > 0 else 0

        # Update entry
        entry.is_opened = True
        entry.opened_at = datetime.now(timezone.utc)
        entry.payout = payout
        entry.multiplier = multiplier
        entry.screenshot_url = screenshot_url

        # Update bonus hunt stats
        bonus_hunt.bonuses_opened += 1
        bonus_hunt.total_payout = float(bonus_hunt.total_payout or 0) + payout

        # Update multiplier stats
        if bonus_hunt.best_multiplier is None or multiplier > bonus_hunt.best_multiplier:
            bonus_hunt.best_multiplier = multiplier
        if bonus_hunt.worst_multiplier is None or multiplier < bonus_hunt.worst_multiplier:
            bonus_hunt.worst_multiplier = multiplier

        # Calculate average multiplier
        opened_entries = [e for e in bonus_hunt.entries if e.is_opened and e.multiplier]
        if opened_entries:
            avg = sum(float(e.multiplier) for e in opened_entries) / len(opened_entries)
            bonus_hunt.avg_multiplier = avg

        # Calculate ROI
        if bonus_hunt.total_cost > 0:
            roi = ((float(bonus_hunt.total_payout) - float(bonus_hunt.total_cost)) /
                   float(bonus_hunt.total_cost)) * 100
            bonus_hunt.roi_percentage = roi

        # Check if all bonuses opened
        if bonus_hunt.bonuses_opened >= bonus_hunt.bonus_count:
            bonus_hunt.status = BonusHuntStatus.COMPLETED.value
            bonus_hunt.ended_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def complete_bonus_hunt(
        self,
        bonus_hunt_id: str,
    ) -> Optional[BonusHunt]:
        """Manually complete a bonus hunt."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id)
        if not bonus_hunt:
            return None

        bonus_hunt.status = BonusHuntStatus.COMPLETED.value
        bonus_hunt.ended_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(bonus_hunt)
        return bonus_hunt

    async def cancel_bonus_hunt(
        self,
        bonus_hunt_id: str,
    ) -> Optional[BonusHunt]:
        """Cancel a bonus hunt."""
        bonus_hunt = await self.get_bonus_hunt(bonus_hunt_id)
        if not bonus_hunt:
            return None

        bonus_hunt.status = BonusHuntStatus.CANCELLED.value
        bonus_hunt.ended_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(bonus_hunt)
        return bonus_hunt

    async def list_bonus_hunts(
        self,
        streamer_id: Optional[str] = None,
        status: Optional[BonusHuntStatus] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[BonusHuntSummary], int]:
        """List bonus hunts with optional filters."""
        query = select(BonusHunt)

        if streamer_id:
            query = query.where(BonusHunt.streamer_id == streamer_id)
        if status:
            query = query.where(BonusHunt.status == status.value)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.order_by(desc(BonusHunt.started_at))
        query = query.offset((page - 1) * limit).limit(limit)

        result = await self.db.execute(query)
        bonus_hunts = result.scalars().all()

        # Build summaries with streamer names
        summaries = []
        for bh in bonus_hunts:
            streamer_result = await self.db.execute(
                select(Streamer.display_name).where(Streamer.id == bh.streamer_id)
            )
            streamer_name = streamer_result.scalar_one_or_none()

            summaries.append(BonusHuntSummary(
                id=bh.id,
                streamer_id=bh.streamer_id,
                streamer_name=streamer_name,
                status=bh.status,
                started_at=bh.started_at,
                ended_at=bh.ended_at,
                total_cost=float(bh.total_cost or 0),
                total_payout=float(bh.total_payout or 0),
                roi_percentage=float(bh.roi_percentage) if bh.roi_percentage else None,
                bonus_count=bh.bonus_count or 0,
                bonuses_opened=bh.bonuses_opened or 0,
            ))

        return summaries, total

    async def get_active_bonus_hunt(
        self,
        streamer_id: str,
    ) -> Optional[BonusHunt]:
        """Get the active bonus hunt for a streamer."""
        query = select(BonusHunt).where(
            and_(
                BonusHunt.streamer_id == streamer_id,
                BonusHunt.status.in_([
                    BonusHuntStatus.COLLECTING.value,
                    BonusHuntStatus.OPENING.value
                ])
            )
        ).order_by(desc(BonusHunt.started_at)).limit(1)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()


# Singleton instance
_bonus_hunt_service: Optional[BonusHuntService] = None


def get_bonus_hunt_service(db: AsyncSession) -> BonusHuntService:
    """Get or create bonus hunt service instance."""
    return BonusHuntService(db)

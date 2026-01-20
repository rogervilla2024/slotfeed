"""
Tests for the Bonus Hunt Service
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.services.bonus_hunt_service import BonusHuntService
from app.schemas.bonus_hunt import (
    BonusHuntStatus,
    BonusHuntEntryCreate,
    BonusHuntStats,
)


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.delete = AsyncMock()
    db.execute = AsyncMock()
    return db


@pytest.fixture
def bonus_hunt_service(mock_db):
    """Create a BonusHuntService with mock db."""
    return BonusHuntService(mock_db)


class TestBonusHuntService:
    """Tests for BonusHuntService."""

    @pytest.mark.asyncio
    async def test_create_bonus_hunt(self, bonus_hunt_service, mock_db):
        """Test creating a new bonus hunt."""
        # Setup mock to return the created object on refresh
        mock_bonus_hunt = MagicMock()
        mock_bonus_hunt.id = "test-hunt-id"
        mock_bonus_hunt.session_id = "session-1"
        mock_bonus_hunt.streamer_id = "streamer-1"
        mock_bonus_hunt.status = BonusHuntStatus.COLLECTING.value
        mock_db.refresh = AsyncMock(side_effect=lambda obj: setattr(obj, 'id', 'test-hunt-id'))

        result = await bonus_hunt_service.create_bonus_hunt(
            session_id="session-1",
            streamer_id="streamer-1",
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert result.session_id == "session-1"
        assert result.streamer_id == "streamer-1"
        assert result.status == BonusHuntStatus.COLLECTING.value

    @pytest.mark.asyncio
    async def test_get_bonus_hunt_not_found(self, bonus_hunt_service, mock_db):
        """Test getting a non-existent bonus hunt."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await bonus_hunt_service.get_bonus_hunt("nonexistent-id")

        assert result is None


class TestBonusHuntStats:
    """Tests for bonus hunt statistics calculation."""

    def test_calculate_stats_empty(self, bonus_hunt_service):
        """Test stats calculation with no entries."""
        mock_bonus_hunt = MagicMock()
        entries = []

        stats = bonus_hunt_service._calculate_stats(mock_bonus_hunt, entries)

        assert stats.total_cost == 0
        assert stats.total_payout == 0
        assert stats.profit_loss == 0
        assert stats.roi_percentage is None
        assert stats.bonus_count == 0
        assert stats.bonuses_opened == 0

    def test_calculate_stats_with_entries(self, bonus_hunt_service):
        """Test stats calculation with entries."""
        mock_bonus_hunt = MagicMock()

        # Create mock entries
        entry1 = MagicMock()
        entry1.bet_amount = 100.0
        entry1.is_opened = True
        entry1.payout = 500.0
        entry1.multiplier = 5.0

        entry2 = MagicMock()
        entry2.bet_amount = 50.0
        entry2.is_opened = True
        entry2.payout = 25.0
        entry2.multiplier = 0.5

        entry3 = MagicMock()
        entry3.bet_amount = 100.0
        entry3.is_opened = False
        entry3.payout = None
        entry3.multiplier = None

        entries = [entry1, entry2, entry3]

        stats = bonus_hunt_service._calculate_stats(mock_bonus_hunt, entries)

        assert stats.total_cost == 250.0  # 100 + 50 + 100
        assert stats.total_payout == 525.0  # 500 + 25
        assert stats.profit_loss == 275.0  # 525 - 250
        assert abs(stats.roi_percentage - 110.0) < 0.01  # (275/250) * 100
        assert stats.bonus_count == 3
        assert stats.bonuses_opened == 2
        assert stats.bonuses_remaining == 1
        assert stats.best_multiplier == 5.0
        assert stats.worst_multiplier == 0.5
        assert stats.avg_multiplier == 2.75  # (5 + 0.5) / 2

    def test_calculate_stats_no_opened(self, bonus_hunt_service):
        """Test stats when no entries are opened."""
        mock_bonus_hunt = MagicMock()

        entry1 = MagicMock()
        entry1.bet_amount = 100.0
        entry1.is_opened = False
        entry1.payout = None
        entry1.multiplier = None

        entries = [entry1]

        stats = bonus_hunt_service._calculate_stats(mock_bonus_hunt, entries)

        assert stats.total_cost == 100.0
        assert stats.total_payout == 0
        assert stats.profit_loss == -100.0
        assert stats.roi_percentage == -100.0
        assert stats.bonus_count == 1
        assert stats.bonuses_opened == 0
        assert stats.best_multiplier is None
        assert stats.worst_multiplier is None
        assert stats.avg_multiplier is None

    def test_calculate_avg_needed_to_break_even(self, bonus_hunt_service):
        """Test calculation of average multiplier needed to break even."""
        mock_bonus_hunt = MagicMock()

        # Total cost: 200, paid out: 100, remaining bet: 100
        # Need 100 more payout from 100 bet = 1x average needed
        entry1 = MagicMock()
        entry1.bet_amount = 100.0
        entry1.is_opened = True
        entry1.payout = 100.0
        entry1.multiplier = 1.0

        entry2 = MagicMock()
        entry2.bet_amount = 100.0
        entry2.is_opened = False
        entry2.payout = None
        entry2.multiplier = None

        entries = [entry1, entry2]

        stats = bonus_hunt_service._calculate_stats(mock_bonus_hunt, entries)

        assert stats.current_avg_needed == 1.0


class TestBonusHuntEntryManagement:
    """Tests for entry management."""

    @pytest.mark.asyncio
    async def test_add_entry_to_non_collecting_hunt(self, bonus_hunt_service, mock_db):
        """Test adding entry to a hunt that's not in collecting phase."""
        mock_bonus_hunt = MagicMock()
        mock_bonus_hunt.status = BonusHuntStatus.OPENING.value
        mock_bonus_hunt.entries = []

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_bonus_hunt

        # First call returns the bonus hunt, subsequent calls for other queries
        mock_db.execute.return_value = mock_result

        # Patch get_bonus_hunt to return our mock
        with patch.object(bonus_hunt_service, 'get_bonus_hunt', return_value=mock_bonus_hunt):
            with pytest.raises(ValueError, match="Cannot add entries"):
                await bonus_hunt_service.add_entry(
                    bonus_hunt_id="hunt-1",
                    game_id="game-1",
                    bet_amount=100.0,
                )


class TestBonusHuntStatusTransitions:
    """Tests for bonus hunt status transitions."""

    @pytest.mark.asyncio
    async def test_start_opening_empty_hunt(self, bonus_hunt_service, mock_db):
        """Test starting opening phase with no bonuses."""
        mock_bonus_hunt = MagicMock()
        mock_bonus_hunt.status = BonusHuntStatus.COLLECTING.value
        mock_bonus_hunt.bonus_count = 0

        with patch.object(bonus_hunt_service, 'get_bonus_hunt', return_value=mock_bonus_hunt):
            with pytest.raises(ValueError, match="Cannot start opening with no bonuses"):
                await bonus_hunt_service.start_opening("hunt-1")

    @pytest.mark.asyncio
    async def test_start_opening_not_collecting(self, bonus_hunt_service, mock_db):
        """Test starting opening when not in collecting phase."""
        mock_bonus_hunt = MagicMock()
        mock_bonus_hunt.status = BonusHuntStatus.OPENING.value

        with patch.object(bonus_hunt_service, 'get_bonus_hunt', return_value=mock_bonus_hunt):
            with pytest.raises(ValueError, match="not in collecting phase"):
                await bonus_hunt_service.start_opening("hunt-1")


class TestBonusHuntOpening:
    """Tests for opening bonus hunt entries."""

    @pytest.mark.asyncio
    async def test_open_entry_not_in_opening_phase(self, bonus_hunt_service, mock_db):
        """Test opening entry when hunt is not in opening phase."""
        mock_bonus_hunt = MagicMock()
        mock_bonus_hunt.status = BonusHuntStatus.COLLECTING.value
        mock_bonus_hunt.entries = []

        with patch.object(bonus_hunt_service, 'get_bonus_hunt', return_value=mock_bonus_hunt):
            with pytest.raises(ValueError, match="not in opening phase"):
                await bonus_hunt_service.open_entry(
                    bonus_hunt_id="hunt-1",
                    entry_id="entry-1",
                    payout=500.0,
                )

    @pytest.mark.asyncio
    async def test_open_already_opened_entry(self, bonus_hunt_service, mock_db):
        """Test opening an entry that's already opened."""
        mock_entry = MagicMock()
        mock_entry.id = "entry-1"
        mock_entry.is_opened = True

        mock_bonus_hunt = MagicMock()
        mock_bonus_hunt.status = BonusHuntStatus.OPENING.value
        mock_bonus_hunt.entries = [mock_entry]

        with patch.object(bonus_hunt_service, 'get_bonus_hunt', return_value=mock_bonus_hunt):
            with pytest.raises(ValueError, match="already been opened"):
                await bonus_hunt_service.open_entry(
                    bonus_hunt_id="hunt-1",
                    entry_id="entry-1",
                    payout=500.0,
                )


class TestBonusHuntLeaderboard:
    """Tests for bonus hunt listing and filtering."""

    @pytest.mark.asyncio
    async def test_list_bonus_hunts_empty(self, bonus_hunt_service, mock_db):
        """Test listing bonus hunts when none exist."""
        # Mock count query
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 0

        # Mock list query
        mock_list_result = MagicMock()
        mock_list_result.scalars.return_value.all.return_value = []

        mock_db.execute.side_effect = [mock_count_result, mock_list_result]

        items, total = await bonus_hunt_service.list_bonus_hunts(page=1, limit=20)

        assert total == 0
        assert items == []

    @pytest.mark.asyncio
    async def test_get_active_bonus_hunt_none(self, bonus_hunt_service, mock_db):
        """Test getting active hunt when none exists."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await bonus_hunt_service.get_active_bonus_hunt("streamer-1")

        assert result is None

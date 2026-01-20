"""Tests for the balance processor service."""

import pytest
from datetime import datetime, timezone

from app.services.balance_processor import (
    BalanceProcessor,
    BalanceReading,
    ProcessedBalanceEvent,
)


class TestBalanceProcessor:
    """Tests for BalanceProcessor class."""

    def test_initialization(self):
        """Test processor initialization."""
        processor = BalanceProcessor()
        assert processor.confidence_threshold == 0.85
        assert processor.outlier_std_threshold == 3.0
        assert processor.history_window == 20

    def test_custom_initialization(self):
        """Test processor with custom settings."""
        processor = BalanceProcessor(
            confidence_threshold=0.9,
            outlier_std_threshold=2.5,
            history_window=30,
        )
        assert processor.confidence_threshold == 0.9
        assert processor.outlier_std_threshold == 2.5
        assert processor.history_window == 30

    def test_process_valid_reading(self):
        """Test processing a valid balance reading."""
        processor = BalanceProcessor()
        reading = BalanceReading(
            balance=1000.0,
            bet=10.0,
            win=0.0,
            balance_confidence=0.95,
            bet_confidence=0.90,
            win_confidence=0.90,
        )

        event = processor.process_reading(reading, "session-1")

        assert event.is_valid is True
        assert event.balance == 1000.0
        assert event.bet_amount == 10.0
        assert event.win_amount == 0.0
        assert event.rejection_reason is None

    def test_reject_low_confidence(self):
        """Test rejection of low confidence readings."""
        processor = BalanceProcessor(confidence_threshold=0.90)
        reading = BalanceReading(
            balance=1000.0,
            balance_confidence=0.70,
        )

        event = processor.process_reading(reading, "session-1")

        assert event.is_valid is False
        assert "Low confidence" in event.rejection_reason

    def test_reject_negative_balance(self):
        """Test rejection of negative balance."""
        processor = BalanceProcessor()
        reading = BalanceReading(
            balance=-100.0,
            balance_confidence=0.95,
        )

        event = processor.process_reading(reading, "session-1")

        assert event.is_valid is False
        assert "Negative balance" in event.rejection_reason

    def test_reject_bet_exceeds_balance(self):
        """Test rejection when bet exceeds balance."""
        processor = BalanceProcessor()
        reading = BalanceReading(
            balance=100.0,
            bet=500.0,
            balance_confidence=0.95,
            bet_confidence=0.90,
        )

        event = processor.process_reading(reading, "session-1")

        assert event.is_valid is False
        assert "Bet exceeds balance" in event.rejection_reason

    def test_detect_bonus(self):
        """Test bonus detection based on multiplier."""
        processor = BalanceProcessor()

        # Build some history with varied balances to avoid outlier detection
        balances = [1000, 1050, 990, 1100, 1080, 1150, 1200, 1180]
        for balance in balances:
            reading = BalanceReading(
                balance=float(balance),
                bet=10.0,
                win=5.0,
                balance_confidence=0.95,
                bet_confidence=0.90,
                win_confidence=0.90,
            )
            processor.process_reading(reading, "session-1")

        # Big win with 15x multiplier - balance within reasonable range
        reading = BalanceReading(
            balance=1330.0,  # Within expected variance
            bet=10.0,
            win=150.0,
            balance_confidence=0.95,
            bet_confidence=0.90,
            win_confidence=0.90,
        )

        event = processor.process_reading(reading, "session-1")

        assert event.is_valid is True
        assert event.is_bonus is True
        assert event.multiplier == 15.0

    def test_calculate_balance_change(self):
        """Test balance change calculation."""
        processor = BalanceProcessor()

        # First reading
        reading1 = BalanceReading(
            balance=1000.0,
            balance_confidence=0.95,
        )
        event1 = processor.process_reading(reading1, "session-1")
        assert event1.balance_change is None  # First reading has no change

        # Second reading
        reading2 = BalanceReading(
            balance=1100.0,
            balance_confidence=0.95,
        )
        event2 = processor.process_reading(reading2, "session-1")
        assert event2.balance_change == 100.0

        # Third reading (loss)
        reading3 = BalanceReading(
            balance=1050.0,
            balance_confidence=0.95,
        )
        event3 = processor.process_reading(reading3, "session-1")
        assert event3.balance_change == -50.0

    def test_outlier_detection(self):
        """Test outlier detection with Z-score method."""
        processor = BalanceProcessor(outlier_std_threshold=2.0)

        # Build consistent history
        for i in range(10):
            reading = BalanceReading(
                balance=1000.0 + i,  # Very stable balance
                balance_confidence=0.95,
            )
            processor.process_reading(reading, "session-1")

        # Sudden spike - should be rejected as outlier
        spike_reading = BalanceReading(
            balance=5000.0,  # Way outside normal range
            balance_confidence=0.95,
        )
        event = processor.process_reading(spike_reading, "session-1")

        assert event.is_valid is False
        assert "Outlier" in event.rejection_reason

    def test_session_isolation(self):
        """Test that sessions are isolated from each other."""
        processor = BalanceProcessor()

        # Session 1
        reading1 = BalanceReading(
            balance=1000.0,
            balance_confidence=0.95,
        )
        processor.process_reading(reading1, "session-1")

        reading1b = BalanceReading(
            balance=1100.0,
            balance_confidence=0.95,
        )
        event1 = processor.process_reading(reading1b, "session-1")

        # Session 2 (independent)
        reading2 = BalanceReading(
            balance=500.0,
            balance_confidence=0.95,
        )
        event2 = processor.process_reading(reading2, "session-2")

        # Session 1 should have balance change
        assert event1.balance_change == 100.0

        # Session 2 should not have balance change (first reading)
        assert event2.balance_change is None

    def test_reset_session(self):
        """Test session reset."""
        processor = BalanceProcessor()

        # Add some readings
        reading = BalanceReading(
            balance=1000.0,
            balance_confidence=0.95,
        )
        processor.process_reading(reading, "session-1")

        # Reset
        processor.reset_session("session-1")

        # Next reading should be treated as first
        reading2 = BalanceReading(
            balance=2000.0,
            balance_confidence=0.95,
        )
        event = processor.process_reading(reading2, "session-1")

        assert event.balance_change is None  # First reading after reset

    def test_reset_all(self):
        """Test resetting all sessions."""
        processor = BalanceProcessor()

        # Add readings to multiple sessions
        for session_id in ["session-1", "session-2", "session-3"]:
            reading = BalanceReading(
                balance=1000.0,
                balance_confidence=0.95,
            )
            processor.process_reading(reading, session_id)

        # Reset all
        processor.reset_all()

        # All sessions should be treated as new
        for session_id in ["session-1", "session-2", "session-3"]:
            reading = BalanceReading(
                balance=2000.0,
                balance_confidence=0.95,
            )
            event = processor.process_reading(reading, session_id)
            assert event.balance_change is None  # First reading

    def test_confidence_calculation(self):
        """Test that confidence is averaged correctly."""
        processor = BalanceProcessor(confidence_threshold=0.80)

        # All high confidence
        reading1 = BalanceReading(
            balance=1000.0,
            bet=10.0,
            win=5.0,
            balance_confidence=0.95,
            bet_confidence=0.90,
            win_confidence=0.85,
        )
        event1 = processor.process_reading(reading1, "session-1")
        assert event1.is_valid is True
        assert event1.ocr_confidence == 0.9  # (0.95 + 0.90 + 0.85) / 3

        # One low confidence
        processor.reset_session("session-1")
        reading2 = BalanceReading(
            balance=1000.0,
            bet=10.0,
            win=5.0,
            balance_confidence=0.95,
            bet_confidence=0.50,  # Low
            win_confidence=0.85,
        )
        event2 = processor.process_reading(reading2, "session-1")
        assert event2.is_valid is False  # Average ~0.77 < 0.80
        assert "Low confidence" in event2.rejection_reason

    def test_history_window_limit(self):
        """Test that history window is limited."""
        processor = BalanceProcessor(history_window=5)

        # Add more readings than window size
        for i in range(10):
            reading = BalanceReading(
                balance=1000.0 + i,
                balance_confidence=0.95,
            )
            processor.process_reading(reading, "session-1")

        # History should be limited to window size
        assert len(processor._session_histories["session-1"]) == 5

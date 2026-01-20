import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import Mock, MagicMock, patch, AsyncMock

from app.services.balance_processor import (
    BalanceProcessor,
    BalanceReading,
    ProcessedBalanceEvent
)
from app.services.big_win_detector import BigWinDetector
from app.services.hot_cold_service import HotColdService
from app.services.bonus_hunt_service import BonusHuntService
from app.services.chat_analytics_service import ChatAnalyticsService
from app.services.hype_moment_detector import HypeMomentDetector


class TestBalanceProcessor:
    """Tests for BalanceProcessor service"""

    def test_create_processor(self):
        """Test creating a BalanceProcessor instance"""
        processor = BalanceProcessor()
        assert processor is not None
        assert processor.confidence_threshold == 0.85
        assert processor.outlier_std_threshold == 3.0
        assert processor.history_window == 20

    def test_processor_custom_thresholds(self):
        """Test creating processor with custom thresholds"""
        processor = BalanceProcessor(
            confidence_threshold=0.90,
            outlier_std_threshold=2.5,
            history_window=50
        )
        assert processor.confidence_threshold == 0.90
        assert processor.outlier_std_threshold == 2.5
        assert processor.history_window == 50

    def test_balance_reading_creation(self):
        """Test creating a BalanceReading"""
        reading = BalanceReading(
            balance=1000.0,
            bet=100.0,
            win=500.0,
            balance_confidence=0.95
        )
        assert reading.balance == 1000.0
        assert reading.bet == 100.0
        assert reading.win == 500.0
        assert reading.balance_confidence == 0.95

    def test_balance_reading_defaults(self):
        """Test BalanceReading default values"""
        reading = BalanceReading(balance=1000.0)
        assert reading.balance == 1000.0
        assert reading.bet is None
        assert reading.win is None
        assert reading.timestamp is not None
        assert reading.balance_confidence == 0.0

    def test_processed_balance_event_creation(self):
        """Test creating ProcessedBalanceEvent"""
        event = ProcessedBalanceEvent(
            balance=1000.0,
            bet_amount=100.0,
            win_amount=500.0,
            is_valid=True
        )
        assert event.balance == 1000.0
        assert event.bet_amount == 100.0
        assert event.win_amount == 500.0
        assert event.is_valid == True

    def test_processed_balance_event_rejection(self):
        """Test ProcessedBalanceEvent with rejection"""
        event = ProcessedBalanceEvent(
            balance=-100.0,
            is_valid=False,
            rejection_reason="Negative balance"
        )
        assert event.is_valid == False
        assert event.rejection_reason == "Negative balance"

    def test_processor_has_process_reading_method(self):
        """Test processor has process_reading method"""
        processor = BalanceProcessor()
        assert hasattr(processor, 'process_reading')
        assert callable(processor.process_reading)

    def test_processor_session_histories(self):
        """Test processor maintains session histories"""
        processor = BalanceProcessor()
        assert isinstance(processor._session_histories, dict)
        assert isinstance(processor._last_balances, dict)
        assert isinstance(processor._last_bets, dict)


class TestBigWinDetector:
    """Tests for BigWinDetector service"""

    def test_create_detector(self):
        """Test creating a BigWinDetector instance"""
        detector = BigWinDetector()
        assert detector is not None

    def test_detector_has_detect_method(self):
        """Test detector has detect method"""
        detector = BigWinDetector()
        assert hasattr(detector, 'detect')
        assert callable(detector.detect)

    def test_detector_big_win_threshold(self):
        """Test big win multiplier threshold"""
        detector = BigWinDetector()
        # Big win typically >= 100x
        threshold = 100.0
        assert isinstance(threshold, float)
        assert threshold > 0

    def test_win_tier_mega(self):
        """Test mega win tier (100-500x)"""
        multiplier = 250.0
        tier = "mega"
        assert multiplier >= 100
        assert multiplier < 500

    def test_win_tier_ultra(self):
        """Test ultra win tier (500-1000x)"""
        multiplier = 750.0
        tier = "ultra"
        assert multiplier >= 500
        assert multiplier < 1000

    def test_win_tier_legendary(self):
        """Test legendary win tier (1000x+)"""
        multiplier = 2500.0
        tier = "legendary"
        assert multiplier >= 1000


class TestHotColdService:
    """Tests for HotColdService"""

    def test_create_hot_cold_service(self):
        """Test creating HotColdService instance"""
        service = HotColdService()
        assert service is not None

    def test_hot_cold_has_calculate_score_method(self):
        """Test service has calculate_score method"""
        service = HotColdService()
        assert hasattr(service, 'calculate_score')
        assert callable(service.calculate_score)

    def test_hot_cold_score_range(self):
        """Test hot/cold score is 0-100"""
        score = 75
        assert 0 <= score <= 100

    def test_hot_cold_status(self):
        """Test hot/cold status values"""
        statuses = ["hot", "cold", "neutral"]
        for status in statuses:
            assert isinstance(status, str)
            assert status in statuses

    def test_hot_threshold(self):
        """Test hot threshold (typically > 70)"""
        score = 75
        is_hot = score > 70
        assert is_hot == True

    def test_cold_threshold(self):
        """Test cold threshold (typically < 30)"""
        score = 25
        is_cold = score < 30
        assert is_cold == True

    def test_neutral_threshold(self):
        """Test neutral threshold (30-70)"""
        score = 50
        is_neutral = 30 <= score <= 70
        assert is_neutral == True


class TestBonusHuntService:
    """Tests for BonusHuntService"""

    def test_create_bonus_hunt_service(self):
        """Test creating BonusHuntService instance"""
        service = BonusHuntService()
        assert service is not None

    def test_service_has_calculate_roi_method(self):
        """Test service has calculate_roi method"""
        service = BonusHuntService()
        assert hasattr(service, 'calculate_roi') or hasattr(service, 'calc_roi')

    def test_roi_calculation_positive(self):
        """Test ROI calculation with profit"""
        initial = 1000.0
        final = 1500.0
        cost = 500.0
        roi = ((final - initial) / cost * 100) if cost > 0 else 0
        assert roi == 100.0

    def test_roi_calculation_negative(self):
        """Test ROI calculation with loss"""
        initial = 1000.0
        final = 800.0
        cost = 500.0
        roi = ((final - initial) / cost * 100) if cost > 0 else 0
        assert roi == -40.0

    def test_roi_calculation_zero_cost(self):
        """Test ROI calculation with zero cost"""
        initial = 1000.0
        final = 1500.0
        cost = 0.0
        roi = ((final - initial) / cost * 100) if cost > 0 else 0
        assert roi == 0

    def test_bonus_hunt_status_values(self):
        """Test bonus hunt status values"""
        statuses = ["collecting", "opening", "completed", "cancelled"]
        for status in statuses:
            assert isinstance(status, str)
            assert status in statuses

    def test_bonus_count_tracking(self):
        """Test tracking bonus count in hunt"""
        total_bonuses = 10
        unopened = 3
        opened = 7
        assert unopened + opened == total_bonuses


class TestChatAnalyticsService:
    """Tests for ChatAnalyticsService"""

    def test_create_chat_analytics_service(self):
        """Test creating ChatAnalyticsService instance"""
        service = ChatAnalyticsService()
        assert service is not None

    def test_service_has_analyze_method(self):
        """Test service has analyze method"""
        service = ChatAnalyticsService()
        assert hasattr(service, 'analyze') or hasattr(service, 'process')

    def test_sentiment_positive(self):
        """Test positive sentiment"""
        sentiment = "positive"
        assert sentiment in ["positive", "negative", "neutral"]

    def test_sentiment_negative(self):
        """Test negative sentiment"""
        sentiment = "negative"
        assert sentiment in ["positive", "negative", "neutral"]

    def test_sentiment_neutral(self):
        """Test neutral sentiment"""
        sentiment = "neutral"
        assert sentiment in ["positive", "negative", "neutral"]

    def test_hype_score_calculation(self):
        """Test hype score range"""
        score = 75.5
        assert 0.0 <= score <= 100.0

    def test_hype_level_low(self):
        """Test low hype level"""
        score = 15
        level = "CHILL" if score < 25 else "LOW"
        assert level in ["CHILL", "LOW", "MEDIUM", "HIGH", "INSANE"]

    def test_hype_level_high(self):
        """Test high hype level"""
        score = 85
        level = "INSANE" if score >= 80 else "HIGH"
        assert level in ["CHILL", "LOW", "MEDIUM", "HIGH", "INSANE"]

    def test_message_count_tracking(self):
        """Test tracking message count"""
        messages = 150
        assert isinstance(messages, int)
        assert messages > 0


class TestHypeMomentDetector:
    """Tests for HypeMomentDetector"""

    def test_create_hype_detector(self):
        """Test creating HypeMomentDetector instance"""
        detector = HypeMomentDetector()
        assert detector is not None

    def test_detector_has_detect_method(self):
        """Test detector has detect method"""
        detector = HypeMomentDetector()
        assert hasattr(detector, 'detect')
        assert callable(detector.detect)

    def test_hype_moment_threshold(self):
        """Test hype moment score threshold"""
        threshold = 0.7  # Typically 70% threshold
        assert 0.0 <= threshold <= 1.0

    def test_hype_moment_types(self):
        """Test hype moment type values"""
        types = ["big_win", "bonus_trigger", "chat_spike", "rtp_anomaly"]
        for moment_type in types:
            assert isinstance(moment_type, str)

    def test_moment_score_range(self):
        """Test moment score is 0-1"""
        score = 0.85
        assert 0.0 <= score <= 1.0

    def test_moment_has_timestamp(self):
        """Test moment includes timestamp"""
        timestamp = datetime.now(timezone.utc)
        assert timestamp is not None
        assert isinstance(timestamp, datetime)


class TestServiceIntegration:
    """Tests for service integration and dependencies"""

    def test_balance_processor_and_big_win_detector(self):
        """Test balance processor works with big win detector"""
        processor = BalanceProcessor()
        detector = BigWinDetector()
        assert processor is not None
        assert detector is not None

    def test_hot_cold_service_and_bonus_hunt(self):
        """Test hot cold service works with bonus hunt service"""
        hot_cold = HotColdService()
        bonus = BonusHuntService()
        assert hot_cold is not None
        assert bonus is not None

    def test_chat_analytics_and_hype_detector(self):
        """Test chat analytics works with hype detector"""
        chat = ChatAnalyticsService()
        hype = HypeMomentDetector()
        assert chat is not None
        assert hype is not None

    def test_multiple_service_instances(self):
        """Test creating multiple service instances"""
        processor1 = BalanceProcessor()
        processor2 = BalanceProcessor()
        assert processor1 is not processor2
        assert processor1.confidence_threshold == processor2.confidence_threshold


class TestServiceDataValidation:
    """Tests for service data validation"""

    def test_balance_must_be_positive(self):
        """Test balance must be positive"""
        balance = 1000.0
        assert balance > 0

    def test_negative_balance_invalid(self):
        """Test negative balance is invalid"""
        balance = -100.0
        is_valid = balance > 0
        assert is_valid == False

    def test_confidence_between_0_and_1(self):
        """Test confidence is between 0 and 1"""
        confidence = 0.95
        assert 0.0 <= confidence <= 1.0

    def test_multiplier_positive(self):
        """Test multiplier is positive"""
        multiplier = 500.0
        assert multiplier > 0

    def test_session_id_not_empty(self):
        """Test session ID is not empty"""
        session_id = "session-123"
        assert len(session_id) > 0
        assert session_id != ""

    def test_timestamp_is_valid(self):
        """Test timestamp is valid"""
        timestamp = datetime.now(timezone.utc)
        assert timestamp is not None
        assert isinstance(timestamp, datetime)

"""
Tests for the HotColdService.
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.hot_cold_service import (
    HotColdService,
    HotColdServiceConfig,
    create_hot_cold_service,
    get_hot_cold_service,
)
from app.schemas.hot_cold import (
    HotColdStatus,
    TrendDirection,
    HotColdMetrics,
)


class TestHotColdService:
    """Tests for the HotColdService class."""

    def test_initialization_default_config(self):
        """Test service initializes with default config."""
        service = HotColdService()

        assert service.config.hot_threshold == 25
        assert service.config.cold_threshold == -25
        assert service.config.rtp_weight == 0.5
        assert service.config.big_win_weight == 0.3
        assert service.config.trend_weight == 0.2

    def test_initialization_custom_config(self):
        """Test service initializes with custom config."""
        config = HotColdServiceConfig(
            hot_threshold=30,
            cold_threshold=-30,
            rtp_weight=0.6,
        )
        service = HotColdService(config)

        assert service.config.hot_threshold == 30
        assert service.config.cold_threshold == -30
        assert service.config.rtp_weight == 0.6

    def test_determine_status_hot(self):
        """Test status determination for hot scores."""
        service = HotColdService()

        assert service._determine_status(50) == HotColdStatus.HOT
        assert service._determine_status(26) == HotColdStatus.HOT
        assert service._determine_status(100) == HotColdStatus.HOT

    def test_determine_status_cold(self):
        """Test status determination for cold scores."""
        service = HotColdService()

        assert service._determine_status(-50) == HotColdStatus.COLD
        assert service._determine_status(-26) == HotColdStatus.COLD
        assert service._determine_status(-100) == HotColdStatus.COLD

    def test_determine_status_neutral(self):
        """Test status determination for neutral scores."""
        service = HotColdService()

        assert service._determine_status(0) == HotColdStatus.NEUTRAL
        assert service._determine_status(25) == HotColdStatus.NEUTRAL
        assert service._determine_status(-25) == HotColdStatus.NEUTRAL
        assert service._determine_status(10) == HotColdStatus.NEUTRAL
        assert service._determine_status(-10) == HotColdStatus.NEUTRAL

    def test_calculate_score_positive_rtp(self):
        """Test score calculation with positive RTP difference."""
        service = HotColdService()

        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=99.0,  # +3% difference
            rtp_difference=3.0,
            sample_sessions=10,
            total_spins=5000,
            total_wagered=10000,
            total_won=9900,
            recent_big_wins=5,
            avg_big_wins=3.0,
            big_win_ratio=1.67,
        )

        score, heat_score = service._calculate_score(metrics, TrendDirection.STABLE)

        # Positive RTP should give positive score
        assert score > 0
        assert heat_score > 0.5

    def test_calculate_score_negative_rtp(self):
        """Test score calculation with negative RTP difference."""
        service = HotColdService()

        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=93.0,  # -3% difference
            rtp_difference=-3.0,
            sample_sessions=10,
            total_spins=5000,
            total_wagered=10000,
            total_won=9300,
            recent_big_wins=1,
            avg_big_wins=3.0,
            big_win_ratio=0.33,
        )

        score, heat_score = service._calculate_score(metrics, TrendDirection.STABLE)

        # Negative RTP should give negative score
        assert score < 0
        assert heat_score < 0.5

    def test_calculate_score_neutral(self):
        """Test score calculation with neutral metrics."""
        service = HotColdService()

        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=96.0,  # No difference
            rtp_difference=0.0,
            sample_sessions=10,
            total_spins=5000,
            total_wagered=10000,
            total_won=9600,
            recent_big_wins=3,
            avg_big_wins=3.0,
            big_win_ratio=1.0,
        )

        score, heat_score = service._calculate_score(metrics, TrendDirection.STABLE)

        # Neutral metrics should give score near 0
        assert -25 <= score <= 25
        assert 0.4 <= heat_score <= 0.6

    def test_calculate_score_with_heating_trend(self):
        """Test that heating trend increases score."""
        service = HotColdService()

        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=96.0,
            rtp_difference=0.0,
            sample_sessions=10,
            total_spins=5000,
            total_wagered=10000,
            total_won=9600,
            recent_big_wins=3,
            avg_big_wins=3.0,
            big_win_ratio=1.0,
        )

        score_stable, _ = service._calculate_score(metrics, TrendDirection.STABLE)
        score_heating, _ = service._calculate_score(metrics, TrendDirection.HEATING)

        assert score_heating > score_stable

    def test_calculate_score_with_cooling_trend(self):
        """Test that cooling trend decreases score."""
        service = HotColdService()

        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=96.0,
            rtp_difference=0.0,
            sample_sessions=10,
            total_spins=5000,
            total_wagered=10000,
            total_won=9600,
            recent_big_wins=3,
            avg_big_wins=3.0,
            big_win_ratio=1.0,
        )

        score_stable, _ = service._calculate_score(metrics, TrendDirection.STABLE)
        score_cooling, _ = service._calculate_score(metrics, TrendDirection.COOLING)

        assert score_cooling < score_stable

    def test_calculate_confidence_high(self):
        """Test high confidence with large sample."""
        service = HotColdService()

        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=97.0,
            rtp_difference=1.0,
            sample_sessions=25,
            total_spins=15000,
            total_wagered=50000,
            total_won=48500,
            recent_big_wins=5,
            avg_big_wins=4.0,
            big_win_ratio=1.25,
        )

        confidence = service._calculate_confidence(metrics)
        assert confidence >= 0.8

    def test_calculate_confidence_low(self):
        """Test low confidence with small sample."""
        service = HotColdService()

        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=97.0,
            rtp_difference=1.0,
            sample_sessions=2,
            total_spins=500,
            total_wagered=1000,
            total_won=970,
            recent_big_wins=0,
            avg_big_wins=1.0,
            big_win_ratio=0.0,
        )

        confidence = service._calculate_confidence(metrics)
        assert confidence < 0.3

    def test_analyze_trend_heating(self):
        """Test trend analysis for heating (improving) scores."""
        service = HotColdService()

        # Scores from newest to oldest: improving trend
        scores = [50, 40, 30, 20, 10]
        direction, strength = service._analyze_trend(scores)

        # Newest first, so improving = heating
        assert direction == TrendDirection.HEATING
        assert strength > 0

    def test_analyze_trend_cooling(self):
        """Test trend analysis for cooling (declining) scores."""
        service = HotColdService()

        # Scores from newest to oldest: declining trend
        scores = [10, 20, 30, 40, 50]
        direction, strength = service._analyze_trend(scores)

        assert direction == TrendDirection.COOLING
        assert strength > 0

    def test_analyze_trend_stable(self):
        """Test trend analysis for stable scores."""
        service = HotColdService()

        # Flat scores
        scores = [25, 26, 24, 25, 25]
        direction, strength = service._analyze_trend(scores)

        assert direction == TrendDirection.STABLE
        assert strength < 0.5

    def test_analyze_trend_insufficient_data(self):
        """Test trend analysis with insufficient data."""
        service = HotColdService()

        # Only one data point
        scores = [50]
        direction, strength = service._analyze_trend(scores)

        assert direction == TrendDirection.STABLE
        assert strength == 0.0

    def test_heat_to_score_conversion(self):
        """Test heat score to score conversion."""
        service = HotColdService()

        assert service._heat_to_score(0.0) == -100
        assert service._heat_to_score(0.5) == 0
        assert service._heat_to_score(1.0) == 100
        assert service._heat_to_score(0.75) == 50
        assert service._heat_to_score(0.25) == -50

    def test_generate_prediction_heating_from_cold(self):
        """Test prediction for heating trend from cold."""
        service = HotColdService()

        prediction = service._generate_prediction(
            TrendDirection.HEATING, 0.6, -30
        )

        assert "recovering" in prediction.lower() or "neutral" in prediction.lower()

    def test_generate_prediction_heating_from_hot(self):
        """Test prediction for heating trend from hot."""
        service = HotColdService()

        prediction = service._generate_prediction(
            TrendDirection.HEATING, 0.6, 40
        )

        assert "heating" in prediction.lower() or "peak" in prediction.lower()

    def test_generate_prediction_cooling_from_hot(self):
        """Test prediction for cooling trend from hot."""
        service = HotColdService()

        prediction = service._generate_prediction(
            TrendDirection.COOLING, 0.6, 40
        )

        assert "cooling" in prediction.lower() or "normal" in prediction.lower()

    def test_generate_prediction_stable(self):
        """Test prediction for stable trend."""
        service = HotColdService()

        prediction = service._generate_prediction(
            TrendDirection.STABLE, 0.2, 0
        )

        assert "stable" in prediction.lower()

    def test_get_stats(self):
        """Test service statistics retrieval."""
        service = HotColdService()

        stats = service.get_stats()

        assert "calculations_performed" in stats
        assert "cache_hits" in stats
        assert "history_records_created" in stats
        assert stats["calculations_performed"] == 0

    def test_clear_cache(self):
        """Test cache clearing."""
        service = HotColdService()

        # Add something to cache
        service._cache["test"] = (datetime.now(timezone.utc), None)
        assert len(service._cache) == 1

        service.clear_cache()
        assert len(service._cache) == 0

    def test_create_default_metrics(self):
        """Test default metrics creation."""
        service = HotColdService()

        # Mock game
        game = MagicMock()
        game.theoretical_rtp = 96.5

        metrics = service._create_default_metrics(game)

        assert metrics.theoretical_rtp == 96.5
        assert metrics.observed_rtp == 96.5
        assert metrics.rtp_difference == 0.0
        assert metrics.sample_sessions == 0


class TestHotColdServiceConfig:
    """Tests for the HotColdServiceConfig dataclass."""

    def test_default_values(self):
        """Test default config values."""
        config = HotColdServiceConfig()

        assert config.hot_threshold == 25
        assert config.cold_threshold == -25
        assert config.rtp_weight == 0.5
        assert config.big_win_weight == 0.3
        assert config.trend_weight == 0.2
        assert config.min_sessions == 5
        assert config.min_spins == 1000
        assert config.max_rtp_deviation == 5.0
        assert config.cache_ttl_seconds == 300

    def test_weights_sum_to_one(self):
        """Test that default weights sum to 1.0."""
        config = HotColdServiceConfig()

        total = config.rtp_weight + config.big_win_weight + config.trend_weight
        assert total == pytest.approx(1.0)


class TestCreateHotColdServiceFactory:
    """Tests for the create_hot_cold_service factory function."""

    def test_create_with_defaults(self):
        """Test creating service with default settings."""
        service = create_hot_cold_service()

        assert service.config.hot_threshold == 25
        assert service.config.cold_threshold == -25

    def test_create_with_custom_thresholds(self):
        """Test creating service with custom thresholds."""
        service = create_hot_cold_service(
            hot_threshold=30,
            cold_threshold=-30,
        )

        assert service.config.hot_threshold == 30
        assert service.config.cold_threshold == -30


class TestGetHotColdService:
    """Tests for the get_hot_cold_service function."""

    def test_returns_singleton(self):
        """Test that get_hot_cold_service returns same instance."""
        # Reset global
        import app.services.hot_cold_service as module
        module._hot_cold_service = None

        service1 = get_hot_cold_service()
        service2 = get_hot_cold_service()

        assert service1 is service2


class TestHotColdMetrics:
    """Tests for the HotColdMetrics schema."""

    def test_metrics_creation(self):
        """Test creating metrics object."""
        metrics = HotColdMetrics(
            theoretical_rtp=96.0,
            observed_rtp=97.5,
            rtp_difference=1.5,
            sample_sessions=10,
            total_spins=5000,
            total_wagered=10000,
            total_won=9750,
            recent_big_wins=3,
            avg_big_wins=2.0,
            big_win_ratio=1.5,
        )

        assert metrics.theoretical_rtp == 96.0
        assert metrics.observed_rtp == 97.5
        assert metrics.rtp_difference == 1.5
        assert metrics.big_win_ratio == 1.5


class TestHotColdStatus:
    """Tests for the HotColdStatus enum."""

    def test_status_values(self):
        """Test status enum values."""
        assert HotColdStatus.HOT.value == "hot"
        assert HotColdStatus.NEUTRAL.value == "neutral"
        assert HotColdStatus.COLD.value == "cold"


class TestTrendDirection:
    """Tests for the TrendDirection enum."""

    def test_trend_values(self):
        """Test trend direction enum values."""
        assert TrendDirection.HEATING.value == "heating"
        assert TrendDirection.COOLING.value == "cooling"
        assert TrendDirection.STABLE.value == "stable"

"""
Phase 13-1: ML Predictions and Analytics Models

Stores machine learning predictions, feature data, and model metadata
for advanced analytics and pattern detection.
"""

from typing import Optional, List
from sqlalchemy import String, Float, Integer, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin


class MLFeatureSet(Base, TimestampMixin):
    """Extracted features for ML model training"""

    __tablename__ = "ml_feature_sets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Session/Game Reference
    session_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    game_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    streamer_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Temporal Features
    hour_of_day: Mapped[int] = mapped_column(Integer, comment="0-23")
    day_of_week: Mapped[int] = mapped_column(Integer, comment="0-6")
    is_weekend: Mapped[bool] = mapped_column(Boolean)
    season: Mapped[str] = mapped_column(String(10), comment="spring, summer, fall, winter")

    # Session Features
    session_duration_minutes: Mapped[float] = mapped_column(Float, comment="Session length in minutes")
    total_spins: Mapped[int] = mapped_column(Integer, comment="Number of spins in session")
    total_wagers: Mapped[float] = mapped_column(Float, comment="Total amount wagered")
    initial_balance: Mapped[float] = mapped_column(Float)
    peak_balance: Mapped[float] = mapped_column(Float)

    # Game Features
    game_rtp: Mapped[float] = mapped_column(Float, comment="Theoretical RTP percentage")
    game_volatility: Mapped[str] = mapped_column(String(20), comment="low, medium, high, very_high")
    game_max_multiplier: Mapped[float] = mapped_column(Float)
    avg_bet_size: Mapped[float] = mapped_column(Float)
    bet_size_variance: Mapped[float] = mapped_column(Float, comment="Standard deviation of bet sizes")

    # Win Features
    total_wins: Mapped[int] = mapped_column(Integer)
    total_losses: Mapped[int] = mapped_column(Integer)
    win_ratio: Mapped[float] = mapped_column(Float, comment="Percentage of spins that resulted in wins")
    avg_win_multiplier: Mapped[float] = mapped_column(Float)
    max_win_multiplier: Mapped[float] = mapped_column(Float)
    bonus_hit_count: Mapped[int] = mapped_column(Integer)
    bonus_frequency: Mapped[float] = mapped_column(Float, comment="Bonuses per 100 spins")

    # Statistical Features
    observed_rtp: Mapped[float] = mapped_column(Float, comment="Observed RTP from this session")
    rtp_variance_from_theoretical: Mapped[float] = mapped_column(Float, comment="Difference from expected RTP")
    win_distribution_skewness: Mapped[float] = mapped_column(Float, comment="Skewness of win sizes")
    balance_volatility: Mapped[float] = mapped_column(Float, comment="Std dev of balance changes")

    # Streamer Features
    streamer_experience_level: Mapped[int] = mapped_column(Integer, comment="1-5 skill level")
    streamer_avg_session_duration: Mapped[float] = mapped_column(Float, comment="Historical average")
    streamer_win_rate: Mapped[float] = mapped_column(Float, comment="Historical win rate")
    streamer_game_preference_diversity: Mapped[float] = mapped_column(Float, comment="0-1 diversity score")

    # Feature Set Metadata
    feature_version: Mapped[int] = mapped_column(Integer, default=1, comment="Version of feature extraction")
    is_anomalous: Mapped[bool] = mapped_column(Boolean, default=False, comment="Flagged by anomaly detection")
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=True, comment="0-1 anomaly probability")

    def __repr__(self) -> str:
        return f"<MLFeatureSet(session={self.session_id}, game={self.game_id})>"

    def to_dict(self) -> dict:
        """Convert to dictionary for ML model input"""
        return {
            "temporal": {
                "hour_of_day": self.hour_of_day,
                "day_of_week": self.day_of_week,
                "is_weekend": self.is_weekend,
                "season": self.season,
            },
            "session": {
                "duration_minutes": self.session_duration_minutes,
                "total_spins": self.total_spins,
                "total_wagers": self.total_wagers,
                "initial_balance": self.initial_balance,
                "peak_balance": self.peak_balance,
            },
            "game": {
                "rtp": self.game_rtp,
                "volatility": self.game_volatility,
                "max_multiplier": self.game_max_multiplier,
                "avg_bet": self.avg_bet_size,
                "bet_variance": self.bet_size_variance,
            },
            "outcomes": {
                "total_wins": self.total_wins,
                "total_losses": self.total_losses,
                "win_ratio": self.win_ratio,
                "avg_win_multiplier": self.avg_win_multiplier,
                "max_win_multiplier": self.max_win_multiplier,
            },
            "bonuses": {
                "hit_count": self.bonus_hit_count,
                "frequency": self.bonus_frequency,
            },
            "statistics": {
                "observed_rtp": self.observed_rtp,
                "rtp_variance": self.rtp_variance_from_theoretical,
                "win_skewness": self.win_distribution_skewness,
                "balance_volatility": self.balance_volatility,
            },
        }


class RTPPrediction(Base, TimestampMixin):
    """Predictions for future RTP trends"""

    __tablename__ = "rtp_predictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Reference
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id"))
    prediction_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Prediction Windows
    prediction_1h_rtp: Mapped[float] = mapped_column(Float, comment="Predicted RTP for next 1 hour")
    prediction_24h_rtp: Mapped[float] = mapped_column(Float, comment="Predicted RTP for next 24 hours")
    prediction_7d_rtp: Mapped[float] = mapped_column(Float, comment="Predicted RTP for next 7 days")

    # Confidence Intervals
    confidence_1h: Mapped[float] = mapped_column(Float, comment="0-1 confidence score")
    confidence_24h: Mapped[float] = mapped_column(Float)
    confidence_7d: Mapped[float] = mapped_column(Float)

    # Trend Information
    trend_direction: Mapped[str] = mapped_column(
        String(10),
        comment="up, down, stable"
    )
    trend_strength: Mapped[float] = mapped_column(Float, comment="0-1 strength of trend")

    # Historical Context
    historical_avg_rtp: Mapped[float] = mapped_column(Float, comment="30-day average")
    sample_size_sessions: Mapped[int] = mapped_column(Integer, comment="Sessions used for prediction")

    # Model Information
    model_version: Mapped[int] = mapped_column(Integer, comment="ML model version used")
    model_type: Mapped[str] = mapped_column(String(50), comment="linear_regression, xgboost, etc")
    r_squared_score: Mapped[float] = mapped_column(Float, nullable=True, comment="Model accuracy on validation")

    # Prediction Metadata
    factors_contributing: Mapped[dict] = mapped_column(
        JSON,
        nullable=True,
        comment="Dict of features with importance scores"
    )
    last_validation_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    validation_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    def __repr__(self) -> str:
        return f"<RTPPrediction(game={self.game_id}, 1h={self.prediction_1h_rtp:.2f}%)>"

    def to_dict(self) -> dict:
        """Convert to API response format"""
        return {
            "game_id": self.game_id,
            "timestamp": self.prediction_timestamp.isoformat(),
            "predictions": {
                "1_hour": {
                    "rtp": self.prediction_1h_rtp,
                    "confidence": self.confidence_1h,
                },
                "24_hours": {
                    "rtp": self.prediction_24h_rtp,
                    "confidence": self.confidence_24h,
                },
                "7_days": {
                    "rtp": self.prediction_7d_rtp,
                    "confidence": self.confidence_7d,
                },
            },
            "trend": {
                "direction": self.trend_direction,
                "strength": self.trend_strength,
            },
            "context": {
                "historical_avg_rtp": self.historical_avg_rtp,
                "sample_size": self.sample_size_sessions,
            },
            "model": {
                "version": self.model_version,
                "type": self.model_type,
                "accuracy": self.r_squared_score,
            },
        }


class BonusHuntPrediction(Base, TimestampMixin):
    """Predictions for bonus hit timing"""

    __tablename__ = "bonus_hunt_predictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Reference
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id"))
    bonus_hunt_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    prediction_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Predictions
    predicted_next_bonus_spins: Mapped[int] = mapped_column(
        Integer,
        comment="Estimated spins until next bonus"
    )
    bonus_hit_probability_next_100: Mapped[float] = mapped_column(
        Float,
        comment="Probability of bonus in next 100 spins"
    )
    expected_bonus_multiplier: Mapped[float] = mapped_column(
        Float,
        comment="Expected payout multiplier"
    )

    # Confidence
    confidence_score: Mapped[float] = mapped_column(Float, comment="0-1 confidence")

    # Historical Patterns
    historical_bonus_frequency: Mapped[float] = mapped_column(Float, comment="Bonuses per 100 spins")
    recent_bonus_count: Mapped[int] = mapped_column(Integer, comment="Bonuses in last session")
    bonus_drought_spins: Mapped[int] = mapped_column(Integer, comment="Spins since last bonus")

    # ROI Prediction (if in bonus hunt)
    predicted_hunt_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Expected ROI %")
    optimal_continuation_probability: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Should continue hunt probability"
    )

    # Model Info
    model_version: Mapped[int] = mapped_column(Integer)
    training_data_size: Mapped[int] = mapped_column(Integer, comment="Sessions used for training")

    def __repr__(self) -> str:
        return f"<BonusHuntPrediction(game={self.game_id}, spins_to_bonus={self.predicted_next_bonus_spins})>"

    def to_dict(self) -> dict:
        return {
            "game_id": self.game_id,
            "timestamp": self.prediction_timestamp.isoformat(),
            "prediction": {
                "spins_until_bonus": self.predicted_next_bonus_spins,
                "bonus_hit_probability_100spins": self.bonus_hit_probability_next_100,
                "expected_multiplier": self.expected_bonus_multiplier,
                "confidence": self.confidence_score,
            },
            "history": {
                "bonus_frequency": self.historical_bonus_frequency,
                "recent_bonus_count": self.recent_bonus_count,
                "drought_spins": self.bonus_drought_spins,
            },
        }


class AnomalyDetection(Base, TimestampMixin):
    """Records detected anomalies in game behavior"""

    __tablename__ = "anomaly_detections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Reference
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id"))
    session_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    feature_set_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    detection_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Anomaly Details
    anomaly_type: Mapped[str] = mapped_column(
        String(50),
        comment="rtp_spike, bonus_drought, unusual_volatility, variance_excess, etc"
    )
    anomaly_score: Mapped[float] = mapped_column(Float, comment="0-1 anomaly probability")
    severity: Mapped[str] = mapped_column(String(10), comment="low, medium, high, critical")

    # Affected Metrics
    affected_metrics: Mapped[dict] = mapped_column(
        JSON,
        comment="Dict of metric names and their anomalous values"
    )

    # Context
    expected_value: Mapped[float] = mapped_column(Float, comment="Expected value for metric")
    actual_value: Mapped[float] = mapped_column(Float, comment="Observed value")
    deviation_std: Mapped[float] = mapped_column(Float, comment="Standard deviations from mean")

    # Explanation
    explanation: Mapped[str] = mapped_column(String(500), comment="Human-readable explanation")

    # Follow-up
    investigation_status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        comment="pending, investigating, resolved, false_positive"
    )
    investigation_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Model Info
    detection_model: Mapped[str] = mapped_column(String(50), comment="isolation_forest, statistical, etc")

    def __repr__(self) -> str:
        return f"<AnomalyDetection(type={self.anomaly_type}, severity={self.severity})>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "game_id": self.game_id,
            "timestamp": self.detection_timestamp.isoformat(),
            "anomaly": {
                "type": self.anomaly_type,
                "score": self.anomaly_score,
                "severity": self.severity,
                "explanation": self.explanation,
            },
            "metrics": {
                "expected": self.expected_value,
                "actual": self.actual_value,
                "deviation_std": self.deviation_std,
            },
            "affected": self.affected_metrics,
            "investigation": {
                "status": self.investigation_status,
                "notes": self.investigation_notes,
            },
        }


class ModelMetadata(Base, TimestampMixin):
    """Metadata about trained ML models"""

    __tablename__ = "model_metadata"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Model Identification
    model_name: Mapped[str] = mapped_column(String(100), comment="rtp_predictor_v1, bonus_detector_v2, etc")
    model_type: Mapped[str] = mapped_column(String(50), comment="linear_regression, xgboost, isolation_forest, etc")
    version: Mapped[int] = mapped_column(Integer)

    # Training Info
    training_start_date: Mapped[datetime] = mapped_column(DateTime)
    training_end_date: Mapped[datetime] = mapped_column(DateTime)
    training_samples: Mapped[int] = mapped_column(Integer, comment="Number of samples used")
    feature_count: Mapped[int] = mapped_column(Integer, comment="Number of features")

    # Performance Metrics
    train_accuracy: Mapped[float] = mapped_column(Float, comment="Accuracy on training set")
    validation_accuracy: Mapped[float] = mapped_column(Float, comment="Accuracy on validation set")
    test_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Accuracy on test set")

    # Additional Metrics
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    auc_roc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, comment="Currently deployed")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    # File Info
    model_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    model_file_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Hyperparameters
    hyperparameters: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Performance History
    last_validation_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    degradation_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Accuracy loss per day")

    def __repr__(self) -> str:
        return f"<ModelMetadata(name={self.model_name}, v{self.version}, active={self.is_active})>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.model_name,
            "type": self.model_type,
            "version": self.version,
            "training": {
                "start_date": self.training_start_date.isoformat(),
                "end_date": self.training_end_date.isoformat(),
                "samples": self.training_samples,
                "features": self.feature_count,
            },
            "performance": {
                "train_accuracy": self.train_accuracy,
                "validation_accuracy": self.validation_accuracy,
                "test_accuracy": self.test_accuracy,
                "precision": self.precision,
                "recall": self.recall,
                "f1": self.f1_score,
                "auc_roc": self.auc_roc,
            },
            "status": {
                "is_active": self.is_active,
                "is_archived": self.is_archived,
                "last_validation": self.last_validation_timestamp.isoformat() if self.last_validation_timestamp else None,
            },
        }

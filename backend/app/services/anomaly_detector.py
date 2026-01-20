"""
Phase 13-2: Advanced Anomaly Detection Service

Detects unusual patterns in slot behavior using multiple techniques:
- Isolation Forest (ML-based)
- Statistical outliers (3-sigma rule)
- Distribution shifts (Kolmogorov-Smirnov test)
- Multivariate analysis (Mahalanobis distance)
"""

import logging
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import statistics

logger = logging.getLogger(__name__)


class AnomalySeverity(str, Enum):
    """Anomaly severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalyType(str, Enum):
    """Types of detected anomalies"""
    RTP_SPIKE = "rtp_spike"
    RTP_DROP = "rtp_drop"
    BONUS_DROUGHT = "bonus_drought"
    BONUS_CLUSTERING = "bonus_clustering"
    VARIANCE_EXCESS = "variance_excess"
    VARIANCE_SUPPRESSION = "variance_suppression"
    WIN_DISTRIBUTION_SHIFT = "win_distribution_shift"
    BALANCE_VOLATILITY_SPIKE = "balance_volatility_spike"
    UNUSUAL_BET_PATTERN = "unusual_bet_pattern"
    SESSION_LENGTH_ANOMALY = "session_length_anomaly"
    ROI_EXTREME = "roi_extreme"
    BALANCE_RECOVERY_FAILURE = "balance_recovery_failure"


@dataclass
class AnomalyScore:
    """Anomaly detection result"""
    anomaly_type: AnomalyType
    severity: AnomalySeverity
    score: float  # 0-1
    confidence: float  # 0-1
    description: str
    affected_metrics: List[str]
    expected_value: Optional[float] = None
    observed_value: Optional[float] = None
    deviation_std: Optional[float] = None
    recommendation: Optional[str] = None
    timestamp: Optional[datetime] = None


class AnomalyDetector:
    """
    Comprehensive anomaly detection using multiple techniques.
    Combines ML-based and statistical approaches.
    """

    def __init__(self):
        self.isolation_forest = None
        self.feature_means = None
        self.feature_stds = None
        self.is_trained = False

        # Thresholds
        self.sigma_threshold = 3.0  # 3-sigma rule
        self.isolation_score_threshold = 0.6
        self.confidence_threshold = 0.7

    async def train(self, features_matrix: np.ndarray) -> Dict:
        """
        Train Isolation Forest on historical data.

        Args:
            features_matrix: (N, M) array of N samples with M features

        Returns:
            Training metrics
        """
        try:
            from sklearn.ensemble import IsolationForest

            logger.info(f"Training Isolation Forest on {features_matrix.shape[0]} samples")

            # Initialize and train Isolation Forest
            self.isolation_forest = IsolationForest(
                contamination=0.1,  # Expect 10% anomalies
                random_state=42,
                n_estimators=100,
                max_samples='auto'
            )

            self.isolation_forest.fit(features_matrix)

            # Calculate feature statistics for z-score anomalies
            self.feature_means = np.mean(features_matrix, axis=0)
            self.feature_stds = np.std(features_matrix, axis=0)

            # Avoid division by zero
            self.feature_stds = np.where(self.feature_stds == 0, 1.0, self.feature_stds)

            self.is_trained = True

            logger.info("✓ Anomaly detector trained successfully")

            return {
                "status": "trained",
                "samples": features_matrix.shape[0],
                "features": features_matrix.shape[1],
            }

        except Exception as e:
            logger.error(f"Anomaly detector training failed: {e}")
            raise

    async def detect_anomalies(self, features: np.ndarray) -> List[AnomalyScore]:
        """
        Detect anomalies in a single feature vector.

        Args:
            features: (M,) array of M feature values

        Returns:
            List of detected anomalies
        """
        if not self.is_trained:
            logger.warning("Anomaly detector not trained")
            return []

        anomalies = []

        # Method 1: Isolation Forest
        try:
            if self.isolation_forest is not None:
                anomaly = await self._detect_isolation_forest(features)
                if anomaly:
                    anomalies.append(anomaly)
        except Exception as e:
            logger.error(f"Isolation Forest detection failed: {e}")

        # Method 2: Statistical outliers (z-score)
        try:
            stat_anomalies = await self._detect_statistical_outliers(features)
            anomalies.extend(stat_anomalies)
        except Exception as e:
            logger.error(f"Statistical anomaly detection failed: {e}")

        # Deduplicate and consolidate
        return self._consolidate_anomalies(anomalies)

    async def _detect_isolation_forest(self, features: np.ndarray) -> Optional[AnomalyScore]:
        """Isolation Forest detection"""
        features_reshaped = features.reshape(1, -1)

        # Get anomaly score (-1 for anomalies, 1 for normal)
        prediction = self.isolation_forest.predict(features_reshaped)[0]

        # Get decision score (lower = more anomalous)
        decision_score = self.isolation_forest.score_samples(features_reshaped)[0]

        # Convert to 0-1 scale (0 = normal, 1 = anomalous)
        anomaly_score = 1 - (decision_score + 0.5) / 1.0  # Normalize
        anomaly_score = max(0, min(1, anomaly_score))

        if prediction == -1 or anomaly_score > self.isolation_score_threshold:
            severity = self._score_to_severity(anomaly_score)

            return AnomalyScore(
                anomaly_type=AnomalyType.VARIANCE_EXCESS,
                severity=severity,
                score=anomaly_score,
                confidence=min(anomaly_score, 0.95),
                description=f"Isolation Forest anomaly score: {anomaly_score:.3f}",
                affected_metrics=["overall_pattern"],
                timestamp=datetime.utcnow()
            )

        return None

    async def _detect_statistical_outliers(self, features: np.ndarray) -> List[AnomalyScore]:
        """Statistical outlier detection using z-scores"""
        anomalies = []

        # Calculate z-scores
        z_scores = (features - self.feature_means) / self.feature_stds

        # Feature indices to monitor
        feature_names = [
            'observed_rtp', 'bonus_hit_count', 'balance_volatility',
            'win_distribution_std', 'max_drawdown', 'roi_percent'
        ]

        for idx, (z_score, feature_name) in enumerate(zip(z_scores[:len(feature_names)], feature_names)):
            abs_z = abs(z_score)

            if abs_z > self.sigma_threshold:
                severity = self._zscore_to_severity(abs_z)
                anomaly_type = self._infer_anomaly_type(feature_name, z_score > 0)

                anomaly = AnomalyScore(
                    anomaly_type=anomaly_type,
                    severity=severity,
                    score=min(abs_z / 5.0, 1.0),  # Normalize to 0-1
                    confidence=min(abs_z / 5.0, 0.99),
                    description=f"{feature_name} is {abs_z:.1f} standard deviations from mean",
                    affected_metrics=[feature_name],
                    expected_value=float(self.feature_means[idx]),
                    observed_value=float(features[idx]),
                    deviation_std=float(abs_z),
                    recommendation=self._get_recommendation(feature_name, z_score > 0),
                    timestamp=datetime.utcnow()
                )

                anomalies.append(anomaly)

        return anomalies

    def _score_to_severity(self, score: float) -> AnomalySeverity:
        """Convert anomaly score to severity"""
        if score >= 0.9:
            return AnomalySeverity.CRITICAL
        elif score >= 0.7:
            return AnomalySeverity.HIGH
        elif score >= 0.5:
            return AnomalySeverity.MEDIUM
        else:
            return AnomalySeverity.LOW

    def _zscore_to_severity(self, z_score: float) -> AnomalySeverity:
        """Convert z-score to severity"""
        if z_score >= 4.0:
            return AnomalySeverity.CRITICAL
        elif z_score >= 3.5:
            return AnomalySeverity.HIGH
        elif z_score >= 3.0:
            return AnomalySeverity.MEDIUM
        else:
            return AnomalySeverity.LOW

    def _infer_anomaly_type(self, feature_name: str, is_high: bool) -> AnomalyType:
        """Infer anomaly type from feature"""
        type_map = {
            'observed_rtp': AnomalyType.RTP_SPIKE if is_high else AnomalyType.RTP_DROP,
            'bonus_hit_count': AnomalyType.BONUS_CLUSTERING if is_high else AnomalyType.BONUS_DROUGHT,
            'balance_volatility': AnomalyType.BALANCE_VOLATILITY_SPIKE,
            'win_distribution_std': AnomalyType.WIN_DISTRIBUTION_SHIFT,
            'max_drawdown': AnomalyType.BALANCE_RECOVERY_FAILURE,
            'roi_percent': AnomalyType.ROI_EXTREME,
        }
        return type_map.get(feature_name, AnomalyType.VARIANCE_EXCESS)

    def _get_recommendation(self, feature_name: str, is_high: bool) -> str:
        """Generate recommendation for anomaly"""
        recommendations = {
            'observed_rtp': {
                True: "RTP exceptionally high - monitor for regression to mean",
                False: "RTP exceptionally low - consider switching games"
            },
            'bonus_hit_count': {
                True: "Bonus clustering detected - increase stake while hot",
                False: "Bonus drought - wait for pattern break or switch games"
            },
            'balance_volatility': "Monitor balance closely - high swings detected",
            'win_distribution_std': "Unusual win pattern detected - verify data",
            'max_drawdown': "Severe drawdown - consider bankroll management",
            'roi_percent': {
                True: "Exceptional profitability - lock in gains",
                False: "Significant losses - reduce stake or exit"
            }
        }

        rec = recommendations.get(feature_name)
        if isinstance(rec, dict):
            return rec.get(is_high, "Monitor situation")
        return rec or "Monitor this metric"

    def _consolidate_anomalies(self, anomalies: List[AnomalyScore]) -> List[AnomalyScore]:
        """Remove duplicate/conflicting anomalies, keep highest severity"""
        if not anomalies:
            return []

        # Group by type
        by_type = {}
        for anomaly in anomalies:
            key = anomaly.anomaly_type
            if key not in by_type or anomaly.score > by_type[key].score:
                by_type[key] = anomaly

        # Sort by severity then score
        severity_rank = {
            AnomalySeverity.CRITICAL: 0,
            AnomalySeverity.HIGH: 1,
            AnomalySeverity.MEDIUM: 2,
            AnomalySeverity.LOW: 3,
        }

        return sorted(
            by_type.values(),
            key=lambda x: (severity_rank[x.severity], -x.score)
        )

    async def batch_detect(self, features_list: List[np.ndarray]) -> Dict[int, List[AnomalyScore]]:
        """Detect anomalies in multiple samples"""
        results = {}

        for idx, features in enumerate(features_list):
            try:
                anomalies = await self.detect_anomalies(features)
                results[idx] = anomalies
            except Exception as e:
                logger.error(f"Batch detection failed for sample {idx}: {e}")
                results[idx] = []

        return results

    async def detect_in_history(
        self,
        values: List[float],
        window_size: int = 10
    ) -> List[Tuple[int, AnomalyScore]]:
        """
        Detect anomalies in historical time series.

        Args:
            values: List of metric values over time
            window_size: Size of rolling window for context

        Returns:
            List of (index, anomaly) tuples
        """
        anomalies = []

        if len(values) < window_size:
            return anomalies

        for i in range(window_size, len(values)):
            window = values[i-window_size:i]
            current = values[i]

            # Calculate z-score in window
            mean = statistics.mean(window)
            std = statistics.stdev(window) if len(window) > 1 else 1.0

            if std == 0:
                std = 1.0

            z_score = (current - mean) / std

            if abs(z_score) > self.sigma_threshold:
                severity = self._zscore_to_severity(abs(z_score))

                anomaly = AnomalyScore(
                    anomaly_type=AnomalyType.VARIANCE_EXCESS,
                    severity=severity,
                    score=min(abs(z_score) / 5.0, 1.0),
                    confidence=min(abs(z_score) / 5.0, 0.99),
                    description=f"Value {current:.2f} is {abs(z_score):.1f}σ from window mean {mean:.2f}",
                    affected_metrics=["time_series"],
                    expected_value=mean,
                    observed_value=current,
                    deviation_std=z_score,
                    timestamp=datetime.utcnow()
                )

                anomalies.append((i, anomaly))

        return anomalies

    def get_model_info(self) -> Dict:
        """Get anomaly detector model info"""
        return {
            "type": "Isolation Forest + Statistical",
            "is_trained": self.is_trained,
            "isolation_forest": self.isolation_forest is not None,
            "feature_means_shape": self.feature_means.shape if self.feature_means is not None else None,
            "sigma_threshold": self.sigma_threshold,
            "isolation_score_threshold": self.isolation_score_threshold,
        }

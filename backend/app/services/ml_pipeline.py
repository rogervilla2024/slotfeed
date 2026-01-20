"""
Phase 13-1: ML Pipeline Service

Manages the complete ML workflow:
- Data preparation
- Model training
- Prediction generation
- Model evaluation
"""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
from dataclasses import dataclass
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ModelConfig:
    """Configuration for ML model"""
    model_type: str  # 'linear_regression', 'xgboost', 'random_forest', etc
    target_variable: str  # What to predict: 'rtp', 'bonus_hit', 'balance_change'
    lookback_days: int = 30  # Historical data to use
    min_samples: int = 100  # Minimum samples to train
    test_split: float = 0.2  # Train/test split ratio
    validation_split: float = 0.1  # Validation split ratio
    random_state: int = 42


class MLPipeline:
    """
    Main ML pipeline coordinator.
    Orchestrates data preparation, model training, and predictions.
    """

    def __init__(self, config: ModelConfig):
        self.config = config
        self.feature_names: List[str] = []
        self.scaler = None
        self.model = None
        self.is_trained = False
        self.training_timestamp = None
        self.performance_metrics = {}

    async def prepare_data(self, features_list: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare data for model training.

        Args:
            features_list: List of feature dictionaries

        Returns:
            (X, y) - Features and target variable
        """
        logger.info(f"Preparing {len(features_list)} samples for ML training")

        if len(features_list) < self.config.min_samples:
            raise ValueError(
                f"Not enough samples ({len(features_list)} < {self.config.min_samples})"
            )

        # Extract features and target
        X = []
        y = []

        for features in features_list:
            try:
                x_row = self._extract_feature_vector(features)
                y_val = self._extract_target(features)

                if x_row is not None and y_val is not None:
                    X.append(x_row)
                    y.append(y_val)
            except Exception as e:
                logger.warning(f"Failed to process features: {e}")
                continue

        X = np.array(X, dtype=np.float32)
        y = np.array(y, dtype=np.float32)

        logger.info(f"Prepared {len(X)} valid samples with {X.shape[1]} features")

        return X, y

    def _extract_feature_vector(self, features: Dict) -> Optional[np.ndarray]:
        """Extract feature vector from dictionary"""
        try:
            # Define feature order (must be consistent)
            feature_keys = [
                'hour_of_day', 'day_of_week', 'is_weekend',
                'session_duration_minutes', 'total_spins', 'total_wagers',
                'initial_balance', 'peak_balance', 'lowest_balance',
                'game_rtp', 'game_volatility_score', 'game_max_multiplier',
                'avg_bet_size', 'bet_size_std',
                'total_wins', 'win_ratio', 'avg_win_multiplier', 'max_win_multiplier',
                'bonus_hit_count', 'bonus_frequency_per_100spins',
                'observed_rtp', 'rtp_variance_from_theoretical',
                'balance_volatility', 'longest_winning_streak',
            ]

            if not self.feature_names:
                self.feature_names = feature_keys

            vector = []
            for key in feature_keys:
                value = features.get(key, 0)
                # Handle missing or invalid values
                if value is None or (isinstance(value, float) and np.isnan(value)):
                    value = 0
                vector.append(float(value))

            return np.array(vector, dtype=np.float32)

        except Exception as e:
            logger.error(f"Error extracting feature vector: {e}")
            return None

    def _extract_target(self, features: Dict) -> Optional[float]:
        """Extract target variable based on config"""
        try:
            if self.config.target_variable == 'rtp':
                return float(features.get('observed_rtp', 0))
            elif self.config.target_variable == 'bonus_hit':
                return float(features.get('bonus_hit_count', 0))
            elif self.config.target_variable == 'profit_loss':
                return float(features.get('profit_loss', 0))
            elif self.config.target_variable == 'roi':
                return float(features.get('roi_percent', 0))
            else:
                logger.warning(f"Unknown target variable: {self.config.target_variable}")
                return None
        except Exception as e:
            logger.error(f"Error extracting target variable: {e}")
            return None

    async def split_data(
        self,
        X: np.ndarray,
        y: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Split data into train, validation, and test sets.

        Returns:
            (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        total_samples = len(X)
        test_size = int(total_samples * self.config.test_split)
        val_size = int(total_samples * self.config.validation_split)
        train_size = total_samples - test_size - val_size

        logger.info(f"Splitting data: {train_size} train, {val_size} val, {test_size} test")

        # Shuffle data
        indices = np.random.RandomState(self.config.random_state).permutation(total_samples)
        X_shuffled = X[indices]
        y_shuffled = y[indices]

        # Split
        X_train = X_shuffled[:train_size]
        y_train = y_shuffled[:train_size]

        X_val = X_shuffled[train_size:train_size + val_size]
        y_val = y_shuffled[train_size:train_size + val_size]

        X_test = X_shuffled[train_size + val_size:]
        y_test = y_shuffled[train_size + val_size:]

        return X_train, X_val, X_test, y_train, y_val, y_test

    async def train_model(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> Dict:
        """
        Train the ML model.

        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training {self.config.model_type} model")

        try:
            if self.config.model_type == 'linear_regression':
                from sklearn.linear_model import LinearRegression
                self.model = LinearRegression()

            elif self.config.model_type == 'ridge':
                from sklearn.linear_model import Ridge
                self.model = Ridge(alpha=1.0, random_state=self.config.random_state)

            elif self.config.model_type == 'random_forest':
                from sklearn.ensemble import RandomForestRegressor
                self.model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=15,
                    random_state=self.config.random_state,
                    n_jobs=-1
                )

            elif self.config.model_type == 'gradient_boosting':
                from sklearn.ensemble import GradientBoostingRegressor
                self.model = GradientBoostingRegressor(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=5,
                    random_state=self.config.random_state
                )

            else:
                raise ValueError(f"Unknown model type: {self.config.model_type}")

            # Train
            self.model.fit(X_train, y_train)
            self.is_trained = True
            self.training_timestamp = datetime.utcnow()

            # Evaluate
            train_score = self.model.score(X_train, y_train)
            val_score = self.model.score(X_val, y_val)

            logger.info(f"Model training complete. Train R²: {train_score:.4f}, Val R²: {val_score:.4f}")

            self.performance_metrics = {
                'train_accuracy': float(train_score),
                'validation_accuracy': float(val_score),
            }

            return self.performance_metrics

        except Exception as e:
            logger.error(f"Model training failed: {e}")
            raise

    async def predict(self, features: Dict) -> Optional[float]:
        """
        Make prediction for new data.

        Args:
            features: Feature dictionary

        Returns:
            Predicted value or None
        """
        if not self.is_trained or self.model is None:
            logger.warning("Model not trained yet")
            return None

        try:
            X = self._extract_feature_vector(features)
            if X is None:
                return None

            # Reshape for single sample
            X_reshaped = X.reshape(1, -1)

            # Predict
            prediction = self.model.predict(X_reshaped)[0]

            return float(prediction)

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return None

    async def batch_predict(self, features_list: List[Dict]) -> List[Optional[float]]:
        """Make predictions for multiple samples"""
        predictions = []

        for features in features_list:
            pred = await self.predict(features)
            predictions.append(pred)

        return predictions

    def get_feature_importance(self) -> Optional[Dict[str, float]]:
        """
        Get feature importance scores from trained model.

        Only works with tree-based models.
        """
        if not self.is_trained or self.model is None:
            return None

        try:
            if hasattr(self.model, 'feature_importances_'):
                importances = self.model.feature_importances_
                importance_dict = {
                    name: float(imp)
                    for name, imp in zip(self.feature_names, importances)
                }
                # Sort by importance
                return dict(sorted(
                    importance_dict.items(),
                    key=lambda x: x[1],
                    reverse=True
                ))
        except Exception as e:
            logger.warning(f"Could not extract feature importance: {e}")

        return None

    def get_model_info(self) -> Dict:
        """Get information about trained model"""
        return {
            'model_type': self.config.model_type,
            'target_variable': self.config.target_variable,
            'is_trained': self.is_trained,
            'training_timestamp': self.training_timestamp.isoformat() if self.training_timestamp else None,
            'feature_count': len(self.feature_names),
            'performance_metrics': self.performance_metrics,
        }


class PredictionCache:
    """Cache for predictions to avoid recalculating"""

    def __init__(self, ttl_seconds: int = 3600):
        self.cache: Dict[str, Tuple[float, datetime]] = {}
        self.ttl = timedelta(seconds=ttl_seconds)

    def get(self, key: str) -> Optional[float]:
        """Get cached prediction if not expired"""
        if key not in self.cache:
            return None

        value, timestamp = self.cache[key]

        if datetime.utcnow() - timestamp > self.ttl:
            del self.cache[key]
            return None

        return value

    def set(self, key: str, value: float) -> None:
        """Cache a prediction"""
        self.cache[key] = (value, datetime.utcnow())

    def clear(self) -> None:
        """Clear entire cache"""
        self.cache.clear()

    def cleanup_expired(self) -> None:
        """Remove expired entries"""
        now = datetime.utcnow()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if now - timestamp > self.ttl
        ]
        for key in expired_keys:
            del self.cache[key]

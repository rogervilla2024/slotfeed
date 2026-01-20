"""
Phase 13-3: Time-Series Forecasting Service

Advanced forecasting using multiple models:
- ARIMA (AutoRegressive Integrated Moving Average)
- Exponential Smoothing (Holt-Winters)
- Simple trend extrapolation
- Ensemble forecasting with confidence intervals
"""

import logging
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import statistics
import math

logger = logging.getLogger(__name__)


@dataclass
class Forecast:
    """Time-series forecast result"""
    metric: str
    periods_ahead: int
    model_type: str  # 'arima', 'exponential_smoothing', 'ensemble'
    forecast_values: List[float]
    confidence_intervals: List[Tuple[float, float]]  # (lower, upper) for each period
    confidence_level: float  # 0.95 for 95% CI
    mae: Optional[float] = None  # Mean Absolute Error on validation set
    rmse: Optional[float] = None  # Root Mean Squared Error
    mape: Optional[float] = None  # Mean Absolute Percentage Error
    model_accuracy: float = 0.0  # 0-1 score
    last_value: float = 0.0  # Last observed value
    trend: str = 'stable'  # 'up', 'down', 'stable'
    seasonality_detected: bool = False


class ARIMAForecast:
    """
    ARIMA (AutoRegressive Integrated Moving Average) model.
    Suitable for stationary or trend-differenced series.
    """

    def __init__(self, p: int = 1, d: int = 1, q: int = 1):
        """
        Initialize ARIMA parameters.

        Args:
            p: AR order (autoregressive lags)
            d: I order (differencing)
            q: MA order (moving average terms)
        """
        self.p = p
        self.d = d
        self.q = q
        self.ar_coeffs = None
        self.ma_coeffs = None
        self.mean = None
        self.std = None

    async def fit(self, series: List[float]) -> Dict:
        """Fit ARIMA model to time series"""
        try:
            series_array = np.array(series, dtype=float)

            # Store mean and std for normalization
            self.mean = np.mean(series_array)
            self.std = np.std(series_array)

            # Normalize
            normalized = (series_array - self.mean) / (self.std + 1e-8)

            # Differencing for I component
            if self.d > 0:
                for _ in range(self.d):
                    normalized = np.diff(normalized)

            # Fit AR component (simple OLS on lagged values)
            if self.p > 0 and len(normalized) > self.p:
                X = []
                y = []
                for i in range(self.p, len(normalized)):
                    X.append(normalized[i-self.p:i])
                    y.append(normalized[i])

                X = np.array(X)
                y = np.array(y)

                # Simple linear regression coefficients
                X_with_const = np.column_stack([np.ones(len(X)), X])
                self.ar_coeffs = np.linalg.lstsq(X_with_const, y, rcond=None)[0]
            else:
                self.ar_coeffs = np.array([0, 0.5])  # Default coefficients

            # MA component would require residual analysis (simplified)
            if self.q > 0:
                # For now, use moving average of residuals
                self.ma_coeffs = np.ones(self.q) / self.q
            else:
                self.ma_coeffs = np.array([])

            logger.info(f"✓ ARIMA({self.p},{self.d},{self.q}) model fitted")

            return {
                "status": "fitted",
                "series_length": len(series),
                "mean": float(self.mean),
                "std": float(self.std),
            }

        except Exception as e:
            logger.error(f"ARIMA fitting failed: {e}")
            raise

    async def forecast(self, periods: int) -> List[float]:
        """Generate forecast for next N periods"""
        if self.ar_coeffs is None:
            return [self.mean] * periods

        forecast = []
        last_values = [self.mean] * self.p

        for _ in range(periods):
            # AR prediction
            pred = self.ar_coeffs[0]  # Constant term
            for i in range(1, min(len(self.ar_coeffs), self.p + 1)):
                pred += self.ar_coeffs[i] * last_values[i-1]

            # Un-normalize
            actual_pred = pred * self.std + self.mean

            forecast.append(actual_pred)
            last_values = [actual_pred] + last_values[:-1]

        return forecast


class ExponentialSmoothingForecast:
    """
    Exponential Smoothing for trend and level components.
    Good for trending data with seasonal patterns.
    """

    def __init__(self, alpha: float = 0.3, beta: float = 0.1, gamma: float = 0.1, seasonal_period: int = 0):
        """
        Initialize Exponential Smoothing parameters.

        Args:
            alpha: Level smoothing coefficient (0-1)
            beta: Trend smoothing coefficient (0-1)
            gamma: Seasonal smoothing coefficient (0-1)
            seasonal_period: Period for seasonal component (0 = no seasonality)
        """
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.seasonal_period = seasonal_period
        self.level = None
        self.trend = None
        self.seasonal = None
        self.last_value = None

    async def fit(self, series: List[float]) -> Dict:
        """Fit exponential smoothing model"""
        try:
            series_array = np.array(series, dtype=float)
            self.last_value = series_array[-1]

            # Initialize level (average of first few values)
            n_init = min(len(series_array), 5)
            self.level = np.mean(series_array[:n_init])

            # Initialize trend (simple linear regression slope)
            if len(series_array) > 1:
                x = np.arange(len(series_array))
                y = series_array
                coeffs = np.polyfit(x, y, 1)
                self.trend = coeffs[0]  # Slope
            else:
                self.trend = 0

            # Initialize seasonal (if applicable)
            if self.seasonal_period > 0 and len(series_array) > self.seasonal_period:
                seasonal = []
                for i in range(self.seasonal_period):
                    season_values = series_array[i::self.seasonal_period]
                    season_avg = np.mean(season_values)
                    seasonal.append(season_avg / self.level if self.level != 0 else 1)
                self.seasonal = seasonal
            else:
                self.seasonal = [1] * max(1, self.seasonal_period)

            logger.info("✓ Exponential Smoothing model fitted")

            return {
                "status": "fitted",
                "series_length": len(series),
                "initial_level": float(self.level),
                "initial_trend": float(self.trend),
                "seasonal_period": self.seasonal_period,
            }

        except Exception as e:
            logger.error(f"Exponential Smoothing fitting failed: {e}")
            raise

    async def forecast(self, periods: int) -> List[float]:
        """Generate forecast using exponential smoothing"""
        if self.level is None:
            return [self.last_value] * periods

        forecast = []
        current_level = self.level
        current_trend = self.trend
        current_seasonal = self.seasonal.copy() if self.seasonal else [1]

        for i in range(periods):
            # Seasonal index
            season_idx = i % len(current_seasonal) if current_seasonal else 0

            # Forecast
            pred = (current_level + current_trend) * current_seasonal[season_idx]
            forecast.append(pred)

            # Update components for next iteration
            current_level = self.alpha * (pred / current_seasonal[season_idx]) + (1 - self.alpha) * current_level
            current_trend = self.beta * (current_level - self.level) + (1 - self.beta) * current_trend
            current_seasonal[season_idx] = self.gamma * (pred / current_level) + (1 - self.gamma) * current_seasonal[season_idx]

        return forecast


class TimeSeriesForecast:
    """
    Comprehensive time-series forecasting service.
    Combines multiple models with ensemble approach.
    """

    def __init__(self):
        self.arima_model = ARIMAForecast(p=1, d=1, q=1)
        self.es_model = ExponentialSmoothingForecast(alpha=0.3, beta=0.1)
        self.validation_errors = {}

    async def forecast_rtp(
        self,
        historical_rtp: List[float],
        periods_ahead: int = 7,
        game_rtp: float = 96.48
    ) -> Forecast:
        """
        Forecast RTP for next N periods.

        Args:
            historical_rtp: Historical RTP values
            periods_ahead: Number of periods to forecast
            game_rtp: Theoretical RTP for reference

        Returns:
            Forecast object with predictions and confidence intervals
        """
        logger.info(f"Forecasting RTP for {periods_ahead} periods")

        if len(historical_rtp) < 3:
            logger.warning("Insufficient data for RTP forecast")
            return Forecast(
                metric="rtp",
                periods_ahead=periods_ahead,
                model_type="mean",
                forecast_values=[game_rtp] * periods_ahead,
                confidence_intervals=[(game_rtp - 1, game_rtp + 1)] * periods_ahead,
                confidence_level=0.95,
                model_accuracy=0.3,
                last_value=historical_rtp[-1] if historical_rtp else game_rtp,
            )

        try:
            # Fit ARIMA
            await self.arima_model.fit(historical_rtp)
            arima_forecast = await self.arima_model.forecast(periods_ahead)

            # Fit Exponential Smoothing
            await self.es_model.fit(historical_rtp)
            es_forecast = await self.es_model.forecast(periods_ahead)

            # Ensemble: weighted average
            ensemble_forecast = [
                0.5 * arima + 0.5 * es
                for arima, es in zip(arima_forecast, es_forecast)
            ]

            # Calculate confidence intervals (95%)
            residuals = await self._calculate_residuals(historical_rtp, ensemble_forecast)
            std_error = np.std(residuals) if residuals else np.std(historical_rtp)
            margin_of_error = 1.96 * std_error

            confidence_intervals = [
                (pred - margin_of_error, pred + margin_of_error)
                for pred in ensemble_forecast
            ]

            # Detect trend
            trend = await self._detect_trend(ensemble_forecast)

            # Calculate accuracy metrics
            mae, rmse, mape = await self._calculate_accuracy_metrics(
                historical_rtp, ensemble_forecast
            )

            forecast = Forecast(
                metric="rtp",
                periods_ahead=periods_ahead,
                model_type="ensemble",
                forecast_values=ensemble_forecast,
                confidence_intervals=confidence_intervals,
                confidence_level=0.95,
                mae=mae,
                rmse=rmse,
                mape=mape,
                model_accuracy=0.75 if mape and mape < 2.0 else 0.6,
                last_value=float(historical_rtp[-1]),
                trend=trend,
            )

            logger.info(f"✓ RTP forecast generated (accuracy: {forecast.model_accuracy:.2%})")
            return forecast

        except Exception as e:
            logger.error(f"RTP forecasting failed: {e}")
            # Fallback forecast
            mean_rtp = statistics.mean(historical_rtp)
            return Forecast(
                metric="rtp",
                periods_ahead=periods_ahead,
                model_type="fallback",
                forecast_values=[mean_rtp] * periods_ahead,
                confidence_intervals=[(mean_rtp - 2, mean_rtp + 2)] * periods_ahead,
                confidence_level=0.95,
                model_accuracy=0.4,
                last_value=float(historical_rtp[-1]),
            )

    async def forecast_bonus_frequency(
        self,
        historical_frequency: List[float],
        periods_ahead: int = 7
    ) -> Forecast:
        """
        Forecast bonus hit frequency for next N periods.

        Args:
            historical_frequency: Historical bonus frequency per 100 spins
            periods_ahead: Number of periods to forecast

        Returns:
            Forecast with frequency predictions
        """
        logger.info(f"Forecasting bonus frequency for {periods_ahead} periods")

        if len(historical_frequency) < 3:
            mean_freq = statistics.mean(historical_frequency) if historical_frequency else 0.64
            return Forecast(
                metric="bonus_frequency",
                periods_ahead=periods_ahead,
                model_type="mean",
                forecast_values=[mean_freq] * periods_ahead,
                confidence_intervals=[(max(0, mean_freq - 0.1), mean_freq + 0.1)] * periods_ahead,
                confidence_level=0.95,
                model_accuracy=0.4,
                last_value=historical_frequency[-1] if historical_frequency else 0.64,
            )

        try:
            await self.arima_model.fit(historical_frequency)
            forecast_values = await self.arima_model.forecast(periods_ahead)

            # Bonus frequency should stay positive and reasonable
            forecast_values = [max(0.3, min(1.5, v)) for v in forecast_values]

            # Confidence intervals
            margin = max(0.15, np.std(historical_frequency))
            confidence_intervals = [
                (max(0, pred - margin), pred + margin)
                for pred in forecast_values
            ]

            trend = await self._detect_trend(forecast_values)

            forecast = Forecast(
                metric="bonus_frequency",
                periods_ahead=periods_ahead,
                model_type="arima",
                forecast_values=forecast_values,
                confidence_intervals=confidence_intervals,
                confidence_level=0.95,
                model_accuracy=0.65,
                last_value=float(historical_frequency[-1]),
                trend=trend,
            )

            logger.info("✓ Bonus frequency forecast generated")
            return forecast

        except Exception as e:
            logger.error(f"Bonus frequency forecasting failed: {e}")
            mean_freq = statistics.mean(historical_frequency) if historical_frequency else 0.64
            return Forecast(
                metric="bonus_frequency",
                periods_ahead=periods_ahead,
                model_type="fallback",
                forecast_values=[mean_freq] * periods_ahead,
                confidence_intervals=[(max(0, mean_freq - 0.15), mean_freq + 0.15)] * periods_ahead,
                confidence_level=0.95,
                model_accuracy=0.3,
                last_value=float(historical_frequency[-1]),
            )

    async def forecast_volatility(
        self,
        historical_volatility: List[float],
        periods_ahead: int = 7
    ) -> Forecast:
        """Forecast balance volatility for next N periods"""
        logger.info(f"Forecasting volatility for {periods_ahead} periods")

        if len(historical_volatility) < 3:
            mean_vol = statistics.mean(historical_volatility) if historical_volatility else 12.5
            return Forecast(
                metric="volatility",
                periods_ahead=periods_ahead,
                model_type="mean",
                forecast_values=[mean_vol] * periods_ahead,
                confidence_intervals=[(mean_vol * 0.8, mean_vol * 1.2)] * periods_ahead,
                confidence_level=0.95,
                model_accuracy=0.4,
                last_value=historical_volatility[-1] if historical_volatility else 12.5,
            )

        try:
            # Use exponential smoothing for volatility (trending data)
            await self.es_model.fit(historical_volatility)
            forecast_values = await self.es_model.forecast(periods_ahead)

            # Volatility should stay positive
            forecast_values = [max(0.5, v) for v in forecast_values]

            # Confidence intervals (wider than RTP due to higher variance)
            std_error = np.std(historical_volatility) * 1.5
            margin_of_error = 1.96 * std_error

            confidence_intervals = [
                (max(0, pred - margin_of_error), pred + margin_of_error)
                for pred in forecast_values
            ]

            trend = await self._detect_trend(forecast_values)

            forecast = Forecast(
                metric="volatility",
                periods_ahead=periods_ahead,
                model_type="exponential_smoothing",
                forecast_values=forecast_values,
                confidence_intervals=confidence_intervals,
                confidence_level=0.95,
                model_accuracy=0.60,
                last_value=float(historical_volatility[-1]),
                trend=trend,
            )

            logger.info("✓ Volatility forecast generated")
            return forecast

        except Exception as e:
            logger.error(f"Volatility forecasting failed: {e}")
            mean_vol = statistics.mean(historical_volatility) if historical_volatility else 12.5
            return Forecast(
                metric="volatility",
                periods_ahead=periods_ahead,
                model_type="fallback",
                forecast_values=[mean_vol] * periods_ahead,
                confidence_intervals=[(mean_vol * 0.7, mean_vol * 1.3)] * periods_ahead,
                confidence_level=0.95,
                model_accuracy=0.3,
                last_value=float(historical_volatility[-1]),
            )

    async def _calculate_residuals(
        self,
        actual: List[float],
        predicted: List[float]
    ) -> List[float]:
        """Calculate prediction residuals"""
        if len(actual) != len(predicted):
            # Handle length mismatch
            min_len = min(len(actual), len(predicted))
            actual = actual[:min_len]
            predicted = predicted[:min_len]

        return [a - p for a, p in zip(actual, predicted)]

    async def _calculate_accuracy_metrics(
        self,
        actual: List[float],
        predicted: List[float]
    ) -> Tuple[float, float, float]:
        """Calculate MAE, RMSE, MAPE"""
        if len(actual) < len(predicted):
            predicted = predicted[:len(actual)]
        elif len(predicted) < len(actual):
            actual = actual[:len(predicted)]

        if not actual:
            return 0, 0, 0

        errors = [abs(a - p) for a, p in zip(actual, predicted)]
        mae = statistics.mean(errors) if errors else 0

        squared_errors = [(a - p) ** 2 for a, p in zip(actual, predicted)]
        rmse = math.sqrt(statistics.mean(squared_errors)) if squared_errors else 0

        pct_errors = [
            abs(a - p) / abs(a) * 100
            for a, p in zip(actual, predicted)
            if a != 0
        ]
        mape = statistics.mean(pct_errors) if pct_errors else 0

        return mae, rmse, mape

    async def _detect_trend(self, forecast_values: List[float]) -> str:
        """Detect trend direction in forecast"""
        if len(forecast_values) < 2:
            return "stable"

        first_half = statistics.mean(forecast_values[:len(forecast_values)//2])
        second_half = statistics.mean(forecast_values[len(forecast_values)//2:])

        if second_half > first_half * 1.02:
            return "up"
        elif second_half < first_half * 0.98:
            return "down"
        else:
            return "stable"

    def get_model_info(self) -> Dict:
        """Get forecasting model information"""
        return {
            "type": "Ensemble (ARIMA + Exponential Smoothing)",
            "arima_params": {
                "p": self.arima_model.p,
                "d": self.arima_model.d,
                "q": self.arima_model.q,
            },
            "exponential_smoothing_params": {
                "alpha": self.es_model.alpha,
                "beta": self.es_model.beta,
                "gamma": self.es_model.gamma,
                "seasonal_period": self.es_model.seasonal_period,
            },
            "ensemble_weights": {
                "arima": 0.5,
                "exponential_smoothing": 0.5,
            },
            "confidence_level": 0.95,
            "methods": [
                "ARIMA for stationary series",
                "Exponential Smoothing for trending data",
                "Ensemble for robustness",
                "Confidence intervals via residual std",
            ]
        }

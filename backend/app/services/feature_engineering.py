"""
Phase 13-1: Feature Engineering Service

Extracts features from sessions for ML model training and prediction.
Converts raw session data into structured feature vectors.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import statistics
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SessionData:
    """Raw session data structure"""
    session_id: str
    game_id: str
    streamer_id: str
    start_time: datetime
    end_time: datetime
    initial_balance: float
    final_balance: float
    peak_balance: float
    lowest_balance: float
    total_wagered: float
    total_spins: int
    wins: List[float]
    losses: List[float]
    bonus_hits: int
    balance_history: List[Tuple[datetime, float]]
    bet_sizes: List[float]
    game_rtp: float
    game_volatility: str
    game_max_multiplier: float


class FeatureEngineer:
    """
    Extracts features from session data for ML models.
    Handles feature scaling, normalization, and validation.
    """

    def __init__(self):
        self.feature_version = 1
        self.volatility_scores = {
            'low': 1.0,
            'medium': 2.0,
            'high': 3.0,
            'very_high': 4.0,
        }

    def extract_features(self, session: SessionData) -> Dict:
        """
        Extract all features from a session.

        Returns:
            Dict with categorized features for ML model input
        """
        try:
            # Temporal features
            temporal = self._extract_temporal_features(session.start_time)

            # Session features
            session_features = self._extract_session_features(session)

            # Game features
            game_features = self._extract_game_features(session)

            # Win/Loss features
            outcome_features = self._extract_outcome_features(session)

            # Statistical features
            statistical = self._extract_statistical_features(session)

            # Combine all features
            all_features = {
                **temporal,
                **session_features,
                **game_features,
                **outcome_features,
                **statistical,
            }

            # Add metadata
            all_features['feature_version'] = self.feature_version
            all_features['session_id'] = session.session_id
            all_features['game_id'] = session.game_id
            all_features['streamer_id'] = session.streamer_id

            return all_features

        except Exception as e:
            logger.error(f"Error extracting features from session {session.session_id}: {e}")
            raise

    def _extract_temporal_features(self, start_time: datetime) -> Dict:
        """Extract time-based features"""
        hour = start_time.hour
        day = start_time.weekday()  # 0=Monday, 6=Sunday

        # Determine season
        month = start_time.month
        if month in [12, 1, 2]:
            season = 'winter'
        elif month in [3, 4, 5]:
            season = 'spring'
        elif month in [6, 7, 8]:
            season = 'summer'
        else:
            season = 'fall'

        return {
            'hour_of_day': hour,
            'day_of_week': day,
            'is_weekend': day >= 5,  # Saturday or Sunday
            'season': season,
            'is_peak_hours': hour in [20, 21, 22, 23],  # Evening peak
            'timestamp': start_time.isoformat(),
        }

    def _extract_session_features(self, session: SessionData) -> Dict:
        """Extract session-level features"""
        duration = (session.end_time - session.start_time).total_seconds() / 60  # minutes

        profit_loss = session.final_balance - session.initial_balance
        roi = (profit_loss / session.initial_balance * 100) if session.initial_balance > 0 else 0

        # Balance trajectory analysis
        max_drawdown = self._calculate_max_drawdown(
            session.initial_balance,
            session.balance_history
        )

        return {
            'session_duration_minutes': duration,
            'total_spins': session.total_spins,
            'total_wagers': session.total_wagered,
            'initial_balance': session.initial_balance,
            'final_balance': session.final_balance,
            'peak_balance': session.peak_balance,
            'lowest_balance': session.lowest_balance,
            'profit_loss': profit_loss,
            'roi_percent': roi,
            'max_drawdown': max_drawdown,
            'avg_spins_per_minute': session.total_spins / max(duration, 1),
        }

    def _extract_game_features(self, session: SessionData) -> Dict:
        """Extract game-level features"""
        return {
            'game_rtp': session.game_rtp,
            'game_volatility': session.game_volatility,
            'game_volatility_score': self.volatility_scores.get(session.game_volatility, 2.0),
            'game_max_multiplier': session.game_max_multiplier,
            'avg_bet_size': statistics.mean(session.bet_sizes) if session.bet_sizes else 0,
            'min_bet_size': min(session.bet_sizes) if session.bet_sizes else 0,
            'max_bet_size': max(session.bet_sizes) if session.bet_sizes else 0,
            'bet_size_variance': self._safe_variance(session.bet_sizes),
            'bet_size_std': statistics.stdev(session.bet_sizes) if len(session.bet_sizes) > 1 else 0,
        }

    def _extract_outcome_features(self, session: SessionData) -> Dict:
        """Extract win/loss/bonus features"""
        total_wins = len(session.wins)
        total_losses = len(session.losses)
        total_outcomes = total_wins + total_losses

        win_ratio = (total_wins / total_outcomes * 100) if total_outcomes > 0 else 0
        bonus_frequency = (session.bonus_hits / session.total_spins * 100) if session.total_spins > 0 else 0

        return {
            'total_wins': total_wins,
            'total_losses': total_losses,
            'win_ratio': win_ratio,
            'loss_ratio': 100 - win_ratio,
            'avg_win_multiplier': statistics.mean(session.wins) if session.wins else 0,
            'median_win_multiplier': statistics.median(session.wins) if session.wins else 0,
            'max_win_multiplier': max(session.wins) if session.wins else 0,
            'min_win_multiplier': min(session.wins) if session.wins else 1.0,
            'avg_loss_multiplier': abs(statistics.mean(session.losses)) if session.losses else 0,
            'bonus_hit_count': session.bonus_hits,
            'bonus_frequency_per_100spins': bonus_frequency,
            'bonus_hit_rate': (session.bonus_hits / session.total_spins) if session.total_spins > 0 else 0,
        }

    def _extract_statistical_features(self, session: SessionData) -> Dict:
        """Extract statistical distribution features"""
        # Observed RTP
        total_won = sum(session.wins)
        observed_rtp = (total_won / session.total_wagered * 100) if session.total_wagered > 0 else 0

        # Win distribution analysis
        if session.wins:
            win_std = statistics.stdev(session.wins) if len(session.wins) > 1 else 0
            win_skew = self._calculate_skewness(session.wins)
            win_kurtosis = self._calculate_kurtosis(session.wins)
        else:
            win_std = 0
            win_skew = 0
            win_kurtosis = 0

        # Balance volatility
        balance_values = [b for _, b in session.balance_history] if session.balance_history else []
        balance_volatility = statistics.stdev(balance_values) if len(balance_values) > 1 else 0

        # Balance changes
        if len(session.balance_history) > 1:
            balance_changes = [
                session.balance_history[i+1][1] - session.balance_history[i][1]
                for i in range(len(session.balance_history) - 1)
            ]
            avg_balance_change = statistics.mean(balance_changes)
            balance_change_volatility = statistics.stdev(balance_changes) if len(balance_changes) > 1 else 0
        else:
            avg_balance_change = 0
            balance_change_volatility = 0

        return {
            'observed_rtp': observed_rtp,
            'rtp_variance_from_theoretical': observed_rtp - session.game_rtp,
            'rtp_variance_percent': ((observed_rtp - session.game_rtp) / session.game_rtp * 100) if session.game_rtp > 0 else 0,
            'win_distribution_std': win_std,
            'win_distribution_skewness': win_skew,
            'win_distribution_kurtosis': win_kurtosis,
            'balance_volatility': balance_volatility,
            'avg_balance_change': avg_balance_change,
            'balance_change_volatility': balance_change_volatility,
            'longest_winning_streak': self._calculate_longest_streak(session.wins, session.losses, True),
            'longest_losing_streak': self._calculate_longest_streak(session.wins, session.losses, False),
        }

    def _calculate_max_drawdown(self, initial: float, balance_history: List[Tuple[datetime, float]]) -> float:
        """Calculate maximum drawdown from peak"""
        if not balance_history:
            return 0

        balances = [b for _, b in balance_history]
        max_drawdown = 0
        peak = initial

        for balance in balances:
            if balance > peak:
                peak = balance
            drawdown = (peak - balance) / peak * 100 if peak > 0 else 0
            max_drawdown = max(max_drawdown, drawdown)

        return max_drawdown

    def _safe_variance(self, values: List[float]) -> float:
        """Calculate variance safely"""
        try:
            if len(values) > 1:
                return statistics.variance(values)
        except:
            pass
        return 0.0

    def _calculate_skewness(self, values: List[float]) -> float:
        """Calculate skewness of distribution"""
        if len(values) < 3:
            return 0.0

        mean = statistics.mean(values)
        std = statistics.stdev(values)

        if std == 0:
            return 0.0

        skewness = sum(((x - mean) / std) ** 3 for x in values) / len(values)
        return skewness

    def _calculate_kurtosis(self, values: List[float]) -> float:
        """Calculate kurtosis of distribution"""
        if len(values) < 4:
            return 0.0

        mean = statistics.mean(values)
        std = statistics.stdev(values)

        if std == 0:
            return 0.0

        kurtosis = sum(((x - mean) / std) ** 4 for x in values) / len(values) - 3
        return kurtosis

    def _calculate_longest_streak(
        self,
        wins: List[float],
        losses: List[float],
        win_streak: bool = True
    ) -> int:
        """Calculate longest winning or losing streak"""
        # Create binary sequence: 1 for win, -1 for loss
        sequence = [1] * len(wins) + [-1] * len(losses)

        if not sequence:
            return 0

        longest = 0
        current = 0
        target = 1 if win_streak else -1

        for item in sequence:
            if item == target:
                current += 1
                longest = max(longest, current)
            else:
                current = 0

        return longest

    def normalize_features(self, features: Dict) -> Dict:
        """
        Normalize features for ML model input.
        Scales features to 0-1 range for better model performance.
        """
        normalized = features.copy()

        # Normalize percentage features to 0-1 range
        percentage_features = [
            'win_ratio', 'loss_ratio', 'roi_percent', 'bonus_frequency_per_100spins',
            'rtp_variance_percent'
        ]

        for feature in percentage_features:
            if feature in normalized:
                # Clip to prevent extreme values
                normalized[feature] = max(0, min(100, normalized[feature])) / 100

        # Normalize volatility score to 0-1
        if 'game_volatility_score' in normalized:
            normalized['game_volatility_score'] = normalized['game_volatility_score'] / 4.0

        # Log-scale large numeric features
        large_features = ['total_wagers', 'peak_balance', 'initial_balance']
        for feature in large_features:
            if feature in normalized and normalized[feature] > 0:
                import math
                normalized[feature] = math.log1p(normalized[feature])

        return normalized

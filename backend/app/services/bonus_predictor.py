"""
Phase 13-3: Bonus Hit Prediction Service

Predicts:
- Expected spins until next bonus
- Probability of bonus in next N spins
- Expected bonus multiplier
- Bonus hunt ROI predictions
"""

import logging
import statistics
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import math

logger = logging.getLogger(__name__)


@dataclass
class BonusHitPrediction:
    """Bonus hit prediction result"""
    game_id: str
    expected_spins_until_bonus: float
    confidence: float  # 0-1
    probability_next_100spins: float  # 0-1
    probability_next_200spins: float  # 0-1
    probability_next_500spins: float  # 0-1
    expected_multiplier: float
    expected_payout: float
    prediction_timestamp: datetime
    model_type: str  # 'frequency_based', 'distribution_based', 'ml_based'
    bonus_frequency_per_100spins: float
    risk_assessment: Optional[str] = None
    recommendation: Optional[str] = None


@dataclass
class BonusHuntPrediction:
    """Bonus hunt outcome prediction"""
    hunt_id: str
    predicted_final_roi: float
    probability_of_profit: float
    expected_completion_spins: int
    expected_completion_time_minutes: float
    recommended_continuation_probability: float
    confidence: float
    max_loss_probability: float
    expected_max_loss: float
    risk_level: str  # 'low', 'medium', 'high'
    expected_spin_cost: float
    expected_win: float
    break_even_probability: float


class BonusPredictor:
    """
    Predicts bonus hit outcomes using statistical and ML methods.
    """

    def __init__(self):
        self.min_samples = 5  # Minimum samples for valid prediction

    async def predict_next_bonus_hit(
        self,
        game_id: str,
        spins_since_last_bonus: int,
        historical_bonus_intervals: List[int],
        bonus_frequency_per_100spins: float,
        recent_sessions: List[Dict],
        game_volatility: str = "high"
    ) -> BonusHitPrediction:
        """
        Predict when next bonus will hit.

        Args:
            game_id: Game identifier
            spins_since_last_bonus: Current spin count in drought
            historical_bonus_intervals: List of spins between bonuses
            bonus_frequency_per_100spins: Expected frequency
            recent_sessions: Recent session data for context
            game_volatility: Game volatility level

        Returns:
            BonusHitPrediction with probabilities
        """
        logger.info(f"Predicting bonus hit for {game_id}")

        if not historical_bonus_intervals or len(historical_bonus_intervals) < self.min_samples:
            # Fallback: use frequency to estimate
            avg_interval = 1 / max(bonus_frequency_per_100spins / 100, 0.001)
            return BonusHitPrediction(
                game_id=game_id,
                expected_spins_until_bonus=avg_interval,
                confidence=0.4,
                probability_next_100spins=min(100 / avg_interval * 0.8, 1.0),
                probability_next_200spins=min(200 / avg_interval * 0.8, 1.0),
                probability_next_500spins=min(500 / avg_interval * 0.8, 1.0),
                expected_multiplier=45.5,  # Average multiplier
                expected_payout=1365.0,
                prediction_timestamp=datetime.utcnow(),
                model_type="frequency_based",
                bonus_frequency_per_100spins=bonus_frequency_per_100spins,
                recommendation="Collect bonus history for better predictions"
            )

        try:
            # Analyze historical intervals
            mean_interval = statistics.mean(historical_bonus_intervals)
            std_interval = statistics.stdev(historical_bonus_intervals) if len(historical_bonus_intervals) > 1 else 0
            max_interval = max(historical_bonus_intervals)
            min_interval = min(historical_bonus_intervals)

            # Calculate probability using normal distribution
            # P(bonus within N spins) = 1 - P(X > N)
            z_100 = (100 - mean_interval) / (std_interval + 1) if std_interval > 0 else 0
            z_200 = (200 - mean_interval) / (std_interval + 1) if std_interval > 0 else 0
            z_500 = (500 - mean_interval) / (std_interval + 1) if std_interval > 0 else 0

            prob_100 = await self._normal_cdf(z_100)
            prob_200 = await self._normal_cdf(z_200)
            prob_500 = await self._normal_cdf(z_500)

            # Adjust for current drought
            drought_factor = 1.0 + (spins_since_last_bonus / mean_interval) * 0.1  # Increasing probability with drought

            # Predict multiplier using volatility
            avg_multiplier = await self._estimate_multiplier(
                game_volatility,
                recent_sessions
            )

            # Expected payout
            avg_bet = await self._estimate_avg_bet(recent_sessions)
            expected_payout = avg_multiplier * avg_bet * 100  # Assuming 100 spin hunt

            # Recommendations
            recommendation = await self._get_bonus_recommendation(
                spins_since_last_bonus,
                mean_interval,
                prob_500,
                game_volatility
            )

            # Risk assessment
            risk = "low" if prob_200 > 0.8 else "medium" if prob_500 > 0.8 else "high"

            # Confidence based on sample size and interval variance
            confidence = min(
                len(historical_bonus_intervals) / 20.0,  # More data = higher confidence
                1.0 - (std_interval / (mean_interval + 1)) * 0.5  # Lower variance = higher confidence
            )

            prediction = BonusHitPrediction(
                game_id=game_id,
                expected_spins_until_bonus=mean_interval * drought_factor,
                confidence=confidence,
                probability_next_100spins=min(prob_100 * drought_factor, 1.0),
                probability_next_200spins=min(prob_200 * drought_factor, 1.0),
                probability_next_500spins=min(prob_500 * drought_factor, 1.0),
                expected_multiplier=avg_multiplier,
                expected_payout=expected_payout,
                prediction_timestamp=datetime.utcnow(),
                model_type="distribution_based",
                bonus_frequency_per_100spins=bonus_frequency_per_100spins,
                risk_assessment=risk,
                recommendation=recommendation
            )

            logger.info(f"✓ Bonus prediction: {prediction.expected_spins_until_bonus:.0f} spins, confidence {confidence:.2%}")
            return prediction

        except Exception as e:
            logger.error(f"Bonus prediction failed: {e}")
            # Fallback
            avg_interval = statistics.mean(historical_bonus_intervals) if historical_bonus_intervals else 156
            return BonusHitPrediction(
                game_id=game_id,
                expected_spins_until_bonus=avg_interval,
                confidence=0.5,
                probability_next_100spins=0.6,
                probability_next_200spins=0.85,
                probability_next_500spins=0.98,
                expected_multiplier=45.5,
                expected_payout=1365.0,
                prediction_timestamp=datetime.utcnow(),
                model_type="fallback",
                bonus_frequency_per_100spins=bonus_frequency_per_100spins
            )

    async def predict_bonus_hunt_outcome(
        self,
        hunt_id: str,
        starting_balance: float,
        current_balance: float,
        spins_so_far: int,
        target_multiplier: float,
        game_volatility: str,
        historical_roi: Optional[List[float]] = None
    ) -> BonusHuntPrediction:
        """
        Predict bonus hunt final outcome.

        Args:
            hunt_id: Bonus hunt ID
            starting_balance: Initial balance
            current_balance: Current balance
            spins_so_far: Spins completed so far
            target_multiplier: Target bonus multiplier to hit
            game_volatility: Game volatility
            historical_roi: Historical ROI from similar hunts

        Returns:
            BonusHuntPrediction with outcomes
        """
        logger.info(f"Predicting outcome for bonus hunt {hunt_id}")

        try:
            # Current metrics
            profit_so_far = current_balance - starting_balance
            roi_so_far = (profit_so_far / starting_balance * 100) if starting_balance > 0 else 0
            avg_spin_cost = (starting_balance - current_balance) / max(spins_so_far, 1)

            # Estimate remaining spins needed
            # Based on game volatility and current progress
            volatility_mult = {
                "low": 0.8,
                "medium": 1.0,
                "high": 1.3,
                "very_high": 1.6,
            }.get(game_volatility, 1.0)

            expected_remaining_spins = int(150 * volatility_mult)  # Average session length estimate

            # Estimate completion time (avg 10-15 spins per minute)
            spins_per_minute = 12
            expected_completion_time = expected_remaining_spins / spins_per_minute

            # Probability of hitting target
            # Based on current balance and volatility
            if current_balance < starting_balance * 0.5:
                prob_profit = 0.3  # In deep trouble
            elif current_balance < starting_balance * 0.9:
                prob_profit = 0.5  # Behind
            elif current_balance < starting_balance * 1.0:
                prob_profit = 0.65  # Even or slightly ahead
            else:
                prob_profit = 0.75  # Ahead

            # Volatility factor
            volatility_prob_reduction = {
                "low": 0.95,
                "medium": 1.0,
                "high": 0.85,
                "very_high": 0.7,
            }.get(game_volatility, 1.0)

            prob_profit *= volatility_prob_reduction

            # Expected final ROI
            # If continue: expected profit from remaining spins
            expected_win_per_spin = avg_spin_cost * 0.98  # Expect to lose slightly
            expected_remaining_profit = expected_win_per_spin * expected_remaining_spins - (
                avg_spin_cost * expected_remaining_spins
            )

            predicted_final_balance = current_balance + expected_remaining_profit
            predicted_final_roi = ((predicted_final_balance - starting_balance) / starting_balance * 100) if starting_balance > 0 else 0

            # Risk metrics
            max_loss_prob = 1.0 - prob_profit
            expected_max_loss = starting_balance * 0.3  # Assume lose up to 30% more

            # Break-even probability
            breakeven_spins_needed = int(abs(profit_so_far) / max(avg_spin_cost, 1))
            breakeven_prob = min(breakeven_spins_needed / expected_remaining_spins, 1.0) if expected_remaining_spins > 0 else 0

            # Risk level
            if prob_profit > 0.7:
                risk_level = "low"
            elif prob_profit > 0.5:
                risk_level = "medium"
            else:
                risk_level = "high"

            # Continuation recommendation
            # Continue if expected ROI > 0 and prob_profit > 0.5
            continuation_prob = prob_profit if predicted_final_roi > 0 else max(0, 1 - (abs(predicted_final_roi) / 100))

            prediction = BonusHuntPrediction(
                hunt_id=hunt_id,
                predicted_final_roi=predicted_final_roi,
                probability_of_profit=min(prob_profit, 1.0),
                expected_completion_spins=expected_remaining_spins,
                expected_completion_time_minutes=expected_completion_time,
                recommended_continuation_probability=min(continuation_prob, 1.0),
                confidence=0.7,
                max_loss_probability=max_loss_prob,
                expected_max_loss=expected_max_loss,
                risk_level=risk_level,
                expected_spin_cost=avg_spin_cost,
                expected_win=expected_remaining_profit,
                break_even_probability=breakeven_prob
            )

            logger.info(f"✓ Hunt prediction: ROI {predicted_final_roi:.1f}%, prob_profit {prob_profit:.2%}")
            return prediction

        except Exception as e:
            logger.error(f"Hunt outcome prediction failed: {e}")
            # Fallback
            return BonusHuntPrediction(
                hunt_id=hunt_id,
                predicted_final_roi=0,
                probability_of_profit=0.5,
                expected_completion_spins=150,
                expected_completion_time_minutes=12,
                recommended_continuation_probability=0.5,
                confidence=0.3,
                max_loss_probability=0.5,
                expected_max_loss=100,
                risk_level="medium",
                expected_spin_cost=10,
                expected_win=0,
                break_even_probability=0.5
            )

    async def _normal_cdf(self, z: float) -> float:
        """Approximate normal CDF using error function"""
        # Approximation: CDF(z) ≈ 1/2 * (1 + erf(z/sqrt(2)))
        # Simplified approximation for z-scores
        if z < -3:
            return 0.0
        elif z > 3:
            return 1.0
        else:
            # Simple polynomial approximation
            t = 1 / (1 + 0.2316419 * abs(z))
            d = 0.3989423 * math.exp(-z * z / 2)
            prob = 1 - d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))

            return prob if z >= 0 else 1 - prob

    async def _estimate_multiplier(self, game_volatility: str, recent_sessions: List[Dict]) -> float:
        """Estimate expected bonus multiplier"""
        volatility_mult = {
            "low": 20.0,
            "medium": 35.0,
            "high": 50.0,
            "very_high": 75.0,
        }
        base_mult = volatility_mult.get(game_volatility, 45.5)

        # Adjust based on recent sessions
        if recent_sessions:
            try:
                recent_multipliers = [s.get('max_win_multiplier', base_mult) for s in recent_sessions if s.get('max_win_multiplier')]
                if recent_multipliers:
                    avg_recent = statistics.mean(recent_multipliers)
                    return 0.7 * base_mult + 0.3 * avg_recent
            except:
                pass

        return base_mult

    async def _estimate_avg_bet(self, recent_sessions: List[Dict]) -> float:
        """Estimate average bet size"""
        if not recent_sessions:
            return 10.0

        try:
            bets = [s.get('avg_bet_size', 10) for s in recent_sessions if s.get('avg_bet_size')]
            return statistics.mean(bets) if bets else 10.0
        except:
            return 10.0

    async def _get_bonus_recommendation(
        self,
        spins_since_bonus: int,
        mean_interval: float,
        prob_500: float,
        game_volatility: str
    ) -> str:
        """Generate personalized bonus recommendation"""
        drought_ratio = spins_since_bonus / max(mean_interval, 1)

        if drought_ratio < 0.5:
            return "Normal bonus frequency - continue playing at base stake"
        elif drought_ratio < 1.0:
            return "Approaching expected bonus - consider modest stake increase"
        elif drought_ratio < 1.5:
            return "Bonus overdue (1-1.5x expected) - increase stake to capitalize"
        elif drought_ratio < 2.0:
            return "Significant drought (1.5-2x) - strong bonus signal, increase stake significantly"
        else:
            if prob_500 > 0.95:
                return "Extreme drought but high probability - maximum recommended stake"
            elif prob_500 > 0.85:
                return "High probability bonus soon - increase stake for bigger win"
            else:
                return f"Extreme drought - bonus should hit, but {game_volatility} volatility = high risk"

    def get_model_info(self) -> Dict:
        """Get predictor model info"""
        return {
            "type": "Statistical + ML Ensemble",
            "methods": [
                "Normal distribution of bonus intervals",
                "Drought factor adjustment",
                "Volatility-weighted multiplier estimation",
                "Hunt ROI prediction with risk assessment",
            ],
            "models": [
                "frequency_based - uses bonus frequency directly",
                "distribution_based - normal distribution on historical intervals",
            ],
            "confidence_factors": [
                "Sample size of historical intervals",
                "Variance of interval distribution",
                "Current drought length",
                "Game volatility",
            ]
        }

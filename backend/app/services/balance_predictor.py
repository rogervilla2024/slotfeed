"""
Phase 13-3: Balance and ROI Prediction Service

Predicts:
- Expected session ROI based on duration
- Probability distributions of outcomes
- Optimal bankroll sizing
- Maximum drawdown probability
- Break-even analysis
"""

import logging
import statistics
import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
import random

logger = logging.getLogger(__name__)


@dataclass
class SessionROIPrediction:
    """Session ROI prediction"""
    game_id: str
    starting_balance: float
    predicted_duration_minutes: int
    predicted_final_balance: float
    predicted_roi_percent: float
    confidence: float
    probability_profit: float  # P(ROI > 0)
    probability_loss: float  # P(ROI < 0)
    expected_max_balance: float
    expected_min_balance: float
    max_drawdown_probability: float
    risk_level: str  # 'low', 'medium', 'high'
    recommended_max_loss: float
    recommended_session_budget: float


@dataclass
class DrawdownPrediction:
    """Maximum drawdown prediction"""
    starting_balance: float
    expected_max_drawdown_percent: float
    probability_lose_10pct: float
    probability_lose_25pct: float
    probability_lose_50pct: float
    recommended_buffer: float
    session_budget_recommendation: float


@dataclass
class BetSizeRecommendation:
    """Optimal bet sizing"""
    recommended_min_bet: float
    recommended_avg_bet: float
    recommended_max_bet: float
    kelly_criterion_bet: float  # Position size from Kelly formula
    confidence: float
    explanation: str


class BalancePredictor:
    """
    Predicts balance outcomes and optimal bankroll sizing.
    Uses Monte Carlo simulation and historical analysis.
    """

    def __init__(self):
        self.min_session_data = 3  # Minimum sessions for valid prediction
        self.simulation_runs = 1000  # Number of Monte Carlo simulations

    async def predict_session_roi(
        self,
        game_id: str,
        starting_balance: float,
        session_duration_minutes: int,
        historical_sessions: List[Dict],
        game_rtp: float = 96.48,
        game_volatility: str = "high"
    ) -> SessionROIPrediction:
        """
        Predict ROI for a session of given duration.

        Args:
            game_id: Game identifier
            starting_balance: Starting bankroll
            session_duration_minutes: Expected session length
            historical_sessions: Historical session data
            game_rtp: Game theoretical RTP
            game_volatility: Game volatility level

        Returns:
            SessionROIPrediction with probabilities and confidence intervals
        """
        logger.info(f"Predicting session ROI for {game_id}, {session_duration_minutes} min")

        try:
            # Calculate spins from duration (avg 12 spins/min)
            spins_per_minute = 12
            expected_spins = int(session_duration_minutes * spins_per_minute)

            # Analyze historical sessions
            if not historical_sessions or len(historical_sessions) < self.min_session_data:
                # Use RTP for fallback prediction
                expected_roi_pct = (game_rtp - 100)  # Negative by definition
                expected_final_balance = starting_balance * (1 + expected_roi_pct / 100)

                return SessionROIPrediction(
                    game_id=game_id,
                    starting_balance=starting_balance,
                    predicted_duration_minutes=session_duration_minutes,
                    predicted_final_balance=expected_final_balance,
                    predicted_roi_percent=expected_roi_pct,
                    confidence=0.4,
                    probability_profit=0.45,
                    probability_loss=0.55,
                    expected_max_balance=starting_balance * 1.1,
                    expected_min_balance=starting_balance * 0.8,
                    max_drawdown_probability=0.2,
                    risk_level="medium",
                    recommended_max_loss=starting_balance * 0.2,
                    recommended_session_budget=starting_balance * 0.3
                )

            # Analyze historical ROI and variance
            session_rois = [
                ((s.get('final_balance', starting_balance) - s.get('initial_balance', starting_balance)) /
                 s.get('initial_balance', starting_balance) * 100)
                for s in historical_sessions
                if s.get('initial_balance') and s.get('final_balance')
            ]

            session_durations = [
                s.get('session_duration_minutes', session_duration_minutes)
                for s in historical_sessions
            ]

            # Calculate statistics
            mean_roi = statistics.mean(session_rois) if session_rois else -3.52
            std_roi = statistics.stdev(session_rois) if len(session_rois) > 1 else 15.0
            mean_duration = statistics.mean(session_durations) if session_durations else 60

            # Normalize ROI for duration
            duration_ratio = session_duration_minutes / max(mean_duration, 1)
            adjusted_roi = mean_roi * duration_ratio

            # Final balance prediction
            predicted_final_balance = starting_balance * (1 + adjusted_roi / 100)

            # Monte Carlo simulation for probabilities
            results = await self._monte_carlo_simulation(
                starting_balance,
                adjusted_roi,
                std_roi,
                self.simulation_runs
            )

            # Calculate probabilities
            prob_profit = sum(1 for r in results if r['final'] > starting_balance) / len(results)
            prob_loss = 1.0 - prob_profit

            # Drawdown analysis
            max_drawdown_prob = sum(1 for r in results if r['min'] < starting_balance * 0.75) / len(results)

            # Recommended bankroll
            max_loss_recommended = starting_balance * 0.2  # Never risk more than 20%
            session_budget = starting_balance * 0.3  # Session budget = 30% of bankroll

            prediction = SessionROIPrediction(
                game_id=game_id,
                starting_balance=starting_balance,
                predicted_duration_minutes=session_duration_minutes,
                predicted_final_balance=predicted_final_balance,
                predicted_roi_percent=adjusted_roi,
                confidence=min(len(session_rois) / 20.0, 1.0 - (std_roi / (abs(mean_roi) + 1)) * 0.5),
                probability_profit=min(prob_profit, 1.0),
                probability_loss=prob_loss,
                expected_max_balance=statistics.mean([r['max'] for r in results]),
                expected_min_balance=statistics.mean([r['min'] for r in results]),
                max_drawdown_probability=max_drawdown_prob,
                risk_level="high" if prob_loss > 0.65 else "medium" if prob_loss > 0.5 else "low",
                recommended_max_loss=max_loss_recommended,
                recommended_session_budget=session_budget
            )

            logger.info(f"✓ ROI prediction: {adjusted_roi:+.2f}%, confidence {prediction.confidence:.2%}")
            return prediction

        except Exception as e:
            logger.error(f"ROI prediction failed: {e}")
            # Fallback
            return SessionROIPrediction(
                game_id=game_id,
                starting_balance=starting_balance,
                predicted_duration_minutes=session_duration_minutes,
                predicted_final_balance=starting_balance * 0.97,
                predicted_roi_percent=-3.0,
                confidence=0.3,
                probability_profit=0.45,
                probability_loss=0.55,
                expected_max_balance=starting_balance * 1.1,
                expected_min_balance=starting_balance * 0.75,
                max_drawdown_probability=0.25,
                risk_level="medium",
                recommended_max_loss=starting_balance * 0.2,
                recommended_session_budget=starting_balance * 0.3
            )

    async def predict_drawdown(
        self,
        starting_balance: float,
        game_volatility: str,
        historical_drawdowns: Optional[List[float]] = None
    ) -> DrawdownPrediction:
        """
        Predict maximum drawdown probability and size.

        Args:
            starting_balance: Starting bankroll
            game_volatility: Game volatility level
            historical_drawdowns: Historical max drawdowns as percentages

        Returns:
            DrawdownPrediction with probabilities
        """
        logger.info(f"Predicting drawdown for volatility={game_volatility}")

        try:
            # Volatility-based drawdown estimates
            volatility_params = {
                "low": {"mean": 0.10, "std": 0.05},
                "medium": {"mean": 0.15, "std": 0.08},
                "high": {"mean": 0.25, "std": 0.12},
                "very_high": {"mean": 0.40, "std": 0.18},
            }

            params = volatility_params.get(game_volatility, volatility_params["high"])
            mean_drawdown = params["mean"]
            std_drawdown = params["std"]

            # Override with historical if available
            if historical_drawdowns and len(historical_drawdowns) > 2:
                mean_drawdown = statistics.mean(historical_drawdowns) / 100
                std_drawdown = statistics.stdev(historical_drawdowns) / 100 if len(historical_drawdowns) > 1 else std_drawdown

            # Calculate probabilities using normal distribution
            # P(X > threshold) = 1 - CDF(threshold)
            prob_10pct = 1.0 - await self._normal_cdf((0.10 - mean_drawdown) / (std_drawdown + 0.001))
            prob_25pct = 1.0 - await self._normal_cdf((0.25 - mean_drawdown) / (std_drawdown + 0.001))
            prob_50pct = 1.0 - await self._normal_cdf((0.50 - mean_drawdown) / (std_drawdown + 0.001))

            # Recommended buffer
            buffer_percent = mean_drawdown + (2.0 * std_drawdown)  # 2 standard deviations
            recommended_buffer = starting_balance * buffer_percent

            # Session budget (should be smaller than max drawdown buffer)
            session_budget = recommended_buffer * 0.5

            prediction = DrawdownPrediction(
                starting_balance=starting_balance,
                expected_max_drawdown_percent=mean_drawdown * 100,
                probability_lose_10pct=min(prob_10pct, 1.0),
                probability_lose_25pct=min(prob_25pct, 1.0),
                probability_lose_50pct=min(prob_50pct, 1.0),
                recommended_buffer=recommended_buffer,
                session_budget_recommendation=session_budget
            )

            logger.info(f"✓ Drawdown prediction: max {prediction.expected_max_drawdown_percent:.1f}%")
            return prediction

        except Exception as e:
            logger.error(f"Drawdown prediction failed: {e}")
            # Fallback
            return DrawdownPrediction(
                starting_balance=starting_balance,
                expected_max_drawdown_percent=25.0,
                probability_lose_10pct=0.8,
                probability_lose_25pct=0.5,
                probability_lose_50pct=0.1,
                recommended_buffer=starting_balance * 0.5,
                session_budget_recommendation=starting_balance * 0.2
            )

    async def recommend_bet_size(
        self,
        starting_balance: float,
        game_volatility: str,
        profit_goal: Optional[float] = None,
        risk_tolerance: str = "medium"
    ) -> BetSizeRecommendation:
        """
        Recommend optimal bet sizing using Kelly Criterion.

        Args:
            starting_balance: Current bankroll
            game_volatility: Game volatility
            profit_goal: Target profit (optional)
            risk_tolerance: 'low', 'medium', 'high'

        Returns:
            BetSizeRecommendation with Kelly and conservative sizing
        """
        logger.info(f"Recommending bet size: balance={starting_balance}, volatility={game_volatility}")

        try:
            # Assumed win rate and odds for slots
            # Most games are -2% to -4% house edge
            win_probability = 0.48  # 48% win probability (slots rarely 50/50)
            loss_probability = 0.52  # 52% loss probability
            avg_win = 1.8  # Average 1.8x return on win
            avg_loss = -1.0  # -100% on loss

            # Kelly Criterion: f = (bp - q) / b
            # where b = odds, p = win probability, q = loss probability
            b = avg_win / avg_loss  # Odds ratio
            f = (b * win_probability - loss_probability) / b

            # Kelly gives negative (house edge), so use conservative fraction
            f_conservative = abs(f) * 0.1  # Use 10% of Kelly to be safe

            # Size recommendations based on volatility
            volatility_sizes = {
                "low": {"min": 0.5, "avg": 2.0, "max": 5.0},
                "medium": {"min": 1.0, "avg": 3.0, "max": 8.0},
                "high": {"min": 2.0, "avg": 5.0, "max": 12.0},
                "very_high": {"min": 3.0, "avg": 8.0, "max": 20.0},
            }

            sizes = volatility_sizes.get(game_volatility, volatility_sizes["high"])

            # Scale by bankroll (% of bankroll)
            min_bet_pct = sizes["min"] / 100
            avg_bet_pct = sizes["avg"] / 100
            max_bet_pct = sizes["max"] / 100

            min_bet = starting_balance * min_bet_pct
            avg_bet = starting_balance * avg_bet_pct
            max_bet = starting_balance * max_bet_pct

            # Adjust for risk tolerance
            risk_multipliers = {
                "low": 0.5,
                "medium": 1.0,
                "high": 1.5,
            }

            multiplier = risk_multipliers.get(risk_tolerance, 1.0)
            min_bet *= multiplier
            avg_bet *= multiplier
            max_bet *= multiplier

            # Kelly recommendation (scaled down for safety)
            kelly_bet = starting_balance * f_conservative

            explanation = (
                f"Based on {game_volatility} volatility and {risk_tolerance} risk tolerance: "
                f"Min ${min_bet:.2f}, Avg ${avg_bet:.2f}, Max ${max_bet:.2f}. "
                f"Kelly Criterion suggests ${kelly_bet:.2f} (conservative fraction). "
            )

            if profit_goal:
                sessions_needed = profit_goal / (avg_bet * 0.98)  # Assume 2% loss per session
                explanation += f"To reach ${profit_goal:.2f} goal, need ~{sessions_needed:.0f} sessions."

            recommendation = BetSizeRecommendation(
                recommended_min_bet=min_bet,
                recommended_avg_bet=avg_bet,
                recommended_max_bet=max_bet,
                kelly_criterion_bet=kelly_bet,
                confidence=0.75,
                explanation=explanation
            )

            logger.info(f"✓ Bet size recommendation: avg ${avg_bet:.2f}")
            return recommendation

        except Exception as e:
            logger.error(f"Bet size recommendation failed: {e}")
            # Fallback
            avg_bet = starting_balance * 0.05
            return BetSizeRecommendation(
                recommended_min_bet=avg_bet * 0.5,
                recommended_avg_bet=avg_bet,
                recommended_max_bet=avg_bet * 2.0,
                kelly_criterion_bet=avg_bet * 0.2,
                confidence=0.3,
                explanation="Unable to calculate recommendation. Use 5% of bankroll as safe bet size."
            )

    async def _monte_carlo_simulation(
        self,
        starting_balance: float,
        mean_roi_pct: float,
        std_roi_pct: float,
        num_simulations: int
    ) -> List[Dict]:
        """
        Monte Carlo simulation of session outcomes.

        Args:
            starting_balance: Starting bankroll
            mean_roi_pct: Expected ROI percentage
            std_roi_pct: Standard deviation of ROI
            num_simulations: Number of simulations to run

        Returns:
            List of simulation results with max/min balances
        """
        results = []

        for _ in range(num_simulations):
            # Generate random ROI from normal distribution
            roi_pct = random.gauss(mean_roi_pct, std_roi_pct)
            final_balance = starting_balance * (1 + roi_pct / 100)

            # Simulate balance path (rough estimation)
            # Path oscillates around mean with some volatility
            max_balance = starting_balance
            min_balance = starting_balance

            for _ in range(10):  # 10 sub-steps in session
                step_roi = random.gauss(mean_roi_pct / 10, std_roi_pct / 10)
                current = max_balance if random.random() > 0.5 else min_balance
                current = current * (1 + step_roi / 100)
                max_balance = max(max_balance, current)
                min_balance = min(min_balance, current)

            results.append({
                "final": final_balance,
                "max": max_balance,
                "min": min_balance,
                "roi": roi_pct
            })

        return results

    async def _normal_cdf(self, z: float) -> float:
        """Approximate normal CDF"""
        if z < -3:
            return 0.0
        elif z > 3:
            return 1.0
        else:
            # Polynomial approximation
            t = 1 / (1 + 0.2316419 * abs(z))
            d = 0.3989423 * math.exp(-z * z / 2)
            prob = 1 - d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
            return prob if z >= 0 else 1 - prob

    def get_model_info(self) -> Dict:
        """Get balance predictor model info"""
        return {
            "type": "Statistical + Monte Carlo Simulation",
            "methods": [
                "Historical session analysis",
                "Duration-adjusted ROI prediction",
                "Monte Carlo path simulation",
                "Normal distribution drawdown analysis",
                "Kelly Criterion bet sizing",
            ],
            "simulation_runs": self.simulation_runs,
            "confidence_factors": [
                "Number of historical sessions",
                "Variance of historical ROI",
                "Game volatility level",
                "Session duration"
            ],
            "assumptions": [
                "12 spins per minute",
                "RTP matches theoretical over long-term",
                "Historical patterns continue",
                "Independent spin outcomes"
            ]
        }

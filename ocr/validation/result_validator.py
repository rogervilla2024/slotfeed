from typing import Optional, List, Tuple
from dataclasses import dataclass, field
from collections import deque
import numpy as np
from ..engine.text_extractor import ExtractionResult


@dataclass
class ValidationConfig:
    """Configuration for result validation."""
    min_confidence: float = 0.85  # Minimum OCR confidence
    max_balance: float = 100_000_000  # Maximum reasonable balance
    max_bet: float = 100_000  # Maximum reasonable bet
    max_multiplier: float = 100_000  # Maximum reasonable multiplier
    outlier_std_threshold: float = 3.0  # Standard deviations for outlier
    history_size: int = 50  # Number of results to keep for validation


@dataclass
class ValidationResult:
    """Result of validation check."""
    is_valid: bool
    confidence_score: float
    issues: List[str] = field(default_factory=list)
    adjusted_result: Optional[ExtractionResult] = None


class ResultValidator:
    """
    Validates OCR extraction results for consistency and accuracy.
    """

    def __init__(self, config: Optional[ValidationConfig] = None):
        self.config = config or ValidationConfig()
        self._balance_history: deque = deque(maxlen=self.config.history_size)
        self._bet_history: deque = deque(maxlen=self.config.history_size)
        self._current_balance: Optional[float] = None
        self._current_bet: Optional[float] = None

    def validate(self, result: ExtractionResult) -> ValidationResult:
        """
        Validate an extraction result.

        Args:
            result: The extraction result to validate

        Returns:
            ValidationResult with validation status and any adjustments
        """
        issues = []
        confidence_score = 1.0

        # Check if result has required fields
        if result.balance is None:
            issues.append("Missing balance value")
            confidence_score *= 0.5

        # Validate confidence scores
        if result.balance is not None and result.balance_confidence < self.config.min_confidence:
            issues.append(f"Low balance confidence: {result.balance_confidence:.2f}")
            confidence_score *= result.balance_confidence

        if result.bet is not None and result.bet_confidence < self.config.min_confidence:
            issues.append(f"Low bet confidence: {result.bet_confidence:.2f}")
            confidence_score *= 0.9

        if result.win is not None and result.win_confidence < self.config.min_confidence:
            issues.append(f"Low win confidence: {result.win_confidence:.2f}")
            confidence_score *= 0.9

        # Validate value ranges
        if result.balance is not None:
            if result.balance < 0:
                issues.append("Negative balance")
                confidence_score *= 0.0
            elif result.balance > self.config.max_balance:
                issues.append(f"Balance exceeds maximum: {result.balance}")
                confidence_score *= 0.5

        if result.bet is not None:
            if result.bet < 0:
                issues.append("Negative bet")
                confidence_score *= 0.5
            elif result.bet > self.config.max_bet:
                issues.append(f"Bet exceeds maximum: {result.bet}")
                confidence_score *= 0.8

        if result.win is not None and result.win < 0:
            issues.append("Negative win")
            confidence_score *= 0.5

        if result.multiplier is not None and result.multiplier > self.config.max_multiplier:
            issues.append(f"Multiplier exceeds maximum: {result.multiplier}")
            confidence_score *= 0.8

        # Validate logical consistency
        if result.balance is not None and result.bet is not None:
            if result.bet > result.balance:
                issues.append("Bet exceeds balance")
                confidence_score *= 0.7

        # Check for outliers against history
        outlier_issues = self._check_outliers(result)
        issues.extend(outlier_issues)
        if outlier_issues:
            confidence_score *= 0.8

        # Update history
        self._update_history(result)

        is_valid = len(issues) == 0 and confidence_score >= 0.7

        return ValidationResult(
            is_valid=is_valid,
            confidence_score=confidence_score,
            issues=issues,
        )

    def _check_outliers(self, result: ExtractionResult) -> List[str]:
        """Check if values are statistical outliers compared to history."""
        issues = []

        # Check balance outlier
        if result.balance is not None and len(self._balance_history) >= 5:
            mean = np.mean(list(self._balance_history))
            std = np.std(list(self._balance_history))

            if std > 0:
                z_score = abs(result.balance - mean) / std
                if z_score > self.config.outlier_std_threshold:
                    issues.append(
                        f"Balance is outlier (z={z_score:.2f}): {result.balance}"
                    )

        # Check bet consistency
        if result.bet is not None and len(self._bet_history) >= 3:
            recent_bets = list(self._bet_history)[-10:]
            if result.bet not in recent_bets:
                # Bet changed - this might be valid or might be an error
                # Don't flag as issue unless it's very different
                mean_bet = np.mean(recent_bets)
                if abs(result.bet - mean_bet) > mean_bet * 10:
                    issues.append(f"Unusual bet amount: {result.bet}")

        return issues

    def _update_history(self, result: ExtractionResult) -> None:
        """Update validation history with new result."""
        if result.balance is not None and result.balance_confidence >= self.config.min_confidence:
            self._balance_history.append(result.balance)
            self._current_balance = result.balance

        if result.bet is not None and result.bet_confidence >= self.config.min_confidence:
            self._bet_history.append(result.bet)
            self._current_bet = result.bet

    def validate_balance_change(
        self,
        previous: float,
        current: float,
        bet: Optional[float] = None,
        win: Optional[float] = None,
    ) -> Tuple[bool, str]:
        """
        Validate that a balance change makes logical sense.

        Returns:
            Tuple of (is_valid, explanation)
        """
        change = current - previous

        # Balance increased
        if change > 0:
            if win is not None:
                expected_change = win - (bet or 0)
                if abs(change - expected_change) < 1.0:
                    return True, "Balance change matches win"
                else:
                    return False, f"Balance change ({change}) doesn't match win ({win}) - bet ({bet})"
            return True, "Balance increased (possible win)"

        # Balance decreased
        elif change < 0:
            if bet is not None:
                if abs(change + bet) < 1.0:
                    return True, "Balance change matches bet"
                elif abs(change) < abs(bet):
                    return True, "Partial win (balance decreased less than bet)"
            return True, "Balance decreased (bet or loss)"

        # No change
        else:
            return True, "No balance change"

    def reset(self) -> None:
        """Reset validator state for new session."""
        self._balance_history.clear()
        self._bet_history.clear()
        self._current_balance = None
        self._current_bet = None

    @property
    def average_balance(self) -> Optional[float]:
        """Get average balance from history."""
        if self._balance_history:
            return np.mean(list(self._balance_history))
        return None

    @property
    def typical_bet(self) -> Optional[float]:
        """Get most common bet from history."""
        if self._bet_history:
            from collections import Counter
            counter = Counter(self._bet_history)
            return counter.most_common(1)[0][0]
        return None


class SessionValidator:
    """
    Validates extraction results across an entire session.
    """

    def __init__(self, config: Optional[ValidationConfig] = None):
        self.validator = ResultValidator(config)
        self._session_start_balance: Optional[float] = None
        self._total_wagered: float = 0.0
        self._total_won: float = 0.0
        self._results: List[ExtractionResult] = []

    def add_result(self, result: ExtractionResult) -> ValidationResult:
        """Add and validate a new result for the session."""
        validation = self.validator.validate(result)

        if validation.is_valid:
            self._results.append(result)

            # Track session stats
            if self._session_start_balance is None and result.balance is not None:
                self._session_start_balance = result.balance

            if result.bet is not None:
                self._total_wagered += result.bet

            if result.win is not None and result.win > 0:
                self._total_won += result.win

        return validation

    @property
    def session_profit_loss(self) -> Optional[float]:
        """Calculate session profit/loss."""
        if self._results and self._session_start_balance is not None:
            current = self._results[-1].balance
            if current is not None:
                return current - self._session_start_balance
        return None

    @property
    def session_rtp(self) -> Optional[float]:
        """Calculate session RTP."""
        if self._total_wagered > 0:
            return (self._total_won / self._total_wagered) * 100
        return None

    def reset(self) -> None:
        """Reset for new session."""
        self.validator.reset()
        self._session_start_balance = None
        self._total_wagered = 0.0
        self._total_won = 0.0
        self._results.clear()

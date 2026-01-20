from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
import re
import numpy as np
from .ocr_engine import OCREngine, OCRResult


@dataclass
class ExtractionResult:
    """Result of extracting slot game data from a frame."""
    balance: Optional[float] = None
    bet: Optional[float] = None
    win: Optional[float] = None
    multiplier: Optional[float] = None

    balance_confidence: float = 0.0
    bet_confidence: float = 0.0
    win_confidence: float = 0.0
    multiplier_confidence: float = 0.0

    is_valid: bool = False
    error: Optional[str] = None


@dataclass
class ROITemplate:
    """Region of Interest template for a slot game."""
    game_id: str
    game_name: str

    # Regions as (x, y, width, height) in percentage of image size
    balance_region: Tuple[float, float, float, float]
    bet_region: Tuple[float, float, float, float]
    win_region: Tuple[float, float, float, float]
    multiplier_region: Optional[Tuple[float, float, float, float]] = None

    # Preprocessing options
    grayscale: bool = True
    threshold: int = 127
    denoise: bool = True
    invert: bool = False


class TextExtractor:
    """
    Extracts balance, bet, and win values from slot game frames.
    """

    # Common patterns for number extraction
    CURRENCY_PATTERN = re.compile(
        r'[$€£¥₹]?\s*([\d,]+\.?\d*)\s*(?:[$€£¥₹])?'
    )
    MULTIPLIER_PATTERN = re.compile(r'(\d+\.?\d*)\s*[xX]')

    def __init__(self, ocr_engine: Optional[OCREngine] = None):
        self.ocr = ocr_engine or OCREngine()
        self._templates: Dict[str, ROITemplate] = {}

    def register_template(self, template: ROITemplate) -> None:
        """Register a game template."""
        self._templates[template.game_id] = template

    def get_template(self, game_id: str) -> Optional[ROITemplate]:
        """Get template for a game."""
        return self._templates.get(game_id)

    def extract(
        self,
        image: np.ndarray,
        template: Optional[ROITemplate] = None,
        game_id: Optional[str] = None,
    ) -> ExtractionResult:
        """
        Extract slot data from an image frame.

        Args:
            image: Frame as numpy array
            template: ROI template to use
            game_id: Game ID to look up template

        Returns:
            ExtractionResult with extracted values
        """
        # Get template
        if template is None and game_id:
            template = self._templates.get(game_id)

        if template is None:
            return self._extract_without_template(image)

        return self._extract_with_template(image, template)

    def _extract_with_template(
        self,
        image: np.ndarray,
        template: ROITemplate,
    ) -> ExtractionResult:
        """Extract using game-specific template."""
        height, width = image.shape[:2]
        result = ExtractionResult()

        # Convert percentage regions to pixel coordinates
        def to_pixels(region: Tuple[float, float, float, float]) -> Tuple[int, int, int, int]:
            x, y, w, h = region
            return (
                int(x * width),
                int(y * height),
                int((x + w) * width),
                int((y + h) * height),
            )

        # Extract balance
        balance_region = to_pixels(template.balance_region)
        balance_results = self.ocr.process_region(image, *balance_region)
        if balance_results:
            value, conf = self._parse_currency(balance_results[0].text)
            if value is not None:
                result.balance = value
                result.balance_confidence = conf * balance_results[0].confidence

        # Extract bet
        bet_region = to_pixels(template.bet_region)
        bet_results = self.ocr.process_region(image, *bet_region)
        if bet_results:
            value, conf = self._parse_currency(bet_results[0].text)
            if value is not None:
                result.bet = value
                result.bet_confidence = conf * bet_results[0].confidence

        # Extract win
        win_region = to_pixels(template.win_region)
        win_results = self.ocr.process_region(image, *win_region)
        if win_results:
            value, conf = self._parse_currency(win_results[0].text)
            if value is not None:
                result.win = value
                result.win_confidence = conf * win_results[0].confidence

        # Extract multiplier if region defined
        if template.multiplier_region:
            mult_region = to_pixels(template.multiplier_region)
            mult_results = self.ocr.process_region(image, *mult_region)
            if mult_results:
                value = self._parse_multiplier(mult_results[0].text)
                if value is not None:
                    result.multiplier = value
                    result.multiplier_confidence = mult_results[0].confidence

        # Validate result
        result.is_valid = self._validate_result(result)

        return result

    def _extract_without_template(self, image: np.ndarray) -> ExtractionResult:
        """Extract without a template - scan entire image."""
        result = ExtractionResult()

        # Get all text from image
        ocr_results = self.ocr.process_image(image)

        # Try to identify balance, bet, and win from context
        for ocr_result in ocr_results:
            text_lower = ocr_result.raw_text.lower()

            # Look for labeled values
            if 'balance' in text_lower or 'credit' in text_lower:
                value, conf = self._parse_currency(ocr_result.text)
                if value is not None:
                    result.balance = value
                    result.balance_confidence = conf * ocr_result.confidence

            elif 'bet' in text_lower or 'stake' in text_lower:
                value, conf = self._parse_currency(ocr_result.text)
                if value is not None:
                    result.bet = value
                    result.bet_confidence = conf * ocr_result.confidence

            elif 'win' in text_lower or 'payout' in text_lower:
                value, conf = self._parse_currency(ocr_result.text)
                if value is not None:
                    result.win = value
                    result.win_confidence = conf * ocr_result.confidence

        result.is_valid = self._validate_result(result)
        return result

    def _parse_currency(self, text: str) -> Tuple[Optional[float], float]:
        """Parse currency value from text."""
        try:
            # Remove currency symbols and whitespace
            cleaned = re.sub(r'[^\d.,]', '', text)

            # Handle different decimal/thousand separators
            if cleaned.count('.') > 1:
                cleaned = cleaned.replace('.', '', cleaned.count('.') - 1)
            elif cleaned.count(',') > 1:
                cleaned = cleaned.replace(',', '')
            elif ',' in cleaned and '.' in cleaned:
                # Assume comma is thousand separator
                cleaned = cleaned.replace(',', '')
            elif ',' in cleaned:
                # Could be decimal or thousand - check position
                if len(cleaned.split(',')[1]) == 2:
                    cleaned = cleaned.replace(',', '.')
                else:
                    cleaned = cleaned.replace(',', '')

            value = float(cleaned)
            return value, 1.0

        except (ValueError, IndexError):
            return None, 0.0

    def _parse_multiplier(self, text: str) -> Optional[float]:
        """Parse multiplier value from text."""
        match = self.MULTIPLIER_PATTERN.search(text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass

        # Try direct number parsing
        try:
            cleaned = re.sub(r'[^\d.]', '', text)
            return float(cleaned)
        except ValueError:
            return None

    def _validate_result(self, result: ExtractionResult) -> bool:
        """Validate extraction result for consistency."""
        # Must have at least balance
        if result.balance is None:
            return False

        # Balance must be positive
        if result.balance < 0:
            return False

        # Bet must be less than or equal to balance
        if result.bet is not None and result.bet > result.balance:
            return False

        # Win must be non-negative
        if result.win is not None and result.win < 0:
            return False

        # Check confidence thresholds
        if result.balance_confidence < 0.8:
            return False

        return True


# Default templates for popular slots
DEFAULT_TEMPLATES = {
    "sweet-bonanza": ROITemplate(
        game_id="sweet-bonanza",
        game_name="Sweet Bonanza",
        balance_region=(0.02, 0.94, 0.15, 0.05),
        bet_region=(0.35, 0.94, 0.12, 0.05),
        win_region=(0.55, 0.94, 0.15, 0.05),
        multiplier_region=(0.45, 0.45, 0.10, 0.10),
    ),
    "gates-of-olympus": ROITemplate(
        game_id="gates-of-olympus",
        game_name="Gates of Olympus",
        balance_region=(0.02, 0.93, 0.15, 0.06),
        bet_region=(0.35, 0.93, 0.12, 0.06),
        win_region=(0.55, 0.93, 0.15, 0.06),
        multiplier_region=(0.45, 0.45, 0.10, 0.10),
    ),
    "sugar-rush": ROITemplate(
        game_id="sugar-rush",
        game_name="Sugar Rush",
        balance_region=(0.02, 0.94, 0.15, 0.05),
        bet_region=(0.35, 0.94, 0.12, 0.05),
        win_region=(0.55, 0.94, 0.15, 0.05),
    ),
    "wanted-dead-or-wild": ROITemplate(
        game_id="wanted-dead-or-wild",
        game_name="Wanted Dead or a Wild",
        balance_region=(0.02, 0.92, 0.15, 0.06),
        bet_region=(0.40, 0.92, 0.10, 0.06),
        win_region=(0.60, 0.92, 0.15, 0.06),
    ),
    "big-bass-bonanza": ROITemplate(
        game_id="big-bass-bonanza",
        game_name="Big Bass Bonanza",
        balance_region=(0.02, 0.94, 0.15, 0.05),
        bet_region=(0.35, 0.94, 0.12, 0.05),
        win_region=(0.55, 0.94, 0.15, 0.05),
    ),
}

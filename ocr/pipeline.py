from typing import Optional, Callable, Dict, Any
from dataclasses import dataclass
import asyncio
import numpy as np

from .engine.ocr_engine import OCREngine
from .engine.text_extractor import TextExtractor, ExtractionResult, ROITemplate
from .preprocessing.image_processor import ImageProcessor
from .preprocessing.change_detector import ChangeDetector, AdaptiveChangeDetector
from .validation.result_validator import ResultValidator, ValidationResult, SessionValidator


@dataclass
class PipelineConfig:
    """Configuration for OCR pipeline."""
    # Processing settings
    use_gpu: bool = False
    use_adaptive_detection: bool = True

    # Quality thresholds
    min_confidence: float = 0.85
    change_threshold: float = 0.05

    # Performance settings
    skip_unchanged_frames: bool = True
    max_fps: float = 0.2  # Max 1 frame per 5 seconds


@dataclass
class PipelineResult:
    """Result from OCR pipeline processing."""
    extraction: Optional[ExtractionResult]
    validation: Optional[ValidationResult]
    frame_changed: bool
    processed: bool
    error: Optional[str] = None


class OCRPipeline:
    """
    Complete OCR pipeline for processing slot game stream frames.

    Combines:
    - Image preprocessing
    - Change detection (to skip unchanged frames)
    - OCR text extraction
    - Result validation
    """

    def __init__(
        self,
        config: Optional[PipelineConfig] = None,
        on_balance_update: Optional[Callable[[ExtractionResult], None]] = None,
        on_big_win: Optional[Callable[[ExtractionResult], None]] = None,
    ):
        self.config = config or PipelineConfig()
        self._on_balance_update = on_balance_update
        self._on_big_win = on_big_win

        # Initialize components
        self.preprocessor = ImageProcessor()
        self.ocr_engine = OCREngine()
        self.extractor = TextExtractor(self.ocr_engine)
        self.validator = SessionValidator()

        if self.config.use_adaptive_detection:
            self.change_detector = AdaptiveChangeDetector()
        else:
            self.change_detector = ChangeDetector()

        # State
        self._current_template: Optional[ROITemplate] = None
        self._last_extraction: Optional[ExtractionResult] = None
        self._frame_count = 0
        self._processed_count = 0

    def set_template(self, template: ROITemplate) -> None:
        """Set the game template for extraction."""
        self._current_template = template
        self.extractor.register_template(template)

    def set_game(self, game_id: str) -> bool:
        """Set game by ID (uses default templates)."""
        from .engine.text_extractor import DEFAULT_TEMPLATES

        if game_id in DEFAULT_TEMPLATES:
            self.set_template(DEFAULT_TEMPLATES[game_id])
            return True
        return False

    def process_frame(self, frame: np.ndarray) -> PipelineResult:
        """
        Process a single frame through the OCR pipeline.

        Args:
            frame: Frame as numpy array (RGB or BGR)

        Returns:
            PipelineResult with extraction and validation results
        """
        self._frame_count += 1

        try:
            # Get regions for change detection
            regions = None
            if self._current_template:
                height, width = frame.shape[:2]
                regions = self._get_pixel_regions(
                    self._current_template,
                    width,
                    height,
                )

            # Check for changes
            change_result = self.change_detector.detect(frame, regions)

            if not change_result.has_changed and self.config.skip_unchanged_frames:
                return PipelineResult(
                    extraction=self._last_extraction,
                    validation=None,
                    frame_changed=False,
                    processed=False,
                )

            # Preprocess frame
            processed_frame = self.preprocessor.process(frame)

            # Extract data
            extraction = self.extractor.extract(
                processed_frame,
                template=self._current_template,
            )

            # Validate result
            validation = self.validator.add_result(extraction)

            if validation.is_valid:
                self._processed_count += 1
                self._last_extraction = extraction

                # Callbacks
                if self._on_balance_update and extraction.balance is not None:
                    self._on_balance_update(extraction)

                if self._on_big_win and extraction.multiplier and extraction.multiplier >= 100:
                    self._on_big_win(extraction)

            return PipelineResult(
                extraction=extraction,
                validation=validation,
                frame_changed=True,
                processed=True,
            )

        except Exception as e:
            return PipelineResult(
                extraction=None,
                validation=None,
                frame_changed=False,
                processed=False,
                error=str(e),
            )

    def process_frame_bytes(self, frame_bytes: bytes) -> PipelineResult:
        """Process frame from bytes."""
        from PIL import Image
        import io

        image = Image.open(io.BytesIO(frame_bytes))
        frame = np.array(image)
        return self.process_frame(frame)

    async def process_stream(
        self,
        frame_generator,
        duration: Optional[int] = None,
    ) -> None:
        """
        Process frames from an async generator.

        Args:
            frame_generator: Async generator yielding frames
            duration: Optional duration in seconds
        """
        import time

        start_time = time.time()
        min_interval = 1.0 / self.config.max_fps

        async for frame in frame_generator:
            # Check duration
            if duration and (time.time() - start_time) >= duration:
                break

            # Process frame
            result = self.process_frame(frame)

            # Respect max FPS
            await asyncio.sleep(min_interval)

    def _get_pixel_regions(
        self,
        template: ROITemplate,
        width: int,
        height: int,
    ) -> Dict[str, tuple]:
        """Convert template regions to pixel coordinates."""
        def to_pixels(region: tuple) -> tuple:
            x, y, w, h = region
            return (
                int(x * width),
                int(y * height),
                int((x + w) * width),
                int((y + h) * height),
            )

        regions = {
            "balance": to_pixels(template.balance_region),
            "bet": to_pixels(template.bet_region),
            "win": to_pixels(template.win_region),
        }

        if template.multiplier_region:
            regions["multiplier"] = to_pixels(template.multiplier_region)

        return regions

    def reset(self) -> None:
        """Reset pipeline for new session."""
        self.change_detector.reset()
        self.validator.reset()
        self._last_extraction = None
        self._frame_count = 0
        self._processed_count = 0

    @property
    def stats(self) -> Dict[str, Any]:
        """Get pipeline statistics."""
        return {
            "frame_count": self._frame_count,
            "processed_count": self._processed_count,
            "skip_rate": (
                (self._frame_count - self._processed_count) / self._frame_count
                if self._frame_count > 0 else 0
            ),
            "session_profit_loss": self.validator.session_profit_loss,
            "session_rtp": self.validator.session_rtp,
            "current_balance": (
                self._last_extraction.balance
                if self._last_extraction else None
            ),
        }


def create_pipeline(
    game_id: Optional[str] = None,
    use_gpu: bool = False,
) -> OCRPipeline:
    """
    Factory function to create configured OCR pipeline.

    Args:
        game_id: Optional game ID to set initial template
        use_gpu: Whether to use GPU for OCR

    Returns:
        Configured OCRPipeline instance
    """
    config = PipelineConfig(use_gpu=use_gpu)
    pipeline = OCRPipeline(config)

    if game_id:
        pipeline.set_game(game_id)

    return pipeline

import pytest
import numpy as np
from ocr.engine.ocr_engine import OCREngine, OCRResult
from ocr.engine.text_extractor import TextExtractor, ExtractionResult, ROITemplate, DEFAULT_TEMPLATES
from ocr.preprocessing.image_processor import ImageProcessor, ProcessingConfig
from ocr.preprocessing.change_detector import ChangeDetector, ChangeResult
from ocr.validation.result_validator import ResultValidator, ValidationResult
from ocr.pipeline import OCRPipeline, create_pipeline, PipelineConfig


class TestOCREngine:
    def test_initialization(self):
        engine = OCREngine()
        assert engine is not None
        assert engine._initialized is False

    def test_mock_processing(self):
        engine = OCREngine()
        # Create a dummy image
        image = np.zeros((720, 1280, 3), dtype=np.uint8)

        # Process with regions
        regions = {
            "balance": (100, 650, 300, 700),
            "bet": (450, 650, 600, 700),
            "win": (700, 650, 900, 700),
        }
        results = engine.process_image(image, regions)

        # Should return mock results
        assert len(results) == 3

    def test_extract_numbers(self):
        engine = OCREngine()
        image = np.zeros((100, 200, 3), dtype=np.uint8)

        numbers = engine.extract_numbers(image)
        # Mock mode returns mock results
        assert isinstance(numbers, list)


class TestTextExtractor:
    def test_initialization(self):
        extractor = TextExtractor()
        assert extractor is not None

    def test_register_template(self):
        extractor = TextExtractor()
        template = ROITemplate(
            game_id="test-game",
            game_name="Test Game",
            balance_region=(0.02, 0.94, 0.15, 0.05),
            bet_region=(0.35, 0.94, 0.12, 0.05),
            win_region=(0.55, 0.94, 0.15, 0.05),
        )
        extractor.register_template(template)

        assert extractor.get_template("test-game") is not None

    def test_default_templates_exist(self):
        assert "sweet-bonanza" in DEFAULT_TEMPLATES
        assert "gates-of-olympus" in DEFAULT_TEMPLATES
        assert "sugar-rush" in DEFAULT_TEMPLATES
        assert "wanted-dead-or-wild" in DEFAULT_TEMPLATES
        assert "big-bass-bonanza" in DEFAULT_TEMPLATES

    def test_parse_currency(self):
        extractor = TextExtractor()

        # Test various currency formats
        value, conf = extractor._parse_currency("$1,234.56")
        assert value == 1234.56

        value, conf = extractor._parse_currency("1234.56")
        assert value == 1234.56

        value, conf = extractor._parse_currency("1,234")
        assert value == 1234.0


class TestImageProcessor:
    def test_initialization(self):
        processor = ImageProcessor()
        assert processor is not None

    def test_process_image(self):
        processor = ImageProcessor()
        image = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        processed = processor.process(image)

        assert processed is not None
        # Should be resized to default dimensions
        assert processed.shape[0] == 720
        assert processed.shape[1] == 1280

    def test_grayscale_processing(self):
        config = ProcessingConfig(grayscale=True, resize_width=None, resize_height=None)
        processor = ImageProcessor(config)
        image = np.random.randint(0, 255, (100, 200, 3), dtype=np.uint8)

        processed = processor.process(image)

        # Should be 2D (grayscale)
        assert len(processed.shape) == 2


class TestChangeDetector:
    def test_initialization(self):
        detector = ChangeDetector()
        assert detector is not None

    def test_first_frame_always_changed(self):
        detector = ChangeDetector()
        frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        result = detector.detect(frame)

        assert result.has_changed is True
        assert result.change_percentage == 1.0

    def test_identical_frames_no_change(self):
        detector = ChangeDetector()
        frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        # First frame
        detector.detect(frame)

        # Same frame again
        result = detector.detect(frame.copy())

        assert result.has_changed is False
        assert result.change_percentage < 0.01

    def test_different_frames_detected(self):
        detector = ChangeDetector()
        frame1 = np.zeros((720, 1280, 3), dtype=np.uint8)
        frame2 = np.ones((720, 1280, 3), dtype=np.uint8) * 255

        detector.detect(frame1)
        result = detector.detect(frame2)

        assert result.has_changed is True
        assert result.change_percentage > 0.5

    def test_reset(self):
        detector = ChangeDetector()
        frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        detector.detect(frame)
        detector.reset()

        # After reset, should be like first frame
        result = detector.detect(frame)
        assert result.has_changed is True


class TestResultValidator:
    def test_initialization(self):
        validator = ResultValidator()
        assert validator is not None

    def test_valid_result(self):
        validator = ResultValidator()
        result = ExtractionResult(
            balance=1000.0,
            bet=10.0,
            win=0.0,
            balance_confidence=0.95,
            bet_confidence=0.90,
            win_confidence=0.90,
            is_valid=True,
        )

        validation = validator.validate(result)

        assert validation.is_valid is True
        assert validation.confidence_score > 0.8

    def test_negative_balance_invalid(self):
        validator = ResultValidator()
        result = ExtractionResult(
            balance=-100.0,
            balance_confidence=0.95,
            is_valid=True,
        )

        validation = validator.validate(result)

        assert validation.is_valid is False
        assert "Negative balance" in validation.issues

    def test_bet_exceeds_balance(self):
        validator = ResultValidator()
        result = ExtractionResult(
            balance=100.0,
            bet=500.0,
            balance_confidence=0.95,
            bet_confidence=0.90,
            is_valid=True,
        )

        validation = validator.validate(result)

        assert "Bet exceeds balance" in validation.issues


class TestOCRPipeline:
    def test_initialization(self):
        pipeline = OCRPipeline()
        assert pipeline is not None

    def test_create_pipeline_factory(self):
        pipeline = create_pipeline()
        assert pipeline is not None

    def test_create_pipeline_with_game(self):
        pipeline = create_pipeline(game_id="sweet-bonanza")
        assert pipeline._current_template is not None
        assert pipeline._current_template.game_id == "sweet-bonanza"

    def test_set_game(self):
        pipeline = OCRPipeline()

        result = pipeline.set_game("gates-of-olympus")
        assert result is True
        assert pipeline._current_template.game_id == "gates-of-olympus"

        result = pipeline.set_game("non-existent-game")
        assert result is False

    def test_process_frame(self):
        pipeline = create_pipeline(game_id="sweet-bonanza")
        frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        result = pipeline.process_frame(frame)

        assert result is not None
        assert result.frame_changed is True  # First frame always changed

    def test_skip_unchanged_frames(self):
        config = PipelineConfig(skip_unchanged_frames=True)
        pipeline = OCRPipeline(config)
        pipeline.set_game("sweet-bonanza")

        frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        # First frame - should process
        result1 = pipeline.process_frame(frame)
        assert result1.processed is True

        # Same frame - should skip
        result2 = pipeline.process_frame(frame.copy())
        assert result2.processed is False

    def test_reset(self):
        pipeline = create_pipeline(game_id="sweet-bonanza")
        frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        pipeline.process_frame(frame)
        assert pipeline._frame_count == 1

        pipeline.reset()
        assert pipeline._frame_count == 0

    def test_stats(self):
        pipeline = create_pipeline(game_id="sweet-bonanza")
        frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

        pipeline.process_frame(frame)

        stats = pipeline.stats
        assert "frame_count" in stats
        assert "processed_count" in stats
        assert stats["frame_count"] == 1

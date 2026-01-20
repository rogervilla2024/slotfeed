from typing import Optional, List, Tuple, Dict, Any
from dataclasses import dataclass, field
from pathlib import Path
import numpy as np
from PIL import Image
import io


@dataclass
class OCRResult:
    """Result from OCR processing."""
    text: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    raw_text: str = ""


@dataclass
class OCRConfig:
    """Configuration for OCR engine."""
    use_gpu: bool = False
    lang: str = "en"
    det_model_dir: Optional[str] = None
    rec_model_dir: Optional[str] = None
    use_angle_cls: bool = False
    show_log: bool = False


class OCREngine:
    """
    OCR Engine using PaddleOCR for text extraction.

    This is an abstraction layer that can work with or without
    PaddleOCR installed, falling back to mock data for testing.
    """

    def __init__(self, config: Optional[OCRConfig] = None):
        self.config = config or OCRConfig()
        self._ocr = None
        self._initialized = False

    def _initialize(self) -> bool:
        """Initialize PaddleOCR if available."""
        if self._initialized:
            return self._ocr is not None

        try:
            from paddleocr import PaddleOCR

            # PaddleOCR v3.3+ parameters
            self._ocr = PaddleOCR(
                lang=self.config.lang,
                use_textline_orientation=self.config.use_angle_cls,
            )
            self._initialized = True
            return True

        except ImportError:
            print("PaddleOCR not installed. Running in mock mode.")
            self._initialized = True
            return False

        except Exception as e:
            print(f"PaddleOCR initialization failed: {e}. Running in mock mode.")
            self._initialized = True
            return False

    def process_image(
        self,
        image: np.ndarray,
        regions: Optional[Dict[str, Tuple[int, int, int, int]]] = None,
    ) -> List[OCRResult]:
        """
        Process image and extract text.

        Args:
            image: numpy array (BGR or RGB)
            regions: Optional dict of named regions to process

        Returns:
            List of OCRResult objects
        """
        self._initialize()

        if self._ocr is None:
            return self._mock_process(image, regions)

        results = []

        def parse_ocr_result(ocr_output, offset_x=0, offset_y=0):
            """Parse PaddleOCR v3+ results."""
            parsed = []
            if not ocr_output:
                return parsed

            # Handle list result (new API)
            if isinstance(ocr_output, list) and len(ocr_output) > 0:
                result = ocr_output[0]
                # Access dict-like result
                texts = result.get("rec_texts", []) if hasattr(result, 'get') else getattr(result, 'rec_texts', [])
                scores = result.get("rec_scores", []) if hasattr(result, 'get') else getattr(result, 'rec_scores', [])
                boxes = result.get("dt_polys", []) if hasattr(result, 'get') else getattr(result, 'dt_polys', [])

                for i, text in enumerate(texts):
                    conf = float(scores[i]) if i < len(scores) else 0.0
                    box = boxes[i] if i < len(boxes) else [[0, 0], [0, 0], [0, 0], [0, 0]]

                    bbox = (
                        int(box[0][0] + offset_x),
                        int(box[0][1] + offset_y),
                        int(box[2][0] + offset_x),
                        int(box[2][1] + offset_y),
                    )

                    parsed.append(OCRResult(
                        text=self._clean_text(text),
                        confidence=conf,
                        bbox=bbox,
                        raw_text=text,
                    ))
            return parsed

        if regions:
            # Process specific regions
            for name, (x1, y1, x2, y2) in regions.items():
                cropped = image[y1:y2, x1:x2]
                region_results = self._ocr.predict(cropped)
                results.extend(parse_ocr_result(region_results, x1, y1))
        else:
            # Process entire image
            ocr_results = self._ocr.predict(image)
            results.extend(parse_ocr_result(ocr_results))

        return results

    def process_image_bytes(
        self,
        image_bytes: bytes,
        regions: Optional[Dict[str, Tuple[int, int, int, int]]] = None,
    ) -> List[OCRResult]:
        """Process image from bytes."""
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)
        return self.process_image(image_array, regions)

    def process_region(
        self,
        image: np.ndarray,
        x1: int,
        y1: int,
        x2: int,
        y2: int,
    ) -> List[OCRResult]:
        """Process a specific region of the image."""
        return self.process_image(image, {"region": (x1, y1, x2, y2)})

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove common OCR artifacts
        cleaned = text.strip()

        # Remove currency symbols for number extraction
        for symbol in ["$", "€", "£", "¥", "₹"]:
            cleaned = cleaned.replace(symbol, "")

        # Remove thousand separators for number parsing
        cleaned = cleaned.replace(",", "")
        cleaned = cleaned.replace(" ", "")

        return cleaned

    def _mock_process(
        self,
        image: np.ndarray,
        regions: Optional[Dict[str, Tuple[int, int, int, int]]] = None,
    ) -> List[OCRResult]:
        """Mock processing for testing without PaddleOCR."""
        # Return mock results based on regions
        mock_results = []

        if regions:
            mock_values = {
                "balance": ("1,234.56", 0.95),
                "bet": ("10.00", 0.98),
                "win": ("0.00", 0.97),
            }

            for name, (x1, y1, x2, y2) in regions.items():
                if name in mock_values:
                    text, conf = mock_values[name]
                    mock_results.append(OCRResult(
                        text=self._clean_text(text),
                        confidence=conf,
                        bbox=(x1, y1, x2, y2),
                        raw_text=text,
                    ))

        return mock_results

    def extract_numbers(
        self,
        image: np.ndarray,
        region: Optional[Tuple[int, int, int, int]] = None,
    ) -> List[Tuple[float, float]]:
        """
        Extract numeric values from image.

        Returns:
            List of (value, confidence) tuples
        """
        if region:
            results = self.process_region(image, *region)
        else:
            results = self.process_image(image)

        numbers = []
        for result in results:
            try:
                # Try to parse as float
                value = float(result.text)
                numbers.append((value, result.confidence))
            except ValueError:
                # Try extracting number from text
                import re
                matches = re.findall(r'[\d.]+', result.text)
                for match in matches:
                    try:
                        value = float(match)
                        numbers.append((value, result.confidence))
                    except ValueError:
                        continue

        return numbers

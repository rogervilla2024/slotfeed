from typing import Optional, Tuple
from dataclasses import dataclass
import numpy as np
from PIL import Image, ImageFilter, ImageOps
import io


@dataclass
class ProcessingConfig:
    """Configuration for image preprocessing."""
    resize_width: Optional[int] = 1280
    resize_height: Optional[int] = 720
    grayscale: bool = True
    threshold: Optional[int] = None  # Binary threshold (0-255)
    denoise: bool = True
    sharpen: bool = True
    invert: bool = False
    contrast_enhance: float = 1.0
    brightness_enhance: float = 1.0


class ImageProcessor:
    """
    Preprocesses images for optimal OCR accuracy.
    """

    def __init__(self, config: Optional[ProcessingConfig] = None):
        self.config = config or ProcessingConfig()

    def process(self, image: np.ndarray) -> np.ndarray:
        """
        Process image with configured preprocessing steps.

        Args:
            image: Input image as numpy array (BGR or RGB)

        Returns:
            Processed image as numpy array
        """
        # Convert numpy to PIL Image
        pil_image = Image.fromarray(image)

        # Resize if configured
        if self.config.resize_width and self.config.resize_height:
            pil_image = pil_image.resize(
                (self.config.resize_width, self.config.resize_height),
                Image.Resampling.LANCZOS,
            )

        # Convert to grayscale
        if self.config.grayscale:
            pil_image = pil_image.convert('L')

        # Enhance contrast
        if self.config.contrast_enhance != 1.0:
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(self.config.contrast_enhance)

        # Enhance brightness
        if self.config.brightness_enhance != 1.0:
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Brightness(pil_image)
            pil_image = enhancer.enhance(self.config.brightness_enhance)

        # Sharpen
        if self.config.sharpen:
            pil_image = pil_image.filter(ImageFilter.SHARPEN)

        # Denoise
        if self.config.denoise:
            pil_image = pil_image.filter(ImageFilter.MedianFilter(size=3))

        # Apply threshold (binarization)
        if self.config.threshold is not None:
            pil_image = pil_image.point(
                lambda x: 255 if x > self.config.threshold else 0
            )

        # Invert
        if self.config.invert:
            pil_image = ImageOps.invert(pil_image)

        return np.array(pil_image)

    def process_bytes(self, image_bytes: bytes) -> np.ndarray:
        """Process image from bytes."""
        image = Image.open(io.BytesIO(image_bytes))
        return self.process(np.array(image))

    def process_region(
        self,
        image: np.ndarray,
        x1: int,
        y1: int,
        x2: int,
        y2: int,
    ) -> np.ndarray:
        """Process a specific region of the image."""
        region = image[y1:y2, x1:x2]
        return self.process(region)

    def enhance_for_numbers(self, image: np.ndarray) -> np.ndarray:
        """
        Apply preprocessing optimized for number recognition.
        """
        pil_image = Image.fromarray(image)

        # Convert to grayscale
        if pil_image.mode != 'L':
            pil_image = pil_image.convert('L')

        # Increase contrast
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(pil_image)
        pil_image = enhancer.enhance(1.5)

        # Sharpen
        pil_image = pil_image.filter(ImageFilter.SHARPEN)
        pil_image = pil_image.filter(ImageFilter.SHARPEN)

        # Apply adaptive-like threshold
        # Simple implementation - split into regions and threshold
        img_array = np.array(pil_image)
        mean_val = np.mean(img_array)
        threshold = int(mean_val * 0.8)

        binary = (img_array > threshold).astype(np.uint8) * 255

        return binary

    def detect_text_regions(
        self,
        image: np.ndarray,
        min_area: int = 100,
        max_area: int = 50000,
    ) -> list:
        """
        Detect potential text regions in image.

        Returns list of (x, y, w, h) bounding boxes.
        """
        # Simple edge-based detection
        from PIL import ImageFilter

        pil_image = Image.fromarray(image)

        if pil_image.mode != 'L':
            pil_image = pil_image.convert('L')

        # Edge detection
        edges = pil_image.filter(ImageFilter.FIND_EDGES)
        edge_array = np.array(edges)

        # Find connected components (simplified)
        # For production, use cv2.findContours or similar
        regions = []

        # Simple horizontal projection
        h_proj = np.sum(edge_array, axis=1)
        v_proj = np.sum(edge_array, axis=0)

        # Find non-zero regions
        h_threshold = np.max(h_proj) * 0.1
        v_threshold = np.max(v_proj) * 0.1

        # Find text lines (simplified)
        in_region = False
        start_y = 0

        for y, val in enumerate(h_proj):
            if val > h_threshold and not in_region:
                in_region = True
                start_y = y
            elif val <= h_threshold and in_region:
                in_region = False
                height = y - start_y
                if height > 10:  # Minimum height
                    regions.append((0, start_y, image.shape[1], height))

        return regions


def create_preset_processor(preset: str) -> ImageProcessor:
    """Create processor with preset configuration."""
    presets = {
        "default": ProcessingConfig(),
        "high_contrast": ProcessingConfig(
            contrast_enhance=1.5,
            threshold=128,
        ),
        "dark_theme": ProcessingConfig(
            invert=True,
            contrast_enhance=1.3,
        ),
        "noisy": ProcessingConfig(
            denoise=True,
            sharpen=True,
            contrast_enhance=1.2,
        ),
        "numbers": ProcessingConfig(
            grayscale=True,
            sharpen=True,
            contrast_enhance=1.5,
            threshold=127,
        ),
    }

    config = presets.get(preset, presets["default"])
    return ImageProcessor(config)

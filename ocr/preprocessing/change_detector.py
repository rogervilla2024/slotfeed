from typing import Optional, Tuple, List
from dataclasses import dataclass
import numpy as np
from PIL import Image
import io


@dataclass
class ChangeResult:
    """Result of change detection between frames."""
    has_changed: bool
    change_percentage: float
    changed_regions: List[Tuple[int, int, int, int]]  # List of (x1, y1, x2, y2)
    balance_changed: bool = False
    win_changed: bool = False


@dataclass
class ChangeDetectorConfig:
    """Configuration for change detection."""
    change_threshold: float = 0.05  # 5% change triggers OCR
    region_threshold: float = 0.10  # 10% change in specific region
    min_region_size: int = 20  # Minimum pixels to consider a region
    compare_method: str = "pixel"  # pixel, histogram, or structural


class ChangeDetector:
    """
    Detects changes between consecutive frames to optimize OCR processing.
    Only processes OCR when significant changes are detected.
    """

    def __init__(self, config: Optional[ChangeDetectorConfig] = None):
        self.config = config or ChangeDetectorConfig()
        self._previous_frame: Optional[np.ndarray] = None
        self._previous_regions: dict = {}

    def detect(
        self,
        current_frame: np.ndarray,
        regions: Optional[dict] = None,
    ) -> ChangeResult:
        """
        Detect changes between current and previous frame.

        Args:
            current_frame: Current frame as numpy array
            regions: Optional dict of named regions to check for changes

        Returns:
            ChangeResult with detection results
        """
        if self._previous_frame is None:
            self._previous_frame = current_frame.copy()
            self._previous_regions = {
                name: self._extract_region(current_frame, coords)
                for name, coords in (regions or {}).items()
            }
            return ChangeResult(
                has_changed=True,
                change_percentage=1.0,
                changed_regions=[],
            )

        # Compare frames based on method
        if self.config.compare_method == "histogram":
            change_pct = self._compare_histogram(
                self._previous_frame, current_frame
            )
        elif self.config.compare_method == "structural":
            change_pct = self._compare_structural(
                self._previous_frame, current_frame
            )
        else:
            change_pct = self._compare_pixels(
                self._previous_frame, current_frame
            )

        has_changed = bool(change_pct > self.config.change_threshold)
        changed_regions = []
        balance_changed = False
        win_changed = False

        # Check specific regions if provided
        if regions and has_changed:
            for name, coords in regions.items():
                current_region = self._extract_region(current_frame, coords)
                previous_region = self._previous_regions.get(name)

                if previous_region is not None:
                    region_change = self._compare_pixels(
                        previous_region, current_region
                    )

                    if region_change > self.config.region_threshold:
                        changed_regions.append(coords)

                        if "balance" in name.lower():
                            balance_changed = True
                        if "win" in name.lower():
                            win_changed = True

                self._previous_regions[name] = current_region

        # Update previous frame
        self._previous_frame = current_frame.copy()

        return ChangeResult(
            has_changed=has_changed,
            change_percentage=float(change_pct),
            changed_regions=changed_regions,
            balance_changed=balance_changed,
            win_changed=win_changed,
        )

    def detect_from_bytes(
        self,
        current_bytes: bytes,
        regions: Optional[dict] = None,
    ) -> ChangeResult:
        """Detect changes from image bytes."""
        image = Image.open(io.BytesIO(current_bytes))
        return self.detect(np.array(image), regions)

    def reset(self) -> None:
        """Reset detector state (new stream/session)."""
        self._previous_frame = None
        self._previous_regions = {}

    def _extract_region(
        self,
        image: np.ndarray,
        coords: Tuple[int, int, int, int],
    ) -> np.ndarray:
        """Extract region from image."""
        x1, y1, x2, y2 = coords
        return image[y1:y2, x1:x2].copy()

    def _compare_pixels(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
    ) -> float:
        """Compare two images using pixel difference."""
        if img1.shape != img2.shape:
            # Resize if shapes don't match
            img2 = np.resize(img2, img1.shape)

        # Calculate absolute difference
        diff = np.abs(img1.astype(np.float32) - img2.astype(np.float32))

        # Normalize by max possible difference (255 for 8-bit images)
        if diff.size > 0:
            return np.mean(diff) / 255.0
        return 0.0

    def _compare_histogram(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
    ) -> float:
        """Compare using histogram correlation."""
        # Convert to grayscale if needed
        if len(img1.shape) == 3:
            img1 = np.mean(img1, axis=2).astype(np.uint8)
        if len(img2.shape) == 3:
            img2 = np.mean(img2, axis=2).astype(np.uint8)

        # Calculate histograms
        hist1, _ = np.histogram(img1.flatten(), bins=256, range=(0, 256))
        hist2, _ = np.histogram(img2.flatten(), bins=256, range=(0, 256))

        # Normalize
        hist1 = hist1 / np.sum(hist1)
        hist2 = hist2 / np.sum(hist2)

        # Calculate correlation
        correlation = np.corrcoef(hist1, hist2)[0, 1]

        # Convert to change percentage (1 = identical, 0 = completely different)
        if np.isnan(correlation):
            return 1.0
        return 1.0 - max(0, correlation)

    def _compare_structural(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
    ) -> float:
        """
        Simple structural comparison using block-based differences.
        For production, consider using SSIM from skimage.
        """
        block_size = 16

        # Convert to grayscale
        if len(img1.shape) == 3:
            img1 = np.mean(img1, axis=2)
        if len(img2.shape) == 3:
            img2 = np.mean(img2, axis=2)

        # Resize to match
        h = min(img1.shape[0], img2.shape[0])
        w = min(img1.shape[1], img2.shape[1])
        img1 = img1[:h, :w]
        img2 = img2[:h, :w]

        # Calculate block means
        blocks_changed = 0
        total_blocks = 0

        for y in range(0, h - block_size, block_size):
            for x in range(0, w - block_size, block_size):
                block1 = img1[y:y+block_size, x:x+block_size]
                block2 = img2[y:y+block_size, x:x+block_size]

                mean_diff = abs(np.mean(block1) - np.mean(block2))

                if mean_diff > 10:  # Threshold for block change
                    blocks_changed += 1
                total_blocks += 1

        if total_blocks == 0:
            return 0.0
        return blocks_changed / total_blocks


class AdaptiveChangeDetector(ChangeDetector):
    """
    Adaptive change detector that adjusts thresholds based on
    stream characteristics.
    """

    def __init__(self, config: Optional[ChangeDetectorConfig] = None):
        super().__init__(config)
        self._change_history: List[float] = []
        self._adaptive_threshold: float = self.config.change_threshold

    def detect(
        self,
        current_frame: np.ndarray,
        regions: Optional[dict] = None,
    ) -> ChangeResult:
        result = super().detect(current_frame, regions)

        # Update history
        self._change_history.append(result.change_percentage)
        if len(self._change_history) > 100:
            self._change_history.pop(0)

        # Adapt threshold based on history
        if len(self._change_history) > 10:
            mean_change = np.mean(self._change_history)
            std_change = np.std(self._change_history)

            # Set threshold to mean + 1.5 std
            self._adaptive_threshold = min(
                max(mean_change + 1.5 * std_change, 0.02),
                0.20,
            )

            # Re-evaluate with adaptive threshold
            result.has_changed = (
                result.change_percentage > self._adaptive_threshold
            )

        return result

    @property
    def adaptive_threshold(self) -> float:
        return self._adaptive_threshold

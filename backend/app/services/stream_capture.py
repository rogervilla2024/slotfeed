import asyncio
import subprocess
from typing import Optional, Callable, AsyncGenerator
from dataclasses import dataclass
from pathlib import Path
import tempfile
import os


@dataclass
class CaptureConfig:
    """Configuration for stream frame capture."""
    resolution: str = "1280x720"  # 720p
    fps: float = 0.2  # 1 frame every 5 seconds
    quality: int = 85  # JPEG quality
    timeout: int = 10  # seconds for frame capture


class StreamCapture:
    """Captures frames from live streams using FFmpeg + Streamlink."""

    def __init__(self, config: Optional[CaptureConfig] = None):
        self.config = config or CaptureConfig()
        self._process: Optional[subprocess.Popen] = None
        self._running = False

    async def get_stream_url(self, playback_url: str) -> Optional[str]:
        """
        Get the actual stream URL using streamlink.
        Returns the best quality stream URL.
        """
        try:
            # Use streamlink to get available streams
            result = await asyncio.create_subprocess_exec(
                "streamlink",
                "--stream-url",
                playback_url,
                "best",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                result.communicate(),
                timeout=self.config.timeout,
            )

            if result.returncode == 0:
                return stdout.decode().strip()
            return None

        except asyncio.TimeoutError:
            return None
        except Exception as e:
            print(f"Streamlink error: {e}")
            return None

    async def capture_single_frame(
        self,
        stream_url: str,
        output_path: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Capture a single frame from the stream.
        Returns frame as bytes or saves to output_path.
        """
        if output_path is None:
            # Create temp file
            fd, output_path = tempfile.mkstemp(suffix=".jpg")
            os.close(fd)
            delete_after = True
        else:
            delete_after = False

        try:
            # FFmpeg command to capture single frame
            cmd = [
                "ffmpeg",
                "-y",  # Overwrite output
                "-i", stream_url,
                "-vframes", "1",  # Single frame
                "-s", self.config.resolution,
                "-q:v", str(int((100 - self.config.quality) / 10 + 1)),
                output_path,
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )

            await asyncio.wait_for(
                process.wait(),
                timeout=self.config.timeout,
            )

            if process.returncode == 0 and os.path.exists(output_path):
                with open(output_path, "rb") as f:
                    frame_data = f.read()
                return frame_data
            return None

        except asyncio.TimeoutError:
            return None
        except Exception as e:
            print(f"Frame capture error: {e}")
            return None
        finally:
            if delete_after and os.path.exists(output_path):
                os.unlink(output_path)

    async def capture_frames(
        self,
        stream_url: str,
        callback: Callable[[bytes, int], None],
        duration: Optional[int] = None,
    ) -> None:
        """
        Continuously capture frames from stream.

        Args:
            stream_url: URL of the stream
            callback: Function to call with each frame (bytes, frame_number)
            duration: Optional duration in seconds (None = indefinite)
        """
        self._running = True
        frame_count = 0
        interval = 1.0 / self.config.fps

        start_time = asyncio.get_event_loop().time()

        while self._running:
            # Check duration limit
            if duration:
                elapsed = asyncio.get_event_loop().time() - start_time
                if elapsed >= duration:
                    break

            # Capture frame
            frame = await self.capture_single_frame(stream_url)
            if frame:
                frame_count += 1
                try:
                    await callback(frame, frame_count)
                except Exception as e:
                    print(f"Frame callback error: {e}")

            # Wait for next frame
            await asyncio.sleep(interval)

    def stop(self) -> None:
        """Stop continuous frame capture."""
        self._running = False

    async def extract_thumbnail(
        self,
        stream_url: str,
        width: int = 640,
        height: int = 360,
    ) -> Optional[bytes]:
        """Extract a thumbnail from the stream."""
        original_res = self.config.resolution
        self.config.resolution = f"{width}x{height}"

        try:
            return await self.capture_single_frame(stream_url)
        finally:
            self.config.resolution = original_res


class FrameBuffer:
    """
    Buffer for storing recent frames for change detection.
    """

    def __init__(self, max_size: int = 10):
        self.max_size = max_size
        self._frames: list = []

    def add(self, frame: bytes) -> None:
        """Add frame to buffer."""
        self._frames.append(frame)
        if len(self._frames) > self.max_size:
            self._frames.pop(0)

    def get_latest(self) -> Optional[bytes]:
        """Get most recent frame."""
        return self._frames[-1] if self._frames else None

    def get_previous(self) -> Optional[bytes]:
        """Get second most recent frame."""
        return self._frames[-2] if len(self._frames) >= 2 else None

    def clear(self) -> None:
        """Clear buffer."""
        self._frames.clear()


def calculate_frame_diff(
    frame1: bytes,
    frame2: bytes,
    threshold: float = 0.05,
) -> tuple[bool, float]:
    """
    Calculate difference between two frames.

    Returns:
        Tuple of (has_significant_change, diff_percentage)
    """
    try:
        # Simple byte-level comparison
        # For production, use PIL/OpenCV for proper image comparison
        if len(frame1) != len(frame2):
            return True, 1.0

        diff_bytes = sum(1 for a, b in zip(frame1, frame2) if a != b)
        diff_percentage = diff_bytes / len(frame1)

        return diff_percentage > threshold, diff_percentage

    except Exception:
        return True, 0.0


# Global stream capture instance
stream_capture = StreamCapture()

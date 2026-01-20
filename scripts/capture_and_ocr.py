#!/usr/bin/env python3
"""
Capture frame from live Kick stream and run OCR
"""

import sys
import os
import subprocess
import tempfile

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

import cloudscraper
import numpy as np
from PIL import Image
import imageio_ffmpeg


def get_stream_url(username: str) -> tuple:
    """Get stream info from Kick."""
    print(f"Getting stream info for {username}...")

    scraper = cloudscraper.create_scraper()
    resp = scraper.get(f"https://kick.com/api/v2/channels/{username}")

    if resp.status_code != 200:
        raise Exception(f"Failed to get channel: {resp.status_code}")

    data = resp.json()

    if not data.get("livestream"):
        raise Exception(f"{username} is not currently live")

    playback_url = data.get("playback_url")
    if not playback_url:
        raise Exception("No playback URL found")

    viewers = data.get("livestream", {}).get("viewer_count", 0)
    title = data.get("livestream", {}).get("session_title", "N/A")

    return playback_url, viewers, title


def capture_frame(stream_url: str, output_path: str) -> bool:
    """Capture a single frame from HLS stream using ffmpeg."""

    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

    cmd = [
        ffmpeg_path,
        "-y",                    # Overwrite output
        "-i", stream_url,        # Input stream
        "-frames:v", "1",        # Capture 1 frame
        "-q:v", "2",             # High quality
        output_path,
    ]

    print("Capturing frame with ffmpeg...")
    print(f"  Command: ffmpeg -i [stream] -frames:v 1 {output_path}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=30,
        )

        if result.returncode == 0 and os.path.exists(output_path):
            size = os.path.getsize(output_path)
            print(f"  Captured: {output_path} ({size:,} bytes)")
            return True
        else:
            print(f"  FFmpeg error: {result.stderr.decode()[:200]}")
            return False

    except subprocess.TimeoutExpired:
        print("  Frame capture timed out")
        return False
    except Exception as e:
        print(f"  Error: {e}")
        return False


def run_ocr(image_path: str):
    """Run OCR on captured frame."""

    print("\nRunning OCR...")

    # Load image
    image = Image.open(image_path)
    frame = np.array(image)

    print(f"  Image size: {image.size}")
    print(f"  Frame shape: {frame.shape}")

    # Initialize OCR
    from ocr.engine.ocr_engine import OCREngine

    engine = OCREngine()
    results = engine.process_image(frame)

    print(f"\n  Found {len(results)} text regions:")
    print("  " + "-" * 50)

    # Show all detected text
    for i, r in enumerate(results[:30], 1):
        text = r.raw_text[:40] if len(r.raw_text) > 40 else r.raw_text
        text = text.encode('ascii', 'ignore').decode()
        print(f"  {i:2}. [{r.confidence:.2f}] {text}")

    if len(results) > 30:
        print(f"      ... and {len(results) - 30} more")

    # Look for gaming values (numbers)
    print("\n  " + "=" * 50)
    print("  POTENTIAL GAMING VALUES:")
    print("  " + "-" * 50)

    import re
    values_found = []

    for r in results:
        # Look for number patterns
        numbers = re.findall(r'[\d,]+\.?\d*', r.raw_text)
        for num in numbers:
            try:
                clean = num.replace(',', '')
                value = float(clean)
                if value > 0:
                    values_found.append((value, r.confidence, r.raw_text[:30]))
            except:
                pass

    # Sort by value descending
    values_found.sort(key=lambda x: x[0], reverse=True)

    for value, conf, raw in values_found[:15]:
        print(f"    ${value:>12,.2f}  (conf: {conf:.2f})")

    return results


def main():
    print("=" * 60)
    print("SLOTFEED - Live Stream OCR Test")
    print("=" * 60)

    # Get streamer from args or use default
    username = sys.argv[1] if len(sys.argv) > 1 else "roshtein"

    print(f"\nTarget: {username}")

    # Get stream URL
    try:
        stream_url, viewers, title = get_stream_url(username)
        title = title.encode('ascii', 'ignore').decode()[:50]
        print(f"  Status: LIVE with {viewers:,} viewers")
        print(f"  Title: {title}")
        print(f"  Stream URL obtained ({len(stream_url)} chars)")
    except Exception as e:
        print(f"  Error: {e}")
        return

    # Create output path
    output_path = os.path.join(project_root, f"frame_{username}.jpg")

    # Capture frame
    print()
    success = capture_frame(stream_url, output_path)

    if success:
        # Run OCR
        results = run_ocr(output_path)

        print("\n" + "=" * 60)
        print("TEST COMPLETE")
        print("=" * 60)
        print(f"Frame saved: {output_path}")
        print(f"OCR results: {len(results)} text regions detected")
        print()
        print("Next steps:")
        print("  1. Open the frame image to see what was captured")
        print("  2. Compare OCR results with visible text")
        print("  3. Create game-specific templates for better accuracy")
    else:
        print("\nFailed to capture frame from stream.")
        print("The stream might have DRM protection or other restrictions.")


if __name__ == "__main__":
    main()

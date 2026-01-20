#!/usr/bin/env python3
"""
Test OCR Pipeline with Live Stream
Captures a frame from a live Kick stream and runs OCR on it.
"""

import sys
import os
import tempfile
import time

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import cloudscraper
import numpy as np
from PIL import Image
import requests
import io


def get_stream_info(username: str) -> dict:
    """Get stream info for a Kick channel."""
    scraper = cloudscraper.create_scraper()
    resp = scraper.get(f"https://kick.com/api/v2/channels/{username}")

    if resp.status_code != 200:
        raise Exception(f"Failed to get channel: {resp.status_code}")

    data = resp.json()

    if not data.get("livestream"):
        raise Exception(f"{username} is not currently live")

    return data


def capture_thumbnail(stream_info: dict) -> Image.Image:
    """Capture thumbnail from stream."""
    # Get thumbnail URL from multiple sources
    livestream = stream_info.get("livestream", {})
    thumbnail = livestream.get("thumbnail", {})

    thumbnail_urls = []

    if isinstance(thumbnail, dict):
        if thumbnail.get("url"):
            thumbnail_urls.append(thumbnail["url"])
        if thumbnail.get("src"):
            thumbnail_urls.append(thumbnail["src"])
        if thumbnail.get("srcset"):
            # Parse srcset for URLs
            for part in thumbnail["srcset"].split(","):
                url = part.strip().split(" ")[0]
                if url:
                    thumbnail_urls.append(url)
    elif isinstance(thumbnail, str):
        thumbnail_urls.append(thumbnail)

    if not thumbnail_urls:
        raise Exception("No thumbnail URL found")

    # Try each URL with cloudscraper
    scraper = cloudscraper.create_scraper()

    for thumb_url in thumbnail_urls[:3]:  # Try up to 3 URLs
        print(f"Fetching thumbnail: {thumb_url[:70]}...")
        try:
            resp = scraper.get(thumb_url, timeout=10)
            if resp.status_code == 200 and len(resp.content) > 1000:
                image = Image.open(io.BytesIO(resp.content))
                return image
        except Exception as e:
            print(f"  Failed: {e}")
            continue

    raise Exception("All thumbnail URLs failed")




def test_ocr_on_image(image: Image.Image):
    """Run OCR on PIL Image."""
    print(f"\nImage size: {image.size}")

    # Convert to numpy array
    frame = np.array(image)
    print(f"Frame shape: {frame.shape}")

    # Test with OCR engine
    try:
        from ocr.engine.ocr_engine import OCREngine

        print("\nInitializing OCR engine...")
        engine = OCREngine()

        print("Running OCR on frame...")
        results = engine.process_image(frame)

        print(f"\nFound {len(results)} text regions:")
        print("-" * 60)

        for i, result in enumerate(results[:20], 1):  # Show first 20
            text = result.text[:50] if len(result.text) > 50 else result.text
            text = text.encode('ascii', 'ignore').decode()
            print(f"{i:2}. [{result.confidence:.2f}] {text}")

        if len(results) > 20:
            print(f"    ... and {len(results) - 20} more")

        # Look for numbers that could be balance/bet/win
        print("\n" + "=" * 60)
        print("POTENTIAL GAMING VALUES:")
        print("-" * 60)

        for result in results:
            # Check if it looks like a money value
            text = result.text
            if any(c.isdigit() for c in text):
                # Clean and check
                try:
                    import re
                    # Look for number patterns
                    numbers = re.findall(r'[\d,.]+', text)
                    for num in numbers:
                        clean = num.replace(',', '')
                        try:
                            value = float(clean)
                            if value > 0:
                                print(f"  Value: {value:>12,.2f}  (conf: {result.confidence:.2f})")
                        except:
                            pass
                except:
                    pass

        return results

    except Exception as e:
        print(f"OCR Error: {e}")
        import traceback
        traceback.print_exc()
        return []


def main():
    """Main entry point."""
    print("=" * 60)
    print("SLOTFEED - Live OCR Test")
    print("=" * 60)

    # Get live streamer
    username = "roshtein"  # Default to Roshtein

    if len(sys.argv) > 1:
        username = sys.argv[1]

    print(f"\nTarget streamer: {username}")

    # Get stream info
    print("Getting stream info...")
    try:
        stream_info = get_stream_info(username)
        title = stream_info.get('livestream', {}).get('session_title', 'N/A')[:50]
        title = title.encode('ascii', 'ignore').decode()
        print(f"Stream title: {title}")
        print(f"Viewers: {stream_info.get('livestream', {}).get('viewer_count', 0):,}")
    except Exception as e:
        print(f"Error: {e}")
        return

    # Capture thumbnail
    print("\nCapturing thumbnail...")
    try:
        image = capture_thumbnail(stream_info)
        print(f"Thumbnail captured: {image.size}")

        # Save to file
        frame_path = os.path.join(project_root, "test_frame.jpg")
        image.save(frame_path, "JPEG", quality=95)
        print(f"Saved to: {frame_path}")

        # Run OCR
        results = test_ocr_on_image(image)

        print("\n" + "=" * 60)
        print("TEST COMPLETE")
        print("=" * 60)
        print(f"Frame saved to: {frame_path}")
        print(f"Total OCR results: {len(results)}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

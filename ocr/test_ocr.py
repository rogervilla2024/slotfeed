#!/usr/bin/env python3
"""Test the improved OCR on existing frames."""

import os
import sys

os.environ['DISABLE_MODEL_SOURCE_CHECK'] = 'True'

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from ocr.stream_ocr import StreamOCR

# Test frames
frames = [
    'data/frames/roshtein_20260104_231534.jpg',
    'data/frames/maherco_20260104_231520.jpg',
    'data/frames/classybeef_20260104_231505.jpg',
]

ocr = StreamOCR()

for frame in frames:
    if os.path.exists(frame):
        streamer = frame.split('/')[-1].split('_')[0]
        print(f'\n{"="*50}')
        print(f'Testing: {streamer}')
        print("="*50)

        result = ocr.process_frame(frame)

        extracted = result.get('extracted', {})
        balance = extracted.get('balance')
        bet = extracted.get('bet')
        win = extracted.get('win')

        if balance:
            print(f'Balance: ${balance:,.2f}')
        else:
            print('Balance: Not detected')

        if bet:
            print(f'Bet: ${bet:,.2f}')
        if win:
            print(f'Win: ${win:,.2f}')

        print(f'Numbers found: {result.get("numbers_found", [])[:5]}')
    else:
        print(f'Frame not found: {frame}')

print('\n' + '='*50)
print('Test complete!')

#!/usr/bin/env python3
"""Analyze multi-stream capture data."""

import sqlite3
from pathlib import Path

def main():
    db_path = Path(__file__).parent.parent / "data" / "multi_captures" / "multi_stream_events.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("=" * 70)
    print("MULTI-STREAM CAPTURE RESULTS")
    print("=" * 70)

    cursor.execute("SELECT COUNT(*) FROM stream_events")
    print(f"Total events: {cursor.fetchone()[0]}")

    print()
    print("Per-Streamer Stats:")
    print("-" * 70)

    cursor.execute("""
        SELECT streamer,
               COUNT(*) as frames,
               MIN(balance) as min_bal,
               MAX(balance) as max_bal,
               MAX(multiplier) as max_mult
        FROM stream_events
        GROUP BY streamer
    """)

    for row in cursor.fetchall():
        streamer, frames, min_bal, max_bal, max_mult = row
        min_str = f"${min_bal:,.0f}" if min_bal else "N/A"
        max_str = f"${max_bal:,.0f}" if max_bal else "N/A"
        mult_str = f"{max_mult:,.0f}x" if max_mult else "N/A"
        print(f"  {streamer:15} | {frames} frames | Balance: {min_str} - {max_str} | Max Mult: {mult_str}")

    print()
    print("All Events:")
    print("-" * 70)

    cursor.execute("SELECT timestamp, streamer, balance, multiplier FROM stream_events ORDER BY id")
    for row in cursor.fetchall():
        ts, streamer, bal, mult = row
        ts_short = ts.split("T")[1][:8] if "T" in str(ts) else ts
        bal_str = f"${bal:>12,.0f}" if bal else "           N/A"
        mult_str = f"{mult:>8,.0f}x" if mult else "      N/A"
        print(f"{ts_short} | {streamer:15} | {bal_str} | {mult_str}")

    conn.close()


if __name__ == "__main__":
    main()

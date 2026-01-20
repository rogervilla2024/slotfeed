#!/usr/bin/env python3
"""Analyze captured monitoring data."""

import sqlite3
import json
from pathlib import Path

def main():
    db_path = Path(__file__).parent.parent / "data" / "captures" / "roshtein" / "balance_events.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("=" * 70)
    print("ROSHTEIN 30-MINUTE MONITORING REPORT")
    print("=" * 70)

    # Get all events
    cursor.execute("SELECT * FROM balance_events ORDER BY id")
    events = cursor.fetchall()
    print(f"Total frames captured: {len(events)}")

    # Get balance range
    balances = [e[3] for e in events if e[3]]
    if balances:
        print(f"Balance range: ${min(balances):,.2f} - ${max(balances):,.2f}")

    # Get multipliers
    mults = [e[6] for e in events if e[6]]
    if mults:
        print(f"Max multiplier: {max(mults):,.0f}x")

    # Get wins
    wins = [e[5] for e in events if e[5] and e[5] > 1000]
    if wins:
        print(f"Max win detected: ${max(wins):,.2f}")

    print()
    print("=" * 70)
    print("BIG WINS DETECTED (>$100K):")
    print("-" * 70)

    for e in events:
        ts, bal, bet, win, mult = e[1], e[3], e[4], e[5], e[6]
        if win and win > 100000:
            ts_short = ts.split("T")[1][:8]
            bet_str = f"${bet:.0f}" if bet else "N/A"
            mult_str = f"{win/bet:,.0f}x" if bet and bet > 0 else "N/A"
            print(f"{ts_short} | Win: ${win:>12,.0f} | Bet: {bet_str:>6} | Mult: {mult_str}")

    print()
    print("=" * 70)
    print("BALANCE CHANGES TIMELINE (>$10K changes):")
    print("-" * 70)

    prev_bal = None
    for e in events:
        ts, bal = e[1], e[3]
        if bal:
            if prev_bal:
                change = bal - prev_bal
                if abs(change) > 10000:
                    ts_short = ts.split("T")[1][:8]
                    sign = "+" if change > 0 else ""
                    print(f"{ts_short} | Balance: ${bal:>12,.2f} | Change: {sign}${change:,.0f}")
            prev_bal = bal

    print()
    print("=" * 70)
    print("ALL DETECTED MULTIPLIERS (>1000x):")
    print("-" * 70)

    big_mults = set()
    for e in events:
        raw_values = json.loads(e[7]) if e[7] else {}
        for m in raw_values.get("multipliers", []):
            if m["value"] > 1000:
                big_mults.add((m["value"], m["raw"]))

    for val, raw in sorted(big_mults, reverse=True):
        print(f"  {raw:>12} ({val:,.0f}x)")

    print()
    print("=" * 70)
    print("SAMPLE RAW OCR DATA (First 3 frames):")
    print("-" * 70)

    for e in events[:3]:
        ts = e[1].split("T")[1][:8]
        raw = json.loads(e[7]) if e[7] else {}
        print(f"\n[{ts}]")
        print("  Currencies:", [c["raw"] for c in raw.get("currencies", [])[:5]])
        print("  Multipliers:", [m["raw"] for m in raw.get("multipliers", [])[:3]])

    conn.close()


if __name__ == "__main__":
    main()

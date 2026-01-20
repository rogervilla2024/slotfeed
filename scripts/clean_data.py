#!/usr/bin/env python3
"""
Clean corrupted balance history data by removing outliers.
"""

import os
import json

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BALANCE_HISTORY_FILE = os.path.join(project_root, "data", "balance_history.json")
SESSIONS_FILE = os.path.join(project_root, "data", "sessions.json")

MAX_VALID_BALANCE = 2_000_000  # $2M max (covers jackpots)
MAX_VALID_CHANGE = 500_000    # $500k max change (jackpots can be big)


def clean_balance_history():
    """Remove outlier balance entries."""
    with open(BALANCE_HISTORY_FILE, 'r', encoding='utf-8') as f:
        history = json.load(f)

    for username, data in history.items():
        print(f"\nCleaning {username}...")

        # Clean balance history entries
        original_count = len(data.get("balance_history", []))
        cleaned_history = []

        for entry in data.get("balance_history", []):
            balance = entry.get("balance", 0)
            change = abs(entry.get("change", 0))

            # Filter out invalid entries
            if balance > MAX_VALID_BALANCE:
                print(f"  Removed (balance): ${balance:,.2f} at {entry.get('timestamp')}")
            elif change > MAX_VALID_CHANGE:
                print(f"  Removed (change): ${change:,.2f} change at {entry.get('timestamp')}")
            else:
                cleaned_history.append(entry)

        data["balance_history"] = cleaned_history
        print(f"  Kept {len(cleaned_history)}/{original_count} entries")

        # Recalculate peak and lowest from cleaned data
        if cleaned_history:
            valid_balances = [e["balance"] for e in cleaned_history]
            data["peak_balance"] = max(valid_balances)
            data["lowest_balance"] = min(valid_balances)
            data["current_balance"] = cleaned_history[-1]["balance"]
            print(f"  New peak: ${data['peak_balance']:,.2f}")
            print(f"  New lowest: ${data['lowest_balance']:,.2f}")
            print(f"  Current: ${data['current_balance']:,.2f}")

    # Save cleaned data
    with open(BALANCE_HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=2, default=str)

    print("\nBalance history cleaned!")
    return history


def clean_sessions():
    """Clean session data using balance history as source of truth."""
    # Load cleaned balance history
    with open(BALANCE_HISTORY_FILE, 'r', encoding='utf-8') as f:
        history = json.load(f)

    with open(SESSIONS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for session in data.get("sessions", []):
        streamer = session.get("streamerId")
        print(f"\nCleaning session for {streamer}...")

        # Get data from cleaned balance history
        streamer_history = history.get(streamer, {})

        if streamer_history:
            # Use values from cleaned balance history
            session["endBalance"] = streamer_history.get("current_balance", 0)
            session["peakBalance"] = streamer_history.get("peak_balance", 0)
            session["lowestBalance"] = streamer_history.get("lowest_balance", 0)
            session["profitLoss"] = session["endBalance"] - session.get("startBalance", 0)

            # Reset wagered/won since we can't trust the old values
            session["totalWagered"] = 0
            session["totalWon"] = 0

            print(f"  End Balance: ${session['endBalance']:,.2f}")
            print(f"  Peak: ${session['peakBalance']:,.2f}")
            print(f"  Lowest: ${session['lowestBalance']:,.2f}")
            print(f"  P/L: ${session['profitLoss']:,.2f}")

    with open(SESSIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print("\nSessions cleaned!")


if __name__ == "__main__":
    print("=" * 50)
    print("SLOTFEED Data Cleaner")
    print("=" * 50)

    clean_balance_history()
    clean_sessions()

    print("\nDone!")

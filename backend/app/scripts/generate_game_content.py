"""
AI Content Generation Script for Slot Games

This script generates educational and SEO content for slot games using Claude API.
It creates 6 sections of content per game (300-500 words total):
1. Overview (50-75 words)
2. RTP Explanation (75-100 words)
3. Volatility Analysis (75-100 words)
4. Bonus Features (100-125 words)
5. Strategies (75-100 words)
6. Streamer Insights (25-50 words)

Plus SEO metadata (meta_description, focus_keywords)
"""

import os
import json
from typing import Optional
import anthropic

# Game data - can be extended or loaded from database
SLOT_GAMES = [
    {
        "name": "Sweet Bonanza",
        "slug": "sweet-bonanza",
        "provider": "Pragmatic Play",
        "rtp": 96.48,
        "volatility": "high",
        "features": ["Tumble", "Free Spins", "Bonus Buy"],
    },
    {
        "name": "Gates of Olympus",
        "slug": "gates-of-olympus",
        "provider": "Pragmatic Play",
        "rtp": 96.50,
        "volatility": "very_high",
        "features": ["Multiplier", "Free Spins", "Bonus Buy"],
    },
    {
        "name": "Sugar Rush",
        "slug": "sugar-rush",
        "provider": "Pragmatic Play",
        "rtp": 96.50,
        "volatility": "medium",
        "features": ["Free Spins", "Bonus Buy"],
    },
    {
        "name": "Big Bass Bonanza",
        "slug": "big-bass-bonanza",
        "provider": "Pragmatic Play",
        "rtp": 96.71,
        "volatility": "high",
        "features": ["Free Spins", "Bonus Buy", "Expanding Symbols"],
    },
    {
        "name": "Book of Dead",
        "slug": "book-of-dead",
        "provider": "Play'n GO",
        "rtp": 96.21,
        "volatility": "high",
        "features": ["Free Spins", "Expanding Symbol", "Bonus Scatter"],
    },
]


def generate_game_content(game: dict) -> dict:
    """Generate content for a single slot game using Claude API"""

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""
You are an expert slot game analyst and writer. Generate educational and SEO-optimized content for this slot game:

Game: {game['name']}
Provider: {game['provider']}
RTP: {game['rtp']}%
Volatility: {game['volatility']}
Features: {', '.join(game['features'])}

Please provide the following 6 sections of content in JSON format:

1. "overview" (50-75 words): A brief overview of the game
2. "rtp_explanation" (75-100 words): Explain what the RTP means and how it relates to this game
3. "volatility_analysis" (75-100 words): Explain the volatility and what players can expect
4. "bonus_features" (100-125 words): Detailed guide to the bonus features and how they work
5. "strategies" (75-100 words): Tips and strategies for playing this game optimally
6. "streamer_insights" (25-50 words): Common patterns observed from streamers playing this game

Also provide:
7. "meta_description" (160 char max): SEO-friendly meta description for the page
8. "focus_keywords": Array of 5-8 SEO keywords related to the game

Return ONLY valid JSON with no markdown formatting or code blocks:
{{
  "overview": "...",
  "rtp_explanation": "...",
  "volatility_analysis": "...",
  "bonus_features": "...",
  "strategies": "...",
  "streamer_insights": "...",
  "meta_description": "...",
  "focus_keywords": ["keyword1", "keyword2", ...]
}}
"""

    message = client.messages.create(
        model="claude-opus-4-5-20251101",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    # Parse the response
    response_text = message.content[0].text.strip()

    # Remove markdown code blocks if present
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    response_text = response_text.strip()

    content = json.loads(response_text)

    return content


def validate_content(content: dict) -> bool:
    """Validate generated content meets minimum requirements"""
    required_fields = [
        "overview",
        "rtp_explanation",
        "volatility_analysis",
        "bonus_features",
        "strategies",
        "streamer_insights",
        "meta_description",
        "focus_keywords",
    ]

    for field in required_fields:
        if field not in content:
            print(f"  ❌ Missing required field: {field}")
            return False

        if field == "focus_keywords":
            if not isinstance(content[field], list) or len(content[field]) < 3:
                print(f"  ❌ {field} must be a list with at least 3 items")
                return False
        elif isinstance(content[field], str):
            if len(content[field].strip()) < 20:
                print(f"  ❌ {field} is too short (min 20 chars)")
                return False

    return True


def generate_all_content(games: list = SLOT_GAMES) -> dict:
    """Generate content for all games and save to file"""

    all_content = {}

    for i, game in enumerate(games, 1):
        print(f"\n[{i}/{len(games)}] Generating content for {game['name']}...")

        try:
            content = generate_game_content(game)

            if validate_content(content):
                all_content[game["slug"]] = {
                    "game_name": game["name"],
                    "provider": game["provider"],
                    "rtp": game["rtp"],
                    **content,
                }
                print(f"  ✓ Content generated successfully")
            else:
                print(f"  ❌ Content validation failed")

        except json.JSONDecodeError as e:
            print(f"  ❌ Failed to parse JSON response: {e}")
        except Exception as e:
            print(f"  ❌ Error generating content: {e}")

    return all_content


def save_content_to_json(content: dict, filename: str = "generated_content.json"):
    """Save generated content to JSON file"""
    output_path = os.path.join(os.path.dirname(__file__), filename)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(content, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Content saved to {output_path}")


if __name__ == "__main__":
    print("🎰 SlotFeed - AI Content Generation Script")
    print("=" * 50)

    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        exit(1)

    print(f"Generating content for {len(SLOT_GAMES)} games...")

    # Generate all content
    all_content = generate_all_content()

    # Save to file
    if all_content:
        save_content_to_json(all_content)
        print(f"\n✓ Successfully generated content for {len(all_content)} games")
    else:
        print("\n❌ No content was generated")

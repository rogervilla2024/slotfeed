"""
Content Generator Service
Generates AI-powered educational content for slot games using Claude API
"""

import logging
from typing import Optional, List
from datetime import datetime
import anthropic
import asyncio

logger = logging.getLogger(__name__)


class ContentGeneratorService:
    """Service for generating educational game content using Claude API"""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize content generator with Claude API key"""
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-opus-4-5-20251101"

        # Content section word count targets
        self.section_targets = {
            "overview": (50, 75),
            "rtp_explanation": (75, 100),
            "volatility_analysis": (75, 100),
            "bonus_features": (100, 125),
            "strategies": (75, 100),
            "streamer_insights": (25, 50),
        }

    async def generate_game_content(
        self,
        game_name: str,
        game_id: str,
        rtp: float,
        volatility: str,
        provider: str,
        bonus_features: Optional[List[str]] = None,
        max_multiplier: Optional[float] = None,
    ) -> dict:
        """
        Generate complete educational content for a game.

        Args:
            game_name: Name of the game
            game_id: Unique game identifier
            rtp: Return to Player percentage
            volatility: Game volatility (low, medium, high, very high)
            provider: Game provider name
            bonus_features: List of bonus feature names
            max_multiplier: Maximum possible multiplier

        Returns:
            Dictionary with generated content sections and metadata
        """
        try:
            logger.info(f"Generating content for {game_name} (ID: {game_id})")

            # Generate all content sections in parallel
            tasks = [
                self._generate_overview(game_name, volatility, provider),
                self._generate_rtp_explanation(rtp),
                self._generate_volatility_analysis(volatility, game_name),
                self._generate_bonus_features(game_name, bonus_features or []),
                self._generate_strategies(game_name, volatility, rtp),
                self._generate_streamer_insights(game_name, rtp, max_multiplier),
            ]

            results = await asyncio.gather(*tasks)

            # Compile results
            content = {
                "game_id": game_id,
                "overview": results[0],
                "rtp_explanation": results[1],
                "volatility_analysis": results[2],
                "bonus_features": results[3],
                "strategies": results[4],
                "streamer_insights": results[5],
                "meta_description": self._generate_meta_description(game_name, rtp),
                "focus_keywords": self._generate_keywords(game_name, provider, volatility),
                "is_published": False,
                "generated_at": datetime.utcnow().isoformat(),
                "generator_model": self.model,
                "content_length": sum(len(s) for s in results if s),
                "readability_score": self._calculate_readability_score(results),
                "keyword_density": self._calculate_keyword_density(results),
            }

            logger.info(f"Successfully generated content for {game_name}")
            return content

        except Exception as e:
            logger.error(f"Error generating content for {game_name}: {str(e)}")
            raise

    async def _generate_overview(self, game_name: str, volatility: str, provider: str) -> str:
        """Generate game overview section (50-75 words)"""
        prompt = f"""Write a compelling 50-75 word overview for the {game_name} slot game by {provider}.

The game has {volatility} volatility. Focus on:
- What makes the game unique
- Visual theme and gameplay
- Target audience
- Quick appeal statement

Keep it engaging and informative for potential players."""

        return await self._call_claude(prompt)

    async def _generate_rtp_explanation(self, rtp: float) -> str:
        """Generate RTP explanation section (75-100 words)"""
        prompt = f"""Write a clear 75-100 word explanation of RTP (Return to Player) for a slot game with {rtp}% RTP.

Explain:
- What RTP means in simple terms
- What {rtp}% specifically means
- Long-term vs short-term variance
- How RTP compares to industry standards

Use player-friendly language."""

        return await self._call_claude(prompt)

    async def _generate_volatility_analysis(self, volatility: str, game_name: str) -> str:
        """Generate volatility analysis section (75-100 words)"""
        prompt = f"""Write a detailed 75-100 word analysis of {volatility} volatility for {game_name}.

Cover:
- What {volatility} volatility means
- Expected win frequency
- Typical win sizes
- Bankroll management implications
- Best suited player type

Provide practical insights."""

        return await self._call_claude(prompt)

    async def _generate_bonus_features(self, game_name: str, features: List[str]) -> str:
        """Generate bonus features guide (100-125 words)"""
        features_str = ", ".join(features) if features else "standard bonus features"

        prompt = f"""Write a comprehensive 100-125 word guide to the bonus features in {game_name}.

Features to explain: {features_str}

Include:
- How each feature is triggered
- What each feature does
- Potential payouts
- Frequency of occurrence
- Strategy tips for bonus hunting

Make it practical and actionable."""

        return await self._call_claude(prompt)

    async def _generate_strategies(self, game_name: str, volatility: str, rtp: float) -> str:
        """Generate winning strategies section (75-100 words)"""
        prompt = f"""Write 75-100 words of practical winning strategies for {game_name}.

Game details: {volatility} volatility, {rtp}% RTP

Cover:
- Optimal bet sizing strategy
- Session bankroll management
- When to hold vs sell feature buys
- Hot/cold slot considerations
- Realistic expectation-setting
- Responsible gambling guidelines

Focus on evidence-based strategies."""

        return await self._call_claude(prompt)

    async def _generate_streamer_insights(
        self, game_name: str, rtp: float, max_multiplier: Optional[float]
    ) -> str:
        """Generate streamer insights section (25-50 words)"""
        multiplier_str = f"with {max_multiplier}x max multiplier" if max_multiplier else ""

        prompt = f"""Write 25-50 words of streamer insights about {game_name} {multiplier_str} ({rtp}% RTP).

Include:
- Why streamers play this game
- Notable big wins on stream
- Entertainment value
- Streaming-friendly features

Keep it concise and engaging."""

        return await self._call_claude(prompt)

    def _generate_meta_description(self, game_name: str, rtp: float) -> str:
        """Generate SEO meta description (160 chars max)"""
        description = f"{game_name} slot review: {rtp}% RTP, strategy guide, bonus features, and streamer insights. Learn winning tips."
        return description[:160]

    def _generate_keywords(self, game_name: str, provider: str, volatility: str) -> List[str]:
        """Generate SEO focus keywords"""
        # Generate base keywords
        keywords = [
            game_name,
            f"{game_name} slot",
            f"{game_name} RTP",
            f"{game_name} strategy",
            f"{game_name} review",
            f"{provider} slots",
            f"{volatility} volatility slot",
            "slot strategy",
            "slot RTP",
            "online slots",
            f"play {game_name}",
        ]

        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for keyword in keywords:
            if keyword.lower() not in seen:
                unique_keywords.append(keyword)
                seen.add(keyword.lower())

        return unique_keywords[:15]  # Limit to 15 keywords

    def _calculate_readability_score(self, content_sections: List[str]) -> float:
        """
        Calculate Flesch Reading Ease score for all sections.
        Score of 60-70 is ideal for general audience.
        """
        try:
            from textstat import flesch_reading_ease

            combined_text = " ".join(s for s in content_sections if s)
            if not combined_text:
                return 0.0

            score = flesch_reading_ease(combined_text)
            # Clamp to 0-100 range
            return max(0.0, min(100.0, float(score)))

        except ImportError:
            # If textstat not available, return default score
            logger.warning("textstat library not available, using default readability score")
            return 65.0

    def _calculate_keyword_density(self, content_sections: List[str]) -> float:
        """Calculate keyword density (percentage of content that is keywords)"""
        try:
            combined_text = " ".join(s for s in content_sections if s)
            if not combined_text:
                return 0.0

            words = combined_text.lower().split()
            total_words = len(words)

            if total_words == 0:
                return 0.0

            # Count keyword occurrences (simplified - look for "slot", "game", "win")
            keyword_words = sum(
                1
                for word in words
                if any(kw in word for kw in ["slot", "game", "win", "bonus", "rtp"])
            )

            density = (keyword_words / total_words) * 100
            return round(density, 2)

        except Exception as e:
            logger.warning(f"Error calculating keyword density: {str(e)}")
            return 0.0

    async def _call_claude(self, prompt: str) -> str:
        """Call Claude API to generate content"""
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            content = message.content[0].text if message.content else ""
            return content.strip()

        except Exception as e:
            logger.error(f"Error calling Claude API: {str(e)}")
            raise

    def validate_content(self, content: dict) -> bool:
        """Validate generated content meets quality standards"""
        issues = []

        # Check that we have at least some content
        content_fields = [
            "overview",
            "rtp_explanation",
            "volatility_analysis",
            "bonus_features",
            "strategies",
        ]
        if not any(content.get(field) for field in content_fields):
            issues.append("No content generated")

        # Check word counts (rough validation)
        for field, (min_words, max_words) in self.section_targets.items():
            text = content.get(field, "")
            if text:
                word_count = len(text.split())
                if word_count < min_words - 5:  # Allow 5 word margin
                    issues.append(
                        f"{field} too short ({word_count} < {min_words} words)"
                    )
                elif word_count > max_words + 5:  # Allow 5 word margin
                    issues.append(
                        f"{field} too long ({word_count} > {max_words} words)"
                    )

        # Check meta description
        meta_desc = content.get("meta_description", "")
        if meta_desc and len(meta_desc) > 160:
            issues.append(f"Meta description too long ({len(meta_desc)} > 160 chars)")

        # Check keywords
        keywords = content.get("focus_keywords", [])
        if not keywords or len(keywords) < 5:
            issues.append(f"Insufficient keywords ({len(keywords)} < 5)")

        if issues:
            logger.warning(f"Content validation issues: {', '.join(issues)}")
            return False

        logger.info("Content validation passed")
        return True


# Global service instance
_service: Optional[ContentGeneratorService] = None


def get_content_generator() -> ContentGeneratorService:
    """Get or create content generator service instance"""
    global _service
    if _service is None:
        _service = ContentGeneratorService()
    return _service

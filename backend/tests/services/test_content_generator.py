"""
Tests for ContentGeneratorService
Tests AI-powered content generation for slot games
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.content_generator import ContentGeneratorService


@pytest.fixture
def content_generator():
    """Create a ContentGeneratorService instance for testing"""
    return ContentGeneratorService(api_key="test-key")


class TestContentGeneratorService:
    """Test suite for ContentGeneratorService"""

    @pytest.mark.asyncio
    async def test_init_creates_anthropic_client(self):
        """Test that __init__ properly creates Anthropic client"""
        service = ContentGeneratorService(api_key="test-key")
        assert service.client is not None
        assert service.model == "claude-opus-4-5-20251101"

    @pytest.mark.asyncio
    async def test_section_targets_configured(self, content_generator):
        """Test that content section word count targets are properly configured"""
        assert "overview" in content_generator.section_targets
        assert "rtp_explanation" in content_generator.section_targets
        assert "volatility_analysis" in content_generator.section_targets
        assert "bonus_features" in content_generator.section_targets
        assert "strategies" in content_generator.section_targets
        assert "streamer_insights" in content_generator.section_targets

        # Verify ranges
        overview_range = content_generator.section_targets["overview"]
        assert overview_range == (50, 75)

    @pytest.mark.asyncio
    async def test_generate_game_content_success(self, content_generator):
        """Test successful game content generation"""
        # Mock the _call_claude method
        mock_responses = [
            "Overview: Sweet Bonanza is a visually stunning slot...",
            "RTP Explanation: With 96.48% RTP...",
            "Volatility Analysis: High volatility means...",
            "Bonus Features: The game features...",
            "Strategies: For high volatility...",
            "Streamer Insights: Popular among streamers...",
        ]

        with patch.object(content_generator, "_call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = mock_responses

            result = await content_generator.generate_game_content(
                game_name="Sweet Bonanza",
                game_id="sweet-bonanza",
                rtp=96.48,
                volatility="high",
                provider="Pragmatic Play",
                bonus_features=["Free Spins", "Multiplier"],
                max_multiplier=21100,
            )

        assert result["game_id"] == "sweet-bonanza"
        assert result["overview"] == mock_responses[0]
        assert result["rtp_explanation"] == mock_responses[1]
        assert result["volatility_analysis"] == mock_responses[2]
        assert result["bonus_features"] == mock_responses[3]
        assert result["strategies"] == mock_responses[4]
        assert result["streamer_insights"] == mock_responses[5]
        assert result["is_published"] is False
        assert "meta_description" in result
        assert "focus_keywords" in result

    @pytest.mark.asyncio
    async def test_generate_meta_description(self, content_generator):
        """Test meta description generation"""
        meta = content_generator._generate_meta_description("Sweet Bonanza", 96.48)
        assert "Sweet Bonanza" in meta
        assert "96.48" in meta
        assert len(meta) <= 160

    @pytest.mark.asyncio
    async def test_generate_keywords(self, content_generator):
        """Test keyword generation"""
        keywords = content_generator._generate_keywords("Sweet Bonanza", "Pragmatic Play", "high")

        assert "Sweet Bonanza" in keywords
        assert len(keywords) <= 15
        assert "high volatility slot" in keywords
        assert "slot strategy" in keywords

    @pytest.mark.asyncio
    async def test_generate_keywords_deduplication(self, content_generator):
        """Test that keywords are deduplicated"""
        keywords = content_generator._generate_keywords("sweet bonanza", "pragmatic play", "high")

        # Check for case-insensitive duplicates
        lowercase_keywords = [k.lower() for k in keywords]
        assert len(lowercase_keywords) == len(set(lowercase_keywords))

    def test_calculate_readability_score(self, content_generator):
        """Test readability score calculation"""
        sections = [
            "This is a simple test sentence.",
            "Another test sentence for readability.",
            "The quick brown fox jumps over the lazy dog.",
        ]

        score = content_generator._calculate_readability_score(sections)
        assert isinstance(score, float)
        assert 0 <= score <= 100

    def test_calculate_readability_score_empty(self, content_generator):
        """Test readability score with empty content"""
        score = content_generator._calculate_readability_score([""])
        assert score == 0.0

    def test_calculate_keyword_density(self, content_generator):
        """Test keyword density calculation"""
        sections = [
            "This slot game is a great game with many winning slots",
            "The bonus features in this game are fantastic",
            "Play slots for fun and win big rewards",
        ]

        density = content_generator._calculate_keyword_density(sections)
        assert isinstance(density, float)
        assert density >= 0

    def test_validate_content_valid(self, content_generator):
        """Test content validation with valid content"""
        content = {
            "overview": "A" * 50,
            "rtp_explanation": "B" * 75,
            "volatility_analysis": "C" * 75,
            "bonus_features": "D" * 100,
            "strategies": "E" * 75,
            "meta_description": "Test description" * 10,
            "focus_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
        }

        result = content_generator.validate_content(content)
        assert result is True

    def test_validate_content_missing_sections(self, content_generator):
        """Test validation fails with missing content sections"""
        content = {
            "overview": None,
            "rtp_explanation": None,
            "volatility_analysis": None,
            "bonus_features": None,
            "strategies": None,
        }

        result = content_generator.validate_content(content)
        assert result is False

    def test_validate_content_short_section(self, content_generator):
        """Test validation fails with too-short content"""
        content = {
            "overview": "Too short",  # Less than 50 words
            "rtp_explanation": "B" * 75,
            "volatility_analysis": "C" * 75,
            "bonus_features": "D" * 100,
            "strategies": "E" * 75,
            "meta_description": "Test",
            "focus_keywords": ["k1", "k2", "k3", "k4", "k5"],
        }

        result = content_generator.validate_content(content)
        assert result is False

    def test_validate_content_meta_description_too_long(self, content_generator):
        """Test validation fails with meta description > 160 chars"""
        content = {
            "overview": "A" * 50,
            "rtp_explanation": "B" * 75,
            "volatility_analysis": "C" * 75,
            "bonus_features": "D" * 100,
            "strategies": "E" * 75,
            "meta_description": "X" * 161,  # Over 160 chars
            "focus_keywords": ["k1", "k2", "k3", "k4", "k5"],
        }

        result = content_generator.validate_content(content)
        assert result is False

    def test_validate_content_insufficient_keywords(self, content_generator):
        """Test validation fails with fewer than 5 keywords"""
        content = {
            "overview": "A" * 50,
            "rtp_explanation": "B" * 75,
            "volatility_analysis": "C" * 75,
            "bonus_features": "D" * 100,
            "strategies": "E" * 75,
            "meta_description": "Test",
            "focus_keywords": ["k1", "k2"],  # Only 2 keywords
        }

        result = content_generator.validate_content(content)
        assert result is False

    @pytest.mark.asyncio
    async def test_generate_overview(self, content_generator):
        """Test overview generation"""
        with patch.object(content_generator, "_call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "Sweet Bonanza is a visually stunning slot..."

            result = await content_generator._generate_overview("Sweet Bonanza", "high", "Pragmatic")

        assert isinstance(result, str)
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_generate_rtp_explanation(self, content_generator):
        """Test RTP explanation generation"""
        with patch.object(content_generator, "_call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "RTP stands for Return to Player..."

            result = await content_generator._generate_rtp_explanation(96.48)

        assert isinstance(result, str)
        assert "96.48" in mock_call.call_args[0][0]

    @pytest.mark.asyncio
    async def test_generate_volatility_analysis(self, content_generator):
        """Test volatility analysis generation"""
        with patch.object(content_generator, "_call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "High volatility means..."

            result = await content_generator._generate_volatility_analysis("high", "Sweet Bonanza")

        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_generate_bonus_features(self, content_generator):
        """Test bonus features generation"""
        with patch.object(content_generator, "_call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "The game features free spins..."

            result = await content_generator._generate_bonus_features(
                "Sweet Bonanza",
                ["Free Spins", "Multiplier"]
            )

        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_generate_strategies(self, content_generator):
        """Test strategies generation"""
        with patch.object(content_generator, "_call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "For high volatility slots..."

            result = await content_generator._generate_strategies("Sweet Bonanza", "high", 96.48)

        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_generate_streamer_insights(self, content_generator):
        """Test streamer insights generation"""
        with patch.object(content_generator, "_call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "Streamers love this game..."

            result = await content_generator._generate_streamer_insights("Sweet Bonanza", 96.48, 21100)

        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_call_claude_success(self, content_generator):
        """Test successful Claude API call"""
        with patch.object(content_generator.client.messages, "create") as mock_create:
            mock_message = MagicMock()
            mock_message.content = [MagicMock(text="Generated content")]
            mock_create.return_value = mock_message

            result = await content_generator._call_claude("Test prompt")

        assert result == "Generated content"

    @pytest.mark.asyncio
    async def test_call_claude_empty_response(self, content_generator):
        """Test Claude API call with empty response"""
        with patch.object(content_generator.client.messages, "create") as mock_create:
            mock_message = MagicMock()
            mock_message.content = []
            mock_create.return_value = mock_message

            result = await content_generator._call_claude("Test prompt")

        assert result == ""

"""Database seed data modules."""

from .tier1_streamers import (
    TIER1_STREAMERS,
    get_tier1_streamers,
    get_streamer_by_username as get_tier1_streamer_by_username,
    seed_streamers as seed_tier1_streamers,
)

from .tier2_streamers import (
    TIER2_STREAMERS,
    get_tier2_streamers,
    get_streamer_by_username as get_tier2_streamer_by_username,
    get_streamers_by_region,
    get_streamers_by_language,
    seed_tier2_streamers,
)

from .top_games import (
    PROVIDERS,
    TOP_GAMES,
    get_providers,
    get_top_games,
    get_game_by_slug,
    get_games_by_provider,
    seed_providers,
    seed_games,
)


def get_all_streamers():
    """Get all streamers (Tier 1 + Tier 2)."""
    return TIER1_STREAMERS + TIER2_STREAMERS


def get_streamer_by_username(username: str):
    """Find a streamer by username across all tiers."""
    result = get_tier1_streamer_by_username(username)
    if result:
        return result
    return get_tier2_streamer_by_username(username)


__all__ = [
    # Tier 1 Streamers
    "TIER1_STREAMERS",
    "get_tier1_streamers",
    "seed_tier1_streamers",
    # Tier 2 Streamers
    "TIER2_STREAMERS",
    "get_tier2_streamers",
    "get_streamers_by_region",
    "get_streamers_by_language",
    "seed_tier2_streamers",
    # All Streamers
    "get_all_streamers",
    "get_streamer_by_username",
    # Games
    "PROVIDERS",
    "TOP_GAMES",
    "get_providers",
    "get_top_games",
    "get_game_by_slug",
    "get_games_by_provider",
    "seed_providers",
    "seed_games",
]

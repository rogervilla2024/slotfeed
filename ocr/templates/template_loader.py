"""
Template Loader for SLOTFEED OCR Pipeline
Loads and manages game-specific ROI templates for OCR processing.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass


@dataclass
class Region:
    """Represents a screen region for OCR."""
    x: int
    y: int
    width: int
    height: int
    expected_format: str
    description: str = ""
    trigger_condition: Optional[str] = None

    @property
    def bbox(self) -> Tuple[int, int, int, int]:
        """Return bounding box as (x1, y1, x2, y2)."""
        return (self.x, self.y, self.x + self.width, self.y + self.height)

    def scale(self, scale_x: float, scale_y: float) -> 'Region':
        """Scale region to different resolution."""
        return Region(
            x=int(self.x * scale_x),
            y=int(self.y * scale_y),
            width=int(self.width * scale_x),
            height=int(self.height * scale_y),
            expected_format=self.expected_format,
            description=self.description,
            trigger_condition=self.trigger_condition,
        )


@dataclass
class GameTemplate:
    """Represents a game-specific OCR template."""
    game_id: str
    game_name: str
    provider: str
    resolution: Tuple[int, int]
    regions: Dict[str, Region]
    preprocessing: Dict[str, Any]
    validation: Dict[str, Any]
    game_states: Dict[str, Any]
    raw_data: Dict[str, Any]

    def get_regions_for_state(self, state: str = "idle") -> Dict[str, Region]:
        """Get active regions for a specific game state."""
        if state not in self.game_states:
            state = "idle"

        state_config = self.game_states.get(state, {})
        active_region_names = state_config.get("active_regions", list(self.regions.keys()))

        return {
            name: region
            for name, region in self.regions.items()
            if name in active_region_names
        }

    def get_scaled_regions(
        self,
        target_width: int,
        target_height: int,
        state: str = "idle"
    ) -> Dict[str, Region]:
        """Get regions scaled to target resolution."""
        scale_x = target_width / self.resolution[0]
        scale_y = target_height / self.resolution[1]

        regions = self.get_regions_for_state(state)
        return {
            name: region.scale(scale_x, scale_y)
            for name, region in regions.items()
        }


class TemplateLoader:
    """Loads and manages game templates."""

    def __init__(self, templates_dir: Optional[Path] = None):
        self.templates_dir = templates_dir or Path(__file__).parent
        self._cache: Dict[str, GameTemplate] = {}
        self._game_name_map: Dict[str, str] = {}
        self._load_all_templates()

    def _load_all_templates(self):
        """Load all template files into cache."""
        for template_file in self.templates_dir.glob("*.json"):
            if template_file.name in ["template_loader.py"]:
                continue

            try:
                template = self._load_template_file(template_file)
                if template:
                    self._cache[template.game_id] = template
                    # Map game names to IDs for lookup
                    self._game_name_map[template.game_name.lower()] = template.game_id
            except Exception as e:
                print(f"Warning: Failed to load {template_file}: {e}")

    def _load_template_file(self, path: Path) -> Optional[GameTemplate]:
        """Load a single template file."""
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if "game_id" not in data:
            return None

        # Parse regions
        regions = {}
        for name, region_data in data.get("regions", {}).items():
            regions[name] = Region(
                x=region_data.get("x", 0),
                y=region_data.get("y", 0),
                width=region_data.get("width", 100),
                height=region_data.get("height", 50),
                expected_format=region_data.get("expected_format", "text"),
                description=region_data.get("description", ""),
                trigger_condition=region_data.get("trigger_condition"),
            )

        # Parse resolution
        res = data.get("resolution", {"width": 1280, "height": 720})
        resolution = (res.get("width", 1280), res.get("height", 720))

        return GameTemplate(
            game_id=data["game_id"],
            game_name=data.get("game_name", data["game_id"]),
            provider=data.get("provider", "unknown"),
            resolution=resolution,
            regions=regions,
            preprocessing=data.get("preprocessing", {}),
            validation=data.get("validation", {}),
            game_states=data.get("game_states", {}),
            raw_data=data,
        )

    def get_template(self, game_id: str) -> Optional[GameTemplate]:
        """Get template by game ID."""
        return self._cache.get(game_id)

    def get_template_by_name(self, game_name: str) -> Optional[GameTemplate]:
        """Get template by game name (case-insensitive)."""
        game_id = self._game_name_map.get(game_name.lower())
        if game_id:
            return self._cache.get(game_id)
        return None

    def get_generic_template(self) -> Optional[GameTemplate]:
        """Get the generic slot game template."""
        return self._cache.get("slot_game_generic")

    def list_templates(self) -> List[str]:
        """List all available template IDs."""
        return list(self._cache.keys())

    def list_games(self) -> List[Dict[str, str]]:
        """List all games with their details."""
        return [
            {
                "game_id": t.game_id,
                "game_name": t.game_name,
                "provider": t.provider,
            }
            for t in self._cache.values()
        ]

    def detect_game(self, ocr_text: str) -> Optional[GameTemplate]:
        """
        Attempt to detect which game is being played from OCR text.
        Returns the matching template if found.
        """
        ocr_lower = ocr_text.lower()

        # Check for game names in the text
        for game_name, game_id in self._game_name_map.items():
            if game_name in ocr_lower:
                return self._cache.get(game_id)

        # Check for provider names
        provider_keywords = {
            "pragmatic": ["pragmatic", "pp"],
            "hacksaw": ["hacksaw"],
            "nolimit": ["nolimit", "nolimit city"],
            "push": ["push gaming"],
            "evolution": ["evolution"],
        }

        # Return generic template if no match
        return self.get_generic_template()

    def get_all_game_names(self) -> List[str]:
        """Get list of all known game names for matching."""
        return list(self._game_name_map.keys())

    def get_game_info(self, game_id: str) -> Optional[Dict[str, Any]]:
        """Get game info dict for a game ID."""
        template = self._cache.get(game_id)
        if template:
            return {
                "game_id": template.game_id,
                "game_name": template.game_name,
                "provider": template.provider,
                "theoretical_rtp": template.raw_data.get("validation", {}).get("balance", {}).get("theoretical_rtp", 96.0)
            }
        return None

    def get_theoretical_rtp(self, game_id: str) -> float:
        """Get theoretical RTP for a game. Returns 96.0 as default."""
        # Known RTPs for popular games
        rtp_map = {
            "sweet-bonanza": 96.48,
            "sweet-bonanza-1000": 96.48,
            "gates-of-olympus-1000": 96.50,
            "sugar-rush": 96.50,
            "wanted-dead-or-wild": 96.38,
            "big-bass-bonanza": 96.71,
            "fruit-party": 96.47,
            "the-dog-house": 96.51,
            "starlight-princess": 96.50,
            "fire-in-the-hole": 96.51,
            "hand-of-anubis": 96.25,
            "money-train-4": 96.00,
            "dork-unit": 96.21,
            "tombstone-rip": 96.28,
            "zeus-vs-hades": 96.07,
        }
        return rtp_map.get(game_id, 96.0)


# Singleton instance
_loader: Optional[TemplateLoader] = None


def get_template_loader() -> TemplateLoader:
    """Get the singleton template loader instance."""
    global _loader
    if _loader is None:
        _loader = TemplateLoader()
    return _loader


def get_template(game_id: str) -> Optional[GameTemplate]:
    """Convenience function to get a template."""
    return get_template_loader().get_template(game_id)


def get_regions_for_game(
    game_id: str,
    image_width: int = 1280,
    image_height: int = 720,
    state: str = "idle"
) -> Dict[str, Tuple[int, int, int, int]]:
    """
    Get OCR regions for a game, scaled to the given resolution.
    Returns dict of region_name -> (x1, y1, x2, y2) bounding boxes.
    """
    loader = get_template_loader()
    template = loader.get_template(game_id) or loader.get_generic_template()

    if not template:
        return {}

    scaled_regions = template.get_scaled_regions(image_width, image_height, state)
    return {name: region.bbox for name, region in scaled_regions.items()}


if __name__ == "__main__":
    # Test the loader
    loader = get_template_loader()

    print("Available Templates:")
    print("-" * 50)
    for game in loader.list_games():
        print(f"  {game['game_id']:25} | {game['game_name']:25} | {game['provider']}")

    print(f"\nTotal templates: {len(loader.list_templates())}")

    # Test getting regions
    print("\nSweet Bonanza regions (720p):")
    regions = get_regions_for_game("sweet-bonanza", 1280, 720, "idle")
    for name, bbox in regions.items():
        print(f"  {name}: {bbox}")

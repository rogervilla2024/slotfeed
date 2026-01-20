"""
Discord Bot Service

Handles Discord bot integration for sending notifications to users.
Supports:
- Big win alerts
- Streamer live notifications
- Hot slot alerts (Pro+)
- Channel webhooks for server-wide notifications

Uses Discord.py for bot functionality and webhooks for channel notifications.
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import httpx

from ..core.config import settings

logger = logging.getLogger(__name__)


class DiscordMessageType(str, Enum):
    """Types of Discord notification messages."""
    BIG_WIN = "big_win"
    STREAMER_LIVE = "streamer_live"
    HOT_SLOT = "hot_slot"
    COLD_SLOT = "cold_slot"
    BONUS_HUNT = "bonus_hunt"
    WELCOME = "welcome"


class DiscordColor:
    """Discord embed colors."""
    GREEN = 0x22C55E  # Win/Success
    RED = 0xEF4444    # Loss/Error
    BLUE = 0x3B82F6   # Info
    GOLD = 0xF59E0B   # Legendary
    PURPLE = 0x8B5CF6 # Ultra
    ORANGE = 0xF97316 # Mega/Hot
    CYAN = 0x06B6D4   # Live
    GRAY = 0x6B7280   # Neutral


@dataclass
class DiscordUser:
    """Represents a Discord user registered for notifications."""
    discord_id: str
    user_id: str  # Our platform user ID
    username: str
    discriminator: Optional[str] = None
    dm_channel_id: Optional[str] = None
    is_active: bool = True


@dataclass
class DiscordWebhook:
    """Represents a Discord webhook for channel notifications."""
    webhook_id: str
    webhook_token: str
    channel_id: str
    guild_id: str
    name: str


@dataclass
class NotificationResult:
    """Result of sending a notification."""
    success: bool
    target_id: str  # Discord user ID or webhook ID
    message_id: Optional[str] = None
    error: Optional[str] = None


class DiscordBotService:
    """
    Service for sending Discord notifications.

    Supports both:
    - Direct messages to users via bot
    - Webhook messages to channels

    Usage:
        bot = DiscordBotService()
        await bot.send_big_win_alert(user_id, win_data)
        await bot.send_webhook_message(webhook_url, embed)
    """

    API_BASE_URL = "https://discord.com/api/v10"

    def __init__(self, token: Optional[str] = None):
        self.token = token or getattr(settings, 'DISCORD_BOT_TOKEN', None)
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None or self._client.is_closed:
            headers = {}
            if self.token:
                headers["Authorization"] = f"Bot {self.token}"
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers=headers
            )
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _send_api_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a request to the Discord API."""
        client = await self._get_client()
        url = f"{self.API_BASE_URL}{endpoint}"

        try:
            if method.upper() == "GET":
                response = await client.get(url)
            elif method.upper() == "POST":
                response = await client.post(url, json=json_data or data)
            elif method.upper() == "PATCH":
                response = await client.patch(url, json=json_data or data)
            elif method.upper() == "DELETE":
                response = await client.delete(url)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            return response.json() if response.content else {}
        except httpx.HTTPStatusError as e:
            logger.error(f"Discord API error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error sending Discord request: {e}")
            raise

    async def _send_webhook_request(
        self,
        webhook_url: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send a message via Discord webhook."""
        client = await self._get_client()

        try:
            response = await client.post(
                f"{webhook_url}?wait=true",
                json=data
            )
            response.raise_for_status()
            return response.json() if response.content else {}
        except httpx.HTTPStatusError as e:
            logger.error(f"Discord webhook error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error sending Discord webhook: {e}")
            raise

    def _create_embed(
        self,
        title: str,
        description: str,
        color: int = DiscordColor.BLUE,
        fields: Optional[List[Dict[str, Any]]] = None,
        thumbnail_url: Optional[str] = None,
        image_url: Optional[str] = None,
        footer_text: Optional[str] = None,
        author_name: Optional[str] = None,
        author_icon_url: Optional[str] = None,
        url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Discord embed object."""
        embed: Dict[str, Any] = {
            "title": title,
            "description": description,
            "color": color,
        }

        if url:
            embed["url"] = url

        if fields:
            embed["fields"] = fields

        if thumbnail_url:
            embed["thumbnail"] = {"url": thumbnail_url}

        if image_url:
            embed["image"] = {"url": image_url}

        if footer_text:
            embed["footer"] = {"text": footer_text}

        if author_name:
            embed["author"] = {"name": author_name}
            if author_icon_url:
                embed["author"]["icon_url"] = author_icon_url

        embed["timestamp"] = None  # Will be set by Discord

        return embed

    def _create_big_win_embed(
        self,
        streamer_name: str,
        game_name: str,
        multiplier: float,
        win_amount: float,
        bet_amount: float,
        tier: str,
        platform: str = "Kick",
        screenshot_url: Optional[str] = None,
        stream_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a big win notification embed."""
        tier_config = {
            "big": {"emoji": "🎰", "color": DiscordColor.GREEN},
            "mega": {"emoji": "🔥", "color": DiscordColor.ORANGE},
            "ultra": {"emoji": "💎", "color": DiscordColor.PURPLE},
            "legendary": {"emoji": "👑", "color": DiscordColor.GOLD},
        }

        config = tier_config.get(tier.lower(), tier_config["big"])
        emoji = config["emoji"]
        color = config["color"]

        fields = [
            {"name": "Streamer", "value": streamer_name, "inline": True},
            {"name": "Platform", "value": platform, "inline": True},
            {"name": "Game", "value": game_name, "inline": True},
            {"name": "Multiplier", "value": f"{multiplier:,.2f}x", "inline": True},
            {"name": "Win Amount", "value": f"${win_amount:,.2f}", "inline": True},
            {"name": "Bet Size", "value": f"${bet_amount:,.2f}", "inline": True},
        ]

        return self._create_embed(
            title=f"{emoji} {tier.upper()} WIN! {emoji}",
            description=f"**{streamer_name}** just hit a massive {multiplier:,.2f}x win on **{game_name}**!",
            color=color,
            fields=fields,
            image_url=screenshot_url,
            footer_text="SlotFeed • Real-time slot analytics",
            url=stream_url
        )

    def _create_streamer_live_embed(
        self,
        streamer_name: str,
        platform: str,
        game_name: Optional[str] = None,
        viewer_count: Optional[int] = None,
        stream_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a streamer live notification embed."""
        fields = [
            {"name": "Platform", "value": platform, "inline": True},
        ]

        if game_name:
            fields.append({"name": "Playing", "value": game_name, "inline": True})

        if viewer_count:
            fields.append({"name": "Viewers", "value": f"{viewer_count:,}", "inline": True})

        return self._create_embed(
            title=f"🔴 {streamer_name} is LIVE!",
            description=f"**{streamer_name}** just started streaming on {platform}!",
            color=DiscordColor.CYAN,
            fields=fields,
            thumbnail_url=avatar_url,
            image_url=thumbnail_url,
            footer_text="SlotFeed • Never miss a stream",
            url=stream_url
        )

    def _create_hot_slot_embed(
        self,
        game_name: str,
        provider: str,
        score: int,
        recent_rtp: float,
        sample_size: int,
        thumbnail_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a hot slot notification embed."""
        fields = [
            {"name": "Provider", "value": provider, "inline": True},
            {"name": "Heat Score", "value": f"+{score}", "inline": True},
            {"name": "Recent RTP", "value": f"{recent_rtp:.2f}%", "inline": True},
            {"name": "Sample Size", "value": f"{sample_size:,} spins", "inline": True},
        ]

        return self._create_embed(
            title=f"🔥 HOT SLOT ALERT: {game_name}",
            description="This slot is running hot across multiple streamers!",
            color=DiscordColor.ORANGE,
            fields=fields,
            thumbnail_url=thumbnail_url,
            footer_text="SlotFeed Pro • Hot/Cold Analytics"
        )

    def _create_cold_slot_embed(
        self,
        game_name: str,
        provider: str,
        score: int,
        recent_rtp: float,
        sample_size: int
    ) -> Dict[str, Any]:
        """Create a cold slot notification embed."""
        fields = [
            {"name": "Provider", "value": provider, "inline": True},
            {"name": "Cold Score", "value": f"{score}", "inline": True},
            {"name": "Recent RTP", "value": f"{recent_rtp:.2f}%", "inline": True},
            {"name": "Sample Size", "value": f"{sample_size:,} spins", "inline": True},
        ]

        return self._create_embed(
            title=f"❄️ COLD SLOT WARNING: {game_name}",
            description="This slot is underperforming across streamers.",
            color=DiscordColor.BLUE,
            fields=fields,
            footer_text="SlotFeed Pro • Hot/Cold Analytics"
        )

    async def send_dm(
        self,
        user_id: str,
        content: Optional[str] = None,
        embed: Optional[Dict[str, Any]] = None
    ) -> NotificationResult:
        """Send a direct message to a Discord user."""
        if not self.token:
            logger.warning("Discord bot token not configured")
            return NotificationResult(
                success=False,
                target_id=user_id,
                error="Bot token not configured"
            )

        try:
            # Create DM channel
            dm_channel = await self._send_api_request(
                "POST",
                "/users/@me/channels",
                json_data={"recipient_id": user_id}
            )

            channel_id = dm_channel.get("id")
            if not channel_id:
                return NotificationResult(
                    success=False,
                    target_id=user_id,
                    error="Failed to create DM channel"
                )

            # Send message
            message_data: Dict[str, Any] = {}
            if content:
                message_data["content"] = content
            if embed:
                message_data["embeds"] = [embed]

            result = await self._send_api_request(
                "POST",
                f"/channels/{channel_id}/messages",
                json_data=message_data
            )

            return NotificationResult(
                success=True,
                target_id=user_id,
                message_id=result.get("id")
            )

        except Exception as e:
            return NotificationResult(
                success=False,
                target_id=user_id,
                error=str(e)
            )

    async def send_webhook_message(
        self,
        webhook_url: str,
        content: Optional[str] = None,
        embed: Optional[Dict[str, Any]] = None,
        username: str = "SlotFeed",
        avatar_url: Optional[str] = None
    ) -> NotificationResult:
        """Send a message via Discord webhook."""
        try:
            data: Dict[str, Any] = {
                "username": username,
            }

            if avatar_url:
                data["avatar_url"] = avatar_url

            if content:
                data["content"] = content

            if embed:
                data["embeds"] = [embed]

            result = await self._send_webhook_request(webhook_url, data)

            return NotificationResult(
                success=True,
                target_id=webhook_url.split("/")[-2],  # Extract webhook ID
                message_id=result.get("id")
            )

        except Exception as e:
            return NotificationResult(
                success=False,
                target_id="webhook",
                error=str(e)
            )

    async def send_big_win_alert(
        self,
        target: str,  # User ID or webhook URL
        streamer_name: str,
        game_name: str,
        multiplier: float,
        win_amount: float,
        bet_amount: float,
        tier: str,
        platform: str = "Kick",
        screenshot_url: Optional[str] = None,
        stream_url: Optional[str] = None,
        is_webhook: bool = False
    ) -> NotificationResult:
        """Send a big win alert."""
        embed = self._create_big_win_embed(
            streamer_name=streamer_name,
            game_name=game_name,
            multiplier=multiplier,
            win_amount=win_amount,
            bet_amount=bet_amount,
            tier=tier,
            platform=platform,
            screenshot_url=screenshot_url,
            stream_url=stream_url
        )

        if is_webhook:
            return await self.send_webhook_message(
                webhook_url=target,
                embed=embed
            )
        else:
            return await self.send_dm(
                user_id=target,
                embed=embed
            )

    async def send_streamer_live_alert(
        self,
        target: str,
        streamer_name: str,
        platform: str,
        game_name: Optional[str] = None,
        viewer_count: Optional[int] = None,
        stream_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        avatar_url: Optional[str] = None,
        is_webhook: bool = False
    ) -> NotificationResult:
        """Send a streamer live alert."""
        embed = self._create_streamer_live_embed(
            streamer_name=streamer_name,
            platform=platform,
            game_name=game_name,
            viewer_count=viewer_count,
            stream_url=stream_url,
            thumbnail_url=thumbnail_url,
            avatar_url=avatar_url
        )

        if is_webhook:
            return await self.send_webhook_message(
                webhook_url=target,
                embed=embed
            )
        else:
            return await self.send_dm(
                user_id=target,
                embed=embed
            )

    async def send_hot_slot_alert(
        self,
        target: str,
        game_name: str,
        provider: str,
        score: int,
        recent_rtp: float,
        sample_size: int,
        thumbnail_url: Optional[str] = None,
        is_webhook: bool = False
    ) -> NotificationResult:
        """Send a hot slot alert."""
        embed = self._create_hot_slot_embed(
            game_name=game_name,
            provider=provider,
            score=score,
            recent_rtp=recent_rtp,
            sample_size=sample_size,
            thumbnail_url=thumbnail_url
        )

        if is_webhook:
            return await self.send_webhook_message(
                webhook_url=target,
                embed=embed
            )
        else:
            return await self.send_dm(
                user_id=target,
                embed=embed
            )

    async def send_welcome_message(
        self,
        user_id: str,
        username: str
    ) -> NotificationResult:
        """Send a welcome message to a new user."""
        embed = self._create_embed(
            title=f"👋 Welcome to SlotFeed, {username}!",
            description="You're now set up to receive Discord notifications!",
            color=DiscordColor.BLUE,
            fields=[
                {"name": "🎰 Big Win Alerts", "value": "Get notified when streamers hit massive wins", "inline": False},
                {"name": "🔴 Streamer Live", "value": "Know when your favorites go live", "inline": False},
                {"name": "🔥 Hot Slots", "value": "Discover slots running hot (Pro+)", "inline": False},
            ],
            footer_text="Happy watching! 🎲"
        )

        return await self.send_dm(
            user_id=user_id,
            embed=embed
        )

    async def broadcast_to_webhooks(
        self,
        webhook_urls: List[str],
        embed: Dict[str, Any],
        delay: float = 0.1
    ) -> List[NotificationResult]:
        """Broadcast a message to multiple webhooks."""
        results = []
        for url in webhook_urls:
            result = await self.send_webhook_message(
                webhook_url=url,
                embed=embed
            )
            results.append(result)
            await asyncio.sleep(delay)
        return results

    async def get_bot_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the bot."""
        if not self.token:
            return None

        try:
            return await self._send_api_request("GET", "/users/@me")
        except Exception:
            return None

    async def get_user_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a Discord user."""
        if not self.token:
            return None

        try:
            return await self._send_api_request("GET", f"/users/{user_id}")
        except Exception:
            return None


# Singleton instance
_discord_bot: Optional[DiscordBotService] = None


def get_discord_bot() -> DiscordBotService:
    """Get the singleton Discord bot instance."""
    global _discord_bot
    if _discord_bot is None:
        _discord_bot = DiscordBotService()
    return _discord_bot

"""
Telegram Bot Service

Handles Telegram bot integration for sending notifications to users.
Supports:
- Big win alerts
- Streamer live notifications
- Hot slot alerts (Pro+)

Uses the Telegram Bot API directly via httpx for async support.
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import httpx

from ..core.config import settings

logger = logging.getLogger(__name__)


class MessageType(str, Enum):
    """Types of notification messages."""
    BIG_WIN = "big_win"
    STREAMER_LIVE = "streamer_live"
    HOT_SLOT = "hot_slot"
    WELCOME = "welcome"
    SUBSCRIPTION = "subscription"


@dataclass
class TelegramUser:
    """Represents a Telegram user registered for notifications."""
    chat_id: str
    user_id: str  # Our platform user ID
    username: Optional[str] = None
    is_active: bool = True


@dataclass
class NotificationResult:
    """Result of sending a notification."""
    success: bool
    chat_id: str
    message_id: Optional[int] = None
    error: Optional[str] = None


class TelegramBotService:
    """
    Service for sending Telegram notifications.

    Usage:
        bot = TelegramBotService()
        await bot.send_big_win_alert(chat_id, win_data)
    """

    BASE_URL = "https://api.telegram.org/bot"

    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.TELEGRAM_BOT_TOKEN
        self.api_url = f"{self.BASE_URL}{self.token}"
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _send_request(
        self,
        method: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send a request to the Telegram API."""
        client = await self._get_client()
        url = f"{self.api_url}/{method}"

        try:
            response = await client.post(url, json=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Telegram API error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error sending Telegram request: {e}")
            raise

    async def send_message(
        self,
        chat_id: str,
        text: str,
        parse_mode: str = "HTML",
        disable_web_page_preview: bool = False,
        reply_markup: Optional[Dict[str, Any]] = None
    ) -> NotificationResult:
        """Send a text message to a chat."""
        if not self.token:
            logger.warning("Telegram bot token not configured")
            return NotificationResult(
                success=False,
                chat_id=chat_id,
                error="Bot token not configured"
            )

        data: Dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": disable_web_page_preview,
        }

        if reply_markup:
            data["reply_markup"] = reply_markup

        try:
            result = await self._send_request("sendMessage", data)
            if result.get("ok"):
                return NotificationResult(
                    success=True,
                    chat_id=chat_id,
                    message_id=result["result"]["message_id"]
                )
            else:
                return NotificationResult(
                    success=False,
                    chat_id=chat_id,
                    error=result.get("description", "Unknown error")
                )
        except Exception as e:
            return NotificationResult(
                success=False,
                chat_id=chat_id,
                error=str(e)
            )

    async def send_photo(
        self,
        chat_id: str,
        photo_url: str,
        caption: Optional[str] = None,
        parse_mode: str = "HTML"
    ) -> NotificationResult:
        """Send a photo message."""
        if not self.token:
            return NotificationResult(
                success=False,
                chat_id=chat_id,
                error="Bot token not configured"
            )

        data: Dict[str, Any] = {
            "chat_id": chat_id,
            "photo": photo_url,
            "parse_mode": parse_mode,
        }

        if caption:
            data["caption"] = caption

        try:
            result = await self._send_request("sendPhoto", data)
            if result.get("ok"):
                return NotificationResult(
                    success=True,
                    chat_id=chat_id,
                    message_id=result["result"]["message_id"]
                )
            else:
                return NotificationResult(
                    success=False,
                    chat_id=chat_id,
                    error=result.get("description")
                )
        except Exception as e:
            return NotificationResult(
                success=False,
                chat_id=chat_id,
                error=str(e)
            )

    def _format_big_win_message(
        self,
        streamer_name: str,
        game_name: str,
        multiplier: float,
        win_amount: float,
        bet_amount: float,
        tier: str,
        platform: str = "Kick"
    ) -> str:
        """Format a big win notification message."""
        tier_emojis = {
            "big": "🎰",
            "mega": "🔥",
            "ultra": "💎",
            "legendary": "👑"
        }

        emoji = tier_emojis.get(tier.lower(), "🎰")
        tier_label = tier.upper()

        return f"""
{emoji} <b>{tier_label} WIN!</b> {emoji}

<b>Streamer:</b> {streamer_name}
<b>Platform:</b> {platform}
<b>Game:</b> {game_name}

<b>Multiplier:</b> {multiplier:,.2f}x
<b>Win Amount:</b> ${win_amount:,.2f}
<b>Bet Size:</b> ${bet_amount:,.2f}

🔴 Watch live now!
""".strip()

    def _format_streamer_live_message(
        self,
        streamer_name: str,
        platform: str,
        game_name: Optional[str] = None,
        viewer_count: Optional[int] = None,
        stream_url: Optional[str] = None
    ) -> str:
        """Format a streamer live notification message."""
        message = f"""
🔴 <b>{streamer_name} is LIVE!</b>

<b>Platform:</b> {platform}
"""

        if game_name:
            message += f"<b>Playing:</b> {game_name}\n"

        if viewer_count:
            message += f"<b>Viewers:</b> {viewer_count:,}\n"

        if stream_url:
            message += f"\n<a href=\"{stream_url}\">Watch Now</a>"

        return message.strip()

    def _format_hot_slot_message(
        self,
        game_name: str,
        provider: str,
        score: int,
        recent_rtp: float,
        sample_size: int
    ) -> str:
        """Format a hot slot notification message."""
        return f"""
🔥 <b>HOT SLOT ALERT!</b> 🔥

<b>Game:</b> {game_name}
<b>Provider:</b> {provider}

<b>Heat Score:</b> +{score}
<b>Recent RTP:</b> {recent_rtp:.2f}%
<b>Sample Size:</b> {sample_size} spins

This slot is running hot across multiple streamers!
""".strip()

    async def send_big_win_alert(
        self,
        chat_id: str,
        streamer_name: str,
        game_name: str,
        multiplier: float,
        win_amount: float,
        bet_amount: float,
        tier: str,
        platform: str = "Kick",
        screenshot_url: Optional[str] = None
    ) -> NotificationResult:
        """Send a big win alert to a user."""
        message = self._format_big_win_message(
            streamer_name=streamer_name,
            game_name=game_name,
            multiplier=multiplier,
            win_amount=win_amount,
            bet_amount=bet_amount,
            tier=tier,
            platform=platform
        )

        if screenshot_url:
            return await self.send_photo(
                chat_id=chat_id,
                photo_url=screenshot_url,
                caption=message
            )
        else:
            return await self.send_message(
                chat_id=chat_id,
                text=message
            )

    async def send_streamer_live_alert(
        self,
        chat_id: str,
        streamer_name: str,
        platform: str,
        game_name: Optional[str] = None,
        viewer_count: Optional[int] = None,
        stream_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None
    ) -> NotificationResult:
        """Send a streamer live alert to a user."""
        message = self._format_streamer_live_message(
            streamer_name=streamer_name,
            platform=platform,
            game_name=game_name,
            viewer_count=viewer_count,
            stream_url=stream_url
        )

        if thumbnail_url:
            return await self.send_photo(
                chat_id=chat_id,
                photo_url=thumbnail_url,
                caption=message
            )
        else:
            return await self.send_message(
                chat_id=chat_id,
                text=message
            )

    async def send_hot_slot_alert(
        self,
        chat_id: str,
        game_name: str,
        provider: str,
        score: int,
        recent_rtp: float,
        sample_size: int
    ) -> NotificationResult:
        """Send a hot slot alert to a user."""
        message = self._format_hot_slot_message(
            game_name=game_name,
            provider=provider,
            score=score,
            recent_rtp=recent_rtp,
            sample_size=sample_size
        )

        return await self.send_message(
            chat_id=chat_id,
            text=message
        )

    async def send_welcome_message(self, chat_id: str, username: str) -> NotificationResult:
        """Send a welcome message to a new user."""
        message = f"""
👋 <b>Welcome to SlotFeed, {username}!</b>

You're now set up to receive notifications:

🎰 <b>Big Win Alerts</b> - Get notified when streamers hit massive wins
🔴 <b>Streamer Live</b> - Know when your favorites go live
🔥 <b>Hot Slots</b> - Discover slots running hot (Pro+)

Use /settings to customize your alerts.
Use /help for more commands.

Happy watching! 🎲
""".strip()

        return await self.send_message(chat_id=chat_id, text=message)

    async def broadcast_message(
        self,
        chat_ids: List[str],
        text: str,
        delay: float = 0.05
    ) -> List[NotificationResult]:
        """
        Broadcast a message to multiple users.

        Includes a small delay between messages to avoid rate limiting.
        """
        results = []
        for chat_id in chat_ids:
            result = await self.send_message(chat_id=chat_id, text=text)
            results.append(result)
            await asyncio.sleep(delay)
        return results

    async def get_bot_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the bot."""
        if not self.token:
            return None

        try:
            result = await self._send_request("getMe", {})
            if result.get("ok"):
                return result["result"]
            return None
        except Exception:
            return None


# Singleton instance
_telegram_bot: Optional[TelegramBotService] = None


def get_telegram_bot() -> TelegramBotService:
    """Get the singleton Telegram bot instance."""
    global _telegram_bot
    if _telegram_bot is None:
        _telegram_bot = TelegramBotService()
    return _telegram_bot

"""
Discord Integration API Endpoints

Handles Discord OAuth, webhook management, and notification preferences.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
import logging

from ...services.discord_bot import get_discord_bot, DiscordBotService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discord", tags=["discord"])


# ============================================
# Pydantic Schemas
# ============================================

class DiscordLinkRequest(BaseModel):
    """Request to link a Discord account."""
    discord_user_id: str = Field(..., description="Discord user ID")
    discord_username: str = Field(..., description="Discord username")


class DiscordWebhookCreate(BaseModel):
    """Request to register a Discord webhook."""
    webhook_url: str = Field(..., description="Full Discord webhook URL")
    channel_name: str = Field(..., description="Channel name for display")
    guild_name: str = Field(..., description="Server/guild name")
    notification_types: List[str] = Field(
        default=["big_win", "streamer_live"],
        description="Types of notifications to receive"
    )


class DiscordWebhookResponse(BaseModel):
    """Response for webhook operations."""
    id: str
    channel_name: str
    guild_name: str
    notification_types: List[str]
    is_active: bool


class DiscordUserResponse(BaseModel):
    """Response for Discord user info."""
    discord_id: str
    username: str
    is_linked: bool
    dm_enabled: bool


class TestNotificationRequest(BaseModel):
    """Request to send a test notification."""
    notification_type: str = Field(
        default="big_win",
        description="Type of test notification: big_win, streamer_live, hot_slot"
    )


class DiscordStatsResponse(BaseModel):
    """Discord integration statistics."""
    linked_users: int
    active_webhooks: int
    notifications_sent_today: int
    notifications_sent_total: int


# ============================================
# Mock storage (replace with database in production)
# ============================================

_linked_users: dict = {}
_webhooks: dict = {}
_notification_counts = {"today": 0, "total": 0}


# ============================================
# Endpoints
# ============================================

@router.post("/link", response_model=DiscordUserResponse)
async def link_discord_account(
    request: DiscordLinkRequest,
    user_id: str = Query(..., description="Platform user ID")
):
    """
    Link a Discord account to a SlotFeed user.

    This enables direct message notifications to the user.
    """
    bot = get_discord_bot()

    # Verify the Discord user exists
    try:
        user_info = await bot.get_user_info(request.discord_user_id)
        if not user_info:
            raise HTTPException(
                status_code=400,
                detail="Could not verify Discord user"
            )
    except Exception as e:
        logger.warning(f"Could not verify Discord user: {e}")
        # Continue anyway for development/testing

    # Store the link
    _linked_users[user_id] = {
        "discord_id": request.discord_user_id,
        "username": request.discord_username,
        "dm_enabled": True
    }

    # Send welcome message
    try:
        await bot.send_welcome_message(
            user_id=request.discord_user_id,
            username=request.discord_username
        )
    except Exception as e:
        logger.warning(f"Could not send welcome message: {e}")

    return DiscordUserResponse(
        discord_id=request.discord_user_id,
        username=request.discord_username,
        is_linked=True,
        dm_enabled=True
    )


@router.delete("/link")
async def unlink_discord_account(
    user_id: str = Query(..., description="Platform user ID")
):
    """
    Unlink a Discord account from a SlotFeed user.
    """
    if user_id not in _linked_users:
        raise HTTPException(
            status_code=404,
            detail="No Discord account linked"
        )

    del _linked_users[user_id]
    return {"message": "Discord account unlinked successfully"}


@router.get("/status", response_model=DiscordUserResponse)
async def get_discord_status(
    user_id: str = Query(..., description="Platform user ID")
):
    """
    Get the Discord link status for a user.
    """
    user_data = _linked_users.get(user_id)

    if not user_data:
        return DiscordUserResponse(
            discord_id="",
            username="",
            is_linked=False,
            dm_enabled=False
        )

    return DiscordUserResponse(
        discord_id=user_data["discord_id"],
        username=user_data["username"],
        is_linked=True,
        dm_enabled=user_data.get("dm_enabled", True)
    )


@router.post("/webhooks", response_model=DiscordWebhookResponse)
async def register_webhook(
    request: DiscordWebhookCreate,
    user_id: str = Query(..., description="Platform user ID")
):
    """
    Register a Discord webhook for channel notifications.

    Webhooks allow notifications to be sent to Discord channels
    without requiring users to have the bot in DMs.
    """
    bot = get_discord_bot()

    # Test the webhook
    try:
        result = await bot.send_webhook_message(
            webhook_url=request.webhook_url,
            content="✅ **SlotFeed webhook connected!** You'll now receive notifications in this channel."
        )
        if not result.success:
            raise HTTPException(
                status_code=400,
                detail=f"Webhook test failed: {result.error}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid webhook URL: {str(e)}"
        )

    # Extract webhook ID from URL
    webhook_id = request.webhook_url.split("/")[-2]

    # Store the webhook
    _webhooks[webhook_id] = {
        "user_id": user_id,
        "webhook_url": request.webhook_url,
        "channel_name": request.channel_name,
        "guild_name": request.guild_name,
        "notification_types": request.notification_types,
        "is_active": True
    }

    return DiscordWebhookResponse(
        id=webhook_id,
        channel_name=request.channel_name,
        guild_name=request.guild_name,
        notification_types=request.notification_types,
        is_active=True
    )


@router.get("/webhooks", response_model=List[DiscordWebhookResponse])
async def list_webhooks(
    user_id: str = Query(..., description="Platform user ID")
):
    """
    List all webhooks registered by a user.
    """
    user_webhooks = [
        DiscordWebhookResponse(
            id=wh_id,
            channel_name=wh["channel_name"],
            guild_name=wh["guild_name"],
            notification_types=wh["notification_types"],
            is_active=wh["is_active"]
        )
        for wh_id, wh in _webhooks.items()
        if wh.get("user_id") == user_id
    ]

    return user_webhooks


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    user_id: str = Query(..., description="Platform user ID")
):
    """
    Delete a registered webhook.
    """
    webhook = _webhooks.get(webhook_id)

    if not webhook:
        raise HTTPException(
            status_code=404,
            detail="Webhook not found"
        )

    if webhook.get("user_id") != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this webhook"
        )

    del _webhooks[webhook_id]
    return {"message": "Webhook deleted successfully"}


@router.post("/test")
async def send_test_notification(
    request: TestNotificationRequest,
    user_id: str = Query(..., description="Platform user ID")
):
    """
    Send a test notification to verify Discord integration.
    """
    user_data = _linked_users.get(user_id)

    if not user_data:
        raise HTTPException(
            status_code=400,
            detail="No Discord account linked. Please link your Discord first."
        )

    bot = get_discord_bot()
    discord_id = user_data["discord_id"]

    if request.notification_type == "big_win":
        result = await bot.send_big_win_alert(
            target=discord_id,
            streamer_name="Roshtein",
            game_name="Sweet Bonanza",
            multiplier=500.0,
            win_amount=50000.0,
            bet_amount=100.0,
            tier="mega",
            platform="Kick",
            is_webhook=False
        )
    elif request.notification_type == "streamer_live":
        result = await bot.send_streamer_live_alert(
            target=discord_id,
            streamer_name="Trainwreckstv",
            platform="Kick",
            game_name="Gates of Olympus",
            viewer_count=45000,
            stream_url="https://kick.com/trainwreckstv",
            is_webhook=False
        )
    elif request.notification_type == "hot_slot":
        result = await bot.send_hot_slot_alert(
            target=discord_id,
            game_name="Wanted Dead or a Wild",
            provider="Hacksaw Gaming",
            score=85,
            recent_rtp=98.5,
            sample_size=15000,
            is_webhook=False
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown notification type: {request.notification_type}"
        )

    if result.success:
        return {"message": "Test notification sent successfully"}
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send notification: {result.error}"
        )


@router.get("/stats", response_model=DiscordStatsResponse)
async def get_discord_stats():
    """
    Get Discord integration statistics.
    """
    return DiscordStatsResponse(
        linked_users=len(_linked_users),
        active_webhooks=len([w for w in _webhooks.values() if w.get("is_active")]),
        notifications_sent_today=_notification_counts["today"],
        notifications_sent_total=_notification_counts["total"]
    )


@router.get("/bot-info")
async def get_bot_info():
    """
    Get information about the Discord bot.
    """
    bot = get_discord_bot()
    info = await bot.get_bot_info()

    if info:
        return {
            "connected": True,
            "username": info.get("username"),
            "discriminator": info.get("discriminator"),
            "id": info.get("id")
        }
    else:
        return {
            "connected": False,
            "message": "Bot token not configured or invalid"
        }

"""
Alert Management API Endpoints

Handles CRUD operations for user alert rules and notification preferences.

SECURITY: All endpoints require user authentication via Bearer token.
"""

from typing import List, Optional
from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ...schemas.alert import (
    AlertRuleCreate,
    AlertRuleUpdate,
    AlertRuleResponse,
    TelegramLinkRequest,
    TelegramLinkResponse,
    AlertStatsResponse,
    AlertType,
    NotificationChannel,
)
from ...models import AlertRule, User
from ...core.database import get_db
from ...core.security import CurrentUser, get_current_user

router = APIRouter()


async def get_current_user_id(user: CurrentUser) -> str:
    """Get current user ID from authenticated user context."""
    return user.id


@router.get("/rules", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    type: Optional[AlertType] = None,
    is_active: Optional[bool] = None,
):
    """
    List all alert rules for the current user.

    Optionally filter by type or active status.
    """
    user_id = user.id
    query = select(AlertRule).where(AlertRule.user_id == user_id)

    if type:
        query = query.where(AlertRule.alert_type == type.value)
    if is_active is not None:
        query = query.where(AlertRule.is_active == is_active)

    query = query.order_by(AlertRule.created_at.desc())

    result = await db.execute(query)
    rules = result.scalars().all()

    return [
        AlertRuleResponse(
            id=str(rule.id),
            user_id=str(rule.user_id),
            type=rule.alert_type,
            conditions=rule.conditions or {},
            channels=rule.channels or ["telegram"],
            is_active=rule.is_active,
            created_at=rule.created_at,
        )
        for rule in rules
    ]


@router.post("/rules", response_model=AlertRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_alert_rule(
    rule: AlertRuleCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new alert rule.

    Users can create rules for:
    - big_win: Get notified when streamers hit big wins
    - streamer_live: Get notified when specific streamers go live
    - hot_slot: Get notified when slots are running hot (Pro+ only)
    """
    user_id = user.id
    # Check if user has reached their alert rule limit
    # TODO: Implement subscription tier limits
    count_query = select(func.count()).select_from(AlertRule).where(
        AlertRule.user_id == user_id
    )
    result = await db.execute(count_query)
    current_count = result.scalar() or 0

    # Free tier limit: 2 rules
    MAX_FREE_RULES = 2
    if current_count >= MAX_FREE_RULES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Alert rule limit reached. Upgrade to Pro for more rules."
        )

    # Create the rule
    new_rule = AlertRule(
        id=str(uuid4()),
        user_id=user_id,
        alert_type=rule.type.value,
        conditions=rule.conditions.model_dump() if rule.conditions else {},
        channels=[ch.value for ch in rule.channels],
        is_active=rule.is_active,
        created_at=datetime.now(timezone.utc),
    )

    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)

    return AlertRuleResponse(
        id=str(new_rule.id),
        user_id=str(new_rule.user_id),
        type=new_rule.alert_type,
        conditions=new_rule.conditions or {},
        channels=new_rule.channels or ["telegram"],
        is_active=new_rule.is_active,
        created_at=new_rule.created_at,
    )


@router.get("/rules/{rule_id}", response_model=AlertRuleResponse)
async def get_alert_rule(
    rule_id: str,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific alert rule by ID."""
    query = select(AlertRule).where(
        AlertRule.id == rule_id,
        AlertRule.user_id == user.id
    )
    result = await db.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert rule not found"
        )

    return AlertRuleResponse(
        id=str(rule.id),
        user_id=str(rule.user_id),
        type=rule.alert_type,
        conditions=rule.conditions or {},
        channels=rule.channels or ["telegram"],
        is_active=rule.is_active,
        created_at=rule.created_at,
    )


@router.patch("/rules/{rule_id}", response_model=AlertRuleResponse)
async def update_alert_rule(
    rule_id: str,
    updates: AlertRuleUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing alert rule."""
    query = select(AlertRule).where(
        AlertRule.id == rule_id,
        AlertRule.user_id == user.id
    )
    result = await db.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert rule not found"
        )

    # Apply updates
    if updates.conditions is not None:
        rule.conditions = updates.conditions.model_dump()
    if updates.channels is not None:
        rule.channels = [ch.value for ch in updates.channels]
    if updates.is_active is not None:
        rule.is_active = updates.is_active

    await db.commit()
    await db.refresh(rule)

    return AlertRuleResponse(
        id=str(rule.id),
        user_id=str(rule.user_id),
        type=rule.alert_type,
        conditions=rule.conditions or {},
        channels=rule.channels or ["telegram"],
        is_active=rule.is_active,
        created_at=rule.created_at,
    )


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert_rule(
    rule_id: str,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Delete an alert rule."""
    query = select(AlertRule).where(
        AlertRule.id == rule_id,
        AlertRule.user_id == user.id
    )
    result = await db.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert rule not found"
        )

    await db.delete(rule)
    await db.commit()


@router.post("/telegram/link", response_model=TelegramLinkResponse)
async def link_telegram(
    request: TelegramLinkRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Link a Telegram account using a verification code.

    Users must first message the bot with /start to receive a verification code,
    then provide that code here to link their account.
    """
    # TODO: Implement verification code validation
    # For now, return a mock success response
    return TelegramLinkResponse(
        success=True,
        chat_id="123456789",
        username="user",
        message="Telegram account linked successfully!"
    )


@router.delete("/telegram/unlink", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_telegram(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Unlink the user's Telegram account."""
    # TODO: Implement Telegram unlinking
    pass


@router.get("/stats", response_model=AlertStatsResponse)
async def get_alert_stats(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get statistics about the user's alerts."""
    user_id = user.id
    # Count total and active rules
    total_query = select(func.count()).select_from(AlertRule).where(
        AlertRule.user_id == user_id
    )
    active_query = select(func.count()).select_from(AlertRule).where(
        AlertRule.user_id == user_id,
        AlertRule.is_active == True
    )

    total_result = await db.execute(total_query)
    active_result = await db.execute(active_query)

    total_rules = total_result.scalar() or 0
    active_rules = active_result.scalar() or 0

    # TODO: Implement notification history tracking
    return AlertStatsResponse(
        total_rules=total_rules,
        active_rules=active_rules,
        notifications_sent_24h=0,
        notifications_sent_7d=0,
        notifications_sent_30d=0,
        channels_configured=[NotificationChannel.TELEGRAM] if total_rules > 0 else [],
    )


@router.post("/test/{rule_id}")
async def test_alert_rule(
    rule_id: str,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a test notification for an alert rule.

    Useful for verifying that the notification channel is properly configured.
    """
    query = select(AlertRule).where(
        AlertRule.id == rule_id,
        AlertRule.user_id == user.id
    )
    result = await db.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert rule not found"
        )

    # TODO: Send actual test notification
    return {
        "success": True,
        "message": "Test notification sent successfully!"
    }

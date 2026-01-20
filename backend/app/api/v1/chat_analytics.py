"""
Chat Analytics API endpoints

Endpoints for chat analytics and hype moment detection:
- Real-time chat statistics
- Historical chat analytics buckets
- Hype moment detection and tracking
- Session chat summaries
"""

from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.chat_analytics_service import ChatAnalyticsService, create_chat_analytics_service
from app.services.hype_moment_detector import HypeMomentDetector, create_hype_detector
from app.schemas.chat_analytics import (
    HypeTriggerType,
    ChatMessage,
    ChatMessageBatch,
    ChatAnalyticsBucketResponse,
    ChatAnalyticsSessionStats,
    ChatAnalyticsListResponse,
    HypeMomentCreate,
    HypeMomentResponse,
    HypeMomentListResponse,
    LiveChatStats,
)

router = APIRouter(prefix="/chat-analytics", tags=["chat-analytics"])

# Service instances (would be dependency injected in production)
_chat_service: Optional[ChatAnalyticsService] = None
_hype_detector: Optional[HypeMomentDetector] = None


def get_chat_service() -> ChatAnalyticsService:
    """Get or create chat analytics service instance."""
    global _chat_service
    if _chat_service is None:
        _chat_service = create_chat_analytics_service()
    return _chat_service


def get_hype_detector() -> HypeMomentDetector:
    """Get or create hype moment detector instance."""
    global _hype_detector
    if _hype_detector is None:
        _hype_detector = create_hype_detector()
    return _hype_detector


# ============= Real-time Chat Stats =============

@router.get(
    "/live/{session_id}",
    response_model=Optional[LiveChatStats],
    summary="Get live chat statistics",
)
async def get_live_chat_stats(
    session_id: str,
):
    """
    Get real-time chat statistics for an active session.

    Returns current message velocity, sentiment, hype score, and trending emotes.
    Returns null if session is not active.
    """
    service = get_chat_service()
    stats = service.get_live_stats(session_id)
    return stats


@router.post(
    "/messages",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Process chat messages",
)
async def process_messages(
    batch: ChatMessageBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Process a batch of chat messages for analytics.

    Messages are aggregated into buckets and analyzed for sentiment,
    emote usage, and potential hype moments.
    """
    service = get_chat_service()
    detector = get_hype_detector()

    spikes = service.process_messages_batch(batch.messages)

    # Check for hype moments from spikes
    hype_moments = []
    for spike in spikes:
        moment = detector.detect_from_chat_spike(spike)
        if moment:
            await detector.store_hype_moment(moment, db)
            hype_moments.append(moment.id)

    return {
        "processed": len(batch.messages),
        "spikes_detected": len(spikes),
        "hype_moments": hype_moments,
    }


# ============= Chat Analytics Buckets =============

@router.get(
    "/sessions/{session_id}",
    response_model=ChatAnalyticsListResponse,
    summary="Get chat analytics for session",
)
async def get_session_chat_analytics(
    session_id: str,
    start_time: Optional[datetime] = Query(None, description="Start time filter"),
    end_time: Optional[datetime] = Query(None, description="End time filter"),
    limit: int = Query(100, ge=1, le=500, description="Maximum buckets to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get chat analytics buckets for a session.

    Returns 5-minute aggregations of chat activity including message counts,
    sentiment scores, emote usage, and hype scores.
    """
    service = get_chat_service()
    buckets = await service.get_buckets(
        session_id=session_id,
        db=db,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        offset=offset,
    )

    return ChatAnalyticsListResponse(
        items=[
            ChatAnalyticsBucketResponse(
                id=b.id,
                session_id=b.session_id,
                bucket_start=b.bucket_start,
                bucket_end=b.bucket_end,
                message_count=b.message_count,
                unique_chatters=b.unique_chatters,
                emote_count=b.emote_count,
                sentiment_score=float(b.sentiment_score) if b.sentiment_score else None,
                hype_score=float(b.hype_score) if b.hype_score else None,
                top_emotes=b.top_emotes,
                language_distribution=b.language_distribution,
                created_at=b.created_at,
            )
            for b in buckets
        ],
        total=len(buckets),
        session_id=session_id,
    )


@router.get(
    "/sessions/{session_id}/stats",
    response_model=ChatAnalyticsSessionStats,
    summary="Get session chat summary",
)
async def get_session_chat_stats(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated chat statistics for a session.

    Includes total messages, unique chatters, sentiment averages,
    peak activity, and top emotes.
    """
    service = get_chat_service()
    return await service.get_session_stats(session_id, db)


# ============= Hype Moments =============

@router.get(
    "/hype-moments",
    response_model=HypeMomentListResponse,
    summary="List hype moments",
)
async def list_hype_moments(
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    trigger_type: Optional[HypeTriggerType] = Query(None, description="Filter by trigger type"),
    min_hype_score: Optional[float] = Query(None, ge=0, le=1, description="Minimum hype score"),
    start_time: Optional[datetime] = Query(None, description="Start time filter"),
    end_time: Optional[datetime] = Query(None, description="End time filter"),
    limit: int = Query(50, ge=1, le=200, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
):
    """
    List hype moments with optional filters.

    Hype moments are automatically detected significant events during streams
    such as big wins, chat spikes, and viewer surges.
    """
    detector = get_hype_detector()
    moments = await detector.get_hype_moments(
        db=db,
        session_id=session_id,
        trigger_type=trigger_type,
        min_hype_score=min_hype_score,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        offset=offset,
    )

    return HypeMomentListResponse(
        items=[
            HypeMomentResponse(
                id=m.id,
                session_id=m.session_id,
                detected_at=m.detected_at,
                trigger_type=HypeTriggerType(m.trigger_type),
                hype_score=float(m.hype_score) if m.hype_score else None,
                related_big_win_id=m.related_big_win_id,
                chat_velocity=m.chat_velocity,
                viewer_spike=m.viewer_spike,
                clip_url=m.clip_url,
                created_at=m.created_at,
            )
            for m in moments
        ],
        total=len(moments),
        session_id=session_id,
    )


@router.get(
    "/hype-moments/{hype_moment_id}",
    response_model=HypeMomentResponse,
    summary="Get hype moment details",
)
async def get_hype_moment(
    hype_moment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a specific hype moment.
    """
    detector = get_hype_detector()
    moments = await detector.get_hype_moments(db=db, limit=1)

    # Filter for specific ID (would use direct query in production)
    from sqlalchemy import select
    from app.models import HypeMoment

    result = await db.execute(
        select(HypeMoment).where(HypeMoment.id == hype_moment_id)
    )
    moment = result.scalar_one_or_none()

    if not moment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hype moment not found",
        )

    return HypeMomentResponse(
        id=moment.id,
        session_id=moment.session_id,
        detected_at=moment.detected_at,
        trigger_type=HypeTriggerType(moment.trigger_type),
        hype_score=float(moment.hype_score) if moment.hype_score else None,
        related_big_win_id=moment.related_big_win_id,
        chat_velocity=moment.chat_velocity,
        viewer_spike=moment.viewer_spike,
        clip_url=moment.clip_url,
        created_at=moment.created_at,
    )


@router.post(
    "/hype-moments",
    response_model=HypeMomentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create manual hype moment",
)
async def create_hype_moment(
    data: HypeMomentCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Manually create a hype moment.

    Use this for manually flagging significant moments that weren't
    automatically detected.
    """
    detector = get_hype_detector()

    # Create event
    from app.services.hype_moment_detector import HypeMomentEvent
    from uuid import uuid4

    event = HypeMomentEvent(
        id=str(uuid4()),
        session_id=data.session_id,
        detected_at=data.detected_at,
        trigger_type=data.trigger_type,
        hype_score=data.hype_score or 0.5,
        chat_velocity=data.chat_velocity,
        viewer_spike=data.viewer_spike,
        related_big_win_id=data.related_big_win_id,
        clip_url=data.clip_url,
    )

    moment = await detector.store_hype_moment(event, db)

    return HypeMomentResponse(
        id=moment.id,
        session_id=moment.session_id,
        detected_at=moment.detected_at,
        trigger_type=HypeTriggerType(moment.trigger_type),
        hype_score=float(moment.hype_score) if moment.hype_score else None,
        related_big_win_id=moment.related_big_win_id,
        chat_velocity=moment.chat_velocity,
        viewer_spike=moment.viewer_spike,
        clip_url=moment.clip_url,
        created_at=moment.created_at,
    )


@router.get(
    "/sessions/{session_id}/hype-summary",
    summary="Get session hype summary",
)
async def get_session_hype_summary(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a summary of hype moments for a session.

    Includes total count, breakdown by trigger type, timeline, and
    highest hype score achieved.
    """
    detector = get_hype_detector()
    return await detector.get_session_hype_summary(session_id, db)


# ============= Service Stats =============

@router.get(
    "/stats",
    summary="Get chat analytics service stats",
)
async def get_service_stats():
    """
    Get statistics about the chat analytics service.

    Useful for monitoring and debugging.
    """
    chat_service = get_chat_service()
    hype_detector = get_hype_detector()

    return {
        "chat_analytics": chat_service.get_stats(),
        "hype_detection": hype_detector.get_stats(),
    }

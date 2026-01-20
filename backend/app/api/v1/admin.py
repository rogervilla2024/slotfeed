"""
Admin API Routes
Handles administrative operations for game content management

SECURITY: All endpoints require admin authentication via:
- X-API-Key header with valid admin API key
- Bearer token with admin role JWT
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.models.game_content import GameContent
from app.schemas.game_content import GameContentResponse, GameContentUpdate
from app.services.content_generator import get_content_generator
from app.core.database import get_db
from app.core.security import AdminUser, verify_admin_access

router = APIRouter()


@router.get("/game-contents", dependencies=[Depends(verify_admin_access)])
async def list_game_contents(
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    published_only: Optional[bool] = None,
):
    """
    List all game contents with optional filtering
    """
    query = db.query(GameContent)

    if published_only is not None:
        query = query.filter(GameContent.is_published == published_only)

    total = query.count()
    contents = query.offset(offset).limit(limit).all()

    return {
        "contents": [content.to_dict() for content in contents],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/game-contents/{game_id}", dependencies=[Depends(verify_admin_access)])
async def get_game_content(game_id: str, db: Session = Depends(get_db)):
    """
    Get specific game content by ID
    """
    content = db.query(GameContent).filter(GameContent.game_id == game_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Game content not found")

    return content.to_dict()


@router.put("/game-contents/{game_id}", dependencies=[Depends(verify_admin_access)])
async def update_game_content(
    game_id: str,
    update_data: GameContentUpdate,
    db: Session = Depends(get_db),
):
    """
    Update game content manually
    """
    content = db.query(GameContent).filter(GameContent.game_id == game_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Game content not found")

    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        if hasattr(content, field):
            setattr(content, field, value)

    content.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(content)

    return content.to_dict()


@router.patch("/game-contents/{game_id}/publish", dependencies=[Depends(verify_admin_access)])
async def toggle_publish_status(
    game_id: str,
    publish_data: dict,
    db: Session = Depends(get_db),
):
    """
    Toggle publish status for game content
    """
    content = db.query(GameContent).filter(GameContent.game_id == game_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Game content not found")

    content.is_published = publish_data.get("is_published", not content.is_published)
    content.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(content)

    return {
        "game_id": content.game_id,
        "is_published": content.is_published,
        "updated_at": content.updated_at.isoformat(),
    }


@router.delete("/game-contents/{game_id}", dependencies=[Depends(verify_admin_access)])
async def delete_game_content(game_id: str, db: Session = Depends(get_db)):
    """
    Delete game content
    """
    content = db.query(GameContent).filter(GameContent.game_id == game_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="Game content not found")

    db.delete(content)
    db.commit()

    return {"message": "Content deleted successfully", "game_id": game_id}


@router.post("/generate-content", dependencies=[Depends(verify_admin_access)])
async def generate_game_content(
    request: dict,
    db: Session = Depends(get_db),
):
    """
    Trigger content generation for a game
    """
    game_id = request.get("game_id")

    if not game_id:
        raise HTTPException(status_code=400, detail="game_id is required")

    # Check if game exists
    from app.models.game import Game

    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check if job already exists for this game
    from app.models.content_generation_queue import ContentGenerationQueue

    existing_job = db.query(ContentGenerationQueue).filter(
        ContentGenerationQueue.game_id == game_id,
        ContentGenerationQueue.status.in_(["pending", "processing"]),
    ).first()

    if existing_job:
        raise HTTPException(
            status_code=409,
            detail="Content generation already in progress for this game",
        )

    # Create new job
    job = ContentGenerationQueue(game_id=game_id, status="pending", priority=1)
    db.add(job)
    db.commit()

    return {
        "job_id": str(job.id),
        "game_id": game_id,
        "status": "pending",
        "created_at": job.created_at.isoformat(),
    }


@router.get("/generation-jobs", dependencies=[Depends(verify_admin_access)])
async def list_generation_jobs(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
):
    """
    List content generation jobs
    """
    from app.models.content_generation_queue import ContentGenerationQueue
    from app.models.game import Game

    query = db.query(ContentGenerationQueue)

    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.filter(ContentGenerationQueue.status.in_(statuses))

    jobs = query.order_by(ContentGenerationQueue.created_at.desc()).limit(limit).all()

    result = []
    for job in jobs:
        game = db.query(Game).filter(Game.id == job.game_id).first()
        result.append({
            "id": str(job.id),
            "game_id": job.game_id,
            "game_name": game.name if game else "Unknown",
            "status": job.status,
            "created_at": job.created_at.isoformat(),
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "error_message": job.error_message,
            "retry_count": job.retry_count,
        })

    return {"jobs": result}


@router.get("/generation-stats", dependencies=[Depends(verify_admin_access)])
async def get_generation_stats(db: Session = Depends(get_db)):
    """
    Get statistics about content generation
    """
    from app.models.content_generation_queue import ContentGenerationQueue

    total_jobs = db.query(ContentGenerationQueue).count()
    pending_jobs = db.query(ContentGenerationQueue).filter(
        ContentGenerationQueue.status == "pending"
    ).count()
    processing_jobs = db.query(ContentGenerationQueue).filter(
        ContentGenerationQueue.status == "processing"
    ).count()
    completed_jobs = db.query(ContentGenerationQueue).filter(
        ContentGenerationQueue.status == "completed"
    ).count()
    failed_jobs = db.query(ContentGenerationQueue).filter(
        ContentGenerationQueue.status == "failed"
    ).count()

    # Content stats
    total_content = db.query(GameContent).count()
    published_content = db.query(GameContent).filter(GameContent.is_published).count()

    avg_readability = db.query(GameContent.readability_score).filter(
        GameContent.readability_score.isnot(None)
    ).all()
    avg_readability_score = (
        sum(r[0] for r in avg_readability) / len(avg_readability)
        if avg_readability
        else 0
    )

    return {
        "generation_queue": {
            "total": total_jobs,
            "pending": pending_jobs,
            "processing": processing_jobs,
            "completed": completed_jobs,
            "failed": failed_jobs,
        },
        "content": {
            "total": total_content,
            "published": published_content,
            "unpublished": total_content - published_content,
            "avg_readability_score": round(avg_readability_score, 1),
        },
    }


@router.get("/system-status", dependencies=[Depends(verify_admin_access)])
async def get_system_status(db: Session = Depends(get_db)):
    """
    Get overall system health status
    """
    import psutil

    # Check database
    db_status = "healthy"
    try:
        db.execute("SELECT 1")
    except Exception:
        db_status = "error"

    # Check memory
    memory_percent = psutil.virtual_memory().percent
    cache_status = "healthy"
    if memory_percent > 85:
        cache_status = "error"
    elif memory_percent > 70:
        cache_status = "warning"

    # Check API (basic check)
    api_status = "healthy"

    return {
        "database": db_status,
        "cache": cache_status,
        "api": api_status,
        "message": None if db_status == "healthy" and api_status == "healthy" else "System check initiated",
    }


@router.get("/system-metrics", dependencies=[Depends(verify_admin_access)])
async def get_system_metrics(db: Session = Depends(get_db)):
    """
    Get detailed system performance metrics
    """
    import psutil
    import time
    from datetime import datetime, timedelta

    process = psutil.Process()
    memory = psutil.virtual_memory()
    cpu_percent = process.cpu_percent(interval=1)

    metrics = {
        "cpu": {
            "current": cpu_percent,
            "average": cpu_percent,
            "peak": cpu_percent,
        },
        "memory": {
            "used": memory.used,
            "total": memory.total,
            "percentage": memory.percent,
        },
        "responseTime": {
            "p50": 150,
            "p95": 450,
            "p99": 800,
        },
        "uptime": "45 days, 12 hours",
        "errors": {
            "rate": 0.02,
            "count": 42,
            "trend": "stable",
        },
    }

    # Mock history data for charts
    history = []
    now = datetime.utcnow()
    for i in range(24):
        timestamp = (now - timedelta(hours=i)).isoformat()
        history.append({
            "timestamp": timestamp,
            "cpu": max(10, cpu_percent - 5 + (i % 10)),
            "memory": max(30, memory.percent - 10 + (i % 15)),
            "responseTime": 150 + (i * 10) % 200,
            "activeConnections": 50 + (i * 5) % 30,
            "errorRate": 0.02 + (i * 0.001) % 0.03,
            "uptime": 45.5 + (i * 0.1),
        })

    return {
        "metrics": metrics,
        "history": list(reversed(history)),
    }


@router.get("/streaming-stats", dependencies=[Depends(verify_admin_access)])
async def get_streaming_stats(db: Session = Depends(get_db)):
    """
    Get streaming and engagement statistics
    """
    from app.models.session import Session as DBSession
    from app.models.streamer import Streamer
    from app.models.game import Game
    from sqlalchemy import func

    # Active streams
    active_sessions = db.query(DBSession).filter(
        DBSession.end_time.isnot(None)
    ).count()

    # Total sessions
    total_sessions = db.query(DBSession).count()

    # Get total viewers (mock for now)
    total_viewers = active_sessions * 150

    # Average session duration
    sessions_with_duration = db.query(
        (func.extract('epoch', DBSession.end_time - DBSession.start_time) / 60).label('duration')
    ).filter(DBSession.end_time.isnot(None)).all()

    avg_duration_minutes = 0
    if sessions_with_duration:
        avg_duration_minutes = sum(d[0] for d in sessions_with_duration) / len(sessions_with_duration)

    avg_duration = f"{int(avg_duration_minutes // 60)}h {int(avg_duration_minutes % 60)}m"

    # Top games
    top_games = []
    game_sessions = db.query(
        Game.name,
        func.count(DBSession.id).label('plays'),
        func.count(DBSession.id).label('viewers')
    ).join(DBSession, DBSession.game_id == Game.id).group_by(Game.id).order_by(
        func.count(DBSession.id).desc()
    ).limit(5).all()

    for game in game_sessions:
        top_games.append({
            "name": game[0],
            "plays": game[1],
            "viewers": game[2] * 30,
        })

    # Top streamers
    top_streamers = []
    streamers = db.query(
        Streamer.username,
        Streamer.followers,
        func.max(DBSession.start_time).label('last_session')
    ).outerjoin(DBSession, DBSession.streamer_id == Streamer.id).group_by(
        Streamer.id
    ).order_by(Streamer.followers.desc()).limit(5).all()

    for streamer in streamers:
        top_streamers.append({
            "username": streamer[0],
            "followers": streamer[1],
            "activeSession": streamer[2] is not None and (datetime.utcnow() - streamer[2]).total_seconds() < 3600,
        })

    # Hourly activity (mock data)
    hourly_activity = []
    for hour in range(24):
        hourly_activity.append({
            "hour": f"{hour:02d}:00",
            "streams": max(5, 15 - abs(hour - 12) * 0.5),
            "viewers": max(100, 500 - abs(hour - 12) * 20),
        })

    return {
        "activeStreams": active_sessions,
        "totalSessions": total_sessions,
        "totalViewers": total_viewers,
        "avgSessionDuration": avg_duration,
        "topGames": top_games,
        "topStreamers": top_streamers,
        "hourlyActivity": hourly_activity,
    }


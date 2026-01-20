"""
Phase 13-4: Dashboard API Endpoints

Provides real-time dashboard data including:
- Game snapshots and metrics
- Alert management
- Performance monitoring
- WebSocket subscription management
"""

from fastapi import APIRouter, WebSocket, Query, HTTPException
from typing import Optional, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()

# Dashboard service instance (would be dependency injected in production)
dashboard_service = None
dashboard_aggregation = None


@router.get("/dashboard/state")
async def get_dashboard_state():
    """
    Get complete dashboard state with all games, alerts, and metrics.

    Returns:
        Dictionary with:
        - metrics: Aggregated performance metrics
        - alerts: Recent alerts
        - games: Game snapshots
        - timestamp: Last update time
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    return await dashboard_service.get_dashboard_state()


@router.get("/dashboard/metrics")
async def get_dashboard_metrics():
    """
    Get aggregated dashboard metrics.

    Returns:
        - total_games_tracked: Number of games being tracked
        - games_with_anomalies: Count of games with detected anomalies
        - active_opportunities: Count of hot/favorable games
        - avg_rtp: Average RTP across all games
        - highest_rtp: Highest RTP observed
        - lowest_rtp: Lowest RTP observed
        - total_predictions: Total predictions made
        - accuracy_rate: Model accuracy on predictions
        - timestamp: Last update time
    """
    if not dashboard_service or not dashboard_service.metrics:
        return {
            "total_games_tracked": 0,
            "games_with_anomalies": 0,
            "active_opportunities": 0,
            "avg_rtp": 96.5,
            "highest_rtp": 96.5,
            "lowest_rtp": 96.5,
            "total_predictions": 0,
            "accuracy_rate": 0,
            "timestamp": datetime.utcnow().isoformat(),
        }

    return dashboard_service.metrics.to_dict()


@router.get("/dashboard/alerts")
async def get_alerts(
    game_id: Optional[str] = Query(None, description="Filter by game ID"),
    severity: Optional[str] = Query(
        None,
        description="Filter by severity: info, low, medium, high, critical"
    ),
    limit: int = Query(50, ge=1, le=100, description="Number of alerts to return"),
):
    """
    Get recent alerts with optional filtering.

    Query Parameters:
        - game_id: Filter alerts for specific game
        - severity: Minimum severity level to return
        - limit: Number of alerts (max 100)

    Returns:
        List of alerts with type, severity, message, and recommendation
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    from backend.app.services.realtime_dashboard import AlertSeverity

    severity_enum = None
    if severity:
        try:
            severity_enum = AlertSeverity(severity)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid severity level")

    alerts = await dashboard_service.get_recent_alerts(
        game_id=game_id,
        severity=severity_enum,
        limit=limit,
    )

    return {
        "count": len(alerts),
        "alerts": [a.to_dict() for a in alerts],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/dashboard/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """
    Mark an alert as read/acknowledged.

    Parameters:
        - alert_id: Alert ID to acknowledge

    Returns:
        - success: Whether acknowledgement was successful
        - message: Status message
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    await dashboard_service.acknowledge_alert(alert_id)

    return {
        "success": True,
        "message": f"Alert {alert_id} acknowledged",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/dashboard/games")
async def get_all_game_snapshots():
    """
    Get real-time snapshots for all tracked games.

    Returns:
        List of game snapshots with:
        - game_id, game_name
        - current_rtp, theoretical_rtp
        - volatility, trend, status (hot/cold/normal)
        - bonus probability, prediction confidence
        - anomaly score
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    return {
        "count": len(dashboard_service.game_snapshots),
        "games": [
            s.to_dict()
            for s in dashboard_service.game_snapshots.values()
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/dashboard/games/{game_id}")
async def get_game_snapshot(game_id: str):
    """
    Get real-time snapshot for a specific game.

    Parameters:
        - game_id: Game ID

    Returns:
        Game snapshot with all metrics
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    if game_id not in dashboard_service.game_snapshots:
        raise HTTPException(status_code=404, detail="Game not found")

    return {
        "game": dashboard_service.game_snapshots[game_id].to_dict(),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/dashboard/opportunities")
async def get_opportunities(
    limit: int = Query(10, ge=1, le=50, description="Number of opportunities to return"),
):
    """
    Get top opportunities (hot games with favorable predictions).

    Query Parameters:
        - limit: Number of opportunities to return

    Returns:
        List of games ranked by opportunity score
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    # Filter for hot games with high prediction confidence
    opportunities = [
        s for s in dashboard_service.game_snapshots.values()
        if s.status == "hot" and s.prediction_confidence > 0.65
    ]

    # Sort by prediction confidence descending
    opportunities.sort(
        key=lambda x: (x.prediction_confidence, x.current_rtp - x.theoretical_rtp),
        reverse=True
    )

    return {
        "count": len(opportunities),
        "opportunities": [o.to_dict() for o in opportunities[:limit]],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/dashboard/risk-zones")
async def get_risk_zones(
    threshold: float = Query(
        0.7,
        ge=0,
        le=1,
        description="Anomaly score threshold for risk zones"
    ),
):
    """
    Get games with high anomaly scores (risk zones to avoid).

    Query Parameters:
        - threshold: Minimum anomaly score (0-1)

    Returns:
        List of games with anomaly scores above threshold
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    risk_zones = [
        s for s in dashboard_service.game_snapshots.values()
        if s.anomaly_score >= threshold
    ]

    risk_zones.sort(key=lambda x: x.anomaly_score, reverse=True)

    return {
        "count": len(risk_zones),
        "threshold": threshold,
        "risk_zones": [z.to_dict() for z in risk_zones],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/dashboard/performance-summary")
async def get_performance_summary():
    """
    Get summary of dashboard performance and health.

    Returns:
        - model_accuracy: Overall model accuracy
        - prediction_count: Total predictions made
        - alert_count: Total active alerts
        - games_tracked: Number of games being tracked
        - uptime: Service uptime
        - last_update: Last data update time
    """
    if not dashboard_service:
        raise HTTPException(status_code=503, detail="Dashboard service unavailable")

    metrics = dashboard_service.metrics

    return {
        "model_accuracy": metrics.accuracy_rate if metrics else 0.0,
        "prediction_count": metrics.total_predictions if metrics else 0,
        "alert_count": len(dashboard_service.alerts),
        "games_tracked": len(dashboard_service.game_snapshots),
        "alerts_by_severity": {
            "critical": len([a for a in dashboard_service.alerts.values() if a.severity.value == "critical"]),
            "high": len([a for a in dashboard_service.alerts.values() if a.severity.value == "high"]),
            "medium": len([a for a in dashboard_service.alerts.values() if a.severity.value == "medium"]),
            "low": len([a for a in dashboard_service.alerts.values() if a.severity.value == "low"]),
            "info": len([a for a in dashboard_service.alerts.values() if a.severity.value == "info"]),
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


# =====================================================
# WebSocket Endpoints
# =====================================================

@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard updates.

    Client can subscribe to:
    - "dashboard:metrics" - Dashboard metrics updates
    - "dashboard:alerts" - New alerts
    - "dashboard:games" - Game updates
    - "game:{game_id}" - Specific game updates

    Message format:
    {
        "action": "subscribe" | "unsubscribe",
        "channel": "channel_name"
    }
    """
    if not dashboard_service:
        await websocket.close(code=1011, reason="Dashboard service unavailable")
        return

    client_id = str(id(websocket))
    subscriptions = set()

    try:
        await websocket.accept()
        logger.info(f"WebSocket client {client_id} connected")

        # Send initial dashboard state
        state = await dashboard_service.get_dashboard_state()
        await websocket.send_json({
            "type": "initial_state",
            "data": state,
        })

        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            channel = data.get("channel")

            if action == "subscribe":
                subscriptions.add(channel)
                logger.info(f"Client {client_id} subscribed to {channel}")

                # Send current state for subscribed channel
                if channel.startswith("game:"):
                    game_id = channel.split(":", 1)[1]
                    if game_id in dashboard_service.game_snapshots:
                        await websocket.send_json({
                            "type": "game_snapshot",
                            "data": dashboard_service.game_snapshots[game_id].to_dict(),
                        })

            elif action == "unsubscribe":
                subscriptions.discard(channel)
                logger.info(f"Client {client_id} unsubscribed from {channel}")

    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
    finally:
        logger.info(f"WebSocket client {client_id} disconnected")


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """
    WebSocket endpoint for real-time alert streaming.

    Streams all new alerts as they are generated.

    Message format:
    {
        "type": "alert",
        "data": { alert object }
    }
    """
    if not dashboard_service:
        await websocket.close(code=1011, reason="Dashboard service unavailable")
        return

    client_id = str(id(websocket))

    try:
        await websocket.accept()
        logger.info(f"Alert WebSocket client {client_id} connected")

        while True:
            try:
                # Get alert from queue with timeout
                alert = await asyncio.wait_for(
                    dashboard_service.alert_queue.get(),
                    timeout=60
                )

                await websocket.send_json({
                    "type": "alert",
                    "data": alert.to_dict(),
                })

            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({
                    "type": "ping",
                    "timestamp": datetime.utcnow().isoformat(),
                })

    except Exception as e:
        logger.error(f"Alert WebSocket error for client {client_id}: {e}")
    finally:
        logger.info(f"Alert WebSocket client {client_id} disconnected")

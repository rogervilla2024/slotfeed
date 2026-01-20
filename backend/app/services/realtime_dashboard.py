"""
Phase 13-4: Real-Time Dashboard Service

Manages WebSocket connections and broadcasts:
- Live predictions updates
- Anomaly alerts
- Opportunity notifications
- Performance metrics
"""

import asyncio
import logging
import json
from typing import Dict, List, Set, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import uuid

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Types of alerts"""
    RTP_SPIKE = "rtp_spike"
    RTP_DROP = "rtp_drop"
    BONUS_DROUGHT = "bonus_drought"
    BONUS_CLUSTERING = "bonus_clustering"
    VARIANCE_EXCESS = "variance_excess"
    OPPORTUNITY = "opportunity"
    PREDICTION_UPDATE = "prediction_update"
    PERFORMANCE_MILESTONE = "performance_milestone"
    RISK_WARNING = "risk_warning"


@dataclass
class DashboardAlert:
    """Real-time alert for dashboard display"""
    id: str
    type: AlertType
    severity: AlertSeverity
    game_id: Optional[str]
    title: str
    message: str
    value: float
    recommendation: str
    timestamp: datetime
    read: bool = False

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type.value,
            "severity": self.severity.value,
            "game_id": self.game_id,
            "title": self.title,
            "message": self.message,
            "value": self.value,
            "recommendation": self.recommendation,
            "timestamp": self.timestamp.isoformat(),
            "read": self.read,
        }


@dataclass
class DashboardMetrics:
    """Aggregated metrics for dashboard"""
    total_games_tracked: int
    games_with_anomalies: int
    active_opportunities: int
    avg_rtp: float
    highest_rtp: float
    lowest_rtp: float
    total_predictions: int
    accuracy_rate: float
    timestamp: datetime

    def to_dict(self):
        return {
            "total_games_tracked": self.total_games_tracked,
            "games_with_anomalies": self.games_with_anomalies,
            "active_opportunities": self.active_opportunities,
            "avg_rtp": self.avg_rtp,
            "highest_rtp": self.highest_rtp,
            "lowest_rtp": self.lowest_rtp,
            "total_predictions": self.total_predictions,
            "accuracy_rate": self.accuracy_rate,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class GameSnapshot:
    """Real-time game state snapshot"""
    game_id: str
    game_name: str
    current_rtp: float
    theoretical_rtp: float
    volatility: str
    last_bonus_spins: int
    bonus_probability_next_100: float
    prediction_confidence: float
    anomaly_score: float
    trend: str  # up, down, stable
    status: str  # hot, cold, normal
    timestamp: datetime

    def to_dict(self):
        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "current_rtp": self.current_rtp,
            "theoretical_rtp": self.theoretical_rtp,
            "volatility": self.volatility,
            "last_bonus_spins": self.last_bonus_spins,
            "bonus_probability_next_100": self.bonus_probability_next_100,
            "prediction_confidence": self.prediction_confidence,
            "anomaly_score": self.anomaly_score,
            "trend": self.trend,
            "status": self.status,
            "timestamp": self.timestamp.isoformat(),
        }


class RealtimeDashboardService:
    """
    Manages real-time dashboard updates via WebSocket.
    Handles alert generation, metrics aggregation, and client subscriptions.
    """

    def __init__(self):
        self.connections: Dict[str, Set[str]] = {}  # game_id -> set of client_ids
        self.alert_queue: asyncio.Queue = asyncio.Queue()
        self.alerts: Dict[str, DashboardAlert] = {}  # alert_id -> alert
        self.game_snapshots: Dict[str, GameSnapshot] = {}  # game_id -> snapshot
        self.metrics: Optional[DashboardMetrics] = None
        self.max_alerts = 1000

    async def subscribe_game(self, client_id: str, game_id: str):
        """Subscribe client to real-time updates for a specific game"""
        if game_id not in self.connections:
            self.connections[game_id] = set()
        self.connections[game_id].add(client_id)
        logger.info(f"Client {client_id} subscribed to {game_id}")

    async def unsubscribe_game(self, client_id: str, game_id: str):
        """Unsubscribe client from game updates"""
        if game_id in self.connections:
            self.connections[game_id].discard(client_id)
            if not self.connections[game_id]:
                del self.connections[game_id]
        logger.info(f"Client {client_id} unsubscribed from {game_id}")

    async def broadcast_game_update(self, game_snapshot: GameSnapshot):
        """Broadcast game snapshot to all subscribed clients"""
        self.game_snapshots[game_snapshot.game_id] = game_snapshot

        if game_snapshot.game_id in self.connections:
            update = {
                "type": "game_update",
                "data": game_snapshot.to_dict(),
            }
            # In production, send to WebSocket clients
            logger.debug(f"Broadcasting update for {game_snapshot.game_id}")

    async def create_alert(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        game_id: Optional[str],
        title: str,
        message: str,
        value: float,
        recommendation: str,
    ) -> DashboardAlert:
        """Create and broadcast an alert"""
        alert = DashboardAlert(
            id=str(uuid.uuid4()),
            type=alert_type,
            severity=severity,
            game_id=game_id,
            title=title,
            message=message,
            value=value,
            recommendation=recommendation,
            timestamp=datetime.utcnow(),
        )

        self.alerts[alert.id] = alert
        await self.alert_queue.put(alert)

        # Maintain max alerts
        if len(self.alerts) > self.max_alerts:
            oldest = min(self.alerts.items(), key=lambda x: x[1].timestamp)
            del self.alerts[oldest[0]]

        logger.info(f"Alert created: {alert.type.value} - {alert.title}")
        return alert

    async def get_recent_alerts(
        self,
        game_id: Optional[str] = None,
        severity: Optional[AlertSeverity] = None,
        limit: int = 50,
    ) -> List[DashboardAlert]:
        """Retrieve recent alerts, optionally filtered"""
        alerts = list(self.alerts.values())

        # Filter by game
        if game_id:
            alerts = [a for a in alerts if a.game_id == game_id]

        # Filter by severity
        if severity:
            severity_levels = {
                AlertSeverity.CRITICAL: 4,
                AlertSeverity.HIGH: 3,
                AlertSeverity.MEDIUM: 2,
                AlertSeverity.LOW: 1,
                AlertSeverity.INFO: 0,
            }
            severity_threshold = severity_levels[severity]
            alerts = [
                a for a in alerts
                if severity_levels.get(a.severity, 0) >= severity_threshold
            ]

        # Sort by timestamp descending
        alerts.sort(key=lambda a: a.timestamp, reverse=True)
        return alerts[:limit]

    async def acknowledge_alert(self, alert_id: str):
        """Mark alert as read"""
        if alert_id in self.alerts:
            self.alerts[alert_id].read = True
            logger.debug(f"Alert {alert_id} acknowledged")

    async def update_metrics(
        self,
        total_games: int,
        games_with_anomalies: int,
        active_opportunities: int,
        avg_rtp: float,
        highest_rtp: float,
        lowest_rtp: float,
        total_predictions: int,
        accuracy_rate: float,
    ):
        """Update dashboard metrics"""
        self.metrics = DashboardMetrics(
            total_games_tracked=total_games,
            games_with_anomalies=games_with_anomalies,
            active_opportunities=active_opportunities,
            avg_rtp=avg_rtp,
            highest_rtp=highest_rtp,
            lowest_rtp=lowest_rtp,
            total_predictions=total_predictions,
            accuracy_rate=accuracy_rate,
            timestamp=datetime.utcnow(),
        )
        logger.debug("Dashboard metrics updated")

    async def get_dashboard_state(self) -> Dict:
        """Get complete dashboard state"""
        return {
            "metrics": self.metrics.to_dict() if self.metrics else None,
            "alerts": [a.to_dict() for a in sorted(
                self.alerts.values(),
                key=lambda a: a.timestamp,
                reverse=True
            )[:50]],
            "games": [s.to_dict() for s in self.game_snapshots.values()],
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def detect_and_alert_anomalies(
        self,
        anomalies: List[Dict],
        game_info: Dict,
    ):
        """Convert detected anomalies into dashboard alerts"""
        for anomaly in anomalies:
            severity_map = {
                "low": AlertSeverity.LOW,
                "medium": AlertSeverity.MEDIUM,
                "high": AlertSeverity.HIGH,
                "critical": AlertSeverity.CRITICAL,
            }

            # Map anomaly type to alert type
            anomaly_type_map = {
                "rtp_spike": AlertType.RTP_SPIKE,
                "rtp_drop": AlertType.RTP_DROP,
                "bonus_drought": AlertType.BONUS_DROUGHT,
                "bonus_clustering": AlertType.BONUS_CLUSTERING,
                "variance_excess": AlertType.VARIANCE_EXCESS,
            }

            alert_type = anomaly_type_map.get(
                anomaly.get("type"),
                AlertType.PREDICTION_UPDATE
            )
            severity = severity_map.get(
                anomaly.get("severity", "medium"),
                AlertSeverity.MEDIUM
            )

            # Generate recommendation based on anomaly type
            recommendations = {
                AlertType.RTP_SPIKE: "Game is hot! Consider increasing your stake.",
                AlertType.RTP_DROP: "Game is cold. You might want to switch games.",
                AlertType.BONUS_DROUGHT: "Bonus overdue. It could hit soon. Be patient.",
                AlertType.BONUS_CLUSTERING: "Bonuses are clustering. Watch for patterns.",
                AlertType.VARIANCE_EXCESS: "High volatility detected. Increase bankroll buffer.",
            }

            recommendation = recommendations.get(
                alert_type,
                "Adjust your strategy based on current conditions."
            )

            await self.create_alert(
                alert_type=alert_type,
                severity=severity,
                game_id=game_info.get("game_id"),
                title=f"{anomaly.get('type', 'Anomaly').upper()} Detected",
                message=anomaly.get("description", ""),
                value=anomaly.get("score", 0),
                recommendation=recommendation,
            )

    def get_game_status(self, rtp: float, theoretical_rtp: float) -> str:
        """Determine if game is hot, cold, or normal"""
        diff = rtp - theoretical_rtp
        if diff > 2.0:
            return "hot"
        elif diff < -2.0:
            return "cold"
        else:
            return "normal"

    def get_trend(self, current: float, previous: float) -> str:
        """Determine trend direction"""
        diff = current - previous
        if diff > 0.5:
            return "up"
        elif diff < -0.5:
            return "down"
        else:
            return "stable"


class DashboardAggregationService:
    """Aggregates data from all ML services for dashboard display"""

    def __init__(self, realtime_service: RealtimeDashboardService):
        self.realtime = realtime_service
        self.update_interval = 60  # seconds

    async def update_game_snapshot(
        self,
        game_id: str,
        game_name: str,
        current_stats: Dict,
        predictions: Dict,
        anomalies: List[Dict],
    ):
        """Create and broadcast game snapshot"""
        current_rtp = current_stats.get("rtp", 96.5)
        theoretical_rtp = current_stats.get("theoretical_rtp", 96.5)
        volatility = current_stats.get("volatility", "high")
        last_bonus_spins = current_stats.get("last_bonus_spins", 0)

        # Get prediction data
        bonus_pred = predictions.get("bonus_hit")
        prediction_confidence = bonus_pred.get("confidence", 0) if bonus_pred else 0

        # Calculate anomaly score
        anomaly_score = max(
            [a.get("score", 0) for a in anomalies],
            default=0
        )

        # Create snapshot
        snapshot = GameSnapshot(
            game_id=game_id,
            game_name=game_name,
            current_rtp=current_rtp,
            theoretical_rtp=theoretical_rtp,
            volatility=volatility,
            last_bonus_spins=last_bonus_spins,
            bonus_probability_next_100=(
                bonus_pred.get("probability_next_100spins", 0)
                if bonus_pred else 0
            ),
            prediction_confidence=prediction_confidence,
            anomaly_score=anomaly_score,
            trend=self.realtime.get_trend(
                current_rtp,
                current_stats.get("previous_rtp", current_rtp)
            ),
            status=self.realtime.get_game_status(current_rtp, theoretical_rtp),
            timestamp=datetime.utcnow(),
        )

        await self.realtime.broadcast_game_update(snapshot)

        # Create alerts for significant anomalies
        if anomalies:
            await self.realtime.detect_and_alert_anomalies(anomalies, {
                "game_id": game_id,
                "game_name": game_name,
            })

    async def update_dashboard_metrics(self, games_data: List[Dict]):
        """Aggregate metrics from all games"""
        if not games_data:
            return

        rtps = [g.get("current_rtp", 96.5) for g in games_data]
        anomaly_games = [g for g in games_data if g.get("has_anomalies", False)]

        # Count opportunities (hot slots + high predictions)
        opportunities = len([
            g for g in games_data
            if self.realtime.get_game_status(
                g.get("current_rtp", 96.5),
                g.get("theoretical_rtp", 96.5)
            ) == "hot"
        ])

        await self.realtime.update_metrics(
            total_games=len(games_data),
            games_with_anomalies=len(anomaly_games),
            active_opportunities=opportunities,
            avg_rtp=sum(rtps) / len(rtps) if rtps else 96.5,
            highest_rtp=max(rtps) if rtps else 96.5,
            lowest_rtp=min(rtps) if rtps else 96.5,
            total_predictions=sum(
                1 for g in games_data if g.get("predictions")
            ),
            accuracy_rate=0.82,  # Would be calculated from historical data
        )

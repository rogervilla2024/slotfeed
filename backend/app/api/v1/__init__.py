from fastapi import APIRouter
from .streamers import router as streamers_router
from .games import router as games_router
from .live import router as live_router
from .websocket import router as websocket_router
from .alerts import router as alerts_router
from .bonus_hunts import router as bonus_hunts_router
from .chat_analytics import router as chat_analytics_router
from .hot_cold import router as hot_cold_router
from .sessions import router as sessions_router
from .discord import router as discord_router
from .admin import router as admin_router
from .ml_analytics import router as ml_analytics_router
from .dashboard import router as dashboard_router
from .health import router as health_router

router = APIRouter()

router.include_router(streamers_router, prefix="/streamers", tags=["streamers"])
router.include_router(games_router, prefix="/games", tags=["games"])
router.include_router(live_router, prefix="/live", tags=["live"])
router.include_router(sessions_router, prefix="/sessions", tags=["sessions"])
router.include_router(websocket_router, prefix="/ws", tags=["websocket"])
router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
router.include_router(bonus_hunts_router)
router.include_router(chat_analytics_router)
router.include_router(hot_cold_router)
router.include_router(ml_analytics_router, prefix="/ml-analytics", tags=["ml-analytics"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
router.include_router(discord_router)
router.include_router(admin_router, prefix="/admin", tags=["admin"])
router.include_router(health_router)

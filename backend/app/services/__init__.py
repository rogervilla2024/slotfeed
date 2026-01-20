# Service layer for business logic

from app.services.kick_api import kick_api, KickAPIClient, KickChannel, KickLivestream
from app.services.stream_monitor import stream_monitor, StreamMonitor, initialize_stream_monitor
from app.services.stream_capture import stream_capture, StreamCapture, CaptureConfig
from app.services.cache import cache_service, CacheService
from app.services.balance_processor import (
    balance_processor,
    BalanceProcessor,
    BalanceReading,
    ProcessedBalanceEvent,
)
from app.services.big_win_detector import (
    BigWinDetector,
    BigWinEvent,
    BigWinTier,
    DetectorConfig,
)
from app.services.telegram_bot import (
    TelegramBotService,
    get_telegram_bot,
    NotificationResult,
    MessageType,
)
from app.services.notification_service import (
    NotificationService,
    get_notification_service,
    AlertType,
    NotificationChannel,
    DeliveryResult,
)
from app.services.chat_analytics_service import (
    ChatAnalyticsService,
    ChatAnalyticsConfig,
    ChatBucket,
    create_chat_analytics_service,
)
from app.services.hype_moment_detector import (
    HypeMomentDetector,
    HypeMomentEvent,
    DetectorThresholds,
    create_hype_detector,
)
from app.services.hot_cold_service import (
    HotColdService,
    HotColdServiceConfig,
    create_hot_cold_service,
    get_hot_cold_service,
)
from app.services.youtube_hybrid import (
    YouTubeHybridService,
    get_youtube_hybrid_service,
)

__all__ = [
    # Kick API
    "kick_api",
    "KickAPIClient",
    "KickChannel",
    "KickLivestream",
    # Stream Monitor
    "stream_monitor",
    "StreamMonitor",
    "initialize_stream_monitor",
    # Stream Capture
    "stream_capture",
    "StreamCapture",
    "CaptureConfig",
    # Cache
    "cache_service",
    "CacheService",
    # Balance Processing
    "balance_processor",
    "BalanceProcessor",
    "BalanceReading",
    "ProcessedBalanceEvent",
    # Big Win Detection
    "BigWinDetector",
    "BigWinEvent",
    "BigWinTier",
    "DetectorConfig",
    # Telegram Bot
    "TelegramBotService",
    "get_telegram_bot",
    "NotificationResult",
    "MessageType",
    # Notification Service
    "NotificationService",
    "get_notification_service",
    "AlertType",
    "NotificationChannel",
    "DeliveryResult",
    # Chat Analytics
    "ChatAnalyticsService",
    "ChatAnalyticsConfig",
    "ChatBucket",
    "create_chat_analytics_service",
    # Hype Moment Detection
    "HypeMomentDetector",
    "HypeMomentEvent",
    "DetectorThresholds",
    "create_hype_detector",
    # Hot/Cold Service
    "HotColdService",
    "HotColdServiceConfig",
    "create_hot_cold_service",
    "get_hot_cold_service",
    # YouTube Hybrid Service
    "YouTubeHybridService",
    "get_youtube_hybrid_service",
]

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "SlotFeed API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # OCR Settings
    OCR_CONFIDENCE_THRESHOLD: float = 0.85
    FRAME_CAPTURE_FPS: float = 0.2
    CHANGE_DETECTION_THRESHOLD: float = 0.05

    # Stream Settings
    STREAM_CHECK_INTERVAL: int = 30  # seconds

    # Storage
    R2_BUCKET_URL: str = ""
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""

    # Notifications
    TELEGRAM_BOT_TOKEN: str = ""
    DISCORD_BOT_TOKEN: str = ""

    # Platform APIs
    TWITCH_CLIENT_ID: str = ""
    TWITCH_CLIENT_SECRET: str = ""
    YOUTUBE_API_KEY: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

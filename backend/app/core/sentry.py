"""
Sentry error tracking configuration for FastAPI backend
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlAlchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
import os
from datetime import datetime


def init_sentry():
    """Initialize Sentry SDK for the FastAPI application"""

    sentry_dsn = os.getenv("SENTRY_DSN", "")

    if not sentry_dsn:
        print("⚠️  Sentry DSN not configured. Error tracking disabled.")
        return

    environment = os.getenv("ENVIRONMENT", "development")
    app_version = os.getenv("APP_VERSION", "unknown")

    def before_send_sentry(event, hint):
        """Filter and customize events before sending to Sentry"""

        # Don't send info-level events
        if event.get("level") == "info":
            return None

        # Filter out health check endpoint errors
        if "request" in event:
            url = event["request"].get("url", "")
            if "/health" in url or "/metrics" in url:
                return None

        # Filter out 404 errors
        if event.get("tags", {}).get("http_status") == "404":
            return None

        # Don't send if marked as ignored
        exception = hint.get("exc_info")
        if exception:
            exc_type = exception[0]
            if issubclass(exc_type, (KeyboardInterrupt, SystemExit)):
                return None

        # Add timestamp
        event["timestamp"] = datetime.utcnow().isoformat()

        return event

    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FastApiIntegration(),
                SqlAlchemyIntegration(),
                RedisIntegration(),
            ],
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
            environment=environment,
            release=f"slotfeed@{app_version}",
            before_send=before_send_sentry,
            # Performance monitoring
            enable_tracing=True,
            # Attach stack traces
            attach_stacktrace=True,
            # Send personal information (turn off in production)
            send_default_pii=False,
            # Max breadcrumbs
            max_breadcrumbs=100,
            # Exception backtrace limit
            request_bodies="medium",
        )

        print(f"✅ Sentry initialized for environment: {environment}")

    except Exception as e:
        print(f"❌ Failed to initialize Sentry: {e}")


def capture_exception(exception: Exception, **kwargs):
    """Capture an exception in Sentry"""
    sentry_sdk.capture_exception(exception, **kwargs)


def capture_message(message: str, level="info"):
    """Capture a message in Sentry"""
    sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: str, email: str = None, username: str = None):
    """Set user context for Sentry tracking"""
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username,
    })


def add_breadcrumb(message: str, category: str = "info", level: str = "info", data: dict = None):
    """Add a breadcrumb for request tracking"""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {},
    )


def set_tags(tags: dict):
    """Set tags for event context"""
    for key, value in tags.items():
        sentry_sdk.set_tag(key, value)


def set_extra(extra: dict):
    """Set extra context for events"""
    sentry_sdk.set_context("extra", extra)

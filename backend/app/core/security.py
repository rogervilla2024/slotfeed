"""
Security utilities for authentication and authorization.

This module provides:
- JWT token handling
- API key authentication
- Admin authentication dependency
- Rate limiting helpers
"""

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
from functools import wraps

from fastapi import Depends, HTTPException, status, Security, Request
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


class TokenData(BaseModel):
    user_id: str
    email: Optional[str] = None
    role: str = "user"
    exp: datetime


class User(BaseModel):
    id: str
    email: Optional[str] = None
    role: str = "user"
    is_active: bool = True


def create_access_token(user_id: str, email: Optional[str] = None, role: str = "user") -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return TokenData(
            user_id=payload.get("sub"),
            email=payload.get("email"),
            role=payload.get("role", "user"),
            exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc),
        )
    except JWTError:
        return None


async def get_api_key(api_key: str = Security(api_key_header)) -> Optional[str]:
    """Extract API key from header."""
    return api_key


async def get_bearer_token(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> Optional[str]:
    """Extract bearer token from Authorization header."""
    if credentials:
        return credentials.credentials
    return None


async def verify_admin_access(
    api_key: Optional[str] = Depends(get_api_key),
    token: Optional[str] = Depends(get_bearer_token),
) -> User:
    """
    Verify admin access via API key or JWT token with admin role.

    Raises HTTPException 401/403 if not authorized.
    """
    # Check API key first
    if api_key:
        if not ADMIN_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Admin API key not configured on server",
            )
        if secrets.compare_digest(api_key, ADMIN_API_KEY):
            return User(id="admin", email="admin@liveslotdata.com", role="admin")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    # Check JWT token
    if token:
        token_data = verify_token(token)
        if token_data and token_data.role == "admin":
            return User(
                id=token_data.user_id,
                email=token_data.email,
                role=token_data.role,
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    # No credentials provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide X-API-Key header or Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: Optional[str] = Depends(get_bearer_token),
) -> User:
    """
    Get current authenticated user from JWT token.

    Raises HTTPException 401 if not authenticated.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return User(
        id=token_data.user_id,
        email=token_data.email,
        role=token_data.role,
    )


async def get_current_user_optional(
    token: Optional[str] = Depends(get_bearer_token),
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.

    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if not token:
        return None

    token_data = verify_token(token)
    if not token_data:
        return None

    return User(
        id=token_data.user_id,
        email=token_data.email,
        role=token_data.role,
    )


# Type aliases for cleaner dependency injection
AdminUser = Annotated[User, Depends(verify_admin_access)]
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[Optional[User], Depends(get_current_user_optional)]


def get_user_id_from_context(user: Optional[User]) -> str:
    """Get user ID from user object or return anonymous ID."""
    if user:
        return user.id
    return "anonymous"

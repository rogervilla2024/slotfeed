import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.kick_api import KickAPIClient, KickChannel


@pytest.fixture
def kick_client():
    return KickAPIClient(timeout=5.0)


@pytest.fixture
def mock_channel_response():
    return {
        "id": 123456,
        "user_id": 789,
        "slug": "teststreamer",
        "user": {
            "username": "teststreamer",
            "bio": "Test bio",
            "profile_pic": "https://example.com/avatar.jpg",
        },
        "banner_image": {"url": "https://example.com/banner.jpg"},
        "followers_count": 50000,
        "livestream": None,
    }


@pytest.fixture
def mock_live_channel_response():
    return {
        "id": 123456,
        "user_id": 789,
        "slug": "teststreamer",
        "user": {
            "username": "teststreamer",
            "bio": "Test bio",
            "profile_pic": "https://example.com/avatar.jpg",
        },
        "followers_count": 50000,
        "livestream": {
            "id": 999,
            "session_title": "Test Stream",
            "created_at": "2026-01-01T12:00:00Z",
            "viewer_count": 1500,
            "thumbnail": {"url": "https://example.com/thumb.jpg"},
        },
    }


class TestKickAPIClient:
    @pytest.mark.asyncio
    async def test_get_channel_not_live(self, kick_client, mock_channel_response):
        with patch.object(
            kick_client, "_request", new_callable=AsyncMock
        ) as mock_request:
            mock_request.return_value = mock_channel_response

            channel = await kick_client.get_channel("teststreamer")

            assert channel is not None
            assert channel.username == "teststreamer"
            assert channel.is_live is False
            assert channel.followers_count == 50000
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_channel_live(self, kick_client, mock_live_channel_response):
        with patch.object(
            kick_client, "_request", new_callable=AsyncMock
        ) as mock_request:
            mock_request.return_value = mock_live_channel_response

            channel = await kick_client.get_channel("teststreamer")

            assert channel is not None
            assert channel.is_live is True
            assert channel.livestream is not None
            assert channel.livestream["viewer_count"] == 1500

    @pytest.mark.asyncio
    async def test_get_channel_not_found(self, kick_client):
        with patch.object(
            kick_client, "_request", new_callable=AsyncMock
        ) as mock_request:
            mock_request.return_value = None

            channel = await kick_client.get_channel("nonexistent")

            assert channel is None

    @pytest.mark.asyncio
    async def test_check_multiple_live(self, kick_client):
        async def mock_get_channel(username):
            if username == "live_streamer":
                return KickChannel(
                    id=1,
                    user_id=1,
                    slug=username,
                    username=username,
                    display_name=username,
                    bio=None,
                    avatar_url=None,
                    banner_url=None,
                    followers_count=1000,
                    is_live=True,
                    livestream={},
                )
            return KickChannel(
                id=2,
                user_id=2,
                slug=username,
                username=username,
                display_name=username,
                bio=None,
                avatar_url=None,
                banner_url=None,
                followers_count=500,
                is_live=False,
                livestream=None,
            )

        with patch.object(
            kick_client, "get_channel", side_effect=mock_get_channel
        ):
            results = await kick_client.check_multiple_live(
                ["live_streamer", "offline_streamer"]
            )

            assert results["live_streamer"] is True
            assert results["offline_streamer"] is False

    @pytest.mark.asyncio
    async def test_client_cleanup(self, kick_client):
        # Ensure client can be properly closed
        await kick_client.close()
        assert kick_client._client is None or kick_client._client.is_closed

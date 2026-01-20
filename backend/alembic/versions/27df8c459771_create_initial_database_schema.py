"""Create initial database schema

Revision ID: 27df8c459771
Revises:
Create Date: 2026-01-07 22:05:13.377356

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '27df8c459771'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create providers table (no dependencies)
    op.create_table('providers',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('logo_url', sa.Text(), nullable=True),
        sa.Column('website_url', sa.Text(), nullable=True),
        sa.Column('total_games', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_rtp', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('slug')
    )

    # Create streamers table (no dependencies)
    op.create_table('streamers',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('kick_id', sa.String(100), nullable=True, unique=True),
        sa.Column('twitch_id', sa.String(100), nullable=True, unique=True),
        sa.Column('youtube_id', sa.String(100), nullable=True, unique=True),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('display_name', sa.String(200), nullable=True),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('country', sa.String(2), nullable=True),
        sa.Column('language', sa.String(5), nullable=True),
        sa.Column('kick_url', sa.Text(), nullable=True),
        sa.Column('twitch_url', sa.Text(), nullable=True),
        sa.Column('youtube_url', sa.Text(), nullable=True),
        sa.Column('twitter_url', sa.Text(), nullable=True),
        sa.Column('discord_url', sa.Text(), nullable=True),
        sa.Column('total_wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('total_won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('net_profit_loss', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('lifetime_rtp', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('total_stream_hours', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_sessions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('biggest_win', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('biggest_multiplier', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('followers_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_viewers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sponsor_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('tier', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_live_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )

    # Create games table (depends on providers)
    op.create_table('games',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('provider_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('slug', sa.String(200), nullable=False, unique=True),
        sa.Column('rtp', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('volatility', sa.String(20), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('thumbnail_url', sa.Text(), nullable=True),
        sa.Column('max_multiplier', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('min_bet', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.01'),
        sa.Column('max_bet', sa.Numeric(precision=15, scale=2), nullable=False, server_default='1000.00'),
        sa.Column('has_free_spins', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('has_bonus', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('has_multiplier', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('total_spins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('total_won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )

    # Create users table (no dependencies)
    op.create_table('users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(100), nullable=False, unique=True),
        sa.Column('username', sa.String(100), nullable=False, unique=True),
        sa.Column('display_name', sa.String(200), nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('subscription_tier', sa.String(20), nullable=False, server_default='free'),
        sa.Column('subscription_expires', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preferences', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )

    # Create sessions table (depends on streamers)
    op.create_table('sessions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('streamer_id', sa.String(36), nullable=False),
        sa.Column('platform', sa.String(20), nullable=False),
        sa.Column('platform_session_id', sa.String(100), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('starting_balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('ending_balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('total_wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('total_won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('net_profit_loss', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('session_rtp', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('biggest_win', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('biggest_multiplier', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('games_played', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('bonus_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('peak_viewers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_viewers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('vod_url', sa.Text(), nullable=True),
        sa.Column('thumbnail_url', sa.Text(), nullable=True),
        sa.Column('is_live', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['streamer_id'], ['streamers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create game_sessions table (depends on sessions and games)
    op.create_table('game_sessions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('game_id', sa.String(36), nullable=False),
        sa.Column('total_wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('total_won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('spins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('observed_rtp', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('biggest_win', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('biggest_multiplier', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create balance_events table (depends on sessions) - High frequency, suitable for partitioning
    op.create_table('balance_events',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('previous_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('new_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('balance_change', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('event_type', sa.String(20), nullable=True),
        sa.Column('wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create big_wins table (depends on sessions and games)
    op.create_table('big_wins',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('game_id', sa.String(36), nullable=False),
        sa.Column('streamer_id', sa.String(36), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('multiplier', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('bet_amount', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('balance_before', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('balance_after', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('screenshot_url', sa.Text(), nullable=True),
        sa.Column('clip_url', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.ForeignKeyConstraint(['streamer_id'], ['streamers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create bonus_hunts table (depends on streamers and games)
    op.create_table('bonus_hunts',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('streamer_id', sa.String(36), nullable=False),
        sa.Column('game_id', sa.String(36), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='collecting'),
        sa.Column('total_cost', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('entry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('opened_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_payout', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('roi_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
        sa.ForeignKeyConstraint(['streamer_id'], ['streamers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create bonus_hunt_entries table (depends on bonus_hunts)
    op.create_table('bonus_hunt_entries',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('bonus_hunt_id', sa.String(36), nullable=False),
        sa.Column('entry_number', sa.Integer(), nullable=False),
        sa.Column('cost', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='unopened'),
        sa.Column('payout', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('multiplier', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['bonus_hunt_id'], ['bonus_hunts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create alert_rules table (depends on users)
    op.create_table('alert_rules',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('alert_type', sa.String(50), nullable=True),
        sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('notify_email', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notify_push', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notify_discord', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create chat_analytics table (no dependencies)
    op.create_table('chat_analytics',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('time_bucket', sa.DateTime(timezone=True), nullable=False),
        sa.Column('message_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unique_users', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sentiment_score', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('hype_level', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('top_emotes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create hype_moments table (depends on sessions)
    op.create_table('hype_moments',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('intensity', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('clip_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create hot_cold_history table (depends on games)
    op.create_table('hot_cold_history',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('game_id', sa.String(36), nullable=False),
        sa.Column('status', sa.String(20), nullable=True),
        sa.Column('heat_score', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('confidence', sa.Numeric(precision=3, scale=2), nullable=False, server_default='0'),
        sa.Column('observed_rtp', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('theoretical_rtp', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('rtp_difference', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('sample_sessions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_spins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('total_won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('recent_big_wins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_big_win_multiplier', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('trend', sa.String(20), nullable=True),
        sa.Column('period_hours', sa.Integer(), nullable=False, server_default='24'),
        sa.Column('last_updated', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create clips table (depends on sessions)
    op.create_table('clips',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('platform', sa.String(20), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('like_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create daily_leaderboards table (no foreign keys)
    op.create_table('daily_leaderboards',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('streamer_id', sa.String(36), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('total_won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('net_profit_loss', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('roi_percent', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['streamer_id'], ['streamers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create streamer_game_stats table (junction table - depends on streamers and games)
    op.create_table('streamer_game_stats',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('streamer_id', sa.String(36), nullable=False),
        sa.Column('game_id', sa.String(36), nullable=False),
        sa.Column('total_sessions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_wagered', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('total_won', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('net_profit_loss', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('observed_rtp', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('biggest_win', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('biggest_multiplier', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ),
        sa.ForeignKeyConstraint(['streamer_id'], ['streamers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('streamer_id', 'game_id', name='_streamer_game_uc')
    )

    # Create indexes for better query performance
    op.create_index(op.f('ix_providers_name'), 'providers', ['name'], unique=True)
    op.create_index(op.f('ix_providers_slug'), 'providers', ['slug'], unique=True)
    op.create_index(op.f('ix_streamers_username'), 'streamers', ['username'])
    op.create_index(op.f('ix_streamers_slug'), 'streamers', ['slug'], unique=True)
    op.create_index(op.f('ix_games_slug'), 'games', ['slug'], unique=True)
    op.create_index(op.f('ix_games_provider_id'), 'games', ['provider_id'])
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_sessions_streamer_id'), 'sessions', ['streamer_id'])
    op.create_index(op.f('ix_sessions_started_at'), 'sessions', ['started_at'])
    op.create_index(op.f('ix_game_sessions_session_id'), 'game_sessions', ['session_id'])
    op.create_index(op.f('ix_game_sessions_game_id'), 'game_sessions', ['game_id'])
    op.create_index(op.f('ix_balance_events_session_id'), 'balance_events', ['session_id'])
    op.create_index(op.f('ix_balance_events_timestamp'), 'balance_events', ['timestamp'])
    op.create_index(op.f('ix_big_wins_session_id'), 'big_wins', ['session_id'])
    op.create_index(op.f('ix_big_wins_game_id'), 'big_wins', ['game_id'])
    op.create_index(op.f('ix_big_wins_streamer_id'), 'big_wins', ['streamer_id'])
    op.create_index(op.f('ix_big_wins_timestamp'), 'big_wins', ['timestamp'])
    op.create_index(op.f('ix_bonus_hunts_streamer_id'), 'bonus_hunts', ['streamer_id'])
    op.create_index(op.f('ix_bonus_hunts_game_id'), 'bonus_hunts', ['game_id'])
    op.create_index(op.f('ix_chat_analytics_session_id'), 'chat_analytics', ['session_id'])
    op.create_index(op.f('ix_hype_moments_session_id'), 'hype_moments', ['session_id'])
    op.create_index(op.f('ix_hot_cold_history_game_id'), 'hot_cold_history', ['game_id'])
    op.create_index(op.f('ix_clips_session_id'), 'clips', ['session_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order of dependencies
    op.drop_table('streamer_game_stats')
    op.drop_table('daily_leaderboards')
    op.drop_table('clips')
    op.drop_table('hot_cold_history')
    op.drop_table('hype_moments')
    op.drop_table('chat_analytics')
    op.drop_table('alert_rules')
    op.drop_table('bonus_hunt_entries')
    op.drop_table('bonus_hunts')
    op.drop_table('big_wins')
    op.drop_table('balance_events')
    op.drop_table('game_sessions')
    op.drop_table('sessions')
    op.drop_table('users')
    op.drop_table('games')
    op.drop_table('streamers')
    op.drop_table('providers')

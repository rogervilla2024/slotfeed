"""Initial schema - All 16 core tables

Revision ID: 20260101_000001
Revises:
Create Date: 2026-01-01

This migration creates all core SlotFeed tables:
1. providers
2. games
3. streamers
4. sessions
5. game_sessions
6. balance_events (partitioned)
7. big_wins
8. bonus_hunts
9. bonus_hunt_entries
10. chat_analytics
11. hype_moments
12. hot_cold_history
13. clips
14. users
15. alert_rules
16. daily_leaderboards
17. streamer_game_stats (helper)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260101_000001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    # 1. Providers
    op.create_table(
        'providers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), unique=True, nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False),
        sa.Column('logo_url', sa.Text, nullable=True),
        sa.Column('website_url', sa.Text, nullable=True),
        sa.Column('total_games', sa.Integer, default=0),
        sa.Column('avg_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # 2. Games
    op.create_table(
        'games',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('provider_id', sa.String(36), sa.ForeignKey('providers.id'), nullable=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('slug', sa.String(200), unique=True, nullable=False),
        sa.Column('thumbnail_url', sa.Text, nullable=True),
        sa.Column('theoretical_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('volatility', sa.String(20), nullable=True),
        sa.Column('max_win_multiplier', sa.Integer, nullable=True),
        sa.Column('min_bet', sa.Numeric(10, 2), nullable=True),
        sa.Column('max_bet', sa.Numeric(10, 2), nullable=True),
        sa.Column('features', postgresql.JSONB, nullable=True),
        sa.Column('ocr_template', postgresql.JSONB, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('total_sessions', sa.Integer, default=0),
        sa.Column('observed_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_games_provider', 'games', ['provider_id'])
    op.create_index('idx_games_slug', 'games', ['slug'])

    # 3. Streamers
    op.create_table(
        'streamers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('kick_id', sa.String(100), unique=True, nullable=True),
        sa.Column('twitch_id', sa.String(100), unique=True, nullable=True),
        sa.Column('youtube_id', sa.String(100), unique=True, nullable=True),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('display_name', sa.String(200), nullable=True),
        sa.Column('slug', sa.String(100), unique=True, nullable=False),
        sa.Column('avatar_url', sa.Text, nullable=True),
        sa.Column('bio', sa.Text, nullable=True),
        sa.Column('country', sa.String(2), nullable=True),
        sa.Column('language', sa.String(5), nullable=True),
        sa.Column('kick_url', sa.Text, nullable=True),
        sa.Column('twitch_url', sa.Text, nullable=True),
        sa.Column('youtube_url', sa.Text, nullable=True),
        sa.Column('twitter_url', sa.Text, nullable=True),
        sa.Column('discord_url', sa.Text, nullable=True),
        sa.Column('total_wagered', sa.Numeric(15, 2), default=0),
        sa.Column('total_won', sa.Numeric(15, 2), default=0),
        sa.Column('net_profit_loss', sa.Numeric(15, 2), default=0),
        sa.Column('lifetime_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('total_stream_hours', sa.Integer, default=0),
        sa.Column('total_sessions', sa.Integer, default=0),
        sa.Column('biggest_win', sa.Numeric(15, 2), default=0),
        sa.Column('biggest_multiplier', sa.Numeric(10, 2), default=0),
        sa.Column('followers_count', sa.Integer, default=0),
        sa.Column('avg_viewers', sa.Integer, default=0),
        sa.Column('sponsor_info', postgresql.JSONB, nullable=True),
        sa.Column('tier', sa.Integer, default=1),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('last_live_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_streamers_kick_id', 'streamers', ['kick_id'])
    op.create_index('idx_streamers_slug', 'streamers', ['slug'])
    op.create_index('idx_streamers_tier', 'streamers', ['tier'])

    # 4. Sessions
    op.create_table(
        'sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('streamer_id', sa.String(36), sa.ForeignKey('streamers.id'), nullable=False),
        sa.Column('platform', sa.String(20), nullable=False),
        sa.Column('platform_session_id', sa.String(100), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_minutes', sa.Integer, nullable=True),
        sa.Column('starting_balance', sa.Numeric(15, 2), nullable=True),
        sa.Column('ending_balance', sa.Numeric(15, 2), nullable=True),
        sa.Column('total_wagered', sa.Numeric(15, 2), default=0),
        sa.Column('total_won', sa.Numeric(15, 2), default=0),
        sa.Column('net_profit_loss', sa.Numeric(15, 2), default=0),
        sa.Column('session_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('biggest_win', sa.Numeric(15, 2), default=0),
        sa.Column('biggest_multiplier', sa.Numeric(10, 2), default=0),
        sa.Column('games_played', sa.Integer, default=0),
        sa.Column('bonus_count', sa.Integer, default=0),
        sa.Column('peak_viewers', sa.Integer, default=0),
        sa.Column('avg_viewers', sa.Integer, default=0),
        sa.Column('vod_url', sa.Text, nullable=True),
        sa.Column('thumbnail_url', sa.Text, nullable=True),
        sa.Column('is_live', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_sessions_streamer', 'sessions', ['streamer_id'])
    op.create_index('idx_sessions_started', 'sessions', ['started_at'])
    op.create_index('idx_sessions_live', 'sessions', ['is_live'], postgresql_where=sa.text('is_live = TRUE'))

    # 5. Game Sessions
    op.create_table(
        'game_sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('game_id', sa.String(36), sa.ForeignKey('games.id'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_minutes', sa.Integer, nullable=True),
        sa.Column('starting_balance', sa.Numeric(15, 2), nullable=True),
        sa.Column('ending_balance', sa.Numeric(15, 2), nullable=True),
        sa.Column('total_wagered', sa.Numeric(15, 2), default=0),
        sa.Column('total_won', sa.Numeric(15, 2), default=0),
        sa.Column('net_profit_loss', sa.Numeric(15, 2), default=0),
        sa.Column('game_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('spins_count', sa.Integer, default=0),
        sa.Column('bonus_count', sa.Integer, default=0),
        sa.Column('biggest_win', sa.Numeric(15, 2), default=0),
        sa.Column('biggest_multiplier', sa.Numeric(10, 2), default=0),
        sa.Column('avg_bet', sa.Numeric(10, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_game_sessions_session', 'game_sessions', ['session_id'])
    op.create_index('idx_game_sessions_game', 'game_sessions', ['game_id'])

    # 6. Balance Events (high-frequency table)
    op.create_table(
        'balance_events',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('game_session_id', sa.String(36), nullable=True),
        sa.Column('captured_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('balance', sa.Numeric(15, 2), nullable=False),
        sa.Column('bet_amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('win_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('balance_change', sa.Numeric(15, 2), nullable=True),
        sa.Column('is_bonus', sa.Boolean, default=False),
        sa.Column('multiplier', sa.Numeric(10, 2), nullable=True),
        sa.Column('ocr_confidence', sa.Numeric(4, 3), nullable=True),
        sa.Column('frame_url', sa.Text, nullable=True),
        sa.PrimaryKeyConstraint('id', 'captured_at'),
    )
    op.create_index('idx_balance_events_session', 'balance_events', ['session_id'])
    op.create_index('idx_balance_events_time', 'balance_events', ['captured_at'])

    # 7. Big Wins
    op.create_table(
        'big_wins',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('sessions.id'), nullable=False),
        sa.Column('game_session_id', sa.String(36), sa.ForeignKey('game_sessions.id'), nullable=True),
        sa.Column('streamer_id', sa.String(36), sa.ForeignKey('streamers.id'), nullable=False),
        sa.Column('game_id', sa.String(36), sa.ForeignKey('games.id'), nullable=False),
        sa.Column('won_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('bet_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('win_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('multiplier', sa.Numeric(10, 2), nullable=False),
        sa.Column('is_bonus_win', sa.Boolean, default=False),
        sa.Column('is_verified', sa.Boolean, default=False),
        sa.Column('screenshot_url', sa.Text, nullable=True),
        sa.Column('clip_url', sa.Text, nullable=True),
        sa.Column('vod_timestamp', sa.Integer, nullable=True),
        sa.Column('viewer_count', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_big_wins_streamer', 'big_wins', ['streamer_id'])
    op.create_index('idx_big_wins_game', 'big_wins', ['game_id'])
    op.create_index('idx_big_wins_time', 'big_wins', ['won_at'])
    op.create_index('idx_big_wins_multiplier', 'big_wins', ['multiplier'])

    # 8. Bonus Hunts
    op.create_table(
        'bonus_hunts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('sessions.id'), nullable=False),
        sa.Column('streamer_id', sa.String(36), sa.ForeignKey('streamers.id'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('opening_started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_cost', sa.Numeric(15, 2), default=0),
        sa.Column('total_payout', sa.Numeric(15, 2), default=0),
        sa.Column('roi_percentage', sa.Numeric(6, 2), nullable=True),
        sa.Column('bonus_count', sa.Integer, default=0),
        sa.Column('bonuses_opened', sa.Integer, default=0),
        sa.Column('best_multiplier', sa.Numeric(10, 2), nullable=True),
        sa.Column('worst_multiplier', sa.Numeric(10, 2), nullable=True),
        sa.Column('avg_multiplier', sa.Numeric(10, 2), nullable=True),
        sa.Column('status', sa.String(20), default='collecting'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_bonus_hunts_streamer', 'bonus_hunts', ['streamer_id'])

    # 9. Bonus Hunt Entries
    op.create_table(
        'bonus_hunt_entries',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('bonus_hunt_id', sa.String(36), sa.ForeignKey('bonus_hunts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('game_id', sa.String(36), sa.ForeignKey('games.id'), nullable=False),
        sa.Column('position', sa.Integer, nullable=False),
        sa.Column('bet_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('is_opened', sa.Boolean, default=False),
        sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('payout', sa.Numeric(15, 2), nullable=True),
        sa.Column('multiplier', sa.Numeric(10, 2), nullable=True),
        sa.Column('screenshot_url', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_bonus_hunt_entries_hunt', 'bonus_hunt_entries', ['bonus_hunt_id'])

    # 10. Chat Analytics
    op.create_table(
        'chat_analytics',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bucket_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('bucket_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('message_count', sa.Integer, default=0),
        sa.Column('unique_chatters', sa.Integer, default=0),
        sa.Column('emote_count', sa.Integer, default=0),
        sa.Column('sentiment_score', sa.Numeric(4, 3), nullable=True),
        sa.Column('hype_score', sa.Numeric(4, 3), nullable=True),
        sa.Column('top_emotes', postgresql.JSONB, nullable=True),
        sa.Column('language_distribution', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_chat_analytics_session', 'chat_analytics', ['session_id'])
    op.create_index('idx_chat_analytics_bucket', 'chat_analytics', ['bucket_start'])

    # 11. Hype Moments
    op.create_table(
        'hype_moments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('trigger_type', sa.String(50), nullable=True),
        sa.Column('hype_score', sa.Numeric(4, 3), nullable=True),
        sa.Column('related_big_win_id', sa.String(36), sa.ForeignKey('big_wins.id'), nullable=True),
        sa.Column('chat_velocity', sa.Integer, nullable=True),
        sa.Column('viewer_spike', sa.Integer, nullable=True),
        sa.Column('clip_url', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_hype_moments_session', 'hype_moments', ['session_id'])

    # 12. Hot Cold History
    op.create_table(
        'hot_cold_history',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('game_id', sa.String(36), sa.ForeignKey('games.id'), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_hours', sa.Integer, nullable=False),
        sa.Column('theoretical_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('observed_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('rtp_difference', sa.Numeric(5, 2), nullable=True),
        sa.Column('sample_sessions', sa.Integer, nullable=True),
        sa.Column('total_spins', sa.Integer, nullable=True),
        sa.Column('total_wagered', sa.Numeric(15, 2), nullable=True),
        sa.Column('is_hot', sa.Boolean, nullable=True),
        sa.Column('heat_score', sa.Numeric(4, 3), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_hot_cold_game', 'hot_cold_history', ['game_id'])
    op.create_index('idx_hot_cold_time', 'hot_cold_history', ['recorded_at'])

    # 13. Clips
    op.create_table(
        'clips',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('sessions.id'), nullable=True),
        sa.Column('streamer_id', sa.String(36), sa.ForeignKey('streamers.id'), nullable=False),
        sa.Column('big_win_id', sa.String(36), sa.ForeignKey('big_wins.id'), nullable=True),
        sa.Column('platform', sa.String(20), nullable=False),
        sa.Column('platform_clip_id', sa.String(100), nullable=True),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('clip_url', sa.Text, nullable=False),
        sa.Column('thumbnail_url', sa.Text, nullable=True),
        sa.Column('embed_url', sa.Text, nullable=True),
        sa.Column('duration_seconds', sa.Integer, nullable=True),
        sa.Column('view_count', sa.Integer, default=0),
        sa.Column('clipped_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_clips_streamer', 'clips', ['streamer_id'])
    op.create_index('idx_clips_big_win', 'clips', ['big_win_id'])

    # 14. Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('username', sa.String(100), unique=True, nullable=True),
        sa.Column('display_name', sa.String(200), nullable=True),
        sa.Column('avatar_url', sa.Text, nullable=True),
        sa.Column('auth_provider', sa.String(50), nullable=True),
        sa.Column('subscription_tier', sa.String(20), default='free'),
        sa.Column('subscription_started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('subscription_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('stripe_customer_id', sa.String(100), nullable=True),
        sa.Column('timezone', sa.String(50), default='UTC'),
        sa.Column('notification_preferences', postgresql.JSONB, default={'email': True, 'push': True, 'telegram': False, 'discord': False}),
        sa.Column('favorite_streamers', postgresql.ARRAY(sa.String(36)), default=[]),
        sa.Column('favorite_games', postgresql.ARRAY(sa.String(36)), default=[]),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_tier', 'users', ['subscription_tier'])

    # 15. Alert Rules
    op.create_table(
        'alert_rules',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('conditions', postgresql.JSONB, nullable=False),
        sa.Column('channels', postgresql.JSONB, default=['push']),
        sa.Column('cooldown_minutes', sa.Integer, default=60),
        sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trigger_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_alert_rules_user', 'alert_rules', ['user_id'])
    op.create_index('idx_alert_rules_type', 'alert_rules', ['alert_type'])
    op.create_index('idx_alert_rules_active', 'alert_rules', ['is_active'], postgresql_where=sa.text('is_active = TRUE'))

    # 16. Daily Leaderboards
    op.create_table(
        'daily_leaderboards',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('leaderboard_date', sa.Date, nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('period', sa.String(20), nullable=False),
        sa.Column('rankings', postgresql.JSONB, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_daily_leaderboards_unique', 'daily_leaderboards', ['leaderboard_date', 'category', 'period'], unique=True)
    op.create_index('idx_daily_leaderboards_date', 'daily_leaderboards', ['leaderboard_date'])

    # 17. Streamer Game Stats (helper table)
    op.create_table(
        'streamer_game_stats',
        sa.Column('streamer_id', sa.String(36), sa.ForeignKey('streamers.id'), primary_key=True),
        sa.Column('game_id', sa.String(36), sa.ForeignKey('games.id'), primary_key=True),
        sa.Column('total_sessions', sa.Integer, default=0),
        sa.Column('total_wagered', sa.Numeric(15, 2), default=0),
        sa.Column('total_won', sa.Numeric(15, 2), default=0),
        sa.Column('net_profit_loss', sa.Numeric(15, 2), default=0),
        sa.Column('observed_rtp', sa.Numeric(5, 2), nullable=True),
        sa.Column('biggest_win', sa.Numeric(15, 2), default=0),
        sa.Column('biggest_multiplier', sa.Numeric(10, 2), default=0),
        sa.Column('last_played_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('streamer_game_stats')
    op.drop_table('daily_leaderboards')
    op.drop_table('alert_rules')
    op.drop_table('users')
    op.drop_table('clips')
    op.drop_table('hot_cold_history')
    op.drop_table('hype_moments')
    op.drop_table('chat_analytics')
    op.drop_table('bonus_hunt_entries')
    op.drop_table('bonus_hunts')
    op.drop_table('big_wins')
    op.drop_table('balance_events')
    op.drop_table('game_sessions')
    op.drop_table('sessions')
    op.drop_table('streamers')
    op.drop_table('games')
    op.drop_table('providers')

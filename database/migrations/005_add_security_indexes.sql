-- ============================================
-- LIVESLOTDATA - Security & Performance Indexes
-- Migration 005
-- ============================================

-- ============================================
-- SESSIONS TABLE INDEXES
-- ============================================

-- Index for streamer live status queries (used heavily in dashboard)
CREATE INDEX IF NOT EXISTS idx_sessions_streamer_live
    ON sessions(streamer_id, is_live)
    WHERE is_live = true;

-- Index for session timeline queries
CREATE INDEX IF NOT EXISTS idx_sessions_streamer_time
    ON sessions(streamer_id, start_time DESC);

-- ============================================
-- BIG_WINS TABLE INDEXES
-- ============================================

-- Index for leaderboard queries by multiplier
CREATE INDEX IF NOT EXISTS idx_big_wins_multiplier
    ON big_wins(multiplier DESC);

-- Index for streamer big wins
CREATE INDEX IF NOT EXISTS idx_big_wins_streamer
    ON big_wins(streamer_id, captured_at DESC);

-- Index for game big wins
CREATE INDEX IF NOT EXISTS idx_big_wins_game
    ON big_wins(game_id, captured_at DESC);

-- ============================================
-- HOT_COLD_HISTORY TABLE INDEXES
-- ============================================

-- Composite index for time-series queries on game performance
CREATE INDEX IF NOT EXISTS idx_hot_cold_game_time
    ON hot_cold_history(game_id, recorded_at DESC);

-- Index for hot/cold status filtering
CREATE INDEX IF NOT EXISTS idx_hot_cold_status
    ON hot_cold_history(status, recorded_at DESC);

-- ============================================
-- GAMES TABLE INDEXES
-- ============================================

-- Index for provider filtering
CREATE INDEX IF NOT EXISTS idx_games_provider
    ON games(provider_id);

-- Index for volatility filtering
CREATE INDEX IF NOT EXISTS idx_games_volatility
    ON games(volatility);

-- Index for active games search
CREATE INDEX IF NOT EXISTS idx_games_active_name
    ON games(name)
    WHERE is_active = true;

-- ============================================
-- STREAMERS TABLE INDEXES
-- ============================================

-- Index for platform filtering
CREATE INDEX IF NOT EXISTS idx_streamers_platform
    ON streamers(platform);

-- Index for follower ranking
CREATE INDEX IF NOT EXISTS idx_streamers_followers
    ON streamers(followers DESC);

-- ============================================
-- ALERT_RULES TABLE INDEXES
-- ============================================

-- Index for user alert queries
CREATE INDEX IF NOT EXISTS idx_alert_rules_user
    ON alert_rules(user_id, is_active);

-- Index for alert type filtering
CREATE INDEX IF NOT EXISTS idx_alert_rules_type
    ON alert_rules(alert_type, is_active)
    WHERE is_active = true;

-- ============================================
-- BONUS_HUNTS TABLE INDEXES
-- ============================================

-- Index for streamer bonus hunts
CREATE INDEX IF NOT EXISTS idx_bonus_hunts_streamer
    ON bonus_hunts(streamer_id, started_at DESC);

-- Index for active bonus hunts
CREATE INDEX IF NOT EXISTS idx_bonus_hunts_active
    ON bonus_hunts(status)
    WHERE status = 'active';

-- ============================================
-- CONSTRAINTS (Data Integrity)
-- ============================================

-- Ensure big win multiplier is at least 1x
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_big_win_multiplier'
    ) THEN
        ALTER TABLE big_wins
        ADD CONSTRAINT check_big_win_multiplier
        CHECK (multiplier >= 1);
    END IF;
END $$;

-- Ensure valid platform values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_streamer_platform'
    ) THEN
        ALTER TABLE streamers
        ADD CONSTRAINT check_streamer_platform
        CHECK (platform IN ('kick', 'twitch', 'youtube'));
    END IF;
END $$;

-- Ensure valid volatility values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_game_volatility'
    ) THEN
        ALTER TABLE games
        ADD CONSTRAINT check_game_volatility
        CHECK (volatility IN ('low', 'medium', 'high', 'very_high'));
    END IF;
END $$;

-- ============================================
-- ANALYZE TABLES (Update Statistics)
-- ============================================

ANALYZE sessions;
ANALYZE big_wins;
ANALYZE hot_cold_history;
ANALYZE games;
ANALYZE streamers;
ANALYZE alert_rules;
ANALYZE bonus_hunts;

-- ============================================
-- SLOTFEED - Database Schema
-- Version: 1.0
-- PostgreSQL 16 (Supabase)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- ============================================
-- 1. PROVIDERS (Game Providers)
-- ============================================
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    website_url TEXT,
    total_games INTEGER DEFAULT 0,
    avg_rtp DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. GAMES (Slot Games)
-- ============================================
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    thumbnail_url TEXT,
    theoretical_rtp DECIMAL(5,2),
    volatility VARCHAR(20), -- 'low', 'medium', 'high', 'very_high'
    max_win_multiplier INTEGER,
    min_bet DECIMAL(10,2),
    max_bet DECIMAL(10,2),
    features JSONB, -- ['free_spins', 'multipliers', 'bonus_buy', etc.]
    ocr_template JSONB, -- ROI regions for OCR
    is_active BOOLEAN DEFAULT TRUE,
    total_sessions INTEGER DEFAULT 0,
    observed_rtp DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_provider ON games(provider_id);
CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_name_trgm ON games USING gin(name gin_trgm_ops);

-- ============================================
-- 3. STREAMERS
-- ============================================
CREATE TABLE streamers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kick_id VARCHAR(100) UNIQUE,
    twitch_id VARCHAR(100) UNIQUE,
    youtube_id VARCHAR(100) UNIQUE,
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    slug VARCHAR(100) NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    country VARCHAR(2), -- ISO country code
    language VARCHAR(5), -- ISO language code
    
    -- Social links
    kick_url TEXT,
    twitch_url TEXT,
    youtube_url TEXT,
    twitter_url TEXT,
    discord_url TEXT,
    
    -- Lifetime statistics
    total_wagered DECIMAL(15,2) DEFAULT 0,
    total_won DECIMAL(15,2) DEFAULT 0,
    net_profit_loss DECIMAL(15,2) DEFAULT 0,
    lifetime_rtp DECIMAL(5,2),
    total_stream_hours INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    biggest_win DECIMAL(15,2) DEFAULT 0,
    biggest_multiplier DECIMAL(10,2) DEFAULT 0,
    
    -- Meta
    followers_count INTEGER DEFAULT 0,
    avg_viewers INTEGER DEFAULT 0,
    sponsor_info JSONB,
    tier INTEGER DEFAULT 1, -- 1=priority, 2=regular, 3=new
    is_active BOOLEAN DEFAULT TRUE,
    last_live_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streamers_kick_id ON streamers(kick_id);
CREATE INDEX idx_streamers_slug ON streamers(slug);
CREATE INDEX idx_streamers_tier ON streamers(tier);

-- ============================================
-- 4. SESSIONS (Stream Sessions)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streamer_id UUID NOT NULL REFERENCES streamers(id),
    platform VARCHAR(20) NOT NULL, -- 'kick', 'twitch', 'youtube'
    platform_session_id VARCHAR(100),
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Financial summary
    starting_balance DECIMAL(15,2),
    ending_balance DECIMAL(15,2),
    total_wagered DECIMAL(15,2) DEFAULT 0,
    total_won DECIMAL(15,2) DEFAULT 0,
    net_profit_loss DECIMAL(15,2) DEFAULT 0,
    session_rtp DECIMAL(5,2),
    
    -- Stats
    biggest_win DECIMAL(15,2) DEFAULT 0,
    biggest_multiplier DECIMAL(10,2) DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    bonus_count INTEGER DEFAULT 0,
    
    -- Viewer stats
    peak_viewers INTEGER DEFAULT 0,
    avg_viewers INTEGER DEFAULT 0,
    
    -- Meta
    vod_url TEXT,
    thumbnail_url TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_streamer ON sessions(streamer_id);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX idx_sessions_live ON sessions(is_live) WHERE is_live = TRUE;

-- ============================================
-- 5. GAME_SESSIONS (Per-game within session)
-- ============================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id),
    
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    starting_balance DECIMAL(15,2),
    ending_balance DECIMAL(15,2),
    total_wagered DECIMAL(15,2) DEFAULT 0,
    total_won DECIMAL(15,2) DEFAULT 0,
    net_profit_loss DECIMAL(15,2) DEFAULT 0,
    game_rtp DECIMAL(5,2),
    
    spins_count INTEGER DEFAULT 0,
    bonus_count INTEGER DEFAULT 0,
    biggest_win DECIMAL(15,2) DEFAULT 0,
    biggest_multiplier DECIMAL(10,2) DEFAULT 0,
    avg_bet DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_session ON game_sessions(session_id);
CREATE INDEX idx_game_sessions_game ON game_sessions(game_id);

-- ============================================
-- 6. BALANCE_EVENTS (High-frequency, PARTITIONED)
-- ============================================
CREATE TABLE balance_events (
    id UUID DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    game_session_id UUID,
    
    captured_at TIMESTAMPTZ NOT NULL,
    
    balance DECIMAL(15,2) NOT NULL,
    bet_amount DECIMAL(10,2),
    win_amount DECIMAL(15,2),
    balance_change DECIMAL(15,2),
    
    is_bonus BOOLEAN DEFAULT FALSE,
    multiplier DECIMAL(10,2),
    
    -- OCR metadata
    ocr_confidence DECIMAL(4,3),
    frame_url TEXT,
    
    PRIMARY KEY (id, captured_at)
) PARTITION BY RANGE (captured_at);

-- Create monthly partitions (example for 2025)
CREATE TABLE balance_events_2025_01 PARTITION OF balance_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE balance_events_2025_02 PARTITION OF balance_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE balance_events_2025_03 PARTITION OF balance_events
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
-- Add more partitions as needed...

CREATE INDEX idx_balance_events_session ON balance_events(session_id);
CREATE INDEX idx_balance_events_time ON balance_events(captured_at DESC);

-- ============================================
-- 7. BIG_WINS (Notable wins 100x+)
-- ============================================
CREATE TABLE big_wins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    game_session_id UUID REFERENCES game_sessions(id),
    streamer_id UUID NOT NULL REFERENCES streamers(id),
    game_id UUID NOT NULL REFERENCES games(id),
    
    won_at TIMESTAMPTZ NOT NULL,
    
    bet_amount DECIMAL(10,2) NOT NULL,
    win_amount DECIMAL(15,2) NOT NULL,
    multiplier DECIMAL(10,2) NOT NULL,
    
    is_bonus_win BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    screenshot_url TEXT,
    clip_url TEXT,
    vod_timestamp INTEGER, -- seconds into VOD
    
    viewer_count INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_big_wins_streamer ON big_wins(streamer_id);
CREATE INDEX idx_big_wins_game ON big_wins(game_id);
CREATE INDEX idx_big_wins_time ON big_wins(won_at DESC);
CREATE INDEX idx_big_wins_multiplier ON big_wins(multiplier DESC);

-- ============================================
-- 8. BONUS_HUNTS
-- ============================================
CREATE TABLE bonus_hunts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    streamer_id UUID NOT NULL REFERENCES streamers(id),
    
    started_at TIMESTAMPTZ NOT NULL,
    opening_started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    total_cost DECIMAL(15,2) DEFAULT 0,
    total_payout DECIMAL(15,2) DEFAULT 0,
    roi_percentage DECIMAL(6,2),
    
    bonus_count INTEGER DEFAULT 0,
    bonuses_opened INTEGER DEFAULT 0,
    
    best_multiplier DECIMAL(10,2),
    worst_multiplier DECIMAL(10,2),
    avg_multiplier DECIMAL(10,2),
    
    status VARCHAR(20) DEFAULT 'collecting', -- 'collecting', 'opening', 'completed'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bonus_hunts_streamer ON bonus_hunts(streamer_id);

-- ============================================
-- 9. BONUS_HUNT_ENTRIES
-- ============================================
CREATE TABLE bonus_hunt_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bonus_hunt_id UUID NOT NULL REFERENCES bonus_hunts(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id),
    
    position INTEGER NOT NULL, -- Order in the hunt
    bet_amount DECIMAL(10,2) NOT NULL,
    
    is_opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMPTZ,
    payout DECIMAL(15,2),
    multiplier DECIMAL(10,2),
    
    screenshot_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bonus_hunt_entries_hunt ON bonus_hunt_entries(bonus_hunt_id);

-- ============================================
-- 10. CHAT_ANALYTICS (5-minute buckets)
-- ============================================
CREATE TABLE chat_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    bucket_start TIMESTAMPTZ NOT NULL,
    bucket_end TIMESTAMPTZ NOT NULL,
    
    message_count INTEGER DEFAULT 0,
    unique_chatters INTEGER DEFAULT 0,
    emote_count INTEGER DEFAULT 0,
    
    sentiment_score DECIMAL(4,3), -- -1 to 1
    hype_score DECIMAL(4,3), -- 0 to 1
    
    top_emotes JSONB,
    language_distribution JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_analytics_session ON chat_analytics(session_id);
CREATE INDEX idx_chat_analytics_bucket ON chat_analytics(bucket_start);

-- ============================================
-- 11. HYPE_MOMENTS
-- ============================================
CREATE TABLE hype_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    detected_at TIMESTAMPTZ NOT NULL,
    
    trigger_type VARCHAR(50), -- 'big_win', 'chat_spike', 'bonus_trigger'
    hype_score DECIMAL(4,3),
    
    related_big_win_id UUID REFERENCES big_wins(id),
    
    chat_velocity INTEGER, -- messages per second
    viewer_spike INTEGER,
    
    clip_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hype_moments_session ON hype_moments(session_id);

-- ============================================
-- 12. HOT_COLD_HISTORY
-- ============================================
CREATE TABLE hot_cold_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id),
    
    recorded_at TIMESTAMPTZ NOT NULL,
    period_hours INTEGER NOT NULL, -- 1, 24, 168 (week)
    
    theoretical_rtp DECIMAL(5,2),
    observed_rtp DECIMAL(5,2),
    rtp_difference DECIMAL(5,2),
    
    sample_sessions INTEGER,
    total_spins INTEGER,
    total_wagered DECIMAL(15,2),
    
    is_hot BOOLEAN, -- observed > theoretical
    heat_score DECIMAL(4,3), -- -1 (cold) to 1 (hot)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hot_cold_game ON hot_cold_history(game_id);
CREATE INDEX idx_hot_cold_time ON hot_cold_history(recorded_at DESC);

-- ============================================
-- 13. CLIPS
-- ============================================
CREATE TABLE clips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    streamer_id UUID NOT NULL REFERENCES streamers(id),
    big_win_id UUID REFERENCES big_wins(id),
    
    platform VARCHAR(20) NOT NULL,
    platform_clip_id VARCHAR(100),
    
    title VARCHAR(200),
    description TEXT,
    
    clip_url TEXT NOT NULL,
    thumbnail_url TEXT,
    embed_url TEXT,
    
    duration_seconds INTEGER,
    view_count INTEGER DEFAULT 0,
    
    clipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clips_streamer ON clips(streamer_id);
CREATE INDEX idx_clips_big_win ON clips(big_win_id);

-- ============================================
-- 14. USERS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    display_name VARCHAR(200),
    avatar_url TEXT,
    
    -- Auth (Supabase handles this, but we track tier)
    auth_provider VARCHAR(50), -- 'email', 'google', 'discord'
    
    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'premium'
    subscription_started_at TIMESTAMPTZ,
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id VARCHAR(100),
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "telegram": false, "discord": false}',
    favorite_streamers UUID[] DEFAULT '{}',
    favorite_games UUID[] DEFAULT '{}',
    
    -- Meta
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(subscription_tier);

-- ============================================
-- 15. ALERT_RULES
-- ============================================
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Rule type
    alert_type VARCHAR(50) NOT NULL, 
    -- 'streamer_live', 'big_win', 'game_played', 'hot_slot', 'streamer_milestone'
    
    -- Conditions (JSONB for flexibility)
    conditions JSONB NOT NULL,
    -- Examples:
    -- {"streamer_id": "uuid", "min_multiplier": 100}
    -- {"game_id": "uuid"}
    -- {"heat_score_min": 0.5}
    
    -- Delivery
    channels JSONB DEFAULT '["push"]', -- ['email', 'push', 'telegram', 'discord']
    
    -- Limits
    cooldown_minutes INTEGER DEFAULT 60,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_user ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_type ON alert_rules(alert_type);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = TRUE;

-- ============================================
-- 16. DAILY_LEADERBOARDS (Pre-computed)
-- ============================================
CREATE TABLE daily_leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    leaderboard_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- 'biggest_wins', 'best_rtp', 'most_active', 'highest_multiplier', 'hot_slots'
    
    period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
    
    rankings JSONB NOT NULL,
    -- [{"rank": 1, "entity_id": "uuid", "entity_type": "streamer", "value": 50000, ...}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_daily_leaderboards_unique ON daily_leaderboards(leaderboard_date, category, period);
CREATE INDEX idx_daily_leaderboards_date ON daily_leaderboards(leaderboard_date DESC);

-- ============================================
-- HELPER: Streamer-Game Stats (Many-to-Many)
-- ============================================
CREATE TABLE streamer_game_stats (
    streamer_id UUID NOT NULL REFERENCES streamers(id),
    game_id UUID NOT NULL REFERENCES games(id),
    
    total_sessions INTEGER DEFAULT 0,
    total_wagered DECIMAL(15,2) DEFAULT 0,
    total_won DECIMAL(15,2) DEFAULT 0,
    net_profit_loss DECIMAL(15,2) DEFAULT 0,
    observed_rtp DECIMAL(5,2),
    
    biggest_win DECIMAL(15,2) DEFAULT 0,
    biggest_multiplier DECIMAL(10,2) DEFAULT 0,
    
    last_played_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (streamer_id, game_id)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_streamers_updated_at BEFORE UPDATE ON streamers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bonus_hunts_updated_at BEFORE UPDATE ON bonus_hunts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA: Providers
-- ============================================
INSERT INTO providers (name, slug, website_url) VALUES
    ('Pragmatic Play', 'pragmatic-play', 'https://www.pragmaticplay.com'),
    ('Hacksaw Gaming', 'hacksaw-gaming', 'https://www.hacksawgaming.com'),
    ('Play''n GO', 'playn-go', 'https://www.playngo.com'),
    ('NetEnt', 'netent', 'https://www.netent.com'),
    ('Evolution', 'evolution', 'https://www.evolution.com'),
    ('Nolimit City', 'nolimit-city', 'https://www.nolimitcity.com'),
    ('Push Gaming', 'push-gaming', 'https://www.pushgaming.com'),
    ('Relax Gaming', 'relax-gaming', 'https://www.relax-gaming.com'),
    ('Big Time Gaming', 'big-time-gaming', 'https://www.bigtimegaming.com'),
    ('Red Tiger', 'red-tiger', 'https://www.redtiger.com');

-- ============================================
-- SEED DATA: Top 10 Games
-- ============================================
INSERT INTO games (provider_id, name, slug, theoretical_rtp, volatility, max_win_multiplier) VALUES
    ((SELECT id FROM providers WHERE slug = 'pragmatic-play'), 'Sweet Bonanza', 'sweet-bonanza', 96.48, 'high', 21175),
    ((SELECT id FROM providers WHERE slug = 'pragmatic-play'), 'Gates of Olympus', 'gates-of-olympus', 96.50, 'high', 5000),
    ((SELECT id FROM providers WHERE slug = 'pragmatic-play'), 'Sugar Rush', 'sugar-rush', 96.50, 'high', 5000),
    ((SELECT id FROM providers WHERE slug = 'hacksaw-gaming'), 'Wanted Dead or a Wild', 'wanted-dead-or-wild', 96.38, 'very_high', 12500),
    ((SELECT id FROM providers WHERE slug = 'pragmatic-play'), 'Big Bass Bonanza', 'big-bass-bonanza', 96.71, 'high', 2100),
    ((SELECT id FROM providers WHERE slug = 'pragmatic-play'), 'Fruit Party', 'fruit-party', 96.47, 'high', 5000),
    ((SELECT id FROM providers WHERE slug = 'pragmatic-play'), 'The Dog House', 'the-dog-house', 96.51, 'high', 6750),
    ((SELECT id FROM providers WHERE slug = 'pragmatic-play'), 'Starlight Princess', 'starlight-princess', 96.50, 'high', 5000),
    ((SELECT id FROM providers WHERE slug = 'evolution'), 'Crazy Time', 'crazy-time', 96.08, 'high', 25000),
    ((SELECT id FROM providers WHERE slug = 'playn-go'), 'Book of Dead', 'book-of-dead', 96.21, 'high', 5000);

-- ============================================
-- Done!
-- ============================================

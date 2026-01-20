-- ============================================
-- SLOTFEED - Game Content Migration
-- Creates game_content table for SEO articles
-- ============================================

-- Create game_content table
CREATE TABLE IF NOT EXISTS game_content (
    game_id UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,

    -- Educational content sections (300-500 words total)
    overview TEXT,                          -- Game overview (50-75 words)
    rtp_explanation TEXT,                   -- RTP mechanics (75-100 words)
    volatility_analysis TEXT,               -- Volatility deep dive (75-100 words)
    bonus_features TEXT,                    -- Bonus guide (100-125 words)
    strategies TEXT,                        -- Winning strategies (75-100 words)
    streamer_insights TEXT,                 -- Streamer insights (25-50 words)

    -- SEO metadata
    meta_description VARCHAR(160),          -- Meta description for search engines
    focus_keywords TEXT[],                  -- Array of focus keywords

    -- Content management
    is_published BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- AI generation tracking
    generator_model VARCHAR(50),            -- Model used (claude-opus, claude-sonnet, etc)
    generation_tokens_used INT,             -- Tokens used for generation

    -- Quality metrics
    content_length INT,                     -- Total character count
    readability_score DECIMAL(3,1),         -- Flesch Reading Ease score (0-100)
    keyword_density DECIMAL(3,2),           -- Keyword density percentage

    -- Version history
    version INT DEFAULT 1,
    previous_version_id UUID REFERENCES game_content_versions(id),

    CONSTRAINT content_not_empty CHECK (
        overview IS NOT NULL OR
        rtp_explanation IS NOT NULL OR
        volatility_analysis IS NOT NULL OR
        bonus_features IS NOT NULL OR
        strategies IS NOT NULL
    )
);

-- Create version history table
CREATE TABLE IF NOT EXISTS game_content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

    overview TEXT,
    rtp_explanation TEXT,
    volatility_analysis TEXT,
    bonus_features TEXT,
    strategies TEXT,
    streamer_insights TEXT,
    meta_description VARCHAR(160),
    focus_keywords TEXT[],

    generator_model VARCHAR(50),
    version INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_game_version UNIQUE(game_id, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_content_published ON game_content(is_published);
CREATE INDEX IF NOT EXISTS idx_game_content_updated ON game_content(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_content_keywords ON game_content USING GIN(focus_keywords);
CREATE INDEX IF NOT EXISTS idx_game_content_readability ON game_content(readability_score DESC);

CREATE INDEX IF NOT EXISTS idx_content_versions_game ON game_content_versions(game_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created ON game_content_versions(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_content_timestamp_trigger
BEFORE UPDATE ON game_content
FOR EACH ROW
EXECUTE FUNCTION update_game_content_timestamp();

-- Create trigger to maintain version history
CREATE OR REPLACE FUNCTION game_content_version_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version on actual content change
    IF (OLD.overview IS DISTINCT FROM NEW.overview OR
        OLD.rtp_explanation IS DISTINCT FROM NEW.rtp_explanation OR
        OLD.volatility_analysis IS DISTINCT FROM NEW.volatility_analysis OR
        OLD.bonus_features IS DISTINCT FROM NEW.bonus_features OR
        OLD.strategies IS DISTINCT FROM NEW.strategies OR
        OLD.meta_description IS DISTINCT FROM NEW.meta_description) THEN

        -- Create version history entry
        INSERT INTO game_content_versions (
            game_id, overview, rtp_explanation, volatility_analysis,
            bonus_features, strategies, streamer_insights, meta_description,
            focus_keywords, generator_model, version
        ) VALUES (
            OLD.game_id, OLD.overview, OLD.rtp_explanation, OLD.volatility_analysis,
            OLD.bonus_features, OLD.strategies, OLD.streamer_insights, OLD.meta_description,
            OLD.focus_keywords, OLD.generator_model, OLD.version
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_content_version_trigger
BEFORE UPDATE ON game_content
FOR EACH ROW
WHEN (OLD.version IS DISTINCT FROM NEW.version)
EXECUTE FUNCTION game_content_version_history();

-- Create table for content generation queue
CREATE TABLE IF NOT EXISTS content_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,

    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    priority INT DEFAULT 5,                 -- 1 (highest) to 10 (lowest)

    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Error handling
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10)
);

CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_priority ON content_generation_queue(priority ASC);
CREATE INDEX IF NOT EXISTS idx_content_queue_created ON content_generation_queue(created_at ASC);

-- Analytics table for content performance
CREATE TABLE IF NOT EXISTS game_content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

    -- Traffic metrics
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    average_time_on_page INT,               -- in seconds
    bounce_rate DECIMAL(3,1),               -- percentage

    -- Engagement metrics
    scroll_depth DECIMAL(3,1),              -- average percentage scrolled
    clicks_on_links INT DEFAULT 0,
    conversions INT DEFAULT 0,              -- to premium/pro

    -- SEO metrics
    organic_clicks INT DEFAULT 0,
    average_search_position DECIMAL(4,1),
    impressions INT DEFAULT 0,
    ctr DECIMAL(5,2),                       -- click-through rate

    -- Content metrics
    word_count INT,
    reading_time_minutes INT,

    -- Tracking
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_game_date UNIQUE(game_id, date)
);

CREATE INDEX IF NOT EXISTS idx_content_analytics_game ON game_content_analytics(game_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_date ON game_content_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_content_analytics_views ON game_content_analytics(page_views DESC);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON game_content TO app_user;
GRANT SELECT, INSERT ON game_content_versions TO app_user;
GRANT SELECT, INSERT, UPDATE ON content_generation_queue TO app_user;
GRANT SELECT, INSERT, UPDATE ON game_content_analytics TO app_user;

-- Add comments for documentation
COMMENT ON TABLE game_content IS 'Educational content for slot games (300-500 words)';
COMMENT ON COLUMN game_content.overview IS 'Game overview and description (50-75 words)';
COMMENT ON COLUMN game_content.rtp_explanation IS 'RTP mechanics and expected returns (75-100 words)';
COMMENT ON COLUMN game_content.volatility_analysis IS 'Volatility, variance, and risk profile (75-100 words)';
COMMENT ON COLUMN game_content.bonus_features IS 'Guide to bonus features and triggers (100-125 words)';
COMMENT ON COLUMN game_content.strategies IS 'Winning strategies and bankroll tips (75-100 words)';
COMMENT ON COLUMN game_content.focus_keywords IS 'Array of SEO focus keywords for this game';
COMMENT ON COLUMN game_content.is_published IS 'Whether content is visible on frontend';
COMMENT ON TABLE content_generation_queue IS 'Queue for AI-generated content generation jobs';
COMMENT ON TABLE game_content_analytics IS 'Analytics and traffic metrics for game content pages';

-- ============================================
-- SLOTFEED - ML Analytics Foundation
-- Phase 13-1: Advanced Analytics Infrastructure
-- ============================================

-- ML Feature Sets Table
CREATE TABLE IF NOT EXISTS ml_feature_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(36),
    game_id VARCHAR(36),
    streamer_id VARCHAR(36),

    -- Temporal Features
    hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day < 24),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week < 7),
    is_weekend BOOLEAN,
    season VARCHAR(10),
    is_peak_hours BOOLEAN,

    -- Session Features
    session_duration_minutes FLOAT,
    total_spins INTEGER,
    total_wagers NUMERIC(15, 2),
    initial_balance NUMERIC(15, 2),
    final_balance NUMERIC(15, 2),
    peak_balance NUMERIC(15, 2),
    lowest_balance NUMERIC(15, 2),
    profit_loss NUMERIC(15, 2),
    roi_percent FLOAT,
    max_drawdown FLOAT,
    avg_spins_per_minute FLOAT,

    -- Game Features
    game_rtp FLOAT,
    game_volatility VARCHAR(20),
    game_volatility_score FLOAT,
    game_max_multiplier FLOAT,
    avg_bet_size NUMERIC(15, 2),
    min_bet_size NUMERIC(15, 2),
    max_bet_size NUMERIC(15, 2),
    bet_size_variance FLOAT,
    bet_size_std FLOAT,

    -- Outcome Features
    total_wins INTEGER,
    total_losses INTEGER,
    win_ratio FLOAT,
    loss_ratio FLOAT,
    avg_win_multiplier FLOAT,
    median_win_multiplier FLOAT,
    max_win_multiplier FLOAT,
    min_win_multiplier FLOAT,
    avg_loss_multiplier FLOAT,
    bonus_hit_count INTEGER,
    bonus_frequency_per_100spins FLOAT,
    bonus_hit_rate FLOAT,

    -- Statistical Features
    observed_rtp FLOAT,
    rtp_variance_from_theoretical FLOAT,
    rtp_variance_percent FLOAT,
    win_distribution_std FLOAT,
    win_distribution_skewness FLOAT,
    win_distribution_kurtosis FLOAT,
    balance_volatility FLOAT,
    avg_balance_change FLOAT,
    balance_change_volatility FLOAT,
    longest_winning_streak INTEGER,
    longest_losing_streak INTEGER,

    feature_version INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_ml_fs_session ON ml_feature_sets(session_id);
CREATE INDEX idx_ml_fs_game ON ml_feature_sets(game_id);
CREATE INDEX idx_ml_fs_streamer ON ml_feature_sets(streamer_id);
CREATE INDEX idx_ml_fs_created ON ml_feature_sets(created_at);

-- RTP Predictions Table
CREATE TABLE IF NOT EXISTS rtp_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id VARCHAR(36) NOT NULL,
    model_version INTEGER,

    rtp_1h FLOAT NOT NULL,
    rtp_24h FLOAT NOT NULL,
    rtp_7d FLOAT NOT NULL,

    confidence_1h FLOAT,
    confidence_24h FLOAT,
    confidence_7d FLOAT,

    lower_bound_1h FLOAT,
    upper_bound_1h FLOAT,
    lower_bound_24h FLOAT,
    upper_bound_24h FLOAT,
    lower_bound_7d FLOAT,
    upper_bound_7d FLOAT,

    trend VARCHAR(20), -- 'up', 'down', 'stable'
    trend_strength FLOAT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_rtp_pred_game ON rtp_predictions(game_id);
CREATE INDEX idx_rtp_pred_created ON rtp_predictions(created_at);
CREATE INDEX idx_rtp_pred_expires ON rtp_predictions(expires_at);

-- Anomaly Detections Table
CREATE TABLE IF NOT EXISTS anomaly_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(36),
    game_id VARCHAR(36),
    anomaly_type VARCHAR(50), -- 'rtp_spike', 'bonus_drought', 'variance_excess', etc
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    anomaly_score FLOAT,
    description TEXT,
    affected_metrics TEXT[], -- JSON array of affected metric names

    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_anom_session ON anomaly_detections(session_id);
CREATE INDEX idx_anom_game ON anomaly_detections(game_id);
CREATE INDEX idx_anom_severity ON anomaly_detections(severity);
CREATE INDEX idx_anom_detected ON anomaly_detections(detected_at);

-- Bonus Hunt Predictions Table
CREATE TABLE IF NOT EXISTS bonus_hunt_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bonus_hunt_id UUID NOT NULL,

    predicted_final_roi FLOAT,
    probability_of_profit FLOAT,
    expected_total_spins INTEGER,
    expected_completion_time_minutes INTEGER,
    recommended_continuation_probability FLOAT,

    max_loss_probability FLOAT,
    expected_max_loss NUMERIC(15, 2),
    risk_level VARCHAR(20), -- 'low', 'medium', 'high'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bonus_hunt_id) REFERENCES bonus_hunts(id) ON DELETE CASCADE
);

CREATE INDEX idx_bhp_hunt ON bonus_hunt_predictions(bonus_hunt_id);
CREATE INDEX idx_bhp_created ON bonus_hunt_predictions(created_at);

-- Model Metadata Table
CREATE TABLE IF NOT EXISTS model_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type VARCHAR(50) NOT NULL, -- 'rtp_predictor', 'anomaly_detector', 'bonus_predictor'
    version INTEGER,

    training_date TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validation_accuracy FLOAT,
    prediction_latency_ms FLOAT,
    sample_size INTEGER,

    status VARCHAR(20), -- 'training', 'active', 'archived'
    model_parameters TEXT, -- JSON
    feature_list TEXT[], -- Array of feature names

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mm_type_version ON model_metadata(model_type, version);
CREATE INDEX idx_mm_status ON model_metadata(status);

-- Pattern Analysis Cache
CREATE TABLE IF NOT EXISTS pattern_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id VARCHAR(36) NOT NULL,
    pattern_type VARCHAR(50), -- 'rtp_pattern', 'bonus_pattern', 'volatility_pattern'
    period VARCHAR(20), -- '1d', '7d', '30d', '90d'

    pattern_data JSONB,
    confidence FLOAT,
    sample_size INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_pc_game_period ON pattern_cache(game_id, period);
CREATE INDEX idx_pc_expires ON pattern_cache(expires_at);

-- ML Insights Summary Cache
CREATE TABLE IF NOT EXISTS insights_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE,

    top_opportunities JSONB,
    key_risks JSONB,
    predictions JSONB,
    anomalies_detected INTEGER,
    significant_patterns INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    ttl_seconds INTEGER DEFAULT 3600
);

CREATE INDEX idx_ic_key ON insights_cache(cache_key);
CREATE INDEX idx_ic_expires ON insights_cache(expires_at);

-- Grant permissions (adjust schema name as needed)
-- These may need to be customized based on your actual schema setup

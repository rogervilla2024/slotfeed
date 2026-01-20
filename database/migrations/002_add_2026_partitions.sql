-- ============================================
-- SLOTFEED - 2026 Partition Migration
-- Creates monthly partitions for balance_events
-- ============================================

-- 2026 Partitions
CREATE TABLE IF NOT EXISTS balance_events_2026_01 PARTITION OF balance_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_02 PARTITION OF balance_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_03 PARTITION OF balance_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_04 PARTITION OF balance_events
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_05 PARTITION OF balance_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_06 PARTITION OF balance_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_07 PARTITION OF balance_events
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_08 PARTITION OF balance_events
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_09 PARTITION OF balance_events
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_10 PARTITION OF balance_events
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_11 PARTITION OF balance_events
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS balance_events_2026_12 PARTITION OF balance_events
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Add indexes to 2026 partitions
CREATE INDEX IF NOT EXISTS idx_be_2026_01_session ON balance_events_2026_01(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_02_session ON balance_events_2026_02(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_03_session ON balance_events_2026_03(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_04_session ON balance_events_2026_04(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_05_session ON balance_events_2026_05(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_06_session ON balance_events_2026_06(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_07_session ON balance_events_2026_07(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_08_session ON balance_events_2026_08(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_09_session ON balance_events_2026_09(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_10_session ON balance_events_2026_10(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_11_session ON balance_events_2026_11(session_id);
CREATE INDEX IF NOT EXISTS idx_be_2026_12_session ON balance_events_2026_12(session_id);

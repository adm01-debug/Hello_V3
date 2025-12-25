-- Database Performance Optimization
-- Add indexes for frequently queried fields

-- ================================================
-- CALL SESSIONS
-- ================================================

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_call_sessions_user_id 
ON call_sessions(user_id);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_call_sessions_created_at 
ON call_sessions(created_at DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_call_sessions_status 
ON call_sessions(status);

-- Composite index for user + date queries
CREATE INDEX IF NOT EXISTS idx_call_sessions_user_date 
ON call_sessions(user_id, created_at DESC);

-- Index for duration analysis
CREATE INDEX IF NOT EXISTS idx_call_sessions_duration 
ON call_sessions(duration) WHERE duration IS NOT NULL;

-- ================================================
-- TRANSCRIPTIONS
-- ================================================

-- Index for call session lookup
CREATE INDEX IF NOT EXISTS idx_transcriptions_call_id 
ON transcriptions(call_session_id);

-- Index for text search (using GIN for full-text)
CREATE INDEX IF NOT EXISTS idx_transcriptions_text_search 
ON transcriptions USING gin(to_tsvector('portuguese', text));

-- Index for created date
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at 
ON transcriptions(created_at DESC);

-- ================================================
-- ANALYSIS
-- ================================================

-- Index for call session lookup
CREATE INDEX IF NOT EXISTS idx_analysis_call_id 
ON analysis(call_session_id);

-- Index for sentiment filtering
CREATE INDEX IF NOT EXISTS idx_analysis_sentiment 
ON analysis(sentiment_score);

-- Index for emotion filtering
CREATE INDEX IF NOT EXISTS idx_analysis_emotion 
ON analysis(dominant_emotion);

-- ================================================
-- USERS (if custom users table)
-- ================================================

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- ================================================
-- AUDIT LOGS
-- ================================================

-- Index for user activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

-- Index for date range
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC);

-- Composite index for user + date
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date 
ON audit_logs(user_id, created_at DESC);

-- ================================================
-- ANALYZE TABLES
-- ================================================

-- Update statistics for query planner
ANALYZE call_sessions;
ANALYZE transcriptions;
ANALYZE analysis;
ANALYZE users;
ANALYZE audit_logs;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON INDEX idx_call_sessions_user_id IS 'Optimize user queries';
COMMENT ON INDEX idx_call_sessions_created_at IS 'Optimize date range queries';
COMMENT ON INDEX idx_transcriptions_text_search IS 'Full-text search on transcriptions';

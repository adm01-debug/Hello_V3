-- Performance Indexes for Common Queries
-- Run: psql -d hello < supabase/migrations/20250102000000_performance_indexes.sql

BEGIN;

-- ============================================================================
-- CALLS TABLE INDEXES
-- ============================================================================

-- Index for user's calls sorted by date (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_user_started_at 
ON calls (user_id, started_at DESC);

-- Index for finding active/ongoing calls
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_status_user 
ON calls (status, user_id) 
WHERE status IN ('active', 'ringing');

-- Index for calls within date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_date_range 
ON calls (started_at DESC) 
WHERE started_at > CURRENT_DATE - INTERVAL '90 days';

-- Partial index for failed calls
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_failed 
ON calls (user_id, started_at DESC) 
WHERE status = 'failed';

-- Composite index for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_analytics 
ON calls (user_id, status, started_at DESC, duration);

-- ============================================================================
-- CONTACTS TABLE INDEXES
-- ============================================================================

-- Index for contact search by name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_name_search 
ON contacts USING gin (to_tsvector('english', name));

-- Index for user's contacts sorted by name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_name 
ON contacts (user_id, name);

-- Index for finding contacts by phone
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_phone 
ON contacts (phone) 
WHERE phone IS NOT NULL;

-- Index for email lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_email 
ON contacts (email) 
WHERE email IS NOT NULL;

-- Index for recently created contacts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_recent 
ON contacts (user_id, created_at DESC);

-- ============================================================================
-- TRANSCRIPTIONS TABLE INDEXES
-- ============================================================================

-- Index for call's transcriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcriptions_call 
ON transcriptions (call_id, created_at);

-- Full-text search on transcription text
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcriptions_text_search 
ON transcriptions USING gin (to_tsvector('english', text));

-- Index for high-confidence transcriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcriptions_confidence 
ON transcriptions (call_id, confidence DESC) 
WHERE confidence > 0.8;

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for email login
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique 
ON users (email);

-- Index for active users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
ON users (created_at DESC) 
WHERE deleted_at IS NULL;

-- Index for role-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users (role);

-- ============================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================================================

-- Index for user's audit trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_timestamp 
ON audit_logs (user_id, timestamp DESC);

-- Index for action-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_action_timestamp 
ON audit_logs (action, timestamp DESC);

-- Index for critical events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_critical 
ON audit_logs (timestamp DESC, severity) 
WHERE severity = 'critical';

-- Partial index for failed actions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_failures 
ON audit_logs (user_id, timestamp DESC) 
WHERE success = FALSE;

-- ============================================================================
-- COMPOSITE INDEXES FOR JOINS
-- ============================================================================

-- Optimized for calls with contact info
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_contact_user 
ON calls (contact_id, user_id, started_at DESC);

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Analyze tables to update statistics
ANALYZE calls;
ANALYZE contacts;
ANALYZE transcriptions;
ANALYZE users;
ANALYZE audit_logs;

-- Show index usage statistics
CREATE OR REPLACE VIEW index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Show unused indexes (candidates for removal)
CREATE OR REPLACE VIEW unused_indexes AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pk_%'
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

COMMIT;

-- Recommendations:
-- 1. Monitor index usage with: SELECT * FROM index_usage;
-- 2. Check for unused indexes: SELECT * FROM unused_indexes;
-- 3. Run VACUUM ANALYZE weekly
-- 4. Review and drop unused indexes after 30 days

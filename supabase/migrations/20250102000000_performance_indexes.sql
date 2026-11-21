-- Performance Indexes for Common Queries
-- Run: psql -d hello < supabase/migrations/20250102000000_performance_indexes.sql

BEGIN;

-- ============================================================================
-- CALLS TABLE INDEXES
-- ============================================================================

-- Index for user's calls sorted by date (most common query)
-- Index for user's calls sorted by date (most common query)
DO $$
BEGIN
    IF to_regclass('calls') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_calls_user_started_at 
ON calls (user_id, started_at DESC);$stmt$;
    END IF;
END $$;

-- Index for finding active/ongoing calls
DO $$
BEGIN
    IF to_regclass('calls') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_calls_status_user 
ON calls (status, user_id) 
WHERE status IN ('active', 'ringing');$stmt$;
    END IF;
END $$;

-- Index for calls within date range
DO $$
BEGIN
    IF to_regclass('calls') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_calls_date_range 
ON calls (started_at DESC) 
WHERE started_at > CURRENT_DATE - INTERVAL '90 days';$stmt$;
    END IF;
END $$;

-- Partial index for failed calls
DO $$
BEGIN
    IF to_regclass('calls') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_calls_failed 
ON calls (user_id, started_at DESC) 
WHERE status = 'failed';$stmt$;
    END IF;
END $$;

-- Composite index for analytics queries
DO $$
BEGIN
    IF to_regclass('calls') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_calls_analytics 
ON calls (user_id, status, started_at DESC, duration);$stmt$;
    END IF;
END $$;

-- ============================================================================
-- CONTACTS TABLE INDEXES
-- ============================================================================

-- Index for contact search by name
-- Index for contact search by name
DO $$
BEGIN
    IF to_regclass('contacts') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='contacts' AND c.column_name='name') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_contacts_name_search 
ON contacts USING gin (to_tsvector('english', name));$stmt$;
    END IF;
END $$;

-- Index for user's contacts sorted by name
DO $$
BEGIN
    IF to_regclass('contacts') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='contacts' AND c.column_name='user_id') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_contacts_user_name 
ON contacts (user_id, name);$stmt$;
    END IF;
END $$;

-- Index for finding contacts by phone
DO $$
BEGIN
    IF to_regclass('contacts') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='contacts' AND c.column_name='phone') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_contacts_phone 
ON contacts (phone) 
WHERE phone IS NOT NULL;$stmt$;
    END IF;
END $$;

-- Index for email lookup
DO $$
BEGIN
    IF to_regclass('contacts') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='contacts' AND c.column_name='email') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_contacts_email 
ON contacts (email) 
WHERE email IS NOT NULL;$stmt$;
    END IF;
END $$;

-- Index for recently created contacts
DO $$
BEGIN
    IF to_regclass('contacts') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='contacts' AND c.column_name='user_id') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_contacts_recent 
ON contacts (user_id, created_at DESC);$stmt$;
    END IF;
END $$;

-- ============================================================================
-- TRANSCRIPTIONS TABLE INDEXES
-- ============================================================================

-- Index for call's transcriptions
DO $$
BEGIN
    IF to_regclass('transcriptions') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_transcriptions_call 
ON transcriptions (call_id, created_at);$stmt$;
    END IF;
END $$;

-- Full-text search on transcription text
DO $$
BEGIN
    IF to_regclass('transcriptions') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_transcriptions_text_search 
ON transcriptions USING gin (to_tsvector('english', text));$stmt$;
    END IF;
END $$;

-- Index for high-confidence transcriptions
DO $$
BEGIN
    IF to_regclass('transcriptions') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_transcriptions_confidence 
ON transcriptions (call_id, confidence DESC) 
WHERE confidence > 0.8;$stmt$;
    END IF;
END $$;

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for email login
DO $$
BEGIN
    IF to_regclass('users') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_users_email_unique 
ON users (email);$stmt$;
    END IF;
END $$;

-- Index for active users
DO $$
BEGIN
    IF to_regclass('users') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_users_active 
ON users (created_at DESC) 
WHERE deleted_at IS NULL;$stmt$;
    END IF;
END $$;

-- Index for role-based queries
DO $$
BEGIN
    IF to_regclass('users') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_users_role 
ON users (role);$stmt$;
    END IF;
END $$;

-- ============================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================================================

-- Index for user's audit trail
DO $$
BEGIN
    IF to_regclass('audit_logs') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='user_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='created_at') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_audit_user_timestamp 
ON audit_logs (user_id, created_at DESC);$stmt$;
    END IF;
END $$;

-- Index for action-based queries
DO $$
BEGIN
    IF to_regclass('audit_logs') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='action')
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='created_at') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_audit_action_timestamp 
ON audit_logs (action, created_at DESC);$stmt$;
    END IF;
END $$;

-- Index for critical events
DO $$
BEGIN
    IF to_regclass('audit_logs') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='severity')
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='created_at') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_audit_critical 
ON audit_logs (created_at DESC, severity) 
WHERE severity = 'critical';$stmt$;
    END IF;
END $$;

-- Index for failed actions
DO $$
BEGIN
    IF to_regclass('audit_logs') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='user_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='success')
       AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='audit_logs' AND c.column_name='created_at') THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_audit_failures 
ON audit_logs (user_id, created_at DESC) 
WHERE success = FALSE;$stmt$;
    END IF;
END $$;

-- ============================================================================
-- COMPOSITE INDEXES FOR JOINS
-- ============================================================================

-- Optimized for calls with contact info
DO $$
BEGIN
    IF to_regclass('calls') IS NOT NULL THEN
        EXECUTE $stmt$CREATE INDEX IF NOT EXISTS idx_calls_contact_user 
ON calls (contact_id, user_id, started_at DESC);$stmt$;
    END IF;
END $$;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Analyze tables to update statistics

DO $$
BEGIN
    IF to_regclass('calls') IS NOT NULL THEN
        EXECUTE $stmt$ANALYZE calls;$stmt$;
    END IF;
END $$;


DO $$
BEGIN
    IF to_regclass('contacts') IS NOT NULL THEN
        EXECUTE $stmt$ANALYZE contacts;$stmt$;
    END IF;
END $$;


DO $$
BEGIN
    IF to_regclass('transcriptions') IS NOT NULL THEN
        EXECUTE $stmt$ANALYZE transcriptions;$stmt$;
    END IF;
END $$;


DO $$
BEGIN
    IF to_regclass('users') IS NOT NULL THEN
        EXECUTE $stmt$ANALYZE users;$stmt$;
    END IF;
END $$;


DO $$
BEGIN
    IF to_regclass('audit_logs') IS NOT NULL THEN
        EXECUTE $stmt$ANALYZE audit_logs;$stmt$;
    END IF;
END $$;

-- Show index usage statistics
CREATE OR REPLACE VIEW index_usage AS
SELECT
  schemaname,
  relname AS tablename,
  indexrelname AS indexname,
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
  relname AS tablename,
  indexrelname AS indexname,
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

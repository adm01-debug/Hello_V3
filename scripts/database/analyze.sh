#!/bin/bash
# Database Analyze Script
# Updates query planner statistics

set -e

DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:54322/postgres"}

echo "📊 Analyzing database tables..."

psql "$DB_URL" <<EOF
-- Analyze all tables
ANALYZE VERBOSE;

-- Show table statistics
SELECT 
  schemaname,
  tablename,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Show index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 10;
EOF

echo "✅ Analysis complete!"

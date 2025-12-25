#!/bin/bash
# Database Vacuum Script
# Reclaims storage and updates statistics

set -e

DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:54322/postgres"}

echo "🧹 Starting database vacuum..."

psql "$DB_URL" <<EOF
-- Full vacuum (reclaims space)
VACUUM FULL VERBOSE;

-- Analyze tables (update statistics)
ANALYZE VERBOSE;

-- Check bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
EOF

echo "✅ Vacuum complete!"

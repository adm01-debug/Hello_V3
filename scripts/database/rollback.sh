#!/bin/bash
# Database Rollback Script
# Usage: ./rollback.sh <migration_version>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <migration_version>"
  echo "Example: $0 20240101000000"
  exit 1
fi

MIGRATION_VERSION=$1
DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:54322/postgres"}

echo "🔄 Rolling back to migration: $MIGRATION_VERSION"

# Check if migration exists
if [ ! -f "supabase/migrations/${MIGRATION_VERSION}_*.sql" ]; then
  echo "❌ Migration $MIGRATION_VERSION not found"
  exit 1
fi

# Create backup before rollback
echo "📦 Creating backup..."
BACKUP_FILE="backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DB_URL" > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Rollback migration
echo "⏪ Rolling back migration..."
psql "$DB_URL" <<EOF
DELETE FROM supabase_migrations.schema_migrations 
WHERE version > '$MIGRATION_VERSION';
EOF

echo "✅ Rollback complete!"
echo "⚠️  Remember to reapply migrations if needed: supabase db push"

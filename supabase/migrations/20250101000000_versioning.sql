-- Database Migrations Versioning Structure
-- Run: psql -d hello < supabase/migrations/20250101000000_versioning.sql

BEGIN;

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(255) DEFAULT CURRENT_USER,
  checksum VARCHAR(64),
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE
);

-- Create migration rollback history
CREATE TABLE IF NOT EXISTS migration_rollbacks (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL,
  rolled_back_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rolled_back_by VARCHAR(255) DEFAULT CURRENT_USER,
  reason TEXT
);

-- Function to apply migration
CREATE OR REPLACE FUNCTION apply_migration(
  p_version VARCHAR(255),
  p_name VARCHAR(255),
  p_checksum VARCHAR(64)
) RETURNS BOOLEAN AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_execution_time INTEGER;
BEGIN
  v_start_time := CLOCK_TIMESTAMP();
  
  -- Check if migration already applied
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = p_version) THEN
    RAISE NOTICE 'Migration % already applied', p_version;
    RETURN FALSE;
  END IF;
  
  -- Record migration
  v_execution_time := EXTRACT(MILLISECONDS FROM CLOCK_TIMESTAMP() - v_start_time);
  
  INSERT INTO schema_migrations (version, name, checksum, execution_time_ms)
  VALUES (p_version, p_name, p_checksum, v_execution_time);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback migration
CREATE OR REPLACE FUNCTION rollback_migration(
  p_version VARCHAR(255),
  p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if migration exists
  IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = p_version) THEN
    RAISE EXCEPTION 'Migration % not found', p_version;
  END IF;
  
  -- Record rollback
  INSERT INTO migration_rollbacks (version, reason)
  VALUES (p_version, p_reason);
  
  -- Remove from migrations
  DELETE FROM schema_migrations WHERE version = p_version;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- View for migration status
CREATE OR REPLACE VIEW migration_status AS
SELECT 
  sm.version,
  sm.name,
  sm.applied_at,
  sm.applied_by,
  sm.execution_time_ms,
  sm.success,
  CASE 
    WHEN mr.id IS NOT NULL THEN 'Rolled Back'
    ELSE 'Applied'
  END AS status
FROM schema_migrations sm
LEFT JOIN migration_rollbacks mr ON sm.version = mr.version
ORDER BY sm.version DESC;

COMMIT;

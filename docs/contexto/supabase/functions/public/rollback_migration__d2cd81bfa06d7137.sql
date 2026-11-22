CREATE OR REPLACE FUNCTION public.rollback_migration(p_version character varying, p_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$

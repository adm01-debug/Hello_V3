CREATE OR REPLACE FUNCTION public.apply_migration(p_version character varying, p_name character varying, p_checksum character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$

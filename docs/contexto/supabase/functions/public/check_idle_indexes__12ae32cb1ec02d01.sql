CREATE OR REPLACE FUNCTION public.check_idle_indexes()
 RETURNS TABLE(schemaname text, relname text, indexrelname text, index_size_bytes bigint, index_size_pretty text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    s.schemaname::text,
    s.relname::text,
    s.indexrelname::text,
    pg_relation_size(s.indexrelid)::bigint AS index_size_bytes,
    pg_size_pretty(pg_relation_size(s.indexrelid))::text AS index_size_pretty
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON i.indexrelid = s.indexrelid
  WHERE s.schemaname = 'public'
    AND s.idx_scan = 0
    AND NOT i.indisunique
    AND NOT i.indisprimary
    AND pg_relation_size(s.indexrelid) > 1048576  -- >1MB
  ORDER BY pg_relation_size(s.indexrelid) DESC;
$function$

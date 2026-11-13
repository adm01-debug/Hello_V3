CREATE OR REPLACE FUNCTION public.check_table_bloat()
 RETURNS TABLE(schemaname text, relname text, dead_tuples bigint, live_tuples bigint, dead_ratio numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    s.schemaname::text,
    s.relname::text,
    s.n_dead_tup,
    s.n_live_tup,
    CASE
      WHEN s.n_live_tup + s.n_dead_tup > 0
        THEN ROUND((s.n_dead_tup::numeric / NULLIF(s.n_live_tup + s.n_dead_tup, 0)) * 100, 2)
      ELSE 0
    END AS dead_ratio
  FROM pg_stat_user_tables s
  WHERE s.schemaname = 'public'
    AND s.n_dead_tup > 10000
    AND (s.n_dead_tup::numeric / NULLIF(s.n_live_tup + s.n_dead_tup, 0)) > 0.20
  ORDER BY s.n_dead_tup DESC;
$function$

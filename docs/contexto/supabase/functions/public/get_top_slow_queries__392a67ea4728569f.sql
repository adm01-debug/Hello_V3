CREATE OR REPLACE FUNCTION public.get_top_slow_queries(p_limit integer DEFAULT 15)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  BEGIN
    EXECUTE format($q$
      SELECT COALESCE(jsonb_agg(q), '[]'::jsonb) FROM (
        SELECT
          LEFT(query, 400) AS query,
          calls,
          ROUND(mean_exec_time::numeric, 2) AS mean_ms,
          ROUND(total_exec_time::numeric, 2) AS total_ms,
          ROUND(max_exec_time::numeric, 2) AS max_ms
        FROM extensions.pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
          AND query NOT ILIKE '%pg_stat_statements%'
        ORDER BY total_exec_time DESC
        LIMIT %L
      ) q
    $q$, p_limit) INTO v_result;
  EXCEPTION WHEN OTHERS THEN
    v_result := '[]'::jsonb;
  END;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$

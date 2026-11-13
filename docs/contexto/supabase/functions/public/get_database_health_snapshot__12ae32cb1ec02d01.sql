CREATE OR REPLACE FUNCTION public.get_database_health_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bloat jsonb;
  v_sizes jsonb;
  v_activity jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  -- Bloat >20% e dead>10k
  SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb)
    INTO v_bloat
  FROM public.check_table_bloat() b;

  -- Top 15 tabelas por tamanho (heap+índices)
  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_sizes
  FROM (
    SELECT
      c.relname::text AS relname,
      pg_total_relation_size(c.oid) AS total_bytes,
      pg_relation_size(c.oid) AS heap_bytes,
      pg_total_relation_size(c.oid) - pg_relation_size(c.oid) AS index_bytes,
      s.n_live_tup AS live_tuples,
      s.n_dead_tup AS dead_tuples
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC
    LIMIT 15
  ) t;

  -- Atividade (conexões)
  SELECT jsonb_build_object(
    'total_connections', COUNT(*),
    'active', COUNT(*) FILTER (WHERE state = 'active'),
    'idle', COUNT(*) FILTER (WHERE state = 'idle'),
    'idle_in_txn', COUNT(*) FILTER (WHERE state = 'idle in transaction')
  ) INTO v_activity
  FROM pg_stat_activity
  WHERE datname = current_database();

  RETURN jsonb_build_object(
    'generated_at', now(),
    'bloat', v_bloat,
    'top_tables', v_sizes,
    'activity', v_activity
  );
END;
$function$

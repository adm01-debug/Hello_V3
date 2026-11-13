CREATE OR REPLACE FUNCTION public.reset_public_index_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_error TEXT;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO v_count
    FROM (
      SELECT pg_stat_reset_single_table_counters(c.oid)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'i'
    ) t;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN jsonb_build_object('ok', false, 'error', v_error, 'ran_at', now());
  END;

  RETURN jsonb_build_object('ok', true, 'reset_count', v_count, 'ran_at', now());
END;
$function$

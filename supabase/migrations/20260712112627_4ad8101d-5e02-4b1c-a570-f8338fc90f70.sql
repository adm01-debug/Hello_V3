-- Onda 41: Idle Index Monitor
-- Detecta índices sem uso (idx_scan = 0) com tamanho relevante (>1MB), excluindo PK/unique constraints.
-- Notifica admins semanalmente com debounce de 30 dias por índice.

CREATE OR REPLACE FUNCTION public.check_idle_indexes()
RETURNS TABLE(schemaname text, relname text, indexrelname text, index_size_bytes bigint, index_size_pretty text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.notify_idle_indexes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_admin record;
  v_already boolean;
  v_notified integer := 0;
  v_scanned integer := 0;
BEGIN
  FOR v_row IN SELECT * FROM public.check_idle_indexes() LOOP
    v_scanned := v_scanned + 1;

    -- Debounce 30 dias por índice
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE source_type = 'idle_index_hotspot'
        AND source_id = v_row.indexrelname
        AND created_at > now() - interval '30 days'
    ) INTO v_already;

    IF v_already THEN CONTINUE; END IF;

    FOR v_admin IN SELECT id FROM public.user_profiles WHERE role = 'admin' LOOP
      BEGIN
        INSERT INTO public.notifications (
          user_id, title, message, type, category, severity,
          action_url, action_label, source_type, source_id, metadata
        ) VALUES (
          v_admin.id,
          'Índice sem uso detectado',
          'Índice "' || v_row.indexrelname || '" (' || v_row.index_size_pretty ||
            ') em "' || v_row.relname || '" nunca foi utilizado. Considere DROP para reduzir write amplification.',
          'info',
          'system',
          'info',
          '/admin/database-health',
          'Ver saúde do banco',
          'idle_index_hotspot',
          v_row.indexrelname,
          jsonb_build_object(
            'index', v_row.indexrelname,
            'table', v_row.relname,
            'size_bytes', v_row.index_size_bytes,
            'size_pretty', v_row.index_size_pretty,
            'detected_at', now()
          )
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;

    v_notified := v_notified + 1;
  END LOOP;

  RETURN jsonb_build_object('scanned', v_scanned, 'notified', v_notified, 'ran_at', now());
END;
$$;

-- Cron semanal: domingo 05:30 UTC (após bloat monitor 05:00)
SELECT cron.unschedule('weekly-idle-index-monitor')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-idle-index-monitor');

SELECT cron.schedule(
  'weekly-idle-index-monitor',
  '30 5 * * 0',
  $$ SELECT public.notify_idle_indexes(); $$
);
CREATE OR REPLACE FUNCTION public.notify_idle_indexes()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

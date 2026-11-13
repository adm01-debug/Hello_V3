CREATE OR REPLACE FUNCTION public.notify_bloat_hotspots()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row record;
  v_admin record;
  v_already_notified boolean;
  v_notified_count integer := 0;
  v_scanned_count integer := 0;
BEGIN
  FOR v_row IN SELECT * FROM public.check_table_bloat() LOOP
    v_scanned_count := v_scanned_count + 1;

    -- Debounce 7 dias por tabela
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE source_type = 'table_bloat_hotspot'
        AND source_id = v_row.relname
        AND created_at > now() - interval '7 days'
    ) INTO v_already_notified;

    IF v_already_notified THEN CONTINUE; END IF;

    FOR v_admin IN SELECT id FROM public.user_profiles WHERE role = 'admin' LOOP
      BEGIN
        INSERT INTO public.notifications (
          user_id, title, message, type, category, severity,
          action_url, action_label, source_type, source_id, metadata
        ) VALUES (
          v_admin.id,
          'Bloat elevado detectado',
          'Tabela "' || v_row.relname || '" com ' || v_row.dead_tuples ||
            ' dead tuples (' || v_row.dead_ratio || '%). Considere VACUUM FULL na próxima janela.',
          'warning',
          'system',
          'warning',
          '/admin/database-health',
          'Ver saúde do banco',
          'table_bloat_hotspot',
          v_row.relname,
          jsonb_build_object(
            'table', v_row.relname,
            'dead_tuples', v_row.dead_tuples,
            'live_tuples', v_row.live_tuples,
            'dead_ratio_pct', v_row.dead_ratio,
            'detected_at', now()
          )
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;

    v_notified_count := v_notified_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'scanned', v_scanned_count,
    'notified', v_notified_count,
    'ran_at', now()
  );
END;
$function$

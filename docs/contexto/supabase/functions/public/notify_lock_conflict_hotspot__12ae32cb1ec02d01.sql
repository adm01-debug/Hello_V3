CREATE OR REPLACE FUNCTION public.notify_lock_conflict_hotspot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_threshold CONSTANT integer := 10;
  v_window CONSTANT interval := '1 hour';
  v_recent_count integer;
  v_already_notified boolean;
  v_admin record;
BEGIN
  -- Conta conflitos da mesma tabela na última hora
  SELECT COUNT(*) INTO v_recent_count
  FROM public.optimistic_lock_conflicts
  WHERE table_name = NEW.table_name
    AND attempted_at > now() - v_window;

  IF v_recent_count <= v_threshold THEN
    RETURN NEW;
  END IF;

  -- Debounce: já notificou para esta tabela na última hora?
  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE source_type = 'optimistic_lock_hotspot'
      AND source_id = NEW.table_name
      AND created_at > now() - v_window
  ) INTO v_already_notified;

  IF v_already_notified THEN
    RETURN NEW;
  END IF;

  -- Notifica todos os admins
  FOR v_admin IN
    SELECT id FROM public.user_profiles WHERE role = 'admin'
  LOOP
    BEGIN
      INSERT INTO public.notifications (
        user_id, title, message, type, category, severity,
        action_url, action_label, source_type, source_id, metadata
      ) VALUES (
        v_admin.id,
        'Hotspot de conflito de concorrência',
        'Tabela "' || NEW.table_name || '" registrou ' || v_recent_count ||
          ' conflitos na última hora. Investigue possíveis problemas de UI ou contenção.',
        'warning',
        'system',
        'warning',
        '/concurrency-conflicts',
        'Ver dashboard',
        'optimistic_lock_hotspot',
        NEW.table_name,
        jsonb_build_object(
          'table_name', NEW.table_name,
          'count_last_hour', v_recent_count,
          'threshold', v_threshold,
          'detected_at', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- não bloquear o INSERT principal por falha de notificação
    END;
  END LOOP;

  RETURN NEW;
END;
$function$

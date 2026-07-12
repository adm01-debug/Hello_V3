
CREATE OR REPLACE FUNCTION public.notify_suspicious_index_drop_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold CONSTANT integer := 5;
  v_window CONSTANT interval := '24 hours';
  v_recent_count integer;
  v_already_notified boolean;
  v_admin record;
BEGIN
  IF NEW.admin_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_recent_count
  FROM public.index_drop_audit
  WHERE admin_id = NEW.admin_id
    AND created_at > now() - v_window;

  IF v_recent_count <= v_threshold THEN
    RETURN NEW;
  END IF;

  -- Debounce 24h por admin
  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE source_type = 'suspicious_index_drop_activity'
      AND source_id = NEW.admin_id::text
      AND created_at > now() - v_window
  ) INTO v_already_notified;

  IF v_already_notified THEN
    RETURN NEW;
  END IF;

  -- Notifica todos os OUTROS admins (revisão cruzada)
  FOR v_admin IN
    SELECT id FROM public.user_profiles
    WHERE role = 'admin' AND id <> NEW.admin_id
  LOOP
    BEGIN
      INSERT INTO public.notifications (
        user_id, title, message, type, category, severity,
        action_url, action_label, source_type, source_id, metadata
      ) VALUES (
        v_admin.id,
        'Atividade suspeita: varredura de DROP INDEX',
        'Admin ' || COALESCE(NEW.admin_email, NEW.admin_id::text) ||
          ' copiou ' || v_recent_count || ' comandos DROP INDEX nas últimas 24h. Verifique se é manutenção autorizada.',
        'error',
        'security',
        'critical',
        '/admin/database-health',
        'Revisar histórico',
        'suspicious_index_drop_activity',
        NEW.admin_id::text,
        jsonb_build_object(
          'admin_id', NEW.admin_id,
          'admin_email', NEW.admin_email,
          'count_last_24h', v_recent_count,
          'threshold', v_threshold,
          'last_index', NEW.index_name,
          'last_table', NEW.table_name,
          'detected_at', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_suspicious_index_drop_activity ON public.index_drop_audit;
CREATE TRIGGER trg_notify_suspicious_index_drop_activity
AFTER INSERT ON public.index_drop_audit
FOR EACH ROW
EXECUTE FUNCTION public.notify_suspicious_index_drop_activity();

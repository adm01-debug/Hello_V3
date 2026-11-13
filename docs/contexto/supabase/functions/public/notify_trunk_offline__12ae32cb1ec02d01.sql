CREATE OR REPLACE FUNCTION public.notify_trunk_offline()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_consecutive_failures integer;
  v_already_notified boolean;
  v_trunk_name text;
  v_admin record;
BEGIN
  IF NEW.reachable THEN
    RETURN NEW;
  END IF;

  -- Conta últimas 3 verificações desse trunk
  SELECT COUNT(*) INTO v_consecutive_failures
  FROM (
    SELECT reachable
    FROM public.voip_trunk_health_checks
    WHERE trunk_id = NEW.trunk_id
    ORDER BY checked_at DESC
    LIMIT 3
  ) t
  WHERE reachable = false;

  IF v_consecutive_failures < 3 THEN
    RETURN NEW;
  END IF;

  -- Debounce: já notificou esse trunk na última hora?
  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE source_type = 'voip_trunk_offline'
      AND source_id = NEW.trunk_id::text
      AND created_at > now() - interval '1 hour'
  ) INTO v_already_notified;

  IF v_already_notified THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_trunk_name FROM public.voip_trunks WHERE id = NEW.trunk_id;

  FOR v_admin IN SELECT id FROM public.user_profiles WHERE role = 'admin'
  LOOP
    BEGIN
      INSERT INTO public.notifications (
        user_id, title, message, type, category, severity,
        action_url, action_label, source_type, source_id, metadata
      ) VALUES (
        v_admin.id,
        'Trunk VoIP offline',
        'Trunk "' || COALESCE(v_trunk_name, 'desconhecido') ||
          '" falhou em 3 verificações consecutivas. Verifique a operadora.',
        'error',
        'voip',
        'critical',
        '/admin/voip-trunks',
        'Ver painel',
        'voip_trunk_offline',
        NEW.trunk_id::text,
        jsonb_build_object(
          'trunk_id', NEW.trunk_id,
          'trunk_name', v_trunk_name,
          'last_error', NEW.error_message,
          'detected_at', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$function$

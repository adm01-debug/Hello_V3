-- Onda 32: Health checks de trunks VoIP
-- Coluna de status do último health check em voip_trunks
ALTER TABLE public.voip_trunks
  ADD COLUMN IF NOT EXISTS last_health_status text,
  ADD COLUMN IF NOT EXISTS last_health_latency_ms integer,
  ADD COLUMN IF NOT EXISTS last_health_checked_at timestamp with time zone;

-- Tabela de histórico de health checks
CREATE TABLE IF NOT EXISTS public.voip_trunk_health_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trunk_id uuid NOT NULL REFERENCES public.voip_trunks(id) ON DELETE CASCADE,
  checked_at timestamp with time zone NOT NULL DEFAULT now(),
  reachable boolean NOT NULL,
  latency_ms integer,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trunk_health_trunk_time
  ON public.voip_trunk_health_checks (trunk_id, checked_at DESC);

ALTER TABLE public.voip_trunk_health_checks ENABLE ROW LEVEL SECURITY;

-- Apenas admins leem o histórico
CREATE POLICY "Admins read trunk health checks"
  ON public.voip_trunk_health_checks
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

-- INSERT bloqueado via RLS — apenas SECURITY DEFINER (edge function service role bypass)
CREATE POLICY "Service role inserts health checks"
  ON public.voip_trunk_health_checks
  FOR INSERT
  WITH CHECK (false);

-- Trigger: 3 checks consecutivos offline → notifica admins (debounce 1h)
CREATE OR REPLACE FUNCTION public.notify_trunk_offline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_notify_trunk_offline ON public.voip_trunk_health_checks;
CREATE TRIGGER trg_notify_trunk_offline
  AFTER INSERT ON public.voip_trunk_health_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trunk_offline();
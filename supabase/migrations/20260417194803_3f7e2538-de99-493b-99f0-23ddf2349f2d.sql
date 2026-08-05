-- Onda 13: Bridge automático voip_quality_alerts → notifications
-- Quando um alerta crítico é gravado, espelha em notifications para a central já existente.

CREATE OR REPLACE FUNCTION public.bridge_voip_alert_to_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_message text;
  v_severity text;
BEGIN
  -- Apenas alertas 'poor' e 'offline' geram notificação (degrading é só toast)
  IF NEW.alert_type NOT IN ('poor', 'offline') THEN
    RETURN NEW;
  END IF;

  v_severity := CASE NEW.alert_type
    WHEN 'poor' THEN 'warning'
    WHEN 'offline' THEN 'critical'
    ELSE 'info'
  END;

  v_title := CASE NEW.alert_type
    WHEN 'poor' THEN 'Qualidade VoIP crítica'
    WHEN 'offline' THEN 'Conexão VoIP offline'
    ELSE 'Alerta VoIP'
  END;

  v_message := 'MOS ' || COALESCE(NEW.mos_at_alert::text, '—') ||
               ' • Jitter ' || COALESCE(ROUND(NEW.jitter_ms)::text, '—') || 'ms' ||
               ' • RTT ' || COALESCE(ROUND(NEW.rtt_ms)::text, '—') || 'ms';

  INSERT INTO public.notifications (
    user_id, title, message, type, category, severity,
    action_url, action_label, source_type, source_id, metadata
  ) VALUES (
    NEW.user_id,
    v_title,
    v_message,
    'voip_quality',
    'call',
    v_severity,
    '/network-diagnostics',
    'Ver diagnóstico',
    'voip_quality_alerts',
    NEW.id::text,
    jsonb_build_object(
      'alert_type', NEW.alert_type,
      'mos', NEW.mos_at_alert,
      'jitter_ms', NEW.jitter_ms,
      'rtt_ms', NEW.rtt_ms,
      'call_session_id', NEW.call_session_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bridge_voip_alert_to_notification ON public.voip_quality_alerts;
CREATE TRIGGER trg_bridge_voip_alert_to_notification
  AFTER INSERT ON public.voip_quality_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.bridge_voip_alert_to_notification();
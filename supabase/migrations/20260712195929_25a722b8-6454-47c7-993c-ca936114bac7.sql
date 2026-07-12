
CREATE OR REPLACE FUNCTION public.notify_webhook_failure_spike()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window CONSTANT interval := '1 hour';
  v_min_attempts CONSTANT integer := 10;
  v_threshold CONSTANT numeric := 0.20;
  v_sent bigint;
  v_failed bigint;
  v_ratio numeric;
  v_already boolean;
  v_admin record;
BEGIN
  SELECT COALESCE(SUM(sent), 0), COALESCE(SUM(failed), 0)
    INTO v_sent, v_failed
  FROM public.webhook_flush_metrics
  WHERE created_at > now() - v_window;

  IF (v_sent + v_failed) < v_min_attempts THEN
    RETURN NEW;
  END IF;

  v_ratio := v_failed::numeric / NULLIF(v_sent + v_failed, 0);

  IF v_ratio < v_threshold THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE source_type = 'webhook_failure_spike'
      AND created_at > now() - v_window
  ) INTO v_already;

  IF v_already THEN
    RETURN NEW;
  END IF;

  FOR v_admin IN SELECT id FROM public.user_profiles WHERE role = 'admin' LOOP
    BEGIN
      INSERT INTO public.notifications (
        user_id, title, message, type, category, severity,
        action_url, action_label, source_type, source_id, metadata
      ) VALUES (
        v_admin.id,
        'Pico de falhas em webhooks',
        'Taxa de falhas em webhooks atingiu ' || ROUND(v_ratio * 100, 1) ||
          '% na última hora (' || v_failed || ' falhas em ' || (v_sent + v_failed) || ' tentativas).',
        'warning',
        'system',
        'warning',
        '/admin/security-audit',
        'Abrir painel',
        'webhook_failure_spike',
        NULL,
        jsonb_build_object(
          'sent', v_sent,
          'failed', v_failed,
          'ratio', v_ratio,
          'window', '1 hour',
          'detected_at', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_webhook_failure_spike ON public.webhook_flush_metrics;
CREATE TRIGGER trg_webhook_failure_spike
AFTER INSERT ON public.webhook_flush_metrics
FOR EACH ROW
EXECUTE FUNCTION public.notify_webhook_failure_spike();

CREATE OR REPLACE FUNCTION public.check_cron_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
DECLARE
  v_row record;
  v_admin record;
  v_jobs integer := 0;
  v_notified integer := 0;
  v_deleted bigint := 0;
  v_detalhe text;
BEGIN
  FOR v_row IN
    SELECT * FROM public.cron_health_rows() WHERE state IN ('falhando', 'parado', 'nunca_executou')
  LOOP
    v_jobs := v_jobs + 1;

    -- Um alerta a cada 6 horas por job: o vigia roda de hora em hora e não pode
    -- transformar uma falha persistente em 24 notificações por dia. "Nunca executou"
    -- é sinal mais fraco (job recém-criado cai aqui), então espera 24 horas.
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.notifications
      WHERE source_type = 'cron_health'
        AND source_id = v_row.jobname
        AND created_at > now() - CASE
          WHEN v_row.state = 'nunca_executou' THEN interval '24 hours'
          ELSE interval '6 hours'
        END
    );

    v_detalhe := CASE v_row.state
      WHEN 'falhando' THEN
        'A última execução falhou (' || COALESCE(v_row.last_status, 'sem status') || ')' ||
        CASE WHEN v_row.failures_24h > 0
          THEN ' — ' || v_row.failures_24h || ' de ' || v_row.runs_24h || ' execuções falharam nas últimas 24h.'
          ELSE '.' END
      WHEN 'parado' THEN
        'Nenhuma execução há ' || COALESCE(v_row.hours_since_last::text, '?') ||
        ' horas, com cadência esperada de ' || COALESCE(v_row.expected_every_minutes::text, '?') || ' minutos.'
      ELSE
        'O job está agendado (' || v_row.schedule || ') mas nunca executou.'
    END;

    FOR v_admin IN
      SELECT DISTINCT u.id
      FROM (
        SELECT ur.user_id AS id
        FROM public.user_roles ur
        WHERE ur.role = 'admin' AND COALESCE(ur.is_active, true)
        UNION
        SELECT p.id FROM public.user_profiles p WHERE p.role = 'admin'
      ) u
    LOOP
      BEGIN
        INSERT INTO public.notifications (
          user_id, title, message, type, category, severity,
          action_url, action_label, source_type, source_id, metadata
        ) VALUES (
          v_admin.id,
          'Cron "' || v_row.jobname || '" ' || CASE v_row.state
            WHEN 'falhando' THEN 'está falhando'
            WHEN 'parado' THEN 'parou de rodar'
            ELSE 'nunca executou' END,
          v_detalhe,
          'warning',
          'system',
          'warning',
          '/admin/database-health',
          'Ver saúde do banco',
          'cron_health',
          v_row.jobname,
          jsonb_build_object(
            'jobname', v_row.jobname,
            'state', v_row.state,
            'schedule', v_row.schedule,
            'last_status', v_row.last_status,
            'last_start', v_row.last_start,
            'hours_since_last', v_row.hours_since_last,
            'expected_every_minutes', v_row.expected_every_minutes,
            'runs_24h', v_row.runs_24h,
            'failures_24h', v_row.failures_24h,
            'detected_at', now()
          )
        );
        v_notified := v_notified + 1;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END LOOP;

  -- Retenção: `cron.job_run_details` cresce sem parar (155 kB em 166 linhas no
  -- snapshot de 20/11). O snapshot semanal olha 7 dias, então 30 dias de histórico
  -- é folga suficiente.
  DELETE FROM cron.job_run_details WHERE start_time < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'jobs_com_problema', v_jobs,
    'notificacoes', v_notified,
    'linhas_removidas', v_deleted,
    'ran_at', now()
  );
END;
$function$

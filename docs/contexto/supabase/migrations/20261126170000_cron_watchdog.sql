-- Etapa 231 (achado A-133): ninguém é avisado quando um cron falha ou para.
--
-- Evidência que motivou: `data-lake-flush-daily` falhou 6 dias seguidos (15 a 20/11)
-- por `schema "net" does not exist` e a purga de locks ficou anos em 401 — os dois
-- casos só apareceram semanas depois, no snapshot semanal. O dado sempre esteve em
-- `cron.job_run_details`, mas nada o lia em tempo útil.
--
-- Esta migration cria:
--   1. `cron_health_rows()`  — leitura crua de cron.job + cron.job_run_details (interna);
--   2. `get_cron_health()`   — RPC de leitura para a tela, só admin;
--   3. `check_cron_health()` — vigia horário que notifica os admins e mantém a retenção.
--
-- O vigia detecta job que FALHA (última execução sem sucesso) e job PARADO (sem
-- execução há mais que o triplo da cadência observada, com piso de 2 horas). A
-- cadência vem do histórico (mediana dos intervalos em 14 dias), então não é preciso
-- interpretar a expressão cron nem manter uma tabela de frequências esperadas.

CREATE OR REPLACE FUNCTION public.cron_health_rows()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  last_status text,
  last_start timestamptz,
  last_end timestamptz,
  last_duration_seconds numeric,
  runs_24h bigint,
  failures_24h bigint,
  hours_since_last numeric,
  expected_every_minutes numeric,
  state text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, cron
AS $$
  WITH gaps AS (
    SELECT d.jobid,
           EXTRACT(EPOCH FROM (d.start_time - lag(d.start_time) OVER (PARTITION BY d.jobid ORDER BY d.start_time))) / 60 AS gap_minutes
    FROM cron.job_run_details d
    WHERE d.start_time > now() - interval '14 days'
  ),
  cadence AS (
    SELECT g.jobid, percentile_cont(0.5) WITHIN GROUP (ORDER BY g.gap_minutes::double precision) AS every_minutes
    FROM gaps g
    WHERE g.gap_minutes IS NOT NULL AND g.gap_minutes > 0
    GROUP BY g.jobid
  ),
  last_run AS (
    SELECT DISTINCT ON (d.jobid) d.jobid, d.status, d.start_time, d.end_time
    FROM cron.job_run_details d
    ORDER BY d.jobid, d.start_time DESC
  ),
  agg AS (
    SELECT d.jobid,
           count(*) AS runs_24h,
           count(*) FILTER (WHERE d.status <> 'succeeded') AS failures_24h
    FROM cron.job_run_details d
    WHERE d.start_time > now() - interval '24 hours'
    GROUP BY d.jobid
  )
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    lr.status::text,
    lr.start_time,
    lr.end_time,
    CASE
      WHEN lr.start_time IS NOT NULL AND lr.end_time IS NOT NULL
      THEN round(EXTRACT(EPOCH FROM (lr.end_time - lr.start_time))::numeric, 1)
    END,
    COALESCE(a.runs_24h, 0),
    COALESCE(a.failures_24h, 0),
    CASE WHEN lr.start_time IS NOT NULL THEN round(EXTRACT(EPOCH FROM (now() - lr.start_time)) / 3600, 2) END,
    CASE WHEN c.every_minutes IS NOT NULL THEN round(c.every_minutes::numeric, 0) END,
    CASE
      WHEN NOT j.active THEN 'inativo'
      WHEN lr.start_time IS NULL THEN 'nunca_executou'
      WHEN lr.status <> 'succeeded' THEN 'falhando'
      WHEN c.every_minutes IS NOT NULL
       AND now() - lr.start_time > GREATEST(interval '2 hours', make_interval(mins => (c.every_minutes * 3)::int))
      THEN 'parado'
      ELSE 'ok'
    END
  FROM cron.job j
  LEFT JOIN last_run lr ON lr.jobid = j.jobid
  LEFT JOIN cadence c ON c.jobid = j.jobid
  LEFT JOIN agg a ON a.jobid = j.jobid
  ORDER BY j.jobname;
$$

REVOKE ALL ON FUNCTION public.cron_health_rows() FROM PUBLIC

-- O Supabase concede EXECUTE a anon/authenticated/service_role por ALTER DEFAULT
-- PRIVILEGES: revogar de PUBLIC não basta. `cron_health_rows` e `check_cron_health`
-- são internas — sem isto o anon poderia ler o histórico de cron e (pior) chamar o
-- vigia, que apaga histórico de 30 dias rodando como o dono da função.
REVOKE ALL ON FUNCTION public.cron_health_rows() FROM anon, authenticated, service_role

CREATE OR REPLACE FUNCTION public.get_cron_health()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  last_status text,
  last_start timestamptz,
  last_end timestamptz,
  last_duration_seconds numeric,
  runs_24h bigint,
  failures_24h bigint,
  hours_since_last numeric,
  expected_every_minutes numeric,
  state text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'apenas administradores podem consultar a saude do cron'
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.cron_health_rows();
END;
$$

REVOKE ALL ON FUNCTION public.get_cron_health() FROM PUBLIC, anon

GRANT EXECUTE ON FUNCTION public.get_cron_health() TO authenticated

CREATE OR REPLACE FUNCTION public.check_cron_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
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
$$

REVOKE ALL ON FUNCTION public.check_cron_health() FROM PUBLIC, anon, authenticated

GRANT EXECUTE ON FUNCTION public.check_cron_health() TO service_role

SELECT cron.unschedule('cron-watchdog-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cron-watchdog-hourly')

SELECT cron.schedule(
  'cron-watchdog-hourly',
  '5 * * * *',
  $$ SELECT public.check_cron_health(); $$
)

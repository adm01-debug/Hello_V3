CREATE OR REPLACE FUNCTION public.cron_health_rows()
 RETURNS TABLE(jobname text, schedule text, active boolean, last_status text, last_start timestamp with time zone, last_end timestamp with time zone, last_duration_seconds numeric, runs_24h bigint, failures_24h bigint, hours_since_last numeric, expected_every_minutes numeric, state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
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
$function$

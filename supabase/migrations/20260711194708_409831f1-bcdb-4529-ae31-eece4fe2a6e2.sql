
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Remove agendamentos anteriores idempotentemente
DO $$
BEGIN
  PERFORM cron.unschedule('weekly-pgss-reset');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-vacuum-analyze-hot-tables');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Reset semanal de pg_stat_statements — domingo 04:00 UTC
SELECT cron.schedule(
  'weekly-pgss-reset',
  '0 4 * * 0',
  $$ SELECT pg_stat_statements_reset(); $$
);

-- VACUUM ANALYZE semanal nas tabelas quentes — domingo 04:30 UTC
SELECT cron.schedule(
  'weekly-vacuum-analyze-hot-tables',
  '30 4 * * 0',
  $$
  VACUUM (ANALYZE) public.audit_logs;
  VACUUM (ANALYZE) public.performance_metrics;
  VACUUM (ANALYZE) public.call_quality_metrics;
  VACUUM (ANALYZE) public.rate_limit_logs;
  VACUUM (ANALYZE) public.notifications;
  VACUUM (ANALYZE) public.call_sessions;
  VACUUM (ANALYZE) public.dialer_queue;
  VACUUM (ANALYZE) public.voip_quality_alerts;
  VACUUM (ANALYZE) public.login_attempts;
  VACUUM (ANALYZE) public.call_control_audit_logs;
  $$
);

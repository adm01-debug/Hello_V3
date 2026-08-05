-- Agenda limpeza diária de logs para conter crescimento e reduzir bloat
-- (audit_logs 90d, performance_metrics 30d, rate_limit_logs 7d, call_quality_metrics 90d)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-cleanup-old-logs') THEN
    PERFORM cron.unschedule('daily-cleanup-old-logs');
  END IF;
END $$;

SELECT cron.schedule(
  'daily-cleanup-old-logs',
  '15 3 * * *',
  $$SELECT public.cleanup_old_logs();$$
);

-- Tuning de autovacuum para tabelas de alta escrita (evita bloat entre execuções)
ALTER TABLE public.performance_metrics SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE public.call_quality_metrics SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE public.rate_limit_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE public.audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
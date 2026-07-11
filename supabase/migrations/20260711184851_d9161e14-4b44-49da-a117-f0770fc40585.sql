
-- 1) Drop duplicate indexes on call_quality_metrics
-- idx_cqm_created and idx_call_quality_created_at both index (created_at DESC) → keep the most used
DROP INDEX IF EXISTS public.idx_cqm_created;
-- idx_quality_metrics_session duplicates idx_cqm_call_session on (call_session_id)
DROP INDEX IF EXISTS public.idx_quality_metrics_session;
-- idx_call_quality_metrics_created_mos never used (idx_scan=0) and redundant prefix with created_at index
DROP INDEX IF EXISTS public.idx_call_quality_metrics_created_mos;

-- 2) Add missing index for the second slow query pattern:
-- call_sessions WHERE status = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_call_sessions_status_created
  ON public.call_sessions (status, created_at DESC);

-- 3) Extend cleanup routine to include performance_metrics (currently only cleanup_old_logs handles it)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';
  DELETE FROM public.performance_metrics WHERE created_at < now() - interval '30 days';
  DELETE FROM public.rate_limit_logs WHERE created_at < now() - interval '7 days';
  DELETE FROM public.call_quality_metrics WHERE created_at < now() - interval '90 days';
END;
$function$;

-- 4) Refresh planner statistics on hot tables
ANALYZE public.call_quality_metrics;
ANALYZE public.call_sessions;
ANALYZE public.performance_metrics;
ANALYZE public.audit_logs;

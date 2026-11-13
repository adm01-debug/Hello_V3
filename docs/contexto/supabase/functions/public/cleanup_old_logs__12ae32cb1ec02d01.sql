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
$function$

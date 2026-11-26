CREATE OR REPLACE FUNCTION public.get_cron_health()
 RETURNS TABLE(jobname text, schedule text, active boolean, last_status text, last_start timestamp with time zone, last_end timestamp with time zone, last_duration_seconds numeric, runs_24h bigint, failures_24h bigint, hours_since_last numeric, expected_every_minutes numeric, state text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'apenas administradores podem consultar a saude do cron'
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.cron_health_rows();
END;
$function$

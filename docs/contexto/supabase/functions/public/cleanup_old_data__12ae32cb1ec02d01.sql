CREATE OR REPLACE FUNCTION public.cleanup_old_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Mantém apenas os últimos 90 dias de logs de controle de chamadas
    DELETE FROM public.call_control_audit_logs
    WHERE created_at < now() - interval '90 days';
    
    -- Mantém apenas os últimos 90 dias de métricas de qualidade
    DELETE FROM public.call_quality_metrics
    WHERE created_at < now() - interval '90 days';
    
    -- Limpeza de logs genéricos de auditoria
    DELETE FROM public.audit_logs
    WHERE created_at < now() - interval '90 days';
END;
$function$

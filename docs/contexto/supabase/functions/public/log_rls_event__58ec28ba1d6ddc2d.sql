CREATE OR REPLACE FUNCTION public.log_rls_event(p_table_name text, p_operation text, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.rls_audit_logs (table_name, operation, user_id, client_ip, details)
    VALUES (
        p_table_name,
        p_operation,
        auth.uid(),
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        p_details
    );
END;
$function$

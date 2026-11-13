CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_resource_type text, p_resource_id text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        details,
        ip_address
    ) VALUES (
        auth.uid(),
        (auth.jwt() ->> 'email'),
        COALESCE((auth.jwt() ->> 'role'), 'authenticated'),
        p_action,
        p_resource_type,
        p_resource_id,
        p_details,
        inet_client_addr()::text
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$function$

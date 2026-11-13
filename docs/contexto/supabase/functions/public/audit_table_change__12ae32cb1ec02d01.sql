CREATE OR REPLACE FUNCTION public.audit_table_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
BEGIN
    -- Tentar obter o ID do usuário da sessão do Supabase
    current_user_id := auth.uid();
    
    INSERT INTO public.call_control_audit_logs (
        event_type,
        source,
        details
    ) VALUES (
        'table_modification',
        COALESCE(current_user_id::text, 'system'),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'old_data', CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
            'new_data', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
            'schema', TG_TABLE_SCHEMA
        )
    );
    RETURN NEW;
END;
$function$

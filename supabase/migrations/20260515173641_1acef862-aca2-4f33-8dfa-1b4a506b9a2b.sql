-- Função genérica para log de auditoria de DML
CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar auditoria em tabelas críticas de segurança
DROP TRIGGER IF EXISTS audit_user_profiles_changes ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS audit_permissions_changes ON public.permissions;
CREATE TRIGGER audit_permissions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

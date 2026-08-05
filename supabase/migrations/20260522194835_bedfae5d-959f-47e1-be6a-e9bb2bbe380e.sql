-- Função para registrar eventos de auditoria automaticamente
CREATE OR REPLACE FUNCTION public.log_critical_rls_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    -- Tentar obter ID do usuário da sessão Supabase
    v_user_id := auth.uid();
    
    -- Inserir no log de auditoria
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address
    ) VALUES (
        v_user_id,
        TG_OP || '_SENSITIVE',
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END,
        jsonb_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'old_data', CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
            'new_data', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
            'context', 'Database Trigger'
        ),
        inet_client_addr()::text
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar auditoria em gravações de chamadas (Remoção é crítico)
DROP TRIGGER IF EXISTS audit_call_recordings_delete ON public.call_recordings;
CREATE TRIGGER audit_call_recordings_delete
BEFORE DELETE ON public.call_recordings
FOR EACH ROW EXECUTE FUNCTION public.log_critical_rls_event();

-- Aplicar auditoria em troncos VoIP (Qualquer alteração é crítico)
DROP TRIGGER IF EXISTS audit_voip_trunks_change ON public.voip_trunks;
CREATE TRIGGER audit_voip_trunks_change
BEFORE INSERT OR UPDATE OR DELETE ON public.voip_trunks
FOR EACH ROW EXECUTE FUNCTION public.log_critical_rls_event();

-- Aplicar auditoria em perfis de usuários (Alterações de permissão/perfil)
DROP TRIGGER IF EXISTS audit_user_profiles_change ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_change
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_critical_rls_event();

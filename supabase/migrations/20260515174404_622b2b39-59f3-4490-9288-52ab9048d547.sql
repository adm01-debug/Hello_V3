-- Primeiro, garantir que temos uma forma robusta de identificar o agente por UUID
CREATE OR REPLACE FUNCTION public.get_auth_agent_id()
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT id FROM public.agents WHERE email = auth.jwt() ->> 'email' LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Melhorar RLS de call_sessions
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Role-based view call_sessions" ON public.call_sessions;
CREATE POLICY "Strict isolation: Agents view own sessions" 
ON public.call_sessions 
FOR SELECT 
USING (
    is_admin_or_supervisor() 
    OR 
    agent_name = get_user_agent_name() -- Fallback para nome enquanto migramos para ID
);

-- Melhorar RLS de call_recordings (linkando via session)
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Role-based view call_recordings" ON public.call_recordings;
CREATE POLICY "Strict isolation: Agents view own recordings" 
ON public.call_recordings 
FOR SELECT 
USING (
    is_admin_or_supervisor() 
    OR 
    EXISTS (
        SELECT 1 FROM public.call_sessions cs 
        WHERE cs.id = call_recordings.call_session_id 
        AND cs.agent_name = get_user_agent_name()
    )
);

-- Auditoria: Garantir que logs de auditoria também respeitam isolamento se aplicável
-- Nota: Audit logs geralmente são só para Admins, mas se agentes virem seus próprios logs:
DROP POLICY IF EXISTS "Agents can view own audit logs" ON public.call_control_audit_logs;
CREATE POLICY "Agents can view own audit logs" 
ON public.call_control_audit_logs 
FOR SELECT 
USING (
    is_admin_or_supervisor() 
    OR 
    source = (auth.jwt() ->> 'email')
);

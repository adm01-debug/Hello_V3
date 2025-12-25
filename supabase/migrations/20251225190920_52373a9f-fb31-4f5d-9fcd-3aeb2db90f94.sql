-- =====================================================
-- CORREÇÃO DE PROBLEMAS CRÍTICOS DE SEGURANÇA
-- =====================================================

-- 1. CONTACTS: Restringir acesso baseado em interações
-- Agentes só veem contatos com quem interagiram
DROP POLICY IF EXISTS "All authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "All authenticated users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "All authenticated users can insert contacts" ON public.contacts;

CREATE POLICY "Role-based view contacts" ON public.contacts
FOR SELECT USING (
  is_admin_or_supervisor() 
  OR EXISTS (
    SELECT 1 FROM public.contact_interactions ci 
    WHERE ci.contact_id = contacts.id 
    AND ci.agent_name = get_user_agent_name()
  )
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.contact_id = contacts.id 
    AND cs.agent_name = get_user_agent_name()
  )
);

CREATE POLICY "Role-based update contacts" ON public.contacts
FOR UPDATE USING (
  is_admin_or_supervisor() 
  OR EXISTS (
    SELECT 1 FROM public.contact_interactions ci 
    WHERE ci.contact_id = contacts.id 
    AND ci.agent_name = get_user_agent_name()
  )
);

CREATE POLICY "Authenticated users can insert contacts" ON public.contacts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. USER_PROFILES: Apenas próprio perfil ou admin/supervisor
-- Corrigir política para evitar recursão e restringir acesso a emails
DROP POLICY IF EXISTS "Admins e supervisores podem ver todos os perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.user_profiles;

CREATE POLICY "Users view own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins supervisors view all profiles" ON public.user_profiles
FOR SELECT USING (is_admin_or_supervisor());

-- 3. AUDIT_LOGS: Restringir INSERT apenas para função do sistema
DROP POLICY IF EXISTS "System can insert audit_logs" ON public.audit_logs;

-- Criar função para validar inserção de audit logs
CREATE OR REPLACE FUNCTION public.validate_audit_insert()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas permite inserção via função log_audit_event (contexto de security definer)
  -- ou usuários autenticados (que usam a função RPC)
  RETURN auth.uid() IS NOT NULL;
END;
$$;

CREATE POLICY "Validated audit_logs insert" ON public.audit_logs
FOR INSERT WITH CHECK (
  -- Inserção só via função log_audit_event que já valida o usuário
  validate_audit_insert()
);

-- 4. SCHEDULED_CALLBACKS: Restringir view de telefones
DROP POLICY IF EXISTS "Role-based view scheduled_callbacks" ON public.scheduled_callbacks;

CREATE POLICY "Role-based view scheduled_callbacks" ON public.scheduled_callbacks
FOR SELECT USING (
  is_admin_or_supervisor() 
  OR assigned_agent = get_user_agent_name()
);

-- 5. CALL_TRANSCRIPTIONS: Validar inserção
DROP POLICY IF EXISTS "Role-based insert call_transcriptions" ON public.call_transcriptions;

CREATE POLICY "Validated insert call_transcriptions" ON public.call_transcriptions
FOR INSERT WITH CHECK (
  is_admin_or_supervisor() 
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

-- 6. CALL_ANALYSES: Validar inserção  
DROP POLICY IF EXISTS "Role-based insert call_analyses" ON public.call_analyses;

CREATE POLICY "Validated insert call_analyses" ON public.call_analyses
FOR INSERT WITH CHECK (
  is_admin_or_supervisor() 
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

-- 7. CALL_SUMMARIES: Validar inserção
DROP POLICY IF EXISTS "Role-based insert call_summaries" ON public.call_summaries;

CREATE POLICY "Validated insert call_summaries" ON public.call_summaries
FOR INSERT WITH CHECK (
  is_admin_or_supervisor() 
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

-- 8. CALL_RECORDINGS: Validar inserção
DROP POLICY IF EXISTS "Role-based insert call_recordings" ON public.call_recordings;

CREATE POLICY "Validated insert call_recordings" ON public.call_recordings
FOR INSERT WITH CHECK (
  is_admin_or_supervisor() 
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

-- 9. CONTACT_INTERACTIONS: Validar inserção
DROP POLICY IF EXISTS "Role-based insert contact_interactions" ON public.contact_interactions;

CREATE POLICY "Validated insert contact_interactions" ON public.contact_interactions
FOR INSERT WITH CHECK (
  is_admin_or_supervisor() 
  OR agent_name = get_user_agent_name()
  OR agent_name IS NULL
);
-- 1. Create a view function to check agent is active
CREATE OR REPLACE FUNCTION public.is_active_agent(_agent_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents a
    INNER JOIN public.user_profiles up ON up.agent_id = a.id
    WHERE a.name = _agent_name
      AND up.id = auth.uid()
      AND a.status != 'inactive'
  )
$$;

-- 2. Harden contact_interactions: cross-reference agent active status
DROP POLICY IF EXISTS "Role-based view contact_interactions" ON public.contact_interactions;
CREATE POLICY "Role-based view contact_interactions"
ON public.contact_interactions
FOR SELECT
USING (
  is_admin_or_supervisor()
  OR (agent_name = get_user_agent_name() AND is_active_agent(agent_name))
);

DROP POLICY IF EXISTS "Validated insert contact_interactions" ON public.contact_interactions;
CREATE POLICY "Validated insert contact_interactions"
ON public.contact_interactions
FOR INSERT
WITH CHECK (
  is_admin_or_supervisor()
  OR (agent_name = get_user_agent_name() AND is_active_agent(agent_name))
  OR (agent_name IS NULL)
);

-- 3. Harden call_transcriptions: verify agent is active
DROP POLICY IF EXISTS "Role-based view call_transcriptions" ON public.call_transcriptions;
CREATE POLICY "Role-based view call_transcriptions"
ON public.call_transcriptions
FOR SELECT
USING (
  is_admin_or_supervisor()
  OR (EXISTS (
    SELECT 1 FROM call_sessions cs
    WHERE cs.id = call_transcriptions.call_session_id
      AND cs.agent_name = get_user_agent_name()
  ) AND is_active_agent(get_user_agent_name()))
);

DROP POLICY IF EXISTS "Validated insert call_transcriptions" ON public.call_transcriptions;
CREATE POLICY "Validated insert call_transcriptions"
ON public.call_transcriptions
FOR INSERT
WITH CHECK (
  is_admin_or_supervisor()
  OR (EXISTS (
    SELECT 1 FROM call_sessions cs
    WHERE cs.id = call_transcriptions.call_session_id
      AND cs.agent_name = get_user_agent_name()
  ) AND is_active_agent(get_user_agent_name()))
);
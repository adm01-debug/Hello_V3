-- A-223: hold_events (tempo de espera) gravavel pelo agente da chamada
--
-- Causa do indicador zerado: 20260404153313_5b939cc2-...:12-13 removeu as policies
-- de INSERT/UPDATE de hold_events e a unica policy restante capaz de inserir e
-- "Admins have full access to hold_events" (20260515170309_...:154 -> is_admin(),
-- ou seja role 'admin'). O agente comum recebe RLS 42501 em
-- src/hooks/useMultiChannelCall.ts:235 e a tabela fica vazia mesmo com
-- call_sessions gravadas (0 eventos para 101 sessoes).
--
-- A leitura tinha o mesmo defeito: "Admins supervisors and own agent can view
-- hold_events" (20260404155303_...:43-49) compara agent_name com
-- get_user_agent_name() (= agents.name), enquanto o front grava
-- user_profiles.full_name -- quando os dois nomes divergem o agente nao enxerga
-- nem o proprio hold.
--
-- Regra nova: quem enxerga/escreve e o dono da sessao (admin/supervisor sempre),
-- reconhecendo os dois nomes usados pelo produto. Idempotente, sem BEGIN/COMMIT
-- proprio (o workflow de migrations controla a transacao).

CREATE OR REPLACE FUNCTION public.is_own_call_session(_call_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.call_sessions cs
    JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE cs.id = _call_session_id
      AND (
        public.is_admin_or_supervisor()
        OR cs.agent_name = up.full_name
        OR cs.agent_name = public.get_user_agent_name()
      )
  );
$$

COMMENT ON FUNCTION public.is_own_call_session(uuid) IS
  'Verdadeiro quando a call_session pertence ao usuario logado (admin/supervisor sempre). Base das policies de hold_events.'

REVOKE ALL ON FUNCTION public.is_own_call_session(uuid) FROM PUBLIC

GRANT EXECUTE ON FUNCTION public.is_own_call_session(uuid) TO authenticated

DROP POLICY IF EXISTS "Owners can insert hold_events" ON public.hold_events

CREATE POLICY "Owners can insert hold_events"
  ON public.hold_events FOR INSERT TO authenticated
  WITH CHECK (public.is_own_call_session(call_session_id))

DROP POLICY IF EXISTS "Owners can update hold_events" ON public.hold_events

CREATE POLICY "Owners can update hold_events"
  ON public.hold_events FOR UPDATE TO authenticated
  USING (public.is_own_call_session(call_session_id))
  WITH CHECK (public.is_own_call_session(call_session_id))

DROP POLICY IF EXISTS "Owners can view hold_events" ON public.hold_events

CREATE POLICY "Owners can view hold_events"
  ON public.hold_events FOR SELECT TO authenticated
  USING (
    public.is_own_call_session(call_session_id)
    OR public.is_admin_or_supervisor()
    OR agent_name = public.get_user_agent_name()
  )

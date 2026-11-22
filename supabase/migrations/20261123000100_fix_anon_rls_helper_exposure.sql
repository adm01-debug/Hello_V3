-- HARDENING (continua 20261123000000): fecha o ultimo oraculo medido.
--
-- MEDIDO: anon sem JWT chamou is_admin_user(<uuid de um admin>) e recebeu `true` (200).
-- CAUSA: e a UNICA das helpers de RLS que recebe o uuid como PARAMETRO em vez de derivar
--        de auth.uid(). As demais -- get_user_role(), get_user_agent_id(),
--        get_user_agent_name(), has_role(uuid, app_role), is_admin(), is_supervisor(),
--        is_admin_or_supervisor(), is_active_agent(text), can_access_agent_data(text) --
--        foram conferidas por regprocedure e NAO expoem dado: com auth.uid() nulo elas
--        devolvem false/null, entao o grant a anon nao vaza nada e fica preservado para
--        nao arriscar o planejador de policies.
--
-- is_admin_user(uuid) tambem e usada em 20 policies, mas sempre como
-- public.is_admin_user(auth.uid()); revogar de anon nao afeta nenhuma delas porque a
-- avaliação acontece no contexto do role authenticated.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated, service_role;

COMMIT;

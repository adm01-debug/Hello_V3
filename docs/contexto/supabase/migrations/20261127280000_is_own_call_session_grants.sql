-- Fecha o EXECUTE de public.is_own_call_session() para public/anon.
--
-- A 20261127223000_hold_events_agent_writable.sql criou a funcao sem grant explicito,
-- entao ela ficou com o EXECUTE padrao do PostgreSQL para PUBLIC -- ou seja, anon podia
-- chamar public.is_own_call_session(uuid) pelo /rest/v1/rpc com a chave publica.
--
-- Medido em producao depois daquela migration (sonda 45922754756):
--   * funcoes de public executaveis por anon: 191 (o gate revoke_anon_role_helpers
--     passo 6 exige <= 190 e nenhuma SECURITY DEFINER de papel);
--   * a unica SECURITY DEFINER de papel aberta era is_own_call_session(uuid).
--
-- As policies de hold_events sao TO authenticated, entao anon nao precisa do EXECUTE.
-- Mesma postura das demais RPCs (20261122183000, 20261127250000).
revoke execute on function public.is_own_call_session(uuid) from public, anon

grant execute on function public.is_own_call_session(uuid) to authenticated, service_role

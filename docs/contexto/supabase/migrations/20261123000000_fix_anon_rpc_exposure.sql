-- HARDENING: fecha o vazamento medido em 23/11/2026 no projeto cfmlmcdyjuotqobjapng.
--
-- MEDIDO (nao suposto):
--   Com a publishable key e SEM JWT (role anon), as chamadas abaixo devolveram 200:
--     POST /rest/v1/rpc/get_user_roles   {"_user_id":"<uuid de um admin>"} -> ["admin"]
--     POST /rest/v1/rpc/is_admin_user    {"_user_id":"<uuid de um admin>"} -> true
--     POST /rest/v1/rpc/get_profile_role {"_user_id":"<uuid de um admin>"} -> "admin"
--     POST /rest/v1/rpc/add_to_dnc       {...} -> 200 + id, gravando linha na lista DNC
--   Ou seja: enumeração de papel por UUID e escrita anônima em tabela de compliance.
--
-- CAUSA: as funcoes recebem o uuid como PARAMETRO em vez de derivar de auth.uid(),
--        e o role anon tem GRANT EXECUTE explicito (aclexplode.grantee = 'anon'), alem
--        do GRANT a PUBLIC. Revogar so de PUBLIC nao basta.
--
-- EFEITO DE add_to_dnc: existe UMA assinatura -- (text,text,text,text,timestamptz) --
--        com DEFAULT nos dois ultimos parametros. Por isso a chamada anonima com
--        apenas 3 args em JSON foi aceita e gravou a linha.
--
-- PRESERVADO para anon (auth pre-login, roda antes de existir JWT):
--   check_login_lockout, record_failed_login, record_successful_login
--
-- PRESERVADO para anon por serem avaliadas DENTRO de policies de RLS sobre tabelas
-- cujo acesso anonimo ja e barrado pelo proprio USING (auth.uid() nulo), e cujo grant
-- explicito a anon e pre-requisito do planejador:
--   has_role(8 policies), get_user_agent_name(91), is_admin_or_supervisor(259),
--   is_admin_user(20), is_admin(9), get_user_role(11), get_user_agent_id(6),
--   can_access_agent_data(5), is_active_agent(6), is_supervisor(1)
--   -> nenhuma delas concede acesso a anon: com auth.uid() nulo o USING avalia falso.
--
-- REVOGADO de anon + PUBLIC (mantido em authenticated e service_role):
--   funcoes que aceitam uuid/telefone controlado pelo chamador e devolvem dado de
--   outro usuario, ou que escrevem em tabela de negocio, sem nenhuma policy dependente.

BEGIN;

-- 1) leitura de papel por uuid arbitrario -> vazamento de quem e admin
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_profile_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;

-- 2) escrita anonima em compliance (add_to_dnc, unica assinatura, args com DEFAULT)
REVOKE EXECUTE ON FUNCTION public.add_to_dnc(text, text, text, text, timestamptz) FROM PUBLIC, anon;

-- 3) helpers sem consumidor no app nem policy dependente
REVOKE EXECUTE ON FUNCTION public.check_dnc(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_calling_hours(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_ip_allowed(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_auth_agent_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_profile_role_from_user_roles() FROM PUBLIC, anon;

-- 4) authenticated e service_role continuam com EXECUTE (regrant idempotente, para o
--    caso de o REVOKE de PUBLIC ter derrubado a heranca usada por algum deles)
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_profile_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_to_dnc(text, text, text, text, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_dnc(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_calling_hours(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_ip_allowed(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_agent_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_profile_role_from_user_roles() TO authenticated, service_role;

COMMIT;

-- Etapa 146: revogar de anon o EXECUTE dos helpers de papel.
--
-- Dependencia que existia (documentada em 20261123000000_fix_anon_rpc_exposure.sql):
-- as policies de public sem clausula TO delegavam a estes helpers, e o planejador
-- exigia que o role anon pudesse executa-los — senao a consulta anonima morria com
-- "permission denied for function" em vez de negar.
--
-- Essa dependencia acabou: as etapas 052, 143, 144 e 145 levaram TODAS as policies de
-- public/storage para `TO authenticated`. Medido antes desta migration (sonda do run
-- 45858789396):
--   * policies cujo role listado inclui anon: 0;
--   * funcoes de public executaveis por anon: 198, das quais 8 sao SECURITY DEFINER
--     de papel: can_access_agent_data, get_user_agent_id, get_user_agent_name,
--     get_user_role, is_active_agent, is_admin, is_admin_or_supervisor, is_supervisor;
--   * nenhuma policy de public/storage fora de `authenticated` cita esses helpers.
--
-- Com anon sem nenhuma policy, o predicado nunca e avaliado nesse role; manter o
-- EXECUTE so servia para expor estas funcoes pelo /rest/v1/rpc com a chave publica.
--
-- Preservados de proposito (auth pre-login, tratamento proprio da etapa 002):
-- check_login_lockout, record_failed_login, record_successful_login.

do $$
declare
  v_assinaturas text[] := array[
    'public.can_access_agent_data(text)',
    'public.get_user_agent_id()',
    'public.get_user_agent_name()',
    'public.get_user_role()',
    'public.is_active_agent(text)',
    'public.is_admin()',
    'public.is_admin_or_supervisor()',
    'public.is_supervisor()'
  ];
  v_fn text;
  v_antes int := 0;
  v_depois int := 0;
begin
  select count(*) into v_antes
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');

  foreach v_fn in array v_assinaturas loop
    if to_regprocedure(v_fn) is null then
      raise exception 'etapa 146: assinatura % nao existe — abortando sem alterar nada', v_fn;
    end if;

    execute format('revoke execute on function %s from public, anon', v_fn);
    execute format('grant execute on function %s to authenticated, service_role', v_fn);

    raise notice 'etapa 146: % agora executavel apenas por authenticated/service_role', v_fn;
  end loop;

  select count(*) into v_depois
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');

  raise notice 'etapa 146: funcoes de public executaveis por anon: % -> %', v_antes, v_depois;
end $$;
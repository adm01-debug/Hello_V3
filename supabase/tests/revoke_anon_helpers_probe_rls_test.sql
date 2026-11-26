-- Etapa 146 (sonda, somente leitura): quem ainda precisa do EXECUTE dos helpers de papel.
begin;

do $$
declare
  r record;
  v_n int := 0;
begin
  raise notice 'PROBE policies cujo role listado inclui anon:';
  for r in select schemaname, tablename, policyname, cmd, roles::text as roles, coalesce(qual, '-') as qual
             from pg_policies
            where 'anon' = any(roles)
            order by schemaname, tablename, policyname loop
    v_n := v_n + 1;
    raise notice '  PROBE [%] %.% /% roles=% qual=%', v_n, r.schemaname, r.tablename, r.policyname, r.roles, r.qual;
  end loop;
  raise notice 'PROBE total policies com anon = %', v_n;
end $$;

do $$
declare
  r record;
  v_n int := 0;
begin
  raise notice 'PROBE funcoes de public com EXECUTE para anon:';
  for r in select p.proname,
                   pg_get_function_identity_arguments(p.oid) as args,
                   p.prosecdef::text as secdef,
                   has_function_privilege('anon', p.oid, 'EXECUTE')::text as anon_exec,
                   (select count(*) from pg_policies pol
                     where pol.schemaname in ('public', 'storage')
                       and ('anon' = any(pol.roles) or 'public' = any(pol.roles))
                       and (coalesce(pol.qual, '') like '%' || p.proname || '%'
                            or coalesce(pol.with_check, '') like '%' || p.proname || '%'))::text as policies_nao_autenticadas
             from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public'
              and has_function_privilege('anon', p.oid, 'EXECUTE')
            order by p.proname, args loop
    v_n := v_n + 1;
    raise notice '  PROBE fn public.% (%) secdef=% anon=% policies_nao_auth=%', r.proname, r.args, r.secdef, r.anon_exec, r.policies_nao_autenticadas;
  end loop;
  raise notice 'PROBE total funcoes de public executaveis por anon = %', v_n;
end $$;

do $$
declare
  r record;
  v_n int := 0;
begin
  raise notice 'PROBE policies de public/storage cujo qual cita helper e cujo role NAO e so authenticated:';
  for r in select schemaname, tablename, policyname, roles::text as roles
             from pg_policies
            where schemaname in ('public', 'storage')
              and roles <> '{authenticated}'
              and (coalesce(qual, '') ~ '(auth\.|is_admin|get_user_agent|get_user_agent_id|has_role|is_supervisor|can_access|is_active_agent|get_user_role)'
                   or coalesce(with_check, '') ~ '(auth\.|is_admin|get_user_agent|get_user_agent_id|has_role|is_supervisor|can_access|is_active_agent|get_user_role)')
            order by schemaname, tablename, policyname loop
    v_n := v_n + 1;
    raise notice '  PROBE [%] %.% roles=%', v_n, r.schemaname, r.tablename, r.policyname, r.roles;
  end loop;
  raise notice 'PROBE total policies com helper fora de authenticated = %', v_n;
end $$;

rollback;
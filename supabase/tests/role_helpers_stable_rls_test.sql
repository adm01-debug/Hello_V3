-- Etapa 101 — gate: os tres helpers de papel sao STABLE e continuam negando igual.
-- Pre-estado medido em producao: run 45862725374 (is_admin=v, is_supervisor=v,
-- is_admin_or_supervisor=v; 274 policies usam os quatro helpers).
-- Transacao revertida no fim.

begin;

-- ---------------------------------------------------------------------------
-- Passo 1: os quatro helpers sao STABLE, SECURITY DEFINER e com search_path fixo.
-- ---------------------------------------------------------------------------
do $$
declare
  v_fn text;
  v_log text := '';
  v_ok int := 0;
  r record;
begin
  foreach v_fn in array array['public.is_admin()', 'public.is_supervisor()',
                             'public.is_admin_or_supervisor()', 'public.get_auth_agent_id()'] loop
    if to_regprocedure(v_fn) is null then
      raise exception 'FALHA 1: % nao existe', v_fn;
    end if;

    select p.provolatile::text as vol, p.prosecdef as secdef,
           coalesce(array_to_string(p.proconfig, ','), '') as cfg
      into r from pg_proc p where p.oid = to_regprocedure(v_fn);

    if r.vol <> 's' then
      raise exception 'FALHA 1: % ainda e % (esperado s = STABLE)', v_fn,
        case r.vol when 'v' then 'VOLATILE' when 'i' then 'IMMUTABLE' else r.vol end;
    end if;
    if not r.secdef then
      raise exception 'FALHA 1: % perdeu SECURITY DEFINER', v_fn;
    end if;
    if position('search_path=public' in replace(r.cfg, ' ', '')) = 0 then
      raise exception 'FALHA 1: % perdeu o search_path fixo (%)', v_fn, r.cfg;
    end if;

    v_ok := v_ok + 1;
    v_log := v_log || replace(v_fn, 'public.', '') || ' ';
  end loop;

  raise notice '1/6 ok: % helpers STABLE + SECURITY DEFINER + search_path public (%)', v_ok, v_log;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 2: CREATE OR REPLACE preservou a ACL da etapa 146.
-- ---------------------------------------------------------------------------
do $$
declare
  v_fn text;
begin
  foreach v_fn in array array['public.is_admin()', 'public.is_supervisor()', 'public.is_admin_or_supervisor()'] loop
    if has_function_privilege('anon', v_fn, 'EXECUTE') then
      raise exception 'FALHA 2: anon recuperou o EXECUTE de % — o REVOKE da etapa 146 foi perdido', v_fn;
    end if;
    if not has_function_privilege('authenticated', v_fn, 'EXECUTE') then
      raise exception 'FALHA 2: authenticated perdeu o EXECUTE de % — as 274 policies quebrariam', v_fn;
    end if;
    if not has_function_privilege('service_role', v_fn, 'EXECUTE') then
      raise exception 'FALHA 2: service_role perdeu o EXECUTE de %', v_fn;
    end if;
  end loop;

  raise notice '2/6 ok: 3 helpers sem EXECUTE para anon e com authenticated + service_role (ACL preservada)';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 3: admin autenticado continua liberando — helpers true e leitura real.
-- ---------------------------------------------------------------------------
do $$
declare
  v_user uuid;
  v_agente uuid;
  v_admin boolean;
  v_sup boolean;
  v_both boolean;
  v_sessions bigint;
begin
  select up.id into v_user from public.user_profiles up where up.agent_id is not null limit 1;
  if v_user is null then
    select u.id into v_user from auth.users u order by u.created_at limit 1;
    if v_user is null then
      raise exception 'FALHA 3: sem usuario em auth.users para simular sessao';
    end if;
    select a.id into v_agente from public.agents a order by a.name limit 1;
    if v_agente is null then
      execute 'insert into public.agents (name, extension) values ($1, $2) returning id'
        into v_agente using 'gate-101 agente', 'gate101';
    end if;
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'email') then
      execute 'insert into public.user_profiles (id, email, agent_id) values ($1, $2, $3)
               on conflict (id) do update set agent_id = excluded.agent_id'
        using v_user, 'gate-101@local.invalid', v_agente;
    else
      execute 'insert into public.user_profiles (id, agent_id) values ($1, $2)
               on conflict (id) do update set agent_id = excluded.agent_id'
        using v_user, v_agente;
    end if;
  end if;

  execute 'delete from public.user_roles where user_id = $1' using v_user;
  execute 'insert into public.user_roles (user_id, role, is_active) values ($1, ''admin'', true)' using v_user;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  execute 'select public.is_admin()' into v_admin;
  execute 'select public.is_supervisor()' into v_sup;
  execute 'select public.is_admin_or_supervisor()' into v_both;
  execute 'select count(*) from public.call_sessions' into v_sessions;

  execute 'reset role';

  if not (coalesce(v_admin, false) and coalesce(v_sup, false) and coalesce(v_both, false)) then
    raise exception 'FALHA 3: admin recebeu is_admin=% is_supervisor=% is_admin_or_supervisor=%',
      v_admin, v_sup, v_both;
  end if;
  if v_sessions = 0 then
    raise exception 'FALHA 3: o admin autenticado leu 0 call_sessions — STABLE mudou o resultado da policy';
  end if;

  raise notice '3/6 ok: admin le call_sessions=% com is_admin/is_supervisor/is_admin_or_supervisor = true', v_sessions;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 4: usuario autenticado sem papel de staff continua negado, sem erro.
-- ---------------------------------------------------------------------------
do $$
declare
  v_user uuid;
  v_admin boolean;
  v_sup boolean;
  v_both boolean;
  v_sessions bigint;
begin
  select u.id into v_user from auth.users u order by u.created_at limit 1;
  if v_user is null then
    raise exception 'FALHA 4: sem usuario em auth.users para simular sessao';
  end if;

  execute 'delete from public.user_roles where user_id = $1' using v_user;
  execute 'insert into public.user_roles (user_id, role, is_active) values ($1, ''agent'', true)' using v_user;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  execute 'select public.is_admin()' into v_admin;
  execute 'select public.is_supervisor()' into v_sup;
  execute 'select public.is_admin_or_supervisor()' into v_both;
  execute 'select count(*) from public.call_sessions' into v_sessions;

  execute 'reset role';

  if coalesce(v_admin, true) or coalesce(v_sup, true) or coalesce(v_both, true) then
    raise exception 'FALHA 4: usuario role=agent recebeu is_admin=% is_supervisor=% is_admin_or_supervisor=%',
      v_admin, v_sup, v_both;
  end if;

  raise notice '4/6 ok: usuario role=agent recebe false nos 3 helpers e le call_sessions=% sem erro', v_sessions;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 5: anon continua sem EXECUTE — a troca de volatilidade nao reabriu o /rpc.
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

do $$
declare
  v_fn text;
  v_pegou boolean;
  v_sessions bigint;
begin
  foreach v_fn in array array['public.is_admin()', 'public.is_supervisor()', 'public.is_admin_or_supervisor()'] loop
    v_pegou := false;
    begin
      execute format('select %s', v_fn);
    exception when others then
      v_pegou := true;
      if position('permission denied' in sqlerrm) = 0 then
        raise exception 'FALHA 5: recusa de anon em % nao foi por privilegio: %', v_fn, sqlerrm;
      end if;
    end;
    if not v_pegou then
      raise exception 'FALHA 5: anon conseguiu chamar %', v_fn;
    end if;
  end loop;

  select count(*) into v_sessions from public.call_sessions;
  if v_sessions <> 0 then
    raise exception 'FALHA 5: anon leu % call_sessions', v_sessions;
  end if;

  raise notice '5/6 ok: anon recebe permission denied nos 3 helpers e le 0 call_sessions';
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Passo 6: o corpo (is_active + expires_at) sobreviveu ao CREATE OR REPLACE.
-- ---------------------------------------------------------------------------
do $$
declare
  v_user uuid;
  v_valido boolean;
  v_inativo boolean;
  v_expirado boolean;
begin
  select u.id into v_user from auth.users u order by u.created_at limit 1;
  if v_user is null then
    raise exception 'FALHA 6: sem usuario em auth.users para simular sessao';
  end if;

  execute 'delete from public.user_roles where user_id = $1' using v_user;
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);

  execute 'insert into public.user_roles (user_id, role, is_active, expires_at)
           values ($1, ''admin'', true, now() + interval ''1 day'')' using v_user;
  execute 'select public.is_admin_or_supervisor()' into v_valido;

  execute 'delete from public.user_roles where user_id = $1' using v_user;
  execute 'insert into public.user_roles (user_id, role, is_active)
           values ($1, ''admin'', false)' using v_user;
  execute 'select public.is_admin_or_supervisor()' into v_inativo;

  execute 'delete from public.user_roles where user_id = $1' using v_user;
  execute 'insert into public.user_roles (user_id, role, is_active, expires_at)
           values ($1, ''admin'', true, now() - interval ''1 day'')' using v_user;
  execute 'select public.is_admin_or_supervisor()' into v_expirado;

  execute 'delete from public.user_roles where user_id = $1' using v_user;

  if not coalesce(v_valido, false) then
    raise exception 'FALHA 6: papel ativo e vigente devolveu false';
  end if;
  if coalesce(v_inativo, true) then
    raise exception 'FALHA 6: papel com is_active=false continua liberando';
  end if;
  if coalesce(v_expirado, true) then
    raise exception 'FALHA 6: papel com expires_at no passado continua liberando';
  end if;

  raise notice '6/6 ok: corpo preservado — vigente=true, is_active=false=false, expirado=false';
end $$;

rollback;
-- Etapa 146 — gate: anon sem EXECUTE nos helpers de papel, sem quebrar o caminho autenticado.
-- Sonda que originou a migration: run 45858789396 (0 policies com anon; 198 funcoes de
-- public executaveis por anon, 8 delas SECURITY DEFINER de papel).
-- Transacao revertida no fim.

begin;

-- ---------------------------------------------------------------------------
-- Passo 1: pre-requisito da etapa — nenhum role anon/public em policy de public/storage.
-- ---------------------------------------------------------------------------
do $$
declare n int; txt text;
begin
  select count(*), string_agg(schemaname || '.' || tablename || '.' || policyname, ', ')
    into n, txt
    from pg_policies
   where schemaname in ('public', 'storage')
     and ('anon' = any(roles) or 'public' = any(roles));

  if n = 0 then
    raise notice '1/6 ok: nenhuma policy de public/storage avaliada por anon/public — o EXECUTE deixou de ser necessario';
  else
    raise exception 'FALHA 1: % policy(ies) ainda avaliadas por anon/public: % — revogar agora trocaria negar por erro', n, txt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 2: as 8 assinaturas perderam o EXECUTE de anon e mantiveram o de authenticated/service_role.
-- ---------------------------------------------------------------------------
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
  v_acl text;
  v_ok int := 0;
  v_log text := '';
begin
  foreach v_fn in array v_assinaturas loop
    if to_regprocedure(v_fn) is null then
      raise exception 'FALHA 2: % nao existe', v_fn;
    end if;

    if has_function_privilege('anon', v_fn, 'EXECUTE') then
      raise exception 'FALHA 2: anon ainda executa %', v_fn;
    end if;
    if not has_function_privilege('authenticated', v_fn, 'EXECUTE') then
      raise exception 'FALHA 2: authenticated perdeu o EXECUTE de % — as policies de RLS quebrariam', v_fn;
    end if;
    if not has_function_privilege('service_role', v_fn, 'EXECUTE') then
      raise exception 'FALHA 2: service_role perdeu o EXECUTE de % — as edge functions quebrariam', v_fn;
    end if;

    select coalesce(array_to_string(proacl, ' | '), 'default') into v_acl from pg_proc where oid = to_regprocedure(v_fn);
    v_ok := v_ok + 1;
    v_log := v_log || trim(both ' ' from replace(v_fn, 'public.', '')) || ' ';
  end loop;

  raise notice '2/6 ok: % assinaturas sem anon e com authenticated+service_role (%)', v_ok, v_log;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 3: anon recebe conjunto vazio (nao erro) nas tabelas de cliente.
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

do $$
declare
  t text;
  v_n bigint;
  v_total bigint := 0;
  v_vistas int := 0;
begin
  foreach t in array array['contacts', 'deals', 'agents', 'call_sessions', 'conversations', 'user_roles', 'audit_logs'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into v_n;
      v_vistas := v_vistas + 1;
      v_total := v_total + v_n;
    end if;
  end loop;

  if v_total <> 0 then
    raise exception 'FALHA 3: anon leu % linha(s) protegidas', v_total;
  end if;

  raise notice '3/6 ok: anon le 0 linhas em % tabelas protegidas, sem erro de funcao', v_vistas;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 4: a chamada direta do helper por anon e recusada por privilegio (fecha o /rest/v1/rpc).
-- ---------------------------------------------------------------------------
do $$
declare
  v_pegou boolean := false;
  v_msg text;
begin
  begin
    perform public.is_admin();
  exception when others then
    v_pegou := true;
    v_msg := sqlerrm;
  end;

  if not v_pegou then
    raise exception 'FALHA 4: anon conseguiu chamar public.is_admin() diretamente';
  end if;
  if position('permission denied' in v_msg) = 0 then
    raise exception 'FALHA 4: a recusa do anon nao foi por privilegio (mensagem: %)', v_msg;
  end if;

  begin
    perform public.get_user_agent_name();
    raise exception 'FALHA 4: anon conseguiu chamar public.get_user_agent_name() diretamente';
  exception when others then
    if position('permission denied' in sqlerrm) = 0 then
      raise exception 'FALHA 4: recusa inesperada em get_user_agent_name: %', sqlerrm;
    end if;
  end;

  raise notice '4/6 ok: anon recebe permission denied ao chamar is_admin() e get_user_agent_name()';
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Passo 5: o caminho autenticado continua funcionando — helper responde e a leitura e real.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  v_n bigint;
  v_log text := '';
  v_total bigint := 0;
  v_user uuid;
  v_agente_id uuid;
  v_is_admin text;
  v_agent text;
begin
  select up.id into v_user from public.user_profiles up where up.agent_id is not null limit 1;

  if v_user is null then
    select u.id into v_user from auth.users u order by u.created_at limit 1;
    if v_user is null then
      raise exception 'FALHA 5: auth.users tem 0 linhas - sem sessao autenticada para simular';
    end if;

    select a.id into v_agente_id from public.agents a order by a.name limit 1;
    if v_agente_id is null then
      execute 'insert into public.agents (name, extension) values ($1, $2) returning id'
        into v_agente_id using 'gate-146 agente', 'gate146';
    end if;

    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'email') then
      execute 'insert into public.user_profiles (id, email, agent_id) values ($1, $2, $3)
               on conflict (id) do update set agent_id = excluded.agent_id'
        using v_user, 'gate-146@local.invalid', v_agente_id;
    else
      execute 'insert into public.user_profiles (id, agent_id) values ($1, $2)
               on conflict (id) do update set agent_id = excluded.agent_id'
        using v_user, v_agente_id;
    end if;
  end if;

  execute 'delete from public.user_roles where user_id = $1' using v_user;
  execute 'insert into public.user_roles (user_id, role, is_active) values ($1, ''admin'', true)' using v_user;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  execute 'select public.is_admin()::text' into v_is_admin;
  execute 'select coalesce(public.get_user_agent_name(), ''-null-'')' into v_agent;

  foreach t in array array['conversations', 'call_quality_metrics', 'contacts', 'deals', 'call_sessions'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into v_n;
      v_total := v_total + v_n;
      v_log := v_log || format('%s=%s ', t, v_n);
    end if;
  end loop;

  execute 'reset role';

  if v_is_admin <> 'true' then
    raise exception 'FALHA 5: is_admin() devolveu % para um usuario com user_roles admin', v_is_admin;
  end if;
  if v_agent = '-null-' then
    raise exception 'FALHA 5: get_user_agent_name() devolveu nulo para um usuario com agent_id';
  end if;
  if v_total = 0 then
    raise exception 'FALHA 5: o admin autenticado leu 0 linhas nas tabelas de cliente (%)', v_log;
  end if;

  raise notice '5/6 ok: authenticated executa os helpers (is_admin=%, agent_name=%) e le de verdade (%)', v_is_admin, v_agent, v_log;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 6: nenhum outro ganho colateral — anon perdeu exatamente os helpers de papel.
-- ---------------------------------------------------------------------------
do $$
declare
  v_anon int;
  v_papel int;
begin
  select count(*) into v_anon
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');

  select count(*) into v_papel
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and has_function_privilege('anon', p.oid, 'EXECUTE')
     and p.prosecdef
     and (p.proname ~ '^(is_|get_user|has_|can_access)');

  if v_papel <> 0 then
    raise exception 'FALHA 6: % funcao(oes) SECURITY DEFINER de papel ainda executaveis por anon', v_papel;
  end if;
  if v_anon > 190 then
    raise exception 'FALHA 6: anon ainda executa % funcoes de public (esperado <= 190, eram 198)', v_anon;
  end if;

  raise notice '6/6 ok: anon executa % funcoes de public (eram 198) e nenhuma SECURITY DEFINER de papel', v_anon;
end $$;

rollback;
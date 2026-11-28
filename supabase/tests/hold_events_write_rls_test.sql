-- Gate da A-223: o tempo de espera (hold_events) precisa ser gravavel pelo agente
-- da chamada. Antes desta correcao a unica policy capaz de inserir era
-- "Admins have full access to hold_events" (is_admin), entao
-- src/hooks/useMultiChannelCall.ts:235 levava RLS 42501 e a tabela ficou com
-- 0 linhas apesar de 101 call_sessions.
--
-- Roda em transacao revertida (nada fica gravado).
--  1) a funcao is_own_call_session(uuid) existe e e SECURITY DEFINER
--  2) hold_events tem policy de INSERT/UPDATE/SELECT TO authenticated por dono
--  3) o agente dono da sessao grava o hold (row_count = 1)
--  4) o agente dono enxerga o proprio hold na leitura
--  5) outro agente nao grava hold na sessao alheia (42501)
--  6) outro agente nao enxerga o hold (0 linhas)
--  7) anon nao grava (42501)
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1: a funcao de propriedade da sessao existe
do $$
declare
  v_secdef boolean;
begin
  select p.prosecdef into v_secdef
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'is_own_call_session';

  if v_secdef is null then
    raise exception 'public.is_own_call_session(uuid) nao existe: as policies de hold_events continuam sem dono';
  end if;
  if not v_secdef then
    raise exception 'is_own_call_session nao e SECURITY DEFINER: a leitura de user_profiles/call_sessions pode falhar sob RLS';
  end if;
  raise notice '1/7 ok: is_own_call_session(uuid) existe e e SECURITY DEFINER';
end $$;

-- 2: policies de INSERT, UPDATE e SELECT para authenticated, sem anon/public
do $$
declare
  v_cmd text;
  v_nome text;
  v_qual text;
  v_roles name[];
  v_esperado text[][] := array[
    ['INSERT', 'Owners can insert hold_events'],
    ['UPDATE', 'Owners can update hold_events'],
    ['SELECT', 'Owners can view hold_events']
  ];
  i integer;
begin
  for i in 1 .. array_length(v_esperado, 1) loop
    v_cmd := v_esperado[i][1];
    v_nome := v_esperado[i][2];
    select coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''), p.roles
      into v_qual, v_roles
      from pg_policies p
     where p.schemaname = 'public'
       and p.tablename = 'hold_events'
       and p.cmd = v_cmd
       and p.policyname = v_nome;

    if v_qual is null then
      raise exception 'hold_events sem policy % (cmd %)', v_nome, v_cmd;
    end if;
    if v_qual not ilike '%is_own_call_session%' then
      raise exception 'policy de % nao usa is_own_call_session (predicado=%)', v_cmd, v_qual;
    end if;
    if v_roles <> array['authenticated']::name[] then
      raise exception 'policy de % deveria ser TO authenticated, esta em %', v_cmd, v_roles;
    end if;
  end loop;

  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'hold_events'
       and roles && array['anon', 'public']::name[]
       and cmd in ('INSERT', 'UPDATE', 'SELECT')
       and policyname not like 'Admins have full access%'
  ) then
    raise exception 'ha policy de hold_events alcancando anon/public';
  end if;

  raise notice '2/7 ok: INSERT/UPDATE/SELECT por dono, TO authenticated';
end $$;

-- papeis para simular: um admin ativo e um agente vinculado (com outro agente de contraste)
select ur.user_id as admin_id
  from public.user_roles ur
 where ur.role = 'admin'
   and coalesce(ur.is_active, true)
   and (ur.expires_at is null or ur.expires_at > now())
 limit 1 \gset

-- O front grava hold_events.agent_name a partir de user_profiles.full_name
-- (src/hooks/useMultiChannelCall.ts:168), entao a sonda usa o mesmo valor.
select up.id as dono_id, coalesce(nullif(up.full_name, ''), 'Agente Teste A-223') as dono_agent
  from public.user_profiles up
 order by up.id
 limit 1 \gset

-- Contraste: outro usuario que nao seja admin/supervisor (esses tem policy propria).
-- exists() sempre devolve uma linha, entao serve de booleano para o \if sem
-- depender de haver candidato.
select exists (
  select 1
    from public.user_profiles up
   where up.id <> :'dono_id'
     and not exists (
       select 1 from public.user_roles ur
        where ur.user_id = up.id
          and ur.role in ('admin', 'supervisor')
          and coalesce(ur.is_active, true)
          and (ur.expires_at is null or ur.expires_at > now())
     )
) as tem_outro \gset

\if :{?admin_id}
\else
  \echo 'PULADO: nao ha admin ativo em user_roles'
  rollback;
  \quit
\endif
\if :{?dono_id}
\else
  \echo 'PULADO 3-7: nenhum usuario em user_profiles'
  rollback;
  \quit
\endif

select set_config('request.jwt.claims', json_build_object('sub', :'admin_id')::text, true);
set local role authenticated;

select gen_random_uuid() as sessao \gset
select set_config('teste.sessao', :'sessao', true);

-- sessao do agente dono, gravada pelo admin (policy de call_sessions permite)
insert into public.call_sessions (id, agent_name, caller_name, caller_phone, status, started_at)
values (:'sessao', :'dono_agent', 'Cliente Teste A-223', '+5511999999999', 'active', now());

-- 3: o dono grava o hold
select set_config('request.jwt.claims', json_build_object('sub', :'dono_id')::text, true);
do $$
declare
  v_sessao uuid := current_setting('teste.sessao')::uuid;
  v_rows integer;
begin
  insert into public.hold_events (call_session_id, agent_name, started_at)
  values (v_sessao, null, now());
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'agente dono nao conseguiu gravar hold_events (row_count=%)', v_rows;
  end if;
  raise notice '3/7 ok: dono gravou o hold (row_count=1)';
end $$;

-- 4: o dono enxerga o proprio hold
do $$
declare
  v_sessao uuid := current_setting('teste.sessao')::uuid;
  v_total integer;
begin
  select count(*) into v_total from public.hold_events where call_session_id = v_sessao;
  if v_total < 1 then
    raise exception 'dono nao enxerga o proprio hold (% linhas)', v_total;
  end if;
  raise notice '4/7 ok: dono enxerga o proprio hold (% linha(s))', v_total;
end $$;

-- 5: outro agente nao grava na sessao alheia
\if :tem_outro
select up.id as outro_id
  from public.user_profiles up
 where up.id <> :'dono_id'
   and not exists (
     select 1 from public.user_roles ur
      where ur.user_id = up.id
        and ur.role in ('admin', 'supervisor')
        and coalesce(ur.is_active, true)
        and (ur.expires_at is null or ur.expires_at > now())
   )
 order by up.id
 limit 1 \gset

select set_config('request.jwt.claims', json_build_object('sub', :'outro_id')::text, true);
do $$
declare
  v_sessao uuid := current_setting('teste.sessao')::uuid;
begin
  begin
    insert into public.hold_events (call_session_id, agent_name, started_at)
    values (v_sessao, null, now());
    raise exception 'outro agente conseguiu gravar hold em sessao alheia: a policy esta aberta';
  exception
    when insufficient_privilege then
      raise notice '5/7 ok: outro agente bloqueado (42501)';
  end;
end $$;

-- 6: outro agente nao enxerga o hold do dono
do $$
declare
  v_sessao uuid := current_setting('teste.sessao')::uuid;
  v_total integer;
begin
  select count(*) into v_total from public.hold_events where call_session_id = v_sessao;
  if v_total <> 0 then
    raise exception 'outro agente enxerga % hold(s) da sessao alheia', v_total;
  end if;
  raise notice '6/7 ok: outro agente nao enxerga o hold alheio';
end $$;
\else
  \echo 'PULADO 5-6: nao ha segundo agente vinculado'
\endif

-- 7: anon nao grava
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare
  v_sessao uuid := current_setting('teste.sessao')::uuid;
begin
  perform set_config('role', 'anon', true);
  begin
    insert into public.hold_events (call_session_id, agent_name, started_at)
    values (v_sessao, null, now());
    raise exception 'anon conseguiu gravar hold_events';
  exception
    when insufficient_privilege then
      raise notice '7/7 ok: anon bloqueado (42501)';
  end;
end $$;

rollback;
\echo 'hold_events_write_rls_test: OK (transacao revertida, nada gravado)'
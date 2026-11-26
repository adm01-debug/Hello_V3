-- Gate da etapa 052 -- prova que as cinco tabelas mais sensiveis deixaram de avaliar policy
-- para `anon`/`PUBLIC` e continuam legiveis por um usuario autenticado.
--
-- Roda em transacao revertida: nada e gravado em producao.

\set ON_ERROR_STOP on

begin;

create temp table gate_052 (tabela text primary key, linhas_auth bigint) on commit drop;

-- 1. Nenhuma das cinco tabelas tem mais policy com roles = {public} (o default do Postgres,
--    que inclui anon).
do $$
declare v_falta text;
begin
  select string_agg(format('%s.%s', p.tablename, p.policyname), ', ' order by p.tablename, p.policyname)
    into v_falta
    from pg_policies p
   where p.schemaname = 'public'
     and p.tablename in ('conversations', 'conversation_messages',
                         'call_quality_metrics', 'meeting_summaries', 'agent_devices')
     and p.roles = '{public}';

  if v_falta is not null then
    raise exception 'FALHA 1: policies ainda avaliadas por anon/public: %', v_falta;
  end if;
  raise notice '1/6 ok: nenhuma policy das 5 tabelas e avaliada por anon/public';
end $$;

-- 2. Nenhuma das cinco ficou sem policy: todas tem ao menos uma declarada para authenticated.
do $$
declare
  t text;
  v_falta text[] := '{}';
  v_n int;
begin
  foreach t in array array['conversations', 'conversation_messages',
                           'call_quality_metrics', 'meeting_summaries', 'agent_devices'] loop
    if to_regclass('public.' || t) is null then
      raise exception 'FALHA 2: a tabela public.% nao existe', t;
    end if;

    select count(*) into v_n
      from pg_policies p
     where p.schemaname = 'public'
       and p.tablename = t
       and 'authenticated'::name = any(p.roles);

    if v_n = 0 then
      v_falta := v_falta || t;
    end if;
  end loop;

  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 2: tabela(s) sem nenhuma policy para authenticated: %', array_to_string(v_falta, ', ');
  end if;
  raise notice '2/6 ok: as 5 tabelas tem policy declarada para authenticated';
end $$;

-- 3. Os grants de leitura continuam para authenticated (o ALTER POLICY nao toca em GRANT).
do $$
declare
  t text;
  v_falta text[] := '{}';
begin
  foreach t in array array['conversations', 'conversation_messages',
                           'call_quality_metrics', 'meeting_summaries', 'agent_devices'] loop
    if not has_table_privilege('authenticated', 'public.' || t, 'SELECT') then
      v_falta := v_falta || t;
    end if;
  end loop;

  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 3: authenticated perdeu SELECT em: %', array_to_string(v_falta, ', ');
  end if;
  raise notice '3/6 ok: authenticated mantem SELECT nas 5 tabelas';
end $$;

-- 4. Um usuario autenticado (com vinculo usuario -> agente) le as cinco tabelas sem erro.
do $$
declare
  t text;
  v_n bigint;
  v_user uuid;
  v_agente_id uuid;
  v_claims text;
begin
  -- A producao nao tem user_profiles.agent_id preenchido: monta o vinculo dentro da transacao
  -- (revertida no rollback) para que os predicados get_user_agent_name()/is_admin_or_supervisor()
  -- sejam avaliados de verdade.
  select up.id into v_user
    from public.user_profiles up
   where up.agent_id is not null
   limit 1;

  if v_user is null then
    select u.id into v_user from auth.users u order by u.created_at limit 1;
    if v_user is null then
      raise notice '4/6 pulado: auth.users tem 0 linhas - sem sessao autenticada para simular';
      return;
    end if;

    select a.id into v_agente_id from public.agents a order by a.name limit 1;
    if v_agente_id is null then
      execute 'insert into public.agents (name, extension) values ($1, $2) returning id'
        into v_agente_id using 'gate-052 agente', 'gate052';
    end if;

    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'email') then
      execute 'insert into public.user_profiles (id, email, agent_id) values ($1, $2, $3)
               on conflict (id) do update set agent_id = excluded.agent_id'
        using v_user, 'gate-052@local.invalid', v_agente_id;
    else
      execute 'insert into public.user_profiles (id, agent_id) values ($1, $2)
               on conflict (id) do update set agent_id = excluded.agent_id'
        using v_user, v_agente_id;
    end if;
    raise notice '4/6 info: vinculo usuario->agente criado dentro da transacao';
  end if;

  v_claims := json_build_object('sub', v_user, 'role', 'authenticated')::text;
  perform set_config('request.jwt.claims', v_claims, true);
  execute 'set local role authenticated';

  foreach t in array array['conversations', 'conversation_messages',
                           'call_quality_metrics', 'meeting_summaries', 'agent_devices'] loop
    execute format('select count(*) from public.%I', t) into v_n;
    insert into gate_052 values (t, v_n);
  end loop;

  execute 'reset role';

  if (select count(*) from gate_052) <> 5 then
    raise exception 'FALHA 4: so % das 5 tabelas foram lidas', (select count(*) from gate_052);
  end if;
  raise notice '4/6 ok: authenticated le as 5 tabelas sem erro (anon %, conversas %, mensagens %)',
    (select linhas_auth from gate_052 where tabela = 'agent_devices'),
    (select linhas_auth from gate_052 where tabela = 'conversations'),
    (select linhas_auth from gate_052 where tabela = 'conversation_messages');
end $$;

-- 5. anon nao obtem uma unica linha nas cinco tabelas (0 linhas ou permission denied).
do $$
declare
  t text;
  v_n bigint;
  v_total bigint := 0;
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';

  foreach t in array array['conversations', 'conversation_messages',
                           'call_quality_metrics', 'meeting_summaries', 'agent_devices'] loop
    begin
      execute format('select count(*) from public.%I', t) into v_n;
      v_total := v_total + coalesce(v_n, 0);
    exception
      when insufficient_privilege then
        v_n := 0;  -- sem GRANT tambem e negacao: nao ha linha exposta
      when others then
        raise;
    end;
  end loop;

  execute 'reset role';

  if v_total > 0 then
    raise exception 'FALHA 5: anon leu % linha(s) nas 5 tabelas', v_total;
  end if;
  raise notice '5/6 ok: anon nao le nenhuma das 5 tabelas (0 linhas)';
end $$;

-- 6. Regressao: RLS continua habilitado nas cinco tabelas.
do $$
declare
  t text;
  v_falta text[] := '{}';
begin
  foreach t in array array['conversations', 'conversation_messages',
                           'call_quality_metrics', 'meeting_summaries', 'agent_devices'] loop
    if not (select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.' || t)) then
      v_falta := v_falta || t;
    end if;
  end loop;

  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 6: RLS desabilitado em: %', array_to_string(v_falta, ', ');
  end if;
  raise notice '6/6 ok: RLS segue habilitado nas 5 tabelas';
end $$;

rollback;
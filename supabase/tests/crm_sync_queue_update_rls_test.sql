-- Gate da etapa 082 (A-066): a fila de sincronizacao do CRM precisa de policy de
-- UPDATE, senao toda tentativa fica em 'in_progress' para sempre
-- (src/lib/bitrix/sync-log.ts:50-53 e :66-68 chamam update e sao barrados em silencio).
--
-- Tudo roda em transacao revertida: a tentativa de teste nao fica gravada.
--  1) existe policy de UPDATE, TO authenticated, condicionada ao papel
--  2) nenhuma policy de UPDATE alcanca anon/public
--  3) admin/supervisor enfileira e fecha como 'success' (row_count = 1)
--  4) admin/supervisor fecha como 'failed' com last_error
--  5) usuario comum nao altera a fila (0 linhas)
--  6) anon nao altera a fila
--  7) a leitura continua restrita ao admin (a nova policy nao abriu SELECT)
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1: a policy de UPDATE existe com o predicado certo e o papel certo
do $$
declare
  v_qual text;
  v_roles name[];
begin
  select coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''), p.roles
    into v_qual, v_roles
    from pg_policies p
   where p.schemaname = 'public'
     and p.tablename = 'crm_sync_queue'
     and p.cmd = 'UPDATE'
   limit 1;

  if v_qual is null then
    raise exception 'crm_sync_queue nao tem policy de UPDATE: o update de sync-log.ts continua barrado';
  end if;
  if v_qual not ilike '%is_admin_or_supervisor%' then
    raise exception 'policy de UPDATE nao usa is_admin_or_supervisor (qual=%)', v_qual;
  end if;
  if v_roles <> array['authenticated']::name[] then
    raise exception 'policy de UPDATE deveria ser TO authenticated, esta em %', v_roles;
  end if;
  raise notice '1/7 ok: policy de UPDATE presente, TO authenticated, por papel';
end $$;

-- 2: nenhuma policy de UPDATE/ALL aberta a anon ou public
do $$
declare
  v_bad integer;
begin
  select count(*) into v_bad
    from pg_policies p
   where p.schemaname = 'public'
     and p.tablename = 'crm_sync_queue'
     and p.cmd in ('UPDATE', 'ALL')
     and p.roles && array['anon', 'public']::name[];
  if v_bad <> 0 then
    raise exception 'ha % policy(s) de UPDATE alcancando anon/public na fila do CRM', v_bad;
  end if;
  raise notice '2/7 ok: nenhuma policy de UPDATE para anon/public';
end $$;

-- papeis para simular: um admin/supervisor e um usuario comum
select ur.user_id as admin_id
  from public.user_roles ur
 where ur.role in ('admin', 'supervisor')
   and coalesce(ur.is_active, true)
   and (ur.expires_at is null or ur.expires_at > now())
 limit 1 \gset

select u.id as comum_id
  from auth.users u
 where u.id <> :'admin_id'
   and not exists (
     select 1 from public.user_roles r
      where r.user_id = u.id
        and r.role in ('admin', 'supervisor')
        and coalesce(r.is_active, true)
   )
 order by u.created_at nulls last, u.id
 limit 1 \gset

\if :{?admin_id}
\else
  \echo 'PULADO 3-7: nao ha admin/supervisor ativo em user_roles'
  rollback;
  \quit
\endif

select gen_random_uuid() as sync_id \gset
select set_config('teste.sync_id', :'sync_id', true);
select set_config('teste.admin_id', :'admin_id', true);
\if :{?comum_id}
select set_config('teste.comum_id', :'comum_id', true);
\endif
select set_config('request.jwt.claims', json_build_object('sub', :'admin_id')::text, true);

-- 3: o fluxo real — enfileira 'in_progress' e fecha 'success'
set local role authenticated;
insert into public.crm_sync_queue (id, action, payload, status, attempts)
values (:'sync_id', 'sync_agents', '{}'::jsonb, 'in_progress', 1);

do $$
declare
  v_id uuid := current_setting('teste.sync_id')::uuid;
  v_rows integer;
  v_status text;
  v_updated timestamptz;
  v_created timestamptz;
begin
  update public.crm_sync_queue set status = 'success', last_error = null where id = v_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'admin/supervisor nao fechou a tentativa (row_count=%)', v_rows;
  end if;
  select status, updated_at, created_at into v_status, v_updated, v_created
    from public.crm_sync_queue where id = v_id;
  if v_status <> 'success' then
    raise exception 'status nao virou success (ficou %)', v_status;
  end if;
  if v_updated < v_created then
    raise exception 'trigger update_crm_sync_queue_updated_at nao rodou';
  end if;
  raise notice '3/7 ok: admin enfileira e fecha a tentativa como success';
end $$;

-- 4: falha tambem fecha, com a mensagem
do $$
declare
  v_id uuid := current_setting('teste.sync_id')::uuid;
  v_rows integer;
  v_erro text;
begin
  update public.crm_sync_queue
     set status = 'failed', last_error = left(repeat('e', 2100), 2000)
   where id = v_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'admin/supervisor nao marcou falha (row_count=%)', v_rows;
  end if;
  select last_error into v_erro from public.crm_sync_queue where id = v_id;
  if v_erro is null or length(v_erro) <> 2000 then
    raise exception 'last_error nao persistiu (len=%)', coalesce(length(v_erro), -1);
  end if;
  raise notice '4/7 ok: admin marca falha e grava last_error';
end $$;

-- 5: usuario comum nao altera a fila
\if :{?comum_id}
select set_config('request.jwt.claims', json_build_object('sub', :'comum_id')::text, true);
do $$
declare
  v_id uuid := current_setting('teste.sync_id')::uuid;
  v_rows integer;
begin
  update public.crm_sync_queue set status = 'success' where id = v_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'usuario comum alterou % linha(s) da fila do CRM', v_rows;
  end if;
  raise notice '5/7 ok: usuario comum nao altera a fila (0 linhas sob RLS)';
end $$;
\else
\echo 'PULADO 5: nao ha usuario comum em auth.users'
\endif

reset role;
select set_config('request.jwt.claims', '', true);

-- 6: anon nao altera
do $$
declare
  v_id uuid := current_setting('teste.sync_id')::uuid;
  v_rows integer;
begin
  begin
    execute 'set local role anon';
  exception when insufficient_privilege then
    raise notice '6/7 pulado: sem privilegio para assumir anon';
    return;
  end;
  begin
    execute format('update public.crm_sync_queue set status = %L where id = %L', 'success', v_id);
  exception when insufficient_privilege then
    execute 'reset role';
    raise notice '6/7 ok: anon sem privilegio de UPDATE na fila';
    return;
  end;
  get diagnostics v_rows = row_count;
  execute 'reset role';
  if v_rows <> 0 then
    raise exception 'anon alterou % linha(s) da fila do CRM', v_rows;
  end if;
  raise notice '6/7 ok: anon nao altera a fila (0 linhas)';
end $$;

-- 7: a leitura continua de admin — a policy de UPDATE nao abriu SELECT
do $$
declare
  v_id uuid := current_setting('teste.sync_id')::uuid;
  v_n integer;
begin
  begin
    execute 'set local role anon';
  exception when insufficient_privilege then
    raise notice '7/7 pulado: sem privilegio para assumir anon';
    return;
  end;
  begin
    execute format('select count(*) from public.crm_sync_queue where id = %L', v_id) into v_n;
  exception when insufficient_privilege then
    execute 'reset role';
    raise notice '7/7 ok: anon sem privilegio de SELECT na fila';
    return;
  end;
  execute 'reset role';
  if v_n <> 0 then
    raise exception 'anon leu % linha(s) da fila do CRM', v_n;
  end if;
  raise notice '7/7 ok: anon nao le a fila (0 linhas sob RLS)';
end $$;

rollback;

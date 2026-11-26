-- Gate do A-143: retrato diario do pipeline aberto.
-- Roda dentro de transacao revertida (migrations.yml modo=verificar).
--   1) RLS ligada na tabela de retratos
--   2) cliente nao escreve: nenhuma policy de escrita
--   3) leitura restrita a admin/supervisor
--   4) job diario agendado e ativo
--   5) funcao SECURITY DEFINER com search_path fixo
--   6) a funcao grava o retrato e faz upsert no mesmo dia (1 linha por dia)
--   7) admin ve, usuario comum nao ve (RLS de verdade, como `authenticated`)
--   8) anon nao ve linhas

begin;

do $$
declare
  v_rls boolean;
  v_policies integer;
  v_read_policies integer;
  v_job integer;
  v_secdef boolean;
  v_path text;
  v_before integer;
  v_after integer;
  v_row record;
begin
  select relrowsecurity into v_rls
  from pg_class where oid = 'public.deal_pipeline_snapshots'::regclass;
  if v_rls is not true then
    raise exception 'RLS desligada em deal_pipeline_snapshots';
  end if;
  raise notice '1/8 ok: RLS ligada em deal_pipeline_snapshots';

  select count(*) into v_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'deal_pipeline_snapshots'
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL');
  if v_policies <> 0 then
    raise exception 'existem % policy(s) de escrita para o cliente', v_policies;
  end if;
  raise notice '2/8 ok: nenhuma policy de escrita';

  select count(*) into v_read_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'deal_pipeline_snapshots'
    and cmd = 'SELECT' and qual like '%is_admin_or_supervisor%';
  if v_read_policies < 1 then
    raise exception 'nenhuma policy de leitura restrita a admin/supervisor';
  end if;
  raise notice '3/8 ok: % policy(s) de leitura restritas a admin/supervisor', v_read_policies;

  select count(*) into v_job
  from cron.job
  where jobname = 'deal-pipeline-snapshot-daily' and active;
  if v_job <> 1 then
    raise exception 'job diario do pipeline nao esta agendado/ativo';
  end if;
  raise notice '4/8 ok: job diario agendado e ativo';

  select p.prosecdef, array_to_string(p.proconfig, ',') into v_secdef, v_path
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'snapshot_deals_daily';
  if v_secdef is not true or coalesce(v_path, '') not like 'search_path=%' then
    raise exception 'snapshot_deals_daily sem SECURITY DEFINER com search_path fixo';
  end if;
  raise notice '5/8 ok: SECURITY DEFINER com search_path fixo';

  -- Estado conhecido: a migration ja gravou o retrato de hoje, entao a prova
  -- comeca do zero (tudo dentro da transacao revertida no fim).
  delete from public.deal_pipeline_snapshots where snapshot_date = current_date;
  select count(*) into v_before from public.deal_pipeline_snapshots where snapshot_date = current_date;
  if v_before <> 0 then
    raise exception 'nao consegui zerar o retrato de hoje (sobrou %)', v_before;
  end if;
  perform public.snapshot_deals_daily();
  perform public.snapshot_deals_daily();
  select count(*) into v_after from public.deal_pipeline_snapshots where snapshot_date = current_date;
  if v_after <> 1 then
    raise exception 'esperava 1 linha para hoje depois de 2 execucoes, obteve %', v_after;
  end if;
  select open_count, total_value_cents, weighted_value_cents into v_row
  from public.deal_pipeline_snapshots where snapshot_date = current_date;
  if v_row.total_value_cents < v_row.weighted_value_cents then
    raise exception 'valor ponderado (%) maior que o total (%)', v_row.weighted_value_cents, v_row.total_value_cents;
  end if;
  raise notice '6/8 ok: 2 execucoes no mesmo dia = 1 linha (upsert)';
end $$;

-- 7. Visibilidade real sob RLS
do $$
declare
  v_admin uuid;
  v_other uuid;
  v_visible integer;
begin
  select user_id into v_admin
    from public.user_roles
   where role in ('admin', 'supervisor')
     and coalesce(is_active, true)
     and (expires_at is null or expires_at > now())
   limit 1;

  select u.id into v_other
    from auth.users u
   where not exists (
     select 1 from public.user_roles r
      where r.user_id = u.id
        and r.role in ('admin', 'supervisor')
        and coalesce(r.is_active, true)
   )
   limit 1;

  if v_admin is null or v_other is null then
    raise notice '7/8 pulado: faltam papeis para simular (admin=%, comum=%)', v_admin, v_other;
    return;
  end if;

  begin
    execute 'set local role authenticated';
  exception when insufficient_privilege then
    raise notice '7/8 pulado: runner nao assume o papel authenticated';
    return;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin)::text, true);
  execute 'select count(*) from public.deal_pipeline_snapshots' into v_visible;
  if v_visible < 1 then
    execute 'reset role';
    raise exception 'admin deveria ver os retratos e viu 0';
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_other)::text, true);
  execute 'select count(*) from public.deal_pipeline_snapshots' into v_visible;
  if v_visible <> 0 then
    execute 'reset role';
    raise exception 'usuario comum viu % linha(s) de retrato do pipeline', v_visible;
  end if;

  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  raise notice '7/8 ok: admin ve, usuario comum nao ve (sob RLS)';
end $$;

-- 8. anon nao le
do $$
declare
  v_cnt bigint;
begin
  if not pg_has_role(current_user, 'anon'::name, 'member') then
    raise notice '8/8 pulado: anon nao e assumivel por %', current_user;
    return;
  end if;
  begin
    execute 'set local role anon';
  exception when insufficient_privilege then
    raise notice '8/8 pulado: sem privilegio para assumir anon';
    return;
  end;
  begin
    execute 'select count(*) from public.deal_pipeline_snapshots' into v_cnt;
  exception when insufficient_privilege then
    execute 'reset role';
    raise notice '8/8 ok: anon sem privilegio de leitura';
    return;
  end;
  execute 'reset role';
  if v_cnt > 0 then
    raise exception 'anon leu % linha(s) de retrato do pipeline', v_cnt;
  end if;
  raise notice '8/8 ok: anon nao ve linhas';
end $$;

rollback;
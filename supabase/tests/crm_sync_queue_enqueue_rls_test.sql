-- Gate da etapa 084 (achado A-055): o agente precisa conseguir enfileirar o
-- proprio lead e a falha precisa deixar de ser silenciosa.
--
-- src/hooks/useBitrix.ts:243 insere em public.crm_sync_queue com a sessao do
-- usuario quando a criacao do lead no Bitrix falha. A unica policy de INSERT
-- pedia is_admin_or_supervisor(), entao o agente comum era barrado pela RLS e o
-- hook devolvia null sem toast: o lead nao existia nem no Bitrix nem na fila.
--
-- Roda em transacao revertida: nada fica gravado.
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1/6: coluna do autor, com DEFAULT auth.uid().
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_sync_queue' and column_name = 'requested_by'
  ) then
    raise exception 'FALHA 1: crm_sync_queue.requested_by nao existe: a policy por autor e impossivel (etapa 084)';
  end if;

  if not exists (
    select 1
    from pg_attrdef d
    join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'crm_sync_queue' and a.attname = 'requested_by'
      and pg_get_expr(d.adbin, d.adrelid) like '%auth.uid()%'
  ) then
    raise exception 'FALHA 1: requested_by sem DEFAULT auth.uid(): o insert do hook nao amarraria autor nenhum';
  end if;
  raise notice '1/6 ok: requested_by existe com DEFAULT auth.uid()';
end $$;

-- 2/6: policy de INSERT para authenticated amarrada ao autor.
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'crm_sync_queue' and p.cmd = 'INSERT'
      and 'authenticated' = any (p.roles)
      and coalesce(p.with_check, '') like '%auth.uid()%'
  ) then
    raise exception 'FALHA 2: crm_sync_queue nao tem policy de INSERT para authenticated com WITH CHECK auth.uid(): o agente comum continua sem poder enfileirar o proprio lead';
  end if;
  raise notice '2/6 ok: policy de INSERT por autor presente';
end $$;

-- 3/6: anon/public nao enfileiram nada.
do $$
begin
  if exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'crm_sync_queue'
      and p.cmd in ('INSERT', 'ALL')
      and p.roles && array['anon', 'public']::name[]
  ) then
    raise exception 'FALHA 3: existe policy de INSERT/ALL alcancando anon ou public em crm_sync_queue';
  end if;
  raise notice '3/6 ok: nenhuma policy de INSERT para anon/public';
end $$;

-- 4/6 a 6/6: efeito real de um agente comum.
do $$
declare
  r record;
  v_a uuid;
  v_b uuid;
  v_admin boolean;
  v_total bigint;
  v_autor uuid;
  v_viu_a bigint;
  v_viu_b bigint;
  v_bloqueou boolean := false;
  v_msg text;
begin
  for r in select u.id from auth.users u order by u.created_at limit 200 loop
    perform set_config('request.jwt.claims', json_build_object('sub', r.id)::text, true);
    v_admin := coalesce(public.is_admin_or_supervisor(), false);
    if not v_admin then
      if v_a is null then
        v_a := r.id;
      elsif r.id <> v_a then
        v_b := r.id;
        exit;
      end if;
    end if;
  end loop;

  if v_a is null then
    raise notice '4/6 pulado: nenhum usuario nao-admin em auth.users para simular a sessao do agente';
    return;
  end if;

  -- 4/6: agente A enfileira sem informar autor e o DEFAULT preenche auth.uid().
  perform set_config('request.jwt.claims', json_build_object('sub', v_a)::text, true);
  execute 'set local role authenticated';
  execute $q$ insert into public.crm_sync_queue (action, payload, status)
             values ('create_lead', jsonb_build_object('gate', '084', 'title', 'lead do agente'), 'pending') $q$;
  execute 'reset role';

  select count(*), (array_agg(requested_by))[1] into v_total, v_autor
    from public.crm_sync_queue
   where payload->>'gate' = '084';

  if v_total <> 1 then
    raise exception 'FALHA 4: % linhas inseridas pelo agente (esperado 1): o insert continua barrado ou duplicou', v_total;
  end if;
  if v_autor is distinct from v_a then
    raise exception 'FALHA 4: requested_by gravado = % (esperado %): o DEFAULT auth.uid() nao amarrou o autor', v_autor, v_a;
  end if;
  raise notice '4/6 ok: agente comum enfileirou 1 item e requested_by = auth.uid()';

  -- 5/6: A ve a propria linha; A nao consegue forjar a autoria de outro usuario.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a)::text, true);
  execute 'set local role authenticated';
  execute $q$ select count(*) from public.crm_sync_queue where payload->>'gate' = '084' $q$ into v_viu_a;
  execute 'reset role';

  if v_viu_a < 1 then
    raise exception 'FALHA 5: o autor nao ve a propria linha da fila (% linhas)', v_viu_a;
  end if;

  if v_b is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_b)::text, true);
    execute 'set local role authenticated';
    begin
      execute $q$ insert into public.crm_sync_queue (action, payload, status, requested_by)
                 values ('create_lead', jsonb_build_object('gate', '084'), 'pending', $1) $q$ using v_a;
      execute 'reset role';
    exception when others then
      v_bloqueou := true;
      v_msg := sqlerrm;
      execute 'reset role';
    end;

    if not v_bloqueou then
      raise exception 'FALHA 5: outro usuario conseguiu gravar requested_by de terceiro na fila (autoria forjavel)';
    end if;

    perform set_config('request.jwt.claims', json_build_object('sub', v_b)::text, true);
    execute 'set local role authenticated';
    execute $q$ select count(*) from public.crm_sync_queue where payload->>'gate' = '084' $q$ into v_viu_b;
    execute 'reset role';

    if v_viu_b <> 0 then
      raise exception 'FALHA 5: outro agente ve % linhas da fila do autor (esperado 0)', v_viu_b;
    end if;
    raise notice '5/6 ok: autor enxerga a propria fila, terceiro nao (e a autoria nao e forjavel: %)', left(coalesce(v_msg, ''), 80);
  else
    raise notice '5/6 parcial: so existe 1 usuario nao-admin em auth.users; prova de leitura alheia pulada';
  end if;

  -- 6/6: anon nao enfileira.
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
  begin
    execute $q$ insert into public.crm_sync_queue (action, payload, status)
             values ('create_lead', jsonb_build_object('gate', '084', 'anon', true), 'pending') $q$;
    v_bloqueou := false;
    execute 'reset role';
  exception when others then
    v_bloqueou := true;
    execute 'reset role';
  end;

  if not v_bloqueou then
    raise exception 'FALHA 6: anon conseguiu inserir em crm_sync_queue';
  end if;
  raise notice '6/6 ok: anon nao enfileira nada';
end $$;

rollback;
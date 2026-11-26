-- Gate da etapa 079 (A-057): a reivindicacao do contato no discador precisa ser
-- UMA operacao condicional, e dois chamadores consecutivos precisam receber
-- contatos diferentes.
--
-- src/hooks/predictive-dialer/api.ts chamava um SELECT `pending` e, depois, um
-- UPDATE `dialing` sem condicao de status: duas abas na mesma campanha liam a
-- mesma linha e ambas a marcavam. O hook agora chama
-- public.claim_next_dialer_contact (uma unica instrucao, com FOR UPDATE SKIP
-- LOCKED e attempts = attempts + 1 no SQL).
--
-- Roda em transacao revertida: nada fica gravado.
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1/5: assinatura, SECURITY DEFINER, search_path fixo e anon sem EXECUTE.
do $$
declare
  v_secdef boolean;
  v_cfg text[];
  v_anon boolean;
begin
  select p.prosecdef, p.proconfig into v_secdef, v_cfg
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'claim_next_dialer_contact'
     and pg_get_function_identity_arguments(p.oid) = 'p_campaign_id uuid';

  if not found then
    raise exception 'FALHA 1: public.claim_next_dialer_contact(uuid) nao existe: o discador continua fazendo leitura e escrita em duas idas ao banco';
  end if;
  if not v_secdef then
    raise exception 'FALHA 1: claim_next_dialer_contact nao e SECURITY DEFINER: sem isso o UPDATE roda sob RLS e o FOR UPDATE SKIP LOCKED nao garante a reserva';
  end if;
  if v_cfg is null or not exists (select 1 from unnest(v_cfg) c where c like 'search_path=%') then
    raise exception 'FALHA 1: claim_next_dialer_contact sem search_path fixo (risco de hijack em SECURITY DEFINER)';
  end if;

  v_anon := has_function_privilege('anon', 'public.claim_next_dialer_contact(uuid)', 'execute');
  if v_anon then
    raise exception 'FALHA 1: anon pode executar claim_next_dialer_contact: qualquer visitante reservaria contatos da operacao';
  end if;
  raise notice '1/5 ok: funcao existe, SECURITY DEFINER com search_path fixo, e anon nao executa';
end $$;

-- 2/5 a 5/5: comportamento da reserva.
do $$
declare
  r record;
  v_user uuid;
  v_camp uuid;
  v_alta uuid;
  v_baixa uuid;
  v_c1 public.dialer_queue;
  v_c2 public.dialer_queue;
  v_c3 public.dialer_queue;
  v_ids uuid[];
begin
  for r in select u.id from auth.users u order by u.created_at limit 200 loop
    perform set_config('request.jwt.claims', json_build_object('sub', r.id)::text, true);
    if not coalesce(public.is_admin_or_supervisor(), false) then
      v_user := r.id;
      exit;
    end if;
  end loop;
  if v_user is null then
    raise notice '2/5 pulado: nenhum usuario nao-admin em auth.users';
    return;
  end if;

  insert into public.dialer_campaigns (name) values ('gate-079')
  returning id into v_camp;
  insert into public.dialer_queue (campaign_id, phone, priority, status)
  values (v_camp, '5511900000001', 10, 'pending') returning id into v_alta;
  insert into public.dialer_queue (campaign_id, phone, priority, status)
  values (v_camp, '5511900000002', 0, 'pending') returning id into v_baixa;
  -- ruido que NAO pode ser reivindicado: status diferente e retentativa futura
  insert into public.dialer_queue (campaign_id, phone, priority, status)
  values (v_camp, '5511900000003', 99, 'completed');
  insert into public.dialer_queue (campaign_id, phone, priority, status, next_attempt_at)
  values (v_camp, '5511900000004', 99, 'pending', now() + interval '1 hour');

  perform set_config('request.jwt.claims', json_build_object('sub', v_user)::text, true);
  execute 'set local role authenticated';

  -- 2/5: respeita prioridade (10 antes de 0) e ignora o que nao esta pendente.
  execute 'select * from public.claim_next_dialer_contact($1)' into v_c1 using v_camp;
  execute 'reset role';
  if v_c1.id is distinct from v_alta then
    raise exception 'FALHA 2: a reserva devolveu % (esperado o contato de maior prioridade %)', v_c1.id, v_alta;
  end if;
  if v_c1.status <> 'dialing' then
    raise exception 'FALHA 2: o contato reivindicado ficou com status % (esperado dialing)', v_c1.status;
  end if;
  raise notice '2/5 ok: reserva devolve o contato de maior prioridade, ja em dialing';

  -- 3/5: a segunda reserva pega OUTRO contato (nunca o mesmo).
  perform set_config('request.jwt.claims', json_build_object('sub', v_user)::text, true);
  execute 'set local role authenticated';
  execute 'select * from public.claim_next_dialer_contact($1)' into v_c2 using v_camp;
  execute 'reset role';
  if v_c2.id is distinct from v_baixa then
    raise exception 'FALHA 3: a segunda reserva devolveu % (esperado o outro pendente %) — risco de duas ligacoes para o mesmo cliente', v_c2.id, v_baixa;
  end if;
  select array_agg(id) into v_ids from public.dialer_queue
   where campaign_id = v_camp and status = 'dialing';
  if coalesce(array_length(v_ids, 1), 0) <> 2 then
    raise exception 'FALHA 3: % contato(s) em dialing depois de duas reservas (esperado 2)', coalesce(array_length(v_ids, 1), 0);
  end if;
  raise notice '3/5 ok: segunda reserva devolve outro contato; nenhum contato reservado duas vezes';

  -- 4/5: attempts incrementa exatamente uma vez por reserva.
  if v_c1.attempts <> 1 or v_c2.attempts <> 1 then
    raise exception 'FALHA 4: attempts apos uma reserva = % / % (esperado 1 e 1): houve perda de atualizacao', v_c1.attempts, v_c2.attempts;
  end if;
  if v_c1.last_attempt_at is null then
    raise exception 'FALHA 4: last_attempt_at ficou nulo na reserva';
  end if;
  raise notice '4/5 ok: attempts = 1 em cada contato reservado e last_attempt_at gravado';

  -- 5/5: sem pendente elegivel a reserva devolve vazio (nao insiste nem repete).
  perform set_config('request.jwt.claims', json_build_object('sub', v_user)::text, true);
  execute 'set local role authenticated';
  execute 'select * from public.claim_next_dialer_contact($1)' into v_c3 using v_camp;
  execute 'reset role';
  if v_c3.id is not null then
    raise exception 'FALHA 5: a reserva devolveu % mesmo sem contato pendente elegivel (o nao pendente e a retentativa futura nao podem ser discados)', v_c3.id;
  end if;

  -- anon nao executa, mesmo com a fila cheia.
  begin
    perform set_config('request.jwt.claims', '', true);
    execute 'set local role anon';
    execute 'select * from public.claim_next_dialer_contact($1)' into v_c3 using v_camp;
    execute 'reset role';
    if v_c3.id is not null then
      raise exception 'FALHA 5: anon reservou o contato %', v_c3.id;
    end if;
  exception when others then
    execute 'reset role';
    if sqlerrm like 'FALHA%' then raise; end if;
  end;
  raise notice '5/5 ok: fila sem pendente elegivel devolve vazio e anon nao reserva';
end $$;

rollback;
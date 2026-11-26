-- Gate da etapa 127 (A-056): meta atingida vira notificacao do usuario logado, nao alerta de chamada.
-- Roda dentro de transacao revertida (migrations.yml modo=verificar).
--   1) notifications continua com RLS, user_id NOT NULL e a policy de insert proprio
--   2) usuario autenticado grava a notificacao no formato que useAgentRanking usa
--   3) usuario autenticado NAO grava em nome de outro (WITH CHECK)
--   4) o dono le a notificacao no sino (user_id = auth.uid() e is_archived = false); outro le 0
--   5) nenhum alerta goals_achieved novo em call_alerts (o hook deixou de poluir alertas de chamada)

\set ON_ERROR_STOP on
begin;

-- 1: estrutura e policy
do $$
declare
  v_rls boolean;
  v_check text;
  v_notnull boolean;
begin
  select c.relrowsecurity into v_rls
    from pg_class c
   where c.oid = 'public.notifications'::regclass;
  if v_rls is not true then
    raise exception 'notifications existe mas esta sem RLS';
  end if;

  select a.attnotnull into v_notnull
    from pg_attribute a
   where a.attrelid = 'public.notifications'::regclass
     and a.attname = 'user_id'
     and a.attnum > 0;
  if v_notnull is not true then
    raise exception 'notifications.user_id deixou de ser NOT NULL — notificacao orfa volta a ser possivel';
  end if;

  select coalesce(p.with_check, p.qual) into v_check
    from pg_policies p
   where p.schemaname = 'public'
     and p.tablename = 'notifications'
     and p.policyname = 'Users can insert own notifications'
     and p.cmd = 'INSERT';
  if v_check is null then
    raise exception 'policy de insert proprio ausente em notifications';
  end if;

  raise notice '1/5 ok: RLS ligada, user_id NOT NULL, policy de insert proprio (%)', v_check;
end $$;

-- 2: o dono grava a notificacao no formato do hook
do $$
declare
  v_owner uuid := '00000000-0000-0000-0000-000000127001';
  v_id uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  insert into public.notifications (
    user_id, title, message, type, category, severity,
    source_type, source_id, metadata, action_url
  ) values (
    v_owner,
    '🎉 Alice atingiu todas as metas!',
    'Parabéns! O agente Alice completou todas as metas.',
    'success', 'gamification', 'info',
    'agent_ranking', 'Alice',
    jsonb_build_object('agent_name', 'Alice', 'total_calls', 60),
    '/ranking'
  )
  returning id into v_id;

  execute 'reset role';
  raise notice '2/5 ok: notificacao de meta gravada pelo proprio usuario (%)', v_id;
end $$;

-- 3: WITH CHECK barra insert em nome de outro usuario
do $$
declare
  v_owner uuid := '00000000-0000-0000-0000-000000127001';
  v_other uuid := '00000000-0000-0000-0000-000000127002';
  v_barrado boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  begin
    insert into public.notifications (user_id, title, message, source_type)
    values (v_other, 'meta', 'em nome de outro', 'agent_ranking');
  exception when insufficient_privilege then
    v_barrado := true;
  end;

  execute 'reset role';

  if not v_barrado then
    raise exception 'FALHA 3: usuario gravou notificacao em nome de outro (WITH CHECK nao barrou)';
  end if;
  raise notice '3/5 ok: insert em nome de outro usuario recusado pelo banco';
end $$;

-- 4: leitura no sino — dono ve a sua, outro nao ve
do $$
declare
  v_owner uuid := '00000000-0000-0000-0000-000000127001';
  v_other uuid := '00000000-0000-0000-0000-000000127002';
  v_n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into v_n
    from public.notifications
   where user_id = v_owner
     and is_archived = false
     and category = 'gamification';
  if v_n <> 1 then
    raise exception 'FALHA 4: dono leu % notificacoes de gamification (esperava 1)', v_n;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);

  select count(*) into v_n
    from public.notifications
   where user_id = v_owner;
  if v_n <> 0 then
    raise exception 'FALHA 4: outro usuario leu % notificacoes do dono', v_n;
  end if;

  execute 'reset role';
  raise notice '4/5 ok: dono le a meta no sino, outro usuario ve 0';
end $$;

-- 5: call_alerts sem poluicao de goals_achieved
do $$
declare
  v_n int;
begin
  select count(*) into v_n
    from public.call_alerts
   where alert_type = 'goals_achieved'
     and created_at > now() - interval '1 hour';
  if v_n <> 0 then
    raise exception 'FALHA 5: % alertas goals_achieved na ultima hora — o hook voltou a pendurar a meta numa chamada', v_n;
  end if;
  raise notice '5/5 ok: nenhum goals_achieved em call_alerts na ultima hora';
end $$;

rollback;
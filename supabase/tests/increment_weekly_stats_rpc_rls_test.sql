-- Etapa 126 — gate: a soma do placar semanal e atomica e o caminho antigo perdia pontos.
-- Tudo em transacao revertida no fim; nenhum dado de producao e alterado.

begin;

-- ---------------------------------------------------------------------------
-- Passo 1: a RPC existe, e SECURITY DEFINER com search_path fixo.
-- ---------------------------------------------------------------------------
do $$
declare
  v_proc record;
  v_def text;
begin
  select p.prosecdef, p.proconfig, p.oid
    into v_proc
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'increment_weekly_stats';

  if v_proc.oid is null then
    raise exception 'FALHA 1: public.increment_weekly_stats nao existe';
  end if;
  if not v_proc.prosecdef then
    raise exception 'FALHA 1: a funcao nao e SECURITY DEFINER';
  end if;
  if v_proc.proconfig is null or not exists (
    select 1 from unnest(v_proc.proconfig) c where c like 'search_path=%public%'
  ) then
    raise exception 'FALHA 1: search_path nao esta fixo em public (%)', v_proc.proconfig;
  end if;

  v_def := pg_get_functiondef(v_proc.oid);
  if position('ON CONFLICT' in upper(v_def)) = 0 then
    raise exception 'FALHA 1: a funcao nao usa ON CONFLICT — a soma deixou de ser atomica';
  end if;

  raise notice '1/6 ok: RPC SECURITY DEFINER, search_path fixo e soma em uma instrucao (ON CONFLICT)';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 2: anon nao executa; authenticated executa.
-- ---------------------------------------------------------------------------
do $$
declare
  v_oid oid := 'public.increment_weekly_stats(uuid, date, integer, integer, integer, integer, numeric, numeric)'::regprocedure;
begin
  if has_function_privilege('anon', v_oid, 'EXECUTE') then
    raise exception 'FALHA 2: anon pode executar increment_weekly_stats';
  end if;
  if not has_function_privilege('authenticated', v_oid, 'EXECUTE') then
    raise exception 'FALHA 2: authenticated nao pode executar increment_weekly_stats';
  end if;
  if not has_function_privilege('service_role', v_oid, 'EXECUTE') then
    raise exception 'FALHA 2: service_role nao pode executar increment_weekly_stats';
  end if;

  raise notice '2/6 ok: anon barrado, authenticated e service_role liberados';
end $$;

-- ---------------------------------------------------------------------------
-- Passo 3: o caminho antigo (insert simples) e o que perdia pontos: 23505.
-- ---------------------------------------------------------------------------
do $$
declare
  v_agent uuid;
  v_week date := date_trunc('week', current_date)::date;
  v_codigo text;
begin
  insert into public.agents (name, extension) values ('gate-126 agente', 'gate126-' || gen_random_uuid())
  returning id into v_agent;

  insert into public.agent_weekly_stats (agent_id, week_start, total_calls, points_earned)
  values (v_agent, v_week, 1, 1);

  begin
    -- Exatamente o que o ramo `insert` do hook antigo fazia quando a linha ja existia.
    insert into public.agent_weekly_stats (agent_id, week_start, total_calls, points_earned)
    values (v_agent, v_week, 1, 1);
    raise exception 'FALHA 3: o insert duplicado passou — o cenario que perdia pontos nao foi reproduzido';
  exception when unique_violation then
    get stacked diagnostics v_codigo = returned_sqlstate;
  end;

  raise notice '3/6 ok: o insert direto do caminho antigo falha com % (era o erro descartado)', v_codigo;

  delete from public.agent_weekly_stats where agent_id = v_agent;
  delete from public.agents where id = v_agent;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 4: 10 gravacoes seguidas na mesma semana somam 10 pontos exatos, em uma linha.
-- ---------------------------------------------------------------------------
do $$
declare
  v_agent uuid;
  v_week date := date_trunc('week', current_date)::date;
  v_row public.agent_weekly_stats;
  v_linhas int;
  i int;
begin
  insert into public.agents (name, extension) values ('gate-126 soma', 'gate126s-' || gen_random_uuid())
  returning id into v_agent;

  for i in 1..10 loop
    v_row := public.increment_weekly_stats(v_agent, v_week, 1, 60, 0, 1);
  end loop;

  select count(*) into v_linhas from public.agent_weekly_stats where agent_id = v_agent;

  if v_row.points_earned <> 10 then
    raise exception 'FALHA 4: esperava 10 pontos, obtive %', v_row.points_earned;
  end if;
  if v_row.total_calls <> 10 or v_row.total_duration_seconds <> 600 then
    raise exception 'FALHA 4: contadores errados (calls=%, duracao=%)', v_row.total_calls, v_row.total_duration_seconds;
  end if;
  if v_linhas <> 1 then
    raise exception 'FALHA 4: % linhas para a mesma semana — a unicidade foi furada', v_linhas;
  end if;

  raise notice '4/6 ok: 10 gravacoes seguidas -> 10 pontos, 10 chamadas, 600s em 1 linha';

  delete from public.agent_weekly_stats where agent_id = v_agent;
  delete from public.agents where id = v_agent;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 5: medias substituem quando enviadas e sao ignoradas quando vem null.
-- ---------------------------------------------------------------------------
do $$
declare
  v_agent uuid;
  v_week date := date_trunc('week', current_date)::date;
  v_row public.agent_weekly_stats;
begin
  insert into public.agents (name, extension) values ('gate-126 medias', 'gate126m-' || gen_random_uuid())
  returning id into v_agent;

  v_row := public.increment_weekly_stats(v_agent, v_week, 1, 10, 0, 1, 8.5, 7.0);
  if v_row.avg_satisfaction <> 8.5 or v_row.avg_performance <> 7.0 then
    raise exception 'FALHA 5: medias iniciais erradas (% / %)', v_row.avg_satisfaction, v_row.avg_performance;
  end if;

  v_row := public.increment_weekly_stats(v_agent, v_week, 1, 10, 0, 1);
  if v_row.avg_satisfaction <> 8.5 or v_row.avg_performance <> 7.0 then
    raise exception 'FALHA 5: media sem valor enviado foi zerada (% / %)', v_row.avg_satisfaction, v_row.avg_performance;
  end if;

  v_row := public.increment_weekly_stats(v_agent, v_week, 0, 0, 0, 0, 9.9, null);
  if v_row.avg_satisfaction <> 9.9 or v_row.avg_performance <> 7.0 then
    raise exception 'FALHA 5: media enviada nao substituiu (% / %)', v_row.avg_satisfaction, v_row.avg_performance;
  end if;

  raise notice '5/6 ok: media enviada substitui (9.9), media ausente preserva (7.0)';

  delete from public.agent_weekly_stats where agent_id = v_agent;
  delete from public.agents where id = v_agent;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 6: a primeira linha da semana nasce com media 0, como o DEFAULT da coluna.
-- ---------------------------------------------------------------------------
do $$
declare
  v_agent uuid;
  v_week date := date_trunc('week', current_date)::date;
  v_row public.agent_weekly_stats;
begin
  insert into public.agents (name, extension) values ('gate-126 zero', 'gate126z-' || gen_random_uuid())
  returning id into v_agent;

  v_row := public.increment_weekly_stats(v_agent, v_week, 1, 30, 1, 5);

  if v_row.avg_satisfaction is null or v_row.avg_performance is null then
    raise exception 'FALHA 6: media nula na primeira linha da semana (% / %)', v_row.avg_satisfaction, v_row.avg_performance;
  end if;
  if v_row.avg_satisfaction <> 0 or v_row.avg_performance <> 0 then
    raise exception 'FALHA 6: media inicial deveria ser 0 (% / %)', v_row.avg_satisfaction, v_row.avg_performance;
  end if;

  raise notice '6/6 ok: primeira linha da semana nasce com medias 0 (mesmo contrato do DEFAULT)';

  delete from public.agent_weekly_stats where agent_id = v_agent;
  delete from public.agents where id = v_agent;
end $$;

rollback;
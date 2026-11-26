-- Gate da etapa 087 (achado A-067): refazer um modulo com nota melhor precisa
-- gravar de verdade.
--
-- src/hooks/useLearning.ts:54-58 faz
--   .upsert({agent_name, module_id, score}, {onConflict:'agent_name,module_id'})
-- e :63 anuncia "Modulo concluido!". Sem policy de UPDATE, o ON CONFLICT DO UPDATE
-- nao grava: o agente ve a confirmacao e a nota antiga permanece.
--
-- Roda dentro de transacao revertida (nada fica gravado).
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

create temp table gate_ctx (agente text, modulo uuid) on commit drop;

-- 1. A policy de UPDATE existe, e TO authenticated e filtra pelo agente dono.
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'learning_completions'
      and p.cmd = 'UPDATE'
      and 'authenticated' = any (p.roles)
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%get_user_agent_name%'
  ) then
    raise exception 'FALHA 1: learning_completions nao tem policy de UPDATE: o upsert de useLearning.ts continua barrado (o toast diz "Modulo concluido!" e a nota nao muda)';
  end if;
  raise notice '1/6 ok: policy de UPDATE presente, TO authenticated, por get_user_agent_name()';
end $$;

-- 2. Nem anon nem public alcancam UPDATE nesta tabela.
do $$
begin
  if exists (
    select 1 from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'learning_completions'
      and p.cmd in ('UPDATE', 'ALL')
      and p.roles && array['anon', 'public']::name[]
  ) then
    raise exception 'FALHA 2: existe policy de UPDATE/ALL alcancando anon ou public em learning_completions';
  end if;
  raise notice '2/6 ok: nenhuma policy de UPDATE para anon/public';
end $$;

-- 3. Efeito real: o upsert do hook, duas vezes, na mesma linha -- a segunda nota vence.
do $$
declare
  r record;
  v_agente text;
  v_mod uuid;
  v_score numeric;
  v_n int;
  v_achou boolean := false;
begin
  select id into v_mod from public.learning_modules order by id limit 1;
  if v_mod is null then
    -- Producao ainda nao tem modulo publicado: cria um descartavel para nao pular justamente
    -- a prova do upsert (a transacao inteira e revertida no fim deste arquivo).
    insert into public.learning_modules (title, is_active)
    values ('gate-087 modulo descartavel', true)
    returning id into v_mod;
  end if;

  for r in select u.id from auth.users u order by u.created_at limit 100 loop
    perform set_config('request.jwt.claims', json_build_object('sub', r.id)::text, true);
    v_agente := public.get_user_agent_name();
    if v_agente is not null then
      v_achou := true;
      exit;
    end if;
  end loop;

  if not v_achou then
    raise notice '3/6 pulado: nenhum usuario com agent_name resolvivel';
    return;
  end if;

  execute 'set local role authenticated';

  execute 'insert into public.learning_completions (agent_name, module_id, score) values ($1, $2, $3)
           on conflict (agent_name, module_id) do update set score = excluded.score'
    using v_agente, v_mod, 40;

  execute 'insert into public.learning_completions (agent_name, module_id, score) values ($1, $2, $3)
           on conflict (agent_name, module_id) do update set score = excluded.score'
    using v_agente, v_mod, 90;

  select score into v_score from public.learning_completions where agent_name = v_agente and module_id = v_mod;
  select count(*) into v_n from public.learning_completions where agent_name = v_agente and module_id = v_mod;

  execute 'reset role';

  insert into gate_ctx (agente, modulo) values (v_agente, v_mod);

  if v_n <> 1 then
    raise exception 'FALHA 3: % linhas para (agente, modulo); o esperado e 1', v_n;
  end if;
  if v_score is distinct from 90 then
    raise exception 'FALHA 3: score gravado = % (esperado 90): o upsert nao atualizou a linha existente', v_score;
  end if;
  raise notice '3/6 ok: upsert 2x na mesma linha; a segunda nota venceu (score=%) para o agente %', v_score, v_agente;
end $$;

-- 4. O agente nao altera a conclusao de outro agente (0 linhas sob RLS).
do $$
declare v_n int;
begin
  if not exists (select 1 from gate_ctx) then
    raise notice '4/6 pulado: sem agente/modulo resolvido no passo 3';
    return;
  end if;

  insert into public.learning_completions (agent_name, module_id, score)
  select 'gate-087-outro-agente', modulo, 10 from gate_ctx;

  execute 'set local role authenticated';
  execute 'update public.learning_completions set score = 99 where agent_name = ''gate-087-outro-agente''';
  get diagnostics v_n = row_count;
  execute 'reset role';

  if v_n <> 0 then
    raise exception 'FALHA 4: o agente alterou % linha(s) de outro agente; o esperado e 0', v_n;
  end if;
  raise notice '4/6 ok: conclusao de outro agente nao e alteravel (0 linhas)';
end $$;

-- 5. Anon tambem nao altera nada.
do $$
declare
  v_n int;
  v_claims text := current_setting('request.jwt.claims', true);
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';
    execute 'update public.learning_completions set score = 1 where score is not null';
    get diagnostics v_n = row_count;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    v_n := 0;
  end;

  perform set_config('request.jwt.claims', coalesce(v_claims, ''), true);

  if v_n <> 0 then
    raise exception 'FALHA 5: anon alterou % linha(s); o esperado e 0', v_n;
  end if;
  raise notice '5/6 ok: anon nao altera learning_completions (0 linhas)';
end $$;

-- 6. Regressao: as tres policies originais continuam no lugar.
do $$
declare falta text[] := '{}';
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_completions'
      and cmd = 'SELECT' and coalesce(qual, '') like '%get_user_agent_name%'
  ) then falta := falta || 'SELECT proprio'; end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_completions'
      and cmd = 'INSERT' and coalesce(with_check, '') like '%get_user_agent_name%'
  ) then falta := falta || 'INSERT proprio'; end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_completions'
      and cmd = 'DELETE' and coalesce(qual, '') like '%is_admin%'
  ) then falta := falta || 'DELETE admin'; end if;

  if array_length(falta, 1) > 0 then
    raise exception 'FALHA 6: policy original perdida: %', array_to_string(falta, ', ');
  end if;
  raise notice '6/6 ok: SELECT/INSERT do proprio agente e DELETE de admin continuam intactas';
end $$;

rollback;
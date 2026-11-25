-- Gate: as policies de public.user_preferences precisam isolar por auth.uid().
--
-- Prova, dentro de uma transacao revertida no fim (nada fica gravado no banco):
--   1. cliente A insere a propria preferencia  (INSERT + WITH CHECK auth.uid() = user_id)
--   2. cliente A le a propria linha            (SELECT)
--   3. cliente A atualiza a propria linha      (UPDATE + WITH CHECK)
--   4. cliente B nao ve a linha de A           (SELECT isolado)
--   5. cliente B nao grava em nome de A        (RLS bloqueia)
--
-- Qualquer passo fora do esperado levanta excecao: com ON_ERROR_STOP o job fica
-- vermelho. Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- Escolhe dois usuarios que ainda nao tem preferencia: o teste nao toca dado real,
-- mesmo se a transacao nao fosse revertida.
select u.id as cliente_a from auth.users u
  left join public.user_preferences p on p.user_id = u.id
 where p.user_id is null order by u.created_at nulls last, u.id limit 1 \gset
select u.id as cliente_b from auth.users u
  left join public.user_preferences p on p.user_id = u.id
 where p.user_id is null and u.id <> :'cliente_a'
 order by u.created_at nulls last, u.id limit 1 \gset

\if :{?cliente_b}
\else
  \echo 'PULADO: nao ha 2 usuarios em auth.users sem preferencia; nada a testar'
  rollback;
  \quit
\endif

select set_config('teste.cliente_a', :'cliente_a', true);

\echo '=== 1. cliente A: INSERT da propria preferencia ==='
select set_config('request.jwt.claims', json_build_object('sub', :'cliente_a')::text, true);
set local role authenticated;
insert into public.user_preferences (user_id, notify_sound) values (:'cliente_a', false);

do $$ begin
  if (select count(*) from public.user_preferences) <> 1 then
    raise exception 'FALHA: cliente A deveria ver 1 linha logo apos o INSERT';
  end if;
  raise notice 'OK 1/2: cliente A inseriu e ve a propria linha';
end $$;

\echo '=== 3. cliente A: UPDATE da propria linha ==='
do $$ begin
  update public.user_preferences set notify_sound = true;
  if (select count(*) from public.user_preferences where notify_sound) <> 1 then
    raise exception 'FALHA: UPDATE do cliente A nao afetou a propria linha';
  end if;
  raise notice 'OK 3: cliente A atualizou a propria linha';
end $$;

\echo '=== 4. cliente B: SELECT nao ve a linha de A ==='
select set_config('request.jwt.claims', json_build_object('sub', :'cliente_b')::text, true);
do $$ begin
  if (select count(*) from public.user_preferences) <> 0 then
    raise exception 'FALHA: cliente B ve linhas de outro usuario';
  end if;
  raise notice 'OK 4: cliente B nao ve a linha de A';
end $$;

\echo '=== 5. cliente B: INSERT em nome de A e bloqueado ==='
do $$
declare v_a uuid := current_setting('teste.cliente_a')::uuid;
begin
  begin
    insert into public.user_preferences (user_id, notify_sound) values (v_a, true);
    raise exception 'FALHA: cliente B gravou em nome do cliente A';
  exception when insufficient_privilege then
    raise notice 'OK 5: RLS bloqueou gravacao em nome de outro usuario';
  end;
end $$;

\echo '=== fim: nada foi gravado (rollback) ==='
reset role;
rollback;

-- Gate da etapa 029 (achado A-065): as acoes de escrita do painel de rate limit
-- precisam existir de verdade.
--
-- Antes: 3 policies de INSERT e 1 de SELECT; nenhuma de UPDATE/DELETE. RLS sem
-- policy nao devolve erro: devolve 0 linhas afetadas, entao "Desbloquear IP" e
-- "Limpar logs antigos" mostravam sucesso e nao gravavam nada.
--
-- Roda dentro de transacao revertida no fim (nada fica gravado no banco).
-- Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1. As policies existem, no role certo e com o predicado de admin.
do $$
declare
  v_roles name[];
  v_qual text;
  v_check text;
begin
  select roles, qual, with_check into v_roles, v_qual, v_check
  from pg_policies
  where schemaname = 'public' and tablename = 'rate_limit_logs' and cmd = 'UPDATE';

  if not found then
    raise exception 'FALHA 1: nenhuma policy de UPDATE em rate_limit_logs (Desbloquear IP nao grava)';
  end if;
  if v_roles <> array['authenticated']::name[] then
    raise exception 'FALHA 1: policy de UPDATE vale para % e nao apenas para authenticated', v_roles;
  end if;
  if coalesce(v_qual, '') not like '%is_admin%' or coalesce(v_check, '') not like '%is_admin%' then
    raise exception 'FALHA 1: policy de UPDATE sem is_admin() (qual=%, check=%)', v_qual, v_check;
  end if;

  select roles, qual, with_check into v_roles, v_qual, v_check
  from pg_policies
  where schemaname = 'public' and tablename = 'rate_limit_logs' and cmd = 'DELETE';

  if not found then
    raise exception 'FALHA 1: nenhuma policy de DELETE em rate_limit_logs (Limpar logs antigos nao grava)';
  end if;
  if v_roles <> array['authenticated']::name[] then
    raise exception 'FALHA 1: policy de DELETE vale para % e nao apenas para authenticated', v_roles;
  end if;
  if coalesce(v_qual, '') not like '%is_admin%' then
    raise exception 'FALHA 1: policy de DELETE sem is_admin() (qual=%)', v_qual;
  end if;
  raise notice 'OK 1: policies de UPDATE e DELETE presentes, TO authenticated, com is_admin()';
end $$;

-- 2. Privilegio de tabela alcancavel pelo role da policy.
do $$
begin
  if not has_table_privilege('authenticated', 'public.rate_limit_logs', 'UPDATE') then
    raise exception 'FALHA 2: authenticated sem GRANT UPDATE (a policy de UPDATE fica inalcancavel)';
  end if;
  if not has_table_privilege('authenticated', 'public.rate_limit_logs', 'DELETE') then
    raise exception 'FALHA 2: authenticated sem GRANT DELETE (a policy de DELETE fica inalcancavel)';
  end if;
  if has_table_privilege('anon', 'public.rate_limit_logs', 'UPDATE')
     or has_table_privilege('anon', 'public.rate_limit_logs', 'DELETE') then
    raise exception 'FALHA 2: anon com UPDATE/DELETE em rate_limit_logs';
  end if;
  raise notice 'OK 2: authenticated com UPDATE/DELETE, anon sem';
end $$;

-- 3. Efeito real: admin desbloqueia e apaga; nao-admin nao consegue nada.
select user_id::text as admin_user_id from public.user_roles where role = 'admin' limit 1 \gset

\if :{?admin_user_id}
insert into public.rate_limit_logs (ip_address, endpoint, is_blocked, created_at)
values ('203.0.113.90', 'gate-etapa-029', true, now() - interval '30 days'),
       ('203.0.113.91', 'gate-etapa-029', true, now());

select set_config('request.jwt.claims', json_build_object('sub', :'admin_user_id')::text, true);
set local role authenticated;

do $$
declare v_n integer;
begin
  update public.rate_limit_logs set is_blocked = false
  where ip_address = '203.0.113.90' and is_blocked = true;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'FALHA 3: o admin desbloqueou % linha(s); o esperado e 1 (RLS sem policy devolve 0 e a tela mente)', v_n;
  end if;

  delete from public.rate_limit_logs where endpoint = 'gate-etapa-029' and created_at < now() - interval '7 days';
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'FALHA 3: o admin apagou % linha(s) de log antigo; o esperado e 1', v_n;
  end if;
  raise notice 'OK 3: admin desbloqueia IP e apaga log antigo (1 linha cada)';
end $$;

reset role;
\else
\echo 'SKIP 3: nenhum admin no banco — passo de efeito real nao executado'
\endif

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;

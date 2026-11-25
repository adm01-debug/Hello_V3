-- A-217: invariante das tabelas de historico de migration.
--
-- O achado dizia "migration_rollbacks/schema_migrations com RLS e 0 policies".
-- A premissa de inseguranca era falsa: as migrations genericas
-- 20260516121853 e 20260522143147 habilitam RLS em toda tabela de public, e a
-- 20261122183000 revogou anon/authenticated. Mas nao havia nada que IMPEDISSE a
-- regressao: bastava uma migration nova desabilitar RLS ou conceder SELECT para
-- anon e a tabela voltava a vazar silenciosamente. Este gate fixa o invariante.

\set ON_ERROR_STOP on
begin;

do $$
declare v_falta text;
begin
  select string_agg(c.relname, ', ') into v_falta
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('schema_migrations', 'migration_rollbacks')
    and c.relrowsecurity = false;

  if v_falta is not null then
    raise exception 'FALHA 1: tabela de historico com RLS desabilitada: %', v_falta;
  end if;
  raise notice 'OK 1: RLS habilitada em schema_migrations e migration_rollbacks';
end $$;

do $$
declare v_pol integer;
begin
  select count(*) into v_pol
  from pg_policies
  where schemaname = 'public'
    and tablename in ('schema_migrations', 'migration_rollbacks');

  if v_pol <> 0 then
    raise exception 'FALHA 2: % policy(s) nas tabelas de historico; o esperado e nenhuma (deny-all)', v_pol;
  end if;
  raise notice 'OK 2: nenhuma policy nas tabelas de historico (deny-all)';
end $$;

do $$
declare v_vaza text;
begin
  select string_agg(distinct r || ' em ' || t, ', ') into v_vaza
  from (values ('schema_migrations'), ('migration_rollbacks')) as tab(t)
  cross join (values ('anon'), ('authenticated')) as papel(r)
  where has_table_privilege(r, 'public.' || t, 'SELECT')
     or has_table_privilege(r, 'public.' || t, 'INSERT')
     or has_table_privilege(r, 'public.' || t, 'UPDATE')
     or has_table_privilege(r, 'public.' || t, 'DELETE');

  if v_vaza is not null then
    raise exception 'FALHA 3: privilegio indevido em tabela de historico: %', v_vaza;
  end if;
  raise notice 'OK 3: anon e authenticated sem nenhum privilegio nas tabelas de historico';
end $$;

rollback;
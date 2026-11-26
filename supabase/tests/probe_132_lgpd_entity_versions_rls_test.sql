-- Gate da etapa 132 (achado A-092): a correcao de exclusao de conta (LGPD)
-- esta de fato aplicada no banco de producao?
--
-- Contexto: 20261123010000_fix_user_delete_cascade.sql abre com BEGIN; e faz
--   ALTER TABLE public.entity_versions DROP CONSTRAINT IF EXISTS ..., ADD CONSTRAINT ...
-- sem IF EXISTS no ALTER TABLE. Se a tabela nao existir, o arquivo aborta inteiro
-- e as outras 6 correcoes de FK voltam atras -> DELETE de usuario volta a dar 500.
-- docs/audits/pendencias-2026-07.md:40 declara o item concluido (citando
-- entity_versions); os dois nao podem estar certos.
--
-- Este arquivo e SOMENTE LEITURA: nao cria, altera nem apaga nada. Serve para
-- decidir o desfecho (a) tabela existe e migration passou / (b) tabela nao existe
-- e migration nao consta -> LGPD quebrada / (c) tabela nao existe mas consta /
-- (d) tabela existe e migration nao consta (investigar ledger).
--
-- Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\pset footer off

\echo '=== 1. Tabelas criadas por migration que nao aparecem em types.ts ==='
select t.nome,
       (to_regclass('public.' || t.nome) is not null) as existe
from (values ('call_records'), ('entity_versions'), ('migration_rollbacks'),
             ('queue_items'), ('saved_filters'), ('schema_migrations')) as t(nome)
order by t.nome;

\echo '=== 2. Ledger: a migration da LGPD (20261123010000) consta? ==='
select 'supabase_migrations.schema_migrations' as ledger, version, coalesce(name, '<sem nome>') as nome
from supabase_migrations.schema_migrations
where version = '20261123010000'
union all
select 'public.schema_migrations', '', name
from public.schema_migrations
where name like '20261123010000%';

\echo '=== 3. Ledger: total registrado em cada um ==='
select 'supabase_migrations.schema_migrations' as ledger,
       count(*) as registros,
       min(version) as primeira,
       max(version) as ultima
from supabase_migrations.schema_migrations
union all
select 'public.schema_migrations',
       count(*),
       min(name),
       max(name)
from public.schema_migrations;

\echo '=== 4. FKs do schema public apontando para auth.users (a linha NO ACTION/RESTRICT bloqueia DELETE) ==='
select n.nspname || '.' || cl.relname as tabela,
       a.attname                        as coluna,
       con.conname                      as constraint,
       case con.confdeltype
         when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'n' then 'SET NULL'
         when 'c' then 'CASCADE'   when 'd' then 'SET DEFAULT'
       end                              as ao_apagar,
       a.attnotnull                     as obrigatoria
from pg_constraint con
join pg_class cl     on cl.oid = con.conrelid
join pg_namespace n  on n.oid = cl.relnamespace
join unnest(con.conkey) as k(attnum) on true
join pg_attribute a  on a.attrelid = con.conrelid and a.attnum = k.attnum
where con.contype = 'f'
  and con.confrelid = 'auth.users'::regclass
  and n.nspname = 'public'
order by 4, 1, 2;

\echo '=== 5. Resumo por regra de exclusao (todas as FKs para auth.users no public) ==='
select case con.confdeltype
         when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'n' then 'SET NULL'
         when 'c' then 'CASCADE'   when 'd' then 'SET DEFAULT'
       end as ao_apagar,
       count(*) as quantas
from pg_constraint con
join pg_class cl    on cl.oid = con.conrelid
join pg_namespace n on n.oid = cl.relnamespace
where con.contype = 'f' and con.confrelid = 'auth.users'::regclass and n.nspname = 'public'
group by 1
order by 2 desc;

\echo '=== 6. FKs das 7 constraints que a migration da LGPD deveria ter recriado como SET NULL ==='
select con.conname,
       cl.relname as tabela,
       case con.confdeltype
         when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'n' then 'SET NULL'
         when 'c' then 'CASCADE'   when 'd' then 'SET DEFAULT'
       end        as ao_apagar
from pg_constraint con
join pg_class cl on cl.oid = con.conrelid
where con.conname in ('rate_limit_logs_user_id_fkey', 'performance_metrics_user_id_fkey',
                      'rate_limit_alerts_user_id_fkey', 'rate_limit_alerts_resolved_by_fkey',
                      'kb_article_history_changed_by_fkey', 'entity_versions_changed_by_fkey',
                      'user_roles_granted_by_fkey')
order by 1;

\echo '=== 7. Ledger: versoes do empate de timestamp (achado A-094, etapa 133) ==='
select 'supabase_migrations.schema_migrations' as ledger, version
from supabase_migrations.schema_migrations
where version in ('20250102000000', '20261122230000', '20261122230100')
union all
select 'public.schema_migrations', name
from public.schema_migrations
where name like '20250102000000%'
   or name like '20261122230000%'
   or name like '20261122230100%'
order by 2;

do $$
declare
  v_existe      boolean;
  v_no_ledger   boolean;
  v_no_action   integer;
  v_desfecho    text;
begin
  v_existe := to_regclass('public.entity_versions') is not null;

  select exists (select 1 from supabase_migrations.schema_migrations where version = '20261123010000')
      or exists (select 1 from public.schema_migrations where name like '20261123010000%')
    into v_no_ledger;

  select count(*) into v_no_action
    from pg_constraint con
    join pg_class cl    on cl.oid = con.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
   where con.contype = 'f'
     and con.confrelid = 'auth.users'::regclass
     and n.nspname = 'public'
     and con.confdeltype in ('a', 'r');

  v_desfecho := case
    when v_existe and v_no_ledger    then '(d) tabela existe e migration nao consta no ledger -> investigar registro'
    when v_existe and not v_no_ledger then '(a) tabela existe e migration consta -> correcao aplicada; corrigir types.ts (etapa 136)'
    when not v_existe and v_no_ledger then '(c) tabela nao existe mas consta no ledger -> apply parcial, investigar'
    else '(b) tabela nao existe e migration nao consta -> LGPD QUEBRADA, migration nova com guarda'
  end;

  raise notice 'DESFECHO 132: %', v_desfecho;
  raise notice 'FKs para auth.users que ainda bloqueiam DELETE (NO ACTION/RESTRICT): %', v_no_action;
end $$;

\echo '=== fim: somente leitura, nada foi gravado ==='
-- Etapa 130 (achado A-091) -- CREATE TABLE retroativo das tabelas geo_*.
--
-- geo_access_logs, geo_restrictions e geo_settings existem no banco de producao
-- (e em src/integrations/supabase/types.ts:3666,3711,3744) e sao usadas em
-- producao (src/hooks/useGeoBlocking.ts, supabase/functions/validate-geo/index.ts),
-- mas nenhuma das 241 migrations as criava -- nasceram direto no banco, fora do
-- fluxo. Um ambiente novo nao reconstruia o schema, e dezoito statements de DDL
-- posteriores as tratavam como existentes sem guarda (tres deles ALTER POLICY,
-- que nao aceitam IF EXISTS -- etapas 131 e 134).
--
-- PRODUCAO E A REFERENCIA deste arquivo. O DDL abaixo foi reconstruido a partir do
-- catalogo real (pg_class, pg_attribute, pg_attrdef, pg_constraint, pg_index,
-- pg_policies, pg_trigger) e conferido coluna a coluna pelo gate
-- supabase/tests/geo_tables_retroativo_rls_test.sql -- nao de types.ts.
-- `CREATE TABLE IF NOT EXISTS` e os blocos DO com guarda tornam a migration inofensiva
-- em producao (no-op, nada e reescrito) e suficiente num banco vazio.
--
-- Grants: nao ha GRANT explicito porque os privilegios default do projeto (anon,
-- authenticated e service_role com os mesmos grants de postgres) sao aplicados a toda
-- tabela criada em public -- e exatamente o ACL que as tres tabelas tem em producao.
--
-- ORDEM NA SEQUENCIA: este arquivo nasceu com o carimbo 20261127140000, DEPOIS das
-- migrations que consomem as tabelas -- a primeira delas e 20260315143859, que faz
-- `DROP POLICY IF EXISTS ... ON public.geo_access_logs` sem guarda, e as que seguem
-- fazem `ALTER POLICY` (que nem aceita IF EXISTS). Num banco vazio a sequencia abortava
-- antes de chegar aqui, logo a reconstrucao nao existia. O carimbo foi corrigido para
-- 20260315143858 -- um segundo antes da primeira migration que toca as tabelas -- e o
-- SQL e exatamente o mesmo. A versao 20261127140000 continua no ledger porque foi
-- executada em producao; como o conteudo e identico, nao ha divergencia entre o que
-- rodou e o que esta versionado.
--
-- Reversao: so faz sentido em ambiente novo; em producao esta migration nao alterou nada.
--   drop table if exists public.geo_access_logs;
--   drop table if exists public.geo_restrictions;
--   drop table if exists public.geo_settings;

-- ---------------------------------------------------------------- geo_access_logs
create table if not exists public.geo_access_logs (
  id            uuid        not null default gen_random_uuid(),
  user_id       uuid,
  user_email    text,
  ip_address    text        not null,
  country_code  text,
  country_name  text,
  city          text,
  region        text,
  action        text        not null,
  reason        text,
  user_agent    text,
  created_at    timestamp with time zone not null default now(),
  constraint geo_access_logs_pkey primary key (id),
  constraint geo_access_logs_action_check check (action = any (array['allowed'::text, 'blocked'::text]))
);

alter table public.geo_access_logs enable row level security;

create index if not exists idx_geo_access_logs_country_code
  on public.geo_access_logs using btree (country_code);

create index if not exists idx_geo_access_logs_created_at
  on public.geo_access_logs using btree (created_at desc);

create index if not exists idx_geo_access_logs_created_brin
  on public.geo_access_logs using brin (created_at) with (pages_per_range = '32');

-- ------------------------------------------------------------- geo_restrictions
create table if not exists public.geo_restrictions (
  id               uuid        not null default gen_random_uuid(),
  country_code     text        not null,
  country_name     text        not null,
  restriction_type text        not null,
  reason           text,
  created_at       timestamp with time zone not null default now(),
  created_by       text,
  updated_at       timestamp with time zone not null default now(),
  constraint geo_restrictions_pkey primary key (id),
  constraint geo_restrictions_country_code_key unique (country_code),
  constraint geo_restrictions_restriction_type_check check (restriction_type = any (array['blocked'::text, 'allowed'::text]))
);

alter table public.geo_restrictions enable row level security;

create index if not exists idx_geo_restrictions_country_code
  on public.geo_restrictions using btree (country_code);

-- ------------------------------------------------------------------ geo_settings
create table if not exists public.geo_settings (
  id                   uuid        not null default gen_random_uuid(),
  enabled              boolean     not null default false,
  mode                 text        not null default 'blocklist'::text,
  log_blocked_attempts boolean     not null default true,
  notify_on_block      boolean     not null default false,
  created_at           timestamp with time zone not null default now(),
  updated_at           timestamp with time zone not null default now(),
  constraint geo_settings_pkey primary key (id),
  constraint geo_settings_mode_check check (mode = any (array['blocklist'::text, 'allowlist'::text]))
);

alter table public.geo_settings enable row level security;

-- ------------------------------------------------------------------- policies
-- create policy nao tem IF NOT EXISTS; os blocos DO replicam o estado exato de
-- producao (pg_policies) e nao fazem nada onde a policy ja existe.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geo_access_logs' and policyname = 'Admins can view geo access logs') then
    execute 'create policy "Admins can view geo access logs" on public.geo_access_logs for select to authenticated using (public.is_admin_or_supervisor())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geo_access_logs' and policyname = 'Only admins can insert geo access logs') then
    execute 'create policy "Only admins can insert geo access logs" on public.geo_access_logs for insert to authenticated with check (public.is_admin_or_supervisor())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geo_access_logs' and policyname = 'Admins can delete geo access logs') then
    execute 'create policy "Admins can delete geo access logs" on public.geo_access_logs for delete to authenticated using (public.is_admin_or_supervisor())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geo_restrictions' and policyname = 'Admins can manage geo restrictions') then
    execute 'create policy "Admins can manage geo restrictions" on public.geo_restrictions for all to authenticated using (public.is_admin_or_supervisor())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geo_restrictions' and policyname = 'Authenticated users can read geo restrictions') then
    execute 'create policy "Authenticated users can read geo restrictions" on public.geo_restrictions for select to authenticated using (auth.uid() is not null)';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geo_settings' and policyname = 'Admins can manage geo settings') then
    execute 'create policy "Admins can manage geo settings" on public.geo_settings for all to authenticated using (public.is_admin_or_supervisor())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'geo_settings' and policyname = 'Admins supervisors view geo_settings') then
    execute 'create policy "Admins supervisors view geo_settings" on public.geo_settings for select to authenticated using (public.is_admin_or_supervisor())';
  end if;
end $$;

-- ------------------------------------------------------------------- triggers
do $$
begin
  if to_regprocedure('public.update_updated_at_column()') is not null then
    if not exists (select 1 from pg_trigger where tgrelid = 'public.geo_restrictions'::regclass and tgname = 'update_geo_restrictions_updated_at' and not tgisinternal) then
      execute 'create trigger update_geo_restrictions_updated_at before update on public.geo_restrictions for each row execute function public.update_updated_at_column()';
    end if;

    if not exists (select 1 from pg_trigger where tgrelid = 'public.geo_settings'::regclass and tgname = 'update_geo_settings_updated_at' and not tgisinternal) then
      execute 'create trigger update_geo_settings_updated_at before update on public.geo_settings for each row execute function public.update_updated_at_column()';
    end if;
  end if;
end $$;
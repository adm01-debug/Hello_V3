-- Etapa 131 — guarda de idempotencia nos ALTER POLICY das tabelas geo_*.
--
-- 20260404151943_4d4acd99-8f24-419a-b876-9385032bcac4.sql:87-90 tem quatro
-- ALTER POLICY ... TO authenticated apontando para public.geo_access_logs,
-- public.geo_restrictions e public.geo_settings. ALTER POLICY nao aceita
-- IF EXISTS: sem a tabela ou sem a policy o statement aborta, e aquele arquivo
-- fica nao reaplicavel num banco sem essas tabelas (achado A-091). Ele nao pode
-- ser editado -- ja foi aplicado, e o ledger guarda a versao, nao o conteudo.
--
-- Na sequencia versionada de hoje os quatro alvos existem quando 20260404151943
-- roda: 20260315143858_create_geo_tables_retroativo.sql (etapa 130) cria
-- "Admins can view geo access logs", "Admins can manage geo restrictions" e
-- "Admins can manage geo settings"; 20260315143859_53accc1d-...:8 cria
-- "Authenticated can insert geo access logs", removida depois por
-- 20260404153313_5b939cc2-...:22. Esta migration, portanto, nao desfaz um abort
-- do passado: ela reafirma o alvo de forma idempotente onde a tabela ou a policy
-- exista -- inclusive em producao, onde a policy de INSERT ampla foi removida e
-- os outros tres ja estao em authenticated (no-op).
--
-- Nenhum statement roda fora de guarda: cada bloco confere pg_policies antes de
-- executar, entao a migration passa tambem num banco sem as tabelas geo_*.
-- 20260404151943 esta documentada como nao reaplicavel em docs/agentes/banco.md;
-- a lista completa das demais e a etapa 134.

do $$
declare
  alvo record;
begin
  for alvo in
    select * from (values
      ('geo_access_logs'::text, 'Admins can view geo access logs'::text),
      ('geo_access_logs'::text, 'Authenticated can insert geo access logs'::text),
      ('geo_restrictions'::text, 'Admins can manage geo restrictions'::text),
      ('geo_settings'::text, 'Admins can manage geo settings'::text)
    ) as t(tabela, policy)
  loop
    if exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = alvo.tabela
        and policyname = alvo.policy
    ) then
      execute format('alter policy %I on public.%I to authenticated', alvo.policy, alvo.tabela);
    end if;
  end loop;
end $$;

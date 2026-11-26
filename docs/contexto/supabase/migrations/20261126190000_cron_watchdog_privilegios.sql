-- Etapa 231 — correção de privilégio do vigia de cron.
--
-- A migration 20261126170000 criou `cron_health_rows()`, `get_cron_health()` e
-- `check_cron_health()` revogando apenas de PUBLIC. O Supabase concede EXECUTE em
-- toda função nova de `public` a anon/authenticated/service_role por
-- ALTER DEFAULT PRIVILEGES, então as três continuaram executáveis pelo anon.
--
-- Foi o gate `supabase/tests/cron_watchdog_rls_test.sql` (passo 3/8) que reprovou em
-- produção. Além de ler o histórico de cron sem ser admin, o anon podia chamar
-- `check_cron_health()`: como ela é SECURITY DEFINER, apagaria histórico de 30 dias
-- de `cron.job_run_details` rodando como o dono da função.
--
-- Este arquivo existe porque a versão anterior já estava registrada em
-- `public.schema_migrations` (o workflow se recusa a reaplicar a mesma versão). O
-- conteúdo abaixo é idempotente e pode rodar quantas vezes for.

REVOKE ALL ON FUNCTION public.cron_health_rows() FROM PUBLIC, anon, authenticated, service_role

REVOKE ALL ON FUNCTION public.get_cron_health() FROM PUBLIC, anon

GRANT EXECUTE ON FUNCTION public.get_cron_health() TO authenticated

REVOKE ALL ON FUNCTION public.check_cron_health() FROM PUBLIC, anon, authenticated

GRANT EXECUTE ON FUNCTION public.check_cron_health() TO service_role

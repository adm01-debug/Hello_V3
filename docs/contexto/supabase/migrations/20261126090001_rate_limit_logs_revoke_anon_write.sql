-- Etapa 029 (achado A-065, parte 2): fechar a superficie de escrita que sobrou.
--
-- O Supabase concede ALL nas tabelas novas de public para anon, authenticated e
-- service_role (default privileges). Como a policy nova e TO authenticated, o
-- privilegio de UPDATE/DELETE em anon era superficie morta: nao gravava nada
-- (RLS nega), mas existia. Revogar deixa o estado igual ao pretendido e o gate
-- supabase/tests/rate_limit_logs_write_policies_rls_test.sql exige isso.
--
-- REVOKE e idempotente: repete sem erro se o privilegio ja nao existe.

REVOKE UPDATE, DELETE ON public.rate_limit_logs FROM anon

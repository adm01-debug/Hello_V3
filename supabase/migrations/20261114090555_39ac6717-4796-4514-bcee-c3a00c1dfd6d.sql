-- fix: financial_impact_daily passa a executar com security_invoker
-- Correção do lint view_security_definer: a view ignora RLS das tabelas-base
-- e expõe todos os dados para qualquer authenticated com GRANT SELECT.
-- Com security_invoker, SELECT passa a respeitar as policies:
--   call_sessions -> "Strict isolation: Agents view own sessions"
--   deals        -> "Agents view own deals" / admins e supervisors veem tudo

ALTER VIEW public.financial_impact_daily SET (security_invoker = true);

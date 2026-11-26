-- Etapa 029 (achado A-065): o painel de rate limit tem "Desbloquear IP" e
-- "Limpar logs antigos", mas a tabela so tinha policies de SELECT e INSERT.
--
-- RLS sem policy nao devolve erro: devolve 0 linhas afetadas. O admin clicava,
-- via o toast de sucesso e o IP continuava bloqueado (e os logs antigos, no
-- lugar). As duas policies abaixo sao o que faltava.
--
-- TO authenticated explicito (A-069 nao aumenta) e is_admin(), nao
-- is_admin_or_supervisor(): desbloquear IP e apagar log de seguranca sao acoes
-- de administrador. Nada de FOR ALL: sobreporia as policies de SELECT/INSERT.

DROP POLICY IF EXISTS "Admins can update rate_limit_logs" ON public.rate_limit_logs;
CREATE POLICY "Admins can update rate_limit_logs"
  ON public.rate_limit_logs FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete rate_limit_logs" ON public.rate_limit_logs;
CREATE POLICY "Admins can delete rate_limit_logs"
  ON public.rate_limit_logs FOR DELETE TO authenticated
  USING (public.is_admin());

-- A policy sozinha nao e alcancavel se o role nao tiver privilegio de tabela;
-- sem este GRANT o UPDATE/DELETE continua afetando 0 linhas.
GRANT UPDATE, DELETE ON public.rate_limit_logs TO authenticated;

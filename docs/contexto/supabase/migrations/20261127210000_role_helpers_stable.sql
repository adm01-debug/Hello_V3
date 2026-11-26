-- Etapa 101 — is_admin(), is_supervisor() e is_admin_or_supervisor() viram STABLE.
--
-- Medido em producao (run 45862725374, sonda probe_065_101):
--   is_admin=v  is_supervisor=v  is_admin_or_supervisor=v   (VOLATILE)
--   get_auth_agent_id=s  get_user_role=s  has_role=s  is_admin_user=s  get_user_agent_name=s
-- 274 policies dependem dessas quatro; 313 ocorrencias so de is_admin_or_supervisor.
--
-- Funcao VOLATILE num predicado de RLS e reavaliada linha a linha e nao pode virar
-- InitPlan, entao o embrulho (SELECT ...) aplicado em 20261122200000 nao ajuda nessas
-- tres. STABLE e correto: dentro de um comando o papel do usuario nao muda.
-- NAO usar IMMUTABLE: elas leem user_roles e o planner passaria a cachear entre comandos.
--
-- Corpo copiado sem alteracao das ultimas definicoes:
--   is_admin / is_supervisor   -> 20261122280000_is_admin_and_supervisor_honor_expiry.sql
--   is_admin_or_supervisor     -> 20261122250000_role_checks_honor_active_and_expiry.sql
-- CREATE OR REPLACE preserva ACL (o REVOKE de anon da etapa 146 continua valendo).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND coalesce(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$function$

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'supervisor')
      AND coalesce(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$function$

CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'supervisor')
      AND coalesce(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$function$

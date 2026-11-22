-- is_admin_user(), get_user_role() e get_profile_role() liam user_profiles.role,
-- a coluna espelho, e por isso divergiam de is_admin_or_supervisor().
--
-- Medido em producao: 20 policies usam is_admin_user() -- incluindo "Admins
-- manage all profiles", "Admins update any profile", voip_trunks (4 policies),
-- agent_trunk_assignments, fraud_signals, voice_prints, routing_rules,
-- consent_records, redaction_log. Quatro edge functions tambem chamam via RPC:
-- voip-trunks-manage, voip-trunks-healthcheck, fuzz-test-runner, ldap-sync.
--
-- Enquanto as duas fontes puderem divergir, um usuario com papel concedido em
-- user_roles (a fonte correta) nao passa nessas 20 policies, e um usuario com
-- papel so em user_profiles.role passa -- exatamente ao contrario do resto do
-- sistema. Depois das migrations anteriores a coluna espelho nao e mais
-- corrigida por nada, entao o risco de ficar defasada aumenta com o tempo.

CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
      AND coalesce(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
  )
$function$;

-- get_user_role() e get_profile_role() alimentam a UI, que precisa saber o
-- papel exibido. Passam a derivar de user_roles, com precedencia
-- admin > supervisor > agent, e caem para user_profiles.role apenas quando o
-- usuario nao tem nenhuma linha em user_roles -- assim a UI nao quebra para
-- quem ainda nao foi migrado.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(
    (
      SELECT CASE
               WHEN bool_or(role = 'admin') THEN 'admin'
               WHEN bool_or(role = 'supervisor') THEN 'supervisor'
               ELSE min(role::text)
             END
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND coalesce(is_active, true)
        AND (expires_at IS NULL OR expires_at > now())
    ),
    (SELECT role FROM public.user_profiles WHERE id = auth.uid())
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(
    (
      SELECT CASE
               WHEN bool_or(role = 'admin') THEN 'admin'
               WHEN bool_or(role = 'supervisor') THEN 'supervisor'
               ELSE min(role::text)
             END
      FROM public.user_roles
      WHERE user_id = _user_id
        AND coalesce(is_active, true)
        AND (expires_at IS NULL OR expires_at > now())
    ),
    (SELECT role FROM public.user_profiles WHERE id = _user_id)
  )
$function$;
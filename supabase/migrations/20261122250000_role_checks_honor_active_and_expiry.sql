-- is_admin_or_supervisor() ignorava is_active e expires_at em user_roles.
--
-- Medido em producao antes deste fix: um papel com is_active = false e um papel
-- com expires_at no passado retornavam is_admin_or_supervisor() = true. As duas
-- colunas existem em user_roles desde sempre, mas a funcao lia apenas user_id e
-- role. Efeito: revogar acesso desativando a linha, ou conceder acesso por tempo
-- limitado, nao revogava nada -- as ~255 policies que dependem desta funcao
-- continuavam liberando.
--
-- Corrige tambem has_role(uuid, app_role), que tinha a mesma omissao e e chamada
-- por policies e por edge functions.

CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS boolean
LANGUAGE plpgsql
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
$function$;

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = _user_id
            AND role = _role
            AND coalesce(is_active, true)
            AND (expires_at IS NULL OR expires_at > now())
        );
      $body$;
    $fn$;
  END IF;
END
$do$;
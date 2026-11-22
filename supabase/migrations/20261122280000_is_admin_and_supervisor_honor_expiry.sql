-- is_admin() e is_supervisor() honravam is_active mas nao expires_at.
--
-- get_user_roles() e has_permission() ja filtram as duas colunas. As duas
-- funcoes acima ficaram para tras, entao um papel com data de validade vencida
-- continuava concedendo acesso por estes dois caminhos, mesmo com todo o resto
-- do sistema negando.
--
-- Medido em producao: papel com is_active=true e expires_at no passado
-- retornava is_admin() = true.

CREATE OR REPLACE FUNCTION public.is_admin()
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
      AND role = 'admin'
      AND coalesce(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_supervisor()
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
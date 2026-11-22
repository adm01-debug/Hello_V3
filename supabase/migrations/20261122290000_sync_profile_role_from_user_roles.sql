-- Impede que a divergencia entre as duas fontes de papel volte a acontecer.
--
-- user_roles.role e a fonte de verdade da autorizacao; user_profiles.role e um
-- espelho de exibicao. Sem um mecanismo de sincronizacao os dois voltam a se
-- separar silenciosamente em qualquer alteracao de papel, e o frontend passa a
-- mostrar/negar acesso com base em dado defasado.
--
-- Este par de funcoes faz o espelho seguir a fonte de verdade:
--   * trg_sync_profile_role recalcula o espelho a cada mudanca em user_roles;
--   * prevent_role_escalation deixa a escrita interna passar (o papel ja foi
--     validado em user_roles), mantendo o bloqueio de escalonamento para
--     qualquer outro caminho que tente alterar a coluna espelho.

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Escrita interna do sync_profile_role_from_user_roles: papel ja validado
    -- em user_roles, que e a fonte de verdade.
    IF current_setting('app.role_sync_in_progress', true) = 'on' THEN
      RETURN NEW;
    END IF;
    IF NOT is_admin_user(auth.uid()) THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_user_id uuid;
  v_effective text;
BEGIN
  -- O trigger tambem roda em DELETE; nesse caso quem mudou e OLD.
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  SELECT role::text INTO v_effective
  FROM public.user_roles
  WHERE user_id = v_user_id
    AND COALESCE(is_active, true) = true
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'supervisor' THEN 2
                     WHEN 'agent' THEN 3 ELSE 4 END
  LIMIT 1;

  -- Sem papel valido restante: rebaixa o espelho ao menor privilegio. Nunca
  -- promove; evita um espelho orfao exibindo admin sem papel correspondente.
  IF v_effective IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      RETURN NEW;
    END IF;
    v_effective := 'agent';
  END IF;

  PERFORM set_config('app.role_sync_in_progress', 'on', true);
  UPDATE public.user_profiles
     SET role = v_effective
   WHERE id = v_user_id
     AND role IS DISTINCT FROM v_effective;
  PERFORM set_config('app.role_sync_in_progress', 'off', true);

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_from_user_roles();

-- O espelho precisa aceitar todos os valores do enum app_role; caso contrario
-- um rebaixamento para 'viewer' falha e a sincronizacao aborta.
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role = ANY (ARRAY['agent'::text, 'supervisor'::text, 'admin'::text, 'viewer'::text]));

COMMENT ON FUNCTION public.sync_profile_role_from_user_roles() IS
  'Mantem user_profiles.role (espelho de exibicao) alinhado a user_roles (fonte de verdade).';
-- BUG MEDIDO EM PRODUCAO: o trigger trg_sync_profile_role so fazia UPDATE em
-- public.user_profiles. Quando o usuario tem papel em user_roles mas NENHUMA linha em
-- user_profiles, o UPDATE afeta 0 linhas e o espelho nunca e criado.
--
-- Evidencia antes desta migration:
--   user_roles   -> 4 linhas (todas role='admin')
--   user_profiles-> 3 linhas
--   orfao        -> 8ae5b9a1-cc1a-4553-a5ea-8e74afba25d2 (admin em user_roles, ausente
--                   em user_profiles)
--
-- Consequencia: qualquer leitura de public.user_profiles.role para autorizacao nega
-- um usuario que o banco considera admin (is_admin_user ja le user_roles e devolve true).
-- As 12 edges que checam user_profiles.role caem nesse caso.
--
-- Correcao: INSERT ... ON CONFLICT DO UPDATE. Nao promove ninguem -- o valor gravado e
-- o mesmo v_effective ja calculado a partir de user_roles. Sem papel valido, o INSERT
-- e ignorado (o RETURN NEW acima ja cobre TG_OP='INSERT').

CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_effective text;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  SELECT role::text INTO v_effective
  FROM public.user_roles
  WHERE user_id = v_user_id
    AND COALESCE(is_active, true) = true
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'supervisor' THEN 2
                     WHEN 'agent' THEN 3 ELSE 4 END
  LIMIT 1;

  IF v_effective IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      RETURN NEW;
    END IF;
    v_effective := 'agent';
  END IF;

  PERFORM set_config('app.role_sync_in_progress', 'on', true);
  -- user_profiles.email e NOT NULL sem default: o INSERT precisa do email de auth.users.
  INSERT INTO public.user_profiles (id, email, role)
  SELECT v_user_id, COALESCE(au.email, ''), v_effective
  FROM (SELECT 1) AS _guard
  LEFT JOIN auth.users au ON au.id = v_user_id
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role
    WHERE public.user_profiles.role IS DISTINCT FROM EXCLUDED.role;
  PERFORM set_config('app.role_sync_in_progress', 'off', true);

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Backfill dos orfaos que o UPDATE nao alcancou. Idempotente e sem promocao: o papel
-- gravado e exatamente o que user_roles ja diz.
INSERT INTO public.user_profiles (id, email, role)
SELECT DISTINCT ON (ur.user_id) ur.user_id, COALESCE(au.email, ''), ur.role::text
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN public.user_profiles up ON up.id = ur.user_id
WHERE up.id IS NULL
  AND COALESCE(ur.is_active, true) = true
  AND (ur.expires_at IS NULL OR ur.expires_at > now())
ORDER BY ur.user_id,
         CASE ur.role WHEN 'admin' THEN 1 WHEN 'supervisor' THEN 2
                      WHEN 'agent' THEN 3 ELSE 4 END
ON CONFLICT (id) DO NOTHING;

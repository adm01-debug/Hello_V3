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
$function$

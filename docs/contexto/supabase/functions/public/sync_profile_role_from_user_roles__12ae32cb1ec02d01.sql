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
$function$

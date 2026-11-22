CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
      AND coalesce(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
  )
$function$

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
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
$function$

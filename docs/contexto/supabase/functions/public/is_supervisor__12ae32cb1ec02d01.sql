CREATE OR REPLACE FUNCTION public.is_supervisor()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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

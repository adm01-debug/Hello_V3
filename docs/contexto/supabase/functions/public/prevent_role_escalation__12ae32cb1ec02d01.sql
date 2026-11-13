CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If role is being changed, only admins can do that
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT is_admin_user(auth.uid()) THEN
      NEW.role := OLD.role; -- Revert role change
    END IF;
  END IF;
  RETURN NEW;
END;
$function$

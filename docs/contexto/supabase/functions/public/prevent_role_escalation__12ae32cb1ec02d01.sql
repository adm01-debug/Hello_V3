CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.audit_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_email TEXT := auth.jwt() ->> 'email';
  v_resource_id TEXT;
  v_details JSONB;
BEGIN
  v_resource_id := CASE
    WHEN TG_OP = 'DELETE' THEN COALESCE(OLD.id::text, '')
    ELSE COALESCE(NEW.id::text, '')
  END;

  v_details := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'old_data', CASE WHEN TG_OP IN ('DELETE','UPDATE') THEN to_jsonb(OLD) ELSE NULL END,
    'new_data', CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    'occurred_at', now()
  );

  BEGIN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_role,
      action, resource_type, resource_id, details, ip_address
    ) VALUES (
      v_actor_id,
      v_actor_email,
      COALESCE(auth.jwt() ->> 'role', 'authenticated'),
      TG_OP || '_' || upper(TG_TABLE_NAME),
      TG_TABLE_NAME,
      v_resource_id,
      v_details,
      inet_client_addr()::text
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'audit_role_change failed: %', SQLERRM;
  END;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$

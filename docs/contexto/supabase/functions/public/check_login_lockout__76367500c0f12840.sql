CREATE OR REPLACE FUNCTION public.check_login_lockout(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lockout RECORD;
  v_remaining_seconds INTEGER;
BEGIN
  SELECT * INTO v_lockout
  FROM public.account_lockouts
  WHERE email = LOWER(p_email);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', false, 'attempts', 0);
  END IF;
  
  -- Check if lockout has expired
  IF v_lockout.locked_until IS NOT NULL AND v_lockout.locked_until > now() THEN
    v_remaining_seconds := EXTRACT(EPOCH FROM (v_lockout.locked_until - now()))::INTEGER;
    RETURN jsonb_build_object(
      'locked', true,
      'attempts', v_lockout.failed_attempts,
      'locked_until', v_lockout.locked_until,
      'remaining_seconds', v_remaining_seconds
    );
  END IF;
  
  -- Lockout expired, reset if it was locked
  IF v_lockout.locked_until IS NOT NULL AND v_lockout.locked_until <= now() THEN
    UPDATE public.account_lockouts
    SET locked_until = NULL, failed_attempts = 0, updated_at = now()
    WHERE email = LOWER(p_email);
    
    RETURN jsonb_build_object('locked', false, 'attempts', 0);
  END IF;
  
  RETURN jsonb_build_object('locked', false, 'attempts', v_lockout.failed_attempts);
END;
$function$

CREATE OR REPLACE FUNCTION public.record_failed_login(p_email text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lockout RECORD;
  v_new_attempts INTEGER;
  v_lock_duration INTEGER;
  v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Record the attempt
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (LOWER(p_email), p_ip_address, p_user_agent, false);
  
  -- Get or create lockout record
  INSERT INTO public.account_lockouts (email, failed_attempts, last_failed_at)
  VALUES (LOWER(p_email), 1, now())
  ON CONFLICT (email) DO UPDATE
  SET 
    failed_attempts = account_lockouts.failed_attempts + 1,
    last_failed_at = now(),
    updated_at = now()
  RETURNING * INTO v_lockout;
  
  v_new_attempts := v_lockout.failed_attempts;
  
  -- Calculate lockout duration with exponential backoff after 5 attempts
  -- Attempts: 5 = 1min, 6 = 2min, 7 = 4min, 8 = 8min, 9 = 16min, 10+ = 30min max
  IF v_new_attempts >= 5 THEN
    v_lock_duration := LEAST(POWER(2, v_new_attempts - 5)::INTEGER, 30) * 60; -- seconds
    v_locked_until := now() + (v_lock_duration || ' seconds')::INTERVAL;
    
    UPDATE public.account_lockouts
    SET locked_until = v_locked_until, updated_at = now()
    WHERE email = LOWER(p_email);
    
    RETURN jsonb_build_object(
      'locked', true,
      'attempts', v_new_attempts,
      'locked_until', v_locked_until,
      'remaining_seconds', v_lock_duration
    );
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false,
    'attempts', v_new_attempts,
    'remaining_attempts', 5 - v_new_attempts
  );
END;
$function$

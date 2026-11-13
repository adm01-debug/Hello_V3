CREATE OR REPLACE FUNCTION public.record_successful_login(p_email text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Record the attempt
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (LOWER(p_email), p_ip_address, p_user_agent, true);
  
  -- Reset lockout
  DELETE FROM public.account_lockouts WHERE email = LOWER(p_email);
END;
$function$

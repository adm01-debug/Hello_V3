CREATE OR REPLACE FUNCTION public.get_auth_agent_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN (SELECT id FROM public.agents WHERE email = auth.jwt() ->> 'email' LIMIT 1);
END;
$function$

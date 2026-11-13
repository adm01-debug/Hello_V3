CREATE OR REPLACE FUNCTION public.can_access_agent_data(target_agent_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    is_admin_or_supervisor() 
    OR get_user_agent_name() = target_agent_name;
$function$

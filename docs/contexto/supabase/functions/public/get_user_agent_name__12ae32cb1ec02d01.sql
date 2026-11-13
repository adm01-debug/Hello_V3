CREATE OR REPLACE FUNCTION public.get_user_agent_name()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.name FROM public.agents a
  INNER JOIN public.user_profiles up ON up.agent_id = a.id
  WHERE up.id = auth.uid();
$function$

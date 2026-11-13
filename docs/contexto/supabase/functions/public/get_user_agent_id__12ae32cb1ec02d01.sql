CREATE OR REPLACE FUNCTION public.get_user_agent_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.id
  FROM public.agents a
  JOIN public.user_profiles up ON up.agent_id = a.id
  WHERE up.id = auth.uid()
  LIMIT 1;
$function$

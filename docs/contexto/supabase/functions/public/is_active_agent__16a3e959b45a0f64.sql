CREATE OR REPLACE FUNCTION public.is_active_agent(_agent_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.agents a
    INNER JOIN public.user_profiles up ON up.agent_id = a.id
    WHERE a.name = _agent_name
      AND up.id = auth.uid()
      AND a.status != 'inactive'
  )
$function$

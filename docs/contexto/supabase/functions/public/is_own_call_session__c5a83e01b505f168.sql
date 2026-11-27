CREATE OR REPLACE FUNCTION public.is_own_call_session(_call_session_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.call_sessions cs
    JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE cs.id = _call_session_id
      AND (
        public.is_admin_or_supervisor()
        OR cs.agent_name = up.full_name
        OR cs.agent_name = public.get_user_agent_name()
      )
  );
$function$

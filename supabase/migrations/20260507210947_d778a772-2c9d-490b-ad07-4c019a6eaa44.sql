CREATE OR REPLACE FUNCTION public.get_agents_with_active_calls()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(json_build_object(
        'id', a.id,
        'name', a.name,
        'status', a.status,
        'avatar_url', a.avatar_url,
        'extension', a.extension,
        'active_call_started_at', s.started_at,
        'active_call_caller', s.caller_name
    )) INTO result
    FROM public.agents a
    LEFT JOIN (
        SELECT DISTINCT ON (agent_name) agent_name, started_at, caller_name
        FROM public.call_sessions
        WHERE status = 'active'
        ORDER BY agent_name, started_at DESC
    ) s ON a.name = s.agent_name;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_agents_with_active_calls() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agents_with_active_calls() TO authenticated;
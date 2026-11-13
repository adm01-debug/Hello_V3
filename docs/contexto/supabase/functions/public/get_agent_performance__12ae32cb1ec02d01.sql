CREATE OR REPLACE FUNCTION public.get_agent_performance()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result json;
BEGIN
    WITH perf AS (
        SELECT 
            agent_name,
            COUNT(*) as total_calls,
            AVG(duration_seconds) as avg_duration,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_calls
        FROM public.call_sessions
        WHERE agent_name IS NOT NULL
        GROUP BY agent_name
    ),
    summaries AS (
        SELECT 
            s.agent_name,
            AVG(cs.customer_satisfaction) as avg_satisfaction,
            AVG(cs.agent_performance_score) as avg_performance
        FROM public.call_sessions s
        JOIN public.call_summaries cs ON s.id = cs.call_session_id
        WHERE s.agent_name IS NOT NULL
        GROUP BY s.agent_name
    )
    SELECT json_agg(json_build_object(
        'name', p.agent_name,
        'totalCalls', p.total_calls,
        'avgDuration', COALESCE(ROUND(p.avg_duration), 0),
        'completedCalls', p.completed_calls,
        'avgSatisfaction', COALESCE(ROUND(s.avg_satisfaction, 1), 0),
        'avgPerformance', COALESCE(ROUND(s.avg_performance, 1), 0)
    )) INTO result
    FROM perf p
    LEFT JOIN summaries s ON p.agent_name = s.agent_name;
    
    RETURN COALESCE(result, '[]'::json);
END;
$function$

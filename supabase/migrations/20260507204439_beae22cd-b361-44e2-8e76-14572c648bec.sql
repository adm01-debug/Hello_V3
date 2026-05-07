CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json AS $$
DECLARE
    today_iso timestamptz := CURRENT_DATE;
    yesterday_iso timestamptz := CURRENT_DATE - INTERVAL '1 day';
    result json;
BEGIN
    WITH stats AS (
        SELECT
            COUNT(*) FILTER (WHERE started_at >= today_iso) as today_calls,
            COUNT(*) FILTER (WHERE started_at >= yesterday_iso AND started_at < today_iso) as yesterday_calls,
            AVG(duration_seconds) FILTER (WHERE started_at >= today_iso AND status = 'completed') as avg_duration,
            COUNT(*) FILTER (WHERE started_at >= today_iso AND status = 'completed') as completed_today,
            (SELECT COUNT(*) FROM public.agents) as total_agents,
            (SELECT COUNT(*) FROM public.agents WHERE status IN ('available', 'busy')) as active_agents
        FROM public.call_sessions
    )
    SELECT json_build_object(
        'totalCallsToday', today_calls,
        'totalCallsChange', CASE 
            WHEN yesterday_calls > 0 THEN ROUND(((today_calls::float - yesterday_calls::float) / yesterday_calls::float) * 100)
            ELSE 0 
        END,
        'avgCallDuration', COALESCE(ROUND(avg_duration), 0),
        'durationChange', 0,
        'answeredRate', CASE 
            WHEN today_calls > 0 THEN ROUND((completed_today::float / today_calls::float) * 100)
            ELSE 0 
        END,
        'rateChange', 0,
        'activeAgents', active_agents,
        'totalAgents', total_agents
    ) INTO result
    FROM stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
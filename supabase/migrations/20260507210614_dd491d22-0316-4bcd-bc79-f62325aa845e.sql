CREATE OR REPLACE FUNCTION public.get_call_history_with_summaries(
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0,
    p_search text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_sentiment text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    WITH history AS (
        SELECT 
            s.id,
            s.caller_name,
            s.caller_phone,
            s.agent_name,
            s.started_at,
            s.ended_at,
            s.duration_seconds,
            s.status,
            s.direction,
            cs.overall_sentiment,
            cs.main_topics,
            cs.customer_satisfaction
        FROM public.call_sessions s
        LEFT JOIN public.call_summaries cs ON s.id = cs.call_session_id
        WHERE 
            (p_search IS NULL OR p_search = '' OR 
             s.caller_name ILIKE '%' || p_search || '%' OR 
             s.caller_phone ILIKE '%' || p_search || '%' OR 
             s.agent_name ILIKE '%' || p_search || '%')
            AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status)
            AND (p_sentiment IS NULL OR p_sentiment = 'all' OR cs.overall_sentiment = p_sentiment)
        ORDER BY s.started_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT json_agg(h) INTO result FROM history h;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_call_history_with_summaries(integer, integer, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_call_history_with_summaries(integer, integer, text, text, text) TO authenticated;
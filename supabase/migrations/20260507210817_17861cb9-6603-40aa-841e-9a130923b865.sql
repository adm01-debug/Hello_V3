CREATE OR REPLACE FUNCTION public.get_call_volume_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    WITH RECURSIVE hours AS (
        SELECT date_trunc('hour', now() - interval '23 hours') as h
        UNION ALL
        SELECT h + interval '1 hour'
        FROM hours
        WHERE h < date_trunc('hour', now())
    ),
    stats AS (
        SELECT 
            date_trunc('hour', started_at) as hour_start,
            COUNT(*) FILTER (WHERE direction = 'outbound') as outgoing,
            COUNT(*) FILTER (WHERE direction != 'outbound' OR direction IS NULL) as incoming
        FROM public.call_sessions
        WHERE started_at >= now() - interval '24 hours'
        GROUP BY 1
    )
    SELECT json_agg(json_build_object(
        'hour', to_char(h.h, 'HH24:00'),
        'incoming', COALESCE(s.incoming, 0),
        'outgoing', COALESCE(s.outgoing, 0)
    )) INTO result
    FROM hours h
    LEFT JOIN stats s ON h.h = s.hour_start
    ORDER BY h.h;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_call_volume_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_call_volume_stats() TO authenticated;
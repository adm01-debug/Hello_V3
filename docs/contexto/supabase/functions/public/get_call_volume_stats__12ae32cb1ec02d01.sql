CREATE OR REPLACE FUNCTION public.get_call_volume_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    ),
    joined AS (
        SELECT
            h.h as hour_ts,
            COALESCE(s.incoming, 0) as incoming,
            COALESCE(s.outgoing, 0) as outgoing
        FROM hours h
        LEFT JOIN stats s ON h.h = s.hour_start
        ORDER BY h.h
    )
    SELECT json_agg(json_build_object(
        'hour', to_char(j.hour_ts, 'HH24:00'),
        'incoming', j.incoming,
        'outgoing', j.outgoing
    )) INTO result
    FROM joined j;

    RETURN COALESCE(result, '[]'::json);
END;
$function$

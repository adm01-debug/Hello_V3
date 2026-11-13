CREATE OR REPLACE FUNCTION public.get_queue_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    today_iso timestamptz := CURRENT_DATE;
    result json;
BEGIN
    WITH queue_counts AS (
        SELECT
            COUNT(*) FILTER (WHERE status = 'ringing') as waiting,
            COUNT(*) FILTER (WHERE started_at >= today_iso AND status = 'abandoned') as abandoned,
            COUNT(*) FILTER (WHERE started_at >= today_iso) as total_today,
            COUNT(*) FILTER (WHERE started_at >= today_iso AND status = 'completed') as completed_today
        FROM public.call_sessions
    ),
    hold_metrics AS (
        SELECT
            AVG(duration_seconds) as avg_wait_time,
            MAX(duration_seconds) as longest_wait
        FROM public.hold_events
        WHERE started_at >= today_iso
    )
    SELECT json_build_object(
        'waiting', COALESCE(waiting, 0),
        'avgWaitTime', COALESCE(ROUND(avg_wait_time), 0),
        'longestWait', COALESCE(longest_wait, 0),
        'abandoned', COALESCE(abandoned, 0),
        'serviceLevelPercent', CASE 
            WHEN total_today > 0 THEN ROUND((completed_today::float / total_today::float) * 100)
            ELSE 100 
        END
    ) INTO result
    FROM queue_counts, hold_metrics;
    
    RETURN result;
END;
$function$

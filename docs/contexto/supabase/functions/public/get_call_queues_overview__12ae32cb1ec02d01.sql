CREATE OR REPLACE FUNCTION public.get_call_queues_overview()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(jsonb_agg(q ORDER BY q.priority DESC, q.name), '[]'::jsonb)
  FROM (
    SELECT
      cq.id,
      cq.name,
      cq.is_active,
      cq.strategy,
      cq.priority,
      cq.max_wait_seconds,
      cq.max_queue_size,
      cq.moh_enabled,
      cq.announce_position,
      COUNT(m.id) FILTER (WHERE m.is_active) AS active_members,
      COUNT(m.id) AS total_members
    FROM public.call_queues cq
    LEFT JOIN public.call_queue_members m ON m.queue_id = cq.id
    GROUP BY cq.id
  ) q;
$function$

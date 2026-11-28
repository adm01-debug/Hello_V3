CREATE OR REPLACE FUNCTION public.recalc_hold_time_from_events()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id uuid;
BEGIN
  v_session_id := COALESCE(NEW.call_session_id, OLD.call_session_id);
  IF v_session_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.call_sessions cs
  SET hold_time_seconds = COALESCE((
    SELECT SUM(EXTRACT(EPOCH FROM (he.ended_at - he.started_at)))::integer
    FROM public.hold_events he
    WHERE he.call_session_id = v_session_id
      AND he.ended_at IS NOT NULL
  ), 0)
  WHERE cs.id = v_session_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$

CREATE OR REPLACE FUNCTION public.record_trunk_usage(p_trunk_id uuid, p_call_session_id uuid, p_started_at timestamp with time zone, p_ended_at timestamp with time zone, p_was_failover boolean DEFAULT false, p_failover_reason text DEFAULT NULL::text, p_original_trunk_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_agent_id UUID;
  v_id UUID;
  v_duration INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_agent_id := public.get_user_agent_id();
  v_duration := GREATEST(0, EXTRACT(EPOCH FROM (p_ended_at - p_started_at))::INTEGER);

  INSERT INTO public.voip_trunk_usage_metrics (
    trunk_id, agent_id, call_session_id, started_at, ended_at,
    duration_seconds, was_failover, failover_reason, original_trunk_id
  ) VALUES (
    p_trunk_id, v_agent_id, p_call_session_id, p_started_at, p_ended_at,
    v_duration, p_was_failover, p_failover_reason, p_original_trunk_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$

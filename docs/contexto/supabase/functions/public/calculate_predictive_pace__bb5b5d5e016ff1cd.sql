CREATE OR REPLACE FUNCTION public.calculate_predictive_pace(p_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign RECORD;
  v_free_agents INTEGER;
  v_aht_seconds NUMERIC;
  v_connect_rate NUMERIC;
  v_abandon_rate NUMERIC;
  v_suggested INTEGER;
  v_reason TEXT;
BEGIN
  SELECT * INTO v_campaign FROM public.dialer_campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'campaign_not_found');
  END IF;

  -- Agentes disponíveis
  SELECT COUNT(*) INTO v_free_agents
  FROM public.agents
  WHERE status = 'available';

  -- AHT dos últimos 60 min (fallback 180s)
  SELECT COALESCE(AVG(duration_seconds), 180) INTO v_aht_seconds
  FROM public.call_sessions
  WHERE status = 'completed'
    AND started_at > now() - interval '1 hour';

  -- Taxa de conexão dos últimos 15 min (0..1)
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC
      / NULLIF(COUNT(*), 0),
    0.35
  ) INTO v_connect_rate
  FROM public.call_sessions
  WHERE started_at > now() - interval '15 minutes';

  -- Taxa de abandono corrente (0..1)
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE status = 'abandoned')::NUMERIC
      / NULLIF(COUNT(*), 0),
    0
  ) INTO v_abandon_rate
  FROM public.call_sessions
  WHERE started_at > now() - interval '15 minutes';

  -- Cálculo base: pace = agentes livres / taxa de conexão
  -- Se abandono > alvo, reduz. Se abandono muito baixo, sobe.
  IF v_free_agents = 0 THEN
    v_suggested := v_campaign.min_pace;
    v_reason := 'no_free_agents';
  ELSIF v_abandon_rate * 100 > v_campaign.target_abandon_rate THEN
    v_suggested := GREATEST(v_campaign.min_pace, v_campaign.max_concurrent_calls - 1);
    v_reason := 'abandon_over_target';
  ELSIF v_abandon_rate * 100 < (v_campaign.target_abandon_rate / 2) AND v_connect_rate > 0.2 THEN
    v_suggested := LEAST(
      v_campaign.max_pace,
      CEIL(v_free_agents::NUMERIC / GREATEST(v_connect_rate, 0.1))::INTEGER
    );
    v_reason := 'headroom_available';
  ELSE
    v_suggested := v_campaign.max_concurrent_calls;
    v_reason := 'stable';
  END IF;

  RETURN jsonb_build_object(
    'campaign_id', p_campaign_id,
    'current_pace', v_campaign.max_concurrent_calls,
    'suggested_pace', v_suggested,
    'free_agents', v_free_agents,
    'aht_seconds', ROUND(v_aht_seconds, 1),
    'connect_rate', ROUND(v_connect_rate, 3),
    'abandon_rate', ROUND(v_abandon_rate, 3),
    'target_abandon_rate', v_campaign.target_abandon_rate,
    'reason', v_reason,
    'computed_at', now()
  );
END;
$function$

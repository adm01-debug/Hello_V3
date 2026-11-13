CREATE OR REPLACE FUNCTION public.apply_predictive_pacing()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign RECORD;
  v_calc JSONB;
  v_updated INTEGER := 0;
  v_results JSONB := '[]'::JSONB;
BEGIN
  FOR v_campaign IN
    SELECT id FROM public.dialer_campaigns
    WHERE status = 'active' AND mode = 'predictive'
  LOOP
    v_calc := public.calculate_predictive_pace(v_campaign.id);
    IF (v_calc->>'suggested_pace')::INTEGER IS DISTINCT FROM (v_calc->>'current_pace')::INTEGER THEN
      UPDATE public.dialer_campaigns
      SET max_concurrent_calls = (v_calc->>'suggested_pace')::INTEGER,
          last_pacing_adjustment_at = now(),
          last_pacing_reason = v_calc->>'reason'
      WHERE id = v_campaign.id;
      v_updated := v_updated + 1;
    END IF;
    v_results := v_results || v_calc;
  END LOOP;

  RETURN jsonb_build_object(
    'updated_count', v_updated,
    'results', v_results,
    'ran_at', now()
  );
END;
$function$

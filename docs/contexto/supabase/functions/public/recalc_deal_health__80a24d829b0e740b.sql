CREATE OR REPLACE FUNCTION public.recalc_deal_health(p_deal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal RECORD;
  v_interactions_14d INTEGER;
  v_days_to_close INTEGER;
  v_activity_score NUMERIC := 0;
  v_recency_score NUMERIC := 0;
  v_prob_score NUMERIC := 0;
  v_total NUMERIC;
  v_factors JSONB;
BEGIN
  SELECT * INTO v_deal FROM public.deals WHERE id = p_deal_id;
  IF NOT FOUND OR v_deal.status <> 'open' THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_interactions_14d
  FROM public.contact_interactions
  WHERE contact_id = v_deal.contact_id
    AND created_at > now() - interval '14 days';

  v_activity_score := LEAST(40, v_interactions_14d * 8);

  IF v_deal.expected_close_date IS NOT NULL THEN
    v_days_to_close := (v_deal.expected_close_date - CURRENT_DATE);
    v_recency_score := CASE
      WHEN v_days_to_close < 0 THEN 0
      WHEN v_days_to_close < 7 THEN 30
      WHEN v_days_to_close < 30 THEN 20
      ELSE 10
    END;
  END IF;

  v_prob_score := (v_deal.probability * 0.3);

  v_total := LEAST(100, v_activity_score + v_recency_score + v_prob_score);

  v_factors := jsonb_build_object(
    'activity_score', v_activity_score,
    'recency_score', v_recency_score,
    'probability_score', v_prob_score,
    'interactions_14d', v_interactions_14d,
    'days_to_close', v_days_to_close,
    'computed_at', now()
  );

  UPDATE public.deals
  SET health_score = v_total,
      health_factors = v_factors,
      health_updated_at = now()
  WHERE id = p_deal_id;
END;
$function$

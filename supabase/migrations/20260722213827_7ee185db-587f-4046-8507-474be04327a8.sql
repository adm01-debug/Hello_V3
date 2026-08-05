
CREATE OR REPLACE FUNCTION public.recalc_deal_health(p_deal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.recalc_deal_health(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalc_deal_health(UUID) TO authenticated, service_role;

-- Trigger: nova interação → recalcula health de todos os deals abertos do contato
CREATE OR REPLACE FUNCTION public.trg_recalc_deals_on_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal_id UUID;
BEGIN
  FOR v_deal_id IN
    SELECT id FROM public.deals
    WHERE contact_id = NEW.contact_id AND status = 'open'
  LOOP
    PERFORM public.recalc_deal_health(v_deal_id);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_interactions_recalc_deals ON public.contact_interactions;
CREATE TRIGGER trg_interactions_recalc_deals
  AFTER INSERT ON public.contact_interactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_deals_on_interaction();

-- Snapshot diário
CREATE OR REPLACE FUNCTION public.snapshot_deals_daily()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_total_value BIGINT := 0;
  v_weighted BIGINT := 0;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(value_cents), 0),
         COALESCE(SUM((value_cents * probability / 100)::BIGINT), 0)
    INTO v_count, v_total_value, v_weighted
  FROM public.deals WHERE status = 'open';

  INSERT INTO public.deal_revenue_snapshots (snapshot_date, open_count, total_value_cents, weighted_value_cents)
  VALUES (CURRENT_DATE, v_count, v_total_value, v_weighted)
  ON CONFLICT (snapshot_date) DO UPDATE
    SET open_count = EXCLUDED.open_count,
        total_value_cents = EXCLUDED.total_value_cents,
        weighted_value_cents = EXCLUDED.weighted_value_cents;

  RETURN jsonb_build_object('open_count', v_count, 'total_value_cents', v_total_value, 'weighted_value_cents', v_weighted, 'ran_at', now());
EXCEPTION WHEN undefined_column OR undefined_table THEN
  RETURN jsonb_build_object('skipped', true, 'reason', 'snapshot table missing expected columns');
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_deals_daily() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_deals_daily() TO service_role;

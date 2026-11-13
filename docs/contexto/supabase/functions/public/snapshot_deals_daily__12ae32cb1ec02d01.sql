CREATE OR REPLACE FUNCTION public.snapshot_deals_daily()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

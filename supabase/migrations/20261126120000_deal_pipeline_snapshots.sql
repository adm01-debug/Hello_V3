-- Etapa A-143: retrato diario do pipeline aberto.
--
-- `deal_revenue_snapshots` nasceu com colunas por deal (deal_id, revenue_cents,
-- occurred_at) e `snapshot_deals_daily()` tentava gravar snapshot_date/open_count/
-- total_value_cents/weighted_value_cents na MESMA tabela. Como essas colunas nunca
-- existiram, o INSERT caia no `EXCEPTION WHEN undefined_column` e a funcao retornava
-- `{"skipped": true}` para quem chamasse: o retrato diario do pipeline nunca foi
-- gravado em lugar nenhum e a serie historica era perdida a cada dia.
--
-- Aqui a tabela ganha as colunas que a funcao espera (tabela propria, uma linha por dia),
-- o handler que escondia a falha sai e o job diario passa a rodar de fato.
--
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.deal_pipeline_snapshots (
  snapshot_date DATE PRIMARY KEY,
  open_count INTEGER NOT NULL,
  total_value_cents BIGINT NOT NULL,
  weighted_value_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deal_pipeline_snapshots TO authenticated;
GRANT ALL ON public.deal_pipeline_snapshots TO service_role;

ALTER TABLE public.deal_pipeline_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin/Supervisor veem retratos do pipeline" ON public.deal_pipeline_snapshots;
CREATE POLICY "Admin/Supervisor veem retratos do pipeline"
  ON public.deal_pipeline_snapshots FOR SELECT TO authenticated
  USING (public.is_admin_or_supervisor());

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

  INSERT INTO public.deal_pipeline_snapshots AS s
    (snapshot_date, open_count, total_value_cents, weighted_value_cents)
  VALUES (CURRENT_DATE, v_count, v_total_value, v_weighted)
  ON CONFLICT (snapshot_date) DO UPDATE
    SET open_count = EXCLUDED.open_count,
        total_value_cents = EXCLUDED.total_value_cents,
        weighted_value_cents = EXCLUDED.weighted_value_cents,
        updated_at = now();

  RETURN jsonb_build_object(
    'snapshot_date', CURRENT_DATE,
    'open_count', v_count,
    'total_value_cents', v_total_value,
    'weighted_value_cents', v_weighted,
    'ran_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_deals_daily() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_deals_daily() TO service_role;

SELECT cron.unschedule('deal-pipeline-snapshot-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'deal-pipeline-snapshot-daily');

-- 03:05 UTC (00:05 em Sao Paulo): depois da virada do dia, antes do expediente.
SELECT cron.schedule(
  'deal-pipeline-snapshot-daily',
  '5 3 * * *',
  $job$ SELECT public.snapshot_deals_daily(); $job$
);

-- Primeiro ponto da serie imediatamente, para o grafico nao nascer vazio.
SELECT public.snapshot_deals_daily();
-- ================ ETAPA 2: Financial Impact ================
ALTER TABLE public.voip_trunks
  ADD COLUMN IF NOT EXISTS cost_per_minute_cents INTEGER NOT NULL DEFAULT 15;

CREATE TABLE IF NOT EXISTS public.deal_revenue_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  revenue_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_revenue_snapshots TO authenticated;
GRANT ALL ON public.deal_revenue_snapshots TO service_role;
ALTER TABLE public.deal_revenue_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin/Supervisor manage revenue snapshots" ON public.deal_revenue_snapshots;
CREATE POLICY "Admin/Supervisor manage revenue snapshots"
  ON public.deal_revenue_snapshots FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());
CREATE INDEX IF NOT EXISTS idx_deal_revenue_occurred ON public.deal_revenue_snapshots(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_revenue_deal ON public.deal_revenue_snapshots(deal_id);

-- ================ ETAPA 4: Shift Swap Suggestions ================
CREATE TABLE IF NOT EXISTS public.shift_swap_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  from_shift_id UUID REFERENCES public.agent_shifts(id) ON DELETE SET NULL,
  to_shift_id UUID REFERENCES public.agent_shifts(id) ON DELETE SET NULL,
  score NUMERIC(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_swap_suggestions TO authenticated;
GRANT ALL ON public.shift_swap_suggestions TO service_role;
ALTER TABLE public.shift_swap_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin/Supervisor manage shift swaps" ON public.shift_swap_suggestions;
CREATE POLICY "Admin/Supervisor manage shift swaps"
  ON public.shift_swap_suggestions FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());
CREATE INDEX IF NOT EXISTS idx_shift_swap_status ON public.shift_swap_suggestions(status, created_at DESC);

DROP TRIGGER IF EXISTS shift_swap_updated_at ON public.shift_swap_suggestions;
CREATE TRIGGER shift_swap_updated_at BEFORE UPDATE ON public.shift_swap_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================ ETAPA 5: Virtual Fax OCR ================
ALTER TABLE public.virtual_fax
  ADD COLUMN IF NOT EXISTS ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS ocr_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ocr_search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_virtual_fax_ocr_search ON public.virtual_fax USING gin(ocr_search_vector);

CREATE OR REPLACE FUNCTION public.update_virtual_fax_ocr_vector()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.ocr_search_vector := to_tsvector('portuguese', COALESCE(NEW.ocr_text, '') || ' ' || COALESCE(NEW.subject, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS virtual_fax_ocr_vector_trg ON public.virtual_fax;
CREATE TRIGGER virtual_fax_ocr_vector_trg BEFORE INSERT OR UPDATE OF ocr_text, subject
  ON public.virtual_fax FOR EACH ROW EXECUTE FUNCTION public.update_virtual_fax_ocr_vector();

-- ================ ETAPA 6: Data Lake Export ================
CREATE TABLE IF NOT EXISTS public.data_lake_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL,
  dataset TEXT NOT NULL CHECK (dataset IN ('call_sessions','deals','contacts','audit_logs')),
  format TEXT NOT NULL CHECK (format IN ('csv','ndjson','parquet')),
  since_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  file_path TEXT,
  row_count INTEGER,
  size_bytes BIGINT,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_lake_exports TO authenticated;
GRANT ALL ON public.data_lake_exports TO service_role;
ALTER TABLE public.data_lake_exports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage data exports" ON public.data_lake_exports;
CREATE POLICY "Admins manage data exports"
  ON public.data_lake_exports FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON public.data_lake_exports(status, created_at DESC);

-- ================ Financial Impact View ================
CREATE OR REPLACE VIEW public.financial_impact_daily AS
WITH calls_daily AS (
  SELECT
    date_trunc('day', started_at)::date AS day,
    COUNT(*) AS total_calls,
    COALESCE(SUM(duration_seconds), 0) AS total_seconds,
    COALESCE(SUM(duration_seconds * 15 / 60), 0) AS estimated_cost_cents
  FROM public.call_sessions
  WHERE started_at > now() - interval '90 days'
  GROUP BY 1
),
revenue_daily AS (
  SELECT
    date_trunc('day', updated_at)::date AS day,
    COALESCE(SUM(value_cents), 0) AS revenue_cents,
    COUNT(*) AS deals_won
  FROM public.deals
  WHERE status = 'won' AND updated_at > now() - interval '90 days'
  GROUP BY 1
)
SELECT
  COALESCE(c.day, r.day) AS day,
  COALESCE(c.total_calls, 0) AS total_calls,
  COALESCE(c.total_seconds, 0) AS total_seconds,
  COALESCE(c.estimated_cost_cents, 0) AS estimated_cost_cents,
  COALESCE(r.revenue_cents, 0) AS revenue_cents,
  COALESCE(r.deals_won, 0) AS deals_won,
  COALESCE(r.revenue_cents, 0) - COALESCE(c.estimated_cost_cents, 0) AS profit_cents
FROM calls_daily c
FULL OUTER JOIN revenue_daily r ON c.day = r.day
ORDER BY 1 DESC;

GRANT SELECT ON public.financial_impact_daily TO authenticated;
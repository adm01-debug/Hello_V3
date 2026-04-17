CREATE INDEX IF NOT EXISTS idx_call_quality_metrics_created_mos
  ON public.call_quality_metrics (created_at DESC, mos_avg);
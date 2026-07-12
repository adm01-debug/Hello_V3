ALTER TABLE public.webhook_flush_metrics
  ADD COLUMN IF NOT EXISTS endpoint_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_webhook_flush_metrics_endpoint_hash_created_at
  ON public.webhook_flush_metrics (endpoint_hash, created_at DESC)
  WHERE endpoint_hash IS NOT NULL;

COMMENT ON COLUMN public.webhook_flush_metrics.endpoint_hash IS
  'SHA-256 (12 primeiros hex) da URL do webhook, para drill-down sem expor a URL bruta.';

CREATE TABLE public.webhook_flush_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pending_before INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  remaining INT NOT NULL DEFAULT 0,
  oldest_age_ms BIGINT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.webhook_flush_metrics TO authenticated;
GRANT ALL ON public.webhook_flush_metrics TO service_role;

ALTER TABLE public.webhook_flush_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_supervisors_read_flush_metrics"
  ON public.webhook_flush_metrics
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_supervisor());

CREATE POLICY "authenticated_insert_own_flush_metrics"
  ON public.webhook_flush_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_webhook_flush_metrics_created_at
  ON public.webhook_flush_metrics (created_at DESC);

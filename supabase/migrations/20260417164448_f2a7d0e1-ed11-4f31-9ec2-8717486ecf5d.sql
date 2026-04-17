-- Tabela de métricas de qualidade VoIP por chamada
CREATE TABLE public.call_quality_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  agent_name TEXT,
  channel TEXT NOT NULL DEFAULT 'webrtc',
  mos_avg NUMERIC(3,2),
  mos_min NUMERIC(3,2),
  jitter_avg_ms NUMERIC(6,2),
  jitter_max_ms NUMERIC(6,2),
  packet_loss_pct NUMERIC(5,2),
  rtt_avg_ms NUMERIC(6,2),
  rtt_max_ms NUMERIC(6,2),
  samples_count INTEGER NOT NULL DEFAULT 0,
  quality_label TEXT,
  raw_samples JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cqm_call_session ON public.call_quality_metrics(call_session_id);
CREATE INDEX idx_cqm_agent ON public.call_quality_metrics(agent_name);
CREATE INDEX idx_cqm_created ON public.call_quality_metrics(created_at DESC);

ALTER TABLE public.call_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Agente pode ver apenas suas próprias métricas; admin/supervisor veem todas
CREATE POLICY "agents_view_own_quality_metrics"
  ON public.call_quality_metrics FOR SELECT
  USING (
    public.is_admin_or_supervisor()
    OR public.get_user_agent_name() = agent_name
  );

CREATE POLICY "agents_insert_own_quality_metrics"
  ON public.call_quality_metrics FOR INSERT
  WITH CHECK (
    public.is_admin_or_supervisor()
    OR public.get_user_agent_name() = agent_name
    OR agent_name IS NULL
  );

CREATE POLICY "agents_update_own_quality_metrics"
  ON public.call_quality_metrics FOR UPDATE
  USING (
    public.is_admin_or_supervisor()
    OR public.get_user_agent_name() = agent_name
  );

CREATE POLICY "admins_delete_quality_metrics"
  ON public.call_quality_metrics FOR DELETE
  USING (public.is_admin_or_supervisor());

CREATE TRIGGER update_call_quality_metrics_updated_at
  BEFORE UPDATE ON public.call_quality_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
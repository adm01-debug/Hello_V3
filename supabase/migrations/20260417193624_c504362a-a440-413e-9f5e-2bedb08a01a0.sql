-- Tabela de alertas persistentes de qualidade VoIP
CREATE TABLE public.voip_quality_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('degrading', 'poor', 'offline')),
  mos_at_alert NUMERIC(3,2),
  slope NUMERIC(6,3),
  jitter_ms NUMERIC(8,2),
  rtt_ms NUMERIC(8,2),
  remediation_action TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_voip_quality_alerts_created_user
  ON public.voip_quality_alerts (created_at DESC, user_id);

CREATE INDEX idx_voip_quality_alerts_unack
  ON public.voip_quality_alerts (user_id, acknowledged_at)
  WHERE acknowledged_at IS NULL;

ALTER TABLE public.voip_quality_alerts ENABLE ROW LEVEL SECURITY;

-- Agente vê apenas próprios alertas
CREATE POLICY "Users view own voip alerts"
  ON public.voip_quality_alerts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_supervisor());

-- Usuário insere próprios alertas
CREATE POLICY "Users insert own voip alerts"
  ON public.voip_quality_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuário marca próprios como reconhecidos
CREATE POLICY "Users update own voip alerts"
  ON public.voip_quality_alerts FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin_or_supervisor());

-- Admin/supervisor podem deletar
CREATE POLICY "Admins delete voip alerts"
  ON public.voip_quality_alerts FOR DELETE
  USING (public.is_admin_or_supervisor());
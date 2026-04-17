-- ============== VOICE_PRINTS ==============
CREATE TABLE public.voice_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'primary',
  embedding JSONB NOT NULL,
  feature_summary JSONB,
  sample_count INTEGER NOT NULL DEFAULT 1,
  confidence_baseline NUMERIC(5,4) NOT NULL DEFAULT 0.85,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_prints_user ON public.voice_prints(user_id) WHERE is_active = true;

ALTER TABLE public.voice_prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own voice prints"
  ON public.voice_prints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all voice prints"
  ON public.voice_prints FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE TRIGGER update_voice_prints_updated_at
  BEFORE UPDATE ON public.voice_prints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== FRAUD_SIGNALS ==============
CREATE TABLE public.fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  agent_name TEXT,
  signal_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'low',
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fraud_signals_session ON public.fraud_signals(call_session_id);
CREATE INDEX idx_fraud_signals_severity ON public.fraud_signals(severity, created_at DESC);
CREATE INDEX idx_fraud_signals_status ON public.fraud_signals(status) WHERE status = 'open';

ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and supervisors view all fraud signals"
  ON public.fraud_signals FOR SELECT
  USING (is_admin_or_supervisor());

CREATE POLICY "Agents view fraud signals on own calls"
  ON public.fraud_signals FOR SELECT
  USING (agent_name = get_user_agent_name());

CREATE POLICY "Admins manage fraud signals"
  ON public.fraud_signals FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE TRIGGER update_fraud_signals_updated_at
  BEFORE UPDATE ON public.fraud_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== REDACTION_LOG ==============
CREATE TABLE public.redaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  recording_path TEXT,
  redacted_path TEXT,
  pattern_type TEXT NOT NULL,
  match_count INTEGER NOT NULL DEFAULT 0,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redaction_log_session ON public.redaction_log(call_session_id);
CREATE INDEX idx_redaction_log_created ON public.redaction_log(created_at DESC);

ALTER TABLE public.redaction_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view redaction log"
  ON public.redaction_log FOR SELECT
  USING (is_admin_user(auth.uid()));
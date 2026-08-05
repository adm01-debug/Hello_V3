-- Tabela de métricas de uso por trunk VoIP
CREATE TABLE public.voip_trunk_usage_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trunk_id UUID NOT NULL REFERENCES public.voip_trunks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  was_failover BOOLEAN NOT NULL DEFAULT false,
  failover_reason TEXT,
  original_trunk_id UUID REFERENCES public.voip_trunks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_trunk_usage_trunk_started ON public.voip_trunk_usage_metrics (trunk_id, started_at DESC);
CREATE INDEX idx_trunk_usage_agent_started ON public.voip_trunk_usage_metrics (agent_id, started_at DESC);
CREATE INDEX idx_trunk_usage_failover ON public.voip_trunk_usage_metrics (was_failover, started_at DESC) WHERE was_failover = true;

ALTER TABLE public.voip_trunk_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Admins e supervisores podem ver tudo
CREATE POLICY "Admins/supervisors can view all usage metrics"
ON public.voip_trunk_usage_metrics
FOR SELECT
TO authenticated
USING (public.is_admin_or_supervisor());

-- Agentes podem ver suas próprias métricas
CREATE POLICY "Agents can view their own usage metrics"
ON public.voip_trunk_usage_metrics
FOR SELECT
TO authenticated
USING (agent_id = public.get_user_agent_id());

-- INSERT via função SECURITY DEFINER (não permitir INSERT direto)
CREATE POLICY "No direct insert on usage metrics"
ON public.voip_trunk_usage_metrics
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Função para registrar uso (chamada pelo frontend após chamada)
CREATE OR REPLACE FUNCTION public.record_trunk_usage(
  p_trunk_id UUID,
  p_call_session_id UUID,
  p_started_at TIMESTAMP WITH TIME ZONE,
  p_ended_at TIMESTAMP WITH TIME ZONE,
  p_was_failover BOOLEAN DEFAULT false,
  p_failover_reason TEXT DEFAULT NULL,
  p_original_trunk_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
  v_id UUID;
  v_duration INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_agent_id := public.get_user_agent_id();
  v_duration := GREATEST(0, EXTRACT(EPOCH FROM (p_ended_at - p_started_at))::INTEGER);

  INSERT INTO public.voip_trunk_usage_metrics (
    trunk_id, agent_id, call_session_id, started_at, ended_at,
    duration_seconds, was_failover, failover_reason, original_trunk_id
  ) VALUES (
    p_trunk_id, v_agent_id, p_call_session_id, p_started_at, p_ended_at,
    v_duration, p_was_failover, p_failover_reason, p_original_trunk_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
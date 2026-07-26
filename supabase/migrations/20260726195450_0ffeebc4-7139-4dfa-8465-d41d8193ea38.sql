-- =====================================================================
-- Onda 3CX #1 — Entidade de fila de atendimento (call_queues)
-- Fundação para: música em espera, anúncios de posição e grupos de toque
-- =====================================================================

-- 1) TABELA PRINCIPAL --------------------------------------------------
CREATE TABLE public.call_queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Distribuição
  strategy TEXT NOT NULL DEFAULT 'ringall'
    CHECK (strategy IN ('ringall','roundrobin','leastrecent','fewestcalls','skillbased')),
  ring_timeout_seconds INTEGER NOT NULL DEFAULT 20
    CHECK (ring_timeout_seconds BETWEEN 5 AND 300),
  wrap_up_seconds INTEGER NOT NULL DEFAULT 0
    CHECK (wrap_up_seconds BETWEEN 0 AND 600),

  -- Capacidade
  max_wait_seconds INTEGER NOT NULL DEFAULT 300
    CHECK (max_wait_seconds BETWEEN 10 AND 7200),
  max_queue_size INTEGER NOT NULL DEFAULT 50
    CHECK (max_queue_size BETWEEN 1 AND 1000),
  priority INTEGER NOT NULL DEFAULT 0
    CHECK (priority BETWEEN 0 AND 100),

  -- Transbordo
  overflow_action TEXT NOT NULL DEFAULT 'voicemail'
    CHECK (overflow_action IN ('voicemail','transfer_queue','callback','hangup')),
  overflow_queue_id UUID REFERENCES public.call_queues(id) ON DELETE SET NULL,

  -- Anúncios (executados pela camada de mídia / IVR)
  announce_position BOOLEAN NOT NULL DEFAULT false,
  announce_hold_time BOOLEAN NOT NULL DEFAULT false,
  announce_interval_seconds INTEGER NOT NULL DEFAULT 30
    CHECK (announce_interval_seconds BETWEEN 10 AND 600),

  -- Música em espera
  moh_enabled BOOLEAN NOT NULL DEFAULT true,
  moh_url TEXT,

  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT call_queues_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT call_queues_name_unique UNIQUE (name),
  CONSTRAINT call_queues_overflow_not_self CHECK (overflow_queue_id IS DISTINCT FROM id),
  CONSTRAINT call_queues_moh_url_len CHECK (moh_url IS NULL OR length(moh_url) <= 2048)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_queues TO authenticated;
GRANT ALL ON public.call_queues TO service_role;

ALTER TABLE public.call_queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_queues_select_authenticated"
  ON public.call_queues FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "call_queues_manage_admin_supervisor"
  ON public.call_queues FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

-- 2) MEMBROS DA FILA ---------------------------------------------------
CREATE TABLE public.call_queue_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.call_queues(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  penalty INTEGER NOT NULL DEFAULT 0 CHECK (penalty BETWEEN 0 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT call_queue_members_unique UNIQUE (queue_id, agent_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_queue_members TO authenticated;
GRANT ALL ON public.call_queue_members TO service_role;

ALTER TABLE public.call_queue_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_queue_members_select_authenticated"
  ON public.call_queue_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "call_queue_members_manage_admin_supervisor"
  ON public.call_queue_members FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

-- 3) ÍNDICES -----------------------------------------------------------
CREATE INDEX idx_call_queues_active_priority
  ON public.call_queues (is_active, priority DESC);
CREATE INDEX idx_call_queues_overflow
  ON public.call_queues (overflow_queue_id)
  WHERE overflow_queue_id IS NOT NULL;
CREATE INDEX idx_call_queue_members_queue
  ON public.call_queue_members (queue_id, is_active, penalty);
CREATE INDEX idx_call_queue_members_agent
  ON public.call_queue_members (agent_id);

-- 4) TRIGGERS updated_at ----------------------------------------------
CREATE TRIGGER trg_call_queues_updated_at
  BEFORE UPDATE ON public.call_queues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_call_queue_members_updated_at
  BEFORE UPDATE ON public.call_queue_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) VALIDAÇÃO DE INTEGRIDADE (trigger, não CHECK: depende de outra linha)
CREATE OR REPLACE FUNCTION public.validate_call_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Transbordo para fila precisa de alvo válido e diferente de si
  IF NEW.overflow_action = 'transfer_queue' THEN
    IF NEW.overflow_queue_id IS NULL THEN
      RAISE EXCEPTION 'overflow_queue_id é obrigatório quando overflow_action = transfer_queue';
    END IF;
    IF NEW.overflow_queue_id = NEW.id THEN
      RAISE EXCEPTION 'A fila de transbordo não pode ser a própria fila';
    END IF;
  END IF;

  -- MoH habilitado exige URL
  IF NEW.moh_enabled AND NEW.moh_url IS NOT NULL AND length(btrim(NEW.moh_url)) = 0 THEN
    NEW.moh_url := NULL;
  END IF;

  -- Normaliza nome
  NEW.name := btrim(NEW.name);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_call_queue
  BEFORE INSERT OR UPDATE ON public.call_queues
  FOR EACH ROW EXECUTE FUNCTION public.validate_call_queue();

-- 6) RPC: resumo operacional das filas ---------------------------------
CREATE OR REPLACE FUNCTION public.get_call_queues_overview()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_agg(q ORDER BY q.priority DESC, q.name), '[]'::jsonb)
  FROM (
    SELECT
      cq.id,
      cq.name,
      cq.is_active,
      cq.strategy,
      cq.priority,
      cq.max_wait_seconds,
      cq.max_queue_size,
      cq.moh_enabled,
      cq.announce_position,
      COUNT(m.id) FILTER (WHERE m.is_active) AS active_members,
      COUNT(m.id) AS total_members
    FROM public.call_queues cq
    LEFT JOIN public.call_queue_members m ON m.queue_id = cq.id
    GROUP BY cq.id
  ) q;
$$;

GRANT EXECUTE ON FUNCTION public.get_call_queues_overview() TO authenticated;
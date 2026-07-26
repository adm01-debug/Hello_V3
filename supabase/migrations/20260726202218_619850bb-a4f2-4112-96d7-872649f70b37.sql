-- ============ Órbitas de estacionamento ============
CREATE TABLE public.call_park_orbits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slot_start INTEGER NOT NULL DEFAULT 701,
  slot_end INTEGER NOT NULL DEFAULT 710,
  park_timeout_seconds INTEGER NOT NULL DEFAULT 180,
  timeout_action TEXT NOT NULL DEFAULT 'return_parker',
  timeout_target TEXT,
  moh_prompt_id UUID REFERENCES public.queue_audio_prompts(id) ON DELETE SET NULL,
  announce_slot BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT call_park_orbits_name_len CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  CONSTRAINT call_park_orbits_slot_range CHECK (slot_start >= 1 AND slot_end >= slot_start AND slot_end - slot_start <= 99),
  CONSTRAINT call_park_orbits_timeout CHECK (park_timeout_seconds BETWEEN 30 AND 3600),
  CONSTRAINT call_park_orbits_action CHECK (timeout_action IN ('return_parker','ring_group','queue','extension','voicemail','hangup')),
  CONSTRAINT call_park_orbits_name_unique UNIQUE (name)
);

-- ============ Chamadas estacionadas ============
CREATE TABLE public.parked_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orbit_id UUID NOT NULL REFERENCES public.call_park_orbits(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  contact_phone TEXT,
  contact_name TEXT,
  parked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parked_by_name TEXT,
  retrieved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  retrieved_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'parked',
  parked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  retrieved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT parked_calls_slot_positive CHECK (slot_number >= 1),
  CONSTRAINT parked_calls_status CHECK (status IN ('parked','retrieved','expired','abandoned')),
  CONSTRAINT parked_calls_retrieved_consistency CHECK (
    (status = 'parked' AND retrieved_at IS NULL) OR (status <> 'parked')
  )
);

-- Uma única chamada ativa por vaga (índice parcial = trava de corrida no banco)
CREATE UNIQUE INDEX parked_calls_active_slot_uniq
  ON public.parked_calls (orbit_id, slot_number)
  WHERE status = 'parked';

CREATE INDEX idx_parked_calls_status ON public.parked_calls (status, expires_at);
CREATE INDEX idx_parked_calls_orbit ON public.parked_calls (orbit_id);
CREATE INDEX idx_parked_calls_session ON public.parked_calls (call_session_id);
CREATE INDEX idx_parked_calls_parked_by ON public.parked_calls (parked_by);
CREATE INDEX idx_call_park_orbits_active ON public.call_park_orbits (is_active);

-- ============ GRANTs ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_park_orbits TO authenticated;
GRANT ALL ON public.call_park_orbits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parked_calls TO authenticated;
GRANT ALL ON public.parked_calls TO service_role;

-- ============ RLS ============
ALTER TABLE public.call_park_orbits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parked_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "park_orbits_select_auth" ON public.call_park_orbits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "park_orbits_insert_admin" ON public.call_park_orbits
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_supervisor());
CREATE POLICY "park_orbits_update_admin" ON public.call_park_orbits
  FOR UPDATE TO authenticated USING (public.is_admin_or_supervisor()) WITH CHECK (public.is_admin_or_supervisor());
CREATE POLICY "park_orbits_delete_admin" ON public.call_park_orbits
  FOR DELETE TO authenticated USING (public.is_admin_or_supervisor());

CREATE POLICY "parked_calls_select_auth" ON public.parked_calls
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "parked_calls_insert_auth" ON public.parked_calls
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "parked_calls_update_auth" ON public.parked_calls
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "parked_calls_delete_admin" ON public.parked_calls
  FOR DELETE TO authenticated USING (public.is_admin_or_supervisor());

-- ============ Triggers de validação ============
CREATE OR REPLACE FUNCTION public.validate_park_orbit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.name := btrim(NEW.name);

  -- destino obrigatório apenas em encaminhamentos
  IF NEW.timeout_action IN ('ring_group','queue','extension') THEN
    IF NEW.timeout_target IS NULL OR btrim(NEW.timeout_target) = '' THEN
      RAISE EXCEPTION 'Destino obrigatório para a ação de tempo esgotado "%"', NEW.timeout_action;
    END IF;
    NEW.timeout_target := btrim(NEW.timeout_target);
  ELSE
    NEW.timeout_target := NULL;
  END IF;

  -- faixas de órbitas ativas não podem se sobrepor
  IF NEW.is_active THEN
    IF EXISTS (
      SELECT 1 FROM public.call_park_orbits o
      WHERE o.id <> NEW.id
        AND o.is_active
        AND NEW.slot_start <= o.slot_end
        AND NEW.slot_end >= o.slot_start
    ) THEN
      RAISE EXCEPTION 'A faixa de vagas %-% se sobrepõe a outra órbita ativa', NEW.slot_start, NEW.slot_end;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_park_orbit
  BEFORE INSERT OR UPDATE ON public.call_park_orbits
  FOR EACH ROW EXECUTE FUNCTION public.validate_park_orbit();

CREATE OR REPLACE FUNCTION public.validate_parked_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start INTEGER;
  v_end INTEGER;
  v_active BOOLEAN;
BEGIN
  SELECT slot_start, slot_end, is_active INTO v_start, v_end, v_active
  FROM public.call_park_orbits WHERE id = NEW.orbit_id;

  IF v_start IS NULL THEN
    RAISE EXCEPTION 'Órbita de estacionamento inexistente';
  END IF;

  IF TG_OP = 'INSERT' AND NOT v_active THEN
    RAISE EXCEPTION 'Não é possível estacionar em uma órbita desativada';
  END IF;

  IF NEW.slot_number < v_start OR NEW.slot_number > v_end THEN
    RAISE EXCEPTION 'Vaga % fora da faixa da órbita (%-%)', NEW.slot_number, v_start, v_end;
  END IF;

  IF NEW.status <> 'parked' AND NEW.retrieved_at IS NULL THEN
    NEW.retrieved_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_parked_call
  BEFORE INSERT OR UPDATE ON public.parked_calls
  FOR EACH ROW EXECUTE FUNCTION public.validate_parked_call();

-- ============ Expiração automática ============
CREATE OR REPLACE FUNCTION public.expire_parked_calls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.parked_calls
     SET status = 'expired', retrieved_at = now()
   WHERE status = 'parked' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_parked_calls() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_parked_calls() TO authenticated, service_role;

-- Órbita padrão
INSERT INTO public.call_park_orbits (name, description, slot_start, slot_end)
VALUES ('Estacionamento padrão', 'Vagas 701 a 710 para transferência assistida entre agentes', 701, 710);
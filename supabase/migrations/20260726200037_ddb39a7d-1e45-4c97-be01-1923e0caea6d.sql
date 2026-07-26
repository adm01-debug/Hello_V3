CREATE TABLE public.ring_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  extension TEXT CHECK (extension IS NULL OR extension ~ '^[0-9*#+]{1,20}$'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  strategy TEXT NOT NULL DEFAULT 'ringall'
    CHECK (strategy IN ('ringall','sequential','roundrobin','random')),
  ring_timeout_seconds INTEGER NOT NULL DEFAULT 25 CHECK (ring_timeout_seconds BETWEEN 5 AND 300),
  step_timeout_seconds INTEGER NOT NULL DEFAULT 15 CHECK (step_timeout_seconds BETWEEN 5 AND 120),
  no_answer_action TEXT NOT NULL DEFAULT 'voicemail'
    CHECK (no_answer_action IN ('voicemail','forward_extension','forward_queue','hangup')),
  forward_target TEXT CHECK (forward_target IS NULL OR char_length(forward_target) <= 120),
  skip_busy_agents BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ring_groups_extension_key
  ON public.ring_groups (extension) WHERE extension IS NOT NULL;
CREATE INDEX idx_ring_groups_active ON public.ring_groups (is_active);
CREATE INDEX idx_ring_groups_name ON public.ring_groups (lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ring_groups TO authenticated;
GRANT ALL ON public.ring_groups TO service_role;

ALTER TABLE public.ring_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ring_groups_select_authenticated" ON public.ring_groups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ring_groups_write_staff" ON public.ring_groups
  FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

CREATE TABLE public.ring_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.ring_groups(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  ring_order INTEGER NOT NULL DEFAULT 0 CHECK (ring_order BETWEEN 0 AND 999),
  delay_seconds INTEGER NOT NULL DEFAULT 0 CHECK (delay_seconds BETWEEN 0 AND 300),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, agent_id)
);

CREATE INDEX idx_ring_group_members_group ON public.ring_group_members (group_id, ring_order);
CREATE INDEX idx_ring_group_members_agent ON public.ring_group_members (agent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ring_group_members TO authenticated;
GRANT ALL ON public.ring_group_members TO service_role;

ALTER TABLE public.ring_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ring_group_members_select_authenticated" ON public.ring_group_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ring_group_members_write_staff" ON public.ring_group_members
  FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

CREATE OR REPLACE FUNCTION public.validate_ring_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.no_answer_action IN ('forward_extension','forward_queue') THEN
    IF NEW.forward_target IS NULL OR btrim(NEW.forward_target) = '' THEN
      RAISE EXCEPTION 'forward_target_required';
    END IF;
    IF NEW.no_answer_action = 'forward_queue'
       AND NOT EXISTS (SELECT 1 FROM public.call_queues q WHERE q.id::text = NEW.forward_target) THEN
      RAISE EXCEPTION 'forward_queue_not_found';
    END IF;
    IF NEW.no_answer_action = 'forward_extension'
       AND NEW.extension IS NOT NULL
       AND NEW.forward_target = NEW.extension THEN
      RAISE EXCEPTION 'forward_target_self_reference';
    END IF;
  ELSE
    NEW.forward_target := NULL;
  END IF;
  NEW.name := btrim(NEW.name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ring_group
  BEFORE INSERT OR UPDATE ON public.ring_groups
  FOR EACH ROW EXECUTE FUNCTION public.validate_ring_group();

CREATE TRIGGER trg_ring_groups_updated_at
  BEFORE UPDATE ON public.ring_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ring_group_members_updated_at
  BEFORE UPDATE ON public.ring_group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Enum de provedores VoIP
DO $$ BEGIN
  CREATE TYPE public.voip_provider AS ENUM ('nvoip', 'directcall', 'totalvoice', 'generic', 'wavoip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela voip_trunks
CREATE TABLE IF NOT EXISTS public.voip_trunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider public.voip_provider NOT NULL DEFAULT 'generic',
  sip_server TEXT NOT NULL,
  sip_username TEXT NOT NULL,
  sip_password_encrypted TEXT NOT NULL,
  sip_realm TEXT,
  transport TEXT NOT NULL DEFAULT 'wss' CHECK (transport IN ('wss', 'tcp', 'udp')),
  max_channels INTEGER NOT NULL DEFAULT 10 CHECK (max_channels > 0 AND max_channels <= 1000),
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voip_trunks_active ON public.voip_trunks(is_active, priority);
CREATE INDEX IF NOT EXISTS idx_voip_trunks_provider ON public.voip_trunks(provider);

ALTER TABLE public.voip_trunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voip_trunks_admin_select" ON public.voip_trunks FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
CREATE POLICY "voip_trunks_admin_insert" ON public.voip_trunks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "voip_trunks_admin_update" ON public.voip_trunks FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "voip_trunks_admin_delete" ON public.voip_trunks FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE TRIGGER trg_voip_trunks_updated_at BEFORE UPDATE ON public.voip_trunks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_voip_trunks_optimistic_lock BEFORE UPDATE ON public.voip_trunks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_optimistic_lock();

-- Tabela agent_trunk_assignments
CREATE TABLE IF NOT EXISTS public.agent_trunk_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  trunk_id UUID NOT NULL REFERENCES public.voip_trunks(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, trunk_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_agent ON public.agent_trunk_assignments(agent_id, is_primary DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_trunk ON public.agent_trunk_assignments(trunk_id);

ALTER TABLE public.agent_trunk_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_admin_all" ON public.agent_trunk_assignments FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "assignments_agent_select_own" ON public.agent_trunk_assignments FOR SELECT TO authenticated
  USING (agent_id = public.get_user_agent_id());

CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON public.agent_trunk_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_assignments_optimistic_lock BEFORE UPDATE ON public.agent_trunk_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_optimistic_lock();
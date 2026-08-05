
-- ============= DEALS =============
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  owner_agent_name TEXT,
  value_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  stage TEXT NOT NULL DEFAULT 'prospecting',
  probability NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  health_score NUMERIC(5,2),
  health_factors JSONB,
  health_updated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  external_id TEXT,
  source TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_owner ON public.deals(owner_agent_name);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_contact ON public.deals(contact_id);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/supervisors manage all deals" ON public.deals
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Agents view own deals" ON public.deals
  FOR SELECT USING (owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor());

CREATE POLICY "Agents update own deals" ON public.deals
  FOR UPDATE USING (owner_agent_name = get_user_agent_name())
  WITH CHECK (owner_agent_name = get_user_agent_name());

CREATE POLICY "Authenticated create deals" ON public.deals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vincular chamadas a deals
ALTER TABLE public.call_sessions ADD COLUMN deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL;
CREATE INDEX idx_call_sessions_deal ON public.call_sessions(deal_id);

-- ============= SCORECARDS =============
CREATE TABLE public.scorecard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.scorecard_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.scorecard_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1,
  max_score INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.call_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.scorecard_templates(id) ON DELETE RESTRICT,
  agent_name TEXT,
  reviewer_id UUID,
  reviewer_email TEXT,
  total_score NUMERIC(6,2),
  max_total NUMERIC(6,2),
  status TEXT NOT NULL DEFAULT 'draft',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.scorecard_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id UUID NOT NULL REFERENCES public.call_scorecards(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.scorecard_criteria(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scorecards_call ON public.call_scorecards(call_session_id);
CREATE INDEX idx_scorecards_agent ON public.call_scorecards(agent_name);
CREATE INDEX idx_scorecard_responses_card ON public.scorecard_responses(scorecard_id);

ALTER TABLE public.scorecard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecard_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecard_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated read templates" ON public.scorecard_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage templates" ON public.scorecard_templates
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "All authenticated read criteria" ON public.scorecard_criteria
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage criteria" ON public.scorecard_criteria
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Agents view own scorecards" ON public.call_scorecards
  FOR SELECT USING (agent_name = get_user_agent_name() OR is_admin_or_supervisor());
CREATE POLICY "Supervisors manage scorecards" ON public.call_scorecards
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "View responses for accessible scorecards" ON public.scorecard_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.call_scorecards cs
            WHERE cs.id = scorecard_id
              AND (cs.agent_name = get_user_agent_name() OR is_admin_or_supervisor()))
  );
CREATE POLICY "Supervisors manage responses" ON public.scorecard_responses
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER trg_scorecard_templates_updated BEFORE UPDATE ON public.scorecard_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_scorecards_updated BEFORE UPDATE ON public.call_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CADENCES =============
CREATE TABLE public.cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cadence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  subject TEXT,
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cadence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  agent_name TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cadence_steps_cadence ON public.cadence_steps(cadence_id, step_order);
CREATE INDEX idx_enrollments_cadence ON public.cadence_enrollments(cadence_id);
CREATE INDEX idx_enrollments_agent ON public.cadence_enrollments(agent_name);
CREATE INDEX idx_enrollments_next_action ON public.cadence_enrollments(next_action_at) WHERE status = 'active';

ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated read cadences" ON public.cadences
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Supervisors manage cadences" ON public.cadences
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "All authenticated read cadence steps" ON public.cadence_steps
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Supervisors manage cadence steps" ON public.cadence_steps
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Agents view own enrollments" ON public.cadence_enrollments
  FOR SELECT USING (agent_name = get_user_agent_name() OR is_admin_or_supervisor());
CREATE POLICY "Agents update own enrollments" ON public.cadence_enrollments
  FOR UPDATE USING (agent_name = get_user_agent_name() OR is_admin_or_supervisor())
  WITH CHECK (agent_name = get_user_agent_name() OR is_admin_or_supervisor());
CREATE POLICY "Supervisors manage enrollments" ON public.cadence_enrollments
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());
CREATE POLICY "Authenticated insert enrollments" ON public.cadence_enrollments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_cadences_updated BEFORE UPDATE ON public.cadences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON public.cadence_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= TRACKERS =============
CREATE TABLE public.trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  match_type TEXT NOT NULL DEFAULT 'any',
  is_active BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT 'primary',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tracker_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID NOT NULL REFERENCES public.trackers(id) ON DELETE CASCADE,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  agent_name TEXT,
  matched_keyword TEXT,
  quote TEXT,
  timestamp_seconds NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracker_matches_tracker ON public.tracker_matches(tracker_id);
CREATE INDEX idx_tracker_matches_call ON public.tracker_matches(call_session_id);
CREATE INDEX idx_tracker_matches_agent ON public.tracker_matches(agent_name);

ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated read trackers" ON public.trackers
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Supervisors manage trackers" ON public.trackers
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Agents view own matches" ON public.tracker_matches
  FOR SELECT USING (agent_name = get_user_agent_name() OR is_admin_or_supervisor());
CREATE POLICY "System inserts matches" ON public.tracker_matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Supervisors manage matches" ON public.tracker_matches
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER trg_trackers_updated BEFORE UPDATE ON public.trackers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= PLAYLISTS =============
CREATE TABLE public.call_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  playlist_type TEXT NOT NULL DEFAULT 'manual',
  auto_query JSONB,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  shared_with TEXT[] DEFAULT '{}',
  created_by UUID,
  owner_agent_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.call_playlists(id) ON DELETE CASCADE,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  added_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, call_session_id)
);

CREATE INDEX idx_playlist_items_playlist ON public.playlist_items(playlist_id, display_order);
CREATE INDEX idx_playlists_owner ON public.call_playlists(owner_agent_name);

ALTER TABLE public.call_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or shared playlists" ON public.call_playlists
  FOR SELECT USING (
    is_admin_or_supervisor()
    OR owner_agent_name = get_user_agent_name()
    OR (is_shared = true AND get_user_agent_name() = ANY(shared_with))
    OR is_shared = true
  );
CREATE POLICY "Authenticated create playlists" ON public.call_playlists
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners update playlists" ON public.call_playlists
  FOR UPDATE USING (owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor())
  WITH CHECK (owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor());
CREATE POLICY "Owners delete playlists" ON public.call_playlists
  FOR DELETE USING (owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor());

CREATE POLICY "View items of accessible playlists" ON public.playlist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.call_playlists p
            WHERE p.id = playlist_id
              AND (is_admin_or_supervisor()
                   OR p.owner_agent_name = get_user_agent_name()
                   OR p.is_shared = true))
  );
CREATE POLICY "Manage items of own playlists" ON public.playlist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.call_playlists p
            WHERE p.id = playlist_id
              AND (p.owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.call_playlists p
            WHERE p.id = playlist_id
              AND (p.owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()))
  );

CREATE TRIGGER trg_playlists_updated BEFORE UPDATE ON public.call_playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

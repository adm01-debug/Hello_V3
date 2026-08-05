
-- ============================================================
-- 1. ALTER call_recordings: add source column
-- ============================================================
ALTER TABLE public.call_recordings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'internal';

CREATE INDEX IF NOT EXISTS idx_call_recordings_source ON public.call_recordings(source);

-- ============================================================
-- 2. call_key_moments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_key_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  moment_type TEXT NOT NULL CHECK (moment_type IN ('price','competitor','objection','next_step','commitment','churn_risk','question','positive')),
  timestamp_seconds NUMERIC NOT NULL DEFAULT 0,
  quote TEXT NOT NULL,
  speaker TEXT,
  confidence NUMERIC DEFAULT 0.8,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_key_moments_session ON public.call_key_moments(call_session_id);
CREATE INDEX IF NOT EXISTS idx_key_moments_type ON public.call_key_moments(moment_type);

ALTER TABLE public.call_key_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or as supervisor key moments"
ON public.call_key_moments FOR SELECT
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = call_key_moments.call_session_id
      AND can_access_agent_data(cs.agent_name)
  )
);

CREATE POLICY "Authenticated insert key moments"
ON public.call_key_moments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/supervisor delete key moments"
ON public.call_key_moments FOR DELETE
USING (is_admin_or_supervisor());

-- ============================================================
-- 3. battle_cards
-- ============================================================
CREATE TABLE IF NOT EXISTS public.battle_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name TEXT NOT NULL,
  description TEXT,
  our_strengths TEXT[] DEFAULT '{}',
  their_weaknesses TEXT[] DEFAULT '{}',
  talking_points TEXT[] DEFAULT '{}',
  objection_responses JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated view battle cards"
ON public.battle_cards FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true OR is_admin_or_supervisor());

CREATE POLICY "Admin/supervisor manage battle cards"
ON public.battle_cards FOR ALL
USING (is_admin_or_supervisor())
WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER update_battle_cards_updated_at
BEFORE UPDATE ON public.battle_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. battle_card_triggers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.battle_card_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_card_id UUID NOT NULL REFERENCES public.battle_cards(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains','exact','starts_with')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battle_card_triggers_card ON public.battle_card_triggers(battle_card_id);
CREATE INDEX IF NOT EXISTS idx_battle_card_triggers_keyword ON public.battle_card_triggers(keyword);

ALTER TABLE public.battle_card_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated view triggers"
ON public.battle_card_triggers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/supervisor manage triggers"
ON public.battle_card_triggers FOR ALL
USING (is_admin_or_supervisor())
WITH CHECK (is_admin_or_supervisor());

-- ============================================================
-- 5. call_transcripts_searchable (full-text PT)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_transcripts_searchable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL UNIQUE REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  full_text TEXT NOT NULL,
  search_vector TSVECTOR,
  agent_name TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_search_vector ON public.call_transcripts_searchable USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_transcripts_agent ON public.call_transcripts_searchable(agent_name);

CREATE OR REPLACE FUNCTION public.update_transcript_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese', COALESCE(NEW.full_text, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transcript_search_vector
BEFORE INSERT OR UPDATE OF full_text ON public.call_transcripts_searchable
FOR EACH ROW EXECUTE FUNCTION public.update_transcript_search_vector();

ALTER TABLE public.call_transcripts_searchable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View transcripts own or supervisor"
ON public.call_transcripts_searchable FOR SELECT
USING (
  is_admin_or_supervisor()
  OR can_access_agent_data(agent_name)
);

CREATE POLICY "Authenticated insert transcripts"
ON public.call_transcripts_searchable FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update transcripts"
ON public.call_transcripts_searchable FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 6. coaching_timestamps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coaching_timestamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  agent_name TEXT,
  timestamp_seconds NUMERIC NOT NULL DEFAULT 0,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive','improvement','warning','tip')),
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_ts_session ON public.coaching_timestamps(call_session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_ts_agent ON public.coaching_timestamps(agent_name);

ALTER TABLE public.coaching_timestamps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View coaching ts own or supervisor"
ON public.coaching_timestamps FOR SELECT
USING (
  is_admin_or_supervisor()
  OR can_access_agent_data(agent_name)
);

CREATE POLICY "Authenticated insert coaching ts"
ON public.coaching_timestamps FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/supervisor delete coaching ts"
ON public.coaching_timestamps FOR DELETE
USING (is_admin_or_supervisor());

-- ============================================================
-- 7. live_sentiment_snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS public.live_sentiment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  timestamp_seconds NUMERIC NOT NULL DEFAULT 0,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive','neutral','negative','mixed')),
  score NUMERIC DEFAULT 0,
  urgency TEXT DEFAULT 'low' CHECK (urgency IN ('low','medium','high','critical')),
  emotion TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_snap_session ON public.live_sentiment_snapshots(call_session_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_snap_created ON public.live_sentiment_snapshots(created_at);

ALTER TABLE public.live_sentiment_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View sentiment snapshots"
ON public.live_sentiment_snapshots FOR SELECT
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = live_sentiment_snapshots.call_session_id
      AND can_access_agent_data(cs.agent_name)
  )
);

CREATE POLICY "Authenticated insert sentiment snapshots"
ON public.live_sentiment_snapshots FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

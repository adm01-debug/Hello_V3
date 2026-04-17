-- 1. Consent Records
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  phone TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('voice', 'sms', 'whatsapp', 'email')),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'transactional', 'recording', 'data_processing')),
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual',
  evidence JSONB DEFAULT '{}'::jsonb,
  recorded_by TEXT,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_records_contact ON public.consent_records(contact_id);
CREATE INDEX idx_consent_records_phone ON public.consent_records(phone);
CREATE INDEX idx_consent_records_channel_type ON public.consent_records(channel, consent_type);
CREATE INDEX idx_consent_records_granted ON public.consent_records(granted) WHERE granted = true;

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/supervisors view consent" ON public.consent_records
  FOR SELECT USING (is_admin_or_supervisor());
CREATE POLICY "Admins/supervisors insert consent" ON public.consent_records
  FOR INSERT WITH CHECK (is_admin_or_supervisor());
CREATE POLICY "Admins/supervisors update consent" ON public.consent_records
  FOR UPDATE USING (is_admin_or_supervisor());
CREATE POLICY "Admins delete consent" ON public.consent_records
  FOR DELETE USING (is_admin_user(auth.uid()));

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Contact Engagement Patterns
CREATE TABLE public.contact_engagement_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE UNIQUE,
  best_hour INTEGER CHECK (best_hour >= 0 AND best_hour <= 23),
  best_day_of_week INTEGER CHECK (best_day_of_week >= 0 AND best_day_of_week <= 6),
  answer_rate NUMERIC(5,4) DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  total_answered INTEGER NOT NULL DEFAULT 0,
  avg_call_duration_seconds INTEGER DEFAULT 0,
  hourly_distribution JSONB DEFAULT '{}'::jsonb,
  daily_distribution JSONB DEFAULT '{}'::jsonb,
  last_attempt_at TIMESTAMPTZ,
  last_answered_at TIMESTAMPTZ,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_engagement_patterns_contact ON public.contact_engagement_patterns(contact_id);
CREATE INDEX idx_engagement_patterns_answer_rate ON public.contact_engagement_patterns(answer_rate DESC);

ALTER TABLE public.contact_engagement_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read engagement patterns" ON public.contact_engagement_patterns
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage engagement patterns" ON public.contact_engagement_patterns
  FOR ALL USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE TRIGGER update_engagement_patterns_updated_at
  BEFORE UPDATE ON public.contact_engagement_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
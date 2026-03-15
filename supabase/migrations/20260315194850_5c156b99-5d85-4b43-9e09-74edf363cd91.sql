
-- Call Flow Designer tables
CREATE TABLE public.call_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  flow_data JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.call_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage call_flows" ON public.call_flows FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view call_flows" ON public.call_flows FOR SELECT USING (auth.uid() IS NOT NULL);

-- Voicemail messages
CREATE TABLE public.voicemail_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_name TEXT,
  caller_phone TEXT NOT NULL,
  agent_name TEXT,
  duration_seconds INTEGER,
  transcription TEXT,
  audio_file_path TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.voicemail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage voicemail" ON public.voicemail_messages FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Agents can view own voicemail" ON public.voicemail_messages FOR SELECT USING (is_admin_or_supervisor() OR agent_name = get_user_agent_name());
CREATE POLICY "System can insert voicemail" ON public.voicemail_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Topic detections for call analysis
CREATE TABLE public.topic_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage topics" ON public.topic_detections FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view topics" ON public.topic_detections FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert topics" ON public.topic_detections FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Manager recovery alerts
CREATE TABLE public.manager_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  agent_name TEXT,
  alert_type TEXT NOT NULL DEFAULT 'negative_sentiment',
  severity TEXT NOT NULL DEFAULT 'warning',
  trigger_reason TEXT NOT NULL,
  sentiment_score NUMERIC,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manager_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage manager_alerts" ON public.manager_alerts FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "System can insert manager_alerts" ON public.manager_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Video conferences (UI ready, awaiting infra)
CREATE TABLE public.video_conferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  host_name TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  max_participants INTEGER NOT NULL DEFAULT 10,
  meeting_url TEXT,
  recording_path TEXT,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_conferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage video_conferences" ON public.video_conferences FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view video_conferences" ON public.video_conferences FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert video_conferences" ON public.video_conferences FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Hot desking stations
CREATE TABLE public.hot_desking_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_name TEXT NOT NULL,
  location TEXT,
  extension TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  current_user_name TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  auto_logout_at TIMESTAMP WITH TIME ZONE,
  equipment JSONB NOT NULL DEFAULT '{"headset":true,"monitor":true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hot_desking_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stations" ON public.hot_desking_stations FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view stations" ON public.hot_desking_stations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update stations" ON public.hot_desking_stations FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Virtual fax
CREATE TABLE public.virtual_fax (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL DEFAULT 'outbound',
  from_number TEXT,
  to_number TEXT NOT NULL,
  subject TEXT,
  page_count INTEGER NOT NULL DEFAULT 0,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_fax ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fax" ON public.virtual_fax FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view fax" ON public.virtual_fax FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert fax" ON public.virtual_fax FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Number porting requests
CREATE TABLE public.number_porting_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  current_provider TEXT NOT NULL,
  account_number TEXT,
  authorized_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.number_porting_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage porting" ON public.number_porting_requests FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view porting" ON public.number_porting_requests FOR SELECT USING (auth.uid() IS NOT NULL);

-- Toll-free numbers
CREATE TABLE public.toll_free_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  friendly_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_to TEXT,
  monthly_cost NUMERIC DEFAULT 0,
  call_flow_id UUID REFERENCES public.call_flows(id),
  provisioned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.toll_free_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage toll_free" ON public.toll_free_numbers FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view toll_free" ON public.toll_free_numbers FOR SELECT USING (auth.uid() IS NOT NULL);

-- Topic trending aggregation
CREATE TABLE public.topic_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_occurrences INTEGER NOT NULL DEFAULT 0,
  avg_sentiment NUMERIC,
  calls_affected INTEGER NOT NULL DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage trends" ON public.topic_trends FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Authenticated can view trends" ON public.topic_trends FOR SELECT USING (auth.uid() IS NOT NULL);

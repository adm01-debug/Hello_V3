-- Create table for call sessions
CREATE TABLE public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_name TEXT,
  caller_phone TEXT,
  agent_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for transcription segments
CREATE TABLE public.call_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE CASCADE NOT NULL,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  start_time NUMERIC,
  end_time NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for call analyses
CREATE TABLE public.call_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE CASCADE NOT NULL,
  sentiment TEXT,
  urgency TEXT,
  emotion TEXT,
  suggestion TEXT,
  risk_alert TEXT,
  message_analyzed TEXT,
  speaker_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for call summaries (final analysis)
CREATE TABLE public.call_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE CASCADE NOT NULL,
  summary TEXT,
  main_topics TEXT[],
  overall_sentiment TEXT,
  customer_satisfaction INTEGER,
  agent_performance_score INTEGER,
  next_steps TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (call center system - no auth required for demo)
CREATE POLICY "Allow all access to call_sessions" ON public.call_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to call_transcriptions" ON public.call_transcriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to call_analyses" ON public.call_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to call_summaries" ON public.call_summaries FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_transcriptions_session ON public.call_transcriptions(call_session_id);
CREATE INDEX idx_analyses_session ON public.call_analyses(call_session_id);
CREATE INDEX idx_summaries_session ON public.call_summaries(call_session_id);
CREATE INDEX idx_sessions_started_at ON public.call_sessions(started_at DESC);
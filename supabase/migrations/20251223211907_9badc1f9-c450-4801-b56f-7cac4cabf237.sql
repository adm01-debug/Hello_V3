-- Add hold time tracking to call_sessions
ALTER TABLE public.call_sessions 
ADD COLUMN IF NOT EXISTS hold_time_seconds integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hold_count integer DEFAULT 0;

-- Create table for hold time events for detailed tracking
CREATE TABLE IF NOT EXISTS public.hold_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id uuid REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  agent_name text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hold_events ENABLE ROW LEVEL SECURITY;

-- Create policies for hold_events
CREATE POLICY "Allow public read on hold_events" 
ON public.hold_events 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on hold_events" 
ON public.hold_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on hold_events" 
ON public.hold_events 
FOR UPDATE 
USING (true);

-- Enable realtime for hold_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.hold_events;
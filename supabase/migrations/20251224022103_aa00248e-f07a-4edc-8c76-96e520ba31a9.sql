-- Create table for barge-in sessions
CREATE TABLE public.barge_in_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  supervisor_name TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'ended'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.barge_in_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public insert on barge_in_sessions" 
ON public.barge_in_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read on barge_in_sessions" 
ON public.barge_in_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on barge_in_sessions" 
ON public.barge_in_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on barge_in_sessions" 
ON public.barge_in_sessions 
FOR DELETE 
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.barge_in_sessions;
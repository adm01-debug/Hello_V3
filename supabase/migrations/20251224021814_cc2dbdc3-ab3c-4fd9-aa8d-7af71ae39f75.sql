-- Create table for whisper messages between supervisors and agents
CREATE TABLE public.whisper_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  supervisor_name TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.whisper_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth)
CREATE POLICY "Allow public insert on whisper_messages" 
ON public.whisper_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read on whisper_messages" 
ON public.whisper_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on whisper_messages" 
ON public.whisper_messages 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on whisper_messages" 
ON public.whisper_messages 
FOR DELETE 
USING (true);

-- Enable realtime for whisper messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whisper_messages;
-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-recordings', 'call-recordings', false);

-- Create storage policies for recordings
CREATE POLICY "Allow public upload to call-recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'call-recordings');

CREATE POLICY "Allow public read from call-recordings" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'call-recordings');

CREATE POLICY "Allow public delete from call-recordings" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'call-recordings');

-- Create table to track recordings metadata
CREATE TABLE public.call_recordings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id uuid REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  conference_id text,
  file_path text NOT NULL,
  file_size_bytes bigint,
  duration_seconds integer,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  participant_count integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read on call_recordings" 
ON public.call_recordings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on call_recordings" 
ON public.call_recordings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete on call_recordings" 
ON public.call_recordings 
FOR DELETE 
USING (true);
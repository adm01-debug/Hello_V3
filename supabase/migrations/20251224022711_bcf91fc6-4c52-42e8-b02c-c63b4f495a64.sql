-- Create scheduled_callbacks table
CREATE TABLE public.scheduled_callbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  caller_name TEXT NOT NULL,
  caller_phone TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_agent TEXT,
  created_by TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_callbacks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read on scheduled_callbacks" 
ON public.scheduled_callbacks 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on scheduled_callbacks" 
ON public.scheduled_callbacks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on scheduled_callbacks" 
ON public.scheduled_callbacks 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on scheduled_callbacks" 
ON public.scheduled_callbacks 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_callbacks_updated_at
BEFORE UPDATE ON public.scheduled_callbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_callbacks;

-- Create index for efficient queries
CREATE INDEX idx_scheduled_callbacks_scheduled_at ON public.scheduled_callbacks(scheduled_at);
CREATE INDEX idx_scheduled_callbacks_status ON public.scheduled_callbacks(status);
CREATE INDEX idx_scheduled_callbacks_contact_id ON public.scheduled_callbacks(contact_id);
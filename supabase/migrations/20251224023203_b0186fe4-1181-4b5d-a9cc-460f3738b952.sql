-- Create dialer_campaigns table for managing dialing campaigns
CREATE TABLE public.dialer_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'paused',
  mode TEXT NOT NULL DEFAULT 'predictive',
  max_concurrent_calls INTEGER NOT NULL DEFAULT 3,
  call_timeout_seconds INTEGER NOT NULL DEFAULT 30,
  retry_attempts INTEGER NOT NULL DEFAULT 2,
  retry_delay_minutes INTEGER NOT NULL DEFAULT 30,
  working_hours_start TIME DEFAULT '08:00:00',
  working_hours_end TIME DEFAULT '18:00:00',
  total_contacts INTEGER DEFAULT 0,
  completed_contacts INTEGER DEFAULT 0,
  successful_contacts INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dialer_queue table for contacts to be called
CREATE TABLE public.dialer_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.dialer_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  name TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  result TEXT,
  result_notes TEXT,
  assigned_agent TEXT,
  call_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dialer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialer_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dialer_campaigns
CREATE POLICY "Allow public read on dialer_campaigns" 
ON public.dialer_campaigns FOR SELECT USING (true);

CREATE POLICY "Allow public insert on dialer_campaigns" 
ON public.dialer_campaigns FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on dialer_campaigns" 
ON public.dialer_campaigns FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on dialer_campaigns" 
ON public.dialer_campaigns FOR DELETE USING (true);

-- Create RLS policies for dialer_queue
CREATE POLICY "Allow public read on dialer_queue" 
ON public.dialer_queue FOR SELECT USING (true);

CREATE POLICY "Allow public insert on dialer_queue" 
ON public.dialer_queue FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on dialer_queue" 
ON public.dialer_queue FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on dialer_queue" 
ON public.dialer_queue FOR DELETE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_dialer_campaigns_updated_at
BEFORE UPDATE ON public.dialer_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dialer_queue_updated_at
BEFORE UPDATE ON public.dialer_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dialer_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dialer_queue;

-- Create indexes
CREATE INDEX idx_dialer_queue_campaign_id ON public.dialer_queue(campaign_id);
CREATE INDEX idx_dialer_queue_status ON public.dialer_queue(status);
CREATE INDEX idx_dialer_queue_next_attempt ON public.dialer_queue(next_attempt_at);
CREATE INDEX idx_dialer_campaigns_status ON public.dialer_campaigns(status);
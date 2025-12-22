-- Create alerts table for call notifications
CREATE TABLE public.call_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'negative_sentiment', 'low_satisfaction', 'high_urgency'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_alerts ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (no auth)
CREATE POLICY "Allow public read on call_alerts" 
ON public.call_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on call_alerts" 
ON public.call_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on call_alerts" 
ON public.call_alerts 
FOR UPDATE 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_call_alerts_is_read ON public.call_alerts(is_read);
CREATE INDEX idx_call_alerts_created_at ON public.call_alerts(created_at DESC);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_alerts;
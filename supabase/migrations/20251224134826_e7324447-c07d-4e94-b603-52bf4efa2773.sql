-- Create queue metrics alert settings table
CREATE TABLE public.queue_metrics_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  avg_wait_time_warning INTEGER NOT NULL DEFAULT 45,
  avg_wait_time_critical INTEGER NOT NULL DEFAULT 90,
  abandonment_rate_warning INTEGER NOT NULL DEFAULT 10,
  abandonment_rate_critical INTEGER NOT NULL DEFAULT 20,
  service_level_warning INTEGER NOT NULL DEFAULT 80,
  service_level_critical INTEGER NOT NULL DEFAULT 60,
  check_interval_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.queue_metrics_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage queue_metrics_settings" 
ON public.queue_metrics_settings 
FOR ALL 
USING (is_admin_or_supervisor());

CREATE POLICY "Authenticated users can view queue_metrics_settings" 
ON public.queue_metrics_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_queue_metrics_settings_updated_at
BEFORE UPDATE ON public.queue_metrics_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.queue_metrics_settings (
  enabled,
  avg_wait_time_warning,
  avg_wait_time_critical,
  abandonment_rate_warning,
  abandonment_rate_critical,
  service_level_warning,
  service_level_critical,
  check_interval_minutes
) VALUES (
  true,
  45,
  90,
  10,
  20,
  80,
  60,
  5
);
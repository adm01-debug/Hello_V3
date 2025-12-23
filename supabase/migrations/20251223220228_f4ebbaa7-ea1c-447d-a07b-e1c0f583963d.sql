
-- Create hold_alert_settings table
CREATE TABLE public.hold_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warning_threshold_seconds INTEGER NOT NULL DEFAULT 60,
  critical_threshold_seconds INTEGER NOT NULL DEFAULT 180,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notify_on_warning BOOLEAN NOT NULL DEFAULT true,
  notify_on_critical BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hold_alert_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single global config)
CREATE POLICY "Allow public read on hold_alert_settings" 
ON public.hold_alert_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on hold_alert_settings" 
ON public.hold_alert_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public insert on hold_alert_settings" 
ON public.hold_alert_settings 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_hold_alert_settings_updated_at
BEFORE UPDATE ON public.hold_alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.hold_alert_settings (warning_threshold_seconds, critical_threshold_seconds)
VALUES (60, 180);

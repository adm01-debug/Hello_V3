-- Create table for customizable dashboard goals
CREATE TABLE public.dashboard_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'service_level', 'abandonment_rate', 'avg_wait_time', 'avg_handle_time'
  target_value NUMERIC NOT NULL,
  warning_threshold NUMERIC NOT NULL,
  critical_threshold NUMERIC NOT NULL,
  comparison_operator TEXT NOT NULL DEFAULT 'gte', -- 'gte' (greater than or equal), 'lte' (less than or equal)
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_on_warning BOOLEAN NOT NULL DEFAULT true,
  notify_on_critical BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view dashboard_goals"
ON public.dashboard_goals
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can manage dashboard_goals"
ON public.dashboard_goals
FOR ALL
USING (is_admin_or_supervisor());

-- Trigger for updated_at
CREATE TRIGGER update_dashboard_goals_updated_at
BEFORE UPDATE ON public.dashboard_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default goals
INSERT INTO public.dashboard_goals (name, metric_type, target_value, warning_threshold, critical_threshold, comparison_operator) VALUES
('Nível de Serviço', 'service_level', 80, 75, 60, 'gte'),
('Taxa de Abandono', 'abandonment_rate', 5, 10, 20, 'lte'),
('Tempo Médio de Espera', 'avg_wait_time', 30, 45, 90, 'lte'),
('Tempo Médio de Atendimento', 'avg_handle_time', 180, 240, 300, 'lte');
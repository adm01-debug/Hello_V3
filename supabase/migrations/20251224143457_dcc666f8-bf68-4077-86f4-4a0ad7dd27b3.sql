-- Create table for goal violations history
CREATE TABLE public.goal_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.dashboard_goals(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  actual_value NUMERIC NOT NULL,
  threshold_type TEXT NOT NULL DEFAULT 'warning', -- 'warning' or 'critical'
  deviation_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_violations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view goal_violations" 
ON public.goal_violations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert goal_violations" 
ON public.goal_violations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can manage goal_violations" 
ON public.goal_violations 
FOR ALL 
USING (is_admin_or_supervisor());

-- Create index for faster queries
CREATE INDEX idx_goal_violations_created_at ON public.goal_violations(created_at DESC);
CREATE INDEX idx_goal_violations_goal_id ON public.goal_violations(goal_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_violations;
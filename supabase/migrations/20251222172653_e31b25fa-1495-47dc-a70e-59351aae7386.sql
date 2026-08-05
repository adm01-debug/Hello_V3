-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create agent_goals table for storing custom goals per agent
CREATE TABLE public.agent_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL UNIQUE,
  calls_target INTEGER NOT NULL DEFAULT 50,
  satisfaction_target NUMERIC(3,1) NOT NULL DEFAULT 8.0,
  performance_target NUMERIC(3,1) NOT NULL DEFAULT 8.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_goals ENABLE ROW LEVEL SECURITY;

-- Allow public access for this demo app
CREATE POLICY "Allow public read on agent_goals" 
ON public.agent_goals 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on agent_goals" 
ON public.agent_goals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on agent_goals" 
ON public.agent_goals 
FOR UPDATE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_agent_goals_updated_at
BEFORE UPDATE ON public.agent_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create coaching_recommendations table
CREATE TABLE public.coaching_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_items TEXT[] DEFAULT '{}',
  metrics_snapshot JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.coaching_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read on coaching_recommendations" 
ON public.coaching_recommendations FOR SELECT USING (true);

CREATE POLICY "Allow public insert on coaching_recommendations" 
ON public.coaching_recommendations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on coaching_recommendations" 
ON public.coaching_recommendations FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on coaching_recommendations" 
ON public.coaching_recommendations FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.coaching_recommendations;
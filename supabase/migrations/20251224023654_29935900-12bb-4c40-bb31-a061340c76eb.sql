-- Create badges table for badge definitions
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL DEFAULT 'performance',
  tier TEXT NOT NULL DEFAULT 'bronze',
  points INTEGER NOT NULL DEFAULT 10,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_badges table for earned badges
CREATE TABLE public.agent_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, badge_id)
);

-- Create agent_weekly_stats for rankings
CREATE TABLE public.agent_weekly_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_calls INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  avg_satisfaction NUMERIC(3,1) DEFAULT 0,
  avg_performance NUMERIC(3,1) DEFAULT 0,
  badges_earned INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, week_start)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_weekly_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for badges (public read)
CREATE POLICY "Allow public read on badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Allow public insert on badges" ON public.badges FOR INSERT WITH CHECK (true);

-- RLS policies for agent_badges
CREATE POLICY "Allow public read on agent_badges" ON public.agent_badges FOR SELECT USING (true);
CREATE POLICY "Allow public insert on agent_badges" ON public.agent_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on agent_badges" ON public.agent_badges FOR DELETE USING (true);

-- RLS policies for agent_weekly_stats
CREATE POLICY "Allow public read on agent_weekly_stats" ON public.agent_weekly_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert on agent_weekly_stats" ON public.agent_weekly_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on agent_weekly_stats" ON public.agent_weekly_stats FOR UPDATE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_weekly_stats;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, tier, points, requirement_type, requirement_value) VALUES
('Primeira Chamada', 'Complete sua primeira chamada', 'phone', 'milestone', 'bronze', 10, 'total_calls', 1),
('Iniciante', 'Complete 10 chamadas', 'star', 'milestone', 'bronze', 25, 'total_calls', 10),
('Experiente', 'Complete 50 chamadas', 'award', 'milestone', 'silver', 50, 'total_calls', 50),
('Veterano', 'Complete 100 chamadas', 'trophy', 'milestone', 'gold', 100, 'total_calls', 100),
('Lenda', 'Complete 500 chamadas', 'crown', 'milestone', 'platinum', 250, 'total_calls', 500),
('Satisfação Bronze', 'Alcance média de satisfação 7.0', 'smile', 'satisfaction', 'bronze', 30, 'avg_satisfaction', 70),
('Satisfação Prata', 'Alcance média de satisfação 8.0', 'smile', 'satisfaction', 'silver', 60, 'avg_satisfaction', 80),
('Satisfação Ouro', 'Alcance média de satisfação 9.0', 'smile', 'satisfaction', 'gold', 100, 'avg_satisfaction', 90),
('Maratonista', 'Atenda por mais de 5 horas em uma semana', 'clock', 'dedication', 'silver', 50, 'weekly_duration', 18000),
('Super Agente', 'Atenda 20 chamadas em um dia', 'zap', 'performance', 'gold', 75, 'daily_calls', 20),
('Ranking Top 3', 'Fique entre os 3 melhores da semana', 'medal', 'ranking', 'gold', 100, 'weekly_rank', 3),
('Campeão Semanal', 'Seja o melhor agente da semana', 'crown', 'ranking', 'platinum', 200, 'weekly_rank', 1);

-- Create trigger for updated_at
CREATE TRIGGER update_agent_weekly_stats_updated_at
  BEFORE UPDATE ON public.agent_weekly_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
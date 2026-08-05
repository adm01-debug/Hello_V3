-- ============= SHIFT TEMPLATES =============
CREATE TABLE public.shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 60,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view shift templates" ON public.shift_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/supervisor manage shift templates" ON public.shift_templates FOR ALL TO authenticated USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());
CREATE TRIGGER trg_shift_templates_updated BEFORE UPDATE ON public.shift_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= AGENT SHIFTS =============
CREATE TABLE public.agent_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 60,
  template_id UUID REFERENCES public.shift_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_shifts_agent_date ON public.agent_shifts(agent_name, shift_date);
CREATE INDEX idx_agent_shifts_date ON public.agent_shifts(shift_date);
ALTER TABLE public.agent_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents view own shifts, supervisors all" ON public.agent_shifts FOR SELECT TO authenticated USING (is_admin_or_supervisor() OR get_user_agent_name() = agent_name);
CREATE POLICY "Admin/supervisor manage shifts" ON public.agent_shifts FOR ALL TO authenticated USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());
CREATE TRIGGER trg_agent_shifts_updated BEFORE UPDATE ON public.agent_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= TIME OFF REQUESTS =============
CREATE TABLE public.time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  requested_by UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'vacation',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_off_agent ON public.time_off_requests(agent_name);
CREATE INDEX idx_time_off_status ON public.time_off_requests(status);
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents view own time off" ON public.time_off_requests FOR SELECT TO authenticated USING (is_admin_or_supervisor() OR get_user_agent_name() = agent_name);
CREATE POLICY "Agents create own time off" ON public.time_off_requests FOR INSERT TO authenticated WITH CHECK (get_user_agent_name() = agent_name OR is_admin_or_supervisor());
CREATE POLICY "Admin/supervisor manage time off" ON public.time_off_requests FOR UPDATE TO authenticated USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());
CREATE POLICY "Admin/supervisor delete time off" ON public.time_off_requests FOR DELETE TO authenticated USING (is_admin_or_supervisor());
CREATE TRIGGER trg_time_off_updated BEFORE UPDATE ON public.time_off_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= SKILLS =============
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view skills" ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/supervisor manage skills" ON public.skills FOR ALL TO authenticated USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());
CREATE TRIGGER trg_skills_updated BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= AGENT SKILLS =============
CREATE TABLE public.agent_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency INTEGER NOT NULL DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  certified_at TIMESTAMPTZ,
  certified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_name, skill_id)
);
CREATE INDEX idx_agent_skills_agent ON public.agent_skills(agent_name);
ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view agent skills" ON public.agent_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/supervisor manage agent skills" ON public.agent_skills FOR ALL TO authenticated USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());
CREATE TRIGGER trg_agent_skills_updated BEFORE UPDATE ON public.agent_skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= QUEUE SKILL REQUIREMENTS =============
CREATE TABLE public.queue_skill_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name TEXT NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  min_proficiency INTEGER NOT NULL DEFAULT 3 CHECK (min_proficiency BETWEEN 1 AND 5),
  weight NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (queue_name, skill_id)
);
ALTER TABLE public.queue_skill_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view queue requirements" ON public.queue_skill_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/supervisor manage queue requirements" ON public.queue_skill_requirements FOR ALL TO authenticated USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

-- ============= COACHING ASSIGNMENTS =============
CREATE TABLE public.coaching_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  assigned_by UUID,
  assigner_name TEXT,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  scorecard_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  completed_at TIMESTAMPTZ,
  agent_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_coaching_assignments_agent ON public.coaching_assignments(agent_name);
CREATE INDEX idx_coaching_assignments_status ON public.coaching_assignments(status);
ALTER TABLE public.coaching_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents view own assignments" ON public.coaching_assignments FOR SELECT TO authenticated USING (is_admin_or_supervisor() OR get_user_agent_name() = agent_name);
CREATE POLICY "Admin/supervisor create assignments" ON public.coaching_assignments FOR INSERT TO authenticated WITH CHECK (is_admin_or_supervisor());
CREATE POLICY "Agents update own assignments status" ON public.coaching_assignments FOR UPDATE TO authenticated USING (is_admin_or_supervisor() OR get_user_agent_name() = agent_name) WITH CHECK (is_admin_or_supervisor() OR get_user_agent_name() = agent_name);
CREATE POLICY "Admin/supervisor delete assignments" ON public.coaching_assignments FOR DELETE TO authenticated USING (is_admin_or_supervisor());
CREATE TRIGGER trg_coaching_assignments_updated BEFORE UPDATE ON public.coaching_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= LEARNING MODULES =============
CREATE TABLE public.learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'article',
  content_url TEXT,
  content_body TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view learning modules" ON public.learning_modules FOR SELECT TO authenticated USING (is_active OR is_admin_or_supervisor());
CREATE POLICY "Admin/supervisor manage learning modules" ON public.learning_modules FOR ALL TO authenticated USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());
CREATE TRIGGER trg_learning_modules_updated BEFORE UPDATE ON public.learning_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= LEARNING COMPLETIONS =============
CREATE TABLE public.learning_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score NUMERIC,
  notes TEXT,
  UNIQUE (agent_name, module_id)
);
CREATE INDEX idx_learning_completions_agent ON public.learning_completions(agent_name);
ALTER TABLE public.learning_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents view own completions" ON public.learning_completions FOR SELECT TO authenticated USING (is_admin_or_supervisor() OR get_user_agent_name() = agent_name);
CREATE POLICY "Agents create own completions" ON public.learning_completions FOR INSERT TO authenticated WITH CHECK (get_user_agent_name() = agent_name OR is_admin_or_supervisor());
CREATE POLICY "Admin/supervisor delete completions" ON public.learning_completions FOR DELETE TO authenticated USING (is_admin_or_supervisor());
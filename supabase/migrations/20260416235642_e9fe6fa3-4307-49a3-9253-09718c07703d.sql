
-- ============= ACCOUNTS (clientes pós-venda) =============
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  segment TEXT NOT NULL DEFAULT 'smb', -- smb, mid_market, enterprise, strategic
  mrr NUMERIC(12,2) DEFAULT 0,
  arr NUMERIC(12,2) DEFAULT 0,
  contract_start_date DATE,
  contract_end_date DATE,
  csm_agent_name TEXT,
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  health_factors JSONB DEFAULT '{}'::jsonb,
  churn_risk_score INTEGER DEFAULT 0 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
  current_stage TEXT DEFAULT 'onboarding',
  status TEXT NOT NULL DEFAULT 'active', -- active, at_risk, churned, paused
  last_contact_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_csm ON public.accounts(csm_agent_name);
CREATE INDEX idx_accounts_status ON public.accounts(status);
CREATE INDEX idx_accounts_health ON public.accounts(health_score);
CREATE INDEX idx_accounts_churn ON public.accounts(churn_risk_score);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/supervisor full access on accounts"
  ON public.accounts FOR ALL TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "CSM can view their accounts"
  ON public.accounts FOR SELECT TO authenticated
  USING (csm_agent_name = get_user_agent_name());

CREATE POLICY "CSM can update their accounts"
  ON public.accounts FOR UPDATE TO authenticated
  USING (csm_agent_name = get_user_agent_name())
  WITH CHECK (csm_agent_name = get_user_agent_name());

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CHURN RISK SIGNALS =============
CREATE TABLE public.churn_risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- contact_drop, negative_sentiment, competitor_mention, objection_pattern, low_usage, support_escalation
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  score_delta INTEGER NOT NULL DEFAULT 0, -- how much it adds to churn_risk_score
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_churn_signals_account ON public.churn_risk_signals(account_id);
CREATE INDEX idx_churn_signals_active ON public.churn_risk_signals(is_active, severity);

ALTER TABLE public.churn_risk_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/supervisor full access on churn signals"
  ON public.churn_risk_signals FOR ALL TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "CSM can view signals for their accounts"
  ON public.churn_risk_signals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = churn_risk_signals.account_id
      AND a.csm_agent_name = get_user_agent_name()
  ));

CREATE POLICY "CSM can resolve signals for their accounts"
  ON public.churn_risk_signals FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = churn_risk_signals.account_id
      AND a.csm_agent_name = get_user_agent_name()
  ));

-- ============= RENEWALS =============
CREATE TABLE public.renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  renewal_type TEXT NOT NULL DEFAULT 'renewal', -- renewal, expansion, upsell, cross_sell
  current_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  proposed_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  status TEXT NOT NULL DEFAULT 'open', -- open, in_negotiation, won, lost, on_hold
  due_date DATE NOT NULL,
  closed_at TIMESTAMPTZ,
  owner_agent_name TEXT,
  notes TEXT,
  loss_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renewals_account ON public.renewals(account_id);
CREATE INDEX idx_renewals_due ON public.renewals(due_date) WHERE status = 'open';
CREATE INDEX idx_renewals_status ON public.renewals(status);

ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/supervisor full access on renewals"
  ON public.renewals FOR ALL TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "CSM can view their renewals"
  ON public.renewals FOR SELECT TO authenticated
  USING (
    owner_agent_name = get_user_agent_name()
    OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = renewals.account_id
        AND a.csm_agent_name = get_user_agent_name()
    )
  );

CREATE POLICY "CSM can update their renewals"
  ON public.renewals FOR UPDATE TO authenticated
  USING (owner_agent_name = get_user_agent_name())
  WITH CHECK (owner_agent_name = get_user_agent_name());

CREATE TRIGGER update_renewals_updated_at
  BEFORE UPDATE ON public.renewals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CUSTOMER JOURNEY STAGES =============
CREATE TABLE public.customer_journey_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key TEXT NOT NULL UNIQUE,
  stage_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  entry_criteria JSONB DEFAULT '{}'::jsonb,
  exit_criteria JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_journey_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view journey stages"
  ON public.customer_journey_stages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/supervisor manage journey stages"
  ON public.customer_journey_stages FOR ALL TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER update_journey_stages_updated_at
  BEFORE UPDATE ON public.customer_journey_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed estágios padrão
INSERT INTO public.customer_journey_stages (stage_key, stage_name, description, display_order, color) VALUES
  ('onboarding', 'Onboarding', 'Implementação inicial e primeiros passos', 1, '#06b6d4'),
  ('adoption', 'Adoção', 'Cliente usando o produto regularmente', 2, '#3b82f6'),
  ('value_realization', 'Realização de Valor', 'Cliente percebendo ROI claro', 3, '#8b5cf6'),
  ('expansion', 'Expansão', 'Oportunidades de upsell/cross-sell ativas', 4, '#ec4899'),
  ('renewal', 'Renovação', 'Janela de renovação aberta', 5, '#f59e0b'),
  ('at_risk', 'Em Risco', 'Sinais de churn detectados', 6, '#ef4444');

-- ============= ACCOUNT JOURNEY HISTORY =============
CREATE TABLE public.account_journey_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  reason TEXT,
  triggered_by TEXT, -- 'system' or agent name
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journey_history_account ON public.account_journey_history(account_id);

ALTER TABLE public.account_journey_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/supervisor view all journey history"
  ON public.account_journey_history FOR SELECT TO authenticated
  USING (is_admin_or_supervisor());

CREATE POLICY "CSM views history for their accounts"
  ON public.account_journey_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = account_journey_history.account_id
      AND a.csm_agent_name = get_user_agent_name()
  ));

CREATE POLICY "Authenticated can insert journey history"
  ON public.account_journey_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============= SURVEYS =============
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  survey_type TEXT NOT NULL DEFAULT 'nps', -- nps, csat, ces, custom
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger_event TEXT, -- post_call, post_renewal, periodic, manual
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated view active surveys"
  ON public.surveys FOR SELECT TO authenticated
  USING (is_active = true OR is_admin_or_supervisor());

CREATE POLICY "Admin/supervisor manage surveys"
  ON public.surveys FOR ALL TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= SURVEY RESPONSES =============
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  respondent_email TEXT,
  respondent_phone TEXT,
  score INTEGER, -- 0-10 for NPS, 1-5 for CSAT, etc
  category TEXT, -- promoter, passive, detractor for NPS
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  free_text_feedback TEXT,
  channel TEXT DEFAULT 'in_app', -- in_app, whatsapp, email, sms
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_responses_account ON public.survey_responses(account_id);
CREATE INDEX idx_survey_responses_survey ON public.survey_responses(survey_id);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/supervisor view all responses"
  ON public.survey_responses FOR SELECT TO authenticated
  USING (is_admin_or_supervisor());

CREATE POLICY "CSM views responses for their accounts"
  ON public.survey_responses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = survey_responses.account_id
      AND a.csm_agent_name = get_user_agent_name()
  ));

CREATE POLICY "Authenticated can insert responses"
  ON public.survey_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============= SUCCESS PLANS =============
CREATE TABLE public.success_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  business_outcome TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- active, at_risk, completed, archived
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  owner_agent_name TEXT,
  stakeholders JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_success_plans_account ON public.success_plans(account_id);
CREATE INDEX idx_success_plans_status ON public.success_plans(status);

ALTER TABLE public.success_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/supervisor full access on success plans"
  ON public.success_plans FOR ALL TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "CSM views success plans for their accounts"
  ON public.success_plans FOR SELECT TO authenticated
  USING (
    owner_agent_name = get_user_agent_name()
    OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = success_plans.account_id
        AND a.csm_agent_name = get_user_agent_name()
    )
  );

CREATE POLICY "CSM manages own success plans"
  ON public.success_plans FOR UPDATE TO authenticated
  USING (owner_agent_name = get_user_agent_name())
  WITH CHECK (owner_agent_name = get_user_agent_name());

CREATE TRIGGER update_success_plans_updated_at
  BEFORE UPDATE ON public.success_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= SUCCESS PLAN MILESTONES =============
CREATE TABLE public.success_plan_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  success_plan_id UUID NOT NULL REFERENCES public.success_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, blocked
  display_order INTEGER NOT NULL DEFAULT 0,
  assigned_to TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_plan ON public.success_plan_milestones(success_plan_id);

ALTER TABLE public.success_plan_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones follow plan visibility (select)"
  ON public.success_plan_milestones FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.success_plans sp
    WHERE sp.id = success_plan_milestones.success_plan_id
      AND (
        is_admin_or_supervisor()
        OR sp.owner_agent_name = get_user_agent_name()
        OR EXISTS (
          SELECT 1 FROM public.accounts a
          WHERE a.id = sp.account_id AND a.csm_agent_name = get_user_agent_name()
        )
      )
  ));

CREATE POLICY "Admin/supervisor manage milestones"
  ON public.success_plan_milestones FOR ALL TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "CSM manages milestones of own plans"
  ON public.success_plan_milestones FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.success_plans sp
    WHERE sp.id = success_plan_milestones.success_plan_id
      AND sp.owner_agent_name = get_user_agent_name()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.success_plans sp
    WHERE sp.id = success_plan_milestones.success_plan_id
      AND sp.owner_agent_name = get_user_agent_name()
  ));

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.success_plan_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link contatos a accounts (opcional)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_account ON public.contacts(account_id);

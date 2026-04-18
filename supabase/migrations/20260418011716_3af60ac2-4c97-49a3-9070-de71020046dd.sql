-- Tabela de histórico auditável de ações sobre recomendações VoIP
CREATE TABLE public.voip_recommendation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommendation_id text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  action_type text NOT NULL,
  action_payload jsonb DEFAULT '{}'::jsonb,
  outcome text NOT NULL CHECK (outcome IN ('applied','snoozed','dismissed','auto_applied')),
  applied_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Índices para consultas de histórico
CREATE INDEX idx_voip_rec_actions_user_time ON public.voip_recommendation_actions (user_id, applied_at DESC);
CREATE INDEX idx_voip_rec_actions_cat_outcome ON public.voip_recommendation_actions (category, outcome);

-- RLS
ALTER TABLE public.voip_recommendation_actions ENABLE ROW LEVEL SECURITY;

-- Usuário insere apenas próprias ações
CREATE POLICY "users insert own rec actions"
ON public.voip_recommendation_actions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Usuário vê próprias ações
CREATE POLICY "users select own rec actions"
ON public.voip_recommendation_actions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin/supervisor vê tudo
CREATE POLICY "admin supervisor select all rec actions"
ON public.voip_recommendation_actions
FOR SELECT
TO authenticated
USING (public.is_admin_or_supervisor());
-- ============================================================
-- Real-Time Agent Assist & Next-Best-Action Suite
-- ============================================================

-- 1. live_assist_signals: sinais detectados ao vivo durante a call
CREATE TABLE public.live_assist_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  agent_name TEXT,
  intent TEXT NOT NULL, -- objection, technical_question, discount_request, buying_signal, churn_risk, compliance_violation, sentiment_alert
  confidence NUMERIC(3,2) DEFAULT 0.0,
  suggestion TEXT,
  trigger_text TEXT,
  speaker TEXT, -- agent | customer
  source TEXT NOT NULL DEFAULT 'live_analysis', -- live_analysis, compliance, sentiment, objection_library
  metadata JSONB DEFAULT '{}'::jsonb,
  was_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_assist_signals_session ON public.live_assist_signals(call_session_id, created_at DESC);
CREATE INDEX idx_live_assist_signals_agent ON public.live_assist_signals(agent_name, created_at DESC);
CREATE INDEX idx_live_assist_signals_intent ON public.live_assist_signals(intent);

ALTER TABLE public.live_assist_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agentes veem seus próprios sinais"
  ON public.live_assist_signals FOR SELECT
  USING (
    is_admin_or_supervisor()
    OR agent_name = get_user_agent_name()
  );

CREATE POLICY "Sistema/usuários autenticados podem inserir sinais"
  ON public.live_assist_signals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Agente pode marcar sinal como usado"
  ON public.live_assist_signals FOR UPDATE
  USING (
    is_admin_or_supervisor()
    OR agent_name = get_user_agent_name()
  );

CREATE POLICY "Admin/supervisor podem deletar sinais"
  ON public.live_assist_signals FOR DELETE
  USING (is_admin_or_supervisor());

-- 2. objection_library: biblioteca curada de objeções e respostas recomendadas
CREATE TABLE public.objection_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objection_type TEXT NOT NULL, -- price, timing, competitor, authority, need, trust
  trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
  objection_example TEXT NOT NULL,
  recommended_response TEXT NOT NULL,
  talking_points TEXT[] DEFAULT '{}',
  category TEXT,
  difficulty TEXT DEFAULT 'medium', -- easy | medium | hard
  success_rate NUMERIC(5,2) DEFAULT 0.0, -- % de uso bem-sucedido
  times_suggested INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  times_won INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_objection_library_type ON public.objection_library(objection_type) WHERE is_active = true;
CREATE INDEX idx_objection_library_keywords ON public.objection_library USING GIN(trigger_keywords);

ALTER TABLE public.objection_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados leem biblioteca de objeções"
  ON public.objection_library FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/supervisor gerenciam biblioteca de objeções"
  ON public.objection_library FOR ALL
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER trg_objection_library_updated_at
  BEFORE UPDATE ON public.objection_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. compliance_rules: regras de compliance para guardrails ao vivo
CREATE TABLE public.compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- forbidden_word, required_disclaimer, promise, sensitive_data
  pattern TEXT NOT NULL, -- regex ou keyword list separada por |
  severity TEXT NOT NULL DEFAULT 'warning', -- info | warning | critical
  message TEXT NOT NULL,
  required_disclaimer TEXT,
  category TEXT,
  applies_to TEXT NOT NULL DEFAULT 'agent', -- agent | customer | both
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_rules_active ON public.compliance_rules(rule_type) WHERE is_active = true;

ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados leem regras de compliance"
  ON public.compliance_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/supervisor gerenciam regras de compliance"
  ON public.compliance_rules FOR ALL
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER trg_compliance_rules_updated_at
  BEFORE UPDATE ON public.compliance_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. crm_field_suggestions: sugestões de auto-fill para CRM extraídas durante a call
CREATE TABLE public.crm_field_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- position, company, pain_point, budget, timeline, etc
  current_value TEXT,
  suggested_value TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.0,
  source_quote TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | edited
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  applied_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_suggestions_session ON public.crm_field_suggestions(call_session_id);
CREATE INDEX idx_crm_suggestions_contact ON public.crm_field_suggestions(contact_id);
CREATE INDEX idx_crm_suggestions_status ON public.crm_field_suggestions(status);

ALTER TABLE public.crm_field_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados leem sugestões CRM"
  ON public.crm_field_suggestions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema/usuários autenticados criam sugestões"
  ON public.crm_field_suggestions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados revisam sugestões"
  ON public.crm_field_suggestions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/supervisor deletam sugestões"
  ON public.crm_field_suggestions FOR DELETE
  USING (is_admin_or_supervisor());

CREATE TRIGGER trg_crm_field_suggestions_updated_at
  BEFORE UPDATE ON public.crm_field_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed inicial de regras de compliance comuns (PT-BR)
INSERT INTO public.compliance_rules (rule_name, rule_type, pattern, severity, message, category, applies_to)
VALUES
  ('Promessa de garantia absoluta', 'promise', 'garantido|garantimos 100%|sem risco algum|com certeza absoluta', 'critical',
   'Evite promessas absolutas. Use "tipicamente", "na maioria dos casos" ou cite dados.', 'sales', 'agent'),
  ('Linguagem proibida', 'forbidden_word', 'idiota|imbecil|burro|estúpido', 'critical',
   'Linguagem inadequada detectada. Mantenha tom profissional.', 'professionalism', 'agent'),
  ('Dados sensíveis expostos', 'sensitive_data', '\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}', 'warning',
   'Possível CPF mencionado. Confirme se é necessário e siga LGPD.', 'lgpd', 'both'),
  ('Disclaimer de gravação', 'required_disclaimer', 'esta chamada está sendo gravada|chamada gravada', 'info',
   'Lembre o cliente que a chamada está sendo gravada (LGPD).', 'lgpd', 'agent'),
  ('Promessa de desconto sem aprovação', 'promise', 'eu te dou \d+%|posso fechar com \d+% off', 'warning',
   'Confirme com supervisor antes de prometer descontos personalizados.', 'pricing', 'agent');

-- 6. Seed inicial de objeções comuns
INSERT INTO public.objection_library (objection_type, trigger_keywords, objection_example, recommended_response, talking_points, category)
VALUES
  ('price', ARRAY['caro', 'preço alto', 'fora do orçamento', 'muito dinheiro'],
   'Está muito caro para o nosso momento.',
   'Entendo a preocupação com investimento. Vamos olhar o ROI? Clientes similares recuperam o valor em X meses. Posso mostrar o cálculo?',
   ARRAY['Foco em ROI, não preço', 'Comparar com custo do problema', 'Casos de sucesso similares'],
   'sales'),
  ('timing', ARRAY['agora não é hora', 'mais para frente', 'próximo trimestre', 'não é prioridade'],
   'Agora não é o momento certo para nós.',
   'Compreendo. O que precisaria mudar para virar prioridade? Posso te mostrar o custo de adiar 90 dias?',
   ARRAY['Identificar gatilho real', 'Quantificar custo da inação', 'Agendar follow-up específico'],
   'sales'),
  ('competitor', ARRAY['concorrente', 'já uso', 'estamos com', 'já temos solução'],
   'Já usamos o concorrente X.',
   'Ótimo que já investem nessa área. O que mais te impressiona neles? E o que melhoraria? Nossos clientes que migraram destacam [diferencial].',
   ARRAY['Validar antes de atacar', 'Descobrir gaps', 'Diferencial específico'],
   'sales'),
  ('authority', ARRAY['preciso falar', 'meu chefe', 'comitê', 'aprovação'],
   'Preciso falar com meu chefe antes de decidir.',
   'Faz total sentido envolver o decisor. Posso preparar um material executivo de 1 página? Ou agendar uma call rápida com vocês dois?',
   ARRAY['Facilitar acesso ao decisor', 'Material para venda interna', 'Co-presença'],
   'sales'),
  ('trust', ARRAY['nunca ouvi', 'empresa nova', 'segurança', 'confiável'],
   'Nunca ouvi falar da sua empresa.',
   'Justo. Trabalhamos com [3 logos relevantes] desde [ano]. Temos [certificação]. Quer que eu te conecte com um cliente similar para uma referência?',
   ARRAY['Logos sociais prova', 'Certificações', 'Referência cliente'],
   'sales');
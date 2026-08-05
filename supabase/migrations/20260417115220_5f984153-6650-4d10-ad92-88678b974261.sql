-- 1. call_translations
CREATE TABLE public.call_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  segment_id UUID,
  speaker TEXT NOT NULL CHECK (speaker IN ('agent','customer')),
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  confidence NUMERIC(3,2),
  detected_lang TEXT,
  model_used TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_translations_session ON public.call_translations(call_session_id, created_at);
CREATE INDEX idx_call_translations_langs ON public.call_translations(source_lang, target_lang);

ALTER TABLE public.call_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent/supervisor/admin can view translations"
ON public.call_translations FOR SELECT
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = call_translations.call_session_id
      AND can_access_agent_data(cs.agent_name)
  )
);

CREATE POLICY "Authenticated can insert translations"
ON public.call_translations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete translations"
ON public.call_translations FOR DELETE
USING (is_admin_user(auth.uid()));

-- 2. cultural_hints
CREATE TABLE public.cultural_hints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locale TEXT NOT NULL,
  context_type TEXT NOT NULL,
  hint_text TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cultural_hints_locale ON public.cultural_hints(locale, is_active);

ALTER TABLE public.cultural_hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view cultural hints"
ON public.cultural_hints FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage cultural hints"
ON public.cultural_hints FOR ALL
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE TRIGGER update_cultural_hints_updated_at
BEFORE UPDATE ON public.cultural_hints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. extend call_summaries
ALTER TABLE public.call_summaries
ADD COLUMN IF NOT EXISTS translated_summary JSONB DEFAULT '{}'::jsonb;

-- 4. seed cultural hints
INSERT INTO public.cultural_hints (locale, context_type, hint_text, severity) VALUES
('en-US','greeting','Cliente americano valoriza objetividade — vá direto ao ponto após cumprimento breve.','info'),
('en-US','negotiation','Use linguagem assertiva. Evite excesso de cordialidade que pode soar insincero.','info'),
('es-ES','formality','Use "usted" em contexto profissional. "Tú" só após o cliente sinalizar.','warning'),
('es-ES','greeting','"Buenos días/tardes" é mais formal que "Hola". Prefira em primeiro contato.','info'),
('ja-JP','negotiation','Evite negação direta ("não"). Prefira "é difícil" ou "vou verificar".','critical'),
('ja-JP','greeting','Mantenha tom respeitoso e formal. Honoríficos são essenciais (-san).','warning'),
('zh-CN','negotiation','Construa relacionamento (guanxi) antes de fechar negócio. Não pressione.','warning'),
('zh-CN','greeting','Cumprimente pelo sobrenome + título. Evite intimidade prematura.','info'),
('de-DE','formality','Use "Sie" sempre em contexto profissional. Pontualidade é crítica.','warning'),
('de-DE','negotiation','Cliente alemão espera fatos e dados precisos. Evite generalizações.','info'),
('fr-FR','formality','Use "vous" e cumprimente com "Bonjour Madame/Monsieur".','info'),
('fr-FR','negotiation','Argumentação lógica e bem estruturada é valorizada. Demonstre expertise.','info');
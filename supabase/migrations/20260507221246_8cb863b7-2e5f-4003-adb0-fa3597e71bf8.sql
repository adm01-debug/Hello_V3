-- Corrigir políticas da fila CRM
DROP POLICY IF EXISTS "Apenas admin pode ler fila de sincronização" ON public.crm_sync_queue;

CREATE POLICY "Admins e supervisores podem ler fila CRM" 
ON public.crm_sync_queue FOR SELECT 
USING (is_admin_or_supervisor());

CREATE POLICY "Agentes podem inserir na fila CRM" 
ON public.crm_sync_queue FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Tabela de Telemetria (Web Vitals / Performance)
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    rating TEXT, -- good, needs-improvement, poor
    navigation_type TEXT,
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Telemetria
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer autenticado pode inserir métricas" ON public.performance_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Apenas admin pode ver métricas" ON public.performance_metrics FOR SELECT USING (is_admin_or_supervisor());

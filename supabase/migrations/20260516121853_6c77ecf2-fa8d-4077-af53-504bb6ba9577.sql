-- 1. Indexação Inteligente para Performance Máxima
CREATE INDEX IF NOT EXISTS idx_perf_metrics_created_at ON public.performance_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_quality_created_at ON public.call_quality_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voip_usage_started_at ON public.voip_trunk_usage_metrics (started_at DESC);

-- 2. Fortalecimento de RLS em Tabelas Sensíveis
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs') THEN
        CREATE POLICY "Admins can view audit logs" ON public.audit_logs 
        FOR SELECT USING (is_admin_or_supervisor());
    END IF;
END $$;

-- 3. Função para Limpeza Automática de Logs Antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';
    DELETE FROM public.performance_metrics WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Garantia de RLS em todas as tabelas
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

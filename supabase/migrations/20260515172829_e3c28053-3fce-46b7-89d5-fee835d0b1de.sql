-- 1. Extensão para busca textual avançada
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índice GIN para busca ultra rápida em transcrições (corrigido nome da coluna para 'text')
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_text_trgm ON public.call_transcriptions USING gin (text gin_trgm_ops);

-- 3. Função para limpeza automática de logs antigos (Manutenção de Performance)
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Mantém apenas os últimos 90 dias de logs de controle de chamadas
    DELETE FROM public.call_control_audit_logs
    WHERE created_at < now() - interval '90 days';
    
    -- Mantém apenas os últimos 90 dias de métricas de qualidade
    DELETE FROM public.call_quality_metrics
    WHERE created_at < now() - interval '90 days';
    
    -- Limpeza de logs genéricos de auditoria
    DELETE FROM public.audit_logs
    WHERE created_at < now() - interval '90 days';
END;
$$;

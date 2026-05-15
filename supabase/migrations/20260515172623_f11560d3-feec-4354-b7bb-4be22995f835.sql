-- Função is_admin segura
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    );
END;
$$;

-- Função is_supervisor segura
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'supervisor')
        AND is_active = true
    );
END;
$$;

-- Otimização de Performance: Índices para Auditoria e Métricas
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON public.call_control_audit_logs(call_session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.call_control_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_session ON public.call_quality_metrics(call_session_id);

-- Melhorar a política de métricas de qualidade (Isolamento por Agente)
-- Primeiro habilitar RLS se não estiver
ALTER TABLE public.call_quality_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Role-based view quality metrics" ON public.call_quality_metrics;
CREATE POLICY "Role-based view quality metrics" ON public.call_quality_metrics
    FOR SELECT USING (
        is_admin() OR 
        is_supervisor() OR 
        (agent_name = get_user_agent_name())
    );

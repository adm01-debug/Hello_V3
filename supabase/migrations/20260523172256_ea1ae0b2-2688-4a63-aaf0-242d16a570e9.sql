-- Tabela para armazenar segredos de Webhooks
CREATE TABLE IF NOT EXISTS public.webhook_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para webhook_secrets
ALTER TABLE public.webhook_secrets ENABLE ROW LEVEL SECURITY;

-- Nota: Ajustando para user_profiles com base na descoberta
CREATE POLICY "Apenas administradores podem gerenciar segredos" 
ON public.webhook_secrets 
USING (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Adicionar índices para performance no painel de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

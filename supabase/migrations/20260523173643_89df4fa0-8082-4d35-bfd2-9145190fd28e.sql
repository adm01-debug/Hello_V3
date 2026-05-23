-- Tabela para segredos de webhooks (HMAC)
CREATE TABLE IF NOT EXISTS public.webhook_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE, -- ex: 'stripe', 'twilio', 'custom'
    secret_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.webhook_secrets ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admins can manage webhook secrets" ON public.webhook_secrets;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view RLS audit logs" ON public.rls_audit_logs;

-- Políticas baseadas na tabela user_profiles (que existe no banco)
CREATE POLICY "Admins can manage webhook secrets" 
ON public.webhook_secrets 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

ALTER TABLE public.rls_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view RLS audit logs" 
ON public.rls_audit_logs 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

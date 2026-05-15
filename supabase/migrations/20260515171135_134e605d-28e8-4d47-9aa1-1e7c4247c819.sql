-- Configurações globais do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configuração padrão para Bitrix
INSERT INTO public.system_settings (key, value) 
VALUES ('bitrix_config', '{"log_destination": "crm_timeline", "sync_enabled": true}')
ON CONFLICT (key) DO NOTHING;

-- Tabela para agentes do Bitrix24
CREATE TABLE IF NOT EXISTS public.bitrix_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    work_phone TEXT,
    personal_phone TEXT,
    active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para filas/departamentos do Bitrix24 (opcional, mas bom para organização)
CREATE TABLE IF NOT EXISTS public.bitrix_departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_departments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para admin
CREATE POLICY "Admins can manage system settings" ON public.system_settings
    FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage bitrix users" ON public.bitrix_users
    FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage bitrix departments" ON public.bitrix_departments
    FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

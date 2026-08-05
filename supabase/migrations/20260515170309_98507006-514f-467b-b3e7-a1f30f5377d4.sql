-- Criação do tipo enum para roles se não existir
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'agent', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Tabela de Troncos VoIP
CREATE TABLE IF NOT EXISTS public.voip_trunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sip_server TEXT NOT NULL,
    sip_username TEXT NOT NULL,
    sip_password_encrypted TEXT NOT NULL,
    sip_realm TEXT,
    transport TEXT DEFAULT 'wss',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    last_health_status TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Agentes
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- Relacionamento com auth.users
    name TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Atribuição de Agentes a Troncos
CREATE TABLE IF NOT EXISTS public.agent_trunk_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    trunk_id UUID REFERENCES public.voip_trunks(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(agent_id, trunk_id)
);

-- 4. Perfis de Usuário e Roles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role public.app_role NOT NULL DEFAULT 'agent',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Sessões de Chamada
CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_call_id TEXT,
    agent_id UUID REFERENCES public.agents(id),
    trunk_id UUID REFERENCES public.voip_trunks(id),
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    phone_number TEXT,
    status TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Eventos de Espera (Hold)
CREATE TABLE IF NOT EXISTS public.hold_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE CASCADE,
    agent_name TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Auditoria de Controle de Chamada
CREATE TABLE IF NOT EXISTS public.call_control_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id UUID REFERENCES public.call_sessions(id),
    action TEXT NOT NULL, -- 'mute', 'unmute', 'hold', 'unhold', 'transfer'
    source TEXT NOT NULL, -- 'local', 'remote'
    actor_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Métricas de Uso e Qualidade
CREATE TABLE IF NOT EXISTS public.voip_trunk_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trunk_id UUID REFERENCES public.voip_trunks(id),
    active_channels INTEGER DEFAULT 0,
    latency_ms INTEGER,
    jitter_ms INTEGER,
    timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.call_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id UUID REFERENCES public.call_sessions(id),
    mos FLOAT,
    jitter_ms INTEGER,
    packet_loss FLOAT,
    latency_ms INTEGER,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.voip_trunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_trunk_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hold_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_control_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_trunk_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Total para Administradores
-- (Usando uma função para verificar a role para evitar repetição)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo de política para voip_trunks
CREATE POLICY "Admins have full access to voip_trunks" ON public.voip_trunks
    FOR ALL TO authenticated USING (public.is_admin());

-- Replicar política para as outras tabelas
CREATE POLICY "Admins have full access to agents" ON public.agents FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to agent_trunk_assignments" ON public.agent_trunk_assignments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to user_profiles" ON public.user_profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to call_sessions" ON public.call_sessions FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to hold_events" ON public.hold_events FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to call_control_audit_logs" ON public.call_control_audit_logs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to voip_trunk_usage_metrics" ON public.voip_trunk_usage_metrics FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to call_quality_metrics" ON public.call_quality_metrics FOR ALL TO authenticated USING (public.is_admin());

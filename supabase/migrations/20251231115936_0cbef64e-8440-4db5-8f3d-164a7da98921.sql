-- =====================================================
-- MÓDULO DE SEGURANÇA AVANÇADA
-- =====================================================

-- 1. Criar enum para roles (se não existir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'agent', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Roles de Usuário (separada para evitar privilege escalation)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'agent',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Tabela de Permissões
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de Permissões por Role
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- 5. Tabela de Rate Limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  window_end TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabela de Configurações de Rate Limit
CREATE TABLE IF NOT EXISTS public.rate_limit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_pattern TEXT NOT NULL UNIQUE,
  max_requests INTEGER DEFAULT 100,
  window_seconds INTEGER DEFAULT 60,
  block_duration_seconds INTEGER DEFAULT 3600,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabela de MFA (Autenticação Multi-Fator)
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method TEXT DEFAULT 'totp',
  backup_codes TEXT[],
  last_verified_at TIMESTAMP WITH TIME ZONE,
  recovery_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Tabela de Sessões Ativas
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  location JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Tabela de Tokens de Recuperação de Senha
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Tabela de Verificação de Email
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Tabela de Alertas de Rate Limit
CREATE TABLE IF NOT EXISTS public.rate_limit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  severity TEXT DEFAULT 'warning',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- FUNÇÕES DE SEGURANÇA
-- =====================================================

-- Função para verificar se usuário tem role específica (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND p.name = _permission_name
  )
$$;

-- Função para obter todas as roles do usuário
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
$$;

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _ip_address TEXT,
  _endpoint TEXT,
  _user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_current_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_is_blocked BOOLEAN;
BEGIN
  -- Buscar configurações do endpoint
  SELECT * INTO v_settings
  FROM public.rate_limit_settings
  WHERE _endpoint LIKE endpoint_pattern
    AND is_enabled = true
  ORDER BY LENGTH(endpoint_pattern) DESC
  LIMIT 1;
  
  -- Se não encontrar configuração, usar padrão
  IF NOT FOUND THEN
    v_settings.max_requests := 100;
    v_settings.window_seconds := 60;
    v_settings.block_duration_seconds := 3600;
  END IF;
  
  v_window_start := now() - (v_settings.window_seconds || ' seconds')::interval;
  
  -- Contar requests na janela
  SELECT COALESCE(SUM(request_count), 0), bool_or(is_blocked)
  INTO v_current_count, v_is_blocked
  FROM public.rate_limit_logs
  WHERE ip_address = _ip_address
    AND endpoint = _endpoint
    AND created_at > v_window_start;
  
  -- Verificar se está bloqueado
  IF v_is_blocked THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'IP blocked due to rate limit violation',
      'retry_after', v_settings.block_duration_seconds
    );
  END IF;
  
  -- Verificar se excedeu limite
  IF v_current_count >= v_settings.max_requests THEN
    -- Bloquear IP
    INSERT INTO public.rate_limit_logs (
      user_id, ip_address, endpoint, request_count, is_blocked, block_reason
    ) VALUES (
      _user_id, _ip_address, _endpoint, 1, true, 'Rate limit exceeded'
    );
    
    -- Criar alerta
    INSERT INTO public.rate_limit_alerts (
      user_id, ip_address, endpoint, request_count, threshold, severity
    ) VALUES (
      _user_id, _ip_address, _endpoint, v_current_count, v_settings.max_requests, 'critical'
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Rate limit exceeded',
      'retry_after', v_settings.block_duration_seconds
    );
  END IF;
  
  -- Registrar request
  INSERT INTO public.rate_limit_logs (
    user_id, ip_address, endpoint, request_count
  ) VALUES (
    _user_id, _ip_address, _endpoint, 1
  );
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_settings.max_requests - v_current_count - 1,
    'reset', EXTRACT(EPOCH FROM (v_window_start + (v_settings.window_seconds || ' seconds')::interval))
  );
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view role_permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage role_permissions"
  ON public.role_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- rate_limit_logs
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate_limit_logs"
  ON public.rate_limit_logs FOR SELECT
  USING (is_admin_or_supervisor());

CREATE POLICY "System can insert rate_limit_logs"
  ON public.rate_limit_logs FOR INSERT
  WITH CHECK (true);

-- rate_limit_settings
ALTER TABLE public.rate_limit_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rate_limit_settings"
  ON public.rate_limit_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view rate_limit_settings"
  ON public.rate_limit_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- user_mfa_settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MFA settings"
  ON public.user_mfa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings"
  ON public.user_mfa_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA settings"
  ON public.user_mfa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all MFA settings"
  ON public.user_mfa_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- active_sessions
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.active_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions"
  ON public.active_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.active_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage password_reset_tokens"
  ON public.password_reset_tokens FOR ALL
  USING (true);

-- email_verification_tokens
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage email_verification_tokens"
  ON public.email_verification_tokens FOR ALL
  USING (true);

-- rate_limit_alerts
ALTER TABLE public.rate_limit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate_limit_alerts"
  ON public.rate_limit_alerts FOR SELECT
  USING (is_admin_or_supervisor());

CREATE POLICY "System can insert rate_limit_alerts"
  ON public.rate_limit_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update rate_limit_alerts"
  ON public.rate_limit_alerts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip ON public.rate_limit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created ON public.rate_limit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON public.active_sessions(session_token);

-- =====================================================
-- PERMISSÕES PADRÃO
-- =====================================================

INSERT INTO public.permissions (name, description, module, action) VALUES
  ('users.view', 'Visualizar usuários', 'users', 'view'),
  ('users.create', 'Criar usuários', 'users', 'create'),
  ('users.edit', 'Editar usuários', 'users', 'edit'),
  ('users.delete', 'Excluir usuários', 'users', 'delete'),
  ('roles.manage', 'Gerenciar roles', 'roles', 'manage'),
  ('contacts.view', 'Visualizar contatos', 'contacts', 'view'),
  ('contacts.edit', 'Editar contatos', 'contacts', 'edit'),
  ('contacts.delete', 'Excluir contatos', 'contacts', 'delete'),
  ('calls.view', 'Visualizar chamadas', 'calls', 'view'),
  ('calls.manage', 'Gerenciar chamadas', 'calls', 'manage'),
  ('reports.view', 'Visualizar relatórios', 'reports', 'view'),
  ('reports.export', 'Exportar relatórios', 'reports', 'export'),
  ('settings.view', 'Visualizar configurações', 'settings', 'view'),
  ('settings.edit', 'Editar configurações', 'settings', 'edit'),
  ('security.view', 'Visualizar segurança', 'security', 'view'),
  ('security.manage', 'Gerenciar segurança', 'security', 'manage'),
  ('audit.view', 'Visualizar auditoria', 'audit', 'view'),
  ('dialer.use', 'Usar discador', 'dialer', 'use'),
  ('dialer.manage', 'Gerenciar discador', 'dialer', 'manage'),
  ('coaching.view', 'Visualizar coaching', 'coaching', 'view'),
  ('coaching.manage', 'Gerenciar coaching', 'coaching', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Atribuir permissões para admin
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Atribuir permissões para supervisor
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'supervisor', id FROM public.permissions
WHERE name IN (
  'users.view', 'contacts.view', 'contacts.edit', 'calls.view', 'calls.manage',
  'reports.view', 'reports.export', 'coaching.view', 'coaching.manage',
  'dialer.use', 'dialer.manage', 'settings.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Atribuir permissões para agent
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'agent', id FROM public.permissions
WHERE name IN (
  'contacts.view', 'calls.view', 'coaching.view', 'dialer.use'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Rate limit settings padrão
INSERT INTO public.rate_limit_settings (endpoint_pattern, max_requests, window_seconds, block_duration_seconds) VALUES
  ('/api/%', 1000, 60, 3600),
  ('/auth/%', 10, 60, 7200),
  ('/login', 5, 60, 7200),
  ('/register', 3, 3600, 86400)
ON CONFLICT (endpoint_pattern) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_security_updated_at();

DROP TRIGGER IF EXISTS update_user_mfa_settings_updated_at ON public.user_mfa_settings;
CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON public.user_mfa_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_security_updated_at();

DROP TRIGGER IF EXISTS update_rate_limit_settings_updated_at ON public.rate_limit_settings;
CREATE TRIGGER update_rate_limit_settings_updated_at
  BEFORE UPDATE ON public.rate_limit_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_security_updated_at();
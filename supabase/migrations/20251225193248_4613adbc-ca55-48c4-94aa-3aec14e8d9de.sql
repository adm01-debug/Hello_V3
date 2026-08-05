-- Tabela para whitelist global de IPs
CREATE TABLE public.ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  description text,
  is_cidr boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text,
  UNIQUE(ip_address)
);

-- Tabela para configurar restrição de IP por usuário
CREATE TABLE public.user_ip_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela para IPs permitidos por usuário (opcional, para IPs específicos do usuário)
CREATE TABLE public.user_allowed_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  description text,
  is_cidr boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, ip_address)
);

-- Tabela para log de tentativas de acesso bloqueadas
CREATE TABLE public.blocked_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  ip_address text NOT NULL,
  reason text NOT NULL,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ip_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allowed_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_access_logs ENABLE ROW LEVEL SECURITY;

-- Policies para ip_whitelist (apenas admins)
CREATE POLICY "Admins can manage ip_whitelist" ON public.ip_whitelist
FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Authenticated can view ip_whitelist" ON public.ip_whitelist
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies para user_ip_restrictions (apenas admins podem gerenciar)
CREATE POLICY "Admins can manage user_ip_restrictions" ON public.user_ip_restrictions
FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Users can view own ip_restriction" ON public.user_ip_restrictions
FOR SELECT USING (auth.uid() = user_id);

-- Policies para user_allowed_ips (apenas admins)
CREATE POLICY "Admins can manage user_allowed_ips" ON public.user_allowed_ips
FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Users can view own allowed_ips" ON public.user_allowed_ips
FOR SELECT USING (auth.uid() = user_id);

-- Policies para blocked_access_logs (apenas admins)
CREATE POLICY "Admins can view blocked_access_logs" ON public.blocked_access_logs
FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "System can insert blocked_access_logs" ON public.blocked_access_logs
FOR INSERT WITH CHECK (true);

-- Função para verificar se IP está na whitelist (suporta CIDR)
CREATE OR REPLACE FUNCTION public.check_ip_allowed(
  p_user_id uuid,
  p_ip_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restriction_enabled boolean;
  v_ip_in_global_whitelist boolean;
  v_ip_in_user_whitelist boolean;
BEGIN
  -- Verificar se o usuário tem restrição de IP habilitada
  SELECT enabled INTO v_restriction_enabled
  FROM public.user_ip_restrictions
  WHERE user_id = p_user_id;
  
  -- Se não tem configuração ou está desabilitada, permitir acesso
  IF v_restriction_enabled IS NULL OR v_restriction_enabled = false THEN
    RETURN true;
  END IF;
  
  -- Verificar na whitelist global
  SELECT EXISTS (
    SELECT 1 FROM public.ip_whitelist
    WHERE 
      (is_cidr = false AND ip_address = p_ip_address)
      OR (is_cidr = true AND p_ip_address::inet <<= ip_address::inet)
  ) INTO v_ip_in_global_whitelist;
  
  IF v_ip_in_global_whitelist THEN
    RETURN true;
  END IF;
  
  -- Verificar na whitelist do usuário
  SELECT EXISTS (
    SELECT 1 FROM public.user_allowed_ips
    WHERE user_id = p_user_id
      AND (
        (is_cidr = false AND ip_address = p_ip_address)
        OR (is_cidr = true AND p_ip_address::inet <<= ip_address::inet)
      )
  ) INTO v_ip_in_user_whitelist;
  
  RETURN v_ip_in_user_whitelist;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_ip_restrictions_updated_at
BEFORE UPDATE ON public.user_ip_restrictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
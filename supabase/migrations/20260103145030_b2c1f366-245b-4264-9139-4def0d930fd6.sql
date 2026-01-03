
-- =============================================
-- DNC (Do Not Call) COMPLIANCE SYSTEM
-- =============================================

-- 1. Lista DNC Global
CREATE TABLE public.dnc_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  phone_normalized TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'manual',
  source TEXT NOT NULL DEFAULT 'manual',
  added_by TEXT,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT dnc_phone_unique UNIQUE (phone_normalized)
);

-- 2. Logs de Importação DNC
CREATE TABLE public.dnc_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  imported_records INTEGER NOT NULL DEFAULT 0,
  duplicate_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  imported_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_details JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Configuração de Horários de Discagem por Região
CREATE TABLE public.calling_hours_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  weekday_start TIME NOT NULL DEFAULT '08:00:00',
  weekday_end TIME NOT NULL DEFAULT '21:00:00',
  saturday_start TIME,
  saturday_end TIME,
  sunday_allowed BOOLEAN NOT NULL DEFAULT false,
  sunday_start TIME,
  sunday_end TIME,
  holidays_allowed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT calling_hours_region_unique UNIQUE (region_code)
);

-- 4. Feriados Nacionais/Regionais
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  region_code TEXT,
  is_national BOOLEAN NOT NULL DEFAULT false,
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Histórico de Consentimento (LGPD)
CREATE TABLE public.consent_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_method TEXT NOT NULL,
  consent_text TEXT,
  ip_address TEXT,
  user_agent TEXT,
  recorded_by TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Configurações de Compliance
CREATE TABLE public.compliance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.compliance_settings (setting_key, setting_value, description) VALUES
  ('dnc_enabled', 'true', 'Habilitar verificação DNC antes de discar'),
  ('calling_hours_enabled', 'true', 'Habilitar restrição de horários de discagem'),
  ('lgpd_consent_required', 'true', 'Exigir consentimento LGPD para marketing'),
  ('max_attempts_per_day', '3', 'Máximo de tentativas por número por dia'),
  ('min_interval_between_calls', '60', 'Intervalo mínimo entre ligações (minutos)'),
  ('auto_add_complaint_to_dnc', 'true', 'Adicionar automaticamente reclamações à lista DNC');

-- Inserir horários padrão Brasil
INSERT INTO public.calling_hours_config (region_code, region_name, timezone, weekday_start, weekday_end, saturday_start, saturday_end) VALUES
  ('BR', 'Brasil - Padrão', 'America/Sao_Paulo', '08:00:00', '21:00:00', '09:00:00', '14:00:00'),
  ('BR-SP', 'São Paulo', 'America/Sao_Paulo', '08:00:00', '21:00:00', '09:00:00', '14:00:00'),
  ('BR-RJ', 'Rio de Janeiro', 'America/Sao_Paulo', '08:00:00', '21:00:00', '09:00:00', '14:00:00'),
  ('BR-AM', 'Amazonas', 'America/Manaus', '08:00:00', '21:00:00', '09:00:00', '14:00:00'),
  ('BR-AC', 'Acre', 'America/Rio_Branco', '08:00:00', '21:00:00', '09:00:00', '14:00:00');

-- Inserir feriados nacionais 2024/2025
INSERT INTO public.holidays (name, date, is_national, recurring) VALUES
  ('Confraternização Universal', '2025-01-01', true, true),
  ('Carnaval', '2025-03-03', true, false),
  ('Carnaval', '2025-03-04', true, false),
  ('Sexta-feira Santa', '2025-04-18', true, false),
  ('Tiradentes', '2025-04-21', true, true),
  ('Dia do Trabalho', '2025-05-01', true, true),
  ('Corpus Christi', '2025-06-19', true, false),
  ('Independência do Brasil', '2025-09-07', true, true),
  ('Nossa Senhora Aparecida', '2025-10-12', true, true),
  ('Finados', '2025-11-02', true, true),
  ('Proclamação da República', '2025-11-15', true, true),
  ('Natal', '2025-12-25', true, true);

-- Índices para performance
CREATE INDEX idx_dnc_phone_normalized ON public.dnc_list(phone_normalized);
CREATE INDEX idx_dnc_active ON public.dnc_list(is_active) WHERE is_active = true;
CREATE INDEX idx_consent_contact ON public.consent_history(contact_id);
CREATE INDEX idx_consent_phone ON public.consent_history(phone);
CREATE INDEX idx_holidays_date ON public.holidays(date);
CREATE INDEX idx_calling_hours_region ON public.calling_hours_config(region_code);

-- Enable RLS
ALTER TABLE public.dnc_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dnc_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calling_hours_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- DNC List: Supervisores podem gerenciar, todos autenticados podem visualizar
CREATE POLICY "Authenticated can view dnc_list" ON public.dnc_list
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can manage dnc_list" ON public.dnc_list
  FOR ALL USING (is_admin_or_supervisor());

-- Import Logs
CREATE POLICY "Supervisors can view dnc_import_logs" ON public.dnc_import_logs
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Supervisors can insert dnc_import_logs" ON public.dnc_import_logs
  FOR INSERT WITH CHECK (is_admin_or_supervisor());

-- Calling Hours Config
CREATE POLICY "Authenticated can view calling_hours_config" ON public.calling_hours_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage calling_hours_config" ON public.calling_hours_config
  FOR ALL USING (is_admin_or_supervisor());

-- Holidays
CREATE POLICY "Authenticated can view holidays" ON public.holidays
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage holidays" ON public.holidays
  FOR ALL USING (is_admin_or_supervisor());

-- Consent History
CREATE POLICY "Supervisors can view consent_history" ON public.consent_history
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Authenticated can insert consent_history" ON public.consent_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Compliance Settings
CREATE POLICY "Authenticated can view compliance_settings" ON public.compliance_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage compliance_settings" ON public.compliance_settings
  FOR ALL USING (is_admin_or_supervisor());

-- Função para verificar se número está na lista DNC
CREATE OR REPLACE FUNCTION public.check_dnc(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_normalized TEXT;
  v_in_dnc BOOLEAN;
BEGIN
  -- Normaliza o telefone (remove caracteres não numéricos)
  v_normalized := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Verifica se está na lista DNC ativa
  SELECT EXISTS (
    SELECT 1 FROM public.dnc_list
    WHERE phone_normalized = v_normalized
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_in_dnc;
  
  RETURN v_in_dnc;
END;
$$;

-- Função para verificar se pode ligar no horário atual
CREATE OR REPLACE FUNCTION public.check_calling_hours(p_region_code TEXT DEFAULT 'BR')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_config RECORD;
  v_current_time TIME;
  v_current_dow INTEGER;
  v_is_holiday BOOLEAN;
  v_can_call BOOLEAN := false;
  v_reason TEXT;
BEGIN
  -- Busca configuração da região
  SELECT * INTO v_config
  FROM public.calling_hours_config
  WHERE region_code = p_region_code AND is_active = true;
  
  IF NOT FOUND THEN
    -- Usa configuração padrão Brasil
    SELECT * INTO v_config
    FROM public.calling_hours_config
    WHERE region_code = 'BR' AND is_active = true;
  END IF;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_call', true, 'reason', 'No config found, allowing');
  END IF;
  
  -- Horário atual na timezone da região
  v_current_time := (now() AT TIME ZONE v_config.timezone)::TIME;
  v_current_dow := EXTRACT(DOW FROM (now() AT TIME ZONE v_config.timezone));
  
  -- Verifica se é feriado
  SELECT EXISTS (
    SELECT 1 FROM public.holidays
    WHERE date = (now() AT TIME ZONE v_config.timezone)::DATE
      AND (is_national = true OR region_code = p_region_code)
  ) INTO v_is_holiday;
  
  IF v_is_holiday AND NOT v_config.holidays_allowed THEN
    RETURN jsonb_build_object(
      'can_call', false,
      'reason', 'Hoje é feriado - ligações não permitidas'
    );
  END IF;
  
  -- Verifica dia da semana
  CASE v_current_dow
    WHEN 0 THEN -- Domingo
      IF v_config.sunday_allowed AND v_config.sunday_start IS NOT NULL THEN
        v_can_call := v_current_time BETWEEN v_config.sunday_start AND v_config.sunday_end;
        v_reason := 'Domingo: ' || v_config.sunday_start || ' - ' || v_config.sunday_end;
      ELSE
        v_can_call := false;
        v_reason := 'Ligações não permitidas aos domingos';
      END IF;
    WHEN 6 THEN -- Sábado
      IF v_config.saturday_start IS NOT NULL THEN
        v_can_call := v_current_time BETWEEN v_config.saturday_start AND v_config.saturday_end;
        v_reason := 'Sábado: ' || v_config.saturday_start || ' - ' || v_config.saturday_end;
      ELSE
        v_can_call := false;
        v_reason := 'Ligações não permitidas aos sábados';
      END IF;
    ELSE -- Dias úteis
      v_can_call := v_current_time BETWEEN v_config.weekday_start AND v_config.weekday_end;
      v_reason := 'Dias úteis: ' || v_config.weekday_start || ' - ' || v_config.weekday_end;
  END CASE;
  
  RETURN jsonb_build_object(
    'can_call', v_can_call,
    'reason', v_reason,
    'current_time', v_current_time,
    'timezone', v_config.timezone,
    'day_of_week', v_current_dow
  );
END;
$$;

-- Função para adicionar número à lista DNC
CREATE OR REPLACE FUNCTION public.add_to_dnc(
  p_phone TEXT,
  p_reason TEXT DEFAULT 'manual',
  p_source TEXT DEFAULT 'manual',
  p_notes TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_normalized TEXT;
  v_id UUID;
  v_user_email TEXT;
BEGIN
  -- Normaliza o telefone
  v_normalized := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Pega email do usuário atual
  SELECT email INTO v_user_email FROM public.user_profiles WHERE id = auth.uid();
  
  -- Insere ou atualiza
  INSERT INTO public.dnc_list (phone, phone_normalized, reason, source, notes, expires_at, added_by)
  VALUES (p_phone, v_normalized, p_reason, p_source, p_notes, p_expires_at, v_user_email)
  ON CONFLICT (phone_normalized) DO UPDATE
  SET reason = EXCLUDED.reason,
      source = EXCLUDED.source,
      notes = COALESCE(EXCLUDED.notes, dnc_list.notes),
      expires_at = EXCLUDED.expires_at,
      is_active = true,
      updated_at = now()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_dnc_list_updated_at
  BEFORE UPDATE ON public.dnc_list
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calling_hours_updated_at
  BEFORE UPDATE ON public.calling_hours_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_settings_updated_at
  BEFORE UPDATE ON public.compliance_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

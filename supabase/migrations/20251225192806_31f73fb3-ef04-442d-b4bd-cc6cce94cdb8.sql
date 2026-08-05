-- Habilitar realtime para audit_logs
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- Criar tabela para alertas de segurança
CREATE TABLE public.security_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  description text NOT NULL,
  source_user_id uuid,
  source_user_email text,
  trigger_data jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver e gerenciar alertas de segurança
CREATE POLICY "Admins can view security_alerts" ON public.security_alerts
FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can insert security_alerts" ON public.security_alerts
FOR INSERT WITH CHECK (get_user_role() = 'admin' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update security_alerts" ON public.security_alerts
FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete security_alerts" ON public.security_alerts
FOR DELETE USING (get_user_role() = 'admin');

-- Habilitar realtime
ALTER TABLE public.security_alerts REPLICA IDENTITY FULL;

-- Função para detectar padrões suspeitos e criar alertas
CREATE OR REPLACE FUNCTION public.check_suspicious_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count integer;
  export_count integer;
BEGIN
  -- Verificar acesso excessivo a contatos (mais de 50 em 5 minutos)
  SELECT COUNT(*) INTO access_count
  FROM public.audit_logs
  WHERE user_id = NEW.user_id
    AND resource_type = 'contact'
    AND action = 'view'
    AND created_at > now() - interval '5 minutes';
  
  IF access_count > 50 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      title,
      description,
      source_user_id,
      source_user_email,
      trigger_data
    ) VALUES (
      'excessive_access',
      'critical',
      'Acesso excessivo a contatos detectado',
      'Usuário acessou mais de 50 contatos em 5 minutos',
      NEW.user_id,
      NEW.user_email,
      jsonb_build_object('access_count', access_count, 'time_window', '5 minutes')
    );
  END IF;
  
  -- Verificar exportações em massa (mais de 3 em 10 minutos)
  SELECT COUNT(*) INTO export_count
  FROM public.audit_logs
  WHERE user_id = NEW.user_id
    AND action = 'export'
    AND created_at > now() - interval '10 minutes';
  
  IF export_count > 3 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      title,
      description,
      source_user_id,
      source_user_email,
      trigger_data
    ) VALUES (
      'mass_export',
      'critical',
      'Exportação em massa detectada',
      'Usuário realizou múltiplas exportações em curto período',
      NEW.user_id,
      NEW.user_email,
      jsonb_build_object('export_count', export_count, 'time_window', '10 minutes')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para verificar atividade suspeita
CREATE TRIGGER check_suspicious_activity_trigger
AFTER INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.check_suspicious_activity();
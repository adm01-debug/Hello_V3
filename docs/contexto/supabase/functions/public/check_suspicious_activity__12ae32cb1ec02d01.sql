CREATE OR REPLACE FUNCTION public.check_suspicious_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

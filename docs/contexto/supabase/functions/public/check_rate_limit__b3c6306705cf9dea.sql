CREATE OR REPLACE FUNCTION public.check_rate_limit(_ip_address text, _endpoint text, _user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

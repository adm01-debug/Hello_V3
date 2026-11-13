CREATE OR REPLACE FUNCTION public.check_calling_hours(p_region_code text DEFAULT 'BR'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

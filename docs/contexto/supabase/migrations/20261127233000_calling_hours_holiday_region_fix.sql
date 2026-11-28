-- Corrige o vazamento de feriado entre paises em check_calling_hours.
--
-- Antes: `WHERE (h.is_national = true OR h.region_code = p_region_code)`. Como o
-- seed marca TODO feriado com is_national = true, qualquer feriado de outro pais
-- bloqueava a operacao: em 2026-11-26 (Thanksgiving, holidays.region_code = 'US',
-- is_national = true) `check_calling_hours('BR')` devolveu
-- can_call = false / 'Hoje e feriado' e a discagem ficou bloqueada no Brasil
-- (diag em producao, run 45922098634). A migration 20261122370000 ja tinha
-- corrigido isso com `h.region_code = v_config.region_code`, mas a
-- 20261125190000 (fail-closed) reintroduziu o predicado antigo ao recriar a funcao.
--
-- Agora: feriado so casa quando pertence a regiao consultada (h.region_code =
-- v_config.region_code) ou quando e nacional sem regiao (h.region_code IS NULL AND
-- h.is_national) — que e como a tela grava feriado nacional
-- (src/components/compliance/HolidaysManager.tsx:46). Fail-closed, fuso horario,
-- recurring e holidays_allowed seguem identicos.

CREATE OR REPLACE FUNCTION public.check_calling_hours(p_region_code text DEFAULT 'BR'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_config RECORD;
  v_current_time TIME;
  v_current_date DATE;
  v_current_dow INTEGER;
  v_is_holiday BOOLEAN;
  v_can_call BOOLEAN := false;
  v_reason TEXT;
BEGIN
  SELECT * INTO v_config
  FROM public.calling_hours_config
  WHERE region_code = p_region_code AND is_active = true;

  IF NOT FOUND THEN
    SELECT * INTO v_config
    FROM public.calling_hours_config
    WHERE region_code = 'BR' AND is_active = true;
  END IF;

  IF NOT FOUND THEN
    -- Fail-closed: sem janela configurada nao existe horario legal conhecido.
    RETURN jsonb_build_object(
      'can_call', false,
      'reason', 'Sem configuração de horário para a região — discagem bloqueada por segurança'
    );
  END IF;

  v_current_time := (now() AT TIME ZONE v_config.timezone)::TIME;
  v_current_date := (now() AT TIME ZONE v_config.timezone)::DATE;
  v_current_dow := EXTRACT(DOW FROM (now() AT TIME ZONE v_config.timezone));

  SELECT EXISTS (
    SELECT 1 FROM public.holidays h
    WHERE (
        h.region_code = v_config.region_code
        OR (h.region_code IS NULL AND h.is_national)
      )
      AND (
        h.date = v_current_date
        OR (h.recurring AND EXTRACT(MONTH FROM h.date) = EXTRACT(MONTH FROM v_current_date)
                        AND EXTRACT(DAY FROM h.date) = EXTRACT(DAY FROM v_current_date))
      )
  ) INTO v_is_holiday;

  IF v_is_holiday AND NOT v_config.holidays_allowed THEN
    RETURN jsonb_build_object(
      'can_call', false,
      'reason', 'Hoje é feriado — ligações não permitidas'
    );
  END IF;

  CASE v_current_dow
    WHEN 0 THEN
      IF v_config.sunday_allowed AND v_config.sunday_start IS NOT NULL THEN
        v_can_call := v_current_time BETWEEN v_config.sunday_start AND v_config.sunday_end;
        v_reason := 'Domingo: ' || v_config.sunday_start || ' às ' || v_config.sunday_end;
      ELSE
        v_can_call := false;
        v_reason := 'Ligações não permitidas aos domingos';
      END IF;
    WHEN 6 THEN
      IF v_config.saturday_start IS NOT NULL THEN
        v_can_call := v_current_time BETWEEN v_config.saturday_start AND v_config.saturday_end;
        v_reason := 'Sábado: ' || v_config.saturday_start || ' às ' || v_config.saturday_end;
      ELSE
        v_can_call := false;
        v_reason := 'Ligações não permitidas aos sábados';
      END IF;
    ELSE
      v_can_call := v_current_time BETWEEN v_config.weekday_start AND v_config.weekday_end;
      v_reason := 'Dias úteis: ' || v_config.weekday_start || ' às ' || v_config.weekday_end;
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

comment on function public.check_calling_hours(text) is
  'Etapa 035 + 122 + 126. Decide se a discagem e permitida agora. Fail-closed: sem calling_hours_config ativa para a regiao (nem BR como fallback) devolve can_call = false. Feriado: so conta feriado da regiao consultada (holidays.region_code) ou nacional sem regiao (region_code IS NULL e is_national); compara a data exata OU, quando holidays.recurring, mes e dia em qualquer ano; respeita calling_hours_config.holidays_allowed. Limitacao conhecida: feriado movel (Carnaval, Pascoa, Corpus Christi) nao e calculado — precisa ser cadastrado em holidays por ano, com recurring = false.'

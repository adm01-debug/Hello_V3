CREATE OR REPLACE FUNCTION public.check_dnc(p_phone text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

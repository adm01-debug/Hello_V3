CREATE OR REPLACE FUNCTION public.check_ip_allowed(p_user_id uuid, p_ip_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$

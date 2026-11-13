CREATE OR REPLACE FUNCTION public.check_ip_in_cidr(p_ip text, p_cidr text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN p_ip::inet <<= p_cidr::inet;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$

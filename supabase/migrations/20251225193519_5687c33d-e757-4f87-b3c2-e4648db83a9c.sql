-- Função para verificar se um IP está dentro de um range CIDR
CREATE OR REPLACE FUNCTION public.check_ip_in_cidr(
  p_ip text,
  p_cidr text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN p_ip::inet <<= p_cidr::inet;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
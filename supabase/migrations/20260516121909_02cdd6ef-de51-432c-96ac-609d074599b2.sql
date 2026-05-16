-- 1. Restringir execução de funções SECURITY DEFINER apenas para o sistema/admins
REVOKE EXECUTE ON FUNCTION public.cleanup_old_logs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_logs() FROM anon;

-- 2. Definir search_path seguro para as funções críticas
ALTER FUNCTION public.cleanup_old_logs() SET search_path = public;

-- 3. Atualizar is_admin_or_supervisor para ser mais segura
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Proteção extra para audit_logs
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

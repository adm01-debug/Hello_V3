-- Atualizar função para fixar o search_path
ALTER FUNCTION public.log_critical_rls_event() SET search_path = public;

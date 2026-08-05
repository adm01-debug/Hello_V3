-- Fix linter warning by setting search_path and revoking public execute
ALTER FUNCTION public.log_rls_event(text, text, jsonb) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_rls_event(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_rls_event(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_rls_event(text, text, jsonb) TO service_role;

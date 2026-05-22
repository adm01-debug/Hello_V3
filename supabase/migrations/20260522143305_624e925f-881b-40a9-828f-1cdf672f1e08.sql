ALTER FUNCTION public.match_kb_articles(extensions.vector, double precision, integer, uuid) SET search_path = public;
ALTER FUNCTION public.check_rls_enabled(text) SET search_path = public;
ALTER FUNCTION public.handle_kb_article_change() SET search_path = public;

-- Revoke execute on internal maintenance functions
REVOKE EXECUTE ON FUNCTION public.check_all_tables_rls_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_challenges() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rls_enabled(text) FROM anon, authenticated;

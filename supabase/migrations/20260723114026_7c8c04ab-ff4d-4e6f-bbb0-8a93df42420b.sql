REVOKE EXECUTE ON FUNCTION public.trigger_auto_scorecard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_auto_scorecard() TO service_role;
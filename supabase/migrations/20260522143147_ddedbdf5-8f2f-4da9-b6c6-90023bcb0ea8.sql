-- Move extensions to a dedicated schema
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
    ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
    ALTER EXTENSION "pg_trgm" SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
    ALTER EXTENSION "vector" SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Update search_path for all custom functions in public schema
ALTER FUNCTION public.cleanup_old_data() SET search_path = public;
ALTER FUNCTION public.get_user_agent_name() SET search_path = public;
ALTER FUNCTION public.get_user_roles(uuid) SET search_path = public;
ALTER FUNCTION public.bridge_voip_alert_to_notification() SET search_path = public;
ALTER FUNCTION public.record_failed_login(text, text, text) SET search_path = public;
ALTER FUNCTION public.record_trunk_usage(uuid, uuid, timestamptz, timestamptz, boolean, text, uuid) SET search_path = public;
ALTER FUNCTION public.check_all_tables_rls_status() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.can_access_agent_data(text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.audit_table_change() SET search_path = public;
ALTER FUNCTION public.get_queue_stats() SET search_path = public;
ALTER FUNCTION public.check_calling_hours(text) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_challenges() SET search_path = public;
ALTER FUNCTION public.update_security_updated_at() SET search_path = public;
ALTER FUNCTION public.get_auth_agent_id() SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.get_dashboard_stats() SET search_path = public;
ALTER FUNCTION public.get_call_volume_stats() SET search_path = public;
ALTER FUNCTION public.get_agents_with_active_calls() SET search_path = public;

-- Revoke execute on SECURITY DEFINER functions from anon/authenticated if not needed
REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_all_tables_rls_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_challenges() FROM anon, authenticated;

-- Ensure RLS is enabled on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

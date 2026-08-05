-- Revoke EXECUTE from public (which includes anon and authenticated) by default
-- for all functions in public schema. 
-- Note: PostgreSQL by default grants EXECUTE to PUBLIC on new functions.
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC;', f.proname, f.args);
    END LOOP;
END $$;

-- Re-grant EXECUTE to authenticated role for necessary functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agent_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_agent_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agent_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_supervisor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_supervisor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_agent(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_call_volume_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agents_with_active_calls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_calling_hours(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_dnc(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, jsonb) TO authenticated;

-- Grant EXECUTE to anon for login-related functions
GRANT EXECUTE ON FUNCTION public.check_login_lockout(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_successful_login(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ip_allowed(uuid, text) TO anon, authenticated;


-- ============================================================
-- HARDENING: Revoke EXECUTE on SECURITY DEFINER functions
-- ============================================================

-- 1) Trigger / cleanup / internal-only functions: revoke from EVERYONE
--    (only the DB engine itself / cron / SECURITY DEFINER context needs them)
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'audit_table_change()',
    'bridge_voip_alert_to_notification()',
    'check_suspicious_activity()',
    'enforce_optimistic_lock()',
    'handle_kb_article_history()',
    'handle_new_user()',
    'log_critical_rls_event()',
    'notify_lock_conflict_hotspot()',
    'notify_trunk_offline()',
    'prevent_role_escalation()',
    'process_audit_log()',
    'update_kb_article_search_vector()',
    'update_security_updated_at()',
    'update_transcript_search_vector()',
    'update_updated_at_column()',
    'validate_audit_insert()',
    'cleanup_old_logs()',
    'cleanup_old_data()',
    'cleanup_expired_challenges()',
    'notify_bloat_hotspots()',
    'notify_idle_indexes()',
    'notify_webhook_failure_spike()',
    'notify_suspicious_index_drop_activity()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip (missing): %', fn;
    END;
  END LOOP;
END $$;

-- 2) Admin / diagnostic RPCs: keep authenticated (admin check is inside the fn),
--    revoke anon + PUBLIC
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'get_database_health_snapshot()',
    'get_top_slow_queries(integer)',
    'check_table_bloat()',
    'check_idle_indexes()',
    'reset_public_index_stats()',
    'log_index_drop_copy(text, text)',
    'check_ip_in_cidr(text, text)',
    'check_all_tables_rls_status()',
    'check_rls_enabled(text)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip (missing): %', fn;
    END;
  END LOOP;
END $$;

-- 3) Everything else that is currently anon-executable but should not be:
--    revoke anon; keep authenticated (RLS / app calls).
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'add_to_dnc(text, text, text, text, timestamp with time zone)',
    'can_access_agent_data(text)',
    'check_calling_hours(text)',
    'check_dnc(text)',
    'check_ip_allowed(uuid, text)',
    'check_rate_limit(text, text, uuid)',
    'get_agent_performance()',
    'get_agents_with_active_calls()',
    'get_auth_agent_id()',
    'get_call_history_with_summaries(integer, integer, text, text, text)',
    'get_call_volume_stats()',
    'get_dashboard_stats()',
    'get_profile_role(uuid)',
    'get_queue_stats()',
    'get_user_agent_id()',
    'get_user_agent_name()',
    'get_user_role()',
    'get_user_roles(uuid)',
    'has_permission(uuid, text)',
    'has_role(uuid, app_role)',
    'is_active_agent(text)',
    'is_admin()',
    'is_admin_or_supervisor()',
    'is_admin_user(uuid)',
    'is_supervisor()',
    'log_audit_event(text, text, text, jsonb)',
    'log_rls_event(text, text, jsonb)',
    'record_trunk_usage(uuid, uuid, timestamp with time zone, timestamp with time zone, boolean, text, uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip (missing): %', fn;
    END;
  END LOOP;
END $$;

-- 4) Pre-auth flows: keep anon + authenticated (login lockout must be callable
--    before the user is signed in)
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'check_login_lockout(text)',
    'record_failed_login(text, text, text)',
    'record_successful_login(text, text, text)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip (missing): %', fn;
    END;
  END LOOP;
END $$;

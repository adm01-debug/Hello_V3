
-- Onda A2: REVOKE EXECUTE em funções SECURITY DEFINER
-- Estratégia: revogar de PUBLIC e anon em TODAS; manter authenticated apenas em funções RPC do cliente.

DO $$
DECLARE
  fn record;
  sig text;
  -- Funções callable pelo cliente autenticado (RPC ou usadas em RLS avaliada por authenticated)
  keep_authenticated text[] := ARRAY[
    'is_admin','is_admin_or_supervisor','is_supervisor','has_role','has_permission',
    'get_user_role','get_user_roles','get_auth_agent_id','get_user_agent_id','get_user_agent_name',
    'is_active_agent','can_access_agent_data','get_profile_role','is_admin_user',
    'get_agent_performance','get_agents_with_active_calls','get_call_volume_stats',
    'get_dashboard_stats','get_queue_stats','get_call_history_with_summaries',
    'get_agent_financial_leaderboard','check_dnc','add_to_dnc','check_calling_hours',
    'check_ip_allowed','check_ip_in_cidr','check_rate_limit','check_login_lockout',
    'record_failed_login','record_successful_login','log_audit_event','record_trunk_usage',
    'get_top_slow_queries','get_database_health_snapshot','check_all_tables_rls_status',
    'check_rls_enabled','check_idle_indexes','check_table_bloat','check_suspicious_activity'
  ];
BEGIN
  FOR fn IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    sig := format('public.%I(%s)', fn.proname, fn.args);

    -- Revogar de PUBLIC e anon sempre
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', sig);

    IF fn.proname = ANY(keep_authenticated) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', sig);
    ELSE
      -- Trigger/cron/interno: revogar também de authenticated
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', sig);
    END IF;

    -- service_role sempre pode (edge functions/admin)
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', sig);
  END LOOP;
END $$;

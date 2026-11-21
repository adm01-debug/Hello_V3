-- HARDENING: fecha os advisors de segurança medidos em produção (projeto cfmlmcdyjuotqobjapng).
-- Origem dos achados (medido, não suposto):
--   • 74/75 funções SECURITY DEFINER executáveis por anon — não por grant explícito ao role,
--     mas por GRANT EXECUTE ... TO PUBLIC herdado (73 OIDs com aclexplode(proacl).grantee = 0).
--     O registro anterior ('REVOKE em 62 funções') está refutado: 74 continuam executáveis.
--   • 3 views SECURITY DEFINER (index_usage, unused_indexes, migration_status) legíveis por anon.
--   • 4 funções com search_path mutável (suscetíveis a hijack de search_path).
--
-- Critério das listas abaixo (tudo derivado de pg_proc/pg_policies, não digitado à mão):
--   PRESERVADO para anon + authenticated: helpers de RLS/RPC usados pelo app e auth pré-login
--     (has_role, has_permission, is_admin*, get_user_*, can_access_agent_data,
--      check_login_lockout, record_failed/successful_login, check_dnc, check_calling_hours,
--      add_to_dnc, check_ip_allowed) e RPCs chamadas de src/ ou supabase/functions/.
--   REVOGADO de PUBLIC + anon mas MANTIDO em authenticated: nada aqui é chamado pelo app.
--   service_role mantém EXECUTE em todas (grant explícito confirmado nas 74).

-- ---------------------------------------------------------------------------
-- 1) Funções internas: tira EXECUTE de PUBLIC e anon
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.apply_migration(p_version character varying, p_name character varying, p_checksum character varying) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_role_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_table_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bridge_voip_alert_to_notification() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_suspicious_activity() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_table_bloat() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_logs() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_optimistic_lock() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_filter() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_call_queues_overview() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_kb_article_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_kb_article_history() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_critical_rls_event() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_bloat_hotspots() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_idle_indexes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_lock_conflict_hotspot() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_suspicious_index_drop_activity() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_trunk_offline() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_webhook_failure_spike() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.recalc_deal_health(p_deal_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reset_public_index_stats() FROM PUBLIC, anon;
-- rls_auto_enable() foi criada em produção fora do versionamento (não existe em supabase/migrations/).
-- Revoga só se existir, para não quebrar o banco sombra do Supabase Preview.
DO $$ BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon';
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.rollback_migration(p_version character varying, p_reason text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_deals_daily() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trg_recalc_deals_on_interaction() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trigger_auto_scorecard() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_kb_article_search_vector() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_saved_filters_updated_at() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_security_updated_at() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_transcript_search_vector() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_virtual_fax_ocr_vector() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_audit_insert() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_call_queue() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_park_orbit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_parked_call() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_queue_audio_slots() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_ring_group() FROM PUBLIC, anon;

-- ---------------------------------------------------------------------------
-- 2) Mesmas funções: tira EXECUTE de authenticated (nenhuma é chamada pela aplicação;
--    são triggers, notificadores, jobs de limpeza e diagnóstico de banco)
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.apply_migration(p_version character varying, p_name character varying, p_checksum character varying) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_role_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_table_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bridge_voip_alert_to_notification() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_suspicious_activity() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_table_bloat() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_logs() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_optimistic_lock() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_filter() FROM authenticated;
-- get_call_queues_overview: GRANT EXECUTE TO authenticated é intencional (migration de origem). Mantido.
REVOKE EXECUTE ON FUNCTION public.handle_kb_article_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_kb_article_history() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_critical_rls_event() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_bloat_hotspots() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_idle_indexes() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_lock_conflict_hotspot() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_suspicious_index_drop_activity() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_trunk_offline() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_webhook_failure_spike() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM authenticated;
-- recalc_deal_health: GRANT EXECUTE TO authenticated é intencional (migration de origem). Mantido.
REVOKE EXECUTE ON FUNCTION public.reset_public_index_stats() FROM authenticated;
DO $$ BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated';
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.rollback_migration(p_version character varying, p_reason text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_deals_daily() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_recalc_deals_on_interaction() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_auto_scorecard() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_kb_article_search_vector() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_saved_filters_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_security_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_transcript_search_vector() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_virtual_fax_ocr_vector() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_audit_insert() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_call_queue() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_park_orbit() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_parked_call() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_queue_audio_slots() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_ring_group() FROM authenticated;

-- ---------------------------------------------------------------------------
-- 3) Nada novo nasce exposto: default privileges de FUNCTIONS no schema public
-- ---------------------------------------------------------------------------
-- ATENÇÃO: a partir daqui, toda função NOVA em public nasce sem EXECUTE para PUBLIC.
-- Função destinada ao app (chamada por anon/authenticated via supabase.rpc) precisa de
-- GRANT EXECUTE explícito na própria migration, senão a RPC falha com 'permission denied'.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 4) Views SECURITY DEFINER -> security_invoker (rodam com os privilégios de quem consulta).
--    Nenhuma delas é usada por src/ ou supabase/functions/ (0 referências).
--    Continuam disponíveis para service_role e para o SQL editor (postgres).
-- ---------------------------------------------------------------------------
ALTER VIEW public.index_usage SET (security_invoker = true);
ALTER VIEW public.unused_indexes SET (security_invoker = true);
ALTER VIEW public.migration_status SET (security_invoker = true);
REVOKE ALL ON public.index_usage FROM anon, authenticated;
REVOKE ALL ON public.unused_indexes FROM anon, authenticated;
REVOKE ALL ON public.migration_status FROM anon, authenticated;
GRANT SELECT ON public.index_usage TO service_role;
GRANT SELECT ON public.unused_indexes TO service_role;
GRANT SELECT ON public.migration_status TO service_role;

-- financial_impact_daily já tem security_invoker = true (migration 20261114090555) e
-- GRANT SELECT para authenticated. Só faltava tirar o resíduo de anon.
REVOKE ALL ON public.financial_impact_daily FROM anon;

-- ---------------------------------------------------------------------------
-- 5) search_path fixo nas 4 funções sinalizadas pelo advisor
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.update_saved_filters_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.ensure_single_default_filter() SET search_path = public, pg_temp;
ALTER FUNCTION public.apply_migration(character varying, character varying, character varying) SET search_path = public, pg_temp;
ALTER FUNCTION public.rollback_migration(character varying, text) SET search_path = public, pg_temp;


-- ---------------------------------------------------------------------------
-- 7) Segunda onda: são RPCs legítimas do app, mas só fazem sentido para quem já
--    está autenticado (ou para uma edge com service_role). Chamador confirmado por
--    grep em src/ e supabase/functions/:
--      authenticated -> calculate_predictive_pace, get_agent_performance,
--        get_agent_financial_leaderboard, get_agents_with_active_calls,
--        get_call_history_with_summaries, get_call_volume_stats, get_dashboard_stats,
--        get_queue_stats, log_audit_event, log_index_drop_copy, record_trunk_usage,
--        expire_parked_calls, check_all_tables_rls_status, check_idle_indexes,
--        get_database_health_snapshot, get_top_slow_queries, log_rls_event
--      service_role  -> apply_predictive_pacing, check_ip_in_cidr,
--        cleanup_expired_challenges, check_rate_limit, check_rls_enabled
--    Nenhuma aparece em policy de RLS (verificado em pg_policies: 0 linhas).
--    Medido em aclexplode: todas têm EXECUTE explícito para PUBLIC, anon,
--    authenticated e service_role — por isso o REVOKE de anon sozinho não bastava.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.apply_predictive_pacing() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_predictive_pacing() TO service_role;
REVOKE EXECUTE ON FUNCTION public.calculate_predictive_pace(p_campaign_id uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_predictive_pace(p_campaign_id uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.check_all_tables_rls_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_all_tables_rls_status() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.check_idle_indexes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_idle_indexes() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.check_ip_in_cidr(p_ip text, p_cidr text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_ip_in_cidr(p_ip text, p_cidr text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(_ip_address text, _endpoint text, _user_id uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(_ip_address text, _endpoint text, _user_id uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.check_rls_enabled(table_name text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(table_name text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_challenges() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_challenges() TO service_role;
REVOKE EXECUTE ON FUNCTION public.expire_parked_calls() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_parked_calls() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_agent_financial_leaderboard(p_days integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agent_financial_leaderboard(p_days integer) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_agent_performance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agent_performance() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_agents_with_active_calls() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agents_with_active_calls() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_call_history_with_summaries(p_limit integer, p_offset integer, p_search text, p_status text, p_sentiment text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_call_history_with_summaries(p_limit integer, p_offset integer, p_search text, p_status text, p_sentiment text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_call_volume_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_call_volume_stats() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_database_health_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_database_health_snapshot() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_queue_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_queue_stats() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_top_slow_queries(p_limit integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_slow_queries(p_limit integer) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(p_action text, p_resource_type text, p_resource_id text, p_details jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(p_action text, p_resource_type text, p_resource_id text, p_details jsonb) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.log_index_drop_copy(p_index_name text, p_table_name text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_index_drop_copy(p_index_name text, p_table_name text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.log_rls_event(p_table_name text, p_operation text, p_details jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_rls_event(p_table_name text, p_operation text, p_details jsonb) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.record_trunk_usage(p_trunk_id uuid, p_call_session_id uuid, p_started_at timestamp with time zone, p_ended_at timestamp with time zone, p_was_failover boolean, p_failover_reason text, p_original_trunk_id uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_trunk_usage(p_trunk_id uuid, p_call_session_id uuid, p_started_at timestamp with time zone, p_ended_at timestamp with time zone, p_was_failover boolean, p_failover_reason text, p_original_trunk_id uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6) entity_versions: policy de leitura era USING (true) para o role PUBLIC,
--    o que expõe o histórico de alterações de todas as entidades a visitantes anônimos.
--    Restringe a usuários autenticados (a tabela não é referenciada no app hoje).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view versions" ON public.entity_versions;
CREATE POLICY "Authenticated can view versions" ON public.entity_versions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- A policy de INSERT também estava no role PUBLIC e aceitava changed_by IS NULL,
-- ou seja: qualquer visitante anônimo podia gravar uma versão sem autoria.
DROP POLICY IF EXISTS "Users can insert versions" ON public.entity_versions;
CREATE POLICY "Authenticated can insert versions" ON public.entity_versions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = changed_by);

-- ---------------------------------------------------------------------------
-- 8) Tabelas de controle de migration: RLS ligado, zero policies (nega por padrão).
--    Tornar explícito para que o linter `rls_enabled_no_policy` não fique em ERROR
--    e para que um GRANT futuro não as exponha por acidente.
--    Nenhuma referência em src/ ou supabase/functions/ (verificado).
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.schema_migrations FROM anon, authenticated;
REVOKE ALL ON public.migration_rollbacks FROM anon, authenticated;
GRANT SELECT ON public.schema_migrations TO service_role;
GRANT SELECT ON public.migration_rollbacks TO service_role;

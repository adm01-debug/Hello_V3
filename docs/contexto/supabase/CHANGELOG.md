# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

## 2026-11-22 03:16 UTC

- **colunas** adicionado (3): `public.__dbg.err`, `public.__dsn_probe.host`, `public.__dsn_probe.res`
- **colunas** alterado (1): `public.user_profiles.role`
- **constraints** alterado (1): `public.user_profiles.user_profiles_role_check`
- **cron jobs** adicionado (1): `13:cleanup-lock-conflicts-weekly`
- **extensions** adicionado (1): `dblink`
- **functions** adicionado (1): `public.sync_profile_role_from_user_roles()`
- **functions** alterado (15): `public.enforce_optimistic_lock()`, `public.get_profile_role(_user_id uuid)`, `public.get_user_role()`, `public.has_role(_user_id uuid, _role app_role)`, `public.is_admin()`, `public.is_admin_or_supervisor()`, `public.is_admin_user(_user_id uuid)`, `public.is_supervisor()`, `public.notify_bloat_hotspots()`, `public.notify_idle_indexes()`, `public.notify_lock_conflict_hotspot()`, `public.notify_suspicious_index_drop_activity()`, `public.notify_trunk_offline()`, `public.notify_webhook_failure_spike()`, `public.prevent_role_escalation()`
- **grants** adicionado (7): `public.__dbg:anon`, `public.__dbg:authenticated`, `public.__dbg:service_role`, `public.__dsn_probe:anon`, `public.__dsn_probe:authenticated`, `public.__dsn_probe:service_role`, `public.optimistic_lock_conflicts:optimistic_lock_writer`
- **lints** adicionado (5): `extension_in_public:dblink`, `no_primary_key:public.__dbg`, `no_primary_key:public.__dsn_probe`, `rls_no_policies:public.__dbg`, `rls_no_policies:public.__dsn_probe`
- **policies (RLS)** adicionado (1): `public.optimistic_lock_conflicts.olc_writer_insert`
- **policies (RLS)** removido (1): `public.webhook_secrets.Apenas administradores podem gerenciar segredos`
- **policies (RLS)** alterado (4): `public.conversation_messages.Users can view messages of their conversations`, `public.conversations.Users can view their own conversations`, `public.rls_audit_logs.Admins can view RLS audit logs`, `public.webhook_secrets.Admins can manage webhook secrets`
- **roles** adicionado (1): `optimistic_lock_writer`
- **roles** alterado (1): `postgres`
- **tabelas** adicionado (2): `public.__dbg`, `public.__dsn_probe`
- **triggers** adicionado (1): `public.user_roles.trg_sync_profile_role`
- **types/enums** adicionado (1): `public.dblink_pkey_results`
- **vault secrets (nomes)** adicionado (2): `cleanup_lock_conflicts_cron_token`, `optimistic_lock_dblink_dsn`

## 2026-11-22 02:18 UTC

- **functions** alterado (1): `public.is_admin_user(_user_id uuid)`

## 2026-11-22 01:14 UTC

- **cron jobs** adicionado (2): `11:generate-coaching-tracks-daily`, `12:dialer-pacing-tick`
- **functions** alterado (64): `public.apply_migration(p_version character varying, p_name character varying, p_checksum character varying)`, `public.apply_predictive_pacing()`, `public.audit_role_change()`, `public.audit_table_change()`, `public.bridge_voip_alert_to_notification()`, `public.calculate_predictive_pace(p_campaign_id uuid)`, `public.check_all_tables_rls_status()`, `public.check_idle_indexes()`, `public.check_ip_in_cidr(p_ip text, p_cidr text)`, `public.check_rate_limit(_ip_address text, _endpoint text, _user_id uuid)`, `public.check_rls_enabled(table_name text)`, `public.check_suspicious_activity()`, `public.check_table_bloat()`, `public.cleanup_expired_challenges()`, `public.cleanup_old_data()`, `public.cleanup_old_logs()`, `public.enforce_optimistic_lock()`, `public.ensure_single_default_filter()`, `public.expire_parked_calls()`, `public.get_agent_financial_leaderboard(p_days integer)`, `public.get_agent_performance()`, `public.get_agents_with_active_calls()`, `public.get_call_history_with_summaries(p_limit integer, p_offset integer, p_search text, p_status text, p_sentiment text)`, `public.get_call_queues_overview()`, `public.get_call_volume_stats()`, `public.get_dashboard_stats()`, `public.get_database_health_snapshot()`, `public.get_queue_stats()`, `public.get_top_slow_queries(p_limit integer)`, `public.handle_kb_article_change()`, `public.handle_kb_article_history()`, `public.handle_new_user()`, `public.log_audit_event(p_action text, p_resource_type text, p_resource_id text, p_details jsonb)`, `public.log_critical_rls_event()`, `public.log_index_drop_copy(p_index_name text, p_table_name text)`, `public.log_rls_event(p_table_name text, p_operation text, p_details jsonb)`, `public.notify_bloat_hotspots()`, `public.notify_idle_indexes()`, `public.notify_lock_conflict_hotspot()`, `public.notify_suspicious_index_drop_activity()` … (+24)
- **grants** removido (11): `public.financial_impact_daily:anon`, `public.index_usage:anon`, `public.index_usage:authenticated`, `public.migration_rollbacks:anon`, `public.migration_rollbacks:authenticated`, `public.migration_status:anon`, `public.migration_status:authenticated`, `public.schema_migrations:anon`, `public.schema_migrations:authenticated`, `public.unused_indexes:anon`, `public.unused_indexes:authenticated`
- **lints** adicionado (2): `policy_auth_fn_not_wrapped:public.entity_versions.Authenticated can insert versions`, `policy_auth_fn_not_wrapped:public.entity_versions.Authenticated can view versions`
- **lints** removido (35): `policy_auth_fn_not_wrapped:public.entity_versions.Users can insert versions`, `rpc_anon_executable:public.apply_predictive_pacing()`, `rpc_anon_executable:public.calculate_predictive_pace(p_campaign_id uuid)`, `rpc_anon_executable:public.check_all_tables_rls_status()`, `rpc_anon_executable:public.check_idle_indexes()`, `rpc_anon_executable:public.check_ip_in_cidr(p_ip text, p_cidr text)`, `rpc_anon_executable:public.check_rate_limit(_ip_address text, _endpoint text, _user_id uuid)`, `rpc_anon_executable:public.check_rls_enabled(table_name text)`, `rpc_anon_executable:public.check_table_bloat()`, `rpc_anon_executable:public.cleanup_expired_challenges()`, `rpc_anon_executable:public.cleanup_old_data()`, `rpc_anon_executable:public.cleanup_old_logs()`, `rpc_anon_executable:public.expire_parked_calls()`, `rpc_anon_executable:public.get_agent_financial_leaderboard(p_days integer)`, `rpc_anon_executable:public.get_agent_performance()`, `rpc_anon_executable:public.get_agents_with_active_calls()`, `rpc_anon_executable:public.get_call_history_with_summaries(p_limit integer, p_offset integer, p_search text, p_status text, p_sentiment text)`, `rpc_anon_executable:public.get_call_queues_overview()`, `rpc_anon_executable:public.get_call_volume_stats()`, `rpc_anon_executable:public.get_dashboard_stats()`, `rpc_anon_executable:public.get_database_health_snapshot()`, `rpc_anon_executable:public.get_queue_stats()`, `rpc_anon_executable:public.get_top_slow_queries(p_limit integer)`, `rpc_anon_executable:public.log_audit_event(p_action text, p_resource_type text, p_resource_id text, p_details jsonb)`, `rpc_anon_executable:public.log_index_drop_copy(p_index_name text, p_table_name text)`, `rpc_anon_executable:public.log_rls_event(p_table_name text, p_operation text, p_details jsonb)`, `rpc_anon_executable:public.notify_bloat_hotspots()`, `rpc_anon_executable:public.notify_idle_indexes()`, `rpc_anon_executable:public.recalc_deal_health(p_deal_id uuid)`, `rpc_anon_executable:public.record_trunk_usage(p_trunk_id uuid, p_call_session_id uuid, p_started_at timestamp with time zone, p_ended_at timestamp with time zone, p_was_failover boolean, p_failover_reason text, p_original_trunk_id uuid)`, `rpc_anon_executable:public.reset_public_index_stats()`, `rpc_anon_executable:public.rls_auto_enable()`, `rpc_anon_executable:public.snapshot_deals_daily()`, `rpc_anon_executable:public.validate_audit_insert()`, `view_security_definer:public.migration_status`
- **policies (RLS)** adicionado (2): `public.entity_versions.Authenticated can insert versions`, `public.entity_versions.Authenticated can view versions`
- **policies (RLS)** removido (2): `public.entity_versions.Users can insert versions`, `public.entity_versions.Users can view versions`
- **vault secrets (nomes)** adicionado (2): `coaching_cron_token`, `dialer_cron_token`
- **views** alterado (1): `public.migration_status`

## 2026-11-22 00:35 UTC

- **functions** alterado (1): `public.check_all_tables_rls_status()`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_25`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_18`

## 2026-11-21 23:11 UTC

- **colunas** adicionado (12): `public.index_usage.index_scans`, `public.index_usage.index_size`, `public.index_usage.indexname`, `public.index_usage.schemaname`, `public.index_usage.tablename`, `public.index_usage.tuples_fetched`, `public.index_usage.tuples_read`, `public.unused_indexes.idx_scan`, `public.unused_indexes.index_size`, `public.unused_indexes.indexname`, `public.unused_indexes.schemaname`, `public.unused_indexes.tablename`
- **grants** adicionado (6): `public.index_usage:anon`, `public.index_usage:authenticated`, `public.index_usage:service_role`, `public.unused_indexes:anon`, `public.unused_indexes:authenticated`, `public.unused_indexes:service_role`
- **indexes** adicionado (3): `public.idx_audit_action_timestamp`, `public.idx_audit_user_timestamp`, `public.idx_contacts_name_search`
- **lints** adicionado (2): `view_security_definer:public.index_usage`, `view_security_definer:public.unused_indexes`
- **views** adicionado (2): `public.index_usage`, `public.unused_indexes`

## 2026-11-21 22:11 UTC

- **functions** alterado (1): `public.is_admin_user(_user_id uuid)`

## 2026-11-21 20:12 UTC

- **migrations** adicionado (1): `20261121125200_fix_rls_allow_all`
- **policies (RLS)** adicionado (4): `public.call_records.Admins can manage call_records`, `public.call_records.Admins can view call_records`, `public.queue_items.Admins can manage queue_items`, `public.queue_items.Admins can view queue_items`
- **policies (RLS)** removido (4): `public.agents.Allow all`, `public.call_records.Allow all`, `public.contacts.Allow all`, `public.queue_items.Allow all`

## 2026-11-21 16:12 UTC

- **functions** alterado (1): `public.is_admin_or_supervisor()`

## 2026-11-21 14:12 UTC

- **colunas** adicionado (24): `public.call_records.agent_id`, `public.call_records.agent_name`, `public.call_records.contact_id`, `public.call_records.contact_name`, `public.call_records.contact_phone`, `public.call_records.duration`, `public.call_records.id`, `public.call_records.notes`, `public.call_records.recording_url`, `public.call_records.status`, `public.call_records.timestamp`, `public.call_records.transcription`, `public.call_records.type`, `public.contacts.favorite`, `public.queue_items.agent_assigned`, `public.queue_items.contact_name`, `public.queue_items.contact_phone`, `public.queue_items.created_at`, `public.queue_items.id`, `public.queue_items.metadata`, `public.queue_items.priority`, `public.queue_items.queue_type`, `public.queue_items.status`, `public.queue_items.wait_time`
- **constraints** adicionado (6): `public.call_records.call_records_contact_id_fkey`, `public.call_records.call_records_pkey`, `public.call_records.call_records_status_check`, `public.call_records.call_records_type_check`, `public.queue_items.queue_items_pkey`, `public.queue_items.queue_items_status_check`
- **grants** adicionado (6): `public.call_records:anon`, `public.call_records:authenticated`, `public.call_records:service_role`, `public.queue_items:anon`, `public.queue_items:authenticated`, `public.queue_items:service_role`
- **indexes** adicionado (6): `public.call_records_pkey`, `public.idx_calls_contact`, `public.idx_calls_timestamp`, `public.idx_contacts_favorite`, `public.idx_queue_status`, `public.queue_items_pkey`
- **migrations** adicionado (1): `20250102000000_hello_production`
- **policies (RLS)** adicionado (4): `public.agents.Allow all`, `public.call_records.Allow all`, `public.contacts.Allow all`, `public.queue_items.Allow all`
- **tabelas** adicionado (2): `public.call_records`, `public.queue_items`

## 2026-11-21 12:17 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_24`

## 2026-11-20 19:11 UTC

- **constraints** alterado (1): `public.data_lake_exports.data_lake_exports_dataset_check`
- **extensions** adicionado (1): `pg_net`
- **roles** adicionado (1): `supabase_functions_admin`

## 2026-11-20 12:18 UTC

- **config: auth_config** removido (1): `auth_config`
- **config: network_restrictions** removido (1): `network_restrictions`
- **config: pooler_config** removido (1): `pooler_config`
- **config: postgres_config** removido (1): `postgres_config`
- **config: postgrest_config** removido (1): `postgrest_config`
- **config: storage_config** removido (1): `storage_config`
- **edge functions** removido (94): `analyze-call`, `analyze-contact-profile`, `analyze-live-utterance`, `analyze-sentiment`, `analyze-talk-ratio`, `approve-password-reset`, `auto-scorecard`, `bitrix-api`, `chat-widget-session`, `chatbot-respond`, `check-alerts`, `check-contact-alerts`, `check-goals`, `check-hold-alerts`, `check-queue-metrics`, `cleanup-lock-conflicts`, `compute-account-health`, `compute-adherence`, `compute-best-time`, `compute-deal-health`, `data-lake-flush`, `database-backup`, `database-cleanup`, `detect-churn-risk`, `detect-key-moments`, `dialer-pacing-tick`, `elevenlabs-conversation-token`, `email-inbound`, `embed-kb-article`, `enforce-sla`, `enroll-voice`, `export-data-lake`, `extract-crm-fields`, `forecast-call-volume`, `forecast-deals`, `fuzz-test-runner`, `generate-coaching`, `generate-coaching-plan`, `generate-coaching-track`, `generate-meeting-summary` … (+54)

## 2026-11-20 11:04 UTC

- Snapshot inicial.


## 2026-11-20 01:14 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_23`
- **realtime** removido (6): `supabase_realtime_messages_publication:realtime.messages_2026_08_03`, `supabase_realtime_messages_publication:realtime.messages_2026_08_04`, `supabase_realtime_messages_publication:realtime.messages_2026_08_05`, `supabase_realtime_messages_publication:realtime.messages_2026_08_06`, `supabase_realtime_messages_publication:realtime.messages_2026_08_07`, `supabase_realtime_messages_publication:realtime.messages_2026_08_08`

## 2026-11-20 00:38 UTC

- **realtime** adicionado (5): `supabase_realtime_messages_publication:realtime.messages_2026_11_18`, `supabase_realtime_messages_publication:realtime.messages_2026_11_19`, `supabase_realtime_messages_publication:realtime.messages_2026_11_20`, `supabase_realtime_messages_publication:realtime.messages_2026_11_21`, `supabase_realtime_messages_publication:realtime.messages_2026_11_22`

## 2026-11-14 14:27 UTC

- **colunas** adicionado (35): `public.entity_versions.change_summary`, `public.entity_versions.changed_at`, `public.entity_versions.changed_by`, `public.entity_versions.data`, `public.entity_versions.entity_id`, `public.entity_versions.entity_type`, `public.entity_versions.id`, `public.entity_versions.version_number`, `public.migration_rollbacks.id`, `public.migration_rollbacks.reason`, `public.migration_rollbacks.rolled_back_at`, `public.migration_rollbacks.rolled_back_by`, `public.migration_rollbacks.version`, `public.migration_status.applied_at`, `public.migration_status.applied_by`, `public.migration_status.execution_time_ms`, `public.migration_status.name`, `public.migration_status.status`, `public.migration_status.success`, `public.migration_status.version`, `public.saved_filters.created_at`, `public.saved_filters.entity_type`, `public.saved_filters.filters`, `public.saved_filters.id`, `public.saved_filters.is_default`, `public.saved_filters.name`, `public.saved_filters.updated_at`, `public.saved_filters.user_id`, `public.schema_migrations.applied_at`, `public.schema_migrations.applied_by`, `public.schema_migrations.checksum`, `public.schema_migrations.execution_time_ms`, `public.schema_migrations.name`, `public.schema_migrations.success`, `public.schema_migrations.version`
- **constraints** adicionado (8): `public.entity_versions.entity_versions_changed_by_fkey`, `public.entity_versions.entity_versions_pkey`, `public.entity_versions.unique_entity_version`, `public.migration_rollbacks.migration_rollbacks_pkey`, `public.saved_filters.saved_filters_pkey`, `public.saved_filters.saved_filters_user_id_fkey`, `public.saved_filters.unique_filter_name_per_user_entity`, `public.schema_migrations.schema_migrations_pkey`
- **functions** adicionado (4): `public.apply_migration(p_version character varying, p_name character varying, p_checksum character varying)`, `public.ensure_single_default_filter()`, `public.rollback_migration(p_version character varying, p_reason text)`, `public.update_saved_filters_updated_at()`
- **grants** adicionado (15): `public.entity_versions:anon`, `public.entity_versions:authenticated`, `public.entity_versions:service_role`, `public.migration_rollbacks:anon`, `public.migration_rollbacks:authenticated`, `public.migration_rollbacks:service_role`, `public.migration_status:anon`, `public.migration_status:authenticated`, `public.migration_status:service_role`, `public.saved_filters:anon`, `public.saved_filters:authenticated`, `public.saved_filters:service_role`, `public.schema_migrations:anon`, `public.schema_migrations:authenticated`, `public.schema_migrations:service_role`
- **indexes** adicionado (12): `public.entity_versions_pkey`, `public.idx_saved_filters_default`, `public.idx_saved_filters_entity_type`, `public.idx_saved_filters_user_entity`, `public.idx_saved_filters_user_id`, `public.idx_versions_date`, `public.idx_versions_entity`, `public.migration_rollbacks_pkey`, `public.saved_filters_pkey`, `public.schema_migrations_pkey`, `public.unique_entity_version`, `public.unique_filter_name_per_user_entity`
- **lints** adicionado (9): `fk_without_index:public.entity_versions.entity_versions_changed_by_fkey`, `policy_auth_fn_not_wrapped:public.entity_versions.Users can insert versions`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can delete own filters`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can insert own filters`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can update own filters`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can view own filters`, `rls_no_policies:public.migration_rollbacks`, `rls_no_policies:public.schema_migrations`, `view_security_definer:public.migration_status`
- **migrations** adicionado (3): `20241231000000_saved_filters`, `20241231000001_entity_versions`, `20250101000000_versioning`
- **policies (RLS)** adicionado (6): `public.entity_versions.Users can insert versions`, `public.entity_versions.Users can view versions`, `public.saved_filters.Users can delete own filters`, `public.saved_filters.Users can insert own filters`, `public.saved_filters.Users can update own filters`, `public.saved_filters.Users can view own filters`
- **tabelas** adicionado (4): `public.entity_versions`, `public.migration_rollbacks`, `public.saved_filters`, `public.schema_migrations`
- **triggers** adicionado (2): `public.saved_filters.trigger_saved_filters_updated_at`, `public.saved_filters.trigger_single_default_filter`
- **views** adicionado (1): `public.migration_status`

## 2026-11-14 13:58 UTC

- **edge functions** alterado (3): `analyze-call`, `data-lake-flush`, `health-check`

## 2026-11-14 13:15 UTC

- **cron jobs** adicionado (1): `4:data-lake-flush-daily`
- **cron jobs** removido (2): `1:update-contact-name-daily`, `2:update-user-profile-fullname-daily`
- **functions** alterado (1): `public.trigger_auto_scorecard()`
- **lints** removido (1): `view_security_definer:public.financial_impact_daily`
- **views** alterado (1): `public.financial_impact_daily`

## 2026-11-13 22:26 UTC

- Snapshot inicial.


# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

## 2026-11-23 02:20 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_26`

## 2026-11-22 18:14 UTC

- **constraints** alterado (7): `public.entity_versions.entity_versions_changed_by_fkey`, `public.kb_article_history.kb_article_history_changed_by_fkey`, `public.performance_metrics.performance_metrics_user_id_fkey`, `public.rate_limit_alerts.rate_limit_alerts_resolved_by_fkey`, `public.rate_limit_alerts.rate_limit_alerts_user_id_fkey`, `public.rate_limit_logs.rate_limit_logs_user_id_fkey`, `public.user_roles.user_roles_granted_by_fkey`
- **migrations** adicionado (1): `20261123010000_20261123010000_fix_user_delete_cascade`

## 2026-11-22 17:11 UTC

- **cron jobs** adicionado (1): `16:data-lake-flush-daily`
- **cron jobs** removido (1): `4:data-lake-flush-daily`
- **vault secrets (nomes)** adicionado (1): `data_lake_cron_token`

## 2026-11-22 16:14 UTC

- **cron jobs** adicionado (1): `15:cleanup-recordings-daily`
- **vault secrets (nomes)** adicionado (1): `cleanup_recordings_cron_token`

## 2026-11-22 06:20 UTC

- **constraints** adicionado (8): `public.accounts.accounts_current_stage_check`, `public.accounts.accounts_segment_check`, `public.agent_devices.agent_devices_device_type_check`, `public.agent_ring_settings.agent_ring_settings_fallback_action_check`, `public.agent_ring_settings.agent_ring_settings_ring_strategy_check`, `public.agent_shifts.agent_shifts_status_check`, `public.call_playlists.call_playlists_playlist_type_check`, `public.call_quality_metrics.call_quality_metrics_quality_label_check`
- **functions** alterado (16): `public.can_access_agent_data(target_agent_name text)`, `public.check_calling_hours(p_region_code text)`, `public.check_dnc(p_phone text)`, `public.get_profile_role(_user_id uuid)`, `public.get_user_agent_id()`, `public.get_user_agent_name()`, `public.get_user_role()`, `public.get_user_roles(_user_id uuid)`, `public.has_permission(_user_id uuid, _permission_name text)`, `public.has_role(_user_id uuid, _role app_role)`, `public.is_active_agent(_agent_name text)`, `public.is_admin()`, `public.is_admin_or_supervisor()`, `public.is_admin_user(_user_id uuid)`, `public.is_supervisor()`, `public.sync_profile_role_from_user_roles()`

## 2026-11-22 05:12 UTC

- **colunas** removido (3): `public.__dbg.err`, `public.__dsn_probe.host`, `public.__dsn_probe.res`
- **functions** alterado (11): `public.add_to_dnc(p_phone text, p_reason text, p_source text, p_notes text, p_expires_at timestamp with time zone)`, `public.check_calling_hours(p_region_code text)`, `public.check_dnc(p_phone text)`, `public.check_ip_allowed(p_user_id uuid, p_ip_address text)`, `public.get_auth_agent_id()`, `public.get_profile_role(_user_id uuid)`, `public.get_user_roles(_user_id uuid)`, `public.has_permission(_user_id uuid, _permission_name text)`, `public.has_role(_user_id uuid, _role app_role)`, `public.is_admin_user(_user_id uuid)`, `public.sync_profile_role_from_user_roles()`
- **grants** removido (6): `public.__dbg:anon`, `public.__dbg:authenticated`, `public.__dbg:service_role`, `public.__dsn_probe:anon`, `public.__dsn_probe:authenticated`, `public.__dsn_probe:service_role`
- **lints** removido (15): `no_primary_key:public.__dbg`, `no_primary_key:public.__dsn_probe`, `policy_auth_fn_not_wrapped:public.parked_calls.parked_calls_select_self_or_staff`, `rls_no_policies:public.__dbg`, `rls_no_policies:public.__dsn_probe`, `rpc_anon_executable:public.add_to_dnc(p_phone text, p_reason text, p_source text, p_notes text, p_expires_at timestamp with time zone)`, `rpc_anon_executable:public.check_calling_hours(p_region_code text)`, `rpc_anon_executable:public.check_dnc(p_phone text)`, `rpc_anon_executable:public.check_ip_allowed(p_user_id uuid, p_ip_address text)`, `rpc_anon_executable:public.get_auth_agent_id()`, `rpc_anon_executable:public.get_profile_role(_user_id uuid)`, `rpc_anon_executable:public.get_user_roles(_user_id uuid)`, `rpc_anon_executable:public.has_permission(_user_id uuid, _permission_name text)`, `rpc_anon_executable:public.has_role(_user_id uuid, _role app_role)`, `rpc_anon_executable:public.is_admin_user(_user_id uuid)`
- **migrations** adicionado (3): `20261122350000_20261122350000_revert_parked_calls_scope`, `20261122360000_20261122360000_storage_policies_rename_and_scope`, `20261122370000_20261122370000_holiday_region_isolation`
- **policies (RLS)** adicionado (4): `public.parked_calls.parked_calls_select_auth`, `storage.objects.storage_delete_authenticated`, `storage.objects.storage_insert_authenticated`, `storage.objects.storage_select_authenticated`
- **policies (RLS)** removido (5): `public.parked_calls.parked_calls_select_self_or_staff`, `storage.objects.queue_audio_staff_insert`, `storage.objects.recording_staff_delete`, `storage.objects.recording_staff_insert`, `storage.objects.recording_staff_select`
- **tabelas** removido (2): `public.__dbg`, `public.__dsn_probe`

## 2026-11-22 04:14 UTC

- **cron jobs** adicionado (1): `14:cleanup-lock-conflicts-weekly`
- **cron jobs** removido (1): `13:cleanup-lock-conflicts-weekly`
- **functions** alterado (3): `public.check_calling_hours(p_region_code text)`, `public.enforce_optimistic_lock()`, `public.notify_lock_conflict_hotspot()`
- **lints** adicionado (1): `policy_auth_fn_not_wrapped:public.parked_calls.parked_calls_select_self_or_staff`
- **lints** removido (14): `policy_auth_fn_not_wrapped:public.call_control_audit_logs.Agents can view own audit logs`, `policy_auth_fn_not_wrapped:public.dialer_favorites.Users manage own dialer favorites`, `policy_auth_fn_not_wrapped:public.entity_versions.Authenticated can insert versions`, `policy_auth_fn_not_wrapped:public.entity_versions.Authenticated can view versions`, `policy_auth_fn_not_wrapped:public.parked_calls.parked_calls_insert_self`, `policy_auth_fn_not_wrapped:public.parked_calls.parked_calls_update_retrieve`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can delete own filters`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can insert own filters`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can update own filters`, `policy_auth_fn_not_wrapped:public.saved_filters.Users can view own filters`, `policy_auth_fn_not_wrapped:public.system_settings.Leitura de configurações para autenticados`, `policy_auth_fn_not_wrapped:public.user_profiles.Admins update any profile`, `policy_auth_fn_not_wrapped:public.user_profiles.Users update own profile`, `policy_auth_fn_not_wrapped:public.voip_monitoring_settings.All authenticated can view voip settings`
- **migrations** adicionado (223): `20250103000000_20250103000000_triggers`, `20250104000000_20250104000000_query_monitoring`, `20251222153717_20251222153717_0868819c-c2a1-4f51-abcd-34ae49b599ed`, `20251222165402_20251222165402_c515f03e-0bf3-4c17-a56b-b209d783515a`, `20251222172653_20251222172653_e31b25fa-1495-47dc-a70e-59351aae7386`, `20251223013407_20251223013407_14e5788a-757b-4c1a-b447-ee6048bee1b3`, `20251223014743_20251223014743_829d5071-0f42-4ea3-bd3d-eb8bd994a318`, `20251223203745_20251223203745_ffdf3a72-6756-465c-9e63-fa079846be95`, `20251223203951_20251223203951_8b86adf3-98b4-4cf4-8154-b1efb3cde4bd`, `20251223204512_20251223204512_e8f40654-7907-4e57-97c1-480e0d602e18`, `20251223211907_20251223211907_9badc1f9-c450-4801-b56f-7cac4cabf237`, `20251223220228_20251223220228_f4ebbaa7-ea1c-447d-a07b-e1c0f583963d`, `20251224021814_20251224021814_cc2dbdc3-ab3c-4fd9-aa8d-7af71ae39f75`, `20251224022103_20251224022103_aa00248e-f07a-4edc-8c76-96e520ba31a9`, `20251224022711_20251224022711_bcf91fc6-4c52-42e8-b02c-c63b4f495a64`, `20251224023203_20251224023203_b0186fe4-1181-4b5d-a9cc-460f3738b952`, `20251224023654_20251224023654_29935900-12bb-4c40-bb31-a061340c76eb`, `20251224024429_20251224024429_6c4f4a9d-c7f9-4cd3-a57e-c4b8659a6776`, `20251224124237_20251224124237_40fde4e2-d0ab-4b62-8898-4171393988c4`, `20251224124524_20251224124524_38968a99-a0bc-4cff-a5c2-2fd2590d2e8e`, `20251224134357_20251224134357_08ef4955-ebfb-4dc3-b63b-9d247050951f`, `20251224134826_20251224134826_e7324447-c07d-4e94-b603-52bf4efa2773`, `20251224142716_20251224142716_d2c04aae-f048-4e7c-b447-1d6e3a840412`, `20251224143457_20251224143457_dcc666f8-bf68-4077-86f4-4a0ad7dd27b3`, `20251225181949_20251225181949_a8f1c32a-4aeb-4156-9cb1-6e71955acb4e`, `20251225183119_20251225183119_7313996d-e875-4c04-a6ff-89415df9f212`, `20251225185236_20251225185236_a4c86a9f-4ff8-4f94-b7a7-3970e2787ae0`, `20251225190920_20251225190920_52373a9f-fb31-4f5d-9fcd-3aeb2db90f94`, `20251225191244_20251225191244_a0843a19-ef2a-4fe3-b2ba-feb13d068ec9`, `20251225191929_20251225191929_af4e2e70-f169-4dd0-9210-a20c4ec45405`, `20251225192806_20251225192806_31f73fb3-ef04-442d-b4bd-cc6cce94cdb8`, `20251225193248_20251225193248_4613adbc-ca55-48c4-94aa-3aec14e8d9de`, `20251225193519_20251225193519_5687c33d-e757-4f87-b3c2-e4648db83a9c`, `20251231115936_20251231115936_0cbef64e-8440-4db5-8f3d-164a7da98921`, `20251231123454_20251231123454_98bf0ac7-a43f-4b30-b4cb-00b50bb2482c`, `20251231125803_20251231125803_b47a2b11-3915-463a-9c94-57b741b7e4ab`, `20251231131323_20251231131323_f5848ea5-ae7d-4e46-ac63-aba88d5f35bc`, `20251231132751_20251231132751_524f6c03-6c9f-4b16-aae7-d38bb6903fda`, `20260103145030_20260103145030_b2c1f366-245b-4264-9139-4def0d930fd6`, `20260306002511_20260306002511_8add8104-e5d1-4a4d-8e8b-d220fb8ebc88` … (+183)
- **policies (RLS)** adicionado (5): `public.parked_calls.parked_calls_select_self_or_staff`, `storage.objects.queue_audio_staff_insert`, `storage.objects.recording_staff_delete`, `storage.objects.recording_staff_insert`, `storage.objects.recording_staff_select`
- **policies (RLS)** removido (1): `public.parked_calls.parked_calls_select_auth`
- **policies (RLS)** alterado (14): `public.call_control_audit_logs.Agents can view own audit logs`, `public.dialer_favorites.Users manage own dialer favorites`, `public.entity_versions.Authenticated can insert versions`, `public.entity_versions.Authenticated can view versions`, `public.parked_calls.parked_calls_insert_self`, `public.parked_calls.parked_calls_update_retrieve`, `public.saved_filters.Users can delete own filters`, `public.saved_filters.Users can insert own filters`, `public.saved_filters.Users can update own filters`, `public.saved_filters.Users can view own filters`, `public.system_settings.Leitura de configurações para autenticados`, `public.user_profiles.Admins update any profile`, `public.user_profiles.Users update own profile`, `public.voip_monitoring_settings.All authenticated can view voip settings`

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


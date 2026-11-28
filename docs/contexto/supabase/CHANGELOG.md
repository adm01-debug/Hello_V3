# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

## 2026-11-28 17:11 UTC

- **cron jobs** adicionado (2): `67:crm-sync-queue`, `68:cadence-tick`
- **cron jobs** removido (2): `61:cadence-tick`, `65:crm-sync-queue`
- **functions** alterado (6): `public.cadence_tick(p_limit integer)`, `public.edge_function_url(p_slug text)`, `public.get_user_agent_name()`, `public.is_admin_or_supervisor()`, `public.recalc_hold_time_from_events()`, `public.token_cron_valido(p_nome text, p_token text)`
- **migrations** adicionado (3): `20261128100000_cadence_tick_motor`, `20261128110000_crm_sync_queue_cron`, `20261128123000_crm_sync_queue_cron_guard`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_24`
- **triggers** adicionado (2): `public.hold_events.trg_hold_events_recalc_hold_time_del`, `public.hold_events.trg_hold_events_recalc_hold_time_ins`
- **triggers** alterado (1): `public.hold_events.trg_hold_events_recalc_hold_time`

## 2026-11-28 16:13 UTC

- **functions** alterado (6): `public.check_calling_hours(p_region_code text)`, `public.claim_next_dialer_contact(p_campaign_id uuid)`, `public.get_user_agent_name()`, `public.is_admin()`, `public.is_admin_or_supervisor()`, `public.is_own_call_session(_call_session_id uuid)`
- **migrations** adicionado (6): `20261127223000_hold_events_agent_writable`, `20261127233000_calling_hours_holiday_region_fix`, `20261127280000_is_own_call_session_grants`, `20261128130000_crm_sync_queue_enqueue_author`, `20261128140000_call_sessions_bitrix_call_id`, `20261128150000_claim_next_dialer_contact`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_12_01`

## 2026-11-27 02:18 UTC

- **functions** alterado (2): `public.check_calling_hours(p_region_code text)`, `public.is_own_call_session(_call_session_id uuid)`
- **lints** removido (1): `rpc_anon_executable:public.is_own_call_session(_call_session_id uuid)`

## 2026-11-27 01:14 UTC

- **functions** adicionado (1): `public.is_own_call_session(_call_session_id uuid)`
- **functions** alterado (2): `public.get_user_agent_name()`, `public.is_admin_or_supervisor()`
- **lints** adicionado (1): `rpc_anon_executable:public.is_own_call_session(_call_session_id uuid)`
- **policies (RLS)** adicionado (3): `public.hold_events.Owners can insert hold_events`, `public.hold_events.Owners can update hold_events`, `public.hold_events.Owners can view hold_events`

## 2026-11-27 00:37 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_30`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_23`

## 2026-11-26 23:15 UTC

- **colunas** adicionado (2): `public.call_sessions.bitrix_call_id`, `public.crm_sync_queue.requested_by`
- **functions** adicionado (1): `public.claim_next_dialer_contact(p_campaign_id uuid)`
- **indexes** adicionado (1): `public.idx_crm_sync_queue_requested_by`
- **lints** adicionado (2): `policy_auth_fn_not_wrapped:public.crm_sync_queue.Agente enfileira a propria acao`, `policy_auth_fn_not_wrapped:public.crm_sync_queue.Agente le a propria acao`
- **policies (RLS)** adicionado (2): `public.crm_sync_queue.Agente enfileira a propria acao`, `public.crm_sync_queue.Agente le a propria acao`

## 2026-11-26 22:16 UTC

- **cron jobs** adicionado (1): `65:crm-sync-queue`
- **functions** adicionado (1): `public.token_cron_valido(p_nome text, p_token text)`
- **functions** alterado (1): `public.edge_function_url(p_slug text)`
- **vault secrets (nomes)** adicionado (1): `crm_sync_cron_token`

## 2026-11-26 21:18 UTC

- **colunas** adicionado (9): `public.cadence_step_runs.cadence_id`, `public.cadence_step_runs.created_at`, `public.cadence_step_runs.detail`, `public.cadence_step_runs.enrollment_id`, `public.cadence_step_runs.id`, `public.cadence_step_runs.status`, `public.cadence_step_runs.step_id`, `public.cadence_step_runs.step_order`, `public.cadence_step_runs.step_type`
- **constraints** adicionado (5): `public.cadence_step_runs.cadence_step_runs_cadence_id_fkey`, `public.cadence_step_runs.cadence_step_runs_enrollment_id_fkey`, `public.cadence_step_runs.cadence_step_runs_pkey`, `public.cadence_step_runs.cadence_step_runs_status_check`, `public.cadence_step_runs.cadence_step_runs_step_id_fkey`
- **cron jobs** adicionado (1): `61:cadence-tick`
- **functions** adicionado (1): `public.cadence_tick(p_limit integer)`
- **functions** alterado (1): `public.log_audit_event(p_action text, p_resource_type text, p_resource_id text, p_details jsonb)`
- **grants** adicionado (2): `public.cadence_step_runs:authenticated`, `public.cadence_step_runs:service_role`
- **indexes** adicionado (2): `public.cadence_step_runs_pkey`, `public.idx_cadence_step_runs_enrollment`
- **lints** adicionado (2): `fk_without_index:public.cadence_step_runs.cadence_step_runs_cadence_id_fkey`, `fk_without_index:public.cadence_step_runs.cadence_step_runs_step_id_fkey`
- **migrations** adicionado (2): `20261127190000_policies_to_authenticated_lote4`, `20261127240000_calling_hours_recurring_comment`
- **policies (RLS)** adicionado (1): `public.cadence_step_runs.Agents view own cadence runs`
- **tabelas** adicionado (1): `public.cadence_step_runs`

## 2026-11-26 20:23 UTC

- **cron jobs** adicionado (1): `59:cron-watchdog-hourly`
- **cron jobs** removido (1): `58:cron-watchdog-hourly`
- **functions** alterado (13): `public.can_access_agent_data(target_agent_name text)`, `public.check_cron_health()`, `public.cron_health_rows()`, `public.get_cron_health()`, `public.get_user_agent_id()`, `public.get_user_agent_name()`, `public.get_user_role()`, `public.increment_weekly_stats(p_agent_id uuid, p_week_start date, p_calls integer, p_duration_seconds integer, p_badges integer, p_points integer, p_avg_satisfaction numeric, p_avg_performance numeric)`, `public.is_active_agent(_agent_name text)`, `public.is_admin()`, `public.is_admin_or_supervisor()`, `public.is_supervisor()`, `public.update_updated_at_column()`
- **migrations** adicionado (15): `20260315143858_create_geo_tables_retroativo`, `20261126170000_cron_watchdog`, `20261126190000_cron_watchdog_privilegios`, `20261127130000_crm_sync_queue_update_policy`, `20261127150000_learning_completions_update_policy`, `20261127160000_policies_to_authenticated_lote1`, `20261127170000_add_missing_fks`, `20261127180000_policies_to_authenticated_restante`, `20261127200000_revoke_anon_role_helpers`, `20261127210000_role_helpers_stable`, `20261127220000_polymorphic_pointer_comments`, `20261127230000_unique_conversation_message_id`, `20261127250000_increment_weekly_stats_rpc`, `20261127260000_increment_weekly_stats_rpc_null_media_fix`, `20261127270000_geo_policies_idempotente`

## 2026-11-26 18:16 UTC

- **colunas** alterado (7): `public.audit_logs.resource_id`, `public.audit_logs.resource_type`, `public.holidays.recurring`, `public.notifications.source_id`, `public.notifications.source_type`, `public.optimistic_lock_conflicts.record_id`, `public.optimistic_lock_conflicts.table_name`
- **functions** adicionado (1): `public.increment_weekly_stats(p_agent_id uuid, p_week_start date, p_calls integer, p_duration_seconds integer, p_badges integer, p_points integer, p_avg_satisfaction numeric, p_avg_performance numeric)`
- **functions** alterado (1): `public.check_calling_hours(p_region_code text)`
- **indexes** adicionado (1): `public.idx_conversation_messages_msgid`

## 2026-11-26 17:15 UTC

- **functions** alterado (8): `public.can_access_agent_data(target_agent_name text)`, `public.get_user_agent_id()`, `public.get_user_agent_name()`, `public.get_user_role()`, `public.is_active_agent(_agent_name text)`, `public.is_admin()`, `public.is_admin_or_supervisor()`, `public.is_supervisor()`
- **lints** removido (8): `rpc_anon_executable:public.can_access_agent_data(target_agent_name text)`, `rpc_anon_executable:public.get_user_agent_id()`, `rpc_anon_executable:public.get_user_agent_name()`, `rpc_anon_executable:public.get_user_role()`, `rpc_anon_executable:public.is_active_agent(_agent_name text)`, `rpc_anon_executable:public.is_admin()`, `rpc_anon_executable:public.is_admin_or_supervisor()`, `rpc_anon_executable:public.is_supervisor()`

## 2026-11-26 16:17 UTC

- **policies (RLS)** alterado (106): `public.account_lockouts.Deny direct delete account_lockouts`, `public.account_lockouts.Deny direct insert account_lockouts`, `public.account_lockouts.Deny direct update account_lockouts`, `public.agents.Users can view agents`, `public.audit_logs.Deny direct insert audit_logs`, `public.battle_card_triggers.All authenticated view triggers`, `public.battle_cards.All authenticated view battle cards`, `public.bitrix_departments.Admins can manage bitrix departments`, `public.bitrix_users.Admins can manage bitrix users`, `public.bot_conversations.Admin/Supervisor insert bot conversations`, `public.bot_conversations.Admin/Supervisor view bot conversations`, `public.bot_conversations.Agents view bot convs from assigned`, `public.cadence_enrollments.Agents update own enrollments`, `public.cadence_enrollments.Agents view own enrollments`, `public.cadence_enrollments.Authenticated insert enrollments`, `public.cadence_enrollments.Supervisors manage enrollments`, `public.cadence_steps.All authenticated read cadence steps`, `public.cadence_steps.Supervisors manage cadence steps`, `public.cadences.All authenticated read cadences`, `public.cadences.Supervisors manage cadences`, `public.call_control_audit_logs.Admins can view call control audit`, `public.call_control_audit_logs.Agents can view own audit logs`, `public.call_key_moments.View own or as supervisor key moments`, `public.call_playlists.Owners delete playlists`, `public.call_playlists.Owners update playlists`, `public.call_recordings.Strict isolation: Agents view own recordings`, `public.call_scorecards.Agents view own scorecards`, `public.call_scorecards.Supervisors manage scorecards`, `public.call_sessions.Strict isolation: Agents view own sessions`, `public.call_transcripts_searchable.View transcripts own or supervisor`, `public.call_translations.Agent/supervisor/admin can view translations`, `public.chat_sessions.Admin/Supervisor manage chat sessions`, `public.chat_sessions.Admin/Supervisor view all chat sessions`, `public.chat_sessions.Agents view sessions from assigned convs`, `public.coaching_timestamps.Admin/supervisor delete coaching ts`, `public.coaching_timestamps.View coaching ts own or supervisor`, `public.compliance_rules.Admin/supervisor gerenciam regras de compliance`, `public.compliance_rules.Todos autenticados leem regras de compliance`, `public.consent_records.Admins delete consent`, `public.consent_records.Admins/supervisors insert consent` … (+66)

## 2026-11-26 15:15 UTC

- **constraints** adicionado (3): `public.bitrix_departments.bitrix_departments_parent_id_fkey`, `public.call_scorecards.call_scorecards_reviewer_id_fkey`, `public.coaching_assignments.coaching_assignments_scorecard_id_fkey`
- **lints** adicionado (3): `fk_without_index:public.bitrix_departments.bitrix_departments_parent_id_fkey`, `fk_without_index:public.call_scorecards.call_scorecards_reviewer_id_fkey`, `fk_without_index:public.coaching_assignments.coaching_assignments_scorecard_id_fkey`
- **policies (RLS)** alterado (21): `public.call_quality_metrics.Role-based view quality metrics`, `public.call_quality_metrics.admins_delete_quality_metrics`, `public.call_quality_metrics.agents_insert_own_quality_metrics`, `public.call_quality_metrics.agents_update_own_quality_metrics`, `public.call_quality_metrics.agents_view_own_quality_metrics`, `public.conversation_messages.Admin/Supervisor manage messages`, `public.conversation_messages.Admin/Supervisor view all messages`, `public.conversation_messages.Agents insert in assigned conversations`, `public.conversation_messages.Agents view messages from assigned convs`, `public.conversation_messages.Users can view messages of their conversations`, `public.conversations.Admin/Supervisor manage conversations`, `public.conversations.Admin/Supervisor view all conversations`, `public.conversations.Agents update assigned conversations`, `public.conversations.Agents view assigned conversations`, `public.conversations.Users can view their own conversations`, `public.meeting_summaries.summaries_delete_admin`, `public.meeting_summaries.summaries_insert_agent_own`, `public.meeting_summaries.summaries_select_admin_supervisor`, `public.meeting_summaries.summaries_select_agent_own`, `public.meeting_summaries.summaries_update_admin_supervisor`, `public.meeting_summaries.summaries_update_agent_own`

## 2026-11-26 14:18 UTC

- **functions** alterado (1): `public.is_admin_or_supervisor()`
- **migrations** adicionado (1): `20261126140000_client_errors`
- **policies (RLS)** adicionado (2): `public.crm_sync_queue.Admin supervisor update crm sync queue`, `public.learning_completions.Agents update own completions`

## 2026-11-26 13:17 UTC

- **colunas** adicionado (11): `public.client_errors.correlation_id`, `public.client_errors.error_type`, `public.client_errors.id`, `public.client_errors.message`, `public.client_errors.occurred_at`, `public.client_errors.resolved_at`, `public.client_errors.resolved_by`, `public.client_errors.route`, `public.client_errors.stack`, `public.client_errors.user_agent`, `public.client_errors.user_id`
- **constraints** adicionado (9): `public.client_errors.client_errors_correlation_len`, `public.client_errors.client_errors_message_len`, `public.client_errors.client_errors_pkey`, `public.client_errors.client_errors_resolved_by_fkey`, `public.client_errors.client_errors_route_len`, `public.client_errors.client_errors_stack_len`, `public.client_errors.client_errors_type_chk`, `public.client_errors.client_errors_user_agent_len`, `public.client_errors.client_errors_user_id_fkey`
- **cron jobs** adicionado (1): `58:cron-watchdog-hourly`
- **functions** adicionado (3): `public.check_cron_health()`, `public.cron_health_rows()`, `public.get_cron_health()`
- **functions** alterado (2): `public.dnc_track_removal()`, `public.is_admin()`
- **grants** adicionado (3): `public.client_errors:anon`, `public.client_errors:authenticated`, `public.client_errors:service_role`
- **indexes** adicionado (4): `public.client_errors_pkey`, `public.idx_client_errors_occurred_at`, `public.idx_client_errors_open`, `public.idx_client_errors_route`
- **lints** adicionado (2): `fk_without_index:public.client_errors.client_errors_resolved_by_fkey`, `fk_without_index:public.client_errors.client_errors_user_id_fkey`
- **migrations** adicionado (1): `20261126130000_dnc_removal_audit`
- **policies (RLS)** adicionado (3): `public.client_errors.admins_supervisors_read_client_errors`, `public.client_errors.admins_supervisors_resolve_client_errors`, `public.client_errors.authenticated_insert_own_client_errors`
- **tabelas** adicionado (1): `public.client_errors`

## 2026-11-26 12:19 UTC

- **colunas** adicionado (9): `public.deal_pipeline_snapshots.created_at`, `public.deal_pipeline_snapshots.open_count`, `public.deal_pipeline_snapshots.snapshot_date`, `public.deal_pipeline_snapshots.total_value_cents`, `public.deal_pipeline_snapshots.updated_at`, `public.deal_pipeline_snapshots.weighted_value_cents`, `public.dnc_list.removal_reason`, `public.dnc_list.removed_at`, `public.dnc_list.removed_by`
- **constraints** adicionado (1): `public.deal_pipeline_snapshots.deal_pipeline_snapshots_pkey`
- **cron jobs** adicionado (1): `56:deal-pipeline-snapshot-daily`
- **functions** adicionado (1): `public.dnc_track_removal()`
- **functions** alterado (2): `public.is_admin_or_supervisor()`, `public.snapshot_deals_daily()`
- **grants** adicionado (3): `public.deal_pipeline_snapshots:anon`, `public.deal_pipeline_snapshots:authenticated`, `public.deal_pipeline_snapshots:service_role`
- **indexes** adicionado (1): `public.deal_pipeline_snapshots_pkey`
- **migrations** adicionado (1): `20261126120000_deal_pipeline_snapshots`
- **policies (RLS)** adicionado (1): `public.deal_pipeline_snapshots.Admin/Supervisor veem retratos do pipeline`
- **tabelas** adicionado (1): `public.deal_pipeline_snapshots`
- **triggers** adicionado (1): `public.dnc_list.trg_dnc_track_removal`

## 2026-11-26 01:17 UTC

- **cron jobs** alterado (5): `11:generate-coaching-tracks-daily`, `12:dialer-pacing-tick`, `14:cleanup-lock-conflicts-weekly`, `16:data-lake-flush-daily`, `33:cleanup-recordings-daily`
- **functions** adicionado (1): `public.edge_function_url(p_slug text)`
- **functions** alterado (6): `public.check_login_lockout(p_email text)`, `public.is_admin()`, `public.is_admin_or_supervisor()`, `public.record_failed_login(p_email text, p_ip_address text, p_user_agent text)`, `public.record_successful_login(p_email text, p_ip_address text, p_user_agent text)`, `public.trigger_auto_scorecard()`
- **grants** alterado (1): `public.rate_limit_logs:anon`
- **lints** removido (3): `rpc_anon_executable:public.check_login_lockout(p_email text)`, `rpc_anon_executable:public.record_failed_login(p_email text, p_ip_address text, p_user_agent text)`, `rpc_anon_executable:public.record_successful_login(p_email text, p_ip_address text, p_user_agent text)`
- **migrations** adicionado (5): `20261126090000_rate_limit_logs_write_policies`, `20261126090001_rate_limit_logs_revoke_anon_write`, `20261126100000_edge_function_urls_from_vault`, `20261126100100_fix_cron_urls_quoting`, `20261126101000_revoke_anon_login_rpcs`
- **policies (RLS)** adicionado (2): `public.rate_limit_logs.Admins can delete rate_limit_logs`, `public.rate_limit_logs.Admins can update rate_limit_logs`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_29`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_22`
- **vault secrets (nomes)** adicionado (2): `auto_scorecard_token`, `edge_functions_base_url`

## 2026-11-25 22:16 UTC

- **cron jobs** adicionado (1): `33:cleanup-recordings-daily`
- **cron jobs** removido (1): `15:cleanup-recordings-daily`
- **functions** alterado (1): `public.check_calling_hours(p_region_code text)`
- **migrations** adicionado (5): `20261123030000_hold_time_from_events`, `20261123120000_user_preferences`, `20261125120000_indices_auditoria_e_busca_contatos`, `20261125190000_calling_hours_fail_closed`, `20261125220000_recordings_retention_cron`

## 2026-11-25 14:15 UTC

- **functions** adicionado (1): `public.recalc_hold_time_from_events()`
- **indexes** adicionado (1): `public.idx_contacts_name_trgm`
- **triggers** adicionado (1): `public.hold_events.trg_hold_events_recalc_hold_time`

## 2026-11-25 12:22 UTC

- **functions** alterado (1): `public.update_updated_at_column()`

## 2026-11-25 11:17 UTC

- **colunas** adicionado (12): `public.user_preferences.audio_auto_gain_control`, `public.user_preferences.audio_echo_cancellation`, `public.user_preferences.audio_noise_suppression`, `public.user_preferences.beta_program`, `public.user_preferences.created_at`, `public.user_preferences.id`, `public.user_preferences.notify_incoming_calls`, `public.user_preferences.notify_missed_calls`, `public.user_preferences.notify_sound`, `public.user_preferences.notify_voicemail`, `public.user_preferences.updated_at`, `public.user_preferences.user_id`
- **constraints** adicionado (3): `public.user_preferences.user_preferences_pkey`, `public.user_preferences.user_preferences_user_id_fkey`, `public.user_preferences.user_preferences_user_id_key`
- **functions** alterado (1): `public.update_updated_at_column()`
- **grants** adicionado (3): `public.user_preferences:anon`, `public.user_preferences:authenticated`, `public.user_preferences:service_role`
- **indexes** adicionado (2): `public.user_preferences_pkey`, `public.user_preferences_user_id_key`
- **lints** adicionado (3): `policy_auth_fn_not_wrapped:public.user_preferences.Users can insert own preferences`, `policy_auth_fn_not_wrapped:public.user_preferences.Users can update own preferences`, `policy_auth_fn_not_wrapped:public.user_preferences.Users can view own preferences`
- **policies (RLS)** adicionado (3): `public.user_preferences.Users can insert own preferences`, `public.user_preferences.Users can update own preferences`, `public.user_preferences.Users can view own preferences`
- **tabelas** adicionado (1): `public.user_preferences`
- **triggers** adicionado (1): `public.user_preferences.set_user_preferences_updated_at`

## 2026-11-25 00:34 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_28`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_21`

## 2026-11-24 11:13 UTC

- **functions** alterado (1): `public.check_ip_in_cidr(p_ip text, p_cidr text)`

## 2026-11-24 10:13 UTC

- **colunas** adicionado (1): `public.user_profiles.avatar_url`
- **migrations** adicionado (8): `20261122180000_data_lake_flush_cron_token`, `20261122200000_rls_initplan_remaining`, `20261123000000_fix_anon_rpc_exposure`, `20261123000100_fix_anon_rls_helper_exposure`, `20261123000200_fix_has_role_oracle_and_debug_tables`, `20261123001000_sync_role_creates_missing_profile`, `20261123002000_b6_text_domain_checks`, `20261123020000_add_avatar_storage`
- **policies (RLS)** adicionado (4): `storage.objects.avatars_delete_own`, `storage.objects.avatars_insert_own`, `storage.objects.avatars_select_own`, `storage.objects.avatars_update_own`
- **storage buckets** adicionado (1): `avatars`

## 2026-11-24 00:31 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_27`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_20`

## 2026-11-23 22:12 UTC

- **functions** alterado (1): `public.get_user_role()`

## 2026-11-23 16:15 UTC

- **functions** alterado (1): `public.check_all_tables_rls_status()`

## 2026-11-23 03:18 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_19`

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


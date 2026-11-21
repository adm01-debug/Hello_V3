# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

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


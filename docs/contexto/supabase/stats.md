# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 26.5 MB |
| schema public | 9.0 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.performance_metrics | ~2.6k | 1.1 MB | 760.0 KB | 368.0 KB | 0 | 1 | ~20 |  |
| public.rate_limit_logs | ~750 | 528.0 KB | 232.0 KB | 264.0 KB | 4 | ~30 | ~1.5k |  |
| public.audit_logs | ~210 | 408.0 KB | 184.0 KB | 192.0 KB | 1 | ~100 | 2 |  |
| public.call_control_audit_logs | ~60 | 256.0 KB | 128.0 KB | 96.0 KB | 0 | ~20 | 0 |  |
| public.call_sessions | ~50 | 200.0 KB | 8.0 KB | 184.0 KB | 4 | ~600 | ~1.3k |  |
| public.voip_trunk_usage_metrics | 3 | 160.0 KB | 8.0 KB | 144.0 KB | 0 | ~20 | 0 |  |
| public.contacts | ~50 | 152.0 KB | 16.0 KB | 104.0 KB | 3 | ~360 | ~80 |  |
| public.call_quality_metrics | 4 | 128.0 KB | 8.0 KB | 112.0 KB | 0 | ~560 | 0 |  |
| public.notifications | 1 | 128.0 KB | 8.0 KB | 112.0 KB | 0 | ~190 | 0 |  |
| public.login_attempts | 2 | 112.0 KB | 8.0 KB | 96.0 KB | 0 | ~20 | 0 |  |
| public.accounts | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 9 | ~20 | ~30 |  |
| public.coaching_assignments | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 8 | ~20 | 4 |  |
| public.deals | ~50 | 96.0 KB | 8.0 KB | 80.0 KB | 3 | ~50 | 0 |  |
| public.playlist_items | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 2 | ~20 | 4 |  |
| public.survey_responses | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~20 | 4 |  |
| public.user_roles | 1 | 88.0 KB | 8.0 KB | 80.0 KB | 0 | ~35.6k | 0 |  |
| public.account_lockouts | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | 0 |  |
| public.active_sessions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | 1 |  |
| public.conversation_messages | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 2 | ~20 | 2 |  |
| public.geo_access_logs | 0 | 80.0 KB | 0 B | 72.0 KB | 0 | ~20 | 0 |  |
| public.hold_events | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~490 | 0 |  |
| public.optimistic_lock_conflicts | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~20 | ~40 | ~700 | 2026-10-20 |
| public.user_profiles | 2 | 80.0 KB | 8.0 KB | 32.0 KB | ~20 | ~43.7k | 1 | 2026-10-20 |
| public.agent_badges | 0 | 72.0 KB | 8.0 KB | 64.0 KB | 9 | ~20 | 1 |  |
| public.call_queues | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | 0 |  |
| public.kb_articles | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | 8 |  |
| public.meeting_summaries | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | 8 |  |
| public.bot_conversations | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~20 | 0 |  |
| public.call_park_orbits | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | 0 |  |
| public.churn_risk_signals | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~20 | 0 |  |
| public.conversations | 0 | 64.0 KB | 0 B | 56.0 KB | 0 | ~20 | ~10 |  |
| public.rls_audit_logs | 0 | 64.0 KB | 0 B | 56.0 KB | 0 | ~80 | 0 |  |
| public.voip_trunks | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.agent_weekly_stats | 0 | 56.0 KB | 8.0 KB | 48.0 KB | ~10 | ~20 | 0 |  |
| public.cadence_enrollments | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 3 |  |
| public.call_transcripts_searchable | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 4 |  |
| public.dialer_queue | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 0 |  |
| public.index_drop_audit | ~40 | 56.0 KB | 8.0 KB | 40.0 KB | 0 | ~20 | 0 |  |
| public.parked_calls | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 5 |  |
| public.saved_filters | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~10 | 1 |  |
| public.shift_swap_suggestions | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 0 |  |
| public.agent_goals | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~20 | 1 |  |
| public.agents | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~26k | 0 |  |
| public.call_playlists | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~20 | 3 |  |
| public.call_summaries | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 2 | ~40 | ~210 |  |
| public.chat_sessions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.compliance_rules | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~20 | 0 |  |
| public.consent_records | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.contact_alerts | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~330 |  |
| public.contact_interactions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~250 | 4 |  |
| public.data_lake_exports | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | ~40 | ~90 | 0 |  |
| public.dnc_list | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 2 |  |
| public.live_assist_signals | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 4 |  |
| public.scheduled_callbacks | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~930 |  |
| public.agent_shifts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.agent_skills | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.agent_trunk_assignments | 0 | 40.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.blocked_access_logs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 2 |  |
| public.call_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~980 |  |
| public.call_scorecards | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 8 |  |
| public.call_transcriptions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 5 |  |
| public.call_translations | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 4 |  |
| public.contact_engagement_patterns | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.crm_field_suggestions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 5 |  |
| public.dialer_favorites | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 5 |  |
| public.email_tickets | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.entity_versions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.fraud_signals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 5 |  |
| public.kb_article_views | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.learning_completions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.objection_library | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.renewals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.ring_groups | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.tracker_matches | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 4 |  |
| public.user_passkeys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 6 |  |
| public.voip_quality_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 4 |  |
| public.webhook_flush_metrics | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~80 |  |
| public.badges | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~30 | ~10 |  |
| public.battle_card_triggers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.cadence_steps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.call_key_moments | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.call_queue_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.call_recordings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 4 |  |
| public.call_records | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 5 | 0 |  |
| public.calling_hours_config | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.coaching_timestamps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.consent_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.deal_revenue_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 3 |  |
| public.email_verification_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.geo_restrictions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.geo_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.goal_violations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.kb_article_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.kb_categories | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.live_sentiment_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.password_reset_requests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.password_reset_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.queue_audio_prompts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.queue_skill_requirements | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.rate_limit_alerts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.redaction_log | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.ring_group_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.scorecard_responses | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.success_plans | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.surveys | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~30 | ~20 |  |
| public.system_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~10 |  |
| public.time_off_requests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.toll_free_numbers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.user_allowed_ips | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.user_mfa_settings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~30 |  |
| public.virtual_fax | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.voice_prints | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.voip_recommendation_actions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.voip_trunk_health_checks | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.webauthn_challenges | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.account_journey_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.agent_ring_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.barge_in_sessions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~330 | 4 |  |
| public.call_analyses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.coaching_recommendations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.compliance_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| public.crm_sync_queue | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.cultural_hints | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.customer_journey_stages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.dialer_campaigns | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| public.holidays | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.ip_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.manager_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.notification_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.permissions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.queue_items | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.rate_limit_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~800 | 0 |  |
| public.role_permissions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.routing_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.scorecard_criteria | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.skills | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.sla_policies | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.success_plan_milestones | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.topic_detections | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.user_ip_restrictions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.webhook_secrets | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.whisper_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~170 | 4 |  |
| public.agent_devices | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.battle_cards | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_departments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_users | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.cadences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.call_flows | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.dashboard_goals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.dnc_import_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.hot_desking_stations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.learning_modules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.migration_rollbacks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 7 | 0 |  |
| public.number_porting_requests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.schema_migrations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 5 | 0 |  |
| public.scorecard_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.security_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.shift_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.topic_trends | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.trackers | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.video_conferences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.voicemail_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.hold_alert_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~180 | 1 |  |
| public.queue_metrics_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.voip_monitoring_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_perf_metrics_created_at | public.performance_metrics | 128.0 KB |


## Storage

_nenhum_


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | 6 |
| confirmados (~) | 5 |
| criados últimos 30d (~) | 3 |

| provider | usuários (~) |
|---|---|
| email | 5 |
| google | 1 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| postgres | ~130 | ~687.9k | 5459.48 | `SELECT schema, "table", column_name, grantee, string_agg(privilege_type, $1 ORDER BY privilege_type) AS privileges FROM ( SELECT n.nspname AS schema, c.relname AS "table", a.attname AS column_name, COALESCE(g.rolname, $2` |
| postgres | 2 | ~264.9k | 132452.35 | `SELECT count(*) FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM information_schema.role_table_grants g WHERE g.table_` |
| postgres | 2 | ~263k | 131503.84 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM` |
| postgres | 1 | ~117.3k | 117288.34 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND table_schema NOT IN ($16,$1` |
| authenticator | ~80 | ~72.5k | 953.85 | `SELECT name FROM pg_timezone_names` |
| postgres | ~130 | ~24.9k | 191.53 | `SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema, (SELECT default_version FROM pg_available_extensions a WHERE a.name = e.extname) AS available_version FROM pg_extension e JOIN pg_namespace n ON n.o` |
| service_role | ~790 | ~18.9k | 23.94 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "_ip_address", "_endpoint", "_user_id" FROM json_to_record(pgrst_payload.json_data) AS _("_ip_address" tex` |
| authenticator | ~80 | ~18.3k | 237.68 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $2), oid) AS base_type FROM pg_type UNIO` |
| postgres | ~130 | ~13.7k | 105.13 | `SELECT n.nspname AS schema, c.relname AS "table", a.attnum AS position, a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, NOT a.attnotnull AS nullable, pg_get_expr(d.adbin, d.adrelid) AS "default", NULLIF(` |
| postgres | 1 | ~11.8k | 11813.21 | `WITH vp AS ( SELECT pr_c.grantee, pr_c.prtype, a.attname, pr_c.relname, pr_c.relnamespace FROM (SELECT c.oid, c.relname, c.relnamespace, (aclexplode(COALESCE(c.relacl, acldefault($1, c.relowner)))).grantee AS grantee, (a` |
| postgres | ~80 | ~8.2k | 108.45 | `UPDATE public.user_profiles SET full_name = $1 \|\| ( COALESCE( NULLIF(regexp_replace(full_name, $2, $3, $4), $5), $6 )::integer + $7 )::text WHERE id = $8` |
| authenticated | ~1.4k | ~7.2k | 5.08 | `WITH pgrst_source AS (INSERT INTO "public"."performance_metrics"("metric_name", "metric_value", "navigation_type", "rating", "url", "user_agent", "user_id") SELECT "pgrst_body"."metric_name", "pgrst_body"."metric_value",` |
| postgres | ~130 | ~6.2k | 47.66 | `SELECT n.nspname AS schema, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = $1 AND p.prokind = $2 AND p.prorettype <> $3` |
| postgres | 1 | ~6.2k | 6150.10 | `WITH vp AS ( SELECT pr_c.grantee, pr_c.prtype, a.attname, pr_c.relname, pr_c.relnamespace FROM (SELECT c.oid, c.relname, c.relnamespace, (aclexplode(COALESCE(c.relacl, acldefault($1, c.relowner)))).grantee AS grantee, (a` |
| postgres | ~20 | ~6.1k | 304.54 | `SELECT e.name, n.nspname AS schema, e.default_version, x.extversion AS installed_version, e.comment, ev.schema AS default_version_schema FROM pg_available_extensions e LEFT JOIN pg_extension x ON e.name = x.extname LEFT ` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 11 |
| pgbouncer | idle | 2 |
| postgres | active | 1 |
| postgres | idle | 1 |
| supabase_admin | idle | 2 |
| supabase_admin |  | 1 |
| supabase_storage_admin | idle | 1 |

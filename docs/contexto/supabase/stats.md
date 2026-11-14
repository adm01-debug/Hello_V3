# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 23.6 MB |
| schema public | 7.8 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.performance_metrics | ~1.4k | 1.0 MB | 760.0 KB | 224.0 KB | 0 | 0 | ~10 |  |
| public.audit_logs | ~200 | 376.0 KB | 184.0 KB | 160.0 KB | 0 | ~10 | 0 |  |
| public.call_control_audit_logs | ~60 | 256.0 KB | 128.0 KB | 96.0 KB | 0 | ~10 | 0 |  |
| public.call_sessions | ~50 | 176.0 KB | 8.0 KB | 160.0 KB | 0 | ~20 | 0 |  |
| public.voip_trunk_usage_metrics | 3 | 160.0 KB | 8.0 KB | 144.0 KB | 0 | ~10 | 0 |  |
| public.rate_limit_logs | 0 | 144.0 KB | 8.0 KB | 128.0 KB | 0 | ~10 | 0 |  |
| public.call_quality_metrics | 4 | 128.0 KB | 8.0 KB | 112.0 KB | 0 | ~10 | 0 |  |
| public.contacts | ~50 | 128.0 KB | 16.0 KB | 80.0 KB | 0 | ~10 | ~80 |  |
| public.notifications | 1 | 128.0 KB | 8.0 KB | 112.0 KB | 0 | ~10 | 0 |  |
| public.login_attempts | 2 | 112.0 KB | 8.0 KB | 96.0 KB | 0 | ~10 | 0 |  |
| public.deals | ~50 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~10 | 0 |  |
| public.user_roles | 1 | 88.0 KB | 8.0 KB | 80.0 KB | 0 | ~10 | 0 |  |
| public.account_lockouts | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | 0 |  |
| public.active_sessions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | 0 |  |
| public.geo_access_logs | 0 | 80.0 KB | 0 B | 72.0 KB | 0 | ~10 | 0 |  |
| public.hold_events | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | 0 |  |
| public.optimistic_lock_conflicts | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~20 | ~40 | ~50 | 2026-10-20 |
| public.user_profiles | 2 | 80.0 KB | 8.0 KB | 32.0 KB | ~20 | ~100 | 0 | 2026-10-20 |
| public.call_queues | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~10 | 0 |  |
| public.kb_articles | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~10 | 0 |  |
| public.meeting_summaries | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~10 | 0 |  |
| public.call_park_orbits | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~10 | 0 |  |
| public.conversations | 0 | 64.0 KB | 0 B | 56.0 KB | 0 | ~10 | 0 |  |
| public.rls_audit_logs | 0 | 64.0 KB | 0 B | 56.0 KB | 0 | ~10 | 0 |  |
| public.voip_trunks | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | 0 |  |
| public.cadence_enrollments | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~10 | 0 |  |
| public.call_transcripts_searchable | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~10 | 0 |  |
| public.dialer_queue | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~10 | 0 |  |
| public.index_drop_audit | ~40 | 56.0 KB | 8.0 KB | 40.0 KB | 0 | ~10 | 0 |  |
| public.parked_calls | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~10 | 0 |  |
| public.shift_swap_suggestions | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~10 | 0 |  |
| public.accounts | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 1 |  |
| public.agents | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~10 | 0 |  |
| public.chat_sessions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.coaching_assignments | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.consent_records | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.contact_alerts | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.contact_interactions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.data_lake_exports | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~10 | 0 |  |
| public.dnc_list | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 1 |  |
| public.live_assist_signals | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.playlist_items | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.scheduled_callbacks | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.survey_responses | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.agent_shifts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.agent_skills | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.agent_trunk_assignments | 0 | 40.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.blocked_access_logs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.call_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 1 |  |
| public.call_scorecards | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.call_transcriptions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 1 |  |
| public.call_translations | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.contact_engagement_patterns | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.conversation_messages | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.crm_field_suggestions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 1 |  |
| public.dialer_favorites | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 1 |  |
| public.email_tickets | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.fraud_signals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 1 |  |
| public.kb_article_views | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.learning_completions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.objection_library | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.renewals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.ring_groups | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.tracker_matches | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.user_passkeys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.voip_quality_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.webhook_flush_metrics | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.agent_badges | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~10 | 1 |  |
| public.battle_card_triggers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 1 |  |
| public.bot_conversations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.cadence_steps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.call_key_moments | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.call_queue_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.call_recordings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.calling_hours_config | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.churn_risk_signals | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.coaching_timestamps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.consent_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.deal_revenue_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.email_verification_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.geo_restrictions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 1 |  |
| public.geo_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~10 | 0 |  |
| public.goal_violations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.kb_article_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.kb_categories | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.live_sentiment_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 1 |  |
| public.password_reset_requests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.password_reset_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.queue_audio_prompts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.queue_skill_requirements | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.rate_limit_alerts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.redaction_log | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.ring_group_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~10 | 0 |  |
| public.scorecard_responses | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.success_plans | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.system_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~10 | 0 |  |
| public.time_off_requests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.toll_free_numbers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.user_allowed_ips | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.user_mfa_settings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.virtual_fax | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.voice_prints | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.voip_recommendation_actions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.voip_trunk_health_checks | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.webauthn_challenges | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.account_journey_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 2 |  |
| public.agent_goals | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 1 |  |
| public.agent_ring_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.agent_weekly_stats | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.barge_in_sessions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.call_analyses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.call_playlists | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.call_summaries | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 1 |  |
| public.coaching_recommendations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.compliance_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.compliance_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 1 |  |
| public.crm_sync_queue | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.cultural_hints | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.customer_journey_stages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.dialer_campaigns | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 1 |  |
| public.holidays | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.ip_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.manager_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.notification_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.permissions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.rate_limit_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.role_permissions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.routing_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.scorecard_criteria | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.skills | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.sla_policies | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.success_plan_milestones | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.topic_detections | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.user_ip_restrictions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.webhook_secrets | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.whisper_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.agent_devices | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 1 |  |
| public.badges | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 1 |  |
| public.battle_cards | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.bitrix_departments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.bitrix_users | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.cadences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.call_flows | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 1 |  |
| public.dashboard_goals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.dnc_import_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.hot_desking_stations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.learning_modules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 1 |  |
| public.number_porting_requests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.scorecard_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.security_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.shift_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.surveys | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.topic_trends | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.trackers | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.video_conferences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.voicemail_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.hold_alert_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~10 | 1 |  |
| public.queue_metrics_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.voip_monitoring_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_perf_metrics_created_at | public.performance_metrics | 72.0 KB |


## Storage

_nenhum_


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | 3 |
| confirmados (~) | 3 |
| criados últimos 30d (~) | 1 |

| provider | usuários (~) |
|---|---|
| email | 2 |
| google | 1 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| postgres | ~50 | ~273.3k | 5358.04 | `SELECT schema, "table", column_name, grantee, string_agg(privilege_type, $1 ORDER BY privilege_type) AS privileges FROM ( SELECT n.nspname AS schema, c.relname AS "table", a.attname AS column_name, COALESCE(g.rolname, $2` |
| postgres | 2 | ~264.9k | 132452.35 | `SELECT count(*) FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM information_schema.role_table_grants g WHERE g.table_` |
| postgres | 2 | ~263k | 131503.84 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM` |
| postgres | 1 | ~117.3k | 117288.34 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND table_schema NOT IN ($16,$1` |
| authenticator | ~20 | ~17.3k | 1020.49 | `SELECT name FROM pg_timezone_names` |
| postgres | 1 | ~11.8k | 11813.21 | `WITH vp AS ( SELECT pr_c.grantee, pr_c.prtype, a.attname, pr_c.relname, pr_c.relnamespace FROM (SELECT c.oid, c.relname, c.relnamespace, (aclexplode(COALESCE(c.relacl, acldefault($1, c.relowner)))).grantee AS grantee, (a` |
| postgres | ~60 | ~8.4k | 152.36 | `SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema, (SELECT default_version FROM pg_available_extensions a WHERE a.name = e.extname) AS available_version FROM pg_extension e JOIN pg_namespace n ON n.o` |
| postgres | ~80 | ~8.2k | 108.45 | `UPDATE public.user_profiles SET full_name = $1 \|\| ( COALESCE( NULLIF(regexp_replace(full_name, $2, $3, $4), $5), $6 )::integer + $7 )::text WHERE id = $8` |
| postgres | 1 | ~6.2k | 6150.10 | `WITH vp AS ( SELECT pr_c.grantee, pr_c.prtype, a.attname, pr_c.relname, pr_c.relnamespace FROM (SELECT c.oid, c.relname, c.relnamespace, (aclexplode(COALESCE(c.relacl, acldefault($1, c.relowner)))).grantee AS grantee, (a` |
| postgres | ~20 | ~6.1k | 304.54 | `SELECT e.name, n.nspname AS schema, e.default_version, x.extversion AS installed_version, e.comment, ev.schema AS default_version_schema FROM pg_available_extensions e LEFT JOIN pg_extension x ON e.name = x.extname LEFT ` |
| postgres | 1 | ~5.6k | 5561.18 | `WITH vp AS ( SELECT pr_c.grantee, pr_c.prtype, a.attname, pr_c.relname, pr_c.relnamespace FROM (SELECT c.oid, c.relname, c.relnamespace, (aclexplode(COALESCE(c.relacl, acldefault($1, c.relowner)))).grantee AS grantee, (a` |
| postgres | 1 | ~4.6k | 4553.59 | `with page as ( select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.relreplident, nc.nspname as schema, -- Computed once here so the final select can reference it for both the -- raw byte count and pg_size` |
| postgres | ~60 | ~3.4k | 61.95 | `SELECT n.nspname AS schema, c.relname AS "table", a.attnum AS position, a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, NOT a.attnotnull AS nullable, pg_get_expr(d.adbin, d.adrelid) AS "default", NULLIF(` |
| authenticator | ~20 | ~3.4k | 187.69 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $2), oid) AS base_type FROM pg_type UNIO` |
| postgres | ~60 | ~2.7k | 48.37 | `SELECT n.nspname AS schema, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = $1 AND p.prokind = $2 AND p.prorettype <> $3` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 1 |
| pgbouncer | idle | 2 |
| postgres | active | 1 |
| postgres | idle | 1 |
| supabase_admin | idle | 2 |
| supabase_admin |  | 1 |
| supabase_storage_admin | idle | 1 |


## Saúde dos serviços
```json
[
  {
    "healthy": true,
    "info": {
      "description": "GoTrue is a user registration and authentication API",
      "name": "GoTrue",
      "version": "v2.197.0"
    },
    "name": "auth",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "db",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "pooler",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "info": {
      "connected_cluster": 0,
      "db_connected": false,
      "healthy": true,
      "node": "realtime@2600:1f18:67fc:ac00:86bf:e206:1da0:f3ae",
      "region": "us-east-1",
      "replication_connected": false
    },
    "name": "realtime",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "info": {
      "db_schema": "public,graphql_public"
    },
    "name": "rest",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "storage",
    "status": "ACTIVE_HEALTHY"
  }
]
```

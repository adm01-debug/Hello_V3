# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 38.7 MB |
| schema public | 15.6 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.performance_metrics | ~10.5k | 4.7 MB | 3.5 MB | 1.1 MB | 0 | ~10 | ~30 | 2026-11-24 |
| public.rate_limit_logs | ~4.9k | 2.2 MB | 1.1 MB | 1.0 MB | 0 | ~30 | ~10.8k | 2026-11-24 |
| public.audit_logs | ~340 | 552.0 KB | 280.0 KB | 240.0 KB | ~60 | ~460 | ~260 |  |
| public.call_sessions | ~100 | 312.0 KB | 16.0 KB | 264.0 KB | 4 | ~2.5k | ~8.4k |  |
| public.call_control_audit_logs | ~60 | 304.0 KB | 176.0 KB | 96.0 KB | ~60 | ~20 | 0 |  |
| public.contacts | ~100 | 168.0 KB | 24.0 KB | 112.0 KB | 4 | ~2.9k | ~90 |  |
| public.notifications | 1 | 160.0 KB | 16.0 KB | 112.0 KB | ~20 | ~2.2k | 0 |  |
| public.voip_trunk_usage_metrics | 3 | 160.0 KB | 8.0 KB | 144.0 KB | 0 | ~20 | 0 |  |
| public.call_quality_metrics | 4 | 128.0 KB | 8.0 KB | 112.0 KB | ~40 | ~4.2k | ~50 |  |
| public.conversations | 0 | 128.0 KB | 8.0 KB | 112.0 KB | 3 | ~100 | ~80 |  |
| public.deals | ~100 | 128.0 KB | 16.0 KB | 80.0 KB | 3 | ~200 | ~20 |  |
| public.geo_access_logs | 0 | 112.0 KB | 8.0 KB | 96.0 KB | 6 | ~20 | 6 |  |
| public.login_attempts | 2 | 112.0 KB | 8.0 KB | 96.0 KB | 4 | ~20 | 0 |  |
| public.parked_calls | 0 | 112.0 KB | 8.0 KB | 96.0 KB | 3 | ~40 | ~20 |  |
| public.saved_filters | 0 | 104.0 KB | 8.0 KB | 88.0 KB | 1 | ~10 | ~20 |  |
| public.accounts | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~100 | ~40 |  |
| public.chat_sessions | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~20 | 1 |  |
| public.coaching_assignments | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~40 | ~20 |  |
| public.consent_records | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 3 | ~270 | 0 |  |
| public.dnc_list | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 5 | ~1.5k | ~20 |  |
| public.live_assist_signals | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~80 | 4 |  |
| public.optimistic_lock_conflicts | ~10 | 96.0 KB | 8.0 KB | 48.0 KB | ~40 | ~2k | ~2.9k | 2026-11-22 |
| public.playlist_items | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 2 | ~20 | 5 |  |
| public.survey_responses | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~30 | 5 |  |
| public.user_roles | 1 | 88.0 KB | 8.0 KB | 80.0 KB | ~40 | ~450k | 8 |  |
| public.account_lockouts | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 1 | ~20 | 1 |  |
| public.active_sessions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | ~10 |  |
| public.agent_shifts | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 2 | ~20 | 6 |  |
| public.call_scorecards | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~30 | ~20 |  |
| public.conversation_messages | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 4 | ~20 | 7 |  |
| public.crm_field_suggestions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | 6 |  |
| public.data_lake_exports | ~20 | 80.0 KB | 8.0 KB | 32.0 KB | ~50 | ~200 | 0 | 2026-11-22 |
| public.entity_versions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 2 | ~30 | 4 |  |
| public.hold_events | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~3.1k | 0 |  |
| public.rls_audit_logs | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 5 | ~490 | 0 |  |
| public.user_profiles | 2 | 80.0 KB | 8.0 KB | 32.0 KB | ~40 | ~164.5k | ~10 | 2026-10-20 |
| public.agent_badges | 0 | 72.0 KB | 8.0 KB | 64.0 KB | 9 | ~30 | 1 |  |
| public.call_queues | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | 0 |  |
| public.kb_articles | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | ~10 |  |
| public.meeting_summaries | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | ~100 |  |
| public.bot_conversations | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~20 | 1 |  |
| public.call_key_moments | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~80 | ~10 |  |
| public.call_park_orbits | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.call_recordings | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~50 | 6 |  |
| public.calling_hours_config | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | ~1.5k |  |
| public.churn_risk_signals | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~30 | ~120 |  |
| public.geo_restrictions | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 4 | ~40 | 1 |  |
| public.scorecard_responses | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~20 | 4 |  |
| public.time_off_requests | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~20 | 5 |  |
| public.voip_trunk_health_checks | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 1 |  |
| public.voip_trunks | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~30 | 0 |  |
| public.agent_weekly_stats | 0 | 56.0 KB | 8.0 KB | 48.0 KB | ~10 | ~20 | 0 |  |
| public.cadence_enrollments | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 3 |  |
| public.call_transcripts_searchable | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 5 |  |
| public.dialer_queue | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 2 |  |
| public.index_drop_audit | ~40 | 56.0 KB | 8.0 KB | 40.0 KB | 0 | ~20 | 0 |  |
| public.shift_swap_suggestions | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 2 |  |
| public.agent_goals | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~80 | 1 |  |
| public.agent_ring_settings | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~20 | 0 |  |
| public.agents | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~136.4k | 0 |  |
| public.call_playlists | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 5 | ~30 | 7 |  |
| public.call_summaries | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~140 | ~8.3k |  |
| public.compliance_rules | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~30 | 1 |  |
| public.compliance_settings | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~1.4k |  |
| public.contact_alerts | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~2.3k |  |
| public.contact_interactions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~390 | ~10 |  |
| public.dialer_campaigns | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~40 | ~4k |  |
| public.holidays | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | ~20 |  |
| public.scheduled_callbacks | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~5.9k |  |
| public.scorecard_criteria | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~20 | 6 |  |
| public.webhook_secrets | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 8 | ~20 | 5 |  |
| public.agent_skills | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.agent_trunk_assignments | 0 | 40.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.blocked_access_logs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~20 |  |
| public.call_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~7k |  |
| public.call_transcriptions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~70 |  |
| public.call_translations | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~60 |  |
| public.contact_engagement_patterns | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~80 | 0 |  |
| public.dialer_favorites | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~100 |  |
| public.email_tickets | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.fraud_signals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 6 |  |
| public.kb_article_views | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.learning_completions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.objection_library | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.renewals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~60 |  |
| public.ring_groups | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.tracker_matches | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 4 |  |
| public.user_passkeys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~50 |  |
| public.voip_quality_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~10 |  |
| public.webhook_flush_metrics | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~500 |  |
| public.agent_devices | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~20 | 1 |  |
| public.badges | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~40 | ~10 |  |
| public.battle_card_triggers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.cadence_steps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.call_queue_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.call_records | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 5 | 0 |  |
| public.coaching_timestamps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.consent_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.deal_revenue_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 3 |  |
| public.email_verification_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.geo_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 9 | ~50 | 0 |  |
| public.goal_violations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.kb_article_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~20 |  |
| public.kb_categories | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.live_sentiment_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.password_reset_requests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.password_reset_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~20 |  |
| public.queue_audio_prompts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.queue_skill_requirements | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.rate_limit_alerts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~30 |  |
| public.redaction_log | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.ring_group_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.scorecard_templates | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~20 | 5 |  |
| public.success_plans | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.surveys | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~30 | ~20 |  |
| public.system_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~10 |  |
| public.toll_free_numbers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.user_allowed_ips | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.user_mfa_settings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~3.6k |  |
| public.virtual_fax | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.voice_prints | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~20 |  |
| public.voip_recommendation_actions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.webauthn_challenges | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.account_journey_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.barge_in_sessions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~2k | 4 |  |
| public.call_analyses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.coaching_recommendations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.crm_sync_queue | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 3 |  |
| public.cultural_hints | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.customer_journey_stages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.ip_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.manager_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.notification_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~1k |  |
| public.permissions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.queue_items | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.rate_limit_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~5.5k | 1 |  |
| public.role_permissions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.routing_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.skills | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.sla_policies | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 3 |  |
| public.success_plan_milestones | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.topic_detections | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.user_ip_restrictions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~20 |  |
| public.whisper_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1k | 4 |  |
| public.battle_cards | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_departments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_users | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.cadences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.call_flows | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.dashboard_goals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~90 | 0 |  |
| public.dnc_import_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.hot_desking_stations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.learning_modules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.migration_rollbacks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 8 | 0 |  |
| public.number_porting_requests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.schema_migrations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 7 | 0 |  |
| public.security_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.shift_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.topic_trends | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.trackers | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.video_conferences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.voicemail_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.hold_alert_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~1k | 1 |  |
| public.queue_metrics_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.voip_monitoring_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_perf_metrics_created_at | public.performance_metrics | 456.0 KB |


## Storage

| bucket | objetos (~) | tamanho |
|---|---|---|
| data-lake-exports | 4 | 81.0 KB |


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | ~10 |
| confirmados (~) | 8 |
| criados últimos 30d (~) | 7 |

| provider | usuários (~) |
|---|---|
| email | 9 |
| google | 1 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| postgres | ~200 | ~1.1M | 5560.75 | `SELECT schema, "table", column_name, grantee, string_agg(privilege_type, $1 ORDER BY privilege_type) AS privileges FROM ( SELECT n.nspname AS schema, c.relname AS "table", a.attname AS column_name, COALESCE(g.rolname, $2` |
| authenticator | ~540 | ~410.7k | 763.40 | `SELECT name FROM pg_timezone_names` |
| postgres | 2 | ~264.9k | 132452.35 | `SELECT count(*) FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM information_schema.role_table_grants g WHERE g.table_` |
| postgres | 2 | ~263k | 131503.84 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM` |
| postgres | 1 | ~117.3k | 117288.34 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND table_schema NOT IN ($16,$1` |
| authenticator | ~540 | ~112.2k | 208.18 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $2), oid) AS base_type FROM pg_type UNIO` |
| service_role | ~5.5k | ~111.2k | 20.41 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "_ip_address", "_endpoint", "_user_id" FROM json_to_record(pgrst_payload.json_data) AS _("_ip_address" tex` |
| postgres | ~4k | ~62.4k | 15.46 | `SELECT net.http_post( url := $1, headers := jsonb_build_object( $2, $3, $4, $5 \|\| ( SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = $6 ) ), body := jsonb_build_object($7, $8) )` |
| postgres | ~200 | ~45.8k | 230.09 | `SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema, (SELECT default_version FROM pg_available_extensions a WHERE a.name = e.extname) AS available_version FROM pg_extension e JOIN pg_namespace n ON n.o` |
| authenticated | ~9.7k | ~39.8k | 4.12 | `WITH pgrst_source AS (INSERT INTO "public"."performance_metrics"("metric_name", "metric_value", "navigation_type", "rating", "url", "user_agent", "user_id") SELECT "pgrst_body"."metric_name", "pgrst_body"."metric_value",` |
| authenticator | ~530 | ~39.5k | 73.95 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $3), oid) AS base_type FROM pg_type UNIO` |
| postgres | ~200 | ~31.7k | 159.37 | `SELECT n.nspname AS schema, c.relname AS "table", a.attnum AS position, a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, NOT a.attnotnull AS nullable, pg_get_expr(d.adbin, d.adrelid) AS "default", NULLIF(` |
| authenticated | ~990 | ~19.2k | 19.48 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT "public"."get_call_volume_stats"() pgrst_scalar) pgrst_call) SELECT $3::bigint AS total_result_set, $4 AS page_total, coalesce(json_agg(_postgrest_t.pgrst` |
| authenticated | ~440 | ~17.7k | 40.47 | `WITH pgrst_source AS ( SELECT "public"."audit_logs".* FROM "public"."audit_logs" ORDER BY "public"."audit_logs"."created_at" DESC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t)` |
| authenticated | ~1.6k | ~15.6k | 9.77 | `WITH pgrst_source AS ( SELECT "public"."contacts".* FROM "public"."contacts" ORDER BY "public"."contacts"."updated_at" DESC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS pa` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 11 |
| pgbouncer | idle | 1 |
| postgres | active | 1 |
| postgres | idle | 1 |
| supabase_admin | active | 1 |
| supabase_admin | idle | 7 |
| supabase_admin |  | 1 |
| supabase_auth_admin | idle | 4 |

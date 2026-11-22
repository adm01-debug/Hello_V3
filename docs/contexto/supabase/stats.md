# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 31.5 MB |
| schema public | 11.8 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.performance_metrics | ~4.6k | 2.5 MB | 1.9 MB | 560.0 KB | 0 | 2 | ~20 | 2026-11-22 |
| public.rate_limit_logs | ~2k | 864.0 KB | 368.0 KB | 456.0 KB | 1 | ~30 | ~4.1k | 2026-11-22 |
| public.audit_logs | ~330 | 536.0 KB | 272.0 KB | 232.0 KB | ~60 | ~230 | ~240 |  |
| public.call_sessions | ~100 | 312.0 KB | 16.0 KB | 264.0 KB | 4 | ~1.3k | ~3.3k |  |
| public.call_control_audit_logs | ~60 | 296.0 KB | 168.0 KB | 96.0 KB | ~60 | ~20 | 0 |  |
| public.contacts | ~100 | 168.0 KB | 24.0 KB | 112.0 KB | 1 | ~840 | ~80 |  |
| public.notifications | 1 | 160.0 KB | 16.0 KB | 112.0 KB | ~20 | ~510 | 0 |  |
| public.voip_trunk_usage_metrics | 3 | 160.0 KB | 8.0 KB | 144.0 KB | 0 | ~20 | 0 |  |
| public.call_quality_metrics | 4 | 128.0 KB | 8.0 KB | 112.0 KB | ~40 | ~1.5k | ~10 |  |
| public.conversations | 0 | 128.0 KB | 8.0 KB | 112.0 KB | 3 | ~30 | ~20 |  |
| public.deals | ~100 | 128.0 KB | 16.0 KB | 80.0 KB | 3 | ~130 | 4 |  |
| public.login_attempts | 2 | 112.0 KB | 8.0 KB | 96.0 KB | 4 | ~20 | 0 |  |
| public.parked_calls | 0 | 112.0 KB | 8.0 KB | 96.0 KB | 3 | ~40 | ~10 |  |
| public.accounts | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~40 | ~40 |  |
| public.chat_sessions | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~20 | 1 |  |
| public.coaching_assignments | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~40 | ~20 |  |
| public.consent_records | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 1 | ~20 | 0 |  |
| public.dnc_list | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 5 | ~30 | ~20 |  |
| public.optimistic_lock_conflicts | ~10 | 96.0 KB | 8.0 KB | 48.0 KB | ~10 | ~460 | ~1.3k | 2026-11-22 |
| public.playlist_items | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 2 | ~20 | 5 |  |
| public.survey_responses | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~30 | 5 |  |
| public.user_roles | 1 | 88.0 KB | 8.0 KB | 80.0 KB | ~40 | ~129.9k | 6 |  |
| public.account_lockouts | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 1 | ~20 | 1 |  |
| public.active_sessions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | 4 |  |
| public.agent_shifts | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 2 | ~20 | 6 |  |
| public.call_scorecards | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~30 | ~20 |  |
| public.conversation_messages | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 4 | ~20 | 6 |  |
| public.data_lake_exports | ~20 | 80.0 KB | 8.0 KB | 32.0 KB | ~40 | ~180 | 0 | 2026-11-22 |
| public.geo_access_logs | 0 | 80.0 KB | 0 B | 72.0 KB | 0 | ~20 | 0 |  |
| public.hold_events | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~1.2k | 0 |  |
| public.rls_audit_logs | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 5 | ~240 | 0 |  |
| public.user_profiles | 2 | 80.0 KB | 8.0 KB | 32.0 KB | ~40 | ~82.4k | ~10 | 2026-10-20 |
| public.agent_badges | 0 | 72.0 KB | 8.0 KB | 64.0 KB | 9 | ~30 | 1 |  |
| public.call_queues | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | 0 |  |
| public.kb_articles | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | ~10 |  |
| public.meeting_summaries | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | ~20 |  |
| public.bot_conversations | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~20 | 1 |  |
| public.call_key_moments | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~20 | 8 |  |
| public.call_park_orbits | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.call_recordings | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~40 | 6 |  |
| public.calling_hours_config | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | ~40 |  |
| public.churn_risk_signals | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~30 | 4 |  |
| public.scorecard_responses | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~20 | 4 |  |
| public.time_off_requests | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~20 | 5 |  |
| public.voip_trunk_health_checks | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 1 |  |
| public.voip_trunks | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~30 | 0 |  |
| public.agent_weekly_stats | 0 | 56.0 KB | 8.0 KB | 48.0 KB | ~10 | ~20 | 0 |  |
| public.cadence_enrollments | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 3 |  |
| public.call_transcripts_searchable | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 5 |  |
| public.dialer_queue | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 2 |  |
| public.index_drop_audit | ~40 | 56.0 KB | 8.0 KB | 40.0 KB | 0 | ~20 | 0 |  |
| public.saved_filters | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~10 | 6 |  |
| public.shift_swap_suggestions | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 2 |  |
| public.agent_goals | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~20 | 1 |  |
| public.agent_ring_settings | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~20 | 0 |  |
| public.agents | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~56.7k | 0 |  |
| public.call_playlists | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 5 | ~30 | 7 |  |
| public.call_summaries | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~80 | ~860 |  |
| public.compliance_rules | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~30 | 1 |  |
| public.compliance_settings | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~10 |  |
| public.contact_alerts | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~780 |  |
| public.contact_interactions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~390 | 9 |  |
| public.dialer_campaigns | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~40 | ~980 |  |
| public.holidays | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | ~20 |  |
| public.live_assist_signals | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 4 |  |
| public.scheduled_callbacks | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~2.4k |  |
| public.scorecard_criteria | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~20 | 6 |  |
| public.webhook_secrets | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 8 | ~20 | 5 |  |
| public.agent_skills | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.agent_trunk_assignments | 0 | 40.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.blocked_access_logs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 5 |  |
| public.call_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~2.4k |  |
| public.call_transcriptions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 5 |  |
| public.call_translations | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 5 |  |
| public.contact_engagement_patterns | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.crm_field_suggestions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 6 |  |
| public.dialer_favorites | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~10 |  |
| public.email_tickets | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.entity_versions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.fraud_signals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 6 |  |
| public.kb_article_views | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.learning_completions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.objection_library | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.renewals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 3 |  |
| public.ring_groups | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.tracker_matches | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 4 |  |
| public.user_passkeys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~20 |  |
| public.voip_quality_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~10 |  |
| public.webhook_flush_metrics | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~230 |  |
| public.agent_devices | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~20 | 1 |  |
| public.badges | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~40 | ~10 |  |
| public.battle_card_triggers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.cadence_steps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.call_queue_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.call_records | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 5 | 0 |  |
| public.coaching_timestamps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.consent_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.deal_revenue_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 3 |  |
| public.email_verification_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.geo_restrictions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.geo_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | 0 |  |
| public.goal_violations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.kb_article_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.kb_categories | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.live_sentiment_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.password_reset_requests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.password_reset_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.queue_audio_prompts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.queue_skill_requirements | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.rate_limit_alerts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.redaction_log | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.ring_group_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.scorecard_templates | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~20 | 5 |  |
| public.success_plans | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.surveys | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~30 | ~20 |  |
| public.system_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~10 |  |
| public.toll_free_numbers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.user_allowed_ips | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.user_mfa_settings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~860 |  |
| public.virtual_fax | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.voice_prints | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.voip_recommendation_actions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.webauthn_challenges | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.account_journey_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.barge_in_sessions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~830 | 4 |  |
| public.call_analyses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.coaching_recommendations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.crm_sync_queue | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 3 |  |
| public.cultural_hints | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.customer_journey_stages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.ip_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.manager_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.notification_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.permissions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.queue_items | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.rate_limit_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~2.1k | 0 |  |
| public.role_permissions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.routing_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.skills | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.sla_policies | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 3 |  |
| public.success_plan_milestones | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.topic_detections | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.user_ip_restrictions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~20 | 6 |  |
| public.whisper_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~420 | 4 |  |
| public.battle_cards | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_departments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_users | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.cadences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.call_flows | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.dashboard_goals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
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
| public.hold_alert_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~430 | 1 |  |
| public.queue_metrics_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.voip_monitoring_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_perf_metrics_created_at | public.performance_metrics | 208.0 KB |


## Storage

| bucket | objetos (~) | tamanho |
|---|---|---|
| data-lake-exports | 4 | 81.0 KB |


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | 9 |
| confirmados (~) | 7 |
| criados últimos 30d (~) | 6 |

| provider | usuários (~) |
|---|---|
| email | 8 |
| google | 1 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| postgres | ~140 | ~792.3k | 5501.97 | `SELECT schema, "table", column_name, grantee, string_agg(privilege_type, $1 ORDER BY privilege_type) AS privileges FROM ( SELECT n.nspname AS schema, c.relname AS "table", a.attname AS column_name, COALESCE(g.rolname, $2` |
| postgres | 2 | ~264.9k | 132452.35 | `SELECT count(*) FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM information_schema.role_table_grants g WHERE g.table_` |
| postgres | 2 | ~263k | 131503.84 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM` |
| authenticator | ~220 | ~174.9k | 809.77 | `SELECT name FROM pg_timezone_names` |
| postgres | 1 | ~117.3k | 117288.34 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND table_schema NOT IN ($16,$1` |
| authenticator | ~220 | ~46.1k | 212.58 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $2), oid) AS base_type FROM pg_type UNIO` |
| service_role | ~2.1k | ~43.3k | 20.58 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "_ip_address", "_endpoint", "_user_id" FROM json_to_record(pgrst_payload.json_data) AS _("_ip_address" tex` |
| postgres | ~150 | ~30.4k | 205.46 | `SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema, (SELECT default_version FROM pg_available_extensions a WHERE a.name = e.extname) AS available_version FROM pg_extension e JOIN pg_namespace n ON n.o` |
| postgres | ~150 | ~17.6k | 118.76 | `SELECT n.nspname AS schema, c.relname AS "table", a.attnum AS position, a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, NOT a.attnotnull AS nullable, pg_get_expr(d.adbin, d.adrelid) AS "default", NULLIF(` |
| authenticator | ~210 | ~16k | 75.26 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $3), oid) AS base_type FROM pg_type UNIO` |
| postgres | ~970 | ~15.3k | 15.81 | `SELECT net.http_post( url := $1, headers := jsonb_build_object( $2, $3, $4, $5 \|\| ( SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = $6 ) ), body := jsonb_build_object($7, $8) )` |
| authenticated | ~3.4k | ~14.2k | 4.20 | `WITH pgrst_source AS (INSERT INTO "public"."performance_metrics"("metric_name", "metric_value", "navigation_type", "rating", "url", "user_agent", "user_id") SELECT "pgrst_body"."metric_name", "pgrst_body"."metric_value",` |
| postgres | 1 | ~11.8k | 11813.21 | `WITH vp AS ( SELECT pr_c.grantee, pr_c.prtype, a.attname, pr_c.relname, pr_c.relnamespace FROM (SELECT c.oid, c.relname, c.relnamespace, (aclexplode(COALESCE(c.relacl, acldefault($1, c.relowner)))).grantee AS grantee, (a` |
| authenticated | ~400 | ~8.7k | 21.58 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT "public"."get_call_volume_stats"() pgrst_scalar) pgrst_call) SELECT $3::bigint AS total_result_set, $4 AS page_total, coalesce(json_agg(_postgrest_t.pgrst` |
| postgres | ~80 | ~8.2k | 108.45 | `UPDATE public.user_profiles SET full_name = $1 \|\| ( COALESCE( NULLIF(regexp_replace(full_name, $2, $3, $4), $5), $6 )::integer + $7 )::text WHERE id = $8` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 11 |
| pgbouncer | idle | 2 |
| postgres | active | 2 |
| supabase_admin | active | 1 |
| supabase_admin | idle | 8 |
| supabase_admin |  | 1 |
| supabase_auth_admin | idle | 6 |
| supabase_storage_admin | idle | 1 |

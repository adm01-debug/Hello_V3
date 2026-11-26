# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 45.9 MB |
| schema public | 20.3 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.performance_metrics | ~23.2k | 8.4 MB | 6.2 MB | 2.2 MB | 0 | ~20 | ~30 | 2026-11-26 |
| public.rate_limit_logs | ~6.1k | 2.3 MB | 1.1 MB | 1.2 MB | ~160 | ~30 | ~13.4k | 2026-11-24 |
| public.audit_logs | ~340 | 584.0 KB | 280.0 KB | 264.0 KB | ~10 | ~530 | ~300 | 2026-11-26 |
| public.call_control_audit_logs | ~100 | 352.0 KB | 216.0 KB | 96.0 KB | ~70 | ~20 | 0 | 2026-11-26 |
| public.call_sessions | ~100 | 328.0 KB | 16.0 KB | 280.0 KB | 5 | ~3.9k | ~18.1k |  |
| public.kb_articles | 0 | 192.0 KB | 8.0 KB | 160.0 KB | ~40 | ~90 | ~90 | 2026-11-26 |
| public.contacts | ~100 | 184.0 KB | 24.0 KB | 128.0 KB | 4 | ~9.4k | ~90 |  |
| public.notifications | 1 | 176.0 KB | 32.0 KB | 112.0 KB | ~30 | ~5.2k | ~450 |  |
| public.voip_trunk_usage_metrics | 3 | 160.0 KB | 8.0 KB | 144.0 KB | 0 | ~30 | 0 |  |
| public.login_attempts | 9 | 144.0 KB | 8.0 KB | 96.0 KB | ~50 | ~20 | 0 | 2026-11-26 |
| public.call_quality_metrics | 4 | 128.0 KB | 8.0 KB | 112.0 KB | ~40 | ~7.5k | ~160 |  |
| public.conversations | 0 | 128.0 KB | 8.0 KB | 112.0 KB | 3 | ~480 | ~450 |  |
| public.deals | ~100 | 128.0 KB | 16.0 KB | 80.0 KB | 3 | ~690 | ~20 |  |
| public.user_roles | 5 | 120.0 KB | 8.0 KB | 80.0 KB | 5 | ~1.2M | 8 | 2026-11-26 |
| public.account_lockouts | 1 | 112.0 KB | 8.0 KB | 64.0 KB | 0 | ~240 | ~270 | 2026-11-26 |
| public.dnc_list | 0 | 112.0 KB | 8.0 KB | 80.0 KB | ~10 | ~5k | ~260 | 2026-11-26 |
| public.geo_access_logs | 0 | 112.0 KB | 8.0 KB | 96.0 KB | 6 | ~20 | 6 |  |
| public.parked_calls | 0 | 112.0 KB | 8.0 KB | 96.0 KB | 3 | ~40 | ~20 |  |
| public.saved_filters | 0 | 104.0 KB | 8.0 KB | 88.0 KB | 1 | ~10 | ~20 |  |
| public.accounts | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~470 | ~40 |  |
| public.chat_sessions | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~20 | 1 |  |
| public.client_errors | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~50 | ~50 | ~200 | 2026-11-26 |
| public.coaching_assignments | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~40 | ~20 |  |
| public.consent_records | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 3 | ~1.7k | 0 |  |
| public.conversation_messages | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 9 | ~30 | 7 |  |
| public.live_assist_signals | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~440 | 4 |  |
| public.optimistic_lock_conflicts | ~10 | 96.0 KB | 8.0 KB | 48.0 KB | ~40 | ~5.3k | ~6.1k | 2026-11-22 |
| public.playlist_items | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 2 | ~20 | 5 |  |
| public.survey_responses | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~10 | ~30 | 5 |  |
| public.active_sessions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | ~10 |  |
| public.agent_shifts | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 2 | ~20 | 7 |  |
| public.call_scorecards | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~40 | ~20 |  |
| public.crm_field_suggestions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | 6 |  |
| public.data_lake_exports | ~20 | 80.0 KB | 8.0 KB | 32.0 KB | ~50 | ~210 | 0 | 2026-11-22 |
| public.entity_versions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 2 | ~30 | 4 |  |
| public.geo_restrictions | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~10 | ~40 | ~60 | 2026-11-26 |
| public.hold_events | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~5.6k | 0 |  |
| public.kb_article_history | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~40 | ~110 | ~40 | 2026-11-26 |
| public.learning_completions | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~20 | 4 |  |
| public.rls_audit_logs | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 5 | ~570 | 0 |  |
| public.user_profiles | 2 | 80.0 KB | 8.0 KB | 32.0 KB | ~50 | ~353.9k | ~60 | 2026-10-20 |
| public.agent_badges | 0 | 72.0 KB | 8.0 KB | 64.0 KB | 9 | ~30 | 7 |  |
| public.call_queues | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | 0 |  |
| public.meeting_summaries | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | ~460 |  |
| public.bot_conversations | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~20 | 1 |  |
| public.call_key_moments | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~440 | ~10 |  |
| public.call_park_orbits | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~40 | 0 |  |
| public.call_recordings | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~50 | 6 |  |
| public.calling_hours_config | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~20 | ~100 | ~5.2k |  |
| public.churn_risk_signals | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~30 | ~860 |  |
| public.geo_settings | 1 | 64.0 KB | 8.0 KB | 16.0 KB | ~20 | ~90 | ~20 | 2026-11-26 |
| public.redaction_log | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~40 | ~130 | 4 |  |
| public.scorecard_responses | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~20 | 4 |  |
| public.time_off_requests | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~20 | 5 |  |
| public.voip_trunk_health_checks | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 1 |  |
| public.voip_trunks | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~30 | 0 |  |
| public.agent_weekly_stats | 0 | 56.0 KB | 8.0 KB | 48.0 KB | ~40 | ~20 | ~40 |  |
| public.cadence_enrollments | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 3 |  |
| public.call_transcripts_searchable | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 5 |  |
| public.deal_pipeline_snapshots | 1 | 56.0 KB | 8.0 KB | 16.0 KB | 2 | ~240 | ~250 | 2026-11-26 |
| public.dialer_queue | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | 2 |  |
| public.index_drop_audit | ~40 | 56.0 KB | 8.0 KB | 40.0 KB | 0 | ~20 | 0 |  |
| public.shift_swap_suggestions | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~20 | ~10 |  |
| public.user_preferences | 0 | 56.0 KB | 8.0 KB | 32.0 KB | 6 | ~60 | ~320 | 2026-11-26 |
| public.agent_goals | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~450 | 1 |  |
| public.agent_ring_settings | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~20 | 0 |  |
| public.agents | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 7 | ~317.2k | 0 |  |
| public.call_playlists | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 5 | ~30 | 7 |  |
| public.call_summaries | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~520 | ~64.7k |  |
| public.compliance_rules | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~30 | 1 |  |
| public.compliance_settings | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~4.9k |  |
| public.contact_alerts | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~7.4k |  |
| public.contact_interactions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~400 | ~10 |  |
| public.crm_sync_queue | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~20 | 9 |  |
| public.dialer_campaigns | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~40 | ~6.8k |  |
| public.holidays | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~140 | ~20 |  |
| public.scheduled_callbacks | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | ~10.5k |  |
| public.scorecard_criteria | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~20 | 6 |  |
| public.webhook_secrets | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~40 | ~60 | ~100 |  |
| public.agent_skills | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.agent_trunk_assignments | 0 | 40.0 KB | 0 B | 40.0 KB | 0 | ~20 | 6 |  |
| public.blocked_access_logs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~20 |  |
| public.call_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~17.2k |  |
| public.call_transcriptions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~430 |  |
| public.call_translations | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~430 |  |
| public.contact_engagement_patterns | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~440 | 0 |  |
| public.dialer_favorites | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~860 |  |
| public.email_tickets | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.fraud_signals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 6 |  |
| public.kb_article_views | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.objection_library | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.renewals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~430 |  |
| public.ring_groups | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.tracker_matches | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 4 |  |
| public.user_passkeys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~50 |  |
| public.voip_quality_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~10 |  |
| public.webhook_flush_metrics | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~580 |  |
| public.agent_devices | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~20 | 1 |  |
| public.badges | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~40 | ~10 |  |
| public.battle_card_triggers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.bitrix_departments | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 3 | ~20 | 3 |  |
| public.cadence_steps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.call_queue_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 6 |  |
| public.call_records | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 5 | 0 |  |
| public.coaching_timestamps | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.consent_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.deal_revenue_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 3 |  |
| public.email_verification_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.goal_violations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.kb_categories | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.learning_modules | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 2 | ~20 | 7 |  |
| public.live_sentiment_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 5 |  |
| public.password_reset_requests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.password_reset_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~20 |  |
| public.queue_audio_prompts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.queue_skill_requirements | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.rate_limit_alerts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~30 |  |
| public.ring_group_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 6 |  |
| public.schema_migrations | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~90 |  |
| public.scorecard_templates | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~20 | 5 |  |
| public.success_plans | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 1 |  |
| public.surveys | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~30 | ~20 |  |
| public.system_settings | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~10 |  |
| public.toll_free_numbers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.user_allowed_ips | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.user_mfa_settings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10.1k |  |
| public.virtual_fax | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.voice_prints | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~1.8k | ~20 |  |
| public.voip_recommendation_actions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.webauthn_challenges | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.account_journey_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.barge_in_sessions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.4k | 4 |  |
| public.call_analyses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.coaching_recommendations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 6 |  |
| public.cultural_hints | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.customer_journey_stages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.ip_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.manager_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.notification_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~4.1k |  |
| public.permissions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.queue_items | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.rate_limit_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~6.7k | 1 |  |
| public.role_permissions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.routing_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.skills | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.sla_policies | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 3 |  |
| public.success_plan_milestones | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.topic_detections | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.user_ip_restrictions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~20 |  |
| public.whisper_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.7k | 4 |  |
| public.battle_cards | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_users | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.cadences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.call_flows | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.dashboard_goals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~460 | 0 |  |
| public.dnc_import_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.hot_desking_stations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.migration_rollbacks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 8 | 0 |  |
| public.number_porting_requests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.security_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.shift_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.topic_trends | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.trackers | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.video_conferences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.voicemail_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.hold_alert_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~1.7k | 1 |  |
| public.queue_metrics_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.voip_monitoring_settings | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_perf_metrics_created_at | public.performance_metrics | 1000.0 KB |


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
| postgres | ~240 | ~1.4M | 5608.21 | `SELECT schema, "table", column_name, grantee, string_agg(privilege_type, $1 ORDER BY privilege_type) AS privileges FROM ( SELECT n.nspname AS schema, c.relname AS "table", a.attname AS column_name, COALESCE(g.rolname, $2` |
| authenticator | ~610 | ~473k | 775.42 | `SELECT name FROM pg_timezone_names` |
| postgres | 2 | ~264.9k | 132452.35 | `SELECT count(*) FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM information_schema.role_table_grants g WHERE g.table_` |
| postgres | 2 | ~263k | 131503.84 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND NOT EXISTS (SELECT $16 FROM` |
| service_role | ~6.7k | ~155.7k | 23.30 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "_ip_address", "_endpoint", "_user_id" FROM json_to_record(pgrst_payload.json_data) AS _("_ip_address" tex` |
| authenticator | ~610 | ~135.8k | 222.22 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $2), oid) AS base_type FROM pg_type UNIO` |
| postgres | 1 | ~117.3k | 117288.34 | `SELECT table_schema, table_name, column_name, grantee, privilege_type FROM information_schema.column_privileges cp WHERE grantee NOT IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) AND table_schema NOT IN ($16,$1` |
| authenticated | ~23.6k | ~93.7k | 3.97 | `WITH pgrst_source AS (INSERT INTO "public"."performance_metrics"("metric_name", "metric_value", "navigation_type", "rating", "url", "user_agent", "user_id") SELECT "pgrst_body"."metric_name", "pgrst_body"."metric_value",` |
| postgres | ~5.7k | ~88.6k | 15.49 | `SELECT net.http_post( url := $1, headers := jsonb_build_object( $2, $3, $4, $5 \|\| ( SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = $6 ) ), body := jsonb_build_object($7, $8) )` |
| authenticated | ~3.8k | ~63.9k | 16.85 | `WITH pgrst_source AS ( SELECT "public"."contacts".* FROM "public"."contacts" ORDER BY "public"."contacts"."updated_at" DESC , "public"."contacts"."id" DESC LIMIT $1 OFFSET $2 ) , pgrst_source_count AS (SELECT $3 FROM "pu` |
| postgres | ~240 | ~60k | 245.03 | `SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema, (SELECT default_version FROM pg_available_extensions a WHERE a.name = e.extname) AS available_version FROM pg_extension e JOIN pg_namespace n ON n.o` |
| authenticator | ~610 | ~47.1k | 77.75 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $3), oid) AS base_type FROM pg_type UNIO` |
| postgres | ~240 | ~45.5k | 185.61 | `SELECT n.nspname AS schema, c.relname AS "table", a.attnum AS position, a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, NOT a.attnotnull AS nullable, pg_get_expr(d.adbin, d.adrelid) AS "default", NULLIF(` |
| authenticated | ~1.7k | ~32k | 18.98 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT "public"."get_call_volume_stats"() pgrst_scalar) pgrst_call) SELECT $3::bigint AS total_result_set, $4 AS page_total, coalesce(json_agg(_postgrest_t.pgrst` |
| service_role | ~6.8k | ~24.9k | 3.67 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT "public"."apply_predictive_pacing"() pgrst_scalar) pgrst_call) SELECT $3::bigint AS total_result_set, $4 AS page_total, coalesce(json_agg(_postgrest_t.pgr` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 11 |
| pgbouncer | idle | 1 |
| postgres | active | 1 |
| postgres | idle | 2 |
| supabase_admin | active | 1 |
| supabase_admin | idle | 8 |
| supabase_admin |  | 1 |
| supabase_auth_admin | idle | 5 |

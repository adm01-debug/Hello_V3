# Índices

Uso e tamanho em `stats.md`.

| tabela | índice | método | colunas | único | válido | predicado |
|---|---|---|---|---|---|---|
| public.account_journey_history | account_journey_history_pkey | btree | id | sim | sim |  |
| public.account_journey_history | idx_account_journey_history_account_id | btree | account_id | não | sim |  |
| public.account_lockouts | account_lockouts_email_key | btree | email | sim | sim |  |
| public.account_lockouts | account_lockouts_pkey | btree | id | sim | sim |  |
| public.account_lockouts | idx_account_lockouts_email | btree | email | não | sim |  |
| public.account_lockouts | idx_account_lockouts_locked_until | btree | locked_until | não | sim |  |
| public.accounts | accounts_pkey | btree | id | sim | sim |  |
| public.accounts | idx_accounts_churn | btree | churn_risk_score | não | sim |  |
| public.accounts | idx_accounts_csm | btree | csm_agent_name | não | sim |  |
| public.accounts | idx_accounts_health | btree | health_score | não | sim |  |
| public.accounts | idx_accounts_status | btree | status | não | sim |  |
| public.active_sessions | active_sessions_pkey | btree | id | sim | sim |  |
| public.active_sessions | active_sessions_session_token_key | btree | session_token | sim | sim |  |
| public.active_sessions | idx_active_sessions_token | btree | session_token | não | sim |  |
| public.active_sessions | idx_active_sessions_user_id | btree | user_id | não | sim |  |
| public.agent_badges | agent_badges_agent_id_badge_id_key | btree | agent_id, badge_id | sim | sim |  |
| public.agent_badges | agent_badges_pkey | btree | id | sim | sim |  |
| public.agent_badges | idx_agent_badges_agent_id | btree | agent_id | não | sim |  |
| public.agent_badges | idx_agent_badges_badge_id | btree | badge_id | não | sim |  |
| public.agent_devices | agent_devices_pkey | btree | id | sim | sim |  |
| public.agent_goals | agent_goals_agent_name_key | btree | agent_name | sim | sim |  |
| public.agent_goals | agent_goals_pkey | btree | id | sim | sim |  |
| public.agent_ring_settings | agent_ring_settings_agent_name_key | btree | agent_name | sim | sim |  |
| public.agent_ring_settings | agent_ring_settings_pkey | btree | id | sim | sim |  |
| public.agent_shifts | agent_shifts_pkey | btree | id | sim | sim |  |
| public.agent_shifts | idx_agent_shifts_agent_date | btree | agent_name, shift_date | não | sim |  |
| public.agent_shifts | idx_agent_shifts_date | btree | shift_date | não | sim |  |
| public.agent_shifts | idx_agent_shifts_template_id | btree | template_id | não | sim |  |
| public.agent_skills | agent_skills_agent_name_skill_id_key | btree | agent_name, skill_id | sim | sim |  |
| public.agent_skills | agent_skills_pkey | btree | id | sim | sim |  |
| public.agent_skills | idx_agent_skills_agent | btree | agent_name | não | sim |  |
| public.agent_skills | idx_agent_skills_skill_id | btree | skill_id | não | sim |  |
| public.agent_trunk_assignments | agent_trunk_assignments_agent_id_trunk_id_key | btree | agent_id, trunk_id | sim | sim |  |
| public.agent_trunk_assignments | agent_trunk_assignments_pkey | btree | id | sim | sim |  |
| public.agent_trunk_assignments | idx_agent_trunk_assignments_agent_id | btree | agent_id | não | sim |  |
| public.agent_trunk_assignments | idx_assignments_agent | btree | agent_id, is_primary | não | sim |  |
| public.agent_trunk_assignments | idx_assignments_trunk | btree | trunk_id | não | sim |  |
| public.agent_weekly_stats | agent_weekly_stats_agent_id_week_start_key | btree | agent_id, week_start | sim | sim |  |
| public.agent_weekly_stats | agent_weekly_stats_pkey | btree | id | sim | sim |  |
| public.agent_weekly_stats | idx_agent_weekly_stats_agent_id | btree | agent_id | não | sim |  |
| public.agents | agents_extension_key | btree | extension | sim | sim |  |
| public.agents | agents_pkey | btree | id | sim | sim |  |
| public.audit_logs | audit_logs_pkey | btree | id | sim | sim |  |
| public.audit_logs | idx_audit_logs_action | btree | action | não | sim |  |
| public.audit_logs | idx_audit_logs_created_at | btree | created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_created_brin | brin | created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_resource_type | btree | resource_type | não | sim |  |
| public.audit_logs | idx_audit_logs_resource_type_created | btree | resource_type, created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_user_date | btree | user_id, created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_user_id | btree | user_id | não | sim |  |
| public.badges | badges_pkey | btree | id | sim | sim |  |
| public.barge_in_sessions | barge_in_sessions_pkey | btree | id | sim | sim |  |
| public.barge_in_sessions | idx_barge_in_sessions_call_session_id | btree | call_session_id | não | sim |  |
| public.battle_card_triggers | battle_card_triggers_pkey | btree | id | sim | sim |  |
| public.battle_card_triggers | idx_battle_card_triggers_battle_card_id | btree | battle_card_id | não | sim |  |
| public.battle_card_triggers | idx_battle_card_triggers_keyword | btree | keyword | não | sim |  |
| public.battle_cards | battle_cards_pkey | btree | id | sim | sim |  |
| public.bitrix_departments | bitrix_departments_pkey | btree | id | sim | sim |  |
| public.bitrix_users | bitrix_users_pkey | btree | id | sim | sim |  |
| public.blocked_access_logs | blocked_access_logs_pkey | btree | id | sim | sim |  |
| public.blocked_access_logs | idx_blocked_access_logs_created_at | btree | created_at | não | sim |  |
| public.blocked_access_logs | idx_blocked_access_logs_ip_address | btree | ip_address | não | sim |  |
| public.blocked_access_logs | idx_blocked_access_logs_user_id | btree | user_id | não | sim |  |
| public.bot_conversations | bot_conversations_pkey | btree | id | sim | sim |  |
| public.bot_conversations | idx_bot_conversations_conversation_id | btree | conversation_id | não | sim |  |
| public.bot_conversations | idx_bot_conversations_handoff | btree | handoff_triggered | não | sim | `(handoff_triggered = true)` |
| public.cadence_enrollments | cadence_enrollments_pkey | btree | id | sim | sim |  |
| public.cadence_enrollments | idx_cadence_enrollments_cadence_id | btree | cadence_id | não | sim |  |
| public.cadence_enrollments | idx_cadence_enrollments_contact_id | btree | contact_id | não | sim |  |
| public.cadence_enrollments | idx_cadence_enrollments_deal_id | btree | deal_id | não | sim |  |
| public.cadence_enrollments | idx_enrollments_agent | btree | agent_name | não | sim |  |
| public.cadence_enrollments | idx_enrollments_next_action | btree | next_action_at | não | sim | `(status = 'active'::text)` |
| public.cadence_steps | cadence_steps_pkey | btree | id | sim | sim |  |
| public.cadence_steps | idx_cadence_steps_cadence | btree | cadence_id, step_order | não | sim |  |
| public.cadence_steps | idx_cadence_steps_cadence_id | btree | cadence_id | não | sim |  |
| public.cadences | cadences_pkey | btree | id | sim | sim |  |
| public.call_alerts | call_alerts_pkey | btree | id | sim | sim |  |
| public.call_alerts | idx_call_alerts_call_session_id | btree | call_session_id | não | sim |  |
| public.call_alerts | idx_call_alerts_created_at | btree | created_at | não | sim |  |
| public.call_alerts | idx_call_alerts_is_read | btree | is_read | não | sim |  |
| public.call_analyses | call_analyses_pkey | btree | id | sim | sim |  |
| public.call_analyses | idx_call_analyses_call_session_id | btree | call_session_id | não | sim |  |
| public.call_control_audit_logs | call_control_audit_logs_pkey | btree | id | sim | sim |  |
| public.call_control_audit_logs | idx_audit_logs_created | btree | created_at | não | sim |  |
| public.call_control_audit_logs | idx_audit_logs_session | btree | call_session_id | não | sim |  |
| public.call_control_audit_logs | idx_call_control_audit_logs_created_brin | brin | created_at | não | sim |  |
| public.call_flows | call_flows_pkey | btree | id | sim | sim |  |
| public.call_key_moments | call_key_moments_pkey | btree | id | sim | sim |  |
| public.call_key_moments | idx_call_key_moments_call_session_id | btree | call_session_id | não | sim |  |
| public.call_key_moments | idx_key_moments_type | btree | moment_type | não | sim |  |
| public.call_park_orbits | call_park_orbits_name_unique | btree | name | sim | sim |  |
| public.call_park_orbits | call_park_orbits_pkey | btree | id | sim | sim |  |
| public.call_park_orbits | idx_call_park_orbits_active | btree | is_active | não | sim |  |
| public.call_playlists | call_playlists_pkey | btree | id | sim | sim |  |
| public.call_playlists | idx_playlists_owner | btree | owner_agent_name | não | sim |  |
| public.call_quality_metrics | call_quality_metrics_pkey | btree | id | sim | sim |  |
| public.call_quality_metrics | idx_call_quality_created_at | btree | created_at | não | sim |  |
| public.call_quality_metrics | idx_call_quality_metrics_call_session_id | btree | call_session_id | não | sim |  |
| public.call_quality_metrics | idx_call_quality_metrics_created_brin | brin | created_at | não | sim |  |
| public.call_quality_metrics | idx_cqm_agent | btree | agent_name | não | sim |  |
| public.call_queue_members | call_queue_members_pkey | btree | id | sim | sim |  |
| public.call_queue_members | call_queue_members_unique | btree | queue_id, agent_id | sim | sim |  |
| public.call_queue_members | idx_call_queue_members_agent | btree | agent_id | não | sim |  |
| public.call_queue_members | idx_call_queue_members_queue | btree | queue_id, is_active, penalty | não | sim |  |
| public.call_queues | call_queues_name_unique | btree | name | sim | sim |  |
| public.call_queues | call_queues_pkey | btree | id | sim | sim |  |
| public.call_queues | idx_call_queues_active_priority | btree | is_active, priority | não | sim |  |
| public.call_queues | idx_call_queues_greeting_prompt | btree | greeting_prompt_id | não | sim | `(greeting_prompt_id IS NOT NULL)` |
| public.call_queues | idx_call_queues_moh_prompt | btree | moh_prompt_id | não | sim | `(moh_prompt_id IS NOT NULL)` |
| public.call_queues | idx_call_queues_overflow | btree | overflow_queue_id | não | sim | `(overflow_queue_id IS NOT NULL)` |
| public.call_queues | idx_call_queues_overflow_prompt | btree | overflow_prompt_id | não | sim | `(overflow_prompt_id IS NOT NULL)` |
| public.call_queues | idx_call_queues_periodic_prompt | btree | periodic_prompt_id | não | sim | `(periodic_prompt_id IS NOT NULL)` |
| public.call_recordings | call_recordings_pkey | btree | id | sim | sim |  |
| public.call_recordings | idx_call_recordings_call_session_id | btree | call_session_id | não | sim |  |
| public.call_recordings | idx_call_recordings_source | btree | source | não | sim |  |
| public.call_scorecards | call_scorecards_pkey | btree | id | sim | sim |  |
| public.call_scorecards | idx_call_scorecards_call_session_id | btree | call_session_id | não | sim |  |
| public.call_scorecards | idx_call_scorecards_template_id | btree | template_id | não | sim |  |
| public.call_scorecards | idx_scorecards_agent | btree | agent_name | não | sim |  |
| public.call_sessions | call_sessions_pkey | btree | id | sim | sim |  |
| public.call_sessions | idx_call_sessions_active_partial | btree | started_at | não | sim | `(status = 'active'::text)` |
| public.call_sessions | idx_call_sessions_agent_date | btree | agent_name, started_at | não | sim |  |
| public.call_sessions | idx_call_sessions_agent_name_trgm | gin | agent_name | não | sim |  |
| public.call_sessions | idx_call_sessions_caller_name_trgm | gin | caller_name | não | sim |  |
| public.call_sessions | idx_call_sessions_caller_phone_trgm | gin | caller_phone | não | sim |  |
| public.call_sessions | idx_call_sessions_contact_id | btree | contact_id | não | sim |  |
| public.call_sessions | idx_call_sessions_deal_id | btree | deal_id | não | sim |  |
| public.call_sessions | idx_call_sessions_status | btree | status | não | sim | `(status = ANY (ARRAY['active'::text, 'ringing'::text, 'on_hold'::text]))` |
| public.call_sessions | idx_call_sessions_status_created | btree | status, created_at | não | sim |  |
| public.call_sessions | idx_sessions_started_at | btree | started_at | não | sim |  |
| public.call_summaries | call_summaries_pkey | btree | id | sim | sim |  |
| public.call_summaries | idx_call_summaries_call_session_id | btree | call_session_id | não | sim |  |
| public.call_transcriptions | call_transcriptions_pkey | btree | id | sim | sim |  |
| public.call_transcriptions | idx_call_transcriptions_call_session_id | btree | call_session_id | não | sim |  |
| public.call_transcriptions | idx_call_transcriptions_text_trgm | gin | text | não | sim |  |
| public.call_transcripts_searchable | call_transcripts_searchable_call_session_id_key | btree | call_session_id | sim | sim |  |
| public.call_transcripts_searchable | call_transcripts_searchable_pkey | btree | id | sim | sim |  |
| public.call_transcripts_searchable | idx_call_transcripts_searchable_call_session_id | btree | call_session_id | não | sim |  |
| public.call_transcripts_searchable | idx_transcripts_agent | btree | agent_name | não | sim |  |
| public.call_transcripts_searchable | idx_transcripts_search_vector | gin | search_vector | não | sim |  |
| public.call_translations | call_translations_pkey | btree | id | sim | sim |  |
| public.call_translations | idx_call_translations_call_session_id | btree | call_session_id | não | sim |  |
| public.call_translations | idx_call_translations_langs | btree | source_lang, target_lang | não | sim |  |
| public.call_translations | idx_call_translations_session | btree | call_session_id, created_at | não | sim |  |
| public.calling_hours_config | calling_hours_config_pkey | btree | id | sim | sim |  |
| public.calling_hours_config | calling_hours_region_unique | btree | region_code | sim | sim |  |
| public.calling_hours_config | idx_calling_hours_region | btree | region_code | não | sim |  |
| public.chat_sessions | chat_sessions_pkey | btree | id | sim | sim |  |
| public.chat_sessions | chat_sessions_visitor_token_key | btree | visitor_token | sim | sim |  |
| public.chat_sessions | idx_chat_sessions_active | btree | is_active | não | sim | `(is_active = true)` |
| public.chat_sessions | idx_chat_sessions_conversation_id | btree | conversation_id | não | sim |  |
| public.chat_sessions | idx_chat_sessions_token | btree | visitor_token | não | sim |  |
| public.churn_risk_signals | churn_risk_signals_pkey | btree | id | sim | sim |  |
| public.churn_risk_signals | idx_churn_risk_signals_account_id | btree | account_id | não | sim |  |
| public.churn_risk_signals | idx_churn_signals_active | btree | is_active, severity | não | sim |  |
| public.coaching_assignments | coaching_assignments_pkey | btree | id | sim | sim |  |
| public.coaching_assignments | idx_coaching_assignments_agent | btree | agent_name | não | sim |  |
| public.coaching_assignments | idx_coaching_assignments_call_session_id | btree | call_session_id | não | sim |  |
| public.coaching_assignments | idx_coaching_assignments_pending | btree | agent_name, created_at | não | sim | `(completed_at IS NULL)` |
| public.coaching_assignments | idx_coaching_assignments_status | btree | status | não | sim |  |
| public.coaching_recommendations | coaching_recommendations_pkey | btree | id | sim | sim |  |
| public.coaching_recommendations | idx_coaching_recommendations_agent_id | btree | agent_id | não | sim |  |
| public.coaching_timestamps | coaching_timestamps_pkey | btree | id | sim | sim |  |
| public.coaching_timestamps | idx_coaching_timestamps_call_session_id | btree | call_session_id | não | sim |  |
| public.coaching_timestamps | idx_coaching_ts_agent | btree | agent_name | não | sim |  |
| public.compliance_rules | compliance_rules_pkey | btree | id | sim | sim |  |
| public.compliance_rules | idx_compliance_rules_active | btree | rule_type | não | sim | `(is_active = true)` |
| public.compliance_settings | compliance_settings_pkey | btree | id | sim | sim |  |
| public.compliance_settings | compliance_settings_setting_key_key | btree | setting_key | sim | sim |  |
| public.consent_history | consent_history_pkey | btree | id | sim | sim |  |
| public.consent_history | idx_consent_history_contact_id | btree | contact_id | não | sim |  |
| public.consent_history | idx_consent_phone | btree | phone | não | sim |  |
| public.consent_records | consent_records_pkey | btree | id | sim | sim |  |
| public.consent_records | idx_consent_records_channel_type | btree | channel, consent_type | não | sim |  |
| public.consent_records | idx_consent_records_contact_id | btree | contact_id | não | sim |  |
| public.consent_records | idx_consent_records_granted | btree | granted | não | sim | `(granted = true)` |
| public.consent_records | idx_consent_records_phone | btree | phone | não | sim |  |
| public.contact_alerts | contact_alerts_pkey | btree | id | sim | sim |  |
| public.contact_alerts | idx_contact_alerts_contact_id | btree | contact_id | não | sim |  |
| public.contact_alerts | idx_contact_alerts_created | btree | created_at | não | sim |  |
| public.contact_alerts | idx_contact_alerts_type | btree | alert_type | não | sim |  |
| public.contact_alerts | idx_contact_alerts_unread | btree | is_read | não | sim | `(is_read = false)` |
| public.contact_engagement_patterns | contact_engagement_patterns_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_engagement_patterns | contact_engagement_patterns_pkey | btree | id | sim | sim |  |
| public.contact_engagement_patterns | idx_contact_engagement_patterns_contact_id | btree | contact_id | não | sim |  |
| public.contact_engagement_patterns | idx_engagement_patterns_answer_rate | btree | answer_rate | não | sim |  |
| public.contact_interactions | contact_interactions_pkey | btree | id | sim | sim |  |
| public.contact_interactions | idx_contact_interactions_call_session_id | btree | call_session_id | não | sim |  |
| public.contact_interactions | idx_contact_interactions_contact_id | btree | contact_id | não | sim |  |
| public.contact_interactions | idx_contact_interactions_created | btree | created_at | não | sim |  |
| public.contact_interactions | idx_contact_interactions_type | btree | interaction_type | não | sim |  |
| public.contacts | contacts_pkey | btree | id | sim | sim |  |
| public.contacts | idx_contacts_account_id | btree | account_id | não | sim |  |
| public.contacts | idx_contacts_email | btree | email | não | sim |  |
| public.contacts | idx_contacts_external_id | btree | external_id | não | sim |  |
| public.contacts | idx_contacts_phone | btree | phone | não | sim |  |
| public.conversation_messages | conversation_messages_pkey | btree | id | sim | sim |  |
| public.conversation_messages | idx_conversation_messages_conversation_id | btree | conversation_id | não | sim |  |
| public.conversation_messages | idx_messages_conversation | btree | conversation_id, created_at | não | sim |  |
| public.conversation_messages | idx_messages_direction | btree | direction | não | sim |  |
| public.conversations | conversations_pkey | btree | id | sim | sim |  |
| public.conversations | idx_conversations_account_id | btree | account_id | não | sim |  |
| public.conversations | idx_conversations_assigned_agent | btree | assigned_agent_name | não | sim |  |
| public.conversations | idx_conversations_channel | btree | channel | não | sim |  |
| public.conversations | idx_conversations_contact_id | btree | contact_id | não | sim |  |
| public.conversations | idx_conversations_last_message | btree | last_message_at | não | sim |  |
| public.conversations | idx_conversations_status | btree | status | não | sim |  |
| public.crm_field_suggestions | crm_field_suggestions_pkey | btree | id | sim | sim |  |
| public.crm_field_suggestions | idx_crm_field_suggestions_call_session_id | btree | call_session_id | não | sim |  |
| public.crm_field_suggestions | idx_crm_field_suggestions_contact_id | btree | contact_id | não | sim |  |
| public.crm_field_suggestions | idx_crm_suggestions_status | btree | status | não | sim |  |
| public.crm_sync_queue | crm_sync_queue_pkey | btree | id | sim | sim |  |
| public.crm_sync_queue | idx_crm_sync_queue_status_retry | btree | status, next_retry_at | não | sim | `(status = ANY (ARRAY['pending'::text, 'failed'::text]))` |
| public.cultural_hints | cultural_hints_pkey | btree | id | sim | sim |  |
| public.cultural_hints | idx_cultural_hints_locale | btree | locale, is_active | não | sim |  |
| public.customer_journey_stages | customer_journey_stages_pkey | btree | id | sim | sim |  |
| public.customer_journey_stages | customer_journey_stages_stage_key_key | btree | stage_key | sim | sim |  |
| public.dashboard_goals | dashboard_goals_pkey | btree | id | sim | sim |  |
| public.data_lake_exports | data_lake_exports_pkey | btree | id | sim | sim |  |
| public.data_lake_exports | idx_data_exports_status | btree | status, created_at | não | sim |  |
| public.deal_revenue_snapshots | deal_revenue_snapshots_pkey | btree | id | sim | sim |  |
| public.deal_revenue_snapshots | idx_deal_revenue_occurred | btree | occurred_at | não | sim |  |
| public.deal_revenue_snapshots | idx_deal_revenue_snapshots_deal_id | btree | deal_id | não | sim |  |
| public.deals | deals_pkey | btree | id | sim | sim |  |
| public.deals | idx_deals_contact_id | btree | contact_id | não | sim |  |
| public.deals | idx_deals_owner | btree | owner_agent_name | não | sim |  |
| public.deals | idx_deals_stage | btree | stage | não | sim |  |
| public.deals | idx_deals_status | btree | status | não | sim |  |
| public.dialer_campaigns | dialer_campaigns_pkey | btree | id | sim | sim |  |
| public.dialer_campaigns | idx_dialer_campaigns_status | btree | status | não | sim |  |
| public.dialer_favorites | dialer_favorites_pkey | btree | id | sim | sim |  |
| public.dialer_favorites | dialer_favorites_unique_phone | btree | user_id, phone | sim | sim |  |
| public.dialer_favorites | idx_dialer_favorites_user | btree | user_id, position | não | sim |  |
| public.dialer_favorites | idx_dialer_favorites_user_tag_position | btree | user_id, tag, position | não | sim |  |
| public.dialer_queue | dialer_queue_pkey | btree | id | sim | sim |  |
| public.dialer_queue | idx_dialer_queue_campaign_id | btree | campaign_id | não | sim |  |
| public.dialer_queue | idx_dialer_queue_contact_id | btree | contact_id | não | sim |  |
| public.dialer_queue | idx_dialer_queue_next_attempt | btree | next_attempt_at | não | sim |  |
| public.dialer_queue | idx_dialer_queue_pending | btree | campaign_id, priority, created_at | não | sim | `(status = 'pending'::text)` |
| public.dialer_queue | idx_dialer_queue_status | btree | status | não | sim |  |
| public.dnc_import_logs | dnc_import_logs_pkey | btree | id | sim | sim |  |
| public.dnc_list | dnc_list_pkey | btree | id | sim | sim |  |
| public.dnc_list | dnc_phone_unique | btree | phone_normalized | sim | sim |  |
| public.dnc_list | idx_dnc_active | btree | is_active | não | sim | `(is_active = true)` |
| public.dnc_list | idx_dnc_list_phone_active | btree | phone_normalized | não | sim | `(is_active = true)` |
| public.dnc_list | idx_dnc_phone_normalized | btree | phone_normalized | não | sim |  |
| public.email_tickets | email_tickets_message_id_key | btree | message_id | sim | sim |  |
| public.email_tickets | email_tickets_pkey | btree | id | sim | sim |  |
| public.email_tickets | idx_email_tickets_conversation_id | btree | conversation_id | não | sim |  |
| public.email_tickets | idx_email_tickets_thread | btree | thread_id | não | sim |  |
| public.email_verification_tokens | email_verification_tokens_pkey | btree | id | sim | sim |  |
| public.email_verification_tokens | email_verification_tokens_token_key | btree | token | sim | sim |  |
| public.email_verification_tokens | idx_email_verification_tokens_user_id | btree | user_id | não | sim |  |
| public.fraud_signals | fraud_signals_pkey | btree | id | sim | sim |  |
| public.fraud_signals | idx_fraud_signals_call_session_id | btree | call_session_id | não | sim |  |
| public.fraud_signals | idx_fraud_signals_severity | btree | severity, created_at | não | sim |  |
| public.fraud_signals | idx_fraud_signals_status | btree | status | não | sim | `(status = 'open'::text)` |
| public.geo_access_logs | geo_access_logs_pkey | btree | id | sim | sim |  |
| public.geo_access_logs | idx_geo_access_logs_country_code | btree | country_code | não | sim |  |
| public.geo_access_logs | idx_geo_access_logs_created_at | btree | created_at | não | sim |  |
| public.geo_access_logs | idx_geo_access_logs_created_brin | brin | created_at | não | sim |  |
| public.geo_restrictions | geo_restrictions_country_code_key | btree | country_code | sim | sim |  |
| public.geo_restrictions | geo_restrictions_pkey | btree | id | sim | sim |  |
| public.geo_restrictions | idx_geo_restrictions_country_code | btree | country_code | não | sim |  |
| public.geo_settings | geo_settings_pkey | btree | id | sim | sim |  |
| public.goal_violations | goal_violations_pkey | btree | id | sim | sim |  |
| public.goal_violations | idx_goal_violations_created_at | btree | created_at | não | sim |  |
| public.goal_violations | idx_goal_violations_goal_id | btree | goal_id | não | sim |  |
| public.hold_alert_settings | hold_alert_settings_pkey | btree | id | sim | sim |  |
| public.hold_events | hold_events_pkey | btree | id | sim | sim |  |
| public.hold_events | idx_hold_events_call_session_id | btree | call_session_id | não | sim |  |
| public.hold_events | idx_hold_events_session | btree | call_session_id, started_at | não | sim |  |
| public.hold_events | idx_hold_events_started_at | btree | started_at | não | sim |  |
| public.holidays | holidays_pkey | btree | id | sim | sim |  |
| public.holidays | idx_holidays_date | btree | date | não | sim |  |
| public.hot_desking_stations | hot_desking_stations_pkey | btree | id | sim | sim |  |
| public.index_drop_audit | idx_index_drop_audit_admin_time | btree | admin_id, created_at | não | sim | `(admin_id IS NOT NULL)` |
| public.index_drop_audit | idx_index_drop_audit_created_at | btree | created_at | não | sim |  |
| public.index_drop_audit | index_drop_audit_pkey | btree | id | sim | sim |  |
| public.ip_whitelist | ip_whitelist_ip_address_key | btree | ip_address | sim | sim |  |
| public.ip_whitelist | ip_whitelist_pkey | btree | id | sim | sim |  |
| public.kb_article_history | idx_kb_article_history_article_id | btree | article_id | não | sim |  |
| public.kb_article_history | idx_kb_article_history_changed_by | btree | changed_by | não | sim |  |
| public.kb_article_history | kb_article_history_pkey | btree | id | sim | sim |  |
| public.kb_article_views | idx_kb_article_views_article_id | btree | article_id | não | sim |  |
| public.kb_article_views | idx_kb_article_views_conversation_id | btree | conversation_id | não | sim |  |
| public.kb_article_views | idx_kb_views_created | btree | created_at | não | sim |  |
| public.kb_article_views | kb_article_views_pkey | btree | id | sim | sim |  |
| public.kb_articles | idx_kb_articles_category_id | btree | category_id | não | sim |  |
| public.kb_articles | idx_kb_articles_search | gin | search_vector | não | sim |  |
| public.kb_articles | idx_kb_articles_status | btree | status | não | sim |  |
| public.kb_articles | idx_kb_articles_tags | gin | tags | não | sim |  |
| public.kb_articles | kb_articles_pkey | btree | id | sim | sim |  |
| public.kb_articles | kb_articles_slug_key | btree | slug | sim | sim |  |
| public.kb_categories | idx_kb_categories_parent_id | btree | parent_id | não | sim |  |
| public.kb_categories | kb_categories_pkey | btree | id | sim | sim |  |
| public.kb_categories | kb_categories_slug_key | btree | slug | sim | sim |  |
| public.learning_completions | idx_learning_completions_agent | btree | agent_name | não | sim |  |
| public.learning_completions | idx_learning_completions_module_id | btree | module_id | não | sim |  |
| public.learning_completions | learning_completions_agent_name_module_id_key | btree | agent_name, module_id | sim | sim |  |
| public.learning_completions | learning_completions_pkey | btree | id | sim | sim |  |
| public.learning_modules | learning_modules_pkey | btree | id | sim | sim |  |
| public.live_assist_signals | idx_live_assist_signals_agent | btree | agent_name, created_at | não | sim |  |
| public.live_assist_signals | idx_live_assist_signals_call_session_id | btree | call_session_id | não | sim |  |
| public.live_assist_signals | idx_live_assist_signals_intent | btree | intent | não | sim |  |
| public.live_assist_signals | idx_live_assist_signals_session | btree | call_session_id, created_at | não | sim |  |
| public.live_assist_signals | live_assist_signals_pkey | btree | id | sim | sim |  |
| public.live_sentiment_snapshots | idx_live_sentiment_snapshots_call_session_id | btree | call_session_id | não | sim |  |
| public.live_sentiment_snapshots | idx_sentiment_snap_created | btree | created_at | não | sim |  |
| public.live_sentiment_snapshots | live_sentiment_snapshots_pkey | btree | id | sim | sim |  |
| public.login_attempts | idx_login_attempts_created_brin | brin | created_at | não | sim |  |
| public.login_attempts | idx_login_attempts_email_created | btree | email, created_at | não | sim |  |
| public.login_attempts | idx_login_attempts_ip_created | btree | ip_address, created_at | não | sim |  |
| public.login_attempts | login_attempts_pkey | btree | id | sim | sim |  |
| public.manager_alerts | idx_manager_alerts_call_session_id | btree | call_session_id | não | sim |  |
| public.manager_alerts | manager_alerts_pkey | btree | id | sim | sim |  |
| public.meeting_summaries | idx_meeting_summaries_call_session_id | btree | call_session_id | não | sim |  |
| public.meeting_summaries | idx_meeting_summaries_edited_by | btree | edited_by | não | sim |  |
| public.meeting_summaries | idx_meeting_summaries_followup | btree | follow_up_required | não | sim | `(follow_up_required = true)` |
| public.meeting_summaries | idx_meeting_summaries_generated_at | btree | generated_at | não | sim |  |
| public.meeting_summaries | idx_meeting_summaries_generated_by | btree | generated_by | não | sim |  |
| public.meeting_summaries | idx_meeting_summaries_session | btree | call_session_id | sim | sim |  |
| public.meeting_summaries | idx_meeting_summaries_status | btree | status | não | sim |  |
| public.meeting_summaries | meeting_summaries_pkey | btree | id | sim | sim |  |
| public.notification_preferences | notification_preferences_pkey | btree | id | sim | sim |  |
| public.notification_preferences | notification_preferences_user_id_key | btree | user_id | sim | sim |  |
| public.notifications | idx_notifications_category | btree | category | não | sim |  |
| public.notifications | idx_notifications_created_at | btree | created_at | não | sim |  |
| public.notifications | idx_notifications_source_debounce | btree | source_type, source_id, created_at | não | sim | `(source_type IS NOT NULL)` |
| public.notifications | idx_notifications_source_type_time | btree | source_type, created_at | não | sim | `(source_type IS NOT NULL)` |
| public.notifications | idx_notifications_unread_user | btree | user_id, created_at | não | sim | `(is_read = false)` |
| public.notifications | idx_notifications_user_id | btree | user_id | não | sim |  |
| public.notifications | notifications_pkey | btree | id | sim | sim |  |
| public.number_porting_requests | number_porting_requests_pkey | btree | id | sim | sim |  |
| public.objection_library | idx_objection_library_keywords | gin | trigger_keywords | não | sim |  |
| public.objection_library | idx_objection_library_type | btree | objection_type | não | sim | `(is_active = true)` |
| public.objection_library | objection_library_pkey | btree | id | sim | sim |  |
| public.optimistic_lock_conflicts | idx_olc_table_time | btree | table_name, attempted_at | não | sim |  |
| public.optimistic_lock_conflicts | idx_olc_user_time | btree | user_id, attempted_at | não | sim |  |
| public.optimistic_lock_conflicts | optimistic_lock_conflicts_pkey | btree | id | sim | sim |  |
| public.parked_calls | idx_parked_calls_orbit | btree | orbit_id | não | sim |  |
| public.parked_calls | idx_parked_calls_parked_by | btree | parked_by | não | sim |  |
| public.parked_calls | idx_parked_calls_session | btree | call_session_id | não | sim |  |
| public.parked_calls | idx_parked_calls_status | btree | status, expires_at | não | sim |  |
| public.parked_calls | parked_calls_active_slot_uniq | btree | orbit_id, slot_number | sim | sim | `(status = 'parked'::text)` |
| public.parked_calls | parked_calls_pkey | btree | id | sim | sim |  |
| public.password_reset_requests | idx_password_reset_requests_status | btree | status | não | sim |  |
| public.password_reset_requests | idx_password_reset_requests_user_id | btree | user_id | não | sim |  |
| public.password_reset_requests | password_reset_requests_pkey | btree | id | sim | sim |  |
| public.password_reset_tokens | idx_password_reset_tokens_user_id | btree | user_id | não | sim |  |
| public.password_reset_tokens | password_reset_tokens_pkey | btree | id | sim | sim |  |
| public.password_reset_tokens | password_reset_tokens_token_key | btree | token | sim | sim |  |
| public.performance_metrics | idx_perf_metrics_created_at | btree | created_at | não | sim |  |
| public.performance_metrics | idx_performance_metrics_created_brin | brin | created_at | não | sim |  |
| public.performance_metrics | idx_performance_metrics_user_id | btree | user_id | não | sim |  |
| public.performance_metrics | performance_metrics_pkey | btree | id | sim | sim |  |
| public.permissions | permissions_name_key | btree | name | sim | sim |  |
| public.permissions | permissions_pkey | btree | id | sim | sim |  |
| public.playlist_items | idx_playlist_items_call_session_id | btree | call_session_id | não | sim |  |
| public.playlist_items | idx_playlist_items_playlist | btree | playlist_id, display_order | não | sim |  |
| public.playlist_items | idx_playlist_items_playlist_id | btree | playlist_id | não | sim |  |
| public.playlist_items | playlist_items_pkey | btree | id | sim | sim |  |
| public.playlist_items | playlist_items_playlist_id_call_session_id_key | btree | playlist_id, call_session_id | sim | sim |  |
| public.queue_audio_prompts | idx_queue_audio_prompts_kind_active | btree | kind, is_active | não | sim |  |
| public.queue_audio_prompts | queue_audio_prompts_pkey | btree | id | sim | sim |  |
| public.queue_audio_prompts | queue_audio_prompts_unique_name | btree | name | sim | sim |  |
| public.queue_metrics_settings | queue_metrics_settings_pkey | btree | id | sim | sim |  |
| public.queue_skill_requirements | idx_queue_skill_requirements_skill_id | btree | skill_id | não | sim |  |
| public.queue_skill_requirements | queue_skill_requirements_pkey | btree | id | sim | sim |  |
| public.queue_skill_requirements | queue_skill_requirements_queue_name_skill_id_key | btree | queue_name, skill_id | sim | sim |  |
| public.rate_limit_alerts | idx_rate_limit_alerts_resolved_by | btree | resolved_by | não | sim |  |
| public.rate_limit_alerts | idx_rate_limit_alerts_user_id | btree | user_id | não | sim |  |
| public.rate_limit_alerts | rate_limit_alerts_pkey | btree | id | sim | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_created | btree | created_at | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_created_brin | brin | created_at | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_ip | btree | ip_address | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_lookup | btree | ip_address, endpoint, created_at | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_user_id | btree | user_id | não | sim |  |
| public.rate_limit_logs | rate_limit_logs_pkey | btree | id | sim | sim |  |
| public.rate_limit_settings | rate_limit_settings_endpoint_pattern_key | btree | endpoint_pattern | sim | sim |  |
| public.rate_limit_settings | rate_limit_settings_pkey | btree | id | sim | sim |  |
| public.redaction_log | idx_redaction_log_call_session_id | btree | call_session_id | não | sim |  |
| public.redaction_log | idx_redaction_log_created | btree | created_at | não | sim |  |
| public.redaction_log | redaction_log_pkey | btree | id | sim | sim |  |
| public.renewals | idx_renewals_account_id | btree | account_id | não | sim |  |
| public.renewals | idx_renewals_due | btree | due_date | não | sim | `(status = 'open'::text)` |
| public.renewals | idx_renewals_status | btree | status | não | sim |  |
| public.renewals | renewals_pkey | btree | id | sim | sim |  |
| public.ring_group_members | idx_ring_group_members_agent | btree | agent_id | não | sim |  |
| public.ring_group_members | idx_ring_group_members_group | btree | group_id, ring_order | não | sim |  |
| public.ring_group_members | ring_group_members_group_id_agent_id_key | btree | group_id, agent_id | sim | sim |  |
| public.ring_group_members | ring_group_members_pkey | btree | id | sim | sim |  |
| public.ring_groups | idx_ring_groups_active | btree | is_active | não | sim |  |
| public.ring_groups | idx_ring_groups_name | btree |  | não | sim |  |
| public.ring_groups | ring_groups_extension_key | btree | extension | sim | sim | `(extension IS NOT NULL)` |
| public.ring_groups | ring_groups_pkey | btree | id | sim | sim |  |
| public.rls_audit_logs | idx_rls_audit_logs_created_brin | brin | created_at | não | sim |  |
| public.rls_audit_logs | rls_audit_logs_pkey | btree | id | sim | sim |  |
| public.role_permissions | idx_role_permissions_permission_id | btree | permission_id | não | sim |  |
| public.role_permissions | role_permissions_pkey | btree | id | sim | sim |  |
| public.role_permissions | role_permissions_role_permission_id_key | btree | role, permission_id | sim | sim |  |
| public.routing_rules | idx_routing_rules_active_priority | btree | is_active, priority | não | sim | `(is_active = true)` |
| public.routing_rules | routing_rules_pkey | btree | id | sim | sim |  |
| public.scheduled_callbacks | idx_scheduled_callbacks_contact_id | btree | contact_id | não | sim |  |
| public.scheduled_callbacks | idx_scheduled_callbacks_pending | btree | assigned_agent, scheduled_at | não | sim | `(status = 'pending'::text)` |
| public.scheduled_callbacks | idx_scheduled_callbacks_scheduled_at | btree | scheduled_at | não | sim |  |
| public.scheduled_callbacks | idx_scheduled_callbacks_status | btree | status | não | sim |  |
| public.scheduled_callbacks | scheduled_callbacks_pkey | btree | id | sim | sim |  |
| public.scorecard_criteria | idx_scorecard_criteria_template_id | btree | template_id | não | sim |  |
| public.scorecard_criteria | scorecard_criteria_pkey | btree | id | sim | sim |  |
| public.scorecard_responses | idx_scorecard_responses_criterion_id | btree | criterion_id | não | sim |  |
| public.scorecard_responses | idx_scorecard_responses_scorecard_id | btree | scorecard_id | não | sim |  |
| public.scorecard_responses | scorecard_responses_pkey | btree | id | sim | sim |  |
| public.scorecard_templates | scorecard_templates_pkey | btree | id | sim | sim |  |
| public.security_alerts | security_alerts_pkey | btree | id | sim | sim |  |
| public.shift_swap_suggestions | idx_shift_swap_status | btree | status, created_at | não | sim |  |
| public.shift_swap_suggestions | idx_shift_swap_suggestions_from_agent_id | btree | from_agent_id | não | sim |  |
| public.shift_swap_suggestions | idx_shift_swap_suggestions_from_shift_id | btree | from_shift_id | não | sim |  |
| public.shift_swap_suggestions | idx_shift_swap_suggestions_to_agent_id | btree | to_agent_id | não | sim |  |
| public.shift_swap_suggestions | idx_shift_swap_suggestions_to_shift_id | btree | to_shift_id | não | sim |  |
| public.shift_swap_suggestions | shift_swap_suggestions_pkey | btree | id | sim | sim |  |
| public.shift_templates | shift_templates_pkey | btree | id | sim | sim |  |
| public.skills | skills_name_key | btree | name | sim | sim |  |
| public.skills | skills_pkey | btree | id | sim | sim |  |
| public.sla_policies | idx_sla_policies_active | btree | is_active | não | sim | `(is_active = true)` |
| public.sla_policies | sla_policies_pkey | btree | id | sim | sim |  |
| public.success_plan_milestones | idx_success_plan_milestones_success_plan_id | btree | success_plan_id | não | sim |  |
| public.success_plan_milestones | success_plan_milestones_pkey | btree | id | sim | sim |  |
| public.success_plans | idx_success_plans_account_id | btree | account_id | não | sim |  |
| public.success_plans | idx_success_plans_status | btree | status | não | sim |  |
| public.success_plans | success_plans_pkey | btree | id | sim | sim |  |
| public.survey_responses | idx_survey_responses_account_id | btree | account_id | não | sim |  |
| public.survey_responses | idx_survey_responses_call_session_id | btree | call_session_id | não | sim |  |
| public.survey_responses | idx_survey_responses_contact_id | btree | contact_id | não | sim |  |
| public.survey_responses | idx_survey_responses_survey_id | btree | survey_id | não | sim |  |
| public.survey_responses | survey_responses_pkey | btree | id | sim | sim |  |
| public.surveys | surveys_pkey | btree | id | sim | sim |  |
| public.system_settings | system_settings_pkey | btree | key | sim | sim |  |
| public.time_off_requests | idx_time_off_agent | btree | agent_name | não | sim |  |
| public.time_off_requests | idx_time_off_status | btree | status | não | sim |  |
| public.time_off_requests | time_off_requests_pkey | btree | id | sim | sim |  |
| public.toll_free_numbers | idx_toll_free_numbers_call_flow_id | btree | call_flow_id | não | sim |  |
| public.toll_free_numbers | toll_free_numbers_number_key | btree | number | sim | sim |  |
| public.toll_free_numbers | toll_free_numbers_pkey | btree | id | sim | sim |  |
| public.topic_detections | idx_topic_detections_call_session_id | btree | call_session_id | não | sim |  |
| public.topic_detections | topic_detections_pkey | btree | id | sim | sim |  |
| public.topic_trends | topic_trends_pkey | btree | id | sim | sim |  |
| public.tracker_matches | idx_tracker_matches_agent | btree | agent_name | não | sim |  |
| public.tracker_matches | idx_tracker_matches_call_session_id | btree | call_session_id | não | sim |  |
| public.tracker_matches | idx_tracker_matches_tracker_id | btree | tracker_id | não | sim |  |
| public.tracker_matches | tracker_matches_pkey | btree | id | sim | sim |  |
| public.trackers | trackers_pkey | btree | id | sim | sim |  |
| public.user_allowed_ips | idx_user_allowed_ips_user_id | btree | user_id | não | sim |  |
| public.user_allowed_ips | user_allowed_ips_pkey | btree | id | sim | sim |  |
| public.user_allowed_ips | user_allowed_ips_user_id_ip_address_key | btree | user_id, ip_address | sim | sim |  |
| public.user_ip_restrictions | idx_user_ip_restrictions_user_id | btree | user_id | não | sim |  |
| public.user_ip_restrictions | user_ip_restrictions_pkey | btree | id | sim | sim |  |
| public.user_ip_restrictions | user_ip_restrictions_user_id_key | btree | user_id | sim | sim |  |
| public.user_mfa_settings | idx_user_mfa_settings_user_id | btree | user_id | não | sim |  |
| public.user_mfa_settings | user_mfa_settings_pkey | btree | id | sim | sim |  |
| public.user_mfa_settings | user_mfa_settings_user_id_key | btree | user_id | sim | sim |  |
| public.user_passkeys | idx_user_passkeys_credential_id | btree | credential_id | não | sim |  |
| public.user_passkeys | idx_user_passkeys_user_id | btree | user_id | não | sim |  |
| public.user_passkeys | user_passkeys_credential_id_key | btree | credential_id | sim | sim |  |
| public.user_passkeys | user_passkeys_pkey | btree | id | sim | sim |  |
| public.user_profiles | idx_user_profiles_agent_id | btree | agent_id | não | sim |  |
| public.user_profiles | user_profiles_pkey | btree | id | sim | sim |  |
| public.user_roles | idx_user_roles_granted_by | btree | granted_by | não | sim |  |
| public.user_roles | idx_user_roles_role | btree | role | não | sim |  |
| public.user_roles | idx_user_roles_user_id | btree | user_id | não | sim |  |
| public.user_roles | user_roles_pkey | btree | id | sim | sim |  |
| public.user_roles | user_roles_user_id_role_key | btree | user_id, role | sim | sim |  |
| public.video_conferences | video_conferences_pkey | btree | id | sim | sim |  |
| public.virtual_fax | idx_virtual_fax_ocr_search | gin | ocr_search_vector | não | sim |  |
| public.virtual_fax | virtual_fax_pkey | btree | id | sim | sim |  |
| public.voice_prints | idx_voice_prints_user | btree | user_id | não | sim | `(is_active = true)` |
| public.voice_prints | idx_voice_prints_user_id | btree | user_id | não | sim |  |
| public.voice_prints | voice_prints_pkey | btree | id | sim | sim |  |
| public.voicemail_messages | voicemail_messages_pkey | btree | id | sim | sim |  |
| public.voip_monitoring_settings | voip_monitoring_settings_pkey | btree | id | sim | sim |  |
| public.voip_quality_alerts | idx_voip_quality_alerts_call_session_id | btree | call_session_id | não | sim |  |
| public.voip_quality_alerts | idx_voip_quality_alerts_created_user | btree | created_at, user_id | não | sim |  |
| public.voip_quality_alerts | idx_voip_quality_alerts_unack | btree | user_id, acknowledged_at | não | sim | `(acknowledged_at IS NULL)` |
| public.voip_quality_alerts | voip_quality_alerts_pkey | btree | id | sim | sim |  |
| public.voip_recommendation_actions | idx_voip_rec_actions_cat_outcome | btree | category, outcome | não | sim |  |
| public.voip_recommendation_actions | idx_voip_rec_actions_user_time | btree | user_id, applied_at | não | sim |  |
| public.voip_recommendation_actions | voip_recommendation_actions_pkey | btree | id | sim | sim |  |
| public.voip_trunk_health_checks | idx_trunk_health_trunk_time | btree | trunk_id, checked_at | não | sim |  |
| public.voip_trunk_health_checks | idx_voip_trunk_health_checks_trunk_id | btree | trunk_id | não | sim |  |
| public.voip_trunk_health_checks | voip_trunk_health_checks_pkey | btree | id | sim | sim |  |
| public.voip_trunk_usage_metrics | idx_trunk_usage_agent_started | btree | agent_id, started_at | não | sim |  |
| public.voip_trunk_usage_metrics | idx_trunk_usage_failover | btree | was_failover, started_at | não | sim | `(was_failover = true)` |
| public.voip_trunk_usage_metrics | idx_trunk_usage_trunk_started | btree | trunk_id, started_at | não | sim |  |
| public.voip_trunk_usage_metrics | idx_voip_trunk_usage_metrics_agent_id | btree | agent_id | não | sim |  |
| public.voip_trunk_usage_metrics | idx_voip_trunk_usage_metrics_call_session_id | btree | call_session_id | não | sim |  |
| public.voip_trunk_usage_metrics | idx_voip_trunk_usage_metrics_original_trunk_id | btree | original_trunk_id | não | sim |  |
| public.voip_trunk_usage_metrics | idx_voip_trunk_usage_metrics_trunk_id | btree | trunk_id | não | sim |  |
| public.voip_trunk_usage_metrics | idx_voip_usage_started_at | btree | started_at | não | sim |  |
| public.voip_trunk_usage_metrics | voip_trunk_usage_metrics_pkey | btree | id | sim | sim |  |
| public.voip_trunks | idx_voip_trunks_active | btree | is_active, priority | não | sim |  |
| public.voip_trunks | idx_voip_trunks_provider | btree | provider | não | sim |  |
| public.voip_trunks | voip_trunks_pkey | btree | id | sim | sim |  |
| public.webauthn_challenges | idx_webauthn_challenges_expires | btree | expires_at | não | sim |  |
| public.webauthn_challenges | idx_webauthn_challenges_user_id | btree | user_id | não | sim |  |
| public.webauthn_challenges | webauthn_challenges_pkey | btree | id | sim | sim |  |
| public.webhook_flush_metrics | idx_webhook_flush_metrics_created_at | btree | created_at | não | sim |  |
| public.webhook_flush_metrics | idx_webhook_flush_metrics_endpoint_hash_created_at | btree | endpoint_hash, created_at | não | sim | `(endpoint_hash IS NOT NULL)` |
| public.webhook_flush_metrics | idx_webhook_flush_metrics_user_id | btree | user_id | não | sim |  |
| public.webhook_flush_metrics | webhook_flush_metrics_pkey | btree | id | sim | sim |  |
| public.webhook_secrets | webhook_secrets_pkey | btree | id | sim | sim |  |
| public.webhook_secrets | webhook_secrets_provider_key | btree | provider | sim | sim |  |
| public.whisper_messages | idx_whisper_messages_call_session_id | btree | call_session_id | não | sim |  |
| public.whisper_messages | whisper_messages_pkey | btree | id | sim | sim |  |

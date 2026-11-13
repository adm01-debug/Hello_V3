# Relacionamentos (chaves estrangeiras)


| de | colunas | para | colunas | on delete | on update |
|---|---|---|---|---|---|
| public.account_journey_history | account_id | public.accounts | id | CASCADE | NO ACTION |
| public.active_sessions | user_id | auth.users | id | CASCADE | NO ACTION |
| public.agent_badges | agent_id | public.agents | id | CASCADE | NO ACTION |
| public.agent_badges | badge_id | public.badges | id | CASCADE | NO ACTION |
| public.agent_shifts | template_id | public.shift_templates | id | SET NULL | NO ACTION |
| public.agent_skills | skill_id | public.skills | id | CASCADE | NO ACTION |
| public.agent_trunk_assignments | agent_id | public.agents | id | CASCADE | NO ACTION |
| public.agent_trunk_assignments | trunk_id | public.voip_trunks | id | CASCADE | NO ACTION |
| public.agent_weekly_stats | agent_id | public.agents | id | CASCADE | NO ACTION |
| public.audit_logs | user_id | auth.users | id | SET NULL | NO ACTION |
| public.barge_in_sessions | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.battle_card_triggers | battle_card_id | public.battle_cards | id | CASCADE | NO ACTION |
| public.blocked_access_logs | user_id | auth.users | id | SET NULL | NO ACTION |
| public.bot_conversations | conversation_id | public.conversations | id | CASCADE | NO ACTION |
| public.cadence_enrollments | cadence_id | public.cadences | id | CASCADE | NO ACTION |
| public.cadence_enrollments | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.cadence_enrollments | deal_id | public.deals | id | SET NULL | NO ACTION |
| public.cadence_steps | cadence_id | public.cadences | id | CASCADE | NO ACTION |
| public.call_alerts | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_analyses | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_key_moments | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_park_orbits | moh_prompt_id | public.queue_audio_prompts | id | SET NULL | NO ACTION |
| public.call_quality_metrics | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_queue_members | agent_id | public.agents | id | CASCADE | NO ACTION |
| public.call_queue_members | queue_id | public.call_queues | id | CASCADE | NO ACTION |
| public.call_queues | greeting_prompt_id | public.queue_audio_prompts | id | SET NULL | NO ACTION |
| public.call_queues | moh_prompt_id | public.queue_audio_prompts | id | SET NULL | NO ACTION |
| public.call_queues | overflow_prompt_id | public.queue_audio_prompts | id | SET NULL | NO ACTION |
| public.call_queues | overflow_queue_id | public.call_queues | id | SET NULL | NO ACTION |
| public.call_queues | periodic_prompt_id | public.queue_audio_prompts | id | SET NULL | NO ACTION |
| public.call_recordings | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.call_scorecards | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_scorecards | template_id | public.scorecard_templates | id | RESTRICT | NO ACTION |
| public.call_sessions | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.call_sessions | deal_id | public.deals | id | SET NULL | NO ACTION |
| public.call_summaries | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_transcriptions | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_transcripts_searchable | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.call_translations | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.chat_sessions | conversation_id | public.conversations | id | SET NULL | NO ACTION |
| public.churn_risk_signals | account_id | public.accounts | id | CASCADE | NO ACTION |
| public.coaching_assignments | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.coaching_recommendations | agent_id | public.agents | id | CASCADE | NO ACTION |
| public.coaching_timestamps | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.consent_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.consent_records | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_engagement_patterns | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_interactions | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.contact_interactions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contacts | account_id | public.accounts | id | SET NULL | NO ACTION |
| public.conversation_messages | conversation_id | public.conversations | id | CASCADE | NO ACTION |
| public.conversations | account_id | public.accounts | id | SET NULL | NO ACTION |
| public.conversations | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.crm_field_suggestions | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.crm_field_suggestions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.deal_revenue_snapshots | deal_id | public.deals | id | CASCADE | NO ACTION |
| public.deals | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.dialer_queue | campaign_id | public.dialer_campaigns | id | CASCADE | NO ACTION |
| public.dialer_queue | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.email_tickets | conversation_id | public.conversations | id | CASCADE | NO ACTION |
| public.email_verification_tokens | user_id | auth.users | id | CASCADE | NO ACTION |
| public.fraud_signals | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.goal_violations | goal_id | public.dashboard_goals | id | CASCADE | NO ACTION |
| public.hold_events | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.kb_article_history | article_id | public.kb_articles | id | CASCADE | NO ACTION |
| public.kb_article_history | changed_by | auth.users | id | NO ACTION | NO ACTION |
| public.kb_article_views | article_id | public.kb_articles | id | CASCADE | NO ACTION |
| public.kb_article_views | conversation_id | public.conversations | id | SET NULL | NO ACTION |
| public.kb_articles | category_id | public.kb_categories | id | SET NULL | NO ACTION |
| public.kb_categories | parent_id | public.kb_categories | id | SET NULL | NO ACTION |
| public.learning_completions | module_id | public.learning_modules | id | CASCADE | NO ACTION |
| public.live_assist_signals | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.live_sentiment_snapshots | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.manager_alerts | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.meeting_summaries | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.meeting_summaries | edited_by | auth.users | id | SET NULL | NO ACTION |
| public.meeting_summaries | generated_by | auth.users | id | SET NULL | NO ACTION |
| public.parked_calls | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.parked_calls | orbit_id | public.call_park_orbits | id | CASCADE | NO ACTION |
| public.parked_calls | parked_by | auth.users | id | SET NULL | NO ACTION |
| public.parked_calls | retrieved_by | auth.users | id | SET NULL | NO ACTION |
| public.password_reset_tokens | user_id | auth.users | id | CASCADE | NO ACTION |
| public.performance_metrics | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.playlist_items | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.playlist_items | playlist_id | public.call_playlists | id | CASCADE | NO ACTION |
| public.queue_skill_requirements | skill_id | public.skills | id | CASCADE | NO ACTION |
| public.rate_limit_alerts | resolved_by | auth.users | id | NO ACTION | NO ACTION |
| public.rate_limit_alerts | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.rate_limit_logs | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.redaction_log | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.renewals | account_id | public.accounts | id | CASCADE | NO ACTION |
| public.ring_group_members | agent_id | public.agents | id | CASCADE | NO ACTION |
| public.ring_group_members | group_id | public.ring_groups | id | CASCADE | NO ACTION |
| public.role_permissions | permission_id | public.permissions | id | CASCADE | NO ACTION |
| public.scheduled_callbacks | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.scorecard_criteria | template_id | public.scorecard_templates | id | CASCADE | NO ACTION |
| public.scorecard_responses | criterion_id | public.scorecard_criteria | id | CASCADE | NO ACTION |
| public.scorecard_responses | scorecard_id | public.call_scorecards | id | CASCADE | NO ACTION |
| public.shift_swap_suggestions | from_agent_id | public.agents | id | CASCADE | NO ACTION |
| public.shift_swap_suggestions | from_shift_id | public.agent_shifts | id | SET NULL | NO ACTION |
| public.shift_swap_suggestions | to_agent_id | public.agents | id | CASCADE | NO ACTION |
| public.shift_swap_suggestions | to_shift_id | public.agent_shifts | id | SET NULL | NO ACTION |
| public.success_plan_milestones | success_plan_id | public.success_plans | id | CASCADE | NO ACTION |
| public.success_plans | account_id | public.accounts | id | CASCADE | NO ACTION |
| public.survey_responses | account_id | public.accounts | id | SET NULL | NO ACTION |
| public.survey_responses | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.survey_responses | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.survey_responses | survey_id | public.surveys | id | CASCADE | NO ACTION |
| public.toll_free_numbers | call_flow_id | public.call_flows | id | NO ACTION | NO ACTION |
| public.topic_detections | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.tracker_matches | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |
| public.tracker_matches | tracker_id | public.trackers | id | CASCADE | NO ACTION |
| public.user_allowed_ips | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_ip_restrictions | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_mfa_settings | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_passkeys | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_profiles | agent_id | public.agents | id | NO ACTION | NO ACTION |
| public.user_profiles | id | auth.users | id | CASCADE | NO ACTION |
| public.user_roles | granted_by | auth.users | id | NO ACTION | NO ACTION |
| public.user_roles | user_id | auth.users | id | CASCADE | NO ACTION |
| public.voice_prints | user_id | auth.users | id | CASCADE | NO ACTION |
| public.voip_quality_alerts | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.voip_trunk_health_checks | trunk_id | public.voip_trunks | id | CASCADE | NO ACTION |
| public.voip_trunk_usage_metrics | agent_id | public.agents | id | SET NULL | NO ACTION |
| public.voip_trunk_usage_metrics | call_session_id | public.call_sessions | id | SET NULL | NO ACTION |
| public.voip_trunk_usage_metrics | original_trunk_id | public.voip_trunks | id | SET NULL | NO ACTION |
| public.voip_trunk_usage_metrics | trunk_id | public.voip_trunks | id | CASCADE | NO ACTION |
| public.webauthn_challenges | user_id | auth.users | id | CASCADE | NO ACTION |
| public.webhook_flush_metrics | user_id | auth.users | id | SET NULL | NO ACTION |
| public.whisper_messages | call_session_id | public.call_sessions | id | CASCADE | NO ACTION |


_Diagrama omitido: mais de 120 tabelas._

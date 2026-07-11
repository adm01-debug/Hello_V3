
CREATE INDEX IF NOT EXISTS idx_agent_badges_badge_id ON public.agent_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_agent_shifts_template_id ON public.agent_shifts(template_id);
CREATE INDEX IF NOT EXISTS idx_agent_skills_skill_id ON public.agent_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_barge_in_sessions_call_session_id ON public.barge_in_sessions(call_session_id);
CREATE INDEX IF NOT EXISTS idx_blocked_access_logs_user_id ON public.blocked_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_contact_id ON public.cadence_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_deal_id ON public.cadence_enrollments(deal_id);
CREATE INDEX IF NOT EXISTS idx_call_alerts_call_session_id ON public.call_alerts(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_call_session_id ON public.call_recordings(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_scorecards_template_id ON public.call_scorecards(template_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_conversation_id ON public.chat_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_coaching_assignments_call_session_id ON public.coaching_assignments(call_session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_agent_id ON public.coaching_recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_call_session_id ON public.contact_interactions(call_session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_account_id ON public.conversations(account_id);
CREATE INDEX IF NOT EXISTS idx_dialer_queue_contact_id ON public.dialer_queue(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_history_article_id ON public.kb_article_history(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_history_changed_by ON public.kb_article_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_kb_article_views_conversation_id ON public.kb_article_views(conversation_id);
CREATE INDEX IF NOT EXISTS idx_kb_categories_parent_id ON public.kb_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_learning_completions_module_id ON public.learning_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_manager_alerts_call_session_id ON public.manager_alerts(call_session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_edited_by ON public.meeting_summaries(edited_by);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_generated_by ON public.meeting_summaries(generated_by);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_call_session_id ON public.playlist_items(call_session_id);
CREATE INDEX IF NOT EXISTS idx_queue_skill_requirements_skill_id ON public.queue_skill_requirements(skill_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_alerts_resolved_by ON public.rate_limit_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_rate_limit_alerts_user_id ON public.rate_limit_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_user_id ON public.rate_limit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_scorecard_criteria_template_id ON public.scorecard_criteria(template_id);
CREATE INDEX IF NOT EXISTS idx_scorecard_responses_criterion_id ON public.scorecard_responses(criterion_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_suggestions_from_agent_id ON public.shift_swap_suggestions(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_suggestions_from_shift_id ON public.shift_swap_suggestions(from_shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_suggestions_to_agent_id ON public.shift_swap_suggestions(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_suggestions_to_shift_id ON public.shift_swap_suggestions(to_shift_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_call_session_id ON public.survey_responses(call_session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_contact_id ON public.survey_responses(contact_id);
CREATE INDEX IF NOT EXISTS idx_toll_free_numbers_call_flow_id ON public.toll_free_numbers(call_flow_id);
CREATE INDEX IF NOT EXISTS idx_topic_detections_call_session_id ON public.topic_detections(call_session_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_agent_id ON public.user_profiles(agent_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by ON public.user_roles(granted_by);
CREATE INDEX IF NOT EXISTS idx_voip_quality_alerts_call_session_id ON public.voip_quality_alerts(call_session_id);
CREATE INDEX IF NOT EXISTS idx_voip_trunk_usage_metrics_call_session_id ON public.voip_trunk_usage_metrics(call_session_id);
CREATE INDEX IF NOT EXISTS idx_voip_trunk_usage_metrics_original_trunk_id ON public.voip_trunk_usage_metrics(original_trunk_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON public.webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_whisper_messages_call_session_id ON public.whisper_messages(call_session_id);

ANALYZE public.agent_badges, public.cadence_enrollments, public.call_alerts, public.call_recordings,
        public.chat_sessions, public.coaching_assignments, public.contact_interactions,
        public.conversations, public.kb_article_history, public.rate_limit_logs,
        public.shift_swap_suggestions, public.user_roles, public.voip_trunk_usage_metrics;

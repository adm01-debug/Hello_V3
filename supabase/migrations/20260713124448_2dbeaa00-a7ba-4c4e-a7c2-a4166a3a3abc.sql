DROP INDEX IF EXISTS public.idx_journey_history_account;
DROP INDEX IF EXISTS public.idx_active_sessions_user;
DROP INDEX IF EXISTS public.idx_battle_card_triggers_card;
DROP INDEX IF EXISTS public.idx_blocked_access_created;
DROP INDEX IF EXISTS public.idx_bot_conversations_conv;
DROP INDEX IF EXISTS public.idx_enrollments_cadence;
DROP INDEX IF EXISTS public.idx_analyses_session;
DROP INDEX IF EXISTS public.idx_key_moments_session;
DROP INDEX IF EXISTS public.idx_cqm_call_session;
DROP INDEX IF EXISTS public.idx_scorecards_call;
DROP INDEX IF EXISTS public.idx_summaries_session;
DROP INDEX IF EXISTS public.idx_transcriptions_session;
DROP INDEX IF EXISTS public.idx_churn_signals_account;
DROP INDEX IF EXISTS public.idx_coaching_ts_session;
DROP INDEX IF EXISTS public.idx_consent_contact;
DROP INDEX IF EXISTS public.idx_consent_records_contact;
DROP INDEX IF EXISTS public.idx_contact_alerts_contact;
DROP INDEX IF EXISTS public.idx_engagement_patterns_contact;
DROP INDEX IF EXISTS public.idx_contact_interactions_contact;
DROP INDEX IF EXISTS public.idx_crm_suggestions_session;
DROP INDEX IF EXISTS public.idx_crm_suggestions_contact;
DROP INDEX IF EXISTS public.idx_deal_revenue_deal;
DROP INDEX IF EXISTS public.idx_email_tickets_conversation;
DROP INDEX IF EXISTS public.idx_fraud_signals_session;
DROP INDEX IF EXISTS public.idx_kb_views_article;
DROP INDEX IF EXISTS public.idx_kb_articles_category;
DROP INDEX IF EXISTS public.idx_sentiment_snap_session;
DROP INDEX IF EXISTS public.idx_redaction_log_session;
DROP INDEX IF EXISTS public.idx_renewals_account;
DROP INDEX IF EXISTS public.idx_scorecard_responses_card;
DROP INDEX IF EXISTS public.idx_milestones_plan;
DROP INDEX IF EXISTS public.idx_success_plans_account;
DROP INDEX IF EXISTS public.idx_survey_responses_account;
DROP INDEX IF EXISTS public.idx_survey_responses_survey;
DROP INDEX IF EXISTS public.idx_tracker_matches_call;
DROP INDEX IF EXISTS public.idx_tracker_matches_tracker;

INSERT INTO public.index_drop_audit (index_name, table_name, sql_generated, action)
VALUES
  ('idx_journey_history_account','account_journey_history','DROP INDEX','execute'),
  ('idx_active_sessions_user','active_sessions','DROP INDEX','execute'),
  ('idx_battle_card_triggers_card','battle_card_triggers','DROP INDEX','execute'),
  ('idx_blocked_access_created','blocked_access_logs','DROP INDEX','execute'),
  ('idx_bot_conversations_conv','bot_conversations','DROP INDEX','execute'),
  ('idx_enrollments_cadence','cadence_enrollments','DROP INDEX','execute'),
  ('idx_analyses_session','call_analyses','DROP INDEX','execute'),
  ('idx_key_moments_session','call_key_moments','DROP INDEX','execute'),
  ('idx_cqm_call_session','call_quality_metrics','DROP INDEX','execute'),
  ('idx_scorecards_call','call_scorecards','DROP INDEX','execute'),
  ('idx_summaries_session','call_summaries','DROP INDEX','execute'),
  ('idx_transcriptions_session','call_transcriptions','DROP INDEX','execute'),
  ('idx_churn_signals_account','churn_risk_signals','DROP INDEX','execute'),
  ('idx_coaching_ts_session','coaching_timestamps','DROP INDEX','execute'),
  ('idx_consent_contact','consent_history','DROP INDEX','execute'),
  ('idx_consent_records_contact','consent_records','DROP INDEX','execute'),
  ('idx_contact_alerts_contact','contact_alerts','DROP INDEX','execute'),
  ('idx_engagement_patterns_contact','contact_engagement_patterns','DROP INDEX','execute'),
  ('idx_contact_interactions_contact','contact_interactions','DROP INDEX','execute'),
  ('idx_crm_suggestions_session','crm_field_suggestions','DROP INDEX','execute'),
  ('idx_crm_suggestions_contact','crm_field_suggestions','DROP INDEX','execute'),
  ('idx_deal_revenue_deal','deal_revenue_snapshots','DROP INDEX','execute'),
  ('idx_email_tickets_conversation','email_tickets','DROP INDEX','execute'),
  ('idx_fraud_signals_session','fraud_signals','DROP INDEX','execute'),
  ('idx_kb_views_article','kb_article_views','DROP INDEX','execute'),
  ('idx_kb_articles_category','kb_articles','DROP INDEX','execute'),
  ('idx_sentiment_snap_session','live_sentiment_snapshots','DROP INDEX','execute'),
  ('idx_redaction_log_session','redaction_log','DROP INDEX','execute'),
  ('idx_renewals_account','renewals','DROP INDEX','execute'),
  ('idx_scorecard_responses_card','scorecard_responses','DROP INDEX','execute'),
  ('idx_milestones_plan','success_plan_milestones','DROP INDEX','execute'),
  ('idx_success_plans_account','success_plans','DROP INDEX','execute'),
  ('idx_survey_responses_account','survey_responses','DROP INDEX','execute'),
  ('idx_survey_responses_survey','survey_responses','DROP INDEX','execute'),
  ('idx_tracker_matches_call','tracker_matches','DROP INDEX','execute'),
  ('idx_tracker_matches_tracker','tracker_matches','DROP INDEX','execute');

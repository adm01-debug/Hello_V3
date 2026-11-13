# Policies (RLS)


Visão consolidada (inclui `storage.objects` e `realtime.messages`); detalhes por tabela em `tables/`.

| tabela | policy | cmd | tipo | roles | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| public.account_journey_history | Admin/supervisor or CSM insert journey history | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = account_journey_history.account_id) AND (a.csm_agent_name = get_user_agent_name())))))` |
| public.account_journey_history | Admin/supervisor view all journey history | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.account_journey_history | CSM views history for their accounts | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = account_journey_history.account_id) AND (a.csm_agent_name = get_user_agent_name()))))` |  |
| public.account_lockouts | Admins can view account_lockouts | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.account_lockouts | Deny direct delete account_lockouts | DELETE | PERMISSIVE | public | `false` |  |
| public.account_lockouts | Deny direct insert account_lockouts | INSERT | PERMISSIVE | public |  | `false` |
| public.account_lockouts | Deny direct update account_lockouts | UPDATE | PERMISSIVE | public | `false` |  |
| public.accounts | Admin/supervisor full access on accounts | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.accounts | CSM can update their accounts | UPDATE | PERMISSIVE | authenticated | `(csm_agent_name = get_user_agent_name())` | `(csm_agent_name = get_user_agent_name())` |
| public.accounts | CSM can view their accounts | SELECT | PERMISSIVE | authenticated | `(csm_agent_name = get_user_agent_name())` |  |
| public.active_sessions | Admins can view all sessions | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.active_sessions | Users can manage their own sessions | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.agent_badges | Admins can manage agent_badges | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.agent_badges | Authenticated users can view agent_badges | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.agent_devices | Admins can manage agent_devices | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.agent_devices | Agents can delete own devices | DELETE | PERMISSIVE | authenticated | `(agent_name = get_user_agent_name())` |  |
| public.agent_devices | Agents can manage own devices | INSERT | PERMISSIVE | authenticated |  | `(agent_name = get_user_agent_name())` |
| public.agent_devices | Agents can update own devices | UPDATE | PERMISSIVE | authenticated | `(agent_name = get_user_agent_name())` |  |
| public.agent_devices | Agents can view own devices | SELECT | PERMISSIVE | authenticated | `(agent_name = get_user_agent_name())` |  |
| public.agent_goals | Admins can manage agent_goals | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.agent_goals | Authenticated users can view agent_goals | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.agent_ring_settings | Admins can manage ring_settings | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.agent_ring_settings | Agents can insert own ring_settings | INSERT | PERMISSIVE | authenticated |  | `(agent_name = get_user_agent_name())` |
| public.agent_ring_settings | Agents can update own ring_settings | UPDATE | PERMISSIVE | authenticated | `(agent_name = get_user_agent_name())` |  |
| public.agent_ring_settings | Agents can view own ring_settings | SELECT | PERMISSIVE | authenticated | `(agent_name = get_user_agent_name())` |  |
| public.agent_shifts | Admin/supervisor manage shifts | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.agent_shifts | Agents view own shifts, supervisors all | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |  |
| public.agent_skills | Admin/supervisor manage agent skills | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.agent_skills | Authenticated view agent skills | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.agent_trunk_assignments | assignments_admin_all | ALL | PERMISSIVE | authenticated | `is_admin_user(( SELECT auth.uid() AS uid))` | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.agent_trunk_assignments | assignments_agent_select_own | SELECT | PERMISSIVE | authenticated | `(agent_id = get_user_agent_id())` |  |
| public.agent_weekly_stats | Admins can manage agent_weekly_stats | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.agent_weekly_stats | Role-based view agent_weekly_stats | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_id = get_user_agent_id()))` |  |
| public.agents | Admins can manage agents | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.agents | Agents can view own record, admins/supervisors view all | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (id = get_user_agent_id()))` |  |
| public.agents | Users can view agents | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.audit_logs | Admins can view audit_logs | SELECT | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.audit_logs | Block direct delete audit_logs | DELETE | PERMISSIVE | authenticated | `false` |  |
| public.audit_logs | Block direct insert audit_logs | INSERT | PERMISSIVE | authenticated |  | `false` |
| public.audit_logs | Deny direct insert audit_logs | INSERT | PERMISSIVE | public |  | `false` |
| public.badges | Admins can manage badges | ALL | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.badges | Authenticated users can view badges | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.barge_in_sessions | Involved parties view barge_in_sessions | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (supervisor_name = get_user_agent_name()) OR (agent_name = get_user_agent_name()))` |  |
| public.barge_in_sessions | Supervisors can manage barge_in_sessions | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.battle_card_triggers | Admin/supervisor manage triggers | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.battle_card_triggers | All authenticated view triggers | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.battle_cards | Admin/supervisor manage battle cards | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.battle_cards | All authenticated view battle cards | SELECT | PERMISSIVE | public | `(((( SELECT auth.uid() AS uid) IS NOT NULL) AND (is_active = true)) OR is_admin_or_supervisor())` |  |
| public.bitrix_departments | Admins can manage bitrix departments | ALL | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.bitrix_users | Admins can manage bitrix users | ALL | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.blocked_access_logs | Admins can view blocked_access_logs | SELECT | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.blocked_access_logs | Only admins can insert blocked access logs | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.bot_conversations | Admin/Supervisor insert bot conversations | INSERT | PERMISSIVE | public |  | `is_admin_or_supervisor()` |
| public.bot_conversations | Admin/Supervisor view bot conversations | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.bot_conversations | Agents view bot convs from assigned | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = bot_conversations.conversation_id) AND (c.assigned_agent_name = get_user_agent_name()))))` |  |
| public.cadence_enrollments | Agents update own enrollments | UPDATE | PERMISSIVE | public | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| public.cadence_enrollments | Agents view own enrollments | SELECT | PERMISSIVE | public | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |  |
| public.cadence_enrollments | Authenticated insert enrollments | INSERT | PERMISSIVE | public |  | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (is_admin_or_supervisor() OR (agent_name = get_user_agent_name())))` |
| public.cadence_enrollments | Supervisors manage enrollments | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.cadence_steps | All authenticated read cadence steps | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.cadence_steps | Supervisors manage cadence steps | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.cadences | All authenticated read cadences | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.cadences | Supervisors manage cadences | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.call_alerts | Admin supervisor insert call_alerts | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.call_alerts | Admins and supervisors can update call_alerts | UPDATE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.call_alerts | Admins can delete call_alerts | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_alerts | Agents can mark own alerts as read | UPDATE | PERMISSIVE | authenticated | `(call_session_id IN ( SELECT call_sessions.id    FROM call_sessions   WHERE (call_sessions.agent_name = get_user_agent_name())))` | `(call_session_id IN ( SELECT call_sessions.id    FROM call_sessions   WHERE (call_sessions.agent_name = get_user_agent_name())))` |
| public.call_alerts | Scoped call_alerts SELECT | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (call_session_id IN ( SELECT call_sessions.id    FROM call_sessions   WHERE (call_sessions.agent_name = get_user_agent_name()))))` |  |
| public.call_analyses | Admins can manage call_analyses | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_analyses | Role-based view call_analyses | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_analyses.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |  |
| public.call_analyses | Validated insert call_analyses | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_analyses.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| public.call_control_audit_logs | Admins can view call control audit | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'supervisor'::app_role])))))` |  |
| public.call_control_audit_logs | Admins have full access to call_control_audit_logs | ALL | PERMISSIVE | authenticated | `is_admin()` |  |
| public.call_control_audit_logs | Agents can view own audit logs | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (source = (auth.jwt() ->> 'email'::text)))` |  |
| public.call_control_audit_logs | Agents log own call control events | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (source = (( SELECT auth.jwt() AS jwt) ->> 'email'::text)) OR (source = (( SELECT auth.uid() AS uid))::text))` |
| public.call_flows | Admins can manage call_flows | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_flows | Admins can view call flows | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_key_moments | Admin/supervisor delete key moments | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_key_moments | Owner or admin insert key moments | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_key_moments.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| public.call_key_moments | View own or as supervisor key moments | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_key_moments.call_session_id) AND can_access_agent_data(cs.agent_name)))))` |  |
| public.call_park_orbits | park_orbits_delete_admin | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_park_orbits | park_orbits_insert_admin | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.call_park_orbits | park_orbits_select_auth | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.call_park_orbits | park_orbits_update_admin | UPDATE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.call_playlists | Owner or admin create playlists | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (owner_agent_name = get_user_agent_name()))` |
| public.call_playlists | Owners delete playlists | DELETE | PERMISSIVE | public | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |  |
| public.call_playlists | Owners update playlists | UPDATE | PERMISSIVE | public | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| public.call_playlists | View own or shared playlists | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (owner_agent_name = get_user_agent_name()) OR ((is_shared = true) AND (get_user_agent_name() = ANY (shared_with))))` |  |
| public.call_quality_metrics | Admins have full access to call_quality_metrics | ALL | PERMISSIVE | authenticated | `is_admin()` |  |
| public.call_quality_metrics | Role-based view quality metrics | SELECT | PERMISSIVE | public | `(is_admin() OR is_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.call_quality_metrics | admins_delete_quality_metrics | DELETE | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.call_quality_metrics | agents_insert_own_quality_metrics | INSERT | PERMISSIVE | public |  | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name) OR (agent_name IS NULL))` |
| public.call_quality_metrics | agents_update_own_quality_metrics | UPDATE | PERMISSIVE | public | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |  |
| public.call_quality_metrics | agents_view_own_quality_metrics | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |  |
| public.call_queue_members | call_queue_members_manage_admin_supervisor | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.call_queue_members | call_queue_members_select_authenticated | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.call_queues | call_queues_manage_admin_supervisor | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.call_queues | call_queues_select_authenticated | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.call_recordings | Admins can manage call_recordings | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_recordings | Strict isolation: Agents view own recordings | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_recordings.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |  |
| public.call_recordings | Validated insert call_recordings | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_recordings.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| public.call_scorecards | Agents view own scorecards | SELECT | PERMISSIVE | public | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |  |
| public.call_scorecards | Supervisors manage scorecards | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.call_sessions | Admins can delete call_sessions | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_sessions | Admins have full access to call_sessions | ALL | PERMISSIVE | authenticated | `is_admin()` |  |
| public.call_sessions | Agents can insert own call sessions | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR is_active_agent(agent_name))` |
| public.call_sessions | Role-based update call_sessions | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.call_sessions | Strict isolation: Agents view own sessions | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.call_summaries | Admins can manage call_summaries | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_summaries | Role-based view call_summaries | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |  |
| public.call_summaries | Validated insert call_summaries | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| public.call_transcriptions | Admins can manage call_transcriptions | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_transcriptions | Role-based view call_transcriptions | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR ((EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcriptions.call_session_id) AND (cs.agent_name = get_user_agent_name())))) AND is_active_agent(get_user_agent_name())))` |  |
| public.call_transcriptions | Validated insert call_transcriptions | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR ((EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcriptions.call_session_id) AND (cs.agent_name = get_user_agent_name())))) AND is_active_agent(get_user_agent_name())))` |
| public.call_transcripts_searchable | Owner or admin insert transcripts | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcripts_searchable.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| public.call_transcripts_searchable | Owner or admin update transcripts | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_transcripts_searchable.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |  |
| public.call_transcripts_searchable | View transcripts own or supervisor | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR can_access_agent_data(agent_name))` |  |
| public.call_translations | Admin can delete translations | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.call_translations | Agent/supervisor/admin can view translations | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_translations.call_session_id) AND can_access_agent_data(cs.agent_name)))))` |  |
| public.call_translations | Owner or admin insert translations | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = call_translations.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| public.calling_hours_config | Admins can manage calling_hours_config | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.calling_hours_config | Authenticated can view calling_hours_config | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.chat_sessions | Admin/Supervisor manage chat sessions | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.chat_sessions | Admin/Supervisor view all chat sessions | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.chat_sessions | Agents view sessions from assigned convs | SELECT | PERMISSIVE | public | `((conversation_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = chat_sessions.conversation_id) AND (c.assigned_agent_name = get_user_agent_name())))))` |  |
| public.churn_risk_signals | Admin/supervisor full access on churn signals | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.churn_risk_signals | CSM can resolve signals for their accounts | UPDATE | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = churn_risk_signals.account_id) AND (a.csm_agent_name = get_user_agent_name()))))` |  |
| public.churn_risk_signals | CSM can view signals for their accounts | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = churn_risk_signals.account_id) AND (a.csm_agent_name = get_user_agent_name()))))` |  |
| public.coaching_assignments | Admin/supervisor create assignments | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.coaching_assignments | Admin/supervisor delete assignments | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.coaching_assignments | Agents update own assignments status | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| public.coaching_assignments | Agents view own assignments | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |  |
| public.coaching_recommendations | Role-based update coaching_recommendations | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_id = get_user_agent_id()))` |  |
| public.coaching_recommendations | Role-based view coaching_recommendations | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_id = get_user_agent_id()))` |  |
| public.coaching_recommendations | Supervisors can delete coaching_recommendations | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.coaching_recommendations | Supervisors can insert coaching_recommendations | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.coaching_timestamps | Admin supervisor insert coaching ts | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.coaching_timestamps | Admin/supervisor delete coaching ts | DELETE | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.coaching_timestamps | View coaching ts own or supervisor | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR can_access_agent_data(agent_name))` |  |
| public.compliance_rules | Admin/supervisor gerenciam regras de compliance | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.compliance_rules | Todos autenticados leem regras de compliance | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.compliance_settings | Admins can manage compliance_settings | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.compliance_settings | Authenticated can view compliance_settings | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.consent_history | Admins can insert consent_history | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.consent_history | Supervisors can view consent_history | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.consent_records | Admins delete consent | DELETE | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.consent_records | Admins/supervisors insert consent | INSERT | PERMISSIVE | public |  | `is_admin_or_supervisor()` |
| public.consent_records | Admins/supervisors update consent | UPDATE | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.consent_records | Admins/supervisors view consent | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.contact_alerts | Admins can delete contact_alerts | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.contact_alerts | Only admins and supervisors can insert contact_alerts | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.contact_alerts | Role-based update contact_alerts | UPDATE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.contact_alerts | Role-based view contact_alerts | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.contact_engagement_patterns | Admins manage engagement patterns | ALL | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.contact_engagement_patterns | Authenticated read engagement patterns | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.contact_interactions | Admins can manage contact_interactions | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.contact_interactions | Agents can insert own interactions | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR is_active_agent(agent_name))` |
| public.contact_interactions | Role-based view contact_interactions | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR ((agent_name = get_user_agent_name()) AND is_active_agent(agent_name)))` |  |
| public.contacts | Admins can delete contacts | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.contacts | Role-based update contacts | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM contact_interactions ci   WHERE ((ci.contact_id = contacts.id) AND (ci.agent_name = get_user_agent_name())))))` |  |
| public.contacts | Role-based view contacts | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM contact_interactions ci   WHERE ((ci.contact_id = contacts.id) AND (ci.agent_name = get_user_agent_name())))) OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.contact_id = contacts.id) AND (cs.agent_name = get_user_agent_name())))))` |  |
| public.contacts | Supervisors can insert contacts | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.conversation_messages | Admin/Supervisor manage messages | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.conversation_messages | Admin/Supervisor view all messages | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.conversation_messages | Agents insert in assigned conversations | INSERT | PERMISSIVE | public |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = conversation_messages.conversation_id) AND (c.assigned_agent_name = get_user_agent_name())))))` |
| public.conversation_messages | Agents view messages from assigned convs | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = conversation_messages.conversation_id) AND (c.assigned_agent_name = get_user_agent_name()))))` |  |
| public.conversation_messages | Users can view messages of their conversations | SELECT | PERMISSIVE | public | `((EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = conversation_messages.conversation_id) AND (c.assigned_agent_name = ( SELECT user_profiles.full_name            FROM user_profiles           WHERE (user_profiles.id = ( SELECT auth.uid() AS uid))))))) OR (EXISTS ( SELECT 1    FROM user_profiles   WHERE ((user_profiles.id = ( SELECT auth.uid() AS uid)) AND (user_profiles.role = ANY (ARRAY['admin'::text, 'supervisor'::text]))))))` |  |
| public.conversations | Admin/Supervisor manage conversations | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.conversations | Admin/Supervisor view all conversations | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.conversations | Agents update assigned conversations | UPDATE | PERMISSIVE | public | `(assigned_agent_name = get_user_agent_name())` | `(assigned_agent_name = get_user_agent_name())` |
| public.conversations | Agents view assigned conversations | SELECT | PERMISSIVE | public | `(assigned_agent_name = get_user_agent_name())` |  |
| public.conversations | Users can view their own conversations | SELECT | PERMISSIVE | public | `((( SELECT auth.uid() AS uid) = id) OR (EXISTS ( SELECT 1    FROM user_profiles   WHERE ((user_profiles.id = ( SELECT auth.uid() AS uid)) AND (user_profiles.role = ANY (ARRAY['admin'::text, 'supervisor'::text]))))))` |  |
| public.crm_field_suggestions | Admin supervisor insert crm suggestions | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.crm_field_suggestions | Admin supervisor read crm suggestions | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.crm_field_suggestions | Admin supervisor update crm suggestions | UPDATE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.crm_field_suggestions | Admin/supervisor deletam sugestões | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.crm_sync_queue | Admin supervisor insert crm sync queue | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.crm_sync_queue | Admins e supervisores podem ler fila CRM | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.cultural_hints | Admin can manage cultural hints | ALL | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.cultural_hints | Authenticated can view cultural hints | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.customer_journey_stages | Admin/supervisor manage journey stages | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.customer_journey_stages | All authenticated can view journey stages | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.dashboard_goals | Authenticated users can view dashboard_goals | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.dashboard_goals | Supervisors can manage dashboard_goals | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.data_lake_exports | Admins manage data exports | ALL | PERMISSIVE | authenticated | `is_admin()` | `is_admin()` |
| public.deal_revenue_snapshots | Admin/Supervisor manage revenue snapshots | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.deals | Admins/supervisors manage all deals | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.deals | Agents update own deals | UPDATE | PERMISSIVE | public | `(owner_agent_name = get_user_agent_name())` | `(owner_agent_name = get_user_agent_name())` |
| public.deals | Agents view own deals | SELECT | PERMISSIVE | public | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |  |
| public.deals | Authenticated create deals | INSERT | PERMISSIVE | public |  | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (is_admin_or_supervisor() OR (owner_agent_name IS NULL) OR (owner_agent_name = get_user_agent_name())))` |
| public.dialer_campaigns | Authenticated users can view dialer_campaigns | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.dialer_campaigns | Supervisors can manage dialer_campaigns | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.dialer_favorites | Users manage own dialer favorites | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.dialer_queue | Role-based update dialer_queue | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()))` |  |
| public.dialer_queue | Role-based view dialer_queue | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()))` |  |
| public.dialer_queue | Supervisors can manage dialer_queue | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.dnc_import_logs | Supervisors can insert dnc_import_logs | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.dnc_import_logs | Supervisors can view dnc_import_logs | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.dnc_list | Authenticated can view dnc_list | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.dnc_list | Supervisors can manage dnc_list | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.email_tickets | Admin/Supervisor manage email tickets | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.email_tickets | Admin/Supervisor view all email tickets | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.email_tickets | Agents view tickets from assigned convs | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = email_tickets.conversation_id) AND (c.assigned_agent_name = get_user_agent_name()))))` |  |
| public.email_verification_tokens | Authenticated users can insert own verification tokens | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.email_verification_tokens | Deny update email_verification_tokens | UPDATE | PERMISSIVE | authenticated |  | `false` |
| public.email_verification_tokens | Users can delete own verification tokens | DELETE | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = user_id) OR is_admin_user(( SELECT auth.uid() AS uid)))` |  |
| public.email_verification_tokens | Users can view own verification tokens | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.fraud_signals | Admins and supervisors view all fraud signals | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.fraud_signals | Admins manage fraud signals | ALL | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.fraud_signals | Agents view fraud signals on own calls | SELECT | PERMISSIVE | public | `(agent_name = get_user_agent_name())` |  |
| public.geo_access_logs | Admins can delete geo access logs | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.geo_access_logs | Admins can view geo access logs | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.geo_access_logs | Only admins can insert geo access logs | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.geo_restrictions | Admins can manage geo restrictions | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.geo_restrictions | Authenticated users can read geo restrictions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.geo_settings | Admins can manage geo settings | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.geo_settings | Admins supervisors view geo_settings | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.goal_violations | Authenticated users can view goal_violations | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.goal_violations | Only admins and supervisors can insert goal_violations | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.goal_violations | Supervisors can manage goal_violations | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.hold_alert_settings | Admins can manage hold_alert_settings | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.hold_alert_settings | Authenticated users can view hold_alert_settings | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.hold_events | Admins can delete hold_events | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.hold_events | Admins have full access to hold_events | ALL | PERMISSIVE | authenticated | `is_admin()` |  |
| public.hold_events | Admins or linked agents can insert hold events | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.hold_events | Admins or linked agents can update hold events | UPDATE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.hold_events | Admins supervisors and own agent can view hold_events | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.holidays | Admins can manage holidays | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.holidays | Authenticated can view holidays | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.hot_desking_stations | Admins can manage stations | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.hot_desking_stations | Authenticated can view stations | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.hot_desking_stations | Users can update own station or admins all | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (current_user_name = ( SELECT user_profiles.full_name    FROM user_profiles   WHERE (user_profiles.id = ( SELECT auth.uid() AS uid)))))` |  |
| public.index_drop_audit | Admins podem ler histórico de DROP INDEX | SELECT | PERMISSIVE | authenticated | `is_admin()` |  |
| public.ip_whitelist | Admins can manage ip_whitelist | ALL | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.ip_whitelist | Admins can view ip_whitelist | SELECT | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.kb_article_history | Apenas admin e supervisor veem historico | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.kb_article_views | Admin/Supervisor view all kb views | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.kb_article_views | Agents insert own kb views | INSERT | PERMISSIVE | authenticated |  | `((viewer_type = 'agent'::text) AND (viewer_id = ( SELECT auth.uid() AS uid)))` |
| public.kb_article_views | Agents view own kb_article_views | SELECT | PERMISSIVE | authenticated | `(viewer_id = ( SELECT auth.uid() AS uid))` |  |
| public.kb_articles | Admin/Supervisor manage articles | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.kb_articles | Admin/Supervisor view all articles | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.kb_articles | Authenticated read published articles | SELECT | PERMISSIVE | public | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (status = 'published'::text))` |  |
| public.kb_categories | Admin/Supervisor manage kb_categories | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.kb_categories | Authenticated read kb_categories | SELECT | PERMISSIVE | public | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (is_published = true))` |  |
| public.learning_completions | Admin/supervisor delete completions | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.learning_completions | Agents create own completions | INSERT | PERMISSIVE | authenticated |  | `((get_user_agent_name() = agent_name) OR is_admin_or_supervisor())` |
| public.learning_completions | Agents view own completions | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |  |
| public.learning_modules | Admin/supervisor manage learning modules | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.learning_modules | Authenticated view learning modules | SELECT | PERMISSIVE | authenticated | `(is_active OR is_admin_or_supervisor())` |  |
| public.live_assist_signals | Admin supervisor insert live_assist_signals | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.live_assist_signals | Admin/supervisor podem deletar sinais | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.live_assist_signals | Agente pode marcar sinal como usado | UPDATE | PERMISSIVE | public | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.live_assist_signals | Agentes veem seus próprios sinais | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.live_sentiment_snapshots | Owner or admin insert sentiment snapshots | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = live_sentiment_snapshots.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |
| public.live_sentiment_snapshots | View sentiment snapshots | SELECT | PERMISSIVE | public | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = live_sentiment_snapshots.call_session_id) AND can_access_agent_data(cs.agent_name)))))` |  |
| public.login_attempts | Admins can view login_attempts | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.login_attempts | Block direct delete login_attempts | DELETE | PERMISSIVE | authenticated | `false` |  |
| public.login_attempts | Block direct insert login_attempts | INSERT | PERMISSIVE | authenticated |  | `false` |
| public.login_attempts | Block direct update login_attempts | UPDATE | PERMISSIVE | authenticated | `false` |  |
| public.login_attempts | Deny direct insert login_attempts public | INSERT | PERMISSIVE | public |  | `false` |
| public.manager_alerts | Admins can insert manager_alerts | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.manager_alerts | Admins can manage manager_alerts | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.meeting_summaries | summaries_delete_admin | DELETE | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.meeting_summaries | summaries_insert_admin_supervisor | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.meeting_summaries | summaries_insert_agent_own | INSERT | PERMISSIVE | public |  | `(EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = meeting_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name()))))` |
| public.meeting_summaries | summaries_select_admin_supervisor | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.meeting_summaries | summaries_select_agent_own | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = meeting_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name()))))` |  |
| public.meeting_summaries | summaries_update_admin_supervisor | UPDATE | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.meeting_summaries | summaries_update_agent_own | UPDATE | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = meeting_summaries.call_session_id) AND (cs.agent_name = get_user_agent_name()))))` |  |
| public.notification_preferences | Users can insert own preferences | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.notification_preferences | Users can update own preferences | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notification_preferences | Users can view own preferences | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notifications | Users can delete own notifications | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notifications | Users can insert own notifications | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.notifications | Users can update own notifications | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notifications | Users can view own notifications | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.number_porting_requests | Admins can manage porting | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.number_porting_requests | Admins can view porting requests | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.objection_library | Admin/supervisor gerenciam biblioteca de objeções | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.objection_library | Todos autenticados leem biblioteca de objeções | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.optimistic_lock_conflicts | olc_admin_supervisor_select | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.parked_calls | parked_calls_delete_admin | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.parked_calls | parked_calls_insert_self | INSERT | PERMISSIVE | authenticated |  | `((parked_by = auth.uid()) AND (status = 'parked'::text))` |
| public.parked_calls | parked_calls_select_auth | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.parked_calls | parked_calls_update_retrieve | UPDATE | PERMISSIVE | authenticated | `((status = 'parked'::text) OR is_admin_or_supervisor())` | `(is_admin_or_supervisor() OR ((status <> 'parked'::text) AND (retrieved_by = auth.uid())) OR ((status = 'parked'::text) AND (parked_by = auth.uid())))` |
| public.password_reset_requests | Admins can manage password_reset_requests | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.password_reset_requests | Users can request own password reset | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.password_reset_requests | Users can view own reset requests | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.password_reset_tokens | Authenticated users can insert own reset tokens | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.password_reset_tokens | Deny update password_reset_tokens | UPDATE | PERMISSIVE | authenticated |  | `false` |
| public.password_reset_tokens | Users can delete own reset tokens | DELETE | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = user_id) OR is_admin_user(( SELECT auth.uid() AS uid)))` |  |
| public.password_reset_tokens | Users can view own reset tokens | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.performance_metrics | Apenas admin pode ver métricas | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.performance_metrics | Qualquer autenticado pode inserir métricas | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.permissions | Admins can manage permissions | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.permissions | Authenticated users can view permissions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.playlist_items | Manage items of own playlists | ALL | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM call_playlists p   WHERE ((p.id = playlist_items.playlist_id) AND ((p.owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor()))))` | `(EXISTS ( SELECT 1    FROM call_playlists p   WHERE ((p.id = playlist_items.playlist_id) AND ((p.owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor()))))` |
| public.playlist_items | View items of accessible playlists | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM call_playlists p   WHERE ((p.id = playlist_items.playlist_id) AND (is_admin_or_supervisor() OR (p.owner_agent_name = get_user_agent_name()) OR (p.is_shared = true)))))` |  |
| public.queue_audio_prompts | queue_audio_prompts_select_authenticated | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.queue_audio_prompts | queue_audio_prompts_write_staff | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.queue_metrics_settings | Admins can manage queue_metrics_settings | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.queue_metrics_settings | Authenticated users can view queue_metrics_settings | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.queue_skill_requirements | Admin/supervisor manage queue requirements | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.queue_skill_requirements | Authenticated view queue requirements | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.rate_limit_alerts | Admins can update rate_limit_alerts | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.rate_limit_alerts | Admins can view rate_limit_alerts | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.rate_limit_alerts | Only admins can insert rate limit alerts | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.rate_limit_logs | Admins can view rate_limit_logs | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.rate_limit_logs | Only admins can insert rate limit logs | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.rate_limit_settings | Admins can manage rate_limit_settings | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.rate_limit_settings | Admins can view rate_limit_settings | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.redaction_log | Admins view redaction log | SELECT | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.renewals | Admin/supervisor full access on renewals | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.renewals | CSM can update their renewals | UPDATE | PERMISSIVE | authenticated | `(owner_agent_name = get_user_agent_name())` | `(owner_agent_name = get_user_agent_name())` |
| public.renewals | CSM can view their renewals | SELECT | PERMISSIVE | authenticated | `((owner_agent_name = get_user_agent_name()) OR (EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = renewals.account_id) AND (a.csm_agent_name = get_user_agent_name())))))` |  |
| public.ring_group_members | ring_group_members_select_authenticated | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.ring_group_members | ring_group_members_write_staff | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.ring_groups | ring_groups_select_authenticated | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.ring_groups | ring_groups_write_staff | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.rls_audit_logs | Admins can view RLS audit logs | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM user_profiles   WHERE ((user_profiles.id = ( SELECT auth.uid() AS uid)) AND (user_profiles.role = 'admin'::text))))` |  |
| public.role_permissions | Admins can manage role_permissions | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.role_permissions | Authenticated users can view role_permissions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.routing_rules | Admin manage routing rules | ALL | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.routing_rules | Admin/Supervisor view routing rules | SELECT | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.scheduled_callbacks | Admins can delete scheduled_callbacks | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.scheduled_callbacks | Role-based update scheduled_callbacks | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()) OR (created_by = get_user_agent_name()))` |  |
| public.scheduled_callbacks | Role-based view scheduled_callbacks | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()))` |  |
| public.scheduled_callbacks | Supervisors can insert scheduled_callbacks | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.scorecard_criteria | Admins manage criteria | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.scorecard_criteria | All authenticated read criteria | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.scorecard_responses | Supervisors manage responses | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.scorecard_responses | View responses for accessible scorecards | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM call_scorecards cs   WHERE ((cs.id = scorecard_responses.scorecard_id) AND ((cs.agent_name = get_user_agent_name()) OR is_admin_or_supervisor()))))` |  |
| public.scorecard_templates | Admins manage templates | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.scorecard_templates | All authenticated read templates | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.security_alerts | Admins can delete security_alerts | DELETE | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.security_alerts | Admins can update security_alerts | UPDATE | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.security_alerts | Admins can view security_alerts | SELECT | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.security_alerts | Only admins can insert security_alerts | INSERT | PERMISSIVE | authenticated |  | `(get_user_role() = 'admin'::text)` |
| public.shift_swap_suggestions | Admin/Supervisor manage shift swaps | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.shift_templates | Admin/supervisor manage shift templates | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.shift_templates | Authenticated can view shift templates | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.skills | Admin/supervisor manage skills | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.skills | Authenticated view skills | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.sla_policies | Admin manage sla policies | ALL | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.sla_policies | Authenticated view sla policies | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.success_plan_milestones | Admin/supervisor manage milestones | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.success_plan_milestones | CSM manages milestones of own plans | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM success_plans sp   WHERE ((sp.id = success_plan_milestones.success_plan_id) AND (sp.owner_agent_name = get_user_agent_name()))))` | `(EXISTS ( SELECT 1    FROM success_plans sp   WHERE ((sp.id = success_plan_milestones.success_plan_id) AND (sp.owner_agent_name = get_user_agent_name()))))` |
| public.success_plan_milestones | Milestones follow plan visibility (select) | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM success_plans sp   WHERE ((sp.id = success_plan_milestones.success_plan_id) AND (is_admin_or_supervisor() OR (sp.owner_agent_name = get_user_agent_name()) OR (EXISTS ( SELECT 1            FROM accounts a           WHERE ((a.id = sp.account_id) AND (a.csm_agent_name = get_user_agent_name()))))))))` |  |
| public.success_plans | Admin/supervisor full access on success plans | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.success_plans | CSM manages own success plans | UPDATE | PERMISSIVE | authenticated | `(owner_agent_name = get_user_agent_name())` | `(owner_agent_name = get_user_agent_name())` |
| public.success_plans | CSM views success plans for their accounts | SELECT | PERMISSIVE | authenticated | `((owner_agent_name = get_user_agent_name()) OR (EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = success_plans.account_id) AND (a.csm_agent_name = get_user_agent_name())))))` |  |
| public.survey_responses | Admin/Supervisor insert survey_responses | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.survey_responses | Admin/supervisor or CSM insert survey responses | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR (account_id IS NULL) OR (EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = survey_responses.account_id) AND (a.csm_agent_name = get_user_agent_name())))))` |
| public.survey_responses | Admin/supervisor view all responses | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.survey_responses | CSM views responses for their accounts | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = survey_responses.account_id) AND (a.csm_agent_name = get_user_agent_name()))))` |  |
| public.surveys | Admin/supervisor manage surveys | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.surveys | All authenticated view active surveys | SELECT | PERMISSIVE | authenticated | `((is_active = true) OR is_admin_or_supervisor())` |  |
| public.system_settings | Admins can manage system settings | ALL | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.system_settings | Leitura de configurações para autenticados | SELECT | PERMISSIVE | public | `(auth.role() = 'authenticated'::text)` |  |
| public.time_off_requests | Admin/supervisor delete time off | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.time_off_requests | Admin/supervisor manage time off | UPDATE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.time_off_requests | Agents create own time off | INSERT | PERMISSIVE | authenticated |  | `((get_user_agent_name() = agent_name) OR is_admin_or_supervisor())` |
| public.time_off_requests | Agents view own time off | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |  |
| public.toll_free_numbers | Admins can manage toll_free | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.toll_free_numbers | Admins can view toll free numbers | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.topic_detections | Admins can manage topics | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.topic_detections | Only admins can insert topic detections | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.topic_detections | Scoped view topic detections | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.id = topic_detections.call_session_id) AND (cs.agent_name = get_user_agent_name())))))` |  |
| public.topic_trends | Admins can manage trends | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.topic_trends | Authenticated can view trends | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.tracker_matches | Agents view own matches | SELECT | PERMISSIVE | public | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |  |
| public.tracker_matches | Supervisors insert matches | INSERT | PERMISSIVE | public |  | `is_admin_or_supervisor()` |
| public.tracker_matches | Supervisors manage matches | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.trackers | All authenticated read trackers | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.trackers | Supervisors manage trackers | ALL | PERMISSIVE | public | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| public.user_allowed_ips | Admins can manage user_allowed_ips | ALL | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.user_allowed_ips | Users can view own allowed_ips | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_ip_restrictions | Admins can manage user_ip_restrictions | ALL | PERMISSIVE | authenticated | `(get_user_role() = 'admin'::text)` |  |
| public.user_ip_restrictions | Users can view own ip_restriction | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_mfa_settings | Admins can view all MFA settings | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.user_mfa_settings | Users can delete own MFA settings | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_mfa_settings | Users can insert their own MFA settings | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_mfa_settings | Users can update their own MFA settings | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_mfa_settings | Users can view their own MFA settings | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_passkeys | Users can delete their own passkeys | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_passkeys | Users can insert their own passkeys | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_passkeys | Users can update their own passkeys | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_passkeys | Users can view their own passkeys | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_profiles | Admins can insert profiles with any role | INSERT | PERMISSIVE | authenticated |  | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.user_profiles | Admins manage all profiles | ALL | PERMISSIVE | authenticated | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.user_profiles | Admins supervisors view all profiles | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.user_profiles | Admins update any profile | UPDATE | PERMISSIVE | authenticated | `is_admin_user(auth.uid())` | `is_admin_user(auth.uid())` |
| public.user_profiles | Users update own profile | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = id)` | `(auth.uid() = id)` |
| public.user_profiles | Users view own profile | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = id)` |  |
| public.user_roles | Admins can manage all roles | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.user_roles | Users can view their own roles | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.video_conferences | Admins can insert video conferences | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |
| public.video_conferences | Admins can manage video_conferences | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.video_conferences | Admins can view video conferences | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.video_conferences | Agents can view own conferences | SELECT | PERMISSIVE | authenticated | `((host_name = get_user_agent_name()) OR is_admin_or_supervisor())` |  |
| public.virtual_fax | Admins can manage fax | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.virtual_fax | Admins can view fax | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.virtual_fax | Authenticated users can create own fax records | INSERT | PERMISSIVE | authenticated |  | `(created_by = (( SELECT auth.uid() AS uid))::text)` |
| public.virtual_fax | Users can view own fax records | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (created_by = (( SELECT auth.uid() AS uid))::text))` |  |
| public.voice_prints | Admins view all voice prints | SELECT | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.voice_prints | Users manage their own voice prints | ALL | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.voicemail_messages | Admins can manage voicemail | ALL | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.voicemail_messages | Agents can view own voicemail | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.voicemail_messages | Agents or admins can insert voicemails | INSERT | PERMISSIVE | authenticated |  | `(is_admin_or_supervisor() OR is_active_agent(agent_name))` |
| public.voip_monitoring_settings | Admins can manage voip settings | ALL | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.voip_monitoring_settings | All authenticated can view voip settings | SELECT | PERMISSIVE | public | `(auth.role() = 'authenticated'::text)` |  |
| public.voip_quality_alerts | Admins delete voip alerts | DELETE | PERMISSIVE | public | `is_admin_or_supervisor()` |  |
| public.voip_quality_alerts | Users insert own voip alerts | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.voip_quality_alerts | Users update own voip alerts | UPDATE | PERMISSIVE | public | `((( SELECT auth.uid() AS uid) = user_id) OR is_admin_or_supervisor())` |  |
| public.voip_quality_alerts | Users view own voip alerts | SELECT | PERMISSIVE | public | `((( SELECT auth.uid() AS uid) = user_id) OR is_admin_or_supervisor())` |  |
| public.voip_recommendation_actions | admin supervisor select all rec actions | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.voip_recommendation_actions | users insert own rec actions | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.voip_recommendation_actions | users select own rec actions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.voip_trunk_health_checks | Admins read trunk health checks | SELECT | PERMISSIVE | public | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.voip_trunk_health_checks | Service role inserts health checks | INSERT | PERMISSIVE | public |  | `false` |
| public.voip_trunk_usage_metrics | Admins have full access to voip_trunk_usage_metrics | ALL | PERMISSIVE | authenticated | `is_admin()` |  |
| public.voip_trunk_usage_metrics | Admins/supervisors can view all usage metrics | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.voip_trunk_usage_metrics | Agents can view their own usage metrics | SELECT | PERMISSIVE | authenticated | `(agent_id = get_user_agent_id())` |  |
| public.voip_trunk_usage_metrics | No direct insert on usage metrics | INSERT | PERMISSIVE | authenticated |  | `false` |
| public.voip_trunks | Admins have full access to voip_trunks | ALL | PERMISSIVE | authenticated | `is_admin()` |  |
| public.voip_trunks | voip_trunks_admin_delete | DELETE | PERMISSIVE | authenticated | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.voip_trunks | voip_trunks_admin_insert | INSERT | PERMISSIVE | authenticated |  | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.voip_trunks | voip_trunks_admin_select | SELECT | PERMISSIVE | authenticated | `is_admin_user(( SELECT auth.uid() AS uid))` |  |
| public.voip_trunks | voip_trunks_admin_update | UPDATE | PERMISSIVE | authenticated | `is_admin_user(( SELECT auth.uid() AS uid))` | `is_admin_user(( SELECT auth.uid() AS uid))` |
| public.webauthn_challenges | Deny update webauthn_challenges | UPDATE | PERMISSIVE | authenticated |  | `false` |
| public.webauthn_challenges | Users can delete own challenges | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.webauthn_challenges | Users can delete own expired challenges | DELETE | PERMISSIVE | authenticated | `((expires_at < now()) AND ((user_id = ( SELECT auth.uid() AS uid)) OR is_admin_or_supervisor()))` |  |
| public.webauthn_challenges | Users can insert own challenges | INSERT | PERMISSIVE | authenticated |  | `((user_id IS NOT NULL) AND (( SELECT auth.uid() AS uid) = user_id))` |
| public.webauthn_challenges | Users can read own challenges | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.webhook_flush_metrics | admins_supervisors_read_flush_metrics | SELECT | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.webhook_flush_metrics | authenticated_insert_own_flush_metrics | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.webhook_secrets | Admins can manage webhook secrets | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM user_profiles   WHERE ((user_profiles.id = ( SELECT auth.uid() AS uid)) AND (user_profiles.role = 'admin'::text))))` |  |
| public.webhook_secrets | Apenas administradores podem gerenciar segredos | ALL | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM user_profiles   WHERE ((user_profiles.id = ( SELECT auth.uid() AS uid)) AND (user_profiles.role = 'admin'::text))))` |  |
| public.whisper_messages | Admins can delete whisper_messages | DELETE | PERMISSIVE | authenticated | `is_admin_or_supervisor()` |  |
| public.whisper_messages | Agents can update own whisper_messages | UPDATE | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.whisper_messages | Role-based view whisper_messages | SELECT | PERMISSIVE | authenticated | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |  |
| public.whisper_messages | Supervisors can insert whisper_messages | INSERT | PERMISSIVE | authenticated |  | `is_admin_or_supervisor()` |

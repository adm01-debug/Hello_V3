# 07 · REGRAS DE NEGÓCIO

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `3d12f4c263` · branch `main` · 2026-11-28 17:48 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## A. Regras escritas por humanos (`manual/` — prioridade máxima, nunca sobrescrito)

_Nenhum arquivo em `manual/`. Copie `manual/TEMPLATE-regras-de-negocio.md` para `manual/regras.md` e preencha._

## B. Quem pode ver/alterar o quê (RLS — conforme migrations do repo; schema real em `06`)

| Tabela | Política | Comando | Roles | Modo | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| `saved_filters` | Users can view own filters | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `saved_filters` | Users can insert own filters | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `saved_filters` | Users can update own filters | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `saved_filters` | Users can delete own filters | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `call_alerts` | Allow public read on call_alerts | SELECT | public | permissive | `true` |  |
| `call_alerts` | Allow public insert on call_alerts | INSERT | public | permissive |  | `true` |
| `call_alerts` | Allow public update on call_alerts | UPDATE | public | permissive | `true` |  |
| `agent_goals` | Allow public read on agent_goals | SELECT | public | permissive | `true` |  |
| `agent_goals` | Allow public insert on agent_goals | INSERT | public | permissive |  | `true` |
| `agent_goals` | Allow public update on agent_goals | UPDATE | public | permissive | `true` |  |
| `contacts` | Allow public read on contacts | SELECT | public | permissive | `true` |  |
| `contacts` | Allow public insert on contacts | INSERT | public | permissive |  | `true` |
| `contacts` | Allow public update on contacts | UPDATE | public | permissive | `true` |  |
| `contacts` | Allow public delete on contacts | DELETE | public | permissive | `true` |  |
| `contact_interactions` | Allow public read on contact_interactions | SELECT | public | permissive | `true` |  |
| `contact_interactions` | Allow public insert on contact_interactions | INSERT | public | permissive |  | `true` |
| `contact_interactions` | Allow public update on contact_interactions | UPDATE | public | permissive | `true` |  |
| `contact_alerts` | Allow public read on contact_alerts | SELECT | public | permissive | `true` |  |
| `contact_alerts` | Allow public insert on contact_alerts | INSERT | public | permissive |  | `true` |
| `contact_alerts` | Allow public update on contact_alerts | UPDATE | public | permissive | `true` |  |
| `contact_alerts` | Allow public delete on contact_alerts | DELETE | public | permissive | `true` |  |
| `agents` | Allow public read on agents | SELECT | public | permissive | `true` |  |
| `agents` | Allow public insert on agents | INSERT | public | permissive |  | `true` |
| `agents` | Allow public update on agents | UPDATE | public | permissive | `true` |  |
| `call_recordings` | Allow public read on call_recordings | SELECT | public | permissive | `true` |  |
| `call_recordings` | Allow public insert on call_recordings | INSERT | public | permissive |  | `true` |
| `call_recordings` | Allow public delete on call_recordings | DELETE | public | permissive | `true` |  |
| `hold_events` | Allow public read on hold_events | SELECT | public | permissive | `true` |  |
| `hold_events` | Allow public insert on hold_events | INSERT | public | permissive |  | `true` |
| `hold_events` | Allow public update on hold_events | UPDATE | public | permissive | `true` |  |
| `hold_alert_settings` | Allow public read on hold_alert_settings | SELECT | public | permissive | `true` |  |
| `hold_alert_settings` | Allow public update on hold_alert_settings | UPDATE | public | permissive | `true` |  |
| `hold_alert_settings` | Allow public insert on hold_alert_settings | INSERT | public | permissive |  | `true` |
| `whisper_messages` | Allow public insert on whisper_messages | INSERT | public | permissive |  | `true` |
| `whisper_messages` | Allow public read on whisper_messages | SELECT | public | permissive | `true` |  |
| `whisper_messages` | Allow public update on whisper_messages | UPDATE | public | permissive | `true` |  |
| `whisper_messages` | Allow public delete on whisper_messages | DELETE | public | permissive | `true` |  |
| `barge_in_sessions` | Allow public insert on barge_in_sessions | INSERT | public | permissive |  | `true` |
| `barge_in_sessions` | Allow public read on barge_in_sessions | SELECT | public | permissive | `true` |  |
| `barge_in_sessions` | Allow public update on barge_in_sessions | UPDATE | public | permissive | `true` |  |
| `barge_in_sessions` | Allow public delete on barge_in_sessions | DELETE | public | permissive | `true` |  |
| `scheduled_callbacks` | Allow public read on scheduled_callbacks | SELECT | public | permissive | `true` |  |
| `scheduled_callbacks` | Allow public insert on scheduled_callbacks | INSERT | public | permissive |  | `true` |
| `scheduled_callbacks` | Allow public update on scheduled_callbacks | UPDATE | public | permissive | `true` |  |
| `scheduled_callbacks` | Allow public delete on scheduled_callbacks | DELETE | public | permissive | `true` |  |
| `dialer_campaigns` | Allow public read on dialer_campaigns | SELECT | public | permissive | `true` |  |
| `dialer_campaigns` | Allow public insert on dialer_campaigns | INSERT | public | permissive |  | `true` |
| `dialer_campaigns` | Allow public update on dialer_campaigns | UPDATE | public | permissive | `true` |  |
| `dialer_campaigns` | Allow public delete on dialer_campaigns | DELETE | public | permissive | `true` |  |
| `dialer_queue` | Allow public read on dialer_queue | SELECT | public | permissive | `true` |  |
| `dialer_queue` | Allow public insert on dialer_queue | INSERT | public | permissive |  | `true` |
| `dialer_queue` | Allow public update on dialer_queue | UPDATE | public | permissive | `true` |  |
| `dialer_queue` | Allow public delete on dialer_queue | DELETE | public | permissive | `true` |  |
| `badges` | Allow public read on badges | SELECT | public | permissive | `true` |  |
| `badges` | Allow public insert on badges | INSERT | public | permissive |  | `true` |
| `agent_badges` | Allow public read on agent_badges | SELECT | public | permissive | `true` |  |
| `agent_badges` | Allow public insert on agent_badges | INSERT | public | permissive |  | `true` |
| `agent_badges` | Allow public delete on agent_badges | DELETE | public | permissive | `true` |  |
| `agent_weekly_stats` | Allow public read on agent_weekly_stats | SELECT | public | permissive | `true` |  |
| `agent_weekly_stats` | Allow public insert on agent_weekly_stats | INSERT | public | permissive |  | `true` |
| `agent_weekly_stats` | Allow public update on agent_weekly_stats | UPDATE | public | permissive | `true` |  |
| `coaching_recommendations` | Allow public read on coaching_recommendations | SELECT | public | permissive | `true` |  |
| `coaching_recommendations` | Allow public insert on coaching_recommendations | INSERT | public | permissive |  | `true` |
| `coaching_recommendations` | Allow public update on coaching_recommendations | UPDATE | public | permissive | `true` |  |
| `coaching_recommendations` | Allow public delete on coaching_recommendations | DELETE | public | permissive | `true` |  |
| `agents` | Admins can manage agents | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `badges` | Authenticated users can view badges | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `badges` | Admins can manage badges | ALL | public | permissive | `public.get_user_role() = 'admin'` |  |
| `agent_badges` | Authenticated users can view agent_badges | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `agent_badges` | Admins can manage agent_badges | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `agent_goals` | Authenticated users can view agent_goals | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `agent_goals` | Admins can manage agent_goals | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `agent_weekly_stats` | Admins can manage agent_weekly_stats | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `call_sessions` | Admins can delete call_sessions | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `call_recordings` | Admins can manage call_recordings | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `call_transcriptions` | Admins can manage call_transcriptions | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `call_analyses` | Admins can manage call_analyses | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `call_summaries` | Admins can manage call_summaries | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `call_alerts` | Admins can delete call_alerts | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `contacts` | Admins can delete contacts | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `contact_interactions` | Admins can manage contact_interactions | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `contact_alerts` | Admins can delete contact_alerts | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `whisper_messages` | Supervisors can insert whisper_messages | INSERT | public | permissive |  | `public.is_admin_or_supervisor()` |
| `whisper_messages` | Admins can delete whisper_messages | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `barge_in_sessions` | Supervisors can manage barge_in_sessions | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `hold_events` | Admins can delete hold_events | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `hold_alert_settings` | Authenticated users can view hold_alert_settings | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `hold_alert_settings` | Admins can manage hold_alert_settings | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `scheduled_callbacks` | Admins can delete scheduled_callbacks | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `dialer_campaigns` | Authenticated users can view dialer_campaigns | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `dialer_campaigns` | Supervisors can manage dialer_campaigns | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `dialer_queue` | Supervisors can manage dialer_queue | ALL | public | permissive | `public.is_admin_or_supervisor()` |  |
| `coaching_recommendations` | Supervisors can insert coaching_recommendations | INSERT | public | permissive |  | `public.is_admin_or_supervisor()` |
| `coaching_recommendations` | Supervisors can delete coaching_recommendations | DELETE | public | permissive | `public.is_admin_or_supervisor()` |  |
| `queue_metrics_settings` | Admins can manage queue_metrics_settings | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `queue_metrics_settings` | Authenticated users can view queue_metrics_settings | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `dashboard_goals` | Authenticated users can view dashboard_goals | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `dashboard_goals` | Supervisors can manage dashboard_goals | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `goal_violations` | Authenticated users can view goal_violations | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `goal_violations` | Supervisors can manage goal_violations | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `agents` | Agents can view own record, admins/supervisors view all | SELECT | public | permissive | `is_admin_or_supervisor() OR id = get_user_agent_id()` |  |
| `call_sessions` | Role-based update call_sessions | UPDATE | public | permissive | `is_admin_or_supervisor() OR agent_name = get_user_agent_name()` |  |
| `call_analyses` | Role-based view call_analyses | SELECT | public | permissive | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_user_agent_name() )` |  |
| `call_summaries` | Role-based view call_summaries | SELECT | public | permissive | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_user_agent_name() )` |  |
| `scheduled_callbacks` | Role-based update scheduled_callbacks | UPDATE | public | permissive | `is_admin_or_supervisor() OR assigned_agent = get_user_agent_name() OR created_by = get_user_agent_name()` |  |
| `dialer_queue` | Role-based view dialer_queue | SELECT | public | permissive | `is_admin_or_supervisor() OR assigned_agent = get_user_agent_name()` |  |
| `dialer_queue` | Role-based update dialer_queue | UPDATE | public | permissive | `is_admin_or_supervisor() OR assigned_agent = get_user_agent_name()` |  |
| `coaching_recommendations` | Role-based view coaching_recommendations | SELECT | public | permissive | `is_admin_or_supervisor() OR agent_id = get_user_agent_id()` |  |
| `coaching_recommendations` | Role-based update coaching_recommendations | UPDATE | public | permissive | `is_admin_or_supervisor() OR agent_id = get_user_agent_id()` |  |
| `agent_weekly_stats` | Role-based view agent_weekly_stats | SELECT | public | permissive | `is_admin_or_supervisor() OR agent_id = get_user_agent_id()` |  |
| `whisper_messages` | Role-based view whisper_messages | SELECT | public | permissive | `is_admin_or_supervisor() OR agent_name = get_user_agent_name()` |  |
| `contact_alerts` | Role-based view contact_alerts | SELECT | public | permissive | `is_admin_or_supervisor()` |  |
| `contact_alerts` | Role-based update contact_alerts | UPDATE | public | permissive | `is_admin_or_supervisor()` |  |
| `audit_logs` | Admins can view audit_logs | SELECT | public | permissive | `get_user_role() = 'admin'` |  |
| `contacts` | Role-based view contacts | SELECT | public | permissive | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.contact_interactions ci WHERE ci.contact_id = contacts.id AND ci.agent_name = get_user_agent_name() ) OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.contact_id = contacts.id AND cs.agent_name = get_user_agent_name() )` |  |
| `contacts` | Role-based update contacts | UPDATE | public | permissive | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.contact_interactions ci WHERE ci.contact_id = contacts.id AND ci.agent_name = get_user_agent_name() )` |  |
| `scheduled_callbacks` | Role-based view scheduled_callbacks | SELECT | public | permissive | `is_admin_or_supervisor() OR assigned_agent = get_user_agent_name()` |  |
| `call_analyses` | Validated insert call_analyses | INSERT | public | permissive |  | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_user_agent_name() )` |
| `call_summaries` | Validated insert call_summaries | INSERT | public | permissive |  | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_user_agent_name() )` |
| `call_recordings` | Validated insert call_recordings | INSERT | public | permissive |  | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_user_agent_name() )` |
| `contacts` | Supervisors can insert contacts | INSERT | public | permissive |  | `is_admin_or_supervisor()` |
| `scheduled_callbacks` | Supervisors can insert scheduled_callbacks | INSERT | public | permissive |  | `is_admin_or_supervisor()` |
| `security_alerts` | Admins can view security_alerts | SELECT | public | permissive | `get_user_role() = 'admin'` |  |
| `security_alerts` | Admins can update security_alerts | UPDATE | public | permissive | `get_user_role() = 'admin'` |  |
| `security_alerts` | Admins can delete security_alerts | DELETE | public | permissive | `get_user_role() = 'admin'` |  |
| `ip_whitelist` | Admins can manage ip_whitelist | ALL | public | permissive | `get_user_role() = 'admin'` |  |
| `user_ip_restrictions` | Admins can manage user_ip_restrictions | ALL | public | permissive | `get_user_role() = 'admin'` |  |
| `user_ip_restrictions` | Users can view own ip_restriction | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_allowed_ips` | Admins can manage user_allowed_ips | ALL | public | permissive | `get_user_role() = 'admin'` |  |
| `user_allowed_ips` | Users can view own allowed_ips | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `blocked_access_logs` | Admins can view blocked_access_logs | SELECT | public | permissive | `get_user_role() = 'admin'` |  |
| `user_roles` | Users can view their own roles | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_roles` | Admins can manage all roles | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `permissions` | Authenticated users can view permissions | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `permissions` | Admins can manage permissions | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `role_permissions` | Authenticated users can view role_permissions | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `role_permissions` | Admins can manage role_permissions | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `rate_limit_logs` | Admins can view rate_limit_logs | SELECT | public | permissive | `is_admin_or_supervisor()` |  |
| `rate_limit_settings` | Admins can manage rate_limit_settings | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_mfa_settings` | Users can view their own MFA settings | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_mfa_settings` | Users can update their own MFA settings | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `user_mfa_settings` | Users can insert their own MFA settings | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_mfa_settings` | Admins can view all MFA settings | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `active_sessions` | Users can manage their own sessions | ALL | public | permissive | `auth.uid() = user_id` |  |
| `active_sessions` | Admins can view all sessions | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `rate_limit_alerts` | Admins can view rate_limit_alerts | SELECT | public | permissive | `is_admin_or_supervisor()` |  |
| `rate_limit_alerts` | Admins can update rate_limit_alerts | UPDATE | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_passkeys` | Users can view their own passkeys | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_passkeys` | Users can insert their own passkeys | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_passkeys` | Users can update their own passkeys | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `user_passkeys` | Users can delete their own passkeys | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `password_reset_requests` | Admins can manage password_reset_requests | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `password_reset_requests` | Users can view own reset requests | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `dnc_list` | Authenticated can view dnc_list | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `dnc_list` | Supervisors can manage dnc_list | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `dnc_import_logs` | Supervisors can view dnc_import_logs | SELECT | public | permissive | `is_admin_or_supervisor()` |  |
| `dnc_import_logs` | Supervisors can insert dnc_import_logs | INSERT | public | permissive |  | `is_admin_or_supervisor()` |
| `calling_hours_config` | Authenticated can view calling_hours_config | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `calling_hours_config` | Admins can manage calling_hours_config | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `holidays` | Authenticated can view holidays | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `holidays` | Admins can manage holidays | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `consent_history` | Supervisors can view consent_history | SELECT | public | permissive | `is_admin_or_supervisor()` |  |
| `compliance_settings` | Authenticated can view compliance_settings | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `compliance_settings` | Admins can manage compliance_settings | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `login_attempts` | Admins can view login_attempts | SELECT | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `account_lockouts` | Admins can view account_lockouts | SELECT | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `password_reset_tokens` | Users can view own reset tokens | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `email_verification_tokens` | Users can view own verification tokens | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `webauthn_challenges` | Users can read own challenges | SELECT | authenticated | permissive | `user_id = auth.uid()` |  |
| `notifications` | Users can view own notifications | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `notifications` | Users can update own notifications | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `notifications` | Users can delete own notifications | DELETE | authenticated | permissive | `auth.uid() = user_id` |  |
| `notification_preferences` | Users can view own preferences | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `notification_preferences` | Users can insert own preferences | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `notification_preferences` | Users can update own preferences | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `call_flows` | Admins can manage call_flows | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `voicemail_messages` | Admins can manage voicemail | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `voicemail_messages` | Agents can view own voicemail | SELECT | public | permissive | `is_admin_or_supervisor() OR agent_name = get_user_agent_name()` |  |
| `topic_detections` | Admins can manage topics | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `manager_alerts` | Admins can manage manager_alerts | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `video_conferences` | Admins can manage video_conferences | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `hot_desking_stations` | Admins can manage stations | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `hot_desking_stations` | Authenticated can view stations | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `virtual_fax` | Admins can manage fax | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `number_porting_requests` | Admins can manage porting | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `toll_free_numbers` | Admins can manage toll_free | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `topic_trends` | Admins can manage trends | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `topic_trends` | Authenticated can view trends | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `agent_devices` | Admins can manage agent_devices | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `agent_devices` | Agents can view own devices | SELECT | public | permissive | `agent_name = get_user_agent_name()` |  |
| `agent_devices` | Agents can manage own devices | INSERT | public | permissive |  | `agent_name = get_user_agent_name()` |
| `agent_devices` | Agents can update own devices | UPDATE | public | permissive | `agent_name = get_user_agent_name()` |  |
| `agent_devices` | Agents can delete own devices | DELETE | public | permissive | `agent_name = get_user_agent_name()` |  |
| `agent_ring_settings` | Admins can manage ring_settings | ALL | public | permissive | `is_admin_or_supervisor()` |  |
| `agent_ring_settings` | Agents can view own ring_settings | SELECT | public | permissive | `agent_name = get_user_agent_name()` |  |
| `agent_ring_settings` | Agents can insert own ring_settings | INSERT | public | permissive |  | `agent_name = get_user_agent_name()` |
| `agent_ring_settings` | Agents can update own ring_settings | UPDATE | public | permissive | `agent_name = get_user_agent_name()` |  |
| `user_profiles` | Users view own profile | SELECT | authenticated | permissive | `auth.uid() = id` |  |
| `user_profiles` | Admins supervisors view all profiles | SELECT | authenticated | permissive | `public.is_admin_or_supervisor()` |  |
| `user_profiles` | Admins manage all profiles | ALL | authenticated | permissive | `public.is_admin_user(auth.uid())` |  |
| `contact_interactions` | Role-based view contact_interactions | SELECT | public | permissive | `is_admin_or_supervisor() OR (agent_name = get_user_agent_name() AND is_active_agent(agent_name))` |  |
| `call_transcriptions` | Role-based view call_transcriptions | SELECT | public | permissive | `is_admin_or_supervisor() OR (EXISTS ( SELECT 1 FROM call_sessions cs WHERE cs.id = call_transcriptions.call_session_id AND cs.agent_name = get_user_agent_name() ) AND is_active_agent(get_user_agent_name()))` |  |
| `call_transcriptions` | Validated insert call_transcriptions | INSERT | public | permissive |  | `is_admin_or_supervisor() OR (EXISTS ( SELECT 1 FROM call_sessions cs WHERE cs.id = call_transcriptions.call_session_id AND cs.agent_name = get_user_agent_name() ) AND is_active_agent(get_user_agent_name()))` |
| `storage.objects` | Authenticated admins can read call-recordings | SELECT | public | permissive | `bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND is_admin_or_supervisor()` |  |
| `storage.objects` | Authenticated admins can delete call-recordings | DELETE | public | permissive | `bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND is_admin_or_supervisor()` |  |
| `whisper_messages` | Agents can update own whisper_messages | UPDATE | public | permissive | `is_admin_or_supervisor() OR agent_name = get_user_agent_name()` |  |
| `number_porting_requests` | Admins can view porting requests | SELECT | public | permissive | `is_admin_or_supervisor()` |  |
| `ip_whitelist` | Admins can view ip_whitelist | SELECT | public | permissive | `get_user_role() = 'admin'` |  |
| `rate_limit_settings` | Admins can view rate_limit_settings | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `email_verification_tokens` | Users can delete own verification tokens | DELETE | public | permissive | `auth.uid() = user_id OR is_admin_user(auth.uid())` |  |
| `password_reset_tokens` | Users can delete own reset tokens | DELETE | public | permissive | `auth.uid() = user_id OR is_admin_user(auth.uid())` |  |
| `account_lockouts` | Deny direct insert account_lockouts | INSERT | public | permissive |  | `false` |
| `account_lockouts` | Deny direct update account_lockouts | UPDATE | public | permissive | `false` |  |
| `account_lockouts` | Deny direct delete account_lockouts | DELETE | public | permissive | `false` |  |
| `storage.objects` | Agents can read own call-recordings | SELECT | public | permissive | `bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND EXISTS ( SELECT 1 FROM public.call_recordings cr JOIN public.call_sessions cs ON cs.id = cr.call_session_id WHERE cr.file_path = name AND cs.agent_name = get_user_agent_name() )` |  |
| `audit_logs` | Deny direct insert audit_logs | INSERT | public | permissive |  | `false` |
| `consent_history` | Admins can insert consent_history | INSERT | public | permissive |  | `is_admin_or_supervisor()` |
| `hot_desking_stations` | Users can update own station or admins all | UPDATE | public | permissive | `is_admin_or_supervisor() OR current_user_name = (SELECT full_name FROM public.user_profiles WHERE id = auth.uid())` |  |
| `manager_alerts` | Admins can insert manager_alerts | INSERT | public | permissive |  | `is_admin_or_supervisor()` |
| `storage.objects` | Admins can update call-recordings | UPDATE | public | permissive | `bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND is_admin_or_supervisor()` |  |
| `password_reset_tokens` | Authenticated users can insert own reset tokens | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `email_verification_tokens` | Authenticated users can insert own verification tokens | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `notifications` | Users can insert own notifications | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `hold_events` | Admins or linked agents can insert hold events | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `hold_events` | Admins or linked agents can update hold events | UPDATE | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `rate_limit_alerts` | Only admins can insert rate limit alerts | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `rate_limit_logs` | Only admins can insert rate limit logs | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `blocked_access_logs` | Only admins can insert blocked access logs | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `geo_access_logs` | Only admins can insert geo access logs | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `voicemail_messages` | Agents or admins can insert voicemails | INSERT | authenticated | permissive |  | `is_admin_or_supervisor() OR is_active_agent(agent_name)` |
| `topic_detections` | Only admins can insert topic detections | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `password_reset_requests` | Users can request own password reset | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `geo_access_logs` | Admins can delete geo access logs | DELETE | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `login_attempts` | Block direct insert login_attempts | INSERT | authenticated | permissive |  | `false` |
| `login_attempts` | Block direct update login_attempts | UPDATE | authenticated | permissive | `false` |  |
| `login_attempts` | Block direct delete login_attempts | DELETE | authenticated | permissive | `false` |  |
| `webauthn_challenges` | Users can delete own expired challenges | DELETE | authenticated | permissive | `expires_at < now() AND (user_id = auth.uid() OR is_admin_or_supervisor())` |  |
| `audit_logs` | Block direct insert audit_logs | INSERT | authenticated | permissive |  | `false` |
| `audit_logs` | Block direct delete audit_logs | DELETE | authenticated | permissive | `false` |  |
| `virtual_fax` | Admins can view fax | SELECT | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `call_flows` | Admins can view call flows | SELECT | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `toll_free_numbers` | Admins can view toll free numbers | SELECT | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `topic_detections` | Scoped view topic detections | SELECT | authenticated | permissive | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_user_agent_name() )` |  |
| `call_sessions` | Agents can insert own call sessions | INSERT | authenticated | permissive |  | `is_admin_or_supervisor() OR is_active_agent(agent_name)` |
| `contact_interactions` | Agents can insert own interactions | INSERT | authenticated | permissive |  | `is_admin_or_supervisor() OR is_active_agent(agent_name)` |
| `video_conferences` | Admins can view video conferences | SELECT | authenticated | permissive | `is_admin_or_supervisor()` |  |
| `video_conferences` | Admins can insert video conferences | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `call_alerts` | Admins and supervisors can update call_alerts | UPDATE | authenticated | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `call_alerts` | Agents can mark own alerts as read | UPDATE | authenticated | permissive | `call_session_id IN ( SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name() )` | `call_session_id IN ( SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name() )` |
| `goal_violations` | Only admins and supervisors can insert goal_violations | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `hold_events` | Admins supervisors and own agent can view hold_events | SELECT | authenticated | permissive | `is_admin_or_supervisor() OR agent_name = get_user_agent_name()` |  |
| `contact_alerts` | Only admins and supervisors can insert contact_alerts | INSERT | authenticated | permissive |  | `is_admin_or_supervisor()` |
| `virtual_fax` | Authenticated users can create own fax records | INSERT | authenticated | permissive |  | `created_by = auth.uid()::text` |
| `call_alerts` | Scoped call_alerts SELECT | SELECT | authenticated | permissive | `is_admin_or_supervisor() OR call_session_id IN ( SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name() )` |  |
| `security_alerts` | Only admins can insert security_alerts | INSERT | authenticated | permissive |  | `get_user_role() = 'admin'` |
| `webauthn_challenges` | Users can insert own challenges | INSERT | authenticated | permissive |  | `user_id IS NOT NULL AND auth.uid() = user_id` |
| `user_profiles` | Admins can insert profiles with any role | INSERT | authenticated | permissive |  | `is_admin_user(auth.uid())` |
| `webauthn_challenges` | Users can delete own challenges | DELETE | authenticated | permissive | `user_id = auth.uid()` |  |
| `video_conferences` | Agents can view own conferences | SELECT | authenticated | permissive | `host_name = get_user_agent_name() OR is_admin_or_supervisor()` |  |
| `virtual_fax` | Users can view own fax records | SELECT | authenticated | permissive | `is_admin_or_supervisor() OR created_by = auth.uid()::text` |  |
| `login_attempts` | Deny direct insert login_attempts public | INSERT | public | permissive |  | `false` |
| `user_mfa_settings` | Users can delete own MFA settings | DELETE | authenticated | permissive | `auth.uid() = user_id` |  |
| `password_reset_tokens` | Deny update password_reset_tokens | UPDATE | authenticated | permissive |  | `false` |
| `email_verification_tokens` | Deny update email_verification_tokens | UPDATE | authenticated | permissive |  | `false` |
| `webauthn_challenges` | Deny update webauthn_challenges | UPDATE | authenticated | permissive |  | `false` |
| `call_key_moments` | View own or as supervisor key moments | SELECT | public | permissive | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_key_moments.call_session_id AND can_access_agent_data(cs.agent_name) )` |  |
| `battle_cards` | All authenticated view battle cards | SELECT | public | permissive | `auth.uid() IS NOT NULL AND is_active = true OR is_admin_or_supervisor()` |  |
| `battle_card_triggers` | All authenticated view triggers | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `call_transcripts_searchable` | View transcripts own or supervisor | SELECT | public | permissive | `is_admin_or_supervisor() OR can_access_agent_data(agent_name)` |  |
| `coaching_timestamps` | View coaching ts own or supervisor | SELECT | public | permissive | `is_admin_or_supervisor() OR can_access_agent_data(agent_name)` |  |
| `coaching_timestamps` | Admin/supervisor delete coaching ts | DELETE | public | permissive | `is_admin_or_supervisor()` |  |
| `live_sentiment_snapshots` | View sentiment snapshots | SELECT | public | permissive | `is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = live_sentiment_snapshots.call_session_id AND can_access_agent_data(cs.agent_name) )` |  |
| `deals` | Admins/supervisors manage all deals | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `deals` | Agents view own deals | SELECT | public | permissive | `owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()` |  |
| `deals` | Agents update own deals | UPDATE | public | permissive | `owner_agent_name = get_user_agent_name()` | `owner_agent_name = get_user_agent_name()` |
| `scorecard_templates` | All authenticated read templates | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `scorecard_templates` | Admins manage templates | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `scorecard_criteria` | All authenticated read criteria | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `scorecard_criteria` | Admins manage criteria | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `call_scorecards` | Agents view own scorecards | SELECT | public | permissive | `agent_name = get_user_agent_name() OR is_admin_or_supervisor()` |  |
| `call_scorecards` | Supervisors manage scorecards | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `scorecard_responses` | View responses for accessible scorecards | SELECT | public | permissive | `EXISTS (SELECT 1 FROM public.call_scorecards cs WHERE cs.id = scorecard_id AND (cs.agent_name = get_user_agent_name() OR is_admin_or_supervisor()))` |  |
| `scorecard_responses` | Supervisors manage responses | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `cadences` | All authenticated read cadences | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `cadences` | Supervisors manage cadences | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `cadence_steps` | All authenticated read cadence steps | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `cadence_steps` | Supervisors manage cadence steps | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `cadence_enrollments` | Agents view own enrollments | SELECT | public | permissive | `agent_name = get_user_agent_name() OR is_admin_or_supervisor()` |  |
| `cadence_enrollments` | Agents update own enrollments | UPDATE | public | permissive | `agent_name = get_user_agent_name() OR is_admin_or_supervisor()` | `agent_name = get_user_agent_name() OR is_admin_or_supervisor()` |
| `cadence_enrollments` | Supervisors manage enrollments | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `trackers` | All authenticated read trackers | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `trackers` | Supervisors manage trackers | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `tracker_matches` | Agents view own matches | SELECT | public | permissive | `agent_name = get_user_agent_name() OR is_admin_or_supervisor()` |  |
| `tracker_matches` | Supervisors manage matches | ALL | public | permissive | `is_admin_or_supervisor()` | `is_admin_or_supervisor()` |
| `call_playlists` | Owners update playlists | UPDATE | public | permissive | `owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()` | `owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()` |
| `call_playlists` | Owners delete playlists | DELETE | public | permissive | `owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()` |  |
| `playlist_items` | View items of accessible playlists | SELECT | public | permissive | `EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (is_admin_or_supervisor() OR p.owner_agent_name = get_user_agent_name() OR p.is_shared = true))` |  |
| `playlist_items` | Manage items of own playlists | ALL | public | permissive | `EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (p.owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()))` | `EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (p.owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor()))` |
| `deals` | Authenticated create deals | INSERT | public | permissive |  | `auth.uid() IS NOT NULL AND ( is_admin_or_supervisor() OR owner_agent_name IS NULL OR owner_agent_name = get_user_agent_name() )` |
| `cadence_enrollments` | Authenticated insert enrollments | INSERT | public | permissive |  | `auth.uid() IS NOT NULL AND (is_admin_or_supervisor() OR agent_name = get_user_agent_name())` |
| … +246 linhas — lista completa em `context.json` | | | | | | |

## C. Restrições de dados (obrigatório / único / default / CHECK / FK / calculada)

| Tabela | Coluna | Regra |
|---|---|---|
| `saved_filters` | `id` | PK; default gen_random_uuid() |
| `saved_filters` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `saved_filters` | `entity_type` | obrigatório |
| `saved_filters` | `name` | obrigatório |
| `saved_filters` | `filters` | default '{}'::jsonb |
| `saved_filters` | `is_default` | default false |
| `saved_filters` | `created_at` | default NOW() |
| `saved_filters` | `updated_at` | default NOW() |
| `saved_filters` | `(tabela)` | CONSTRAINT unique_filter_name_per_user_entity UNIQUE (user_id, entity_type, name) |
| `entity_versions` | `id` | PK; default gen_random_uuid() |
| `entity_versions` | `entity_type` | obrigatório |
| `entity_versions` | `entity_id` | obrigatório |
| `entity_versions` | `version_number` | obrigatório |
| `entity_versions` | `data` | default '{}'::jsonb |
| `entity_versions` | `changed_by` | FK → users.id |
| `entity_versions` | `changed_at` | default NOW() |
| `entity_versions` | `(tabela)` | CONSTRAINT unique_entity_version UNIQUE (entity_type, entity_id, version_number) |
| `schema_migrations` | `version` | PK |
| `schema_migrations` | `name` | obrigatório |
| `schema_migrations` | `applied_at` | default CURRENT_TIMESTAMP |
| `schema_migrations` | `applied_by` | default CURRENT_USER |
| `schema_migrations` | `success` | default TRUE |
| `schema_migrations` | `(tabela)` | checksum VARCHAR(64) |
| `migration_rollbacks` | `id` | PK |
| `migration_rollbacks` | `version` | obrigatório |
| `migration_rollbacks` | `rolled_back_at` | default CURRENT_TIMESTAMP |
| `migration_rollbacks` | `rolled_back_by` | default CURRENT_USER |
| `contacts` | `id` | PK; default gen_random_uuid() |
| `contacts` | `name` | obrigatório |
| `contacts` | `preferences` | default '{}' |
| `contacts` | `personality_insights` | default '{}' |
| `contacts` | `source` | default 'manual' |
| `contacts` | `created_at` | default now() |
| `contacts` | `updated_at` | default now() |
| `contacts` | `account_id` | FK → accounts.id ON DELETE SET NULL |
| `contacts` | `version` | default 1 |
| `call_records` | `id` | PK; default gen_random_uuid() |
| `call_records` | `contact_id` | FK → contacts.id ON DELETE SET NULL |
| `call_records` | `contact_name` | obrigatório |
| `call_records` | `contact_phone` | obrigatório |
| `call_records` | `type` | obrigatório; CHECK type IN ('incoming', 'outgoing', 'missed') |
| `call_records` | `status` | obrigatório; CHECK status IN ('completed', 'missed', 'voicemail', 'busy', 'no_answer') |
| `call_records` | `duration` | default 0 |
| `call_records` | `timestamp` | default NOW() |
| `queue_items` | `id` | PK; default gen_random_uuid() |
| `queue_items` | `contact_name` | obrigatório |
| `queue_items` | `contact_phone` | obrigatório |
| `queue_items` | `wait_time` | default 0 |
| `queue_items` | `priority` | default 0 |
| `queue_items` | `status` | default 'waiting'; CHECK status IN ('waiting', 'in_progress', 'completed', 'abandoned') |
| `queue_items` | `queue_type` | default 'general' |
| `queue_items` | `created_at` | default NOW() |
| `agents` | `id` | PK; default gen_random_uuid() |
| `agents` | `user_id` | único |
| `agents` | `name` | obrigatório |
| `agents` | `status` | default 'offline' |
| `agents` | `created_at` | default now() |
| `agents` | `updated_at` | default now() |
| `agents` | `extension` | obrigatório |
| `agents` | `version` | obrigatório |
| `call_sessions` | `id` | PK; default gen_random_uuid() |
| `call_sessions` | `agent_id` | FK → agents.id |
| `call_sessions` | `trunk_id` | FK → voip_trunks.id |
| `call_sessions` | `direction` | CHECK direction IN ('inbound', 'outbound') |
| `call_sessions` | `started_at` | default now() |
| `call_sessions` | `duration_seconds` | default 0 |
| `call_sessions` | `created_at` | default now() |
| `call_transcriptions` | `id` | PK; default gen_random_uuid() |
| `call_transcriptions` | `call_session_id` | obrigatório; FK → call_sessions.id ON DELETE CASCADE |
| `call_transcriptions` | `speaker` | obrigatório |
| `call_transcriptions` | `text` | obrigatório |
| `call_transcriptions` | `created_at` | default now() |
| `call_analyses` | `id` | PK; default gen_random_uuid() |
| `call_analyses` | `call_session_id` | obrigatório; FK → call_sessions.id ON DELETE CASCADE |
| `call_analyses` | `created_at` | default now() |
| `call_summaries` | `id` | PK; default gen_random_uuid() |
| `call_summaries` | `call_session_id` | obrigatório; FK → call_sessions.id ON DELETE CASCADE |
| `call_summaries` | `created_at` | default now() |
| `call_summaries` | `translated_summary` | default '{}'::jsonb |
| `call_alerts` | `id` | PK; default gen_random_uuid() |
| `call_alerts` | `call_session_id` | obrigatório; FK → call_sessions.id ON DELETE CASCADE |
| `call_alerts` | `alert_type` | obrigatório |
| `call_alerts` | `severity` | default 'warning' |
| `call_alerts` | `title` | obrigatório |
| `call_alerts` | `message` | obrigatório |
| `call_alerts` | `is_read` | default false |
| `call_alerts` | `created_at` | default now() |
| `agent_goals` | `id` | PK; default gen_random_uuid() |
| `agent_goals` | `agent_name` | obrigatório; único |
| `agent_goals` | `calls_target` | default 50 |
| `agent_goals` | `satisfaction_target` | default 8.0 |
| `agent_goals` | `performance_target` | default 8.0 |
| `agent_goals` | `created_at` | default now() |
| `agent_goals` | `updated_at` | default now() |
| `contact_interactions` | `id` | PK; default gen_random_uuid() |
| `contact_interactions` | `contact_id` | obrigatório; FK → contacts.id ON DELETE CASCADE |
| `contact_interactions` | `call_session_id` | FK → call_sessions.id ON DELETE SET NULL |
| `contact_interactions` | `interaction_type` | default 'call' |
| `contact_interactions` | `metadata` | default '{}' |
| `contact_interactions` | `created_at` | default now() |
| `contact_alerts` | `id` | PK; default gen_random_uuid() |
| `contact_alerts` | `contact_id` | obrigatório; FK → contacts.id ON DELETE CASCADE |
| `contact_alerts` | `alert_type` | obrigatório |
| `contact_alerts` | `severity` | default 'info' |
| `contact_alerts` | `title` | obrigatório |
| `contact_alerts` | `message` | obrigatório |
| `contact_alerts` | `trigger_data` | default '{}' |
| `contact_alerts` | `is_read` | default false |
| `contact_alerts` | `is_actioned` | default false |
| `contact_alerts` | `created_at` | default now() |
| `call_recordings` | `id` | PK; default gen_random_uuid() |
| `call_recordings` | `call_session_id` | FK → call_sessions.id ON DELETE SET NULL |
| `call_recordings` | `file_path` | obrigatório |
| `call_recordings` | `recorded_at` | default now() |
| `call_recordings` | `participant_count` | default 1 |
| `call_recordings` | `created_at` | default now() |
| `call_recordings` | `source` | default 'internal' |
| `hold_events` | `id` | PK; default gen_random_uuid() |
| `hold_events` | `call_session_id` | FK → call_sessions.id ON DELETE CASCADE |
| `hold_events` | `started_at` | obrigatório |
| `hold_events` | `created_at` | default now() |
| `hold_alert_settings` | `id` | PK; default gen_random_uuid() |
| `hold_alert_settings` | `warning_threshold_seconds` | default 60 |
| `hold_alert_settings` | `critical_threshold_seconds` | default 180 |
| `hold_alert_settings` | `enabled` | default true |
| `hold_alert_settings` | `notify_on_warning` | default true |
| `hold_alert_settings` | `notify_on_critical` | default true |
| `hold_alert_settings` | `created_at` | default now() |
| `hold_alert_settings` | `updated_at` | default now() |
| `whisper_messages` | `id` | PK; default gen_random_uuid() |
| `whisper_messages` | `call_session_id` | obrigatório; FK → call_sessions.id ON DELETE CASCADE |
| `whisper_messages` | `supervisor_name` | obrigatório |
| `whisper_messages` | `agent_name` | obrigatório |
| `whisper_messages` | `message` | obrigatório |
| `whisper_messages` | `is_read` | default false |
| `whisper_messages` | `created_at` | default now() |
| `barge_in_sessions` | `id` | PK; default gen_random_uuid() |
| `barge_in_sessions` | `call_session_id` | obrigatório; FK → call_sessions.id ON DELETE CASCADE |
| `barge_in_sessions` | `supervisor_name` | obrigatório |
| `barge_in_sessions` | `agent_name` | obrigatório |
| `barge_in_sessions` | `status` | default 'active' |
| `barge_in_sessions` | `started_at` | default now() |
| `barge_in_sessions` | `created_at` | default now() |
| `scheduled_callbacks` | `id` | PK; default gen_random_uuid() |
| `scheduled_callbacks` | `contact_id` | FK → contacts.id ON DELETE SET NULL |
| `scheduled_callbacks` | `caller_name` | obrigatório |
| `scheduled_callbacks` | `caller_phone` | obrigatório |
| `scheduled_callbacks` | `scheduled_at` | obrigatório |
| `scheduled_callbacks` | `status` | default 'pending' |
| `scheduled_callbacks` | `priority` | default 'normal' |
| `scheduled_callbacks` | `created_at` | default now() |
| `scheduled_callbacks` | `updated_at` | default now() |
| `dialer_campaigns` | `id` | PK; default gen_random_uuid() |
| `dialer_campaigns` | `name` | obrigatório |
| `dialer_campaigns` | `status` | default 'paused' |
| `dialer_campaigns` | `mode` | default 'predictive' |
| `dialer_campaigns` | `max_concurrent_calls` | default 3 |
| `dialer_campaigns` | `call_timeout_seconds` | default 30 |
| `dialer_campaigns` | `retry_attempts` | default 2 |
| `dialer_campaigns` | `retry_delay_minutes` | default 30 |
| `dialer_campaigns` | `working_hours_start` | default '08:00:00' |
| `dialer_campaigns` | `working_hours_end` | default '18:00:00' |
| `dialer_campaigns` | `total_contacts` | default 0 |
| `dialer_campaigns` | `completed_contacts` | default 0 |
| `dialer_campaigns` | `successful_contacts` | default 0 |
| `dialer_campaigns` | `created_at` | default now() |
| `dialer_campaigns` | `updated_at` | default now() |
| `dialer_campaigns` | `max_pace` | obrigatório |
| `dialer_campaigns` | `min_pace` | obrigatório |
| `dialer_queue` | `id` | PK; default gen_random_uuid() |
| `dialer_queue` | `campaign_id` | obrigatório; FK → dialer_campaigns.id ON DELETE CASCADE |
| `dialer_queue` | `contact_id` | FK → contacts.id ON DELETE SET NULL |
| `dialer_queue` | `phone` | obrigatório |
| `dialer_queue` | `priority` | default 0 |
| `dialer_queue` | `status` | default 'pending' |
| `dialer_queue` | `attempts` | default 0 |
| `dialer_queue` | `created_at` | default now() |
| `dialer_queue` | `updated_at` | default now() |
| `badges` | `id` | PK; default gen_random_uuid() |
| `badges` | `name` | obrigatório |
| `badges` | `description` | obrigatório |
| `badges` | `icon` | default 'trophy' |
| `badges` | `category` | default 'performance' |
| `badges` | `tier` | default 'bronze' |
| `badges` | `points` | default 10 |
| `badges` | `requirement_type` | obrigatório |
| `badges` | `requirement_value` | obrigatório |
| `badges` | `created_at` | default now() |
| `agent_badges` | `id` | PK; default gen_random_uuid() |
| `agent_badges` | `agent_id` | obrigatório; FK → agents.id ON DELETE CASCADE |
| `agent_badges` | `badge_id` | obrigatório; FK → badges.id ON DELETE CASCADE |
| `agent_badges` | `earned_at` | default now() |
| `agent_badges` | `(tabela)` | UNIQUE(agent_id, badge_id) |
| `agent_weekly_stats` | `id` | PK; default gen_random_uuid() |
| `agent_weekly_stats` | `agent_id` | obrigatório; FK → agents.id ON DELETE CASCADE |
| `agent_weekly_stats` | `week_start` | obrigatório |
| `agent_weekly_stats` | `total_calls` | default 0 |
| `agent_weekly_stats` | `total_duration_seconds` | default 0 |
| `agent_weekly_stats` | `avg_satisfaction` | default 0 |
| `agent_weekly_stats` | `avg_performance` | default 0 |
| `agent_weekly_stats` | `badges_earned` | default 0 |
| `agent_weekly_stats` | `points_earned` | default 0 |
| `agent_weekly_stats` | `created_at` | default now() |
| `agent_weekly_stats` | `updated_at` | default now() |
| `agent_weekly_stats` | `(tabela)` | UNIQUE(agent_id, week_start) |
| `coaching_recommendations` | `id` | PK; default gen_random_uuid() |
| `coaching_recommendations` | `agent_id` | obrigatório; FK → agents.id ON DELETE CASCADE |
| `coaching_recommendations` | `category` | obrigatório |
| `coaching_recommendations` | `priority` | default 'medium' |
| `coaching_recommendations` | `title` | obrigatório |
| `coaching_recommendations` | `description` | obrigatório |
| `coaching_recommendations` | `action_items` | default '{}' |
| `coaching_recommendations` | `metrics_snapshot` | default '{}' |
| `coaching_recommendations` | `status` | default 'pending' |
| `coaching_recommendations` | `created_at` | default now() |
| `user_profiles` | `id` | PK; FK → users.id ON DELETE CASCADE |
| `user_profiles` | `agent_id` | FK → agents.id |
| `user_profiles` | `created_at` | default now() |
| `user_profiles` | `voice_tts_enabled` | default true |
| `user_profiles` | `email` | obrigatório |
| `user_profiles` | `role` | obrigatório |
| `user_profiles` | `updated_at` | obrigatório |
| `user_profiles` | `(tabela)` | constraint user_profiles_ringtone_preset_check CHECK (ringtone_preset IS NULL OR (char_length(btrim(ringtone_preset)) BETWEEN 1 AND 32 AND ringtone_preset = btrim(ringtone_preset))) |
| `user_profiles` | `(tabela)` | constraint user_profiles_ringtone_volume_check CHECK (ringtone_volume IS NULL OR (ringtone_volume >= 0 AND ringtone_volume <= 1)) |
| `user_profiles` | `(tabela)` | constraint user_profiles_preferred_device_label_check CHECK ( preferred_device_label IS NULL OR ( char_length(preferred_device_label) BETWEEN 1 AND 60 AND preferred_device_label = btrim(preferred_device_label) ) ) |
| `user_profiles` | `(tabela)` | constraint user_profiles_role_check CHECK (role = ANY (ARRAY['agent'::text, 'supervisor'::text, 'admin'::text, 'viewer'::text])) |
| `queue_metrics_settings` | `id` | PK; default gen_random_uuid() |
| `queue_metrics_settings` | `enabled` | default true |
| `queue_metrics_settings` | `avg_wait_time_warning` | default 45 |
| `queue_metrics_settings` | `avg_wait_time_critical` | default 90 |
| `queue_metrics_settings` | `abandonment_rate_warning` | default 10 |
| `queue_metrics_settings` | `abandonment_rate_critical` | default 20 |
| `queue_metrics_settings` | `service_level_warning` | default 80 |
| `queue_metrics_settings` | `service_level_critical` | default 60 |
| `queue_metrics_settings` | `created_at` | default now() |
| `queue_metrics_settings` | `updated_at` | default now() |
| `queue_metrics_settings` | `check_interval_minutes` | obrigatório |
| `queue_metrics_settings` | `(tabela)` | check_interval_minutes INTEGER NOT NULL DEFAULT 5 |
| `dashboard_goals` | `id` | PK; default gen_random_uuid() |
| `dashboard_goals` | `name` | obrigatório |
| `dashboard_goals` | `metric_type` | obrigatório |
| `dashboard_goals` | `target_value` | obrigatório |
| `dashboard_goals` | `warning_threshold` | obrigatório |
| `dashboard_goals` | `critical_threshold` | obrigatório |
| `dashboard_goals` | `comparison_operator` | default 'gte' |
| `dashboard_goals` | `is_active` | default true |
| `dashboard_goals` | `notify_on_warning` | default true |
| `dashboard_goals` | `notify_on_critical` | default true |
| `dashboard_goals` | `created_at` | default now() |
| `dashboard_goals` | `updated_at` | default now() |
| `goal_violations` | `id` | PK; default gen_random_uuid() |
| `goal_violations` | `goal_id` | obrigatório; FK → dashboard_goals.id ON DELETE CASCADE |
| `goal_violations` | `goal_name` | obrigatório |
| `goal_violations` | `metric_type` | obrigatório |
| `goal_violations` | `target_value` | obrigatório |
| `goal_violations` | `actual_value` | obrigatório |
| `goal_violations` | `threshold_type` | default 'warning' |
| `goal_violations` | `created_at` | default now() |
| `audit_logs` | `id` | PK; default gen_random_uuid() |
| `audit_logs` | `user_id` | FK → users.id ON DELETE SET NULL |
| `audit_logs` | `action` | obrigatório |
| `audit_logs` | `resource_type` | obrigatório |
| `audit_logs` | `details` | default '{}'::jsonb |
| `audit_logs` | `created_at` | default now() |
| `security_alerts` | `id` | PK; default gen_random_uuid() |
| `security_alerts` | `alert_type` | obrigatório |
| `security_alerts` | `severity` | default 'warning' |
| `security_alerts` | `title` | obrigatório |
| `security_alerts` | `description` | obrigatório |
| `security_alerts` | `trigger_data` | default '{}'::jsonb |
| `security_alerts` | `is_resolved` | default false |
| `security_alerts` | `created_at` | default now() |
| `ip_whitelist` | `id` | PK; default gen_random_uuid() |
| `ip_whitelist` | `ip_address` | obrigatório |
| `ip_whitelist` | `is_cidr` | default false |
| `ip_whitelist` | `created_at` | default now() |
| `ip_whitelist` | `(tabela)` | UNIQUE(ip_address) |
| `user_ip_restrictions` | `id` | PK; default gen_random_uuid() |
| `user_ip_restrictions` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `user_ip_restrictions` | `enabled` | default false |
| `user_ip_restrictions` | `created_at` | default now() |
| `user_ip_restrictions` | `updated_at` | default now() |
| `user_ip_restrictions` | `(tabela)` | UNIQUE(user_id) |
| `user_allowed_ips` | `id` | PK; default gen_random_uuid() |
| `user_allowed_ips` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `user_allowed_ips` | `ip_address` | obrigatório |
| `user_allowed_ips` | `is_cidr` | default false |
| `user_allowed_ips` | `created_at` | default now() |
| `user_allowed_ips` | `(tabela)` | UNIQUE(user_id, ip_address) |
| `blocked_access_logs` | `id` | PK; default gen_random_uuid() |
| `blocked_access_logs` | `user_id` | FK → users.id ON DELETE SET NULL |
| `blocked_access_logs` | `ip_address` | obrigatório |
| `blocked_access_logs` | `reason` | obrigatório |
| `blocked_access_logs` | `created_at` | default now() |
| `user_roles` | `id` | PK; default gen_random_uuid() |
| `user_roles` | `user_id` | único; FK → users.id ON DELETE CASCADE |
| `user_roles` | `role` | default 'agent' |
| `user_roles` | `is_active` | default true |
| `user_roles` | `created_at` | default now() |
| `permissions` | `id` | PK; default gen_random_uuid() |
| … +1094 linhas — lista completa em `context.json` | | |

## D. Automações no banco (triggers e funções — regras que rodam sozinhas)

| Trigger | Quando | Tabela | Executa | Condição |
|---|---|---|---|---|
| trigger_saved_filters_updated_at | BEFORE UPDATE | `saved_filters` | `update_saved_filters_updated_at` |  |
| trigger_single_default_filter | BEFORE INSERT OR UPDATE OF IS_DEFAULT | `saved_filters` | `ensure_single_default_filter` | `NEW.is_default = true` |
| users_audit_trigger | AFTER INSERT OR UPDATE OR DELETE | `users` | `audit_trigger_func` |  |
| calls_audit_trigger | AFTER INSERT OR UPDATE OR DELETE | `calls` | `audit_trigger_func` |  |
| users_update_timestamp | BEFORE UPDATE | `users` | `update_timestamp` |  |
| contacts_update_timestamp | BEFORE UPDATE | `contacts` | `update_timestamp` |  |
| calls_update_timestamp | BEFORE UPDATE | `calls` | `update_timestamp` |  |
| users_email_validation | BEFORE INSERT OR UPDATE | `users` | `validate_email` |  |
| contacts_email_validation | BEFORE INSERT OR UPDATE | `contacts` | `validate_email` | `NEW.email IS NOT NULL` |
| contacts_phone_validation | BEFORE INSERT OR UPDATE | `contacts` | `validate_phone` | `NEW.phone IS NOT NULL` |
| prevent_active_call_deletion_trigger | BEFORE DELETE | `calls` | `prevent_active_call_deletion` |  |
| calculate_call_duration_trigger | BEFORE INSERT OR UPDATE | `calls` | `calculate_call_duration` |  |
| cascade_user_deletion_trigger | AFTER UPDATE | `users` | `cascade_user_deletion` | `NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL` |
| notify_critical_event_trigger | AFTER INSERT | `audit_logs` | `notify_critical_event` |  |
| update_agent_goals_updated_at | BEFORE UPDATE | `agent_goals` | `update_updated_at_column` |  |
| update_contacts_updated_at | BEFORE UPDATE | `contacts` | `update_updated_at_column` |  |
| update_agents_updated_at | BEFORE UPDATE | `agents` | `update_updated_at_column` |  |
| update_hold_alert_settings_updated_at | BEFORE UPDATE | `hold_alert_settings` | `update_updated_at_column` |  |
| update_scheduled_callbacks_updated_at | BEFORE UPDATE | `scheduled_callbacks` | `update_updated_at_column` |  |
| update_dialer_campaigns_updated_at | BEFORE UPDATE | `dialer_campaigns` | `update_updated_at_column` |  |
| update_dialer_queue_updated_at | BEFORE UPDATE | `dialer_queue` | `update_updated_at_column` |  |
| update_agent_weekly_stats_updated_at | BEFORE UPDATE | `agent_weekly_stats` | `update_updated_at_column` |  |
| on_auth_user_created | AFTER INSERT | `auth.users` | `handle_new_user` |  |
| update_user_profiles_updated_at | BEFORE UPDATE | `user_profiles` | `update_updated_at_column` |  |
| update_queue_metrics_settings_updated_at | BEFORE UPDATE | `queue_metrics_settings` | `update_updated_at_column` |  |
| update_dashboard_goals_updated_at | BEFORE UPDATE | `dashboard_goals` | `update_updated_at_column` |  |
| check_suspicious_activity_trigger | AFTER INSERT | `audit_logs` | `check_suspicious_activity` |  |
| update_user_ip_restrictions_updated_at | BEFORE UPDATE | `user_ip_restrictions` | `update_updated_at_column` |  |
| update_user_roles_updated_at | BEFORE UPDATE | `user_roles` | `update_security_updated_at` |  |
| update_user_mfa_settings_updated_at | BEFORE UPDATE | `user_mfa_settings` | `update_security_updated_at` |  |
| update_rate_limit_settings_updated_at | BEFORE UPDATE | `rate_limit_settings` | `update_security_updated_at` |  |
| update_account_lockouts_updated_at | BEFORE UPDATE | `account_lockouts` | `update_updated_at_column` |  |
| update_dnc_list_updated_at | BEFORE UPDATE | `dnc_list` | `update_updated_at_column` |  |
| update_calling_hours_updated_at | BEFORE UPDATE | `calling_hours_config` | `update_updated_at_column` |  |
| update_compliance_settings_updated_at | BEFORE UPDATE | `compliance_settings` | `update_updated_at_column` |  |
| update_notifications_updated_at | BEFORE UPDATE | `notifications` | `update_updated_at_column` |  |
| update_notification_preferences_updated_at | BEFORE UPDATE | `notification_preferences` | `update_updated_at_column` |  |
| prevent_role_escalation_trigger | BEFORE UPDATE | `user_profiles` | `prevent_role_escalation` |  |
| update_battle_cards_updated_at | BEFORE UPDATE | `battle_cards` | `update_updated_at_column` |  |
| trg_transcript_search_vector | BEFORE INSERT OR UPDATE OF FULL_TEXT | `call_transcripts_searchable` | `update_transcript_search_vector` |  |
| trg_deals_updated | BEFORE UPDATE | `deals` | `update_updated_at_column` |  |
| trg_scorecard_templates_updated | BEFORE UPDATE | `scorecard_templates` | `update_updated_at_column` |  |
| trg_call_scorecards_updated | BEFORE UPDATE | `call_scorecards` | `update_updated_at_column` |  |
| trg_cadences_updated | BEFORE UPDATE | `cadences` | `update_updated_at_column` |  |
| trg_enrollments_updated | BEFORE UPDATE | `cadence_enrollments` | `update_updated_at_column` |  |
| trg_trackers_updated | BEFORE UPDATE | `trackers` | `update_updated_at_column` |  |
| trg_playlists_updated | BEFORE UPDATE | `call_playlists` | `update_updated_at_column` |  |
| update_accounts_updated_at | BEFORE UPDATE | `accounts` | `update_updated_at_column` |  |
| update_renewals_updated_at | BEFORE UPDATE | `renewals` | `update_updated_at_column` |  |
| update_journey_stages_updated_at | BEFORE UPDATE | `customer_journey_stages` | `update_updated_at_column` |  |
| update_surveys_updated_at | BEFORE UPDATE | `surveys` | `update_updated_at_column` |  |
| update_success_plans_updated_at | BEFORE UPDATE | `success_plans` | `update_updated_at_column` |  |
| update_milestones_updated_at | BEFORE UPDATE | `success_plan_milestones` | `update_updated_at_column` |  |
| trg_shift_templates_updated | BEFORE UPDATE | `shift_templates` | `update_updated_at_column` |  |
| trg_agent_shifts_updated | BEFORE UPDATE | `agent_shifts` | `update_updated_at_column` |  |
| trg_time_off_updated | BEFORE UPDATE | `time_off_requests` | `update_updated_at_column` |  |
| trg_skills_updated | BEFORE UPDATE | `skills` | `update_updated_at_column` |  |
| trg_agent_skills_updated | BEFORE UPDATE | `agent_skills` | `update_updated_at_column` |  |
| trg_coaching_assignments_updated | BEFORE UPDATE | `coaching_assignments` | `update_updated_at_column` |  |
| trg_learning_modules_updated | BEFORE UPDATE | `learning_modules` | `update_updated_at_column` |  |
| update_conversations_updated_at | BEFORE UPDATE | `conversations` | `update_updated_at_column` |  |
| update_kb_categories_updated_at | BEFORE UPDATE | `kb_categories` | `update_updated_at_column` |  |
| kb_articles_search_vector_trigger | BEFORE INSERT OR UPDATE | `kb_articles` | `update_kb_article_search_vector` |  |
| update_routing_rules_updated_at | BEFORE UPDATE | `routing_rules` | `update_updated_at_column` |  |
| update_sla_policies_updated_at | BEFORE UPDATE | `sla_policies` | `update_updated_at_column` |  |
| trg_meeting_summaries_updated_at | BEFORE UPDATE | `meeting_summaries` | `update_updated_at_column` |  |
| trg_objection_library_updated_at | BEFORE UPDATE | `objection_library` | `update_updated_at_column` |  |
| trg_compliance_rules_updated_at | BEFORE UPDATE | `compliance_rules` | `update_updated_at_column` |  |
| trg_crm_field_suggestions_updated_at | BEFORE UPDATE | `crm_field_suggestions` | `update_updated_at_column` |  |
| update_voice_prints_updated_at | BEFORE UPDATE | `voice_prints` | `update_updated_at_column` |  |
| update_fraud_signals_updated_at | BEFORE UPDATE | `fraud_signals` | `update_updated_at_column` |  |
| update_consent_records_updated_at | BEFORE UPDATE | `consent_records` | `update_updated_at_column` |  |
| update_engagement_patterns_updated_at | BEFORE UPDATE | `contact_engagement_patterns` | `update_updated_at_column` |  |
| update_cultural_hints_updated_at | BEFORE UPDATE | `cultural_hints` | `update_updated_at_column` |  |
| update_call_quality_metrics_updated_at | BEFORE UPDATE | `call_quality_metrics` | `update_updated_at_column` |  |
| trg_bridge_voip_alert_to_notification | AFTER INSERT | `voip_quality_alerts` | `bridge_voip_alert_to_notification` |  |
| deals_optimistic_lock | BEFORE UPDATE | `deals` | `enforce_optimistic_lock` |  |
| contacts_optimistic_lock | BEFORE UPDATE | `contacts` | `enforce_optimistic_lock` |  |
| agents_optimistic_lock | BEFORE UPDATE | `agents` | `enforce_optimistic_lock` |  |
| cadences_optimistic_lock | BEFORE UPDATE | `cadences` | `enforce_optimistic_lock` |  |
| enforce_optimistic_lock_accounts | BEFORE UPDATE | `accounts` | `enforce_optimistic_lock` |  |
| enforce_optimistic_lock_success_plans | BEFORE UPDATE | `success_plans` | `enforce_optimistic_lock` |  |
| trg_notify_lock_conflict_hotspot | AFTER INSERT | `optimistic_lock_conflicts` | `notify_lock_conflict_hotspot` |  |
| trg_voip_trunks_updated_at | BEFORE UPDATE | `voip_trunks` | `update_updated_at_column` |  |
| trg_voip_trunks_optimistic_lock | BEFORE UPDATE | `voip_trunks` | `enforce_optimistic_lock` |  |
| trg_assignments_updated_at | BEFORE UPDATE | `agent_trunk_assignments` | `update_updated_at_column` |  |
| trg_assignments_optimistic_lock | BEFORE UPDATE | `agent_trunk_assignments` | `enforce_optimistic_lock` |  |
| trg_notify_trunk_offline | AFTER INSERT | `voip_trunk_health_checks` | `notify_trunk_offline` |  |
| update_crm_sync_queue_updated_at | BEFORE UPDATE | `crm_sync_queue` | `update_updated_at_column` |  |
| kb_article_history_trigger | AFTER INSERT OR UPDATE | `kb_articles` | `handle_kb_article_history` |  |
| audit_user_profiles_changes | AFTER INSERT OR UPDATE OR DELETE | `user_profiles` | `audit_table_change` |  |
| audit_user_roles_changes | AFTER INSERT OR UPDATE OR DELETE | `user_roles` | `audit_table_change` |  |
| audit_permissions_changes | AFTER INSERT OR UPDATE OR DELETE | `permissions` | `audit_table_change` |  |
| audit_contacts_trigger | AFTER INSERT OR UPDATE OR DELETE | `contacts` | `process_audit_log` |  |
| audit_agents_trigger | AFTER INSERT OR UPDATE OR DELETE | `agents` | `process_audit_log` |  |
| audit_call_recordings_delete | BEFORE DELETE | `call_recordings` | `log_critical_rls_event` |  |
| audit_voip_trunks_change | BEFORE INSERT OR UPDATE OR DELETE | `voip_trunks` | `log_critical_rls_event` |  |
| audit_user_profiles_change | BEFORE UPDATE | `user_profiles` | `log_critical_rls_event` |  |
| shift_swap_updated_at | BEFORE UPDATE | `shift_swap_suggestions` | `update_updated_at_column` |  |
| trg_notify_suspicious_index_drop_activity | AFTER INSERT | `index_drop_audit` | `notify_suspicious_index_drop_activity` |  |
| trg_webhook_failure_spike | AFTER INSERT | `webhook_flush_metrics` | `notify_webhook_failure_spike` |  |
| trg_interactions_recalc_deals | AFTER INSERT | `contact_interactions` | `trg_recalc_deals_on_interaction` |  |
| trg_auto_scorecard | AFTER INSERT | `call_summaries` | `trigger_auto_scorecard` |  |
| trg_audit_user_roles | AFTER INSERT OR UPDATE OR DELETE | `user_roles` | `audit_role_change` |  |
| trg_audit_role_permissions | AFTER INSERT OR UPDATE OR DELETE | `role_permissions` | `audit_role_change` |  |
| update_dialer_favorites_updated_at | BEFORE UPDATE | `dialer_favorites` | `update_updated_at_column` |  |
| trg_call_queues_updated_at | BEFORE UPDATE | `call_queues` | `update_updated_at_column` |  |
| trg_call_queue_members_updated_at | BEFORE UPDATE | `call_queue_members` | `update_updated_at_column` |  |
| trg_validate_call_queue | BEFORE INSERT OR UPDATE | `call_queues` | `validate_call_queue` |  |
| trg_validate_ring_group | BEFORE INSERT OR UPDATE | `ring_groups` | `validate_ring_group` |  |
| trg_ring_groups_updated_at | BEFORE UPDATE | `ring_groups` | `update_updated_at_column` |  |
| trg_ring_group_members_updated_at | BEFORE UPDATE | `ring_group_members` | `update_updated_at_column` |  |
| trg_queue_audio_prompts_updated_at | BEFORE UPDATE | `queue_audio_prompts` | `update_updated_at_column` |  |
| trg_validate_queue_audio_slots | BEFORE INSERT OR UPDATE | `call_queues` | `validate_queue_audio_slots` |  |
| trg_validate_park_orbit | BEFORE INSERT OR UPDATE | `call_park_orbits` | `validate_park_orbit` |  |
| trg_validate_parked_call | BEFORE INSERT OR UPDATE | `parked_calls` | `validate_parked_call` |  |
| trg_sync_profile_role | AFTER INSERT OR UPDATE OR DELETE | `user_roles` | `sync_profile_role_from_user_roles` |  |
| trg_hold_events_recalc_hold_time | AFTER UPDATE OF ENDED_AT | `hold_events` | `recalc_hold_time_from_events` | `NEW.ended_at IS DISTINCT FROM OLD.ended_at` |
| set_user_preferences_updated_at | BEFORE UPDATE | `user_preferences` | `update_updated_at_column` |  |
| trg_dnc_track_removal | BEFORE UPDATE | `dnc_list` | `dnc_track_removal` |  |

Erros lançados por funções SQL (`RAISE EXCEPTION` = regra de negócio no banco):

| Função | Mensagem | Origem |
|---|---|---|
| `rollback_migration` | Migration % not found | `supabase/migrations/20250101000000_versioning.sql` |
| `validate_email` | Invalid email format: % | `supabase/migrations/20250103000000_triggers.sql` |
| `validate_phone` | Invalid phone format: % | `supabase/migrations/20250103000000_triggers.sql` |
| `prevent_active_call_deletion` | Cannot delete active or ringing call | `supabase/migrations/20250103000000_triggers.sql` |
| `record_trunk_usage` | Authentication required | `supabase/migrations/20260418144103_3396eae6-b7f0-4fd0-8596-ee6276d550c1.sql` |
| `get_database_health_snapshot` | admin_only | `supabase/migrations/20260712110926_e4196a49-0eea-4932-a184-5aa2a5ac53e4.sql` |
| `get_top_slow_queries` | admin_only | `supabase/migrations/20260712110926_e4196a49-0eea-4932-a184-5aa2a5ac53e4.sql` |
| `log_index_drop_copy` | admin_only | `supabase/migrations/20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql` |
| `get_agent_financial_leaderboard` | authentication_required | `supabase/migrations/20260713123720_67f0e2ad-4146-47ff-8972-4597117ba0b5.sql` |
| `get_agent_financial_leaderboard` | admin_or_supervisor_only | `supabase/migrations/20260713123720_67f0e2ad-4146-47ff-8972-4597117ba0b5.sql` |
| `validate_call_queue` | overflow_queue_id é obrigatório quando overflow_action = transfer_queue | `supabase/migrations/20260726195450_0ffeebc4-7139-4dfa-8465-d41d8193ea38.sql` |
| `validate_call_queue` | A fila de transbordo não pode ser a própria fila | `supabase/migrations/20260726195450_0ffeebc4-7139-4dfa-8465-d41d8193ea38.sql` |
| `validate_ring_group` | forward_target_required | `supabase/migrations/20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql` |
| `validate_ring_group` | forward_queue_not_found | `supabase/migrations/20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql` |
| `validate_ring_group` | forward_target_self_reference | `supabase/migrations/20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql` |
| `validate_queue_audio_slots` | O audio selecionado para musica de espera nao e do tipo musica de espera | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | O audio de musica de espera selecionado esta desativado | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | O audio selecionado para saudacao nao e do tipo saudacao | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | O audio de saudacao selecionado esta desativado | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | O audio periodico deve ser de posicao, tempo de espera ou fora de horario | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | O audio periodico selecionado esta desativado | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | O audio selecionado para transbordo nao e do tipo transbordo | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | O audio de transbordo selecionado esta desativado | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_queue_audio_slots` | Ative a saudacao apenas apos selecionar um audio de saudacao | `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql` |
| `validate_park_orbit` | Destino obrigatório para a ação de tempo esgotado "%" | `supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql` |
| `validate_park_orbit` | A faixa de vagas %-% se sobrepõe a outra órbita ativa | `supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql` |
| `validate_parked_call` | Órbita de estacionamento inexistente | `supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql` |
| `validate_parked_call` | Não é possível estacionar em uma órbita desativada | `supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql` |
| `validate_parked_call` | Vaga % fora da faixa da órbita (%-%) | `supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql` |
| `enforce_optimistic_lock` | OPTIMISTIC_LOCK_CONFLICT | `supabase/migrations/20261122210000_optimistic_lock_audit_survives_rollback.sql` |
| `edge_function_url` | segredo edge_functions_base_url ausente no Vault | `supabase/migrations/20261126100000_edge_function_urls_from_vault.sql` |
| `get_cron_health` | apenas administradores podem consultar a saude do cron | `supabase/migrations/20261126170000_cron_watchdog.sql` |
| `increment_weekly_stats` | increment_weekly_stats: p_agent_id obrigatorio | `supabase/migrations/20261127260000_increment_weekly_stats_rpc_null_media_fix.sql` |
| `increment_weekly_stats` | increment_weekly_stats: p_week_start obrigatorio | `supabase/migrations/20261127260000_increment_weekly_stats_rpc_null_media_fix.sql` |
| `increment_weekly_stats` | increment_weekly_stats: incremento negativo nao e aceito | `supabase/migrations/20261127260000_increment_weekly_stats_rpc_null_media_fix.sql` |

## E. Estados, máquinas de estado e transições

### E.1 Colunas de status no banco

| Tabela | Coluna | Valores permitidos (enum/CHECK) | Default |
|---|---|---|---|
| `call_records` | `status` | `busy`, `completed`, `missed`, `no_answer`, `voicemail` |  |
| `queue_items` | `status` | `abandoned`, `completed`, `in_progress`, `waiting` | `waiting` |
| `agents` | `status` | **livre (sem enum/CHECK)** | `offline` |
| `call_sessions` | `status` | **livre (sem enum/CHECK)** |  |
| `barge_in_sessions` | `status` | **livre (sem enum/CHECK)** | `active` |
| `scheduled_callbacks` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `dialer_campaigns` | `status` | **livre (sem enum/CHECK)** | `paused` |
| `dialer_queue` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `coaching_recommendations` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `password_reset_requests` | `status` | `approved`, `completed`, `expired`, `pending`, `rejected` | `pending` |
| `dnc_import_logs` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `video_conferences` | `status` | **livre (sem enum/CHECK)** | `scheduled` |
| `virtual_fax` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `number_porting_requests` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `toll_free_numbers` | `status` | **livre (sem enum/CHECK)** | `active` |
| `deals` | `stage` | **livre (sem enum/CHECK)** | `prospecting` |
| `deals` | `status` | **livre (sem enum/CHECK)** | `open` |
| `call_scorecards` | `status` | **livre (sem enum/CHECK)** | `draft` |
| `cadence_steps` | `step_order` | **livre (sem enum/CHECK)** |  |
| `cadence_steps` | `step_type` | **livre (sem enum/CHECK)** |  |
| `cadence_enrollments` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `cadence_enrollments` | `status` | **livre (sem enum/CHECK)** | `active` |
| `accounts` | `current_stage` | `adoption`, `at_risk`, `expansion`, `growth` | `onboarding` |
| `accounts` | `status` | **livre (sem enum/CHECK)** | `active` |
| `renewals` | `status` | **livre (sem enum/CHECK)** | `open` |
| `customer_journey_stages` | `stage_key` | **livre (sem enum/CHECK)** |  |
| `customer_journey_stages` | `stage_name` | **livre (sem enum/CHECK)** |  |
| `account_journey_history` | `from_stage` | **livre (sem enum/CHECK)** |  |
| `account_journey_history` | `to_stage` | **livre (sem enum/CHECK)** |  |
| `success_plans` | `status` | **livre (sem enum/CHECK)** | `active` |
| `success_plan_milestones` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `agent_shifts` | `status` | `active`, `cancelled`, `completed`, `no_show`, `scheduled` | `scheduled` |
| `time_off_requests` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `coaching_assignments` | `status` | **livre (sem enum/CHECK)** | `open` |
| `conversations` | `status` | `closed`, `open`, `pending`, `resolved`, `snoozed` | `open` |
| `kb_articles` | `status` | `archived`, `draft`, `published` | `draft` |
| `meeting_summaries` | `status` | `completed`, `failed`, `generating`, `pending` | `completed` |
| `crm_field_suggestions` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `fraud_signals` | `status` | **livre (sem enum/CHECK)** | `open` |
| `redaction_log` | `status` | **livre (sem enum/CHECK)** | `completed` |
| `voip_trunks` | `last_health_status` | **livre (sem enum/CHECK)** | `unknown` |
| `crm_sync_queue` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `shift_swap_suggestions` | `status` | `approved`, `expired`, `pending`, `rejected` | `pending` |
| `data_lake_exports` | `status` | `completed`, `failed`, `pending`, `processing` | `pending` |
| `parked_calls` | `status` | `abandoned`, `expired`, `parked`, `retrieved` | `parked` |
| `cadence_step_runs` | `step_order` | **livre (sem enum/CHECK)** |  |
| `cadence_step_runs` | `step_type` | **livre (sem enum/CHECK)** |  |
| `cadence_step_runs` | `status` | `done`, `failed`, `skipped` |  |
| `migration_status` | `status` | **livre (sem enum/CHECK)** |  |

### E.2 Mapas de transição declarados no código

_nenhum mapa explícito encontrado — transições só existem implicitamente nos `if`s (veja E.3)_

### E.3 Valores de status usados no código (escreve / compara / filtra)

| Campo | Valor | Uso | Onde |
|---|---|---|---|
| `last_health_status` | `healthy` | compara, escreve, filtra | `src/components/admin/extensions/BulkAssignTrunkDialog.tsx`<br>`src/components/executive/VoipInfrastructureTab.tsx`<br>`supabase/functions/voip-trunks-healthcheck/index.ts` |
| `last_health_status` | `offline` | compara | `src/pages/admin/VoipTrunksAdmin.tsx`<br>`supabase/functions/sip-config/index.ts` |
| `status` | `CHANNEL_ERROR` | compara | `src/hooks/useHealthCheck.ts` |
| `status` | `CLOSED` | compara | `src/hooks/useHealthCheck.ts` |
| `status` | `SUBSCRIBED` | compara | `src/hooks/useHealthCheck.ts` |
| `status` | `TIMED_OUT` | compara | `src/hooks/useHealthCheck.ts` |
| `status` | `abandoned` | compara, filtra | `src/components/dashboard/RecentCalls.tsx`<br>`src/hooks/useQueueMetrics.ts`<br>`src/hooks/useSupervisorPanel.ts`<br>`src/pages/CallHistory.tsx`<br>`supabase/functions/check-goals/index.ts`<br>… +1 |
| `status` | `accepted` | escreve | `src/hooks/useCrmFieldSuggestions.ts` |
| `status` | `active` | compara, escreve, filtra | `src/components/agent/BargeInNotification.tsx`<br>`src/components/calls/ActiveCallBar.tsx`<br>`src/components/calls/SipConnectionStatus.tsx`<br>`src/components/calls/UnifiedSoftphone.tsx`<br>`src/components/calls/softphone/ActiveCallDisplay.tsx`<br>… +20 |
| `status` | `agent_high` | compara | `src/components/conversation-intelligence/TalkRatioChart.tsx` |
| `status` | `agent_low` | escreve | `src/hooks/useTalkRatio.ts`<br>`src/lib/talkRatio.ts` |
| `status` | `approved` | compara, escreve | `src/hooks/useScorecards.ts`<br>`src/hooks/useShiftSwapSuggestions.ts`<br>`src/hooks/useTimeOff.ts`<br>`src/pages/PasswordResetApproval.tsx`<br>`src/pages/Scheduling.tsx`<br>… +2 |
| `status` | `available` | compara, escreve, filtra | `src/components/admin/extensions/ExtensionStatusBadge.tsx`<br>`src/components/calls/UnifiedSoftphone.tsx`<br>`src/components/calls/softphone/HeaderDropdowns.tsx`<br>`src/components/dashboard/AgentsList.tsx`<br>`src/data/mockData.ts`<br>… +6 |
| `status` | `away` | compara, escreve | `src/components/admin/extensions/ExtensionStatusBadge.tsx`<br>`src/components/calls/UnifiedSoftphone.tsx`<br>`src/components/calls/softphone/HeaderDropdowns.tsx`<br>`src/data/mockData.ts`<br>`src/hooks/useQueueMetrics.ts`<br>… +1 |
| `status` | `beta` | escreve | `src/pages/Marketplace.tsx` |
| `status` | `break` | compara | `src/hooks/useQueueMetrics.ts` |
| `status` | `busy` | compara, escreve | `src/components/admin/extensions/ExtensionStatusBadge.tsx`<br>`src/components/calls/UnifiedSoftphone.tsx`<br>`src/components/calls/softphone/HeaderDropdowns.tsx`<br>`src/components/dashboard/AgentsList.tsx`<br>`src/data/mockData.ts`<br>… +3 |
| `status` | `calling` | compara, escreve | `src/components/calls/SipConnectionStatus.tsx`<br>`src/hooks/useSipCall.ts`<br>`src/hooks/useWavoipCall.ts` |
| `status` | `cancelled` | escreve | `src/hooks/useScheduledCallbacks.ts` |
| `status` | `checking` | compara, escreve | `src/components/network/NetworkStatusIndicator.tsx`<br>`src/components/observability/HealthTab.tsx`<br>`src/hooks/useHealthCheck.ts`<br>`src/hooks/useNetworkMonitor.ts` |
| `status` | `completed` | compara, escreve, filtra | `src/components/call-history/CallSessionsList.tsx`<br>`src/components/callbacks/ScheduledCallbacksList.tsx`<br>`src/components/coaching/CoachingAssignmentsPanel.tsx`<br>`src/components/coaching/CoachingPanel.tsx`<br>`src/components/dashboard/RecentCalls.tsx`<br>… +32 |
| `status` | `conference` | compara, escreve | `src/hooks/useMultiChannelCall.ts` |
| `status` | `connected` | escreve | `src/data/mockData.ts`<br>`src/hooks/useWavoipCall.ts` |
| `status` | `connecting` | compara, escreve | `src/components/calls/SipConnectionStatus.tsx`<br>`src/components/calls/softphone/ActiveCallDisplay.tsx`<br>`src/hooks/useMultiChannelCall.ts`<br>`src/hooks/useSipCall.ts`<br>`src/hooks/useWavoipCall.ts`<br>… +2 |
| `status` | `created` | escreve | `supabase/functions/auto-scorecard/index.ts` |
| `status` | `critical` | compara | `src/hooks/useQueueMetrics.ts`<br>`src/pages/QueueMetricsDashboard.tsx`<br>`supabase/functions/check-goals/index.ts` |
| `status` | `degraded` | compara | `src/components/dashboard/SystemIntegrityDashboard.tsx`<br>`src/components/executive/VoipInfrastructureTab.tsx`<br>`src/components/observability/HealthTab.tsx`<br>`src/pages/admin/SloDashboard.tsx`<br>`supabase/functions/health-check/index.ts` |
| `status` | `dialing` | compara | `src/components/dialer/PredictiveDialerPanel.tsx` |
| `status` | `disconnected` | compara, escreve | `src/components/calls/UnifiedSoftphone.tsx`<br>`src/hooks/useSipCall.ts`<br>`src/hooks/useWavoipCall.ts`<br>`src/lib/elevenlabs-stub.ts` |
| `status` | `disponivel` | escreve | `src/pages/Marketplace.tsx` |
| `status` | `down` | compara, escreve | `src/components/observability/HealthTab.tsx`<br>`src/hooks/useHealthCheck.ts` |
| `status` | `draft` | compara, escreve | `src/hooks/useKnowledgeBase.ts`<br>`src/hooks/useScorecards.ts`<br>`src/pages/Knowledge.tsx`<br>`src/pages/Scorecards.tsx`<br>`supabase/functions/score-call/index.ts` |
| `status` | `ended` | compara, escreve | `src/hooks/useCallTransfer.ts`<br>`src/hooks/useMultiChannelCall.ts`<br>`src/hooks/useSupervisorPanel.ts`<br>`src/pages/VideoConference.tsx`<br>`supabase/functions/wavoip-call/index.ts` |
| `status` | `error` | compara, escreve | `src/components/admin/ldap/LDAPLogsTab.tsx`<br>`src/components/calls/SipConnectionStatus.tsx`<br>`src/components/calls/UnifiedSoftphone.tsx`<br>`src/hooks/useSipCall.ts`<br>`src/hooks/useWavoipCall.ts`<br>… +1 |
| `status` | `exhausted` | compara | `src/pages/admin/SloDashboard.tsx`<br>`supabase/functions/health-check/index.ts` |
| `status` | `expired` | compara, escreve | `src/pages/PasswordResetApproval.tsx`<br>`src/pages/VerifyEmail.tsx`<br>`supabase/functions/approve-password-reset/index.ts` |
| `status` | `failed` | compara, escreve | `src/components/calls/MeetingSummaryCard.tsx`<br>`src/components/settings/BitrixSyncStatus.tsx`<br>`src/lib/bitrix/sync-log.ts`<br>`src/pages/VirtualFax.tsx`<br>`supabase/functions/compute-best-time/index.ts`<br>… +4 |
| `status` | `fulfilled` | compara | `supabase/functions/health-check/index.ts` |
| `status` | `future` | escreve | `src/components/callbacks/ScheduledCallbacksList.tsx` |
| `status` | `generating` | compara, escreve | `src/components/calls/MeetingSummaryCard.tsx`<br>`src/hooks/useMeetingSummary.ts`<br>`supabase/functions/generate-meeting-summary/index.ts` |
| `status` | `healthy` | compara, escreve | `src/components/executive/VoipInfrastructureTab.tsx`<br>`src/components/observability/HealthTab.tsx`<br>`src/hooks/useHealthCheck.ts`<br>`src/pages/admin/SloDashboard.tsx` |
| `status` | `implemented` | compara, escreve | `src/lib/security-report-data.ts`<br>`src/pages/SecurityReport.tsx` |
| `status` | `in_negotiation` | compara | `src/hooks/useRenewals.ts` |
| `status` | `in_progress` | compara, escreve | `src/components/coaching/CoachingPanel.tsx`<br>`src/components/settings/BitrixSyncStatus.tsx`<br>`src/hooks/useCoaching.ts`<br>`src/lib/bitrix/sync-log.ts` |
| `status` | `inactive` | compara, filtra | `src/components/admin/extensions/ExtensionStatusBadge.tsx`<br>`src/hooks/useExtensionsOverview.ts`<br>`supabase/functions/voip-capacity-recommendations/index.ts`<br>`supabase/migrations/20260403173646_6cd26a7c-d9a5-46fd-a088-d45d6a7899b8.sql` |
| `status` | `insufficient_data` | compara | `src/components/conversation-intelligence/TalkRatioChart.tsx` |
| `status` | `listening` | escreve | `src/hooks/useSupervisorPanel.ts` |
| `status` | `loading` | compara | `src/pages/VerifyEmail.tsx` |
| `status` | `missed` | compara, escreve | `src/components/dashboard/RecentCalls.tsx`<br>`src/data/mockData.ts`<br>`src/hooks/useQueueMetrics.ts`<br>`src/pages/CallHistory.tsx` |
| `status` | `no_matches` | compara | `src/hooks/useRedactionLog.ts` |
| `status` | `number` | compara | `src/lib/security-alerts-webhook-history.ts`<br>`supabase/functions/_shared/resilience.ts` |
| `status` | `offline` | compara, escreve | `src/components/admin/extensions/ExtensionStatusBadge.tsx`<br>`src/components/executive/VoipInfrastructureTab.tsx`<br>`src/components/network/NetworkStatusIndicator.tsx`<br>`src/hooks/useAgentStatus.ts`<br>`src/hooks/useExtensionsAdmin.ts`<br>… +4 |
| `status` | `ok` | compara, escreve | `src/components/queue/QueueGoalsTab.tsx`<br>`src/hooks/useQueueMetrics.ts`<br>`src/pages/QueueMetricsDashboard.tsx`<br>`supabase/functions/check-goals/index.ts`<br>`supabase/functions/data-lake-flush/index.ts` |
| `status` | `on-hold` | compara, escreve | `src/components/calls/softphone/ActiveCallDisplay.tsx`<br>`src/hooks/useCallTransfer.ts`<br>`src/hooks/useMultiChannelCall.ts` |
| `status` | `on_call` | compara | `src/hooks/useQueueMetrics.ts` |
| `status` | `on_hold` | compara | `src/hooks/useQueueMetrics.ts` |
| `status` | `online` | compara | `src/components/network/NetworkStatusIndicator.tsx`<br>`src/pages/NetworkDiagnostics.tsx` |
| `status` | `open` | compara, escreve, filtra | `src/components/executive/CustomerSuccessCard.tsx`<br>`src/components/executive/OmnichannelCard.tsx`<br>`src/hooks/useRenewals.ts`<br>`src/lib/security/penetration-test-reporter.ts`<br>`src/pages/Deals.tsx`<br>… +8 |
| `status` | `operational` | compara, escreve | `src/components/dashboard/SystemIntegrityDashboard.tsx`<br>`src/pages/admin/SloDashboard.tsx` |
| `status` | `optimal` | compara | `src/components/conversation-intelligence/TalkRatioChart.tsx` |
| `status` | `outage` | compara | `src/pages/admin/SloDashboard.tsx`<br>`supabase/functions/health-check/index.ts` |
| `status` | `overdue` | compara, escreve | `src/components/callbacks/ScheduledCallbacksList.tsx` |
| `status` | `parked` | compara, escreve, filtra | `src/components/park/ParkOrbitCard.tsx`<br>`src/hooks/useBlfBoard.ts`<br>`src/hooks/useCallPark.ts`<br>`src/lib/call-park.ts` |
| `status` | `partial` | compara | `src/components/admin/ldap/LDAPLogsTab.tsx`<br>`src/pages/SecurityReport.tsx` |
| `status` | `paused` | compara, escreve | `src/components/dialer/PredictiveDialerPanel.tsx`<br>`src/hooks/predictive-dialer/api.ts`<br>`src/pages/Cadences.tsx` |
| `status` | `pending` | compara, escreve, filtra | `src/components/callbacks/ScheduledCallbacksList.tsx`<br>`src/components/coaching/CoachingPanel.tsx`<br>`src/components/dialer/PredictiveDialerPanel.tsx`<br>`src/components/executive/OmnichannelCard.tsx`<br>`src/components/executive/PendingFollowupsCard.tsx`<br>… +21 |
| `status` | `processing` | compara, escreve | `src/hooks/useDataLakeExports.ts`<br>`src/lib/bitrix/sync-log.ts`<br>`supabase/functions/data-lake-flush/index.ts`<br>`supabase/functions/export-data-lake/index.ts`<br>`supabase/functions/sync-crm-queue/index.ts` |
| `status` | `published` | compara, filtra | `src/hooks/useKnowledgeBase.ts`<br>`src/pages/Knowledge.tsx`<br>`supabase/functions/chatbot-respond/index.ts` |
| `status` | `ready` | escreve | `supabase/functions/wavoip-call/index.ts` |
| `status` | `registered` | escreve | `src/hooks/useSipCall.ts` |
| `status` | `rejected` | compara, escreve | `src/hooks/useCrmFieldSuggestions.ts`<br>`src/pages/NumberPorting.tsx`<br>`src/pages/PasswordResetApproval.tsx`<br>`src/pages/Scheduling.tsx`<br>`src/pages/ShiftSwapSuggestions.tsx` |
| `status` | `resolved` | compara, escreve | `src/pages/Inbox.tsx`<br>`supabase/functions/enforce-sla/index.ts` |
| `status` | `retrieved` | escreve | `src/hooks/useCallPark.ts` |
| `status` | `ringing` | compara, escreve | `src/components/calls/ActiveCallBar.tsx`<br>`src/components/calls/SipConnectionStatus.tsx`<br>`src/components/calls/softphone/ActiveCallDisplay.tsx`<br>`src/components/dashboard/RecentCalls.tsx`<br>`src/data/mockData.ts`<br>… +4 |
| `status` | `scheduled` | compara, escreve | `src/pages/Scheduling.tsx`<br>`src/pages/VideoConference.tsx` |
| `status` | `sent` | compara | `src/pages/VirtualFax.tsx` |
| `status` | `skipped` | escreve | `src/hooks/predictive-dialer/api.ts`<br>`supabase/functions/auto-scorecard/index.ts` |
| `status` | `soon` | compara, escreve | `src/components/callbacks/ScheduledCallbacksList.tsx` |
| `status` | `submitted` | compara, escreve | `src/pages/Scorecards.tsx`<br>`supabase/functions/auto-scorecard/index.ts` |
| `status` | `success` | compara, escreve | `src/components/admin/ldap/LDAPLogsTab.tsx`<br>`src/components/admin/ldap/types.ts`<br>`src/components/settings/BitrixSyncStatus.tsx`<br>`src/lib/bitrix/sync-log.ts`<br>`src/pages/VerifyEmail.tsx`<br>… +2 |
| `status` | `system` | escreve | `supabase/functions/check-goals/index.ts` |
| `status` | `today` | escreve | `src/components/callbacks/ScheduledCallbacksList.tsx` |
| `status` | `tomorrow` | escreve | `src/components/callbacks/ScheduledCallbacksList.tsx` |
| `status` | `transferring` | compara, escreve | `src/hooks/useCallTransfer.ts`<br>`src/hooks/useMultiChannelCall.ts` |
| `status` | `unknown` | compara, escreve | `src/components/dashboard/SystemIntegrityDashboard.tsx`<br>`supabase/functions/health-check/index.ts`<br>`supabase/functions/health-check/slo-budget.ts` |
| `status` | `unstable` | compara | `src/components/network/NetworkStatusIndicator.tsx`<br>`src/pages/NetworkDiagnostics.tsx` |
| `status` | `verified` | compara, escreve | `src/components/auth/ReauthDialog.tsx`<br>`src/hooks/useMFA.ts`<br>`src/pages/TwoFactorAuth.tsx`<br>`src/pages/two-factor/DevicesCard.tsx` |
| `status` | `voicemail` | escreve | `src/data/mockData.ts` |
| `status` | `warning` | compara | `src/components/queue/QueueGoalsTab.tsx`<br>`src/hooks/useQueueMetrics.ts`<br>`src/pages/QueueMetricsDashboard.tsx`<br>`src/pages/admin/SloDashboard.tsx`<br>`supabase/functions/check-goals/index.ts` |
| `status` | `won` | compara | `src/hooks/useRenewals.ts` |
| `type` | `ADD_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `DISMISS_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `REMOVE_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `UPDATE_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `action` | escreve | `supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| `type` | `agent` | escreve | `src/hooks/useMultiChannelCall.ts` |
| `type` | `alert` | escreve | `supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| `type` | `announcement` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `array` | escreve | `supabase/functions/extract-crm-fields/index.ts`<br>`supabase/functions/generate-meeting-summary/index.ts` |
| `type` | `authentication` | escreve, filtra | `supabase/functions/webauthn-authenticate/index.ts`<br>`supabase/functions/webauthn-challenge/index.ts` |
| `type` | `avg_handle_time` | compara | `supabase/functions/check-goals/index.ts` |
| `type` | `avg_wait_time` | compara | `supabase/functions/check-goals/index.ts` |
| `type` | `away_too_long` | escreve | `supabase/functions/compute-adherence/index.ts` |
| `type` | `boolean` | escreve | `supabase/functions/chatbot-respond/index.ts`<br>`supabase/functions/generate-meeting-summary/index.ts` |
| `type` | `buying_signal` | compara | `src/components/contacts/ContactAlertsDropdown.tsx` |
| `type` | `candidate-pair` | compara | `src/hooks/useVoipQualityMonitor.ts` |
| `type` | `coaching` | escreve | `src/components/call-history/CallDetailDialog.tsx` |
| `type` | `critical` | compara | `src/hooks/useHoldSoundAlert.ts` |
| `type` | `digest` | escreve | `supabase/functions/process-digest/index.ts` |
| `type` | `email` | compara | `src/pages/VerifyEmail.tsx` |
| `type` | `error` | compara, escreve | `src/components/observability/ErrorsTab.tsx`<br>`src/lib/error-tracking.ts` |
| `type` | `event` | escreve | `src/lib/web-vitals.ts` |
| `type` | `first-input` | escreve | `src/lib/web-vitals.ts` |
| `type` | `function` | escreve | `supabase/functions/chatbot-respond/index.ts`<br>`supabase/functions/extract-crm-fields/index.ts`<br>`supabase/functions/generate-meeting-summary/index.ts` |
| `type` | `hangup` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `image` | escreve | `supabase/functions/whatsapp-inbound/schema_test.ts` |
| `type` | `image_url` | escreve | `supabase/functions/ocr-virtual-fax/index.ts` |
| `type` | `in1h` | compara, escreve | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `type` | `in3h` | compara | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `type` | `inbound` | escreve | `supabase/functions/analyze-call/analyze-call_test.ts` |
| `type` | `inbound-rtp` | compara | `src/hooks/useVoipQualityMonitor.ts` |
| `type` | `incoming` | compara, escreve | `src/components/ai/AICallAnalysis.tsx`<br>`src/components/calls/ActiveCallBar.tsx`<br>`src/data/mockData.ts` |
| `type` | `info` | escreve | `supabase/functions/generate-coaching-track/index.ts` |
| `type` | `json_object` | escreve | `supabase/functions/auto-scorecard/index.ts`<br>`supabase/functions/detect-key-moments/index.ts`<br>`supabase/functions/generate-coaching/index.ts`<br>`supabase/functions/translate-summary/index.ts` |
| `type` | `layout-shift` | escreve | `src/lib/web-vitals.ts` |
| `type` | `low_engagement` | compara | `src/components/contacts/ContactAlertsDropdown.tsx` |
| `type` | `magiclink` | escreve | `src/hooks/useWebAuthn.ts`<br>`supabase/functions/webauthn-authenticate/index.ts` |
| `type` | `menu` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `metric` | escreve | `supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| `type` | `moment` | compara, escreve | `src/components/call-history/CallDetailDialog.tsx`<br>`src/components/conversation-intelligence/CallPlayerWithTranscript.tsx` |
| `type` | `network-error` | escreve | `src/hooks/useContacts.ts` |
| `type` | `nextWeek` | compara | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `type` | `number` | escreve | `supabase/functions/chatbot-respond/index.ts`<br>`supabase/functions/extract-crm-fields/index.ts`<br>`supabase/functions/generate-meeting-summary/index.ts` |
| `type` | `object` | escreve | `supabase/functions/chatbot-respond/index.ts`<br>`supabase/functions/extract-crm-fields/index.ts`<br>`supabase/functions/generate-meeting-summary/index.ts` |
| `type` | `outbound` | escreve | `supabase/functions/analyze-call/analyze-call_test.ts` |
| `type` | `outgoing` | escreve | `src/data/mockData.ts` |
| `type` | `phone` | compara, escreve | `src/hooks/useMFA.ts`<br>`src/pages/TwoFactorAuth.tsx` |
| `type` | `positive` | escreve | `supabase/functions/detect-key-moments/index.ts` |
| `type` | `public-key` | escreve | `src/lib/webauthn/webauthn-utils.ts` |
| `type` | `queue` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `react-component` | escreve | `src/components/error-boundary/ErrorBoundary.tsx` |
| `type` | `recommendation` | escreve | `src/hooks/useVoipDiagnosticVoiceQA.ts`<br>`supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| `type` | `recovery` | escreve | `supabase/functions/approve-password-reset/index.ts` |
| `type` | `registration` | escreve | `src/hooks/useWebAuthn.ts` |
| `type` | `remote-inbound-rtp` | compara | `src/hooks/useVoipQualityMonitor.ts` |
| `type` | `ring_group` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `sentiment_negative` | compara | `src/components/contacts/ContactAlertsDropdown.tsx` |
| `type` | `signup` | escreve | `src/pages/VerifyEmail.tsx` |
| `type` | `sla_breach` | escreve | `supabase/functions/enforce-sla/index.ts` |
| `type` | `spring` | escreve | `src/components/voice/VoiceAssistantDialog.tsx`<br>`src/components/voice/overlay/VoiceOrb.tsx` |
| `type` | `start` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `string` | compara, escreve | `src/lib/queue-audio.ts`<br>`supabase/functions/chatbot-respond/index.ts`<br>`supabase/functions/detect-key-moments/index.ts`<br>`supabase/functions/extract-crm-fields/index.ts`<br>`supabase/functions/generate-meeting-summary/index.ts` |
| `type` | `success` | escreve | `src/hooks/useAgentRanking.ts` |
| `type` | `text` | escreve | `supabase/functions/ocr-virtual-fax/index.ts` |
| `type` | `time_check` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `tomorrow` | compara | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `type` | `totp` | compara, escreve | `src/components/auth/ReauthDialog.tsx`<br>`src/hooks/useMFA.ts`<br>`src/pages/TwoFactorAuth.tsx`<br>`src/pages/two-factor/DevicesCard.tsx` |
| `type` | `transfer` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `unhandled-rejection` | escreve | `src/lib/error-tracking.ts` |
| `type` | `vip_inactive` | compara | `src/components/contacts/ContactAlertsDropdown.tsx` |
| `type` | `voicemail` | escreve | `src/pages/CallFlowDesigner.tsx` |
| `type` | `warning` | compara, escreve | `src/hooks/useHoldSoundAlert.ts`<br>`supabase/functions/voip-failover-notifier/index.ts` |
| `type` | `websearch` | escreve | `src/hooks/useKnowledgeBase.ts`<br>`supabase/functions/chatbot-respond/index.ts` |
| `state` | `CLOSED` | escreve | `supabase/functions/_shared/resilience.ts` |
| `state` | `HALF_OPEN` | compara | `supabase/functions/_shared/resilience.ts` |
| `state` | `OPEN` | compara | `supabase/functions/_shared/resilience.ts` |
| `state` | `all` | compara | `src/lib/blf.ts`<br>`src/pages/BlfBoard.tsx` |
| `state` | `closed` | compara, escreve | `src/lib/bitrix/circuit-breaker.ts`<br>`src/lib/incoming-call-alert.ts` |
| `state` | `collapsed` | compara | `src/components/layout/AppSidebar.tsx`<br>`src/components/ui/sidebar.tsx` |
| `state` | `expanded` | escreve | `src/components/ui/sidebar.tsx` |
| `state` | `inactive` | compara | `src/hooks/useCallRecording.ts` |
| `state` | `ok` | escreve | `src/pages/admin/database-health/types.ts` |
| `state` | `open` | compara | `src/lib/bitrix/circuit-breaker.ts` |
| `state` | `parked` | escreve | `src/lib/blf.ts` |
| `state` | `recording` | compara | `src/components/calls/live-transcription/useLiveTranscription.ts`<br>`src/hooks/useVoiceCommand.ts` |
| `state` | `suspended` | compara | `src/hooks/useCriticalAlertNotifications.ts`<br>`src/hooks/useHoldSoundAlert.ts`<br>`src/lib/incoming-call-alert.ts` |
| `role` | `admin` | compara, filtra | `src/components/layout/AppLayout.tsx`<br>`src/components/layout/AppSidebar.tsx`<br>`src/hooks/useUnreadConflicts.ts`<br>`src/pages/Knowledge.tsx`<br>`src/pages/Permissions.tsx`<br>… +14 |
| `role` | `agent` | compara, escreve | `src/lib/talkRatio.ts`<br>`src/pages/roles/RoleStatsCards.tsx`<br>`supabase/functions/analyze-talk-ratio/index.ts` |
| `role` | `button` | escreve | `src/lib/a11y-clickable.ts` |
| `role` | `customer` | compara | `src/lib/talkRatio.ts`<br>`supabase/functions/analyze-talk-ratio/index.ts` |
| `role` | `string` | compara | `src/pages/roles/RoleAuditTrail.tsx`<br>`supabase/functions/_shared/auth.ts` |
| `role` | `supervisor` | compara | `src/components/layout/AppLayout.tsx`<br>`src/hooks/useUnreadConflicts.ts`<br>`src/pages/Knowledge.tsx`<br>`src/pages/roles/RoleStatsCards.tsx` |
| `role` | `system` | escreve | `supabase/functions/analyze-call/index.ts`<br>`supabase/functions/analyze-live-utterance/index.ts`<br>`supabase/functions/auto-scorecard/index.ts`<br>`supabase/functions/chatbot-respond/index.ts`<br>`supabase/functions/detect-key-moments/index.ts`<br>… +12 |
| `role` | `user` | compara, escreve | `src/components/calls/softphone/ActiveCallDisplay.tsx`<br>`src/hooks/useMultiChannelCall.ts`<br>`supabase/functions/analyze-call/index.ts`<br>`supabase/functions/analyze-contact-profile/index.ts`<br>`supabase/functions/analyze-live-utterance/index.ts`<br>… +18 |
| `role` | `viewer` | compara | `src/pages/roles/RoleStatsCards.tsx` |
| `phase` | `error` | compara | `src/components/voice/VoiceAssistantDialog.tsx` |
| `phase` | `idle` | compara | `src/components/voice/VoiceAssistantDialog.tsx` |
| `phase` | `listening` | compara | `src/components/voice/VoiceAssistantDialog.tsx` |
| `phase` | `processing` | compara | `src/components/voice/VoiceAssistantDialog.tsx` |
| `phase` | `speaking` | compara | `src/components/voice/VoiceAssistantDialog.tsx` |
| `relationship_status` | `vip` | compara | `src/hooks/useContactInsights.ts` |
| `stage` | `proposal` | escreve | `supabase/functions/global-load-test/index.ts` |
| `stage` | `prospecting` | escreve | `src/pages/Deals.tsx` |
| `tipo` | `abort` | compara | `supabase/functions/_shared/testing/backend-falso.ts` |
| `tipo` | `corpo-invalido` | compara | `supabase/functions/_shared/testing/backend-falso.ts` |
| `tipo` | `timeout` | compara | `supabase/functions/_shared/testing/backend-falso.ts` |

### E.4 Enums e listas de valores

| Nome | Valores | Onde |
|---|---|---|
| HealthFilter | all \| healthy \| warning \| critical | `src/components/admin/extensions/ExtensionsFilters.tsx` |
| SUPPORTED_TIMEZONES | 'America/Sao_Paulo', 'America/Fortaleza', 'America/Manaus', 'America/Cuiaba', 'America/Bogota', 'America/Buenos_Aires', 'America/Mexico_City', 'America/New_York', 'America/Los_Angeles', 'Europe/Lisbon', 'Europe/Madrid', 'UTC', | `src/components/compliance/calling-hours/types.ts` |
| DNC_REASONS | { value: 'manual', label: 'Adição Manual' }, { value: 'customer_request', label: 'Solicitação do Cliente' }, { value: 'complaint', label: 'Reclamação' }, { value: 'legal', label: 'Determinação Legal' }, { value: 'opt_out', label: 'Opt-out' }, { value: 'wrong_number', label: 'Número Incorreto' }, { v … | `src/components/compliance/dnc/constants.ts` |
| ContactSort | recent \| name-asc \| name-desc \| company | `src/components/contacts/contactFiltersState.ts` |
| ContactSourceFilter | all \| manual \| bitrix24 \| auto | `src/components/contacts/contactFiltersState.ts` |
| PAGE_SIZE_OPTIONS | 12, 24, 48, 96 | `src/components/contacts/pagination.ts` |
| DIAL_KEYS | '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#' | `src/components/dialer/phone/phone-utils.ts` |
| ExportFormat | csv \| pdf | `src/components/security-alerts/AlertsHeader.tsx` |
| ExportScope | all \| critical \| unread | `src/components/security-alerts/AlertsHeader.tsx` |
| Severity | critical \| warning \| info | `src/components/security-alerts/severity.ts` |
| VoiceAction | dial \| hangup \| mute \| unmute \| redial \| history \| none | `src/components/voice/voice-intent.ts` |
| VoicePhase | idle \| listening \| processing \| speaking \| error | `src/components/voice/overlay/usePhaseColors.ts` |
| UserRole | admin \| supervisor \| agent \| viewer | `src/contexts/AuthContext.tsx` |
| ReauthAction | change_password \| change_email \| configure_mfa \| admin_action \| delete_account \| export_data \| revoke_sessions | `src/contexts/ReauthContext.tsx` |
| ThemeMode | light \| dark | `src/contexts/ThemeContext.tsx` |
| ThemeSkin | default \| midnight \| ocean \| sunset \| forest | `src/contexts/ThemeContext.tsx` |
| AgentStatus | available \| busy \| away \| offline | `src/hooks/useAgentStatus.ts` |
| ExportScope | all \| critical \| unread | `src/hooks/useAlertsExport.ts` |
| ExportFormat | csv \| pdf | `src/hooks/useAlertsExport.ts` |
| DateRange | week \| month \| 3months \| all | `src/hooks/useCallAnalytics.ts` |
| DateRangePreset | all \| today \| week \| month \| custom | `src/hooks/useCallHistory.ts` |
| SentimentFilter | all \| positive \| neutral \| negative | `src/hooks/useCallHistory.ts` |
| DurationFilter | all \| short \| medium \| long | `src/hooks/useCallHistory.ts` |
| CLIENT_ERRORS_QUERY_KEY | 'client-errors' | `src/hooks/useClientErrors.ts` |
| ConsentChannel | voice \| sms \| whatsapp \| email | `src/hooks/useConsent.ts` |
| ConsentType | marketing \| transactional \| recording \| data_processing | `src/hooks/useConsent.ts` |
| ConversationChannel | voice \| whatsapp \| email \| chat \| sms | `src/hooks/useConversations.ts` |
| ConversationStatus | open \| pending \| resolved \| closed \| snoozed | `src/hooks/useConversations.ts` |
| ConversationPriority | low \| normal \| high \| urgent | `src/hooks/useConversations.ts` |
| WidgetId | stats \| active-calls \| call-volume \| queue-status \| callbacks \| supervisor \| recent-calls \| agents-list | `src/hooks/useDashboardLayout.ts` |
| ExportDataset | call_sessions \| call_summaries \| deals \| contacts \| audit_logs | `src/hooks/useDataLakeExports.ts` |
| ExportFormat | csv \| ndjson \| parquet | `src/hooks/useDataLakeExports.ts` |
| DEAL_PIPELINE_TREND_QUERY_KEY | 'deal-pipeline-trend' | `src/hooks/useDealPipelineTrend.ts` |
| DEAL_STAGES | { id: "prospecting", label: "Prospecção" }, { id: "qualification", label: "Qualificação" }, { id: "proposal", label: "Proposta" }, { id: "negotiation", label: "Negociação" }, { id: "closed_won", label: "Ganha" }, { id: "closed_lost", label: "Perdida" }, | `src/hooks/useDeals.ts` |
| PeriodType | today \| week \| month \| all | `src/hooks/useExecutiveDashboard.ts` |
| ExtensionBulkAction | bulk_assign_trunk \| bulk_force_offline \| bulk_export_csv | `src/hooks/useExtensionAudit.ts` |
| AgentStatus | available \| busy \| away \| offline \| inactive | `src/hooks/useExtensionsOverview.ts` |
| KbHistoryTone | create \| update \| status \| neutral | `src/hooks/useKbArticleHistory.ts` |
| KB_ARTICLE_HISTORY_QUERY_KEY | 'kb-article-history' | `src/hooks/useKbArticleHistory.ts` |
| MFAMethod | totp \| phone \| both | `src/hooks/useMFA.ts` |
| CallChannel | webrtc \| wavoip \| sip | `src/hooks/useMultiChannelCall.ts` |
| CallStatus | idle \| connecting \| ringing \| active \| on-hold \| ended \| conference \| transferring | `src/hooks/useMultiChannelCall.ts` |
| CallDirection | inbound \| outbound | `src/hooks/useMultiChannelCall.ts` |
| TransferType | blind \| attended | `src/hooks/useMultiChannelCall.ts` |
| NetworkStatus | online \| unstable \| offline \| checking | `src/hooks/useNetworkMonitor.ts` |
| ConflictPeriod | 24h \| 7d \| 30d | `src/hooks/useOptimisticLockConflicts.ts` |
| RedactionStatusTone | success \| neutral \| danger | `src/hooks/useRedactionLog.ts` |
| REDACTION_LOG_QUERY_KEY | 'redaction-log' | `src/hooks/useRedactionLog.ts` |
| SlaBreachKind | first_response \| resolution \| unknown | `src/hooks/useSLA.ts` |
| SipStatus | disconnected \| connecting \| registered \| calling \| ringing \| active \| error | `src/hooks/useSipCall.ts` |
| AnomalyKind | spike \| drift \| outage | `src/hooks/useVoipAnomalies.ts` |
| AnomalyMetric | mos \| jitter \| volume | `src/hooks/useVoipAnomalies.ts` |
| QAPeriod | day \| week \| month | `src/hooks/useVoipDiagnosticVoiceQA.ts` |
| NarrativePeriod | week \| month | `src/hooks/useVoipExecutiveNarrative.ts` |
| ExecutivePeriod | day \| week \| month | `src/hooks/useVoipExecutiveSummary.ts` |
| AlertsSummaryPeriod | day \| week \| month | `src/hooks/useVoipQualityAlertsSummary.ts` |
| QualityLabel | excellent \| good \| fair \| poor \| unknown | `src/hooks/useVoipQualityMonitor.ts` |
| RecommendationOutcome | applied \| snoozed \| dismissed \| auto_applied | `src/hooks/useVoipRecommendationActions.ts` |
| HistoryPeriod | day \| week \| month | `src/hooks/useVoipRecommendationHistory.ts` |
| HistoryOutcome | applied \| snoozed \| dismissed \| auto_applied | `src/hooks/useVoipRecommendationHistory.ts` |
| InsightsPeriod | week \| month | `src/hooks/useVoipRecommendationInsights.ts` |
| RecPeriod | day \| week | `src/hooks/useVoipRecommendations.ts` |
| RecSeverity | info \| warning \| critical | `src/hooks/useVoipRecommendations.ts` |
| RecCategory | capacity \| quality \| infra \| process | `src/hooks/useVoipRecommendations.ts` |
| RecActionType | link \| function \| acknowledge | `src/hooks/useVoipRecommendations.ts` |
| VoipProvider | nvoip \| directcall \| totalvoice \| generic \| wavoip | `src/hooks/useVoipTrunks.ts` |
| WavoipStatus | disconnected \| connecting \| connected \| calling \| active \| error | `src/hooks/useWavoipCall.ts` |
| WEBHOOK_SECRETS_QUERY_KEY | 'webhook-secrets' | `src/hooks/useWebhookSecrets.ts` |
| RewriteTone | profissional \| amigavel \| conciso \| empatico | `src/hooks/useWhatsappRewrite.ts` |
| UserRole | admin \| supervisor \| agent \| viewer | `src/hooks/auth/useAuthState.ts` |
| CallResult | answered \| no_answer \| busy \| voicemail \| wrong_number \| callback | `src/hooks/predictive-dialer/types.ts` |
| IntentType | objection \| technical_question \| discount_request \| buying_signal \| churn_risk \| compliance_violation \| sentiment_alert | `src/lib/agent-assist-utils.ts` |
| LAMP_STATES | 'talking', 'ringing', 'hold', 'parked', 'available', 'away', 'offline', | `src/lib/blf.ts` |
| PARK_TIMEOUT_ACTIONS | 'return_parker', 'ring_group', 'queue', 'extension', 'voicemail', 'hangup', | `src/lib/call-park.ts` |
| PARKED_CALL_STATUSES | 'parked', 'retrieved', 'expired', 'abandoned' | `src/lib/call-park.ts` |
| QUEUE_STRATEGIES | 'ringall', 'roundrobin', 'leastrecent', 'fewestcalls', 'skillbased', | `src/lib/call-queue.ts` |
| OVERFLOW_ACTIONS | 'voicemail', 'transfer_queue', 'callback', 'hangup', | `src/lib/call-queue.ts` |
| SupportedLang | pt \| en \| es \| fr \| it \| de \| ja \| zh | `src/lib/language-detection.ts` |
| Recommendation | block \| defer \| low_priority \| normal \| high_priority | `src/lib/outbound-scoring.ts` |
| EndedCallStatus | completed \| missed \| abandoned | `src/lib/pendingCallWrites.ts` |
| AUDIO_PROMPT_KINDS | 'moh', 'greeting', 'position', 'hold_time', 'overflow', 'off_hours', | `src/lib/queue-audio.ts` |
| ALLOWED_AUDIO_MIME_TYPES | 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/mp4', | `src/lib/queue-audio.ts` |
| RING_STRATEGIES | 'ringall', 'sequential', 'roundrobin', 'random' | `src/lib/ring-group.ts` |
| NO_ANSWER_ACTIONS | 'voicemail', 'forward_extension', 'forward_queue', 'hangup', | `src/lib/ring-group.ts` |
| SafeNumberRejectionReason | null_or_undefined \| empty_string \| not_a_number \| not_finite \| clamped_min \| clamped_max | `src/lib/safe-number.ts` |
| WebhookField | url \| secret \| maxAttempts \| baseDelayMs \| maxDelayMs | `src/lib/security-alerts-webhook-validation.ts` |
| TTS_RATE_STEPS | 0.75, 1, 1.25, 1.5 | `src/lib/voice-preferences.ts` |
| SortMode | volume \| trend \| ratio | `src/lib/webhook-health-utils.ts` |
| AuditAction | create \| read \| update \| delete \| login \| logout \| export \| import \| view \| search \| transfer \| hold \| unhold | `src/lib/audit/index.ts` |
| CircuitState | closed \| open \| half-open | `src/lib/bitrix/circuit-breaker.ts` |
| SyncAttemptStatus | in_progress \| success \| failed \| pending | `src/lib/bitrix/sync-log.ts` |
| MosLabel | poor \| fair \| good \| excellent \| unknown | `src/lib/metrics/mos.ts` |
| NotificationCategory | system \| call \| security \| coaching \| gamification | `src/lib/notifications/index.ts` |
| NotificationSeverity | info \| warning \| critical | `src/lib/notifications/index.ts` |
| Severity | critical \| high \| medium \| low \| info | `src/lib/security/penetration-test-reporter.ts` |
| MosLabel | poor \| fair \| good \| excellent \| unknown | `supabase/functions/_shared/mos.ts` |
| CircuitState | CLOSED \| OPEN \| HALF_OPEN | `supabase/functions/_shared/resilience.ts` |
| TalkRatioStatus | agent_low \| agent_high \| optimal \| insufficient_data | `supabase/functions/analyze-talk-ratio/index.ts` |
| BudgetStatus | healthy \| warning \| exhausted \| unknown | `supabase/functions/health-check/slo-budget.ts` |
| GeoMode | allowlist \| blocklist | `supabase/functions/validate-geo/decide.ts` |
| GeoVerdict | allowed \| blocked \| not_configured \| unknown_country \| invalid_mode | `supabase/functions/validate-geo/decide.ts` |
| AnomalyKind | spike \| drift \| outage | `supabase/functions/voip-anomaly-remediation/index.ts` |
| AnomalyMetric | mos \| jitter \| volume | `supabase/functions/voip-anomaly-remediation/index.ts` |
| RecommendationCategory | capacity \| quality \| infra \| process | `supabase/functions/voip-recommendations/index.ts` |
| RecommendationSeverity | info \| warning \| critical | `supabase/functions/voip-recommendations/index.ts` |
| RecommendationActionType | link \| function \| acknowledge | `supabase/functions/voip-recommendations/index.ts` |

## F. Validações de entrada

### F.1 Schemas Zod

- **timeSchema** (`src/components/compliance/calling-hours/types.ts`, z.string):
  ```ts
  
  ```
- **optionalTime** (`src/components/compliance/calling-hours/types.ts`, z.string, encadeia nullable, optional, refine, transform):
  ```ts
  
  ```
  - Regras cruzadas (refine): “Horário inválido (HH:mm)”
- **callingHoursSchema** (`src/components/compliance/calling-hours/types.ts`, z.object, encadeia superRefine):
  ```ts
  { region_code: z .string() .trim() .min(2, 'Código com mínimo 2 caracteres') .max(10, 'Código com máximo 10 caracteres') .regex(/^[A-Za-z0-9_-]+$/, 'Use apenas letras, números, _ ou -') .transform((v) => v.toUpperCase()), region_name: z.string().trim().min(2, 'Nome obrigatório').max(80), timezone: z.string().trim().min(3, 'Timezone obrigatório').max(64), weekday_start: timeSchema, weekday_end: timeSchema, saturday_start: optionalTime, saturday_end: optionalTime, sunday_allowed: z.boolean(), sunday_start: optionalTime, sunday_end: optionalTime, holidays_allowed: z.boolean(), is_active: z.boolean(), }
  ```
  - Regras cruzadas (refine): “Fim dos dias úteis deve ser após o início”
- **loginEmailSchema** (`src/lib/validation/auth.ts`, z.string):
  ```ts
  
  ```
- **passwordFieldSchema** (`src/lib/validation/auth.ts`, z.string):
  ```ts
  
  ```
- **resetPasswordSchema** (`src/lib/validation/auth.ts`, z.object, encadeia refine):
  ```ts
  { password: passwordFieldSchema, confirmPassword: z.string(), }
  ```
  - Regras cruzadas (refine): “As senhas não coincidem”
- **contactInputSchema** (`src/lib/validation/contact-schema.ts`, z.object):
  ```ts
  { name: z .string({ required_error: 'Nome é obrigatório' }) .trim() .min(1, 'Nome é obrigatório') .max(120, 'Nome deve ter no máximo 120 caracteres'), phone: z .string() .trim() .max(20, 'Telefone deve ter no máximo 20 caracteres') .optional() .or(z.literal('')) .transform((v) => (v && v.length > 0 ? v : undefined)) .refine( (v) => { if (!v) return true; // aceita E.164 ou BR normalizável if (isE164(v)) return true; return normalizeBrPhone(v) !== null || stripNonDigits(v).length >= 8; }, { message: 'Telefone inválido' } ), email: z .string() .trim() .max(254, 'Email muito longo') .email('Email inválido') .optional() .or(z.literal('')) .transform((v) => (v && v.length > 0 ? v.toLowerCase() : undefined)), company: optionalTrimmed(120), position: optionalTrimmed(120), notes: optionalTrimmed(2 …
  ```
  - Regras cruzadas (refine): “Telefone inválido”
- **uuidSchema** (`src/lib/validation/schemas.ts`, z.string):
  ```ts
  
  ```
- **emailSchema** (`src/lib/validation/schemas.ts`, z.string):
  ```ts
  
  ```
- **phoneSchema** (`src/lib/validation/schemas.ts`, z.string):
  ```ts
  
  ```
- **isoDateSchema** (`src/lib/validation/schemas.ts`, z.string):
  ```ts
  
  ```
- **userRoleSchema** (`src/lib/validation/schemas.ts`, z.enum):
  ```ts
  ['admin', 'supervisor', 'agent', 'viewer']
  ```
- **userProfileSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, email: z.string(), full_name: z.string().nullable(), role: userRoleSchema, agent_id: z.string().nullable(), }
  ```
- **agentStatusSchema** (`src/lib/validation/schemas.ts`, z.enum):
  ```ts
  ['available', 'busy', 'break', 'offline', 'inactive']
  ```
- **agentSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, name: z.string().min(1), status: z.string(), extension: z.string(), email: z.string().nullable(), avatar_url: z.string().nullable(), department: z.string().nullable(), created_at: z.string(), updated_at: z.string(), }
  ```
- **contactSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, name: z.string().min(1), phone: z.string().nullable(), email: z.string().nullable(), company: z.string().nullable(), position: z.string().nullable(), notes: z.string().nullable(), tags: z.array(z.string()).nullable(), external_id: z.string().nullable(), source: z.string().nullable(), preferences: z.record(z.unknown()).nullable(), personality_insights: z.record(z.unknown()).nullable(), created_at: z.string(), updated_at: z.string(), }
  ```
- **createContactSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { name: z.string().min(1, 'Nome é obrigatório').max(255), phone: z.string().min(8).max(20).optional(), email: z.string().email('Email inválido').optional().or(z.literal('')), company: z.string().max(255).optional(), position: z.string().max(255).optional(), notes: z.string().max(2000).optional(), tags: z.array(z.string()).optional(), external_id: z.string().optional(), source: z.string().optional(), }
  ```
- **callSessionSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, caller_name: z.string().nullable(), caller_phone: z.string().nullable(), agent_name: z.string().nullable(), contact_id: z.string().nullable(), status: z.string().nullable(), duration_seconds: z.number().nullable(), hold_count: z.number().nullable(), hold_time_seconds: z.number().nullable(), started_at: z.string(), ended_at: z.string().nullable(), created_at: z.string(), }
  ```
- **callSummarySchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, call_session_id: uuidSchema, summary: z.string().nullable(), main_topics: z.array(z.string()).nullable(), next_steps: z.array(z.string()).nullable(), overall_sentiment: z.string().nullable(), customer_satisfaction: z.number().nullable(), agent_performance_score: z.number().nullable(), created_at: z.string(), }
  ```
- **scheduledCallbackSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, contact_id: z.string().nullable(), caller_name: z.string(), caller_phone: z.string(), scheduled_at: z.string(), notes: z.string().nullable(), status: z.string(), priority: z.string(), assigned_agent: z.string().nullable(), created_by: z.string().nullable(), completed_at: z.string().nullable(), created_at: z.string(), updated_at: z.string(), }
  ```
- **createCallbackSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { caller_name: z.string().min(1, 'Nome é obrigatório'), caller_phone: z.string().min(8, 'Telefone inválido'), scheduled_at: z.string().min(1, 'Data é obrigatória'), contact_id: z.string().nullable().optional(), notes: z.string().max(2000).optional(), priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(), assigned_agent: z.string().optional(), created_by: z.string().optional(), }
  ```
- **holdEventSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, call_session_id: z.string().nullable(), agent_name: z.string().nullable(), started_at: z.string(), ended_at: z.string().nullable(), duration_seconds: z.number().nullable(), created_at: z.string(), }
  ```
- **dashboardStatsSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { totalCallsToday: z.number(), totalCallsChange: z.number(), avgCallDuration: z.number(), durationChange: z.number(), answeredRate: z.number(), rateChange: z.number(), activeAgents: z.number(), totalAgents: z.number(), }
  ```
- **callAlertSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { id: uuidSchema, call_session_id: uuidSchema, alert_type: z.string(), severity: z.string(), title: z.string(), message: z.string(), is_read: z.boolean(), created_at: z.string(), }
  ```
- **loginFormSchema** (`src/lib/validation/schemas.ts`, z.object):
  ```ts
  { email: z.string().email('Email inválido'), password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'), }
  ```
- **registerFormSchema** (`src/lib/validation/schemas.ts`, z.object, encadeia refine):
  ```ts
  { fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100), email: z.string().email('Email inválido'), password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'), confirmPassword: z.string(), }
  ```
  - Regras cruzadas (refine): “Senhas não conferem”
- **voipProviderSchema** (`src/lib/validation/voip-trunk.ts`, z.enum):
  ```ts
  ['nvoip', 'directcall', 'totalvoice', 'generic', 'wavoip']
  ```
- **voipTrunkSchema** (`src/lib/validation/voip-trunk.ts`, z.object):
  ```ts
  { name: z.string().trim().min(1, 'Nome obrigatório').max(100), provider: voipProviderSchema, sip_server: z.string().trim().min(1, 'Servidor obrigatório').max(255), sip_username: z.string().trim().min(1, 'Usuário obrigatório').max(100), sip_password: z.string().min(0).max(255).optional(), sip_realm: z.string().max(255).optional(), transport: z.enum(['wss', 'tcp', 'udp']), max_channels: z.coerce.number().min(1).max(1000), priority: z.coerce.number().min(0).max(9999), is_active: z.boolean(), notes: z.string().max(500).optional(), }
  ```
- **id** (`supabase/functions/_shared/ai-body-schemas.ts`, z.string):
  ```ts
  
  ```
- **requiredId** (`supabase/functions/_shared/ai-body-schemas.ts`, z.string):
  ```ts
  
  ```
- **lang** (`supabase/functions/_shared/ai-body-schemas.ts`, z.string):
  ```ts
  
  ```
- **ScoreCallBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { callSessionId: requiredId, templateId: requiredId, }
  ```
- **GenerateSummaryBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { callInfo: z .object({ transcripts: z .array( z.object({ speaker: z.string().max(50), text: z.string().max(PROMPT_TEXT_MAX), }), ) .max(200) .optional(), callerName: z.string().max(200).optional(), duration: z.number().min(0).max(86_400).optional(), }) .optional(), }
  ```
- **GenerateCoachingBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { agentId: requiredId, }
  ```
- **GenerateCoachingPlanBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { agent_name: id.optional(), }
  ```
- **GenerateMeetingSummaryBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { callSessionId: id.optional(), force: z.boolean().optional(), }
  ```
- **TranslateSummaryBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { callSessionId: id.optional(), targetLang: lang.optional(), }
  ```
- **TranslateUtteranceBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { callSessionId: id.optional(), text: z.string().max(UTTERANCE_TEXT_MAX).optional(), speaker: z.enum(["agent", "customer"]).optional(), sourceLang: lang.optional(), targetLang: lang.optional(), segmentId: id.optional(), }
  ```
- **VoiceCommandBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { audio: z.string().max(VOICE_COMMAND_TEXT_MAX).optional(), }
  ```
- **VerifyVoiceBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { embedding: z.array(z.unknown()).max(1024).optional(), callSessionId: id.optional(), label: z.string().max(50).optional(), }
  ```
- **TranscribeRecordingBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { recordingId: id.optional(), filePath: z.string().max(STORAGE_PATH_MAX).optional(), }
  ```
- **OcrVirtualFaxBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { fax_id: id.optional(), }
  ```
- **SendSurveyBodySchema** (`supabase/functions/_shared/ai-body-schemas.ts`, z.object):
  ```ts
  { survey_id: id.optional(), account_id: id.optional(), contact_id: id.optional(), call_session_id: id.optional(), channel: z.string().max(30).optional(), }
  ```
- **BitrixActionSchema** (`supabase/functions/_shared/external-payload-schemas.ts`, z.enum):
  ```ts
  [ "get_contacts", "get_leads", "create_lead", "update_lead", "get_deals", "create_call", "register_call", "finish_call", "get_user", "get_users", "get_departments", ]
  ```
- **bitrixPagination** (`supabase/functions/_shared/external-payload-schemas.ts`, z.object):
  ```ts
  { start: nonNegativeInt().max(1_000_000).optional(), order: z.record(z.enum(["ASC", "DESC"])).optional(), filter: z.record(z.unknown()).optional(), select: z.array(z.string().max(64)).max(100).optional(), }
  ```
- **bitrixLeadFields** (`supabase/functions/_shared/external-payload-schemas.ts`, z.object):
  ```ts
  { TITLE: z.string().max(255).optional(), NAME: z.string().max(255).optional(), LAST_NAME: z.string().max(255).optional(), STATUS_ID: z.string().max(64).optional(), OPPORTUNITY: finiteNumber().min(0).max(1e12).optional(), CURRENCY_ID: z.string().length(3).optional(), ASSIGNED_BY_ID: bitrixId().optional(), COMPANY_ID: bitrixId().optional(), CONTACT_ID: bitrixId().optional(), }
  ```
- **bitrixCallParams** (`supabase/functions/_shared/external-payload-schemas.ts`, z.object):
  ```ts
  { USER_ID: bitrixId(), PHONE_NUMBER: z.string().min(3).max(32), CALL_ID: z.string().max(128).optional(), CALL_START_DATE: z.string().max(64).optional(), CRM_CREATE: z.union([nonNegativeInt().max(1), z.boolean()]).optional(), TYPE: z.union([nonNegativeInt().max(4), z.string().max(8)]).optional(), DURATION: nonNegativeInt().max(86_400).optional(), STATUS_CODE: z.string().max(16).optional(), FAILED_REASON: z.string().max(255).optional(), COST: finiteNumber().min(0).max(1e9).optional(), COST_CURRENCY: z.string().length(3).optional(), RECORD_URL: z.string().url().max(2048).optional(), }
  ```
- **BitrixRequestSchema** (`supabase/functions/_shared/external-payload-schemas.ts`, z.object):
  ```ts
  { action: BitrixActionSchema, params: z.record(z.unknown()).optional(), }
  ```
- **WebhookEventSchema** (`supabase/functions/_shared/external-payload-schemas.ts`, z.object):
  ```ts
  { id: z.string().min(1).max(128), type: z.string().min(1).max(128), source: z.string().min(1).max(128).optional(), // Aceita ISO string ou epoch (seg/ms) — normalização fica com o handler. timestamp: z .union([z.string().datetime(), unixTimestamp(), unixTimestamp().transform((s) => s * 1000)]) .optional(), attempt: nonNegativeInt().max(100).optional(), retry_count: nonNegativeInt().max(100).optional(), latency_ms: durationMs().optional(), version: z.union([positiveInt().max(1000), z.string().max(16)]).optional(), data: z.record(z.unknown()).optional(), metadata: z.record(z.unknown()).optional(), }
  ```
- **id** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.string):
  ```ts
  
  ```
- **shortText** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.string):
  ```ts
  
  ```
- **mediumText** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.string):
  ```ts
  
  ```
- **ExportDataLakeBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { dataset: z.string().max(100).optional(), format: z.string().max(20).optional(), since: z.string().max(40).optional(), }
  ```
- **ForecastDealsBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { period: z.string().max(20).optional(), }
  ```
- **AccountIdBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { account_id: id.optional(), }
  ```
- **ComputeAdherenceBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { date: z.string().max(40).optional(), }
  ```
- **ComputeDealHealthBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { dealId: id.optional(), }
  ```
- **CheckAlertsBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { callSessionId: id.optional(), sentiment: z.string().max(40).optional(), // A nota de satisfacao e tratada como 0-10 no handler; fora da faixa e 422 // em vez de virar alerta com nota calculada errada. satisfaction: finiteNumber().min(0).max(10).optional(), urgency: z.string().max(40).optional(), callerName: shortText.optional(), }
  ```
- **CheckCallingHoursBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { region_code: z.string().max(10).optional(), }
  ```
- **CheckDncBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { phone: z.string().max(30).optional(), }
  ```
- **DataLakeFlushBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { datasets: z.array(z.string().max(100)).max(20).optional(), }
  ```
- **VoipFailoverNotifierBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { failed_trunk_id: id.optional(), backup_trunk_id: id.optional(), reason: mediumText.optional(), }
  ```
- **WavoipCallBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { action: z.string().max(30).optional(), whatsappId: id.optional(), callId: id.optional(), }
  ```
- **SipConfigBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { action: z.string().max(30).optional(), }
  ```
- **VoipTrunksManageBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { action: z.string().max(30).optional(), id: id.optional(), version: nonNegativeInt().optional(), agent_id: id.optional(), trunk_id: id.optional(), is_primary: z.boolean().optional(), name: shortText.optional(), provider: z.string().max(100).optional(), sip_server: z.string().max(255).optional(), sip_username: z.string().max(255).optional(), sip_password: z.string().max(512).optional(), sip_realm: z.string().max(255).optional(), transport: z.string().max(50).optional(), max_channels: nonNegativeInt().max(10_000).optional(), priority: nonNegativeInt().max(100_000).optional(), is_active: z.boolean().optional(), notes: z.string().max(2_000).optional(), }
  ```
- **LdapConfigSchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { serverUrl: z.string().max(255).optional(), port: z.string().max(10).optional(), baseDn: z.string().max(500).optional(), bindDn: z.string().max(500).optional(), passwordEncrypted: z.string().max(4_096).optional(), useTLS: z.boolean().optional(), searchFilter: z.string().max(500).optional(), syncInterval: z.string().max(50).optional(), fieldMapping: z.record(z.string().max(200)).optional(), }
  ```
- **LdapSyncBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { action: z.string().max(30).optional(), config: LdapConfigSchema.optional(), password: z.string().max(512).optional(), }
  ```
- **ApprovePasswordResetBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { requestId: id.optional(), action: z.string().max(20).optional(), }
  ```
- **WebauthnAuthBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { credentialId: z.string().max(500).optional(), userId: id.optional(), clientDataJSON: z.string().max(20_000).optional(), authenticatorData: z.string().max(4_000).optional(), signature: z.string().max(4_000).optional(), email: z.string().max(254).optional(), }
  ```
- **ElevenLabsTokenBodySchema** (`supabase/functions/_shared/numeric-body-schemas.ts`, z.object):
  ```ts
  { agentId: id.optional(), useDefaultAgent: z.boolean().optional(), }
  ```
- **TestSchema** (`supabase/functions/_shared/validator_test.ts`, z.object):
  ```ts
  { name: z.string().min(3), age: z.number().int().positive(), email: z.string().email().optional(), }
  ```
- **AnalyzeCallSchema** (`supabase/functions/analyze-call/schema.ts`, z.object):
  ```ts
  { transcript: z.string().min(1, "Transcrição é obrigatória").max(10000), callInfo: z.object({ contactName: z.string().optional(), phone: z.string().optional(), duration: z.string().optional(), type: z.string().optional() }).optional() }
  ```
- **ChatWidgetSessionSchema** (`supabase/functions/chat-widget-session/schema.ts`, z.object):
  ```ts
  { action: z.enum(['create', 'send_message', 'fetch_messages']).optional(), visitor_token: z.string().max(200).optional(), message: z.string().max(4000).optional(), visitor_name: z.string().max(200).optional(), visitor_email: z.string().max(254).optional(), origin_url: z.string().max(500).optional(), referrer: z.string().max(500).optional(), device_info: z.record(z.unknown()).optional(), }
  ```
- **ChatbotRespondSchema** (`supabase/functions/chatbot-respond/schema.ts`, z.object):
  ```ts
  { conversation_id: z.string().uuid('conversation_id invalido'), user_message: z.string().min(1, 'user_message obrigatorio').max(4000), visitor_token: z.string().max(200).optional(), }
  ```
- **EmailInboundSchema** (`supabase/functions/email-inbound/schema.ts`, z.object):
  ```ts
  { from: z.string().min(1).max(320), from_name: z.string().max(200).optional(), to: z.array(z.string().max(320)).max(50), cc: z.array(z.string().max(320)).max(50).optional(), subject: z.string().min(1).max(998), body_text: z.string().max(200000).optional(), body_html: z.string().max(500000).optional(), message_id: z.string().min(1).max(998), in_reply_to: z.string().max(998).optional(), headers: z.record(z.string().max(200)).optional(), }
  ```
- **phoneSchema** (`supabase/functions/whatsapp-inbound/schema.ts`, z.string, encadeia superRefine):
  ```ts
  
  ```
  - Regras cruzadas (refine): “O campo ”
- **WhatsAppInboundV1Schema** (`supabase/functions/whatsapp-inbound/schema.ts`, z.object):
  ```ts
  { from: phoneSchema, name: z.string().optional(), message: z.string().min(1, "O campo 'message' é obrigatório"), message_id: z.string().optional(), timestamp: z.string().optional(), attachments: z.array(z.object({ url: z.string().url(), type: z.string(), filename: z.string().optional() })).optional() }
  ```

### F.2 react-hook-form (register/rules)

_nenhum item encontrado_

### F.3 Restrições em inputs HTML (required/min/max/pattern)

| Campo | Restrições | Arquivo |
|---|---|---|
| `sip_password` | type=password | `src/components/admin/voip/VoipTrunkFormDrawer.tsx` |
| `max_channels` | max, type=number, max | `src/components/admin/voip/VoipTrunkFormDrawer.tsx` |
| `priority` | type=number | `src/components/admin/voip/VoipTrunkFormDrawer.tsx` |
| `webhook-secret-provider` | disabled=mode ===  | `src/components/admin/webhook-health/WebhookSecretsCard.tsx` |
| `passkey-email` | type=email | `src/components/auth/PasskeyLogin.tsx` |
| `reauth-password` | type=password | `src/components/auth/ReauthDialog.tsx` |
| `mfa-code` | max | `src/components/auth/ReauthDialog.tsx` |
| `reauth-password-only` | type=password | `src/components/auth/ReauthDialog.tsx` |
| `session-expired-email` | type=email | `src/components/auth/SessionExpiredDialog.tsx` |
| `session-expired-password` | type=password | `src/components/auth/SessionExpiredDialog.tsx` |
| `scheduled_date` | type=date | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `max_concurrent_calls` | max, type=number, min=1, max=10, max | `src/components/dialer/CreateCampaignDialog.tsx` |
| `call_timeout_seconds` | type=number, min=10, max=120 | `src/components/dialer/CreateCampaignDialog.tsx` |
| `retry_attempts` | type=number, min=0, max=5 | `src/components/dialer/CreateCampaignDialog.tsx` |
| `park-contact-name` | max | `src/components/park/ParkCallDialog.tsx` |
| `park-contact-phone` | max | `src/components/park/ParkCallDialog.tsx` |
| `park-notes` | max | `src/components/park/ParkCallDialog.tsx` |
| `orbit-name` | max, max | `src/components/park/ParkOrbitFormDialog.tsx` |
| `orbit-description` | max, max | `src/components/park/ParkOrbitFormDialog.tsx` |
| `orbit-slot-start` | type=number, min=PARK_LIMITS.minSlot, max=PARK_LIMITS.maxSlot | `src/components/park/ParkOrbitFormDialog.tsx` |
| `orbit-slot-end` | type=number, min=PARK_LIMITS.minSlot, max=PARK_LIMITS.maxSlot | `src/components/park/ParkOrbitFormDialog.tsx` |
| `orbit-timeout` | type=number, min=PARK_LIMITS.minTimeoutSeconds, max=PARK_LIMITS.maxTimeoutSeconds | `src/components/park/ParkOrbitFormDialog.tsx` |
| `orbit-target` | max, max | `src/components/park/ParkOrbitFormDialog.tsx` |
| `audio-file` | accept=audio/* | `src/components/queues/QueueAudioLibrary.tsx` |
| `audio-name` | max | `src/components/queues/QueueAudioLibrary.tsx` |
| `audio-description` | max | `src/components/queues/QueueAudioLibrary.tsx` |
| `queue-name` | max | `src/components/queues/QueueFormDialog.tsx` |
| `queue-description` | max | `src/components/queues/QueueFormDialog.tsx` |
| `queue-priority` | type=number, min=QUEUE_LIMITS.priority.min, max=QUEUE_LIMITS.priority.max | `src/components/queues/QueueFormDialog.tsx` |
| `queue-ring` | type=number, min=QUEUE_LIMITS.ringTimeout.min, max=QUEUE_LIMITS.ringTimeout.max | `src/components/queues/QueueFormDialog.tsx` |
| `queue-wrapup` | type=number, min=QUEUE_LIMITS.wrapUp.min, max=QUEUE_LIMITS.wrapUp.max | `src/components/queues/QueueFormDialog.tsx` |
| `queue-wait` | type=number, min=QUEUE_LIMITS.maxWait.min, max=QUEUE_LIMITS.maxWait.max, max | `src/components/queues/QueueFormDialog.tsx` |
| `queue-size` | type=number, min=QUEUE_LIMITS.maxSize.min, max=QUEUE_LIMITS.maxSize.max, max | `src/components/queues/QueueFormDialog.tsx` |
| `queue-announce-interval` | type=number, min=QUEUE_LIMITS.announceInterval.min, max=QUEUE_LIMITS.announceInterval.max | `src/components/queues/QueueFormDialog.tsx` |
| `calls_target` | type=number, min=1, max=500 | `src/components/ranking/GoalsConfigDialog.tsx` |
| `satisfaction_target` | type=number, min=1, max=10, step=0.1 | `src/components/ranking/GoalsConfigDialog.tsx` |
| `performance_target` | type=number, min=1, max=10, step=0.1 | `src/components/ranking/GoalsConfigDialog.tsx` |
| `ring-group-name` | max | `src/components/ringgroups/RingGroupFormDialog.tsx` |
| `ring-group-extension` | max | `src/components/ringgroups/RingGroupFormDialog.tsx` |
| `ring-group-description` | max | `src/components/ringgroups/RingGroupFormDialog.tsx` |
| `ring-group-timeout` | type=number, min=RING_GROUP_LIMITS.ringTimeout.min, max=RING_GROUP_LIMITS.ringTimeout.max | `src/components/ringgroups/RingGroupFormDialog.tsx` |
| `ring-group-step` | step, type=number, min=RING_GROUP_LIMITS.stepTimeout.min, max=RING_GROUP_LIMITS.stepTimeout.max, step, disabled=draft.strategy !==  | `src/components/ringgroups/RingGroupFormDialog.tsx` |
| `ring-group-target` | max | `src/components/ringgroups/RingGroupFormDialog.tsx` |
| `webhook-secret` | type=password | `src/components/security-alerts/WebhookConfigDialog.tsx` |
| `webhook-max-attempts` | max, type=number, min=WEBHOOK_MAX_ATTEMPTS_MIN, max=WEBHOOK_MAX_ATTEMPTS_MAX, step=1 | `src/components/security-alerts/WebhookConfigDialog.tsx` |
| `webhook-base-delay` | type=number, min=WEBHOOK_BASE_DELAY_MIN, max=WEBHOOK_BASE_DELAY_MAX, step=50 | `src/components/security-alerts/WebhookConfigDialog.tsx` |
| `webhook-max-delay` | max, type=number, min=WEBHOOK_MAX_DELAY_MIN, max=WEBHOOK_MAX_DELAY_MAX, step=100 | `src/components/security-alerts/WebhookConfigDialog.tsx` |
| `email` | type=email, disabled | `src/components/settings/ProfileSettings.tsx` |
| `role` | disabled | `src/components/settings/ProfileSettings.tsx` |
| `email` | type=email | `src/pages/ForgotPassword.tsx` |
| `email` | type=email | `src/pages/Login.tsx` |
| `email` | type=email | `src/pages/Register.tsx` |
| `email` | type=email | `src/pages/roles/AddRoleDialog.tsx` |

## G. Fórmulas e derivações (como valores são calculados)

### G.1 Colunas calculadas no banco

_nenhum item encontrado_

### G.2 Views (consultas derivadas)

| View | SELECT |
|---|---|
| `migration_status` | `SELECT sm.version, sm.name, sm.applied_at, sm.applied_by, sm.execution_time_ms, sm.success, CASE WHEN mr.id IS NOT NULL THEN 'Rolled Back' ELSE 'Applied' END AS status FROM schema_migrations sm LEFT JOIN migration_rollbacks mr ON sm.version = mr.version ORDER BY sm.version DESC` |
| `slow_queries` | `SELECT query, calls, total_time / 1000 AS total_seconds, mean_time / 1000 AS avg_seconds, max_time / 1000 AS max_seconds FROM pg_stat_statements WHERE mean_time > 100 ORDER BY mean_time DESC LIMIT 50` |
| `financial_impact_daily` | `WITH calls_daily AS ( SELECT date_trunc('day', started_at)::date AS day, COUNT(*) AS total_calls, COALESCE(SUM(duration_seconds), 0) AS total_seconds, COALESCE(SUM(duration_seconds * 15 / 60), 0) AS estimated_cost_cents FROM public.call_sessions WHERE started_at > now() - interval '90 days' GROUP BY …` |
| `index_usage` | `SELECT schemaname, relname AS tablename, indexrelname AS indexname, idx_scan AS index_scans, idx_tup_read AS tuples_read, idx_tup_fetch AS tuples_fetched, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size FROM pg_stat_user_indexes ORDER BY idx_scan DESC` |
| `unused_indexes` | `SELECT schemaname, relname AS tablename, indexrelname AS indexname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size FROM pg_stat_user_indexes WHERE idx_scan = 0 AND indexrelname NOT LIKE 'pk_%' AND indexrelname NOT LIKE '%_pkey' ORDER BY pg_relation_size(indexrelid) DESC` |

### G.3 Funções de cálculo/decisão no código

- **apply(s: CrmFieldSuggestion)** — `src/components/calls/CrmSuggestionsCard.tsx`
  ```
  const value = editing[s.id] ?? s.suggested_value; accept({ id: s.id, contactId: contactId ?? null, field: s.field_name, value }); cancelEdit(s.id);
  ```
- **fetchRanking()** — `src/components/gamification/WeeklyRanking.tsx`
  ```
  try { const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0); const { data: stats, error: statsError } = await supabase .from("agent_weekly_stats") .select("*, agents(name)") .gte("week_start", weekStart.toISOString().split("T")[0]) .order("points_earned", { ascending: false }); if (statsError) { // Ranking vazio por falha de consulta parece desempenho ("ninguém // produziu nada"), não cegueira (A-009, etapa 201). setError(statsE …
  ```
- **scoreColor(score: number | null)** — `src/components/network/VoipHealthScoreCard.tsx`
  ```
  if (score === null) return 'text-muted-foreground'; if (score >= 80) return 'text-success'; if (score >= 60) return 'text-warning'; return 'text-destructive';
  ```
- **scoreBadgeClass(score: number | null)** — `src/components/network/VoipHealthScoreCard.tsx`
  ```
  if (score === null) return 'bg-muted/15 text-muted-foreground border-border/30'; if (score >= 80) return 'bg-success/15 text-success border-success/30'; if (score >= 60) return 'bg-warning/15 text-warning border-warning/30'; return 'bg-destructive/15 text-destructive border-destructive/30';
  ```
- **scoreLabel(score: number | null)** — `src/components/network/VoipHealthScoreCard.tsx`
  ```
  if (score === null) return 'SEM MEDIÇÃO'; if (score >= 80) return 'SAUDÁVEL'; if (score >= 60) return 'ATENÇÃO'; return 'CRÍTICO';
  ```
- **applyPreset(p: Preset)** — `src/components/network/WhatIfSimulatorDialog.tsx`
  ```
  const v = PRESETS[p]; setDMos(v.mos); setDJitter(v.jitter); setDPl(v.packetLoss);
  ```
- **invalidate()** — `src/components/notification-center/useNotificationCenter.ts`
  ```
  
  ```
- **invalidate()** — `src/hooks/useBlfBoard.ts`
  ```
  queryClient.invalidateQueries({ queryKey: ['blf-board'] });
  ```
- **generateRecommendations()** — `src/hooks/useCoaching.ts`
  ```
  if (!agentId) return; setIsGenerating(true); try { const { data, error } = await supabase.functions.invoke('generate-coaching', { body: { agentId } }); if (error) { throw error; } toast.success('🎯 Recomendações Geradas', { description: `${data.recommendations?.length || 0} novas recomendações de coaching foram criadas.` }); await fetchRecommendations(); } catch (error: unknown) { logger.error('Error generating recommendations:', error); toast.error('Erro', { description: 'Não foi possível gerar …
  ```
- **generateDeviceFingerprint(deviceInfo: DeviceInfo)** — `src/hooks/useDeviceDetection.ts`
  ```
  const components = [ deviceInfo.browser, deviceInfo.os, deviceInfo.device, navigator.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset().toString(), ]; return btoa(components.join('|'));
  ```
- **fetchRankings()** — `src/hooks/useGamification.ts`
  ```
  const weekStart = getWeekStart(); const { data: stats, error: statsError } = await supabase .from('agent_weekly_stats') .select('*') .eq('week_start', weekStart) .order('points_earned', { ascending: false }); if (statsError) { log.error('Error fetching rankings:', statsError); return; } const { data: agents, error: agentsError } = await supabase .from('agents') .select('id, name, avatar_url'); if (agentsError) { log.error('Error fetching agents:', agentsError); return; } const agentsMap = new Ma …
  ```
- **validateIP(ip: string, isCidr: boolean)** — `src/hooks/useIPWhitelist.ts`
  ```
  const regex = isCidr ? /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/ : /^(\d{1,3}\.){3}\d{1,3}$/; return regex.test(ip);
  ```
- **generateBackupCodes()** — `src/hooks/useMFA.ts`
  ```
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const codes = new Set<string>(); while (codes.size < 10) { const bytes = crypto.getRandomValues(new Uint8Array(6)); const code = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join(''); codes.add(code); } return [...codes];
  ```
- **calculateSecurityScore(ipEnabled: boolean, alerts: SecurityAlert[])** — `src/hooks/useSecurityDashboard.ts`
  ```
  const score = { total: 0, mfa: 0, sessions: 0, ipRestriction: 0, recentActivity: 0 }; if (mfaSettings?.mfa_enabled) score.mfa = 40; const activeSessions = sessions.length; score.sessions = activeSessions === 1 ? 20 : activeSessions <= 3 ? 15 : activeSessions <= 5 ? 10 : 5; if (ipEnabled) score.ipRestriction = 25; const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length; score.recentActivity = unresolvedAlerts === 0 ? 15 : unresolvedAlerts <= 2 ? 10 : 5; score.total = score.mfa + score. …
  ```
- **calculateMos(rttMs: number, jitterMs: number, lossPct: number)** — `src/hooks/useVoipQualityMonitor.ts`
  ```
  const effectiveLatency = rttMs / 2 + jitterMs * 2 + 10; let R = effectiveLatency < 160 ? 93.2 - effectiveLatency / 40 : 93.2 - (effectiveLatency - 120) / 10; R = R - lossPct * 2.5; if (R < 0) R = 0; if (R > 100) R = 100; const mos = 1 + 0.035 * R + R * (R - 60) * (100 - R) * 7e-6; return Math.max(1, Math.min(5, Number(mos.toFixed(2))));
  ```
- **validateProvider(value: string)** — `src/hooks/useWebhookSecrets.ts`
  ```
  const normalized = normalizeProvider(value); if (!normalized) return 'Informe o provedor'; if (!PROVIDER_PATTERN.test(normalized)) { return 'Use de 3 a 64 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado'; } return null;
  ```
- **validateSecret(value: string)** — `src/hooks/useWebhookSecrets.ts`
  ```
  if (!value) return 'Informe ou gere um segredo'; if (value.trim().length < WEBHOOK_SECRET_MIN_LENGTH) { return `O segredo precisa de ao menos ${WEBHOOK_SECRET_MIN_LENGTH} caracteres`; } return null;
  ```
- **generateWebhookSecret(bytes = 32)** — `src/hooks/useWebhookSecrets.ts`
  ```
  const buffer = new Uint8Array(bytes); crypto.getRandomValues(buffer); return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
  ```
- **calculateAcceptanceRate(signals: Array<{ was_used: boolean }>)** — `src/lib/agent-assist-utils.ts`
  ```
  if (signals.length === 0) return 0; const used = signals.filter((s) => s.was_used).length; return Math.round((used / signals.length) * 10000) / 100;
  ```
- **validateOrbitDraft(draft: CallParkOrbitDraft, otherActiveOrbits: readonly Pick<CallParkOrbit, 'name' | 'slot_start' | 'slot_end'>[] = [],)** — `src/lib/call-park.ts`
  ```
  const errors: string[] = []; if (draft.name.length === 0) errors.push('Informe um nome para a órbita.'); if (draft.slot_end < draft.slot_start) { errors.push('A vaga final precisa ser maior ou igual à inicial.'); } if (slotCount(draft) > PARK_LIMITS.maxSlotsPerOrbit) { errors.push(`Uma órbita comporta no máximo ${PARK_LIMITS.maxSlotsPerOrbit} vagas.`); } if (ACTIONS_REQUIRING_TARGET.includes(draft.timeout_action) && !draft.timeout_target) { errors.push('Informe o destino para a ação de tempo esg …
  ```
- **validateQueueDraft(draft: CallQueueDraft, options: { selfId?: string | null } = {},)** — `src/lib/call-queue.ts`
  ```
  const errors: string[] = []; if (draft.name.length === 0) { errors.push('Informe um nome para a fila.'); } if (draft.overflow_action === 'transfer_queue') { if (!draft.overflow_queue_id) { errors.push('Escolha a fila de destino do transbordo.'); } else if (options.selfId && draft.overflow_queue_id === options.selfId) { errors.push('A fila de transbordo não pode ser ela mesma.'); } } if (draft.moh_url) { const isHttp = /^https?:\/\//i.test(draft.moh_url); if (!isHttp) { errors.push('O áudio de es …
  ```
- **computeHealth(args: HealthInputs)** — `src/lib/health-score.ts`
  ```
  let score = 0; const issues: string[] = []; if (args.hasTrunk) score += 30; else issues.push('Sem trunk VoIP atribuído'); if (args.hasTrunk && args.trunkOnline) score += 20; else if (args.hasTrunk) issues.push('Trunk degradado/offline'); if (args.hasDevices) score += 15; else issues.push('Sem dispositivos extras'); if (args.online) score += 10; else issues.push('Agente offline'); if (args.profileComplete) score += 15; else issues.push('Perfil incompleto'); if (args.hasRecentCalls) score += 10; e …
  ```
- **shouldLog(level: LogLevel)** — `src/lib/logger.ts`
  ```
  LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
  ```
- **generateRequestId()** — `src/lib/logger.ts`
  ```
  const array = new Uint8Array(6); crypto.getRandomValues(array); return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  ```
- **validateAudioFile(file: AudioFileLike | null | undefined)** — `src/lib/queue-audio.ts`
  ```
  const errors: string[] = []; if (!file || typeof file !== 'object') { return ['Selecione um arquivo de áudio.']; } const size = typeof file.size === 'number' && Number.isFinite(file.size) ? file.size : -1; if (size <= 0) { errors.push('O arquivo de áudio está vazio ou inválido.'); } else if (size > AUDIO_LIMITS.maxFileBytes) { errors.push('O arquivo excede o limite de 20 MB.'); } const mime = typeof file.type === 'string' ? file.type.toLowerCase() : ''; if (!(ALLOWED_AUDIO_MIME_TYPES as readonly …
  ```
- **validateAudioPromptDraft(draft: QueueAudioPromptDraft)** — `src/lib/queue-audio.ts`
  ```
  const errors: string[] = []; if (draft.name.length === 0) errors.push('Informe um nome para o áudio.'); if (draft.storage_path.length === 0) errors.push('Envie o arquivo de áudio.'); return errors;
  ```
- **validateRingGroupDraft(draft: RingGroupDraft, options: { existingExtensions?: readonly string[] } = {},)** — `src/lib/ring-group.ts`
  ```
  const errors: string[] = []; if (draft.name.length === 0) { errors.push('Informe um nome para o grupo.'); } if ( draft.no_answer_action === 'forward_extension' || draft.no_answer_action === 'forward_queue' ) { if (!draft.forward_target) { errors.push('Informe o destino do encaminhamento.'); } else if ( draft.no_answer_action === 'forward_extension' && draft.extension && draft.forward_target === draft.extension ) { errors.push('O grupo não pode encaminhar para o próprio ramal.'); } } if (draft.ex …
  ```
- **toValidDate(input: DateInput)** — `src/lib/safe-date.ts`
  ```
  if (input === null || input === undefined || input === "") return null; const d = input instanceof Date ? input : new Date(input); return Number.isNaN(d.getTime()) ? null : d;
  ```
- **validateUrl(raw: string, out: WebhookValidationResult)** — `src/lib/security-alerts-webhook-validation.ts`
  ```
  const trimmed = raw.trim(); out.normalizedUrl = trimmed; if (!trimmed) return; // vazio = remover; validado por quem chama Save/Test if (trimmed.length > WEBHOOK_URL_MAX_LENGTH) { out.errors.url = `URL muito longa (máx ${WEBHOOK_URL_MAX_LENGTH} caracteres).`; return; } if (/\s/.test(trimmed)) { out.errors.url = "URL não pode conter espaços."; return; } let parsed: URL; try { parsed = new URL(trimmed); } catch { out.errors.url = "URL inválida — use http(s)://host/caminho."; return; } if (parsed.p …
  ```
- **validateSecret(raw: string, out: WebhookValidationResult)** — `src/lib/security-alerts-webhook-validation.ts`
  ```
  const trimmed = raw.trim(); out.normalizedSecret = trimmed; if (!trimmed) return; // opcional if (trimmed.length > WEBHOOK_SECRET_MAX_LENGTH) { out.errors.secret = `Segredo muito longo (máx ${WEBHOOK_SECRET_MAX_LENGTH} caracteres).`; return; } if (/\s/.test(raw)) { out.errors.[REDACTED]; return; } if (trimmed.length < WEBHOOK_SECRET_MIN_LENGTH) { out.warnings.secret = `Segredo curto (${trimmed.length}) — recomendado ≥ ${WEBHOOK_SECRET_MIN_LENGTH} caracteres.`; }
  ```
- **validateInt(field: WebhookField, value: number, min: number, max: number, label: string, out: WebhookValidationResult,)** — `src/lib/security-alerts-webhook-validation.ts`
  ```
  if (!Number.isFinite(value) || Number.isNaN(value)) { out.errors[field] = `${label} deve ser um número.`; return; } if (!Number.isInteger(value)) { out.errors[field] = `${label} deve ser inteiro.`; return; } if (value < min || value > max) { out.errors[field] = `${label} deve estar entre ${min} e ${max}.`; }
  ```
- **validateWebhookConfig(draft: WebhookDraft)** — `src/lib/security-alerts-webhook-validation.ts`
  ```
  const out: WebhookValidationResult = { errors: {}, warnings: {}, normalizedUrl: "", normalizedSecret: "", }; validateUrl(draft.url, out); validateSecret(draft.secret, out); validateInt("maxAttempts", draft.maxAttempts, WEBHOOK_MAX_ATTEMPTS_MIN, WEBHOOK_MAX_ATTEMPTS_MAX, "Tentativas", out); validateInt("baseDelayMs", draft.baseDelayMs, WEBHOOK_BASE_DELAY_MIN, WEBHOOK_BASE_DELAY_MAX, "Backoff base", out); validateInt("maxDelayMs", draft.maxDelayMs, WEBHOOK_MAX_DELAY_MIN, WEBHOOK_MAX_DELAY_MAX, "Ba …
  ```
- **generateRequestId()** — `src/lib/security-alerts-webhook.ts`
  ```
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID(); return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  ```
- **computeTalkRatio(segments: TalkRatioSegment[], totalDurationOverride?: number,)** — `src/lib/talkRatio.ts`
  ```
  const totalDuration = totalDurationOverride ?? Math.max(0, ...segments.map((s) => s.end)); const speakers = new Map<string, 'agent' | 'customer'>(); let order = 0; for (const s of segments) { if (!speakers.has(s.speaker)) { speakers.set(s.speaker, order === 0 ? 'agent' : 'customer'); order++; } } let agentTime = 0; let customerTime = 0; let longestAgentMonologue = 0; let longestCustomerMonologue = 0; let interruptions = 0; let currentMono: { role: 'agent' | 'customer' | ''; dur: number } = { rol …
  ```
- **formatCurrency(value: number)** — `src/lib/utils.ts`
  ```
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', }).format(value);
  ```
- **shouldRunProactiveCheck()** — `src/lib/voipProactiveSnapshot.ts`
  ```
  if (!isProactiveEnabled()) return false; try { const raw = localStorage.getItem(SNAPSHOT_KEY); if (!raw) return true; const snap = JSON.parse(raw) as Partial<Snapshot> | null; if (typeof snap?.takenAt !== 'number' || !Number.isFinite(snap.takenAt)) return true; return Date.now() - snap.takenAt >= CHECK_INTERVAL_MS; } catch { return true; }
  ```
- **shouldShortCircuit()** — `src/lib/bitrix/circuit-breaker.ts`
  ```
  maybeHalfOpen(); return breaker.state === 'open';
  ```
- **calculatePredictivePace(input: PacingInputs)** — `src/lib/dialer/predictive-pace.ts`
  ```
  const { freeAgents, abandonRate, connectRate, minPace, maxPace, currentPace, targetAbandonRate, } = input; let suggested: number; let reason: PacingResult['reason']; if (freeAgents === 0) { suggested = minPace; reason = 'no_free_agents'; } else if (abandonRate * 100 > targetAbandonRate) { suggested = Math.max(minPace, currentPace - 1); reason = 'abandon_over_target'; } else if (abandonRate * 100 < targetAbandonRate / 2 && connectRate > 0.2) { suggested = Math.min( maxPace, Math.ceil(freeAgents / …
  ```
- **generateBackupCodes(count = 10)** — `src/lib/mfa/index.ts`
  ```
  const codes: string[] = []; for (let i = 0; i < count; i++) { const array = new Uint8Array(4); crypto.getRandomValues(array); const code = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join(""); codes.push(`${code.slice(0, 4)}-${code.slice(4)}`); } return codes;
  ```
- **validateNotification(params: Partial<SendNotificationParams>)** — `src/lib/notifications/index.ts`
  ```
  const errors: string[] = []; if (!params.userId) errors.push('userId é obrigatório'); if (!params.title || params.title.trim().length === 0) errors.push('title é obrigatório'); if (!params.message || params.message.trim().length === 0) errors.push('message é obrigatório'); if (params.title && params.title.length > 200) errors.push('title deve ter no máximo 200 caracteres'); if (params.message && params.message.length > 2000) errors.push('message deve ter no máximo 2000 caracteres'); const validC …
  ```
- **generateSecurePassword(length = 16)** — `src/lib/password/index.ts`
  ```
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"; const array = new Uint8Array(length); crypto.getRandomValues(array); return Array.from(array, (b) => charset[b % charset.length]).join("");
  ```
- **shouldRotateKey(config: ApiKeyConfig, warningDays = 7)** — `src/lib/security/api-key-rotation.ts`
  ```
  const warningDate = new Date(config.expiresAt); warningDate.setDate(warningDate.getDate() - warningDays); return new Date() > warningDate;
  ```
- **generateRotationSchedule(currentKey: ApiKeyConfig, rotationIntervalDays = DEFAULT_ROTATION_INTERVAL_DAYS)** — `src/lib/security/api-key-rotation.ts`
  ```
  nextRotation: Date; daysRemaining: number
  ```
- **generateCSRFToken()** — `src/lib/security/csrf-token.ts`
  ```
  const array = new Uint8Array(32); crypto.getRandomValues(array); return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  ```
- **validateCSRFToken(token: string)** — `src/lib/security/csrf-token.ts`
  ```
  const stored = sessionStorage.getItem(CSRF_STORAGE_KEY); return !!stored && stored === token;
  ```
- **generateEncryptionKey()** — `src/lib/security/encryption.ts`
  ```
  return crypto.subtle.generateKey( { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"] );
  ```
- **applyMetaTags(headers: Partial<SecurityHeaders> = {})** — `src/lib/security/helmet-config.ts`
  ```
  const merged = getSecurityHeaders(headers); const existingMetas = document.querySelectorAll('meta[http-equiv]'); const existingNames = new Set(Array.from(existingMetas).map(m => m.getAttribute('http-equiv'))); for (const [name, value] of Object.entries(merged)) { if (!existingNames.has(name)) { const meta = document.createElement("meta"); meta.httpEquiv = name; meta.content = value; document.head.appendChild(meta); } }
  ```
- **shouldEnforceHTTPS()** — `src/lib/security/https-enforcer.ts`
  ```
  const hostname = window.location.hostname; const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"; const isHTTPS = window.location.protocol === "https:"; return !isLocalhost && !isHTTPS;
  ```
- **generateReport(scope: string, findings: SecurityFinding[])** — `src/lib/security/penetration-test-reporter.ts`
  ```
  return { reportId: crypto.randomUUID(), generatedAt: new Date(), scope, findings, summary: { total: findings.length, critical: findings.filter((f) => f.severity === "critical").length, high: findings.filter((f) => f.severity === "high").length, medium: findings.filter((f) => f.severity === "medium").length, low: findings.filter((f) => f.severity === "low").length, info: findings.filter((f) => f.severity === "info").length, }, };
  ```
- **scanForSecrets(text: string)** — `src/lib/security/secrets-scanner.ts`
  ```
  const matches: ScanResult["matches"] = []; for (const { name, pattern } of SECRET_PATTERNS) { const regex = new RegExp(pattern.source, pattern.flags); const found: number[] = []; let match: RegExpExecArray | null; while ((match = regex.exec(text)) !== null) { found.push(match.index); } if (found.length > 0) { matches.push({ name, count: found.length, positions: found }); } } return { found: matches.length > 0, matches };
  ```
- **validateHeaders(url: string)** — `src/lib/security/security-headers-validator.ts`
  ```
  try { const response = await fetch(url, { method: "HEAD" }); return EXPECTED_HEADERS.map(({ header, recommendation }) => ({ header, present: response.headers.has(header), value: response.headers.get(header), recommendation, })); } catch { return EXPECTED_HEADERS.map(({ header, recommendation }) => ({ header, present: false, value: null, recommendation, })); }
  ```
- **validateIdentifier(identifier: string)** — `src/lib/security/sql-sanitizer.ts`
  ```
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
  ```
- **generateChallenge()** — `src/lib/webauthn/webauthn-utils.ts`
  ```
  const array = new Uint8Array(32); crypto.getRandomValues(array); return bufferToBase64Url(array);
  ```
- **formatCurrency(cents: number, currency = "BRL")** — `src/pages/Deals.tsx`
  ```
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }) .format(cents / 100);
  ```
- **generateProvisioningURL(config: SIPConfig)** — `src/pages/QRProvisioning.tsx`
  ```
  const params = new URLSearchParams({ dn: config.displayName, un: config.username, pw: config.password, d: config.domain, p: config.port, t: config.transport, ...(config.proxy && { px: config.proxy }), c: config.codec, ...(config.srtp && { srtp: '1' }), ...(config.stunServer && { stun: config.stunServer }), }); return `sip-provision://?${params.toString()}`;
  ```
- **Scorecards()** — `src/pages/Scorecards.tsx`
  ```
  usePageTitle("Avaliações de Chamada"); const { templates, error, updateStatus, createTemplate, generateAIScorecard } = useScorecards(); const [templateId, setTemplateId] = useState(""); const [callId, setCallId] = useState(""); const [generating, setGenerating] = useState(false); const [creating, setCreating] = useState(false); const [newName, setNewName] = useState(""); const [newDesc, setNewDesc] = useState(""); const [newCriteria, setNewCriteria] = useState([ { label: "Abertura e identificaçã …
  ```
- **generate()** — `src/pages/Scorecards.tsx`
  ```
  if (!callId || !templateId) return; setGenerating(true); try { await generateAIScorecard(templateId, callId); setCallId(""); await refetchScorecards(); } finally { setGenerating(false); }
  ```
- **computeUptime(samples: DailySample[])** — `src/pages/Status.tsx`
  ```
  let ok = 0; let total = 0; for (const s of samples) { ok += s.ok; total += s.total; } if (!total) return null; return Math.round((ok / total) * 10000) / 100;
  ```
- **computeBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number, jitter: boolean, rng: ()** — `supabase/functions/_shared/resilience.ts`
  ```
  number = Math.random,
  ```
- **defaultShouldRetry(err: unknown)** — `supabase/functions/_shared/resilience.ts`
  ```
  // Retry on network-ish errors and 5xx / 429; skip 4xx (except 429) const msg = String((err as Error)?.message ?? err ?? "").toLowerCase(); if (err instanceof CircuitOpenError) return false; // Best-effort HTTP status extraction const status = (err as { status?: number })?.status; if (typeof status === "number") { if (status === 429) return true; if (status >= 500 && status < 600) return true; if (status >= 400 && status < 500) return false; } return /timeout|network|fetch|econn|socket|aborted/. …
  ```
- **logValidationError(req: Request, endpoint: string, fields: ValidationError[], userId?: string)** — `supabase/functions/_shared/validator.ts`
  ```
  try { const supabaseUrl = Deno.env.get('SUPABASE_URL')!; const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; const supabase = createClient(supabaseUrl, supabaseServiceKey); const forwarded = req.headers.get('x-forwarded-for'); const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'; await supabase.from('audit_logs').insert({ action: 'VALIDATION_ERROR', resource_type: 'api_endpoint', resource_id: endpoint, user_id: userId, ip_address: ip, details: { fields, url: req.u …
  ```
- **computeWeaknesses(stat: AgentStat)** — `supabase/functions/generate-coaching-track/track-engine.ts`
  ```
  const avgPerf = stat.perfSum / stat.count; const avgSat = stat.satSum / stat.count; const weaknesses: Weakness[] = []; if (avgPerf < SCORE_THRESHOLD) weaknesses.push({ key: "performance", label: "desempenho geral", avg: avgPerf }); if (avgSat < SCORE_THRESHOLD) weaknesses.push({ key: "satisfacao", label: "satisfação do cliente", avg: avgSat }); return weaknesses;
  ```
- **round(n: number)** — `supabase/functions/health-check/slo-budget.ts`
  ```
  return Math.round(n * 10000) / 10000;
  ```
- **computeWeightedTotal(responses: Array<{ criterion_id: string; score: number }>, criteria: Array<{ id: string; max_score: number; weight: numb)** — `supabase/functions/score-call/index.ts`
  ```
  total: number; max: number
  ```
- **zScore(observed: number, mu: number, sigma: number)** — `supabase/functions/voip-anomaly-detector/index.ts`
  ```
  if (sigma === 0) return 0; return (observed - mu) / sigma;
  ```
- **computeHealthScore(b: HealthBreakdown)** — `supabase/functions/voip-executive-summary/index.ts`
  ```
  const dims: Array<[number | null, number]> = [ [b.sla_score, 0.4], [b.mos_score, 0.3], [b.alerts_score, 0.2], [b.capacity_score, 0.1], ]; const measured = dims.filter(([v]) => v !== null) as Array<[number, number]>; if (measured.length < 2) return null; const weightSum = measured.reduce((s, [, w]) => s + w, 0); const score = measured.reduce((s, [v, w]) => s + v * w, 0) / weightSum; return Math.round(Math.max(0, Math.min(100, score)));
  ```
- **computePeakConcurrent(sessions: SessionRow[])** — `supabase/functions/voip-executive-summary/index.ts`
  ```
  if (!sessions.length) return 0; const events: Array<{ t: number; delta: number }> = []; for (const s of sessions) { const start = new Date(s.started_at).getTime(); const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now(); if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue; events.push({ t: start, delta: 1 }); events.push({ t: end, delta: -1 }); } events.sort((a, b) => a.t - b.t || a.delta - b.delta); let cur = 0, peak = 0; for (const e of events) { cur += e.delta; …
  ```
- **calcEffectiveness(actions: ActionRow[], quality: QualityRow[],)** — `supabase/functions/voip-recommendation-insights/index.ts`
  ```
  pct: number | null; sample: number
  ```
- **computeRecurring(items: ActionRow[])** — `supabase/functions/voip-recommendation-insights/index.ts`
  ```
  category: string; count: number
  ```
- **computeProblematic(items: ActionRow[])** — `supabase/functions/voip-recommendation-insights/index.ts`
  ```
  category: string; unresolved: number; severity: string
  ```
- **computeTotals(items: ActionRow[])** — `supabase/functions/voip-recommendation-insights/index.ts`
  ```
  return { applied: items.filter(i => i.outcome === 'applied').length, autoApplied: items.filter(i => i.outcome === 'auto_applied').length, snoozed: items.filter(i => i.outcome === 'snoozed').length, dismissed: items.filter(i => i.outcome === 'dismissed').length, };
  ```
- **computePeak(sessions: SessionRow[])** — `supabase/functions/voip-recommendations/index.ts`
  ```
  const events: Array<{ t: number; d: number }> = []; for (const s of sessions) { const start = new Date(s.started_at).getTime(); const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now(); if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue; events.push({ t: start, d: 1 }); events.push({ t: end, d: -1 }); } events.sort((a, b) => a.t - b.t || a.d - b.d); let cur = 0, peak = 0; for (const e of events) { cur += e.d; if (cur > peak) peak = cur; } return peak;
  ```

### G.4 Percentuais e multiplicadores no código

| Trecho | Arquivo |
|---|---|
| `const gap = Math.min(1, barW * 0.2);` | `src/components/admin/EndpointSparkline.tsx` |
| `gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.2);` | `src/components/agent/BargeInNotification.tsx` |
| `gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);` | `src/components/agent/BargeInNotification.tsx` |
| `oscillator.start(audioContext.currentTime + i * 0.15);` | `src/components/agent/BargeInNotification.tsx` |
| `oscillator.stop(audioContext.currentTime + i * 0.15 + 0.2);` | `src/components/agent/BargeInNotification.tsx` |
| `setOverallSentiment((prev) => Math.round(prev * 0.7 + sentimentValue * 0.3));` | `src/components/ai/live-call/useLiveInsights.ts` |
| `: <>Ideal: agente fala entre 40% e 60%. {data.benchmark.status !== 'optimal' && 'Ajuste para escutar mais o cliente ou conduzir melhor a conversa.'}</>}` | `src/components/conversation-intelligence/TalkRatioChart.tsx` |
| `// Sem transcrições o talk ratio fica 0%: registro o motivo para o` | `src/components/executive/ConversationIntelligenceCard.tsx` |
| `delay: Math.random() * 0.5,` | `src/components/gamification/AchievementCelebration.tsx` |
| `value: +(baseline + (Math.sin(i * 1.3 + a.bucket_hour) * a.std * 0.4)).toFixed(2),` | `src/components/network/AnomalyDetectionCard.tsx` |
| `: `hsl(var(--primary) / ${0.2 + intensity * 0.8})`,` | `src/components/network/RecommendationInsightsCard.tsx` |
| `<strong>Fórmula:</strong> 40% SLA + 30% MOS + 20% Alertas + 10% Capacidade.` | `src/components/network/VoipHealthScoreCard.tsx` |
| `transition={{ duration: 0.7 + (bar % 5) * 0.1, repeat: Infinity, ease: 'easeInOut' }}` | `src/components/voice/VoiceAssistantOrb.tsx` |
| `transition={{ duration: 3 + ring, repeat: Infinity, ease: 'easeInOut', delay: ring * 0.3 }}` | `src/components/voice/VoiceAssistantOrb.tsx` |
| `const lineAlpha = (1 - dist / CONNECTION_DIST) * Math.min(alphas[i], alphas[j]) * 0.6;` | `src/components/voice/overlay/FloatingParticles.tsx` |
| `const speed = (Math.random() * 0.5 + 0.5) * cfg.speed;` | `src/components/voice/overlay/FloatingParticles.tsx` |
| `ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);` | `src/components/voice/overlay/FloatingParticles.tsx` |
| `p.vx += (Math.random() - 0.5) * 0.02;` | `src/components/voice/overlay/FloatingParticles.tsx` |
| `p.vy += (Math.random() - 0.5) * 0.02;` | `src/components/voice/overlay/FloatingParticles.tsx` |
| `? 0.55 + barOffsets[i] * 0.5` | `src/components/voice/overlay/VoiceVisualEffects.tsx` |
| `const waveOffset = Math.sin(angle * (3 + w) + w * 1.5) * amplitude * (1 + w * 0.25);` | `src/components/voice/overlay/VoiceVisualEffects.tsx` |
| `delay: isSpeaking ? i * 0.08 : i * 0.05,` | `src/components/voice/overlay/VoiceVisualEffects.tsx` |
| `dist: radius * 0.4 + rand() * radius * 0.65,` | `src/components/voice/overlay/VoiceVisualEffects.tsx` |
| `return Array.from({ length: barCount }).map(() => rand() * 0.25);` | `src/components/voice/overlay/VoiceVisualEffects.tsx` |
| `transition={{ duration: 1.2 + (i % 4) * 0.3, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}` | `src/components/voice/overlay/VoiceVisualEffects.tsx` |
| `transition={{ duration: 2.5 + w * 0.6, repeat: Infinity, ease: 'easeInOut' }}` | `src/components/voice/overlay/VoiceVisualEffects.tsx` |
| `const score = (avgSatisfaction * 4) + (avgPerformance * 4) + (completionRate * 0.2);` | `src/hooks/useAgentRanking.ts` |
| `case 'urgent': playBeep(currentTime, frequency); playBeep(currentTime + beepDuration + gapDuration, frequency * 0.75); playBeep(currentTime + 2 * (beepDuration …` | `src/hooks/useCriticalAlertNotifications.ts` |
| `score = 0.3 + pattern.answer_rate * 0.4;` | `src/lib/outbound-scoring.ts` |
| `targetAbandonRate: number; // percentual, ex: 3 = 3%` | `src/lib/dialer/predictive-pace.ts` |
| `Webhooks, REST e edge functions abertas. Fale com a equipe — 80% das integrações` | `src/pages/Marketplace.tsx` |
| `Meta Anatel: abandono &lt; 3%.` | `src/pages/PredictiveDialer.tsx` |
| `SLA contratual: 99,9% mensal. Métricas alimentadas diretamente pelos health checks internos —` | `src/pages/Status.tsx` |
| `recencyScore * 0.2 + sentimentScore * 0.25 + momentScore * 0.25 +` | `supabase/functions/compute-deal-health/index.ts` |
| `satScore * 0.15 + probabilityScore * 0.15` | `supabase/functions/compute-deal-health/index.ts` |
| `const TARGET_SL = 0.8; // 80% atendidas em 30s` | `supabase/functions/forecast-call-volume/index.ts` |
| `const composite = (prob * 0.7) + (health * 0.3);` | `supabase/functions/forecast-deals/index.ts` |
| `// Alvo de 100%: qualquer falha esgota o budget.` | `supabase/functions/health-check/slo-budget.ts` |
| `score = 0.3 + pattern.answer_rate * 0.4;` | `supabase/functions/score-call-attempt/index.ts` |
| `// 0% alertas = 100, 10%+ = 0` | `supabase/functions/voip-executive-summary/index.ts` |
| `// linear entre 60% e 100% do cap` | `supabase/functions/voip-executive-summary/index.ts` |
| `const ratio = (peakConcurrent - CONCURRENT_CAP * 0.6) / (CONCURRENT_CAP * 0.4);` | `supabase/functions/voip-executive-summary/index.ts` |
| `if (peakConcurrent <= CONCURRENT_CAP * 0.6) return 100;` | `supabase/functions/voip-executive-summary/index.ts` |
| `mos_avg: 4.2 + (Math.random() * 0.5),` | `supabase/functions/voip-load-test/index.ts` |
| `const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));` | `supabase/functions/voip-quality-heatmap/index.ts` |
| `} else if (ctx.peakConcurrent >= CONCURRENT_CAP * 0.8) {` | `supabase/functions/voip-recommendations/index.ts` |

## H. Parâmetros de negócio (constantes, prazos, limites)

### H.1 Constantes

| Constante | Valor | Arquivo |
|---|---|---|
| `PREVIEW_TEXT` | `'Assistente de voz pronto para discar.'` | `src/components/dialer/phone/VoicePreferencesPanel.tsx` |
| `SEVEN_DAYS_MS` | `7` | `src/components/executive/AgentAssistDashboardCard.tsx` |
| `DATE_MASK` | `"dd/MM/yyyy '` | `src/components/knowledge/ArticleHistoryCard.tsx` |
| `SNOOZE_HOURS` | `24` | `src/components/network/VoipRecommendationsPanel.tsx` |
| `AUTO_APPLY_DELAY_MS` | `3000` | `src/components/network/VoipRecommendationsPanel.tsx` |
| `MAX_HISTORY` | `5` | `src/components/network/VoipVoiceQAPanel.tsx` |
| `NONE` | `'__none__'` | `src/components/queues/QueueAudioSlotSelect.tsx` |
| `NO_OVERFLOW` | `'__none__'` | `src/components/queues/QueueFormDialog.tsx` |
| `SIDEBAR_COOKIE_MAX_AGE` | `60` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH` | `"16rem"` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH_MOBILE` | `"18rem"` | `src/components/ui/sidebar.tsx` |
| `CONNECTION_DIST` | `120` | `src/components/voice/overlay/FloatingParticles.tsx` |
| `SIZE` | `220` | `src/components/voice/overlay/VoiceOrb.tsx` |
| `REAUTH_TIMEOUT_MS` | `5` | `src/contexts/ReauthContext.tsx` |
| `UNSIGNED` | `"unsigned"` | `src/contexts/ReauthContext.tsx` |
| `MOBILE_BREAKPOINT` | `768` | `src/hooks/use-mobile.tsx` |
| `TOAST_LIMIT` | `1` | `src/hooks/use-toast.ts` |
| `TOAST_REMOVE_DELAY` | `1000000` | `src/hooks/use-toast.ts` |
| `HISTORY_LIMIT` | `20` | `src/hooks/useAccountJourney.ts` |
| `ACCOUNTS_PAGE_SIZE` | `50` | `src/hooks/useAccounts.ts` |
| `ACTIVE_ROWS_LIMIT` | `200` | `src/hooks/useActiveCallsRealtime.ts` |
| `ALL_SOURCES` | `"__all__"` | `src/hooks/useAlertPresets.ts` |
| `ALL_SOURCES` | `"__all__"` | `src/hooks/useAlertsExport.ts` |
| `CHUNK` | `1000` | `src/hooks/useAlertsExport.ts` |
| `MAX_ROWS` | `20000` | `src/hooks/useAlertsExport.ts` |
| `BUCKET` | `'avatars'` | `src/hooks/useAvatar.ts` |
| `MAX_BYTES` | `2` | `src/hooks/useAvatar.ts` |
| `CADENCES_PAGE_SIZE` | `50` | `src/hooks/useCadences.ts` |
| `PAGE_SIZE` | `50` | `src/hooks/useCallHistory.ts` |
| `RECORDINGS_LIMIT` | `200` | `src/hooks/useCallRecording.ts` |
| `CLIENT_ERRORS_PAGE_SIZE` | `25` | `src/hooks/useClientErrors.ts` |
| `CONTACTS_PAGE_SIZE` | `50` | `src/hooks/useContacts.ts` |
| `DEALS_PAGE_SIZE` | `50` | `src/hooks/useDeals.ts` |
| `MAX_FAVORITES` | `12` | `src/hooks/useDialerFavorites.ts` |
| `KB_ARTICLE_HISTORY_LIMIT` | `20` | `src/hooks/useKbArticleHistory.ts` |
| `ANALYSIS_THROTTLE_MS` | `5000` | `src/hooks/useLiveAssist.ts` |
| `MIN_NEW_WORDS` | `30` | `src/hooks/useLiveAssist.ts` |
| `ALPHABET` | `'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'` | `src/hooks/useMFA.ts` |
| `MAX_SIMULTANEOUS_CALLS` | `3` | `src/hooks/useMultiChannelCall.ts` |
| `PING_INTERVAL_MS` | `10000` | `src/hooks/useNetworkMonitor.ts` |
| `PING_TIMEOUT_MS` | `5000` | `src/hooks/useNetworkMonitor.ts` |
| `LATENCY_OK` | `150` | `src/hooks/useNetworkMonitor.ts` |
| `LATENCY_UNSTABLE` | `400` | `src/hooks/useNetworkMonitor.ts` |
| `COLUNAS_TRONCO` | `'id, trunk_id, duration_seconds, was_failover, created_at'` | `src/hooks/useQualityMetrics.ts` |
| `BUCKET` | `'queue-audio'` | `src/hooks/useQueueAudioPrompts.ts` |
| `SAFETY_POLL_MS` | `60` | `src/hooks/useQueueMetrics.ts` |
| `REALTIME_DEBOUNCE_MS` | `1` | `src/hooks/useQueueMetrics.ts` |
| `GOAL_NOTIFY_COOLDOWN_MS` | `15` | `src/hooks/useQueueMetrics.ts` |
| `PAGE_SIZE` | `50` | `src/hooks/useRecordings.ts` |
| `REDACTION_LOG_LIMIT` | `50` | `src/hooks/useRedactionLog.ts` |
| `SLA_VIOLATIONS_PAGE_SIZE` | `20` | `src/hooks/useSLA.ts` |
| `ALL_SOURCES` | `"__all__"` | `src/hooks/useSecurityAlertNotifications.ts` |
| `PAGE_SIZE` | `50` | `src/hooks/useSecurityAlertNotifications.ts` |
| `SESSION_DURATION_HOURS` | `24` | `src/hooks/useSessionManager.ts` |
| `REFRESH_THRESHOLD_MINUTES` | `30` | `src/hooks/useSessionManager.ts` |
| `SURVEY_COLUMNS` | `'id, name, survey_type, description, questions, is_active'` | `src/hooks/useSurveys.ts` |
| `COLLECT_INTERVAL_MS` | `2000` | `src/hooks/useVoipQualityMonitor.ts` |
| `MAX_DEVICE_LABEL_LENGTH` | `60` | `src/lib/device-identity.ts` |
| `FALLBACK_DEVICE_LABEL` | `'Dispositivo desconhecido'` | `src/lib/device-identity.ts` |
| `MAX_TAG_LENGTH` | `24` | `src/lib/dialer-favorite-tags.ts` |
| `UNTAGGED_LABEL` | `'Sem etiqueta'` | `src/lib/dialer-favorite-tags.ts` |
| `ALL_TAGS_FILTER` | `'__all__'` | `src/lib/dialer-favorite-tags.ts` |
| `UNTAGGED_FILTER` | `'__untagged__'` | `src/lib/dialer-favorite-tags.ts` |
| `ANONYMOUS_SCOPE` | `'anon'` | `src/lib/dialer-filter-storage.ts` |
| `MAX_BUFFER` | `20` | `src/lib/error-tracking.ts` |
| `CLIENT_ERROR_MESSAGE_MAX` | `1000` | `src/lib/errorReporter.ts` |
| `CLIENT_ERROR_STACK_MAX` | `4000` | `src/lib/errorReporter.ts` |
| `CLIENT_ERROR_USER_AGENT_MAX` | `500` | `src/lib/errorReporter.ts` |
| `CLIENT_ERROR_CORRELATION_MAX` | `100` | `src/lib/errorReporter.ts` |
| `DEDUPE_WINDOW_MS` | `60` | `src/lib/errorReporter.ts` |
| `RATE_WINDOW_MS` | `60` | `src/lib/errorReporter.ts` |
| `RATE_MAX_PER_WINDOW` | `10` | `src/lib/errorReporter.ts` |
| `MASK_VISIBLE_DIGITS` | `4` | `src/lib/favorite-sync-labels.ts` |
| `RING_ON_MS` | `1000` | `src/lib/incoming-call-alert.ts` |
| `RING_CYCLE_MS` | `5000` | `src/lib/incoming-call-alert.ts` |
| `MAX_ITEMS` | `20` | `src/lib/pendingCallWrites.ts` |
| `MIN_VOLUME` | `0` | `src/lib/ringtone-presets.ts` |
| `MAX_VOLUME` | `1` | `src/lib/ringtone-presets.ts` |
| `DEFAULT_VOLUME` | `0.12` | `src/lib/ringtone-presets.ts` |
| `MAX_PRESETS` | `20` | `src/lib/security-alerts-presets.ts` |
| `MAX_ENTRIES` | `20` | `src/lib/security-alerts-webhook-history.ts` |
| `RESPONSE_SNIPPET_MAX` | `500` | `src/lib/security-alerts-webhook-history.ts` |
| `MAX_QUEUE` | `50` | `src/lib/security-alerts-webhook-queue.ts` |
| `WEBHOOK_QUEUE_FLUSH_EVENT` | `"lovable:webhook-queue-flush"` | `src/lib/security-alerts-webhook-queue.ts` |
| `WEBHOOK_MAX_ATTEMPTS_MIN` | `1` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_MAX_ATTEMPTS_MAX` | `6` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_MAX_ATTEMPTS_DEFAULT` | `3` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_BASE_DELAY_MIN` | `50` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_BASE_DELAY_MAX` | `10` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_BASE_DELAY_DEFAULT` | `400` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_MAX_DELAY_MIN` | `100` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_MAX_DELAY_MAX` | `60` | `src/lib/security-alerts-webhook.ts` |
| `WEBHOOK_MAX_DELAY_DEFAULT` | `5` | `src/lib/security-alerts-webhook.ts` |
| `SESSION_EXPIRED_EVENT` | `'app:session-expired'` | `src/lib/session-expiry.ts` |
| `MAX_SYNC_HISTORY_ENTRIES` | `12` | `src/lib/sync-history.ts` |
| `TRACE_HEADER` | `'x-request-id'` | `src/lib/tracing.ts` |
| `TRACE_OP_HEADER` | `'x-trace-operation'` | `src/lib/tracing.ts` |
| `VECTOR_DIM` | `64` | `src/lib/voice-biometrics.ts` |
| `FFT_SIZE` | `1024` | `src/lib/voice-biometrics.ts` |
| `SAMPLE_DURATION_MS` | `4000` | `src/lib/voice-biometrics.ts` |
| `MAX_HISTORY_ENTRIES` | `6` | `src/lib/voice-command-history.ts` |
| `MAX_COMMAND_LENGTH` | `120` | `src/lib/voice-command-history.ts` |
| `MIN_TTS_RATE` | `0.5` | `src/lib/voice-preferences.ts` |
| `MAX_TTS_RATE` | `2` | `src/lib/voice-preferences.ts` |
| `MAX_VOICE_URI_LENGTH` | `160` | `src/lib/voice-preferences.ts` |
| `CHECK_INTERVAL_MS` | `24` | `src/lib/voipProactiveSnapshot.ts` |
| `WINDOW_MS` | `2` | `src/lib/voipRecommendationCoaching.ts` |
| `MOS_DELTA_THRESHOLD` | `0.2` | `src/lib/voipRecommendationCoaching.ts` |
| `MAX_BUFFER` | `100` | `src/lib/web-vitals.ts` |
| `SPARK_HOURS` | `24` | `src/lib/webhook-health-utils.ts` |
| `AUTO_REFRESH_MS` | `30` | `src/lib/webhook-health-utils.ts` |
| `MIN_DIGITOS` | `8` | `src/lib/dnc/reconcile.ts` |
| `LOTE_CONSULTA` | `200` | `src/lib/dnc/reconcile.ts` |
| `BOM` | `'\uFEFF'` | `src/lib/export/index.ts` |
| `DEFAULT_ROTATION_INTERVAL_DAYS` | `90` | `src/lib/security/api-key-rotation.ts` |
| `PAGE_SIZE` | `20` | `src/pages/CallLibrary.tsx` |
| `DEFAULT_PAGE_SIZE` | `24` | `src/pages/Contacts.tsx` |
| `DAYS` | `90` | `src/pages/Status.tsx` |
| `ALL_SOURCES` | `"__all__"` | `src/pages/admin/SecurityAlerts.tsx` |
| `PAGE_SIZE` | `25` | `src/pages/roles/RoleAuditTrail.tsx` |
| `PROMPT_TEXT_MAX` | `20` | `supabase/functions/_shared/ai-body-schemas.ts` |
| `UTTERANCE_TEXT_MAX` | `5` | `supabase/functions/_shared/ai-body-schemas.ts` |
| `VOICE_COMMAND_TEXT_MAX` | `4` | `supabase/functions/_shared/ai-body-schemas.ts` |
| `ID_MAX` | `100` | `supabase/functions/_shared/ai-body-schemas.ts` |
| `MINUTE_MS` | `60` | `supabase/functions/_shared/business-hours.ts` |
| `MAX_ITERATIONS` | `400` | `supabase/functions/_shared/business-hours.ts` |
| `SEGREDO_CRON_FILA_CRM` | `'crm_sync_cron_token'` | `supabase/functions/_shared/cron-db-token.ts` |
| `TAMANHO_PAGINA` | `1000` | `supabase/functions/_shared/digest.ts` |
| `LIMITE_POR_USUARIO` | `50` | `supabase/functions/_shared/digest.ts` |
| `TAMANHO_LOTE` | `200` | `supabase/functions/_shared/digest.ts` |
| `HORAS_DIARIO` | `24` | `supabase/functions/_shared/digest.ts` |
| `HORAS_SEMANAL` | `168` | `supabase/functions/_shared/digest.ts` |
| `GENERIC_INTERNAL_MESSAGE` | `"Erro interno"` | `supabase/functions/_shared/errors.ts` |
| `IPV4_BYTES` | `4` | `supabase/functions/_shared/ip-range.ts` |
| `IPV6_BYTES` | `16` | `supabase/functions/_shared/ip-range.ts` |
| `DEFAULT_FETCH_TIMEOUT_MS` | `15` | `supabase/functions/_shared/resilience.ts` |
| `DEFAULT_THRESHOLD` | `0.7` | `supabase/functions/chatbot-respond/index.ts` |
| `MODEL` | `'google/gemini-2.5-flash'` | `supabase/functions/chatbot-respond/index.ts` |
| `RETENCAO_DIAS` | `180` | `supabase/functions/cleanup-recordings/index.ts` |
| `BATCH` | `100` | `supabase/functions/cleanup-recordings/index.ts` |
| `PAGE_SIZE` | `1000` | `supabase/functions/data-lake-flush/index.ts` |
| `MAX_TEXT` | `20` | `supabase/functions/embed-kb-article/index.ts` |
| `AHT` | `240` | `supabase/functions/forecast-call-volume/index.ts` |
| `TARGET_SL` | `0.8` | `supabase/functions/forecast-call-volume/index.ts` |
| `SCORE_THRESHOLD` | `3.0` | `supabase/functions/generate-coaching-track/track-engine.ts` |
| `MIN_SAMPLES` | `3` | `supabase/functions/generate-coaching-track/track-engine.ts` |
| `WINDOW_DAYS` | `14` | `supabase/functions/generate-coaching-track/track-engine.ts` |
| `DEFAULT_MIN_SAMPLES` | `10` | `supabase/functions/health-check/slo-budget.ts` |
| `MAX_ENTRIES` | `5000` | `supabase/functions/ldap-sync/index.ts` |
| `LDAP_TIMEOUT_MS` | `15000` | `supabase/functions/ldap-sync/index.ts` |
| `PRAZO_EMAIL_MS` | `8` | `supabase/functions/notify-blocked-ip/index.ts` |
| `PRAZO_EMAIL_MS` | `8` | `supabase/functions/notify-new-device/index.ts` |
| `MAX_FAX_BYTES` | `20` | `supabase/functions/ocr-virtual-fax/index.ts` |
| `ITENS_POR_EXECUCAO` | `50` | `supabase/functions/sync-crm-queue/index.ts` |
| `MAX_AUDIO_BYTES` | `25` | `supabase/functions/transcribe-recording/index.ts` |
| `CONCURRENT_CAP` | `3` | `supabase/functions/voip-capacity-forecast/index.ts` |
| `AI_GATEWAY` | `'https://openrouter.ai/api/v1/chat/completions'` | `supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| `MODEL` | `'google/gemini-2.5-flash'` | `supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| `AI_GATEWAY` | `'https://openrouter.ai/api/v1/chat/completions'` | `supabase/functions/voip-executive-narrative/index.ts` |
| `MODEL` | `'google/gemini-2.5-flash'` | `supabase/functions/voip-executive-narrative/index.ts` |
| `CONCURRENT_CAP` | `3` | `supabase/functions/voip-executive-summary/index.ts` |
| `MOS_RISK_THRESHOLD` | `3.5` | `supabase/functions/voip-quality-forecast/index.ts` |
| `EFFECTIVENESS_WINDOW_MS` | `2` | `supabase/functions/voip-recommendation-insights/index.ts` |
| `BASELINE_DAYS` | `7` | `supabase/functions/voip-recommendation-simulate/index.ts` |
| `CONCURRENT_CAP` | `3` | `supabase/functions/voip-recommendations/index.ts` |

### H.2 Prazos, expirações e janelas de tempo

| Trecho | Arquivo |
|---|---|
| `timeout: 180_000,` | `playwright.config.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/App.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/App.tsx` |
| `date = addHours(new Date(), 1);` | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `date = addHours(new Date(), 3);` | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `date = setMinutes(setHours(addDays(new Date(), 1), 10), 0);` | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `date = setMinutes(setHours(addDays(new Date(), 7), 10), 0);` | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `scheduled_time: format(addHours(new Date(), 1), 'HH:mm'),` | `src/components/callbacks/ScheduleCallbackDialog.tsx` |
| `await new Promise(r => setTimeout(r, 3000));` | `src/components/calls/UnifiedSoftphone.tsx` |
| `setTimeout(() => clearInterval(check), 30000);` | `src/components/calls/UnifiedSoftphone.tsx` |
| `const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;` | `src/components/executive/AgentAssistDashboardCard.tsx` |
| `const since = subDays(new Date(), 7).toISOString();` | `src/components/executive/ConversationIntelligenceCard.tsx` |
| `const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/components/executive/MultilingualDashboardCard.tsx` |
| `const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/components/executive/OutboundComplianceCard.tsx` |
| `.lte('scheduled_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())` | `src/components/executive/PendingFollowupsCard.tsx` |
| `setTimeout(() => URL.revokeObjectURL(url), 1000);` | `src/components/financial/AgentFinancialLeaderboard.tsx` |
| `const timer = setTimeout(() => { handleClose(); }, 5000);` | `src/components/gamification/AchievementCelebration.tsx` |
| `const timer = setTimeout(() => setOpen(true), 2000);` | `src/components/layout/OnboardingWizard.tsx` |
| `window.setTimeout(() => finish(0), 5000);` | `src/components/queues/QueueAudioLibrary.tsx` |
| `const timer = window.setTimeout(() => setBootingTimedOut(true), 10000);` | `src/components/voice/VoiceAssistantDialog.tsx` |
| `export const REAUTH_TIMEOUT_MS = 5 * 60 * 1000;` | `src/contexts/ReauthContext.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useAgentFinancialLeaderboard.ts` |
| `const startDate = subDays(endDate, 6);` | `src/hooks/useAgentRanking.ts` |
| `ended_at: status === 'completed' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + durationSeconds * 1000).toISOString() : null,` | `src/hooks/useAgentRanking.ts` |
| `started_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),` | `src/hooks/useAgentRanking.ts` |
| `from: subDays(new Date(), 7),` | `src/hooks/useAlertHistory.ts` |
| `await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));` | `src/hooks/useBitrix.ts` |
| `case '3months': return subMonths(now, 3);` | `src/hooks/useCallAnalytics.ts` |
| `case 'month': return subMonths(now, 1);` | `src/hooks/useCallAnalytics.ts` |
| `case 'week': return subWeeks(now, 1);` | `src/hooks/useCallAnalytics.ts` |
| `const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));` | `src/hooks/useCallAnalytics.ts` |
| `case 'month': return { from: subMonths(now, 1), to: now };` | `src/hooks/useCallHistory.ts` |
| `case 'week': return { from: subWeeks(now, 1), to: now };` | `src/hooks/useCallHistory.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useCallPark.ts` |
| `gcTime: 5 * 60 * 1000,` | `src/hooks/useCallPark.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCallPark.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useCallQueues.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCallQueues.ts` |
| `const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useClientErrors.ts` |
| `if (alert.severity !== 'critical') setTimeout(() => notification.close(), 10000);` | `src/hooks/useCriticalAlertNotifications.ts` |
| `const start = new Date(now.getTime() - Math.max(days - 1, 0) * 24 * 60 * 60 * 1000);` | `src/hooks/useDealPipelineTrend.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDealPipelineTrend.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useDialerFavorites.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDialerFavorites.ts` |
| `case 'month': return subDays(new Date(), 30);` | `src/hooks/useExecutiveDashboard.ts` |
| `case 'week': return subDays(new Date(), 7);` | `src/hooks/useExecutiveDashboard.ts` |
| `const days = eachDayOfInterval({ start: subDays(now, 6), end: now });` | `src/hooks/useExecutiveDashboard.ts` |
| `const last7 = sessions.filter(s => new Date(s.created_at) >= subDays(now, 7)).length;` | `src/hooks/useExecutiveDashboard.ts` |
| `const prev7 = sessions.filter(s => new Date(s.created_at) >= subDays(now, 14) && new Date(s.created_at) < subDays(now, 7)).length;` | `src/hooks/useExecutiveDashboard.ts` |
| `default: return subDays(new Date(), 7);` | `src/hooks/useExecutiveDashboard.ts` |
| `const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useExtensionsOverview.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useFinancialImpact.ts` |
| `const timer = setTimeout(() => settle(() => { throw new Error('Timeout'); }), 5000);` | `src/hooks/useHealthCheck.ts` |
| `if (alert.severity !== 'critical') setTimeout(() => n.close(), 10000);` | `src/hooks/useHoldReminder.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useOptimisticLockConflicts.ts` |
| `dialerIntervalRef.current = setTimeout(dial, 2000);` | `src/hooks/usePredictiveDialer.ts` |
| `nextAttempt = new Date(Date.now() + 60 * 60 * 1000).toISOString();` | `src/hooks/usePredictiveDialer.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useQueueAudioPrompts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useQueueAudioPrompts.ts` |
| `const GOAL_NOTIFY_COOLDOWN_MS = 15 * 60 * 1000;` | `src/hooks/useQueueMetrics.ts` |
| `const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();` | `src/hooks/useQueueMetrics.ts` |
| `setTimeout(() => notification.close(), 10000);` | `src/hooks/useRealtimeHoldAlerts.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useRingGroups.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useRingGroups.ts` |
| `const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useSLA.ts` |
| `const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useSLA.ts` |
| `const nextHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();` | `src/hooks/useScheduledCallbacks.ts` |
| `() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),` | `src/hooks/useSecurityAlertNotifications.ts` |
| `const start = subDays(today, 29);` | `src/hooks/useSecurityAlertNotifications.ts` |
| `const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);` | `src/hooks/useSecurityMonitoringData.ts` |
| `setTimeout(() => notification.close(), 10000);` | `src/hooks/useSecurityNotifications.ts` |
| `const interval = setInterval(updateActivity, 5 * 60 * 1000);` | `src/hooks/useSessionManager.ts` |
| `await new Promise(resolve => setTimeout(resolve, 2000));` | `src/hooks/useSipCall.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useTrunkMetrics.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useUnreadConflicts.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useVoipExecutiveNarrative.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useVoipExecutiveNarrative.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useVoipExecutiveSummary.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useVoipExecutiveSummary.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useVoipQualityAlertsSummary.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useVoipQualityAlertsSummary.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useVoipRecommendationHistory.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useVoipRecommendationHistory.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useVoipRecommendationInsights.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useVoipRecommendationInsights.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useVoipRecommendations.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useVoipRecommendations.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useVoipTrunks.ts` |
| `expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes` | `src/hooks/useWebAuthn.ts` |
| `const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();` | `src/hooks/useWebhookHealthData.ts` |
| `setTimeout(() => URL.revokeObjectURL(url), 1000);` | `src/lib/security-alerts-webhook-history.ts` |
| `setTimeout(trigger, 1500);` | `src/lib/security-alerts-webhook-queue.ts` |
| `const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h` | `src/lib/voipProactiveSnapshot.ts` |
| `const WINDOW_MS = 2 * 60 * 60 * 1000; // 2h` | `src/lib/voipRecommendationCoaching.ts` |
| `const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);` | `src/lib/webhook-health-utils.ts` |
| `Math.ceil((nextRotation.getTime() - Date.now()) / (1000 * 60 * 60 * 24))` | `src/lib/security/api-key-rotation.ts` |
| `maxAge: 86400,` | `src/lib/security/cors-config.ts` |
| `maxAge: 31536000, // 1 year` | `src/lib/security/hsts-headers.ts` |
| `return 30 * 60 * 1000; // 30 minutes default` | `src/lib/session/index.ts` |
| `timeout: 60000,` | `src/lib/webauthn/webauthn-utils.ts` |
| `setTimeout(() => URL.revokeObjectURL(url), 1000);` | `src/pages/FinancialImpact.tsx` |
| `from: subDays(new Date(), 7),` | `src/pages/HoldAlerts.tsx` |
| `const timeout = setTimeout(resolve, 5000);` | `src/pages/NetworkDiagnostics.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/pages/QRProvisioning.tsx` |
| `setTimeout(() => { navigate('/login'); }, 3000);` | `src/pages/ResetPassword.tsx` |
| `const interval = setInterval(load, 5 * 60 * 1000);` | `src/pages/Status.tsx` |
| `setTimeout(() => { navigate('/'); }, 3000);` | `src/pages/VerifyEmail.tsx` |
| `setTimeout(() => setCopiedId(null), 2000);` | `src/pages/VideoConference.tsx` |
| `sinceIso: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),` | `src/pages/admin/SecurityAlerts.tsx` |
| `const sinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();` | `src/pages/admin/SecurityAuditDashboard.tsx` |
| `return new Date(agora - horas * 60 * 60 * 1000).toISOString();` | `supabase/functions/_shared/digest.ts` |
| `z.number().finite().min(0).max(24 * 60 * 60 * 1000 * 365);` | `supabase/functions/_shared/numeric-schemas.ts` |
| `const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();` | `supabase/functions/check-goals/index.ts` |
| `const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();` | `supabase/functions/check-goals/index.ts` |
| `const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);` | `supabase/functions/check-queue-metrics/index.ts` |
| `const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);` | `supabase/functions/check-queue-metrics/index.ts` |
| `const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/database-cleanup/index.ts` |
| `const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/database-cleanup/index.ts` |
| `const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/database-cleanup/index.ts` |
| `const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/generate-coaching-track/index.ts` |
| `const dueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/generate-coaching-track/track-engine.ts` |
| `expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()` | `supabase/functions/request-password-reset/index.ts` |
| `const EFFECTIVENESS_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h` | `supabase/functions/voip-recommendation-insights/index.ts` |
| `const timeout = setTimeout(() => ctrl.abort(), 4000);` | `supabase/functions/voip-trunks-healthcheck/index.ts` |
| `const t = setTimeout(() => { ws.close(); resolve(); }, 3000);` | `supabase/functions/voip-trunks-manage/index.ts` |
| `expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),` | `supabase/functions/webauthn-challenge/index.ts` |
| `AND created_at > now() - interval '10 minutes';` | `supabase/migrations/20251225192806_31f73fb3-ef04-442d-b4bd-cc6cce94cdb8.sql` |
| `AND created_at > now() - interval '5 minutes';` | `supabase/migrations/20251225192806_31f73fb3-ef04-442d-b4bd-cc6cce94cdb8.sql` |
| `expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),` | `supabase/migrations/20251231131323_f5848ea5-ae7d-4e46-ac63-aba88d5f35bc.sql` |
| `AND created_at > now() - interval '1 hour'` | `supabase/migrations/20260418143532_ce6a3be9-4e9b-4d97-85ba-276c8ee1354c.sql` |
| `SELECT date_trunc('hour', now() - interval '23 hours') as h` | `supabase/migrations/20260507210817_17861cb9-6603-40aa-841e-9a130923b865.sql` |
| `SELECT h + interval '1 hour'` | `supabase/migrations/20260507210817_17861cb9-6603-40aa-841e-9a130923b865.sql` |
| `WHERE started_at >= now() - interval '24 hours'` | `supabase/migrations/20260507210817_17861cb9-6603-40aa-841e-9a130923b865.sql` |
| `WHERE created_at < now() - interval '90 days';` | `supabase/migrations/20260515172829_e3c28053-3fce-46b7-89d5-fee835d0b1de.sql` |
| `DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';` | `supabase/migrations/20260516121853_6c77ecf2-fa8d-4077-af53-504bb6ba9577.sql` |
| `DELETE FROM public.performance_metrics WHERE created_at < now() - interval '30 days';` | `supabase/migrations/20260516121853_6c77ecf2-fa8d-4077-af53-504bb6ba9577.sql` |
| `WHERE started_at > now() - interval '90 days'` | `supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql` |
| `WHERE status = 'won' AND updated_at > now() - interval '90 days'` | `supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql` |
| `expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),` | `supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql` |
| `DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';` | `supabase/migrations/20260711184851_d9161e14-4b44-49da-a117-f0770fc40585.sql` |
| `DELETE FROM public.call_quality_metrics WHERE created_at < now() - interval '90 days';` | `supabase/migrations/20260711184851_d9161e14-4b44-49da-a117-f0770fc40585.sql` |
| `DELETE FROM public.performance_metrics WHERE created_at < now() - interval '30 days';` | `supabase/migrations/20260711184851_d9161e14-4b44-49da-a117-f0770fc40585.sql` |
| `DELETE FROM public.rate_limit_logs WHERE created_at < now() - interval '7 days';` | `supabase/migrations/20260711184851_d9161e14-4b44-49da-a117-f0770fc40585.sql` |
| `AND created_at > now() - interval '7 days'` | `supabase/migrations/20260712110237_ae094d69-c026-433d-b7b1-232eb615e4cd.sql` |
| `AND created_at > now() - interval '30 days'` | `supabase/migrations/20260712112627_4ad8101d-5e02-4b1c-a570-f8338fc90f70.sql` |
| `AND started_at > now() - interval '1 hour';` | `supabase/migrations/20260722213602_011fe9c6-e570-4180-be7a-d9a276c66f2e.sql` |
| `WHERE started_at > now() - interval '15 minutes';` | `supabase/migrations/20260722213602_011fe9c6-e570-4180-be7a-d9a276c66f2e.sql` |
| `AND created_at > now() - interval '14 days';` | `supabase/migrations/20260722213827_7ee185db-587f-4046-8507-474be04327a8.sql` |
| `'host=%s port=5432 dbname=postgres user=optimistic_lock_writer password=%s sslmode=require connect_timeout=5',` | `supabase/migrations/20261122210000_optimistic_lock_audit_survives_rollback.sql` |
| `AND now() - lr.start_time > GREATEST(interval '2 hours', make_interval(mins => (c.every_minutes * 3)::int))` | `supabase/migrations/20261126170000_cron_watchdog.sql` |
| `DELETE FROM cron.job_run_details WHERE start_time < now() - interval '30 days';` | `supabase/migrations/20261126170000_cron_watchdog.sql` |
| `ELSE interval '6 hours'` | `supabase/migrations/20261126170000_cron_watchdog.sql` |
| `WHEN v_row.state = 'nunca_executou' THEN interval '24 hours'` | `supabase/migrations/20261126170000_cron_watchdog.sql` |
| `WHERE d.start_time > now() - interval '14 days'` | `supabase/migrations/20261126170000_cron_watchdog.sql` |
| `WHERE d.start_time > now() - interval '24 hours'` | `supabase/migrations/20261126170000_cron_watchdog.sql` |

### H.3 Limites de paginação

| Limite | Arquivo |
|---|---|
| 1 | `src/components/call-history/CallDetailDialog.tsx` |
| 200 | `src/components/compliance/ConsentHistoryViewer.tsx` |
| 50 | `src/components/compliance/DNCImportLogs.tsx` |
| 8 | `src/components/executive/PendingFollowupsCard.tsx` |
| 20 | `src/components/executive/QualityTrunkDashboard.tsx` |
| 50 | `src/components/executive/QualityTrunkDashboard.tsx` |
| 5000 | `src/components/network/AgentQualityRanking.tsx` |
| 20 | `src/components/network/QualityAlertsCard.tsx` |
| 100 | `src/components/notification-center/useNotificationCenter.ts` |
| 1 | `src/components/queue-alerts/useQueueMetricsSettings.ts` |
| 30 | `src/components/settings/BitrixSyncStatus.tsx` |
| 10 | `src/components/settings/SystemLogs.tsx` |
| 1 | `src/hooks/useAlerts.ts` |
| 50 | `src/hooks/useBestTimeToContact.ts` |
| 200 | `src/hooks/useConsent.ts` |
| 50 | `src/hooks/useContactAlerts.ts` |
| 200 | `src/hooks/useConversations.ts` |
| 500 | `src/hooks/useConversations.ts` |
| 10 | `src/hooks/useDashboardData.ts` |
| 30 | `src/hooks/useDataLakeExports.ts` |
| 20 | `src/hooks/useExtensionAuditHistory.ts` |
| 1 | `src/hooks/useGeoBlocking.ts` |
| 50 | `src/hooks/useGeoBlocking.ts` |
| 1 | `src/hooks/useHealthCheck.ts` |
| 1 | `src/hooks/useHoldSoundAlert.ts` |
| 100 | `src/hooks/useIPWhitelist.ts` |
| 200 | `src/hooks/useKnowledgeBase.ts` |
| 50 | `src/hooks/useLiveAssist.ts` |
| 100 | `src/hooks/useMeetingSummary.ts` |
| 1 | `src/hooks/useMultiChannelCall.ts` |
| 50 | `src/hooks/useNotifications.ts` |
| 1000 | `src/hooks/useOptimisticLockConflicts.ts` |
| 50 | `src/hooks/useQualityMetrics.ts` |
| 100 | `src/hooks/useRateLimitData.ts` |
| 50 | `src/hooks/useRateLimitData.ts` |
| 2000 | `src/hooks/useSLA.ts` |
| 5000 | `src/hooks/useSecurityAlertNotifications.ts` |
| 5 | `src/hooks/useSecurityDashboard.ts` |
| 20 | `src/hooks/useSecurityMonitoringData.ts` |
| 50 | `src/hooks/useSecurityMonitoringData.ts` |
| 50 | `src/hooks/useShiftSwapSuggestions.ts` |
| 20 | `src/hooks/useSupervisorPanel.ts` |
| 200 | `src/hooks/useSurveys.ts` |
| 500 | `src/hooks/useTrackers.ts` |
| 1 | `src/hooks/useVoipMonitoringSettings.ts` |
| 10000 | `src/hooks/useWebhookHealthData.ts` |
| 200 | `src/lib/voipRecommendationCoaching.ts` |
| 500 | `src/pages/AuditLogs.tsx` |
| 1 | `src/pages/HoldAlertSettings.tsx` |
| 20 | `src/pages/NetworkDiagnostics.tsx` |
| 100 | `src/pages/Scorecards.tsx` |
| 50 | `src/pages/Scorecards.tsx` |
| 100 | `src/pages/SecurityMonitoring.tsx` |
| 20000 | `src/pages/Status.tsx` |
| 100 | `src/pages/TopicDetection.tsx` |
| 20 | `src/pages/TopicDetection.tsx` |
| 50 | `src/pages/TopicDetection.tsx` |
| 200 | `src/pages/TranslationCenter.tsx` |
| 20 | `src/pages/admin/DatabaseHealth.tsx` |
| 1000 | `src/pages/admin/SecurityAuditDashboard.tsx` |
| 200 | `src/pages/admin/SecurityAuditDashboard.tsx` |
| 500 | `src/pages/admin/VoiceQuality.tsx` |
| 5000 | `src/pages/roles/RoleAuditTrail.tsx` |
| 50 | `supabase/functions/analyze-contact-profile/index.ts` |
| 30 | `supabase/functions/analyze-live-utterance/index.ts` |
| 50 | `supabase/functions/analyze-live-utterance/index.ts` |
| 1 | `supabase/functions/auto-scorecard/index.ts` |
| 10 | `supabase/functions/chat-widget-session/index.ts` |
| 100 | `supabase/functions/chat-widget-session/index.ts` |
| 3 | `supabase/functions/chatbot-respond/index.ts` |
| 6 | `supabase/functions/chatbot-respond/index.ts` |
| 1 | `supabase/functions/check-goals/index.ts` |
| 1 | `supabase/functions/check-hold-alerts/index.ts` |
| 1 | `supabase/functions/check-queue-metrics/index.ts` |
| 1 | `supabase/functions/cleanup-lock-conflicts/index.ts` |
| 50 | `supabase/functions/compute-account-health/index.ts` |
| 200 | `supabase/functions/compute-best-time/index.ts` |
| 500 | `supabase/functions/compute-best-time/index.ts` |
| 20 | `supabase/functions/compute-deal-health/index.ts` |
| 1 | `supabase/functions/data-lake-flush/index.ts` |
| 10 | `supabase/functions/detect-churn-risk/index.ts` |
| 1 | `supabase/functions/email-inbound/index.ts` |
| 10 | `supabase/functions/email-inbound/index.ts` |
| 50000 | `supabase/functions/export-data-lake/index.ts` |
| 10000 | `supabase/functions/forecast-call-volume/index.ts` |
| 50 | `supabase/functions/generate-coaching/index.ts` |
| 80 | `supabase/functions/generate-coaching/index.ts` |
| 20 | `supabase/functions/generate-coaching-plan/index.ts` |
| 2000 | `supabase/functions/generate-coaching-track/index.ts` |
| 1 | `supabase/functions/health-check/index.ts` |
| 20 | `supabase/functions/ldap-sync/index.ts` |
| 500 | `supabase/functions/suggest-shift-swaps/index.ts` |
| 1 | `supabase/functions/validate-geo/index.ts` |
| 10000 | `supabase/functions/voip-anomaly-detector/index.ts` |
| 1 | `supabase/functions/voip-anomaly-remediation/index.ts` |
| 10000 | `supabase/functions/voip-capacity-forecast/index.ts` |
| 200 | `supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| 500 | `supabase/functions/voip-diagnostic-voice-qa/index.ts` |
| 2000 | `supabase/functions/voip-executive-narrative/index.ts` |
| 500 | `supabase/functions/voip-executive-narrative/index.ts` |
| 2000 | `supabase/functions/voip-executive-summary/index.ts` |
| 500 | `supabase/functions/voip-executive-summary/index.ts` |
| 100 | `supabase/functions/voip-load-test/index.ts` |
| 5000 | `supabase/functions/voip-quality-alerts-summary/index.ts` |
| 10000 | `supabase/functions/voip-quality-forecast/index.ts` |
| 10 | `supabase/functions/voip-quality-heatmap/index.ts` |
| 2000 | `supabase/functions/voip-recommendation-insights/index.ts` |
| 500 | `supabase/functions/voip-recommendation-insights/index.ts` |
| 1000 | `supabase/functions/voip-recommendation-simulate/index.ts` |
| 2000 | `supabase/functions/voip-recommendation-simulate/index.ts` |
| 2000 | `supabase/functions/voip-recommendations/index.ts` |
| 500 | `supabase/functions/voip-recommendations/index.ts` |
| 2000 | `supabase/functions/voip-sla-report/index.ts` |
| 1 | `supabase/functions/voip-trunks-healthcheck/index.ts` |
| 1 | `supabase/functions/webauthn-authenticate/index.ts` |
| 1 | `supabase/functions/whatsapp-inbound/index.ts` |
| 10 | `supabase/functions/whatsapp-inbound/index.ts` |

## I. Regras implícitas em mensagens de erro/validação

| Mensagem | Arquivo |
|---|---|
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/apply-call-volume-fix.mjs` |
| Defina DB_HOST (ou SUPABASE_DB_URL) — este script nao assume producao como padrao. | `scripts/apply-call-volume-fix.mjs` |
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/check-cfmlmc-db.mjs` |
| Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente. | `scripts/check-data.mjs` |
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/check-rls.mjs` |
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/clean-hold-events.mjs` |
| Defina DB_HOST (ou SUPABASE_DB_URL) — este script nao assume producao como padrao. | `scripts/clean-hold-events.mjs` |
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/cleanup-and-count.mjs` |
| Defina DB_HOST (ou SUPABASE_DB_URL) — este script nao assume producao como padrao. | `scripts/cleanup-and-count.mjs` |
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/fix-user-profile.mjs` |
| Defina DB_HOST (ou SUPABASE_DB_URL) — este script nao assume producao como padrao. | `scripts/fix-user-profile.mjs` |
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/inspect-schema.mjs` |
| Credencial ausente: defina SUPABASE_ANON_KEY no ambiente. | `scripts/test-api-direct.mjs` |
| Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente. | `scripts/test-api-direct.mjs` |
| Credencial ausente: defina SUPABASE_ANON_KEY no ambiente. | `scripts/test-auth-flow.mjs` |
| Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente. | `scripts/test-auth-flow.mjs` |
| Credencial ausente: defina SUPABASE_ANON_KEY no ambiente. | `scripts/test-authenticated-queries.mjs` |
| Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente. | `scripts/test-authenticated-queries.mjs` |
| Credencial ausente: defina SUPABASE_ANON_KEY no ambiente. | `scripts/test-call-volume-rpc.mjs` |
| Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente. | `scripts/test-call-volume-rpc.mjs` |
| Credencial ausente: defina SUPABASE_ANON_KEY no ambiente. | `scripts/test-dashboard-rpcs.mjs` |
| Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente. | `scripts/test-dashboard-rpcs.mjs` |
| Credencial ausente: defina SUPABASE_ANON_KEY no ambiente. | `scripts/test-rls-access.mjs` |
| Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente. | `scripts/test-rls-access.mjs` |
| Credencial ausente: defina SUPABASE_ANON_KEY no ambiente. | `scripts/test-validate-ip.mjs` |
| Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente. | `scripts/test-validate-ip.mjs` |
| ${msg}: esperado ${JSON.stringify(b)} obtido ${JSON.stringify(a)} | `scripts/ai-context/cenarios.mjs` |
| --entrada exige o caminho do arquivo com a resposta do banco.sql | `scripts/inventario/gerar-banco.mjs` |
| Management API ${caminho} respondeu HTTP ${res.status} | `scripts/inventario/gerar-banco.mjs` |
| SUPABASE_PROJECT_REF=${ref} nao e o banco oficial (${PROJETO_OFICIAL}). | `scripts/inventario/gerar-banco.mjs` |
| a resposta nao parece ser do banco oficial: ${comuns} tabelas em comum com o manifesto  | `scripts/inventario/gerar-banco.mjs` |
| a resposta nao parece ser do banco oficial: maior versao do ledger ${max} e menor que o limite  | `scripts/inventario/gerar-banco.mjs` |
| a resposta nao traz resumo.ledger_versao_max/ledger_registros; rode o banco.sql atual. | `scripts/inventario/gerar-banco.mjs` |
| a saida tem algo com cara de credencial; nada foi gravado. Revise banco.sql. | `scripts/inventario/gerar-banco.mjs` |
| entrada sem as chaves: ${faltando.join( | `scripts/inventario/gerar-banco.mjs` |
| entrada sem tabelas | `scripts/inventario/gerar-banco.mjs` |
| format_version ${dado.format_version} desconhecido (esperado 1) | `scripts/inventario/gerar-banco.mjs` |
| sem --entrada e sem SUPABASE_ACCESS_TOKEN: nada para ler (veja o cabecalho do script). | `scripts/inventario/gerar-banco.mjs` |
| sem foto independente do banco para conferir a origem: nem supabase/schema-manifest.json nem ${TYPES_TS} | `scripts/inventario/gerar-banco.mjs` |
| ripgrep falhou (exit ${erro?.status ??  | `scripts/inventario/gerar-catalogo-edges.mjs` |
| ripgrep (rg) falhou com exit ${status}; o inventário não foi gerado. | `scripts/inventario/gerar-repo.mjs` |
| ripgrep (rg) não encontrado; o inventário não pode ser gerado com segurança. | `scripts/inventario/gerar-repo.mjs` |
| O teste offline não permite consultas ao banco | `scripts/supabase_snapshot/test_snapshot.py` |
| banco indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| catálogo indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| permission denied for schema auth | `scripts/supabase_snapshot/test_snapshot.py` |
| relation  | `scripts/supabase_snapshot/test_snapshot.py` |
| statement timeout simulado | `scripts/supabase_snapshot/test_snapshot.py` |
| view removida depois da consulta ao catálogo | `scripts/supabase_snapshot/test_snapshot.py` |
| view sem permissão na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| >{stagesError}</span>}        {pendingStage && (         <div           className= | `src/components/accounts/AccountJourneyControl.tsx` |
| Erro ao carregar trunks | `src/components/admin/extensions/BulkAssignTrunkDialog.tsx` |
| Falha ao atribuir trunk | `src/components/admin/extensions/BulkAssignTrunkDialog.tsx` |
| ; import { Badge } from  | `src/components/admin/webhook-health/WebhookSecretsCard.tsx` |
| O navegador bloqueou a cópia | `src/components/admin/webhook-health/WebhookSecretsCard.tsx` |
| Erro na análise | `src/components/ai/AICallAnalysis.tsx` |
| Transcrição vazia | `src/components/ai/AICallAnalysis.tsx` |
| ; import {   Dialog,   DialogContent,   DialogDescription,   DialogFooter,   DialogHeader,   DialogTitle,   DialogTrigger, } from  | `src/components/auth/PasskeyManager.tsx` |
| Senha comprometida detectada | `src/components/auth/PasswordStrength.tsx` |
| Cadastre e selecione uma pesquisa antes de enviar | `src/components/call-library/SurveysPanel.tsx` |
| Informe o nome da pesquisa | `src/components/call-library/SurveysPanel.tsx` |
| Callback em ${minutesUntil} minutos! | `src/components/callbacks/ScheduledCallbacksList.tsx` |
| A chamada foi encerrada, mas não foi possível salvar o histórico | `src/components/calls/ActiveCallBar.tsx` |
| Erro ao gerar resumo, salvando sem resumo | `src/components/calls/ActiveCallBar.tsx` |
| Não foi possível alterar a saída de áudio | `src/components/calls/AudioOutputSelector.tsx` |
|  className= | `src/components/calls/CrmSuggestionsCard.tsx` |
|  className= | `src/components/calls/NextBestActionPanel.tsx` |
| ; import { Button } from  | `src/components/calls/UnifiedSoftphone.tsx` |
| Digite um número WhatsApp para ligar | `src/components/calls/UnifiedSoftphone.tsx` |
| Digite um número para ligar | `src/components/calls/UnifiedSoftphone.tsx` |
| Falha ao conectar ao servidor SIP | `src/components/calls/UnifiedSoftphone.tsx` |
| Falha ao salvar a gravação | `src/components/calls/UnifiedSoftphone.tsx` |
| Microfone indisponível | `src/components/calls/UnifiedSoftphone.tsx` |
| Máximo de 3 chamadas simultâneas atingido | `src/components/calls/UnifiedSoftphone.tsx` |
| Não foi possível iniciar a chamada | `src/components/calls/UnifiedSoftphone.tsx` |
| Não foi possível iniciar a gravação | `src/components/calls/UnifiedSoftphone.tsx` |
| Falha ao gerar plano | `src/components/coaching/CoachingCopilotCard.tsx` |
| Erro ao adicionar feriado | `src/components/compliance/HolidaysManager.tsx` |
| Código de região já existe | `src/components/compliance/calling-hours/useCallingHoursManager.ts` |
| Erro ao criar | `src/components/compliance/calling-hours/useCallingHoursManager.ts` |
| Erro ao salvar | `src/components/compliance/calling-hours/useCallingHoursManager.ts` |
| Falha ao alterar status | `src/components/compliance/calling-hours/useCallingHoursManager.ts` |
| Falha ao excluir | `src/components/compliance/calling-hours/useCallingHoursManager.ts` |
| Não foi possível verificar o horário agora | `src/components/compliance/calling-hours/useCallingHoursManager.ts` |
| Você não tem permissão para criar regiões | `src/components/compliance/calling-hours/useCallingHoursManager.ts` |
|  className= | `src/components/compliance/dnc/ReconcileDNCDialog.tsx` |
| Erro ao analisar perfil | `src/components/contacts/ContactDetailSheet.tsx` |
|  className= | `src/components/contacts/SavedFiltersBar.tsx` |
| Bitrix24 não configurado | `src/components/contacts/useBitrixSync.ts` |
| Erro ao sincronizar com Bitrix24 | `src/components/contacts/useBitrixSync.ts` |
| Não foi possível registrar uso | `src/components/conversation-intelligence/BattleCardAlert.tsx` |
|  className= | `src/components/dashboard/ActiveCallsRealtime.tsx` |
|  className= | `src/components/dashboard/HoldTrendChart.tsx` |
| Não foi possível copiar o número | `src/components/dashboard/RecentCalls.tsx` |
| Erro ao priorizar contato | `src/components/dialer/PredictiveDialerPanel.tsx` |
| Não foi possível exportar o histórico | `src/components/dialer/phone/SyncHistoryPanel.tsx` |
| >           <div className= | `src/components/error-boundary/ErrorBoundary.tsx` |
| >         <Card className= | `src/components/error-boundary/ErrorBoundary.tsx` |
| Não foi possível encerrar a sessão | `src/components/layout/CommandPalette.tsx` |
| Falha ao carregar ranking de agentes | `src/components/network/AgentQualityRanking.tsx` |
| Falha ao exportar relatório | `src/components/network/ExecutiveReportExport.tsx` |
| Sem dados para exportar | `src/components/network/ExecutiveReportExport.tsx` |
| Falha ao gerar PDF | `src/components/network/ExecutiveSummaryDialog.tsx` |
| Não foi possível copiar | `src/components/network/ExecutiveSummaryDialog.tsx` |
| Falha ao marcar alertas como lidos | `src/components/network/QualityAlertsCard.tsx` |
| Não foi possível carregar alertas de qualidade | `src/components/network/QualityAlertsCard.tsx` |
| Não foi possível registrar a leitura | `src/components/network/QualityForecastCard.tsx` |
| Não foi possível carregar o heatmap | `src/components/network/QualityHeatmap.tsx` |
| Sem ações para exportar | `src/components/network/RecommendationHistoryDrawer.tsx` |
| HTTP ${res.status} | `src/components/network/SlaReportCards.tsx` |
| Não foi possível carregar relatório SLA | `src/components/network/SlaReportCards.tsx` |
| Erro no microfone | `src/components/network/VoipVoiceQAPanel.tsx` |
| Falha ao consultar IA | `src/components/network/VoipVoiceQAPanel.tsx` |
| Pergunta muito curta | `src/components/network/VoipVoiceQAPanel.tsx` |
| ; import {   Select,   SelectContent,   SelectItem,   SelectTrigger,   SelectValue, } from  | `src/components/park/ParkOrbitFormDialog.tsx` |
| Erro ao carregar configurações | `src/components/queue-alerts/useQueueMetricsSettings.ts` |
| Erro ao inicializar configurações | `src/components/queue-alerts/useQueueMetricsSettings.ts` |
| Erro ao salvar configurações | `src/components/queue-alerts/useQueueMetricsSettings.ts` |
| ; import { AlertTriangle, Music, Play, Trash2, Upload } from  | `src/components/queues/QueueAudioLibrary.tsx` |
| ; import { AlertTriangle } from  | `src/components/queues/QueueFormDialog.tsx` |
| ; import {   Select,   SelectContent,   SelectItem,   SelectTrigger,   SelectValue, } from  | `src/components/ringgroups/RingGroupFormDialog.tsx` |
| ; import { Button } from  | `src/components/security/NotificationPermissionBanner.tsx` |
|                        className= | `src/components/security-alerts/VirtualTimeline.tsx` |
|  && (                 <AlertRow alert={row.alert} onSelect={onSelect} onMarkRead={onMarkRead} />               )}               {row.kind ===  | `src/components/security-alerts/VirtualTimeline.tsx` |
| , day, alert: a, key:  | `src/components/security-alerts/VirtualTimeline.tsx` |
| ; day: string; alert: SecurityNotification; key: string }   \| { kind:  | `src/components/security-alerts/VirtualTimeline.tsx` |
|  className= | `src/components/security-alerts/WebhookConfigDialog.tsx` |
| Não foi possível copiar | `src/components/security-alerts/WebhookHistoryEntryRow.tsx` |
| Não foi possível processar a fila agora | `src/components/settings/BitrixSyncStatus.tsx` |
| ${fnName} executado, mas a auditoria não registrou a ação | `src/components/settings/SystemMaintenancePanel.tsx` |
| Erro ao executar ${fnName} | `src/components/settings/SystemMaintenancePanel.tsx` |
| ; import { useLiveTranslation } from  | `src/components/translation/LiveTranslationPanel.tsx` |
|  className={cn(alertVariants({ variant }), className)} {...props} /> )); Alert.displayName =  | `src/components/ui/alert.tsx` |
| useCarousel must be used within a <Carousel /> | `src/components/ui/carousel.tsx` |
| useChart must be used within a <ChartContainer /> | `src/components/ui/chart.tsx` |
| useFormField should be used within <FormField> | `src/components/ui/form.tsx` |
| useSidebar must be used within a SidebarProvider. | `src/components/ui/sidebar.tsx` |
| useAuthContext must be used within an AuthProvider | `src/contexts/AuthContext.tsx` |
| useCallContext must be used within CallProvider | `src/contexts/CallContext.tsx` |
| useReauthContext must be used within a ReauthProvider | `src/contexts/ReauthContext.tsx` |
| useTheme must be used within ThemeProvider | `src/contexts/ThemeContext.tsx` |
| Esta conta foi alterada por outro usuario. Recarregue antes de salvar. | `src/hooks/useAccountJourney.ts` |
| Etapa alterada, mas o historico nao foi registrado | `src/hooks/useAccountJourney.ts` |
| Falha ao alterar a etapa da conta | `src/hooks/useAccountJourney.ts` |
| Falha ao carregar o historico da jornada | `src/hooks/useAccountJourney.ts` |
| Esta conta foi alterada por outro usuário. Recarregando... | `src/hooks/useAccounts.ts` |
| Falha ao atualizar conta | `src/hooks/useAccounts.ts` |
| Falha ao carregar contas | `src/hooks/useAccounts.ts` |
| Falha ao criar conta | `src/hooks/useAccounts.ts` |
| Falha ao detectar risco de churn | `src/hooks/useAccounts.ts` |
| Falha ao recalcular health | `src/hooks/useAccounts.ts` |
| Erro ao carregar dados dos agentes | `src/hooks/useAgentRanking.ts` |
| Erro ao criar dados de teste | `src/hooks/useAgentRanking.ts` |
| Erro ao salvar metas | `src/hooks/useAgentRanking.ts` |
| Meta atingida, mas a notificação não foi registrada | `src/hooks/useAgentRanking.ts` |
| Erro ao atualizar status | `src/hooks/useAgentStatus.ts` |
| Erro ao consultar a sessão de teste | `src/hooks/useAlerts.ts` |
| Erro ao criar alertas de teste | `src/hooks/useAlerts.ts` |
| Erro ao criar sessão de teste | `src/hooks/useAlerts.ts` |
| Erro ao verificar alertas | `src/hooks/useAlerts.ts` |
| Falha ao exportar: ${msg} | `src/hooks/useAlertsExport.ts` |
| Nenhum alerta (${scopeLabel}) corresponde aos filtros — nada para exportar. | `src/hooks/useAlertsExport.ts` |
| Webhook falhou${retryNote}: ${result.error ??  | `src/hooks/useAlertsExport.ts` |
| Falha ao aplicar remediação automática | `src/hooks/useAnomalyRemediation.ts` |
| Resposta vazia da remediação | `src/hooks/useAnomalyRemediation.ts` |
| Sem ação automática mapeada | `src/hooks/useAnomalyRemediation.ts` |
| Arquivo muito grande | `src/hooks/useAvatar.ts` |
| Erro ao enviar a foto | `src/hooks/useAvatar.ts` |
| Erro ao remover a foto | `src/hooks/useAvatar.ts` |
| Formato não suportado | `src/hooks/useAvatar.ts` |
| Sessão expirada | `src/hooks/useAvatar.ts` |
| Erro ao recomputar | `src/hooks/useBestTimeToContact.ts` |
| Bitrix24 indisponível | `src/hooks/useBitrix.ts` |
| Bitrix24 não retornou dados de usuários | `src/hooks/useBitrix.ts` |
| Bitrix24 não retornou departamentos | `src/hooks/useBitrix.ts` |
| Chamada não registrada no Bitrix24 | `src/hooks/useBitrix.ts` |
| Erro ao sincronizar agentes | `src/hooks/useBitrix.ts` |
| Erro ao sincronizar departamentos | `src/hooks/useBitrix.ts` |
| Erro ao carregar histórico de bloqueios | `src/hooks/useBlockedAccessLogs.ts` |
| Erro ao adicionar etapa | `src/hooks/useCadences.ts` |
| Erro ao atualizar cadência | `src/hooks/useCadences.ts` |
| Erro ao atualizar etapa | `src/hooks/useCadences.ts` |
| Erro ao atualizar inscrição | `src/hooks/useCadences.ts` |
| Erro ao criar cadência | `src/hooks/useCadences.ts` |
| Erro ao excluir cadência | `src/hooks/useCadences.ts` |
| Erro ao excluir etapa | `src/hooks/useCadences.ts` |
| Erro ao inscrever contato | `src/hooks/useCadences.ts` |
| Esta cadência foi alterada por outro usuário. Recarregando... | `src/hooks/useCadences.ts` |
| Esta chamada já foi retirada ou expirou. | `src/hooks/useCallPark.ts` |
| Esta órbita está desativada. | `src/hooks/useCallPark.ts` |
| Sessão expirada. Entre novamente. | `src/hooks/useCallPark.ts` |
| Órbita não encontrada. | `src/hooks/useCallPark.ts` |
| Erro ao adicionar à playlist | `src/hooks/useCallPlaylists.ts` |
| Erro ao criar playlist | `src/hooks/useCallPlaylists.ts` |
| Não foi possível alterar o status da fila | `src/hooks/useCallQueues.ts` |
| Não foi possível atualizar a fila | `src/hooks/useCallQueues.ts` |
| Não foi possível criar a fila | `src/hooks/useCallQueues.ts` |
| Não foi possível remover a fila | `src/hooks/useCallQueues.ts` |
| Falha ao consultar IA | `src/hooks/useChatbot.ts` |
| Falha ao carregar sinais de churn | `src/hooks/useChurnRisk.ts` |
| Falha ao resolver sinal | `src/hooks/useChurnRisk.ts` |
| Nao foi possivel resolver: ${error.message} | `src/hooks/useClientErrors.ts` |
| Erro ao atribuir coaching | `src/hooks/useCoachingAssignments.ts` |
| Erro ao concluir | `src/hooks/useCoachingAssignments.ts` |
| Erro ao gerar trilhas | `src/hooks/useCoachingTrack.ts` |
| Erro ao registrar consentimento | `src/hooks/useConsent.ts` |
| Não foi possível marcar o alerta como lido | `src/hooks/useContactAlerts.ts` |
| Não foi possível marcar o alerta como resolvido | `src/hooks/useContactAlerts.ts` |
| Não foi possível marcar os alertas como lidos | `src/hooks/useContactAlerts.ts` |
| Não foi possível remover o alerta | `src/hooks/useContactAlerts.ts` |
| Não foi possível verificar novos alertas | `src/hooks/useContactAlerts.ts` |
| Dados inválidos | `src/hooks/useContacts.ts` |
| Erro ao buscar contato por telefone | `src/hooks/useContacts.ts` |
| Erro ao carregar histórico de interações | `src/hooks/useContacts.ts` |
| Erro ao carregar lista de contatos | `src/hooks/useContacts.ts` |
| Erro ao remover contato | `src/hooks/useContacts.ts` |
| Este contato foi alterado por outro usuário. Recarregando... | `src/hooks/useContacts.ts` |
| ID de contato inválido | `src/hooks/useContacts.ts` |
| Não foi possível registrar a interação no histórico do contato | `src/hooks/useContacts.ts` |
| Conversa não atualizada: sem permissão ou conversa inexistente | `src/hooks/useConversations.ts` |
| Falha ao atualizar | `src/hooks/useConversations.ts` |
| Falha ao enviar mensagem | `src/hooks/useConversations.ts` |
| Mensagem enviada, mas a conversa não foi atualizada na lista. Recarregue antes de continuar. | `src/hooks/useConversations.ts` |
| callSessionId ausente | `src/hooks/useCrmFieldSuggestions.ts` |
| Erro ao adicionar | `src/hooks/useDNCCompliance.ts` |
| Erro ao atualizar | `src/hooks/useDNCCompliance.ts` |
| Erro ao remover | `src/hooks/useDNCCompliance.ts` |
| Erro ao salvar | `src/hooks/useDNCCompliance.ts` |
| Erro ao atualizar meta | `src/hooks/useDashboardGoals.ts` |
| Erro ao carregar metas | `src/hooks/useDashboardGoals.ts` |
| Erro ao excluir meta | `src/hooks/useDashboardGoals.ts` |
| Erro ao salvar meta | `src/hooks/useDashboardGoals.ts` |
| Preencha todos os campos obrigatórios | `src/hooks/useDashboardGoals.ts` |
| Falha ao gerar link de download | `src/hooks/useDataLakeExports.ts` |
| Erro ao atualizar | `src/hooks/useDeals.ts` |
| Erro ao calcular health | `src/hooks/useDeals.ts` |
| Erro ao carregar oportunidades | `src/hooks/useDeals.ts` |
| Erro ao criar oportunidade | `src/hooks/useDeals.ts` |
| Esta oportunidade foi alterada por outro usuário. Recarregando... | `src/hooks/useDeals.ts` |
| Limite de ${MAX_FAVORITES} favoritos atingido | `src/hooks/useDialerFavorites.ts` |
| Não foi possível remover o favorito | `src/hooks/useDialerFavorites.ts` |
| Não foi possível salvar a etiqueta | `src/hooks/useDialerFavorites.ts` |
| Não foi possível salvar a nova ordem | `src/hooks/useDialerFavorites.ts` |
| Sessão expirada | `src/hooks/useDialerFavorites.ts` |
| Falha ao atualizar status | `src/hooks/useExtensionsAdmin.ts` |
| Nada para exportar | `src/hooks/useExtensionsAdmin.ts` |
| Não foi possível salvar as estatísticas da semana | `src/hooks/useGamification.ts` |
| Erro ao atualizar configurações | `src/hooks/useGeoBlocking.ts` |
| Erro ao remover país | `src/hooks/useGeoBlocking.ts` |
| Erro ao validar IP | `src/hooks/useGeoBlocking.ts` |
| IP bloqueado | `src/hooks/useGeoBlocking.ts` |
| País não encontrado | `src/hooks/useGeoBlocking.ts` |
| Erro ao carregar histórico de violações | `src/hooks/useGoalViolations.ts` |
| Status: ${status} | `src/hooks/useHealthCheck.ts` |
| Timeout | `src/hooks/useHealthCheck.ts` |
| Notificações não suportadas | `src/hooks/useHoldReminder.ts` |
| Permissão negada | `src/hooks/useHoldReminder.ts` |
| ⚠️ Alerta de Tempo em Espera | `src/hooks/useHoldReminder.ts` |
| 🚨 Alerta Crítico de Espera | `src/hooks/useHoldReminder.ts` |
| Erro ao adicionar IP | `src/hooks/useIPWhitelist.ts` |
| Erro ao atualizar restrição | `src/hooks/useIPWhitelist.ts` |
| Erro ao carregar dados | `src/hooks/useIPWhitelist.ts` |
| Erro ao remover IP | `src/hooks/useIPWhitelist.ts` |
| Este IP já está configurado para este usuário | `src/hooks/useIPWhitelist.ts` |
| Este IP já está na whitelist | `src/hooks/useIPWhitelist.ts` |
| IP é obrigatório | `src/hooks/useIPWhitelist.ts` |
| Usuário e IP são obrigatórios | `src/hooks/useIPWhitelist.ts` |
| Falha ao salvar artigo | `src/hooks/useKnowledgeBase.ts` |
| Configure o servidor LDAP primeiro | `src/hooks/useLDAPSync.ts` |
| Falha na conexão: ${result.error ??  | `src/hooks/useLDAPSync.ts` |
| Preencha servidor e Base DN | `src/hooks/useLDAPSync.ts` |
| Sincronização falhou: ${result.error ??  | `src/hooks/useLDAPSync.ts` |
| Erro ao registrar conclusão | `src/hooks/useLearning.ts` |
| Código inválido | `src/hooks/useMFA.ts` |
| Erro ao configurar SMS | `src/hooks/useMFA.ts` |
| Erro ao configurar TOTP | `src/hooks/useMFA.ts` |
| Erro ao remover fator | `src/hooks/useMFA.ts` |
| Erro ao salvar configurações | `src/hooks/useMFA.ts` |
| Resumo inexistente | `src/hooks/useMeetingSummary.ts` |
| callSessionId ausente | `src/hooks/useMeetingSummary.ts` |
| Chamada bloqueada por compliance | `src/hooks/useMultiChannelCall.ts` |
| Erro ao adicionar dispositivo | `src/hooks/useMultiDeviceRing.ts` |
| Erro ao salvar preferências | `src/hooks/useNotificationPreferences.ts` |
| Not authenticated | `src/hooks/useNotificationPreferences.ts` |
| Contato ${queueItem.name \|\| queueItem.phone} pulado | `src/hooks/usePredictiveDialer.ts` |
| Erro ao adicionar à fila | `src/hooks/usePredictiveDialer.ts` |
| Erro ao carregar campanhas | `src/hooks/usePredictiveDialer.ts` |
| Erro ao criar campanha | `src/hooks/usePredictiveDialer.ts` |
| Erro ao iniciar campanha | `src/hooks/usePredictiveDialer.ts` |
| Erro ao pausar campanha | `src/hooks/usePredictiveDialer.ts` |
| Erro ao remover campanha | `src/hooks/usePredictiveDialer.ts` |
| Não foi possível reservar o contato na fila. Campanha pausada. | `src/hooks/usePredictiveDialer.ts` |
| Falha ao aplicar pacing | `src/hooks/usePredictivePacing.ts` |
| Erro ao atualizar perfil | `src/hooks/useProfile.ts` |
| Not authenticated | `src/hooks/useProfile.ts` |
| Qualidade de Chamada Crítica | `src/hooks/useQualityAlerts.ts` |
| Qualidade da chamada degradando | `src/hooks/useQualityTrendAnalyzer.ts` |
| Não foi possível atualizar o áudio | `src/hooks/useQueueAudioPrompts.ts` |
| Não foi possível remover o áudio | `src/hooks/useQueueAudioPrompts.ts` |
| Erro ao verificar metas | `src/hooks/useQueueMetrics.ts` |
| … +306 linhas — lista completa em `context.json` | |

## J. Controle de acesso no código (checagens de perfil/permissão)

| Valor comparado | Arquivo |
|---|---|
| `user` | `src/components/calls/softphone/ActiveCallDisplay.tsx` |
| `admin` | `src/components/layout/AppLayout.tsx` |
| `supervisor` | `src/components/layout/AppLayout.tsx` |
| `admin` | `src/components/layout/AppSidebar.tsx` |
| `profile` | `src/components/layout/AppSidebar.tsx` |
| `denied` | `src/components/security/NotificationPermissionBanner.tsx` |
| `granted` | `src/components/security/NotificationPermissionBanner.tsx` |
| `authState` | `src/hooks/useAuth.ts` |
| `granted` | `src/hooks/useCriticalAlertNotifications.ts` |
| `granted` | `src/hooks/useHoldReminder.ts` |
| `granted` | `src/hooks/useNotifications.ts` |
| `granted` | `src/hooks/useRealtimeHoldAlerts.ts` |
| `granted` | `src/hooks/useSecurityNotifications.ts` |
| `admin` | `src/hooks/useUnreadConflicts.ts` |
| `supervisor` | `src/hooks/useUnreadConflicts.ts` |
| `default` | `src/lib/incoming-call-alert.ts` |
| `granted` | `src/lib/incoming-call-alert.ts` |
| `agent` | `src/lib/talkRatio.ts` |
| `customer` | `src/lib/talkRatio.ts` |
| `role` | `src/lib/talkRatio.ts` |
| `supervisor` | `src/pages/CallPark.tsx` |
| `supervisor` | `src/pages/CallQueues.tsx` |
| `admin` | `src/pages/Knowledge.tsx` |
| `supervisor` | `src/pages/Knowledge.tsx` |
| `admin` | `src/pages/Permissions.tsx` |
| `permissionId` | `src/pages/Permissions.tsx` |
| `role` | `src/pages/Permissions.tsx` |
| `supervisor` | `src/pages/RingGroups.tsx` |
| `admin` | `src/pages/SecurityMonitoring.tsx` |
| `admin` | `src/pages/SecurityReport.tsx` |
| `string` | `src/pages/roles/RoleAuditTrail.tsx` |
| `admin` | `src/pages/roles/RoleStatsCards.tsx` |
| `agent` | `src/pages/roles/RoleStatsCards.tsx` |
| `supervisor` | `src/pages/roles/RoleStatsCards.tsx` |
| `viewer` | `src/pages/roles/RoleStatsCards.tsx` |
| `role` | `supabase/functions/_shared/auth.ts` |
| `string` | `supabase/functions/_shared/auth.ts` |
| `agent` | `supabase/functions/analyze-talk-ratio/index.ts` |
| `customer` | `supabase/functions/analyze-talk-ratio/index.ts` |
| `role` | `supabase/functions/analyze-talk-ratio/index.ts` |
| `admin` | `supabase/functions/cleanup-lock-conflicts/index.ts` |
| `admin` | `supabase/functions/cleanup-recordings/index.ts` |
| `admin` | `supabase/functions/data-lake-flush/index.ts` |
| `admin` | `supabase/migrations/20261123000200_fix_has_role_oracle_and_debug_tables.sql` |

## K. Testes como especificação (3848 testes em 428 arquivos — nomes completos em `context.json`)

| Arquivo | Testes | Exemplos do que o sistema DEVE fazer |
|---|---|---|
| `src/hooks/__tests__/useSecurityHardening.test.ts` | 80 | Security Hardening Verification · RLS Policy Hardening · should have is_active_agent function concept for agent status verification · should enforce agent-scoped access for call_transcriptions … |
| `src/lib/__tests__/security-sanitizers.test.ts` | 80 | Input Sanitizer · escapeHTML · escapes ampersands · escapes less-than … |
| `src/lib/__tests__/validation-schemas.test.ts` | 67 | Primitive Schemas · uuidSchema accepts valid UUID · uuidSchema rejects invalid · emailSchema accepts valid email … |
| `src/lib/__tests__/mock-data-integrity.test.ts` | 62 | Mock Data Integrity · Contacts · has at least 5 contacts · all contacts have required fields … |
| `src/lib/__tests__/edge-cases-stress.test.ts` | 60 | Edge Cases & Boundary Tests · Unicode and special character handling · escapeHTML handles unicode · escapeHTML handles emoji … |
| `src/lib/__tests__/fixes-exhaustive.test.ts` | 54 | generateBackupCodes (CSPRNG) · returns exactly 10 codes · all codes are 6 characters long · all codes use only Crockford alphabet characters … |
| `src/lib/__tests__/export-audit-notifications.test.ts` | 48 | Export Column Formatting · format function transforms dates · format function handles numbers · format function handles zero … |
| `src/lib/__tests__/security-infrastructure.test.ts` | 47 | Content Security Policy · builds a valid CSP header with default directives · includes all default directive keys · merges custom directives … |
| `src/lib/__tests__/error-boundaries.test.tsx` | 42 | ErrorBoundary: Normal rendering · renders children when no error occurs · renders multiple children · ErrorBoundary: Error catching (full mode) … |
| `src/lib/__tests__/security-advanced.test.ts` | 40 | Rate Limiter · allows requests within limit · tracks remaining requests accurately · blocks when limit exceeded … |
| `src/lib/__tests__/utilities-comprehensive.test.ts` | 37 | Password Strength · rates empty password as very weak · rates short password as weak · rates 8-char mixed as reasonable … |
| `src/lib/__tests__/accessibility-improvements.test.ts` | 36 | Accessibility: Dashboard page (Index.tsx) · main element has aria-label · stats section has aria-label for metrics · active calls section has aria-label … |
| `src/lib/__tests__/security-observability.test.ts` | 35 | Security: Logger PII masking (comprehensive) · masks  · masks case-insensitive keys (Password, TOKEN, etc.) · preserves non-sensitive fields … |
| `src/lib/__tests__/encryption-webauthn.test.ts` | 29 | Encryption Utilities · arrayBufferToBase64 · converts empty buffer · converts known bytes … |
| `src/hooks/__tests__/useBusinessLogic.test.ts` | 28 | Hold Alert Type Consistency · useRealtimeHoldAlerts filters for hold_time_exceeded matching edge function · Hold reminder configuration logic · valid reminder intervals are 15, 30, 60 … |
| `src/lib/__tests__/dashboard-integration.test.ts` | 27 | Dashboard Integration: All improvements present in Index.tsx · imports memoized StatsCard · imports memoized CallVolumeChart · imports SectionBoundary … |
| `src/hooks/__tests__/useWebAuthn.coverage.test.tsx` | 26 | useWebAuthn · loads passkeys and reports support on mount · handles loadPasskeys error path · does not load when no user … |
| `src/lib/__tests__/agent-assist-utils.test.ts` | 26 | agent-assist-utils · rankSignals · ordena por prioridade × confiança · lida com array vazio … |
| `src/lib/__tests__/webhook-health-and-export.simulation.test.ts` | 26 | webhook-health-utils · simulação massiva · ratioColor sempre retorna classe válida para qualquer entrada · aggregateEndpoints preserva invariante attempts = sent+failed acumulados · aggregateEndpoints: sortMode  … |
| `src/lib/__tests__/call-park.test.ts` | 25 | call-park :: clampInt · nunca lança e respeita a faixa · tolera símbolos, objetos sem primitivo e NaN · call-park :: normalizeOrbitDraft … |
| `src/lib/__tests__/dialer-tags-and-ringtone.test.ts` | 23 | normalizeTag · sempre devolve null ou string válida para o CHECK do banco · é idempotente · rejeita entradas não textuais e vazias … |
| `src/lib/__tests__/queue-audio.test.ts` | 23 | queue-audio :: clampNumber · nunca lança e respeita a faixa para qualquer entrada · tolera símbolos e objetos sem conversão primitiva · queue-audio :: sanitizeFileName … |
| `src/hooks/__tests__/useKnowledgeBase.coverage.test.tsx` | 22 | useKbCategories · returns published categories · surfaces a query error · useKbArticles … |
| `src/hooks/__tests__/usePredictiveDialer.coverage.test.tsx` | 22 | usePredictiveDialer · fetches campaigns on mount and exposes API · handles fetchCampaigns error branch · fetchQueue success and error branches … |
| `src/lib/__tests__/performance-optimizations.test.ts` | 22 | Performance: React.memo wrapping · ${name} is wrapped with React.memo · ${name} imports memo from react · ${name} exports as named export with memo … |
| `src/lib/__tests__/ring-group.test.ts` | 22 | sanitizeExtension · sempre produz null ou uma string aceita pelo CHECK do banco · descarta caracteres inválidos preservando os válidos · clampInt … |
| `src/lib/__tests__/blf.test.ts` | 21 | blf: helpers puros · safeText normaliza tipos inesperados · agentKey ignora acentos, caixa e espaços múltiplos · maskPhone preserva no máximo os 4 últimos dígitos … |
| `src/lib/__tests__/error-tracking.test.ts` | 21 | Error Tracking Module · Module exports · exports initErrorTracking function · exports getErrorReports function … |
| `src/lib/__tests__/logger.test.ts` | 21 | Logger Module · Basic logging methods · logger.debug calls console.debug · logger.info calls console.info … |
| `src/lib/__tests__/queue-metrics.test.ts` | 21 | serviceLevel · devolve null para lista vazia · conta atendida dentro do limiar como 100% · limiar e inclusivo … |
| `src/__tests__/rls/rls-policies.test.ts` | 19 | RLS — call_sessions · agent vê apenas as próprias sessões · supervisor lê todas as sessões da equipe · admin tem acesso total (delete incluído) … |
| `src/hooks/__tests__/useBitrix.coverage.test.tsx` | 19 | useBitrix · checkConfiguration returns true when configured · callBitrixApi returns null when configured === false · getContacts / getLeads / getDeals populate state … |
| `src/hooks/__tests__/useVoiceBiometrics.coverage.test.tsx` | 19 | useVoicePrints · loads voice prints list · enrolls successfully · enroll error path triggers toast.error … |
| `src/lib/__tests__/dialer-favorites-and-alert.test.ts` | 19 | dialer-favorites-order — simulação de centenas de cenários · preserva o conjunto de itens em qualquer movimento (PBT) · sempre gera posições densas 0..n-1 (PBT) · é imutável: nunca altera o array original … |
| `src/lib/webauthn/__tests__/webauthn-utils.coverage.test.ts` | 19 | webauthn-utils (coverage) · base64 helpers · round-trips a buffer through base64url · accepts a plain ArrayBuffer input … |
| `src/hooks/__tests__/useContactAlerts.coverage.test.tsx` | 18 | useContactAlerts · fetches alerts on mount and computes unread count · fetchAlerts with unreadOnly applies eq filter · fetchAlerts handles error and returns empty … |
| `src/hooks/__tests__/useQueueMetrics.coverage.test.tsx` | 18 | useQueueMetrics · fetches metrics and computes values · conta em espera apenas chamadas on_hold, nunca um status inventado · checkGoalStatus handles gte and lte operators … |
| `src/hooks/__tests__/useSecurityHooks.test.ts` | 18 | usePermissions · Permission checking logic · hasPermission returns true for existing permission · hasPermission returns false for missing permission … |
| `src/hooks/__tests__/useSupervisorPanel.coverage.test.tsx` | 18 | useSupervisorPanel (coverage) · loads active calls and queue metrics on mount · selecting a call fetches whisper history · sendWhisper errors when no call/message selected … |
| `src/lib/__tests__/security-alerts-presets.test.ts` | 18 | security-alerts-presets · loadPresets · retorna [] quando storage vazio · retorna [] quando JSON inválido … |
| `src/hooks/__tests__/useConversations.coverage.test.tsx` | 17 | useConversations · fetches with filters applied · handles fetch error · useConversationMessages … |
| `src/lib/__tests__/softphone-utils.test.ts` | 17 | formatCallDuration · formats 0 seconds · formats under a minute · formats exact minutes … |
| `src/hooks/__tests__/useAgentRanking.coverage.test.tsx` | 16 | useAgentRanking (coverage) · exposes the read error instead of an empty ranking · clears the ranking error after the next successful read · fetches agent stats on mount and exposes data … |
| `src/hooks/__tests__/useLoginLockout.test.ts` | 16 | useLoginLockout · check_login_lockout RPC · returns unlocked for unknown email · returns locked after 5 failed attempts … |
| `src/hooks/__tests__/useVoipTrunks.coverage.test.tsx` | 16 | useVoipTrunks (coverage) · lists trunks · lists assignments · throws when invoke returns error … |
| `src/lib/__tests__/utils.coverage.test.ts` | 16 | utils (coverage) · merges class names · dedups tailwind conflicts · handles conditional / falsy values … |
| `src/hooks/__tests__/useAvatar.test.ts` | 15 | useAvatar · does not request a signed url when there is no path · resolves a signed url for an existing avatar · clears the url when signing fails … |
| `src/hooks/__tests__/useCrmFieldSuggestions.coverage.test.tsx` | 15 | useCrmFieldSuggestions · returns empty defaults when no callSessionId (query disabled, no channel) · fetches suggestions and computes pending, wires realtime channel · query error branch throws … |
| `src/hooks/__tests__/useWavoipCall.coverage.test.tsx` | 15 | useWavoipCall · checks configuration on mount (connected) · checkConfiguration when not connected sets disconnected · checkConfiguration with supabase error sets error state … |
| `src/lib/__tests__/call-queue.test.ts` | 15 | call-queue :: clampInt · sempre devolve inteiro dentro da faixa · usa o fallback para valores não finitos · call-queue :: normalizeQueueDraft … |
| `src/lib/__tests__/safe-number.test.ts` | 15 | safe-number · safeParseInt · PBT: nunca retorna NaN, mesmo com entrada hostil · PBT: números válidos são truncados · PBT: respeita min/max clamp … |
| `src/lib/__tests__/security-alerts-webhook.test.ts` | 15 | security-alerts-webhook · isValidHttpUrl · aceita http/https e rejeita esquemas inválidos · persistência (URL / retries) … |
| `src/lib/__tests__/voipRecommendationCoaching.coverage.test.ts` | 15 | voipRecommendationCoaching · schedules a coaching check with mosBefore captured · does not schedule duplicates for the same recommendation · captures null mosBefore when supabase returns empty data … |
| `src/hooks/__tests__/useReauth.coverage.test.tsx` | 14 | useReauth · needsReauth true sem verificação prévia · requestReauth marca isRequired · verifyWithPassword sucesso atualiza lastVerified e dispensa reauth … |
| `src/lib/__tests__/dnc-reconcile.test.ts` | 14 | normalizarTelefone · leva o numero BR para a forma canonica +55 · cai para digitos quando nao da para reconhecer a forma BR · reconciliarDNC … |
| `src/lib/__tests__/safe-date.test.ts` | 14 | safe-date · entradas hostis nunca lançam · PBT: qualquer string arbitrária é tolerada · PBT: qualquer número (inclui NaN, ±Infinity, valores fora do range) é tolerado · null / undefined /  … |
| `src/lib/__tests__/sync-history.test.ts` | 14 | sync-history · sanitizeEntry só aceita timestamps finitos e positivos · nunca ultrapassa o limite de entradas · appendEntry mantém a entrada mais recente no topo … |
| `src/lib/__tests__/talkRatio.test.ts` | 14 | computeTalkRatio · returns zeros for empty input · chamada sem áudio não é classificada como ideal · duração zero com segmentos não gera NaN nem veredito … |
| `src/lib/__tests__/voice-preferences.test.ts` | 14 | voice-preferences (PBT) · clampTtsRate sempre devolve valor finito no intervalo permitido · nextTtsRate percorre apenas passos válidos · ciclo de velocidades é fechado e volta ao início … |
| `src/lib/__tests__/webhook-health-utils.test.ts` | 14 | ratioColor · retorna muted quando attempts=0 · classifica faixas por ratio · aggregateEndpoints … |
| `src/lib/notifications/__tests__/index.coverage.test.ts` | 14 | notifications · sendNotification · returns success when edge function succeeds · returns error when edge function returns error … |
| `src/hooks/__tests__/useCadences.crud.test.tsx` | 13 | useCadences: edicao e exclusao · updateCadence envia o patch junto com a version atual e recarrega · updateCadence alterna is_active mantendo a version do registro · updateCadence trata conflito de version recarregando a lista … |
| `src/hooks/__tests__/useCallSession.coverage.test.tsx` | 13 | useCallSession · starts a session successfully · returns null on start error · addTranscript/addAnalysis no-op without session … |
| `src/hooks/__tests__/useDashboardData.coverage.test.tsx` | 13 | useDashboardData · useDashboardStats success · useDashboardStats error · useAgentsListData success returns data … |
| `src/hooks/__tests__/useSurveys.coverage.test.tsx` | 13 | useSurveys · carrega respostas e calcula nps · npsScore null quando sem scores válidos · trata erro de carregamento … |
| `src/lib/__tests__/executive-dashboard-utils.test.ts` | 13 | getPeriodLabel · returns correct label for today · returns correct label for week · returns correct label for month … |
| `src/hooks/__tests__/useGamification.coverage.test.tsx` | 12 | useGamification · loads data successfully and computes rankings · runs without agentId (skips agent-scoped fetches) · handles fetch errors on all tables … |
| `src/hooks/__tests__/useWebhookSecrets.test.tsx` | 12 | useWebhookSecrets · lista os segredos ordenados por provedor · cadastra provedor normalizado e invalida o cache · distingue rotação de cadastro na mensagem de sucesso … |
| `src/lib/__tests__/guard-edge-numeric.test.ts` | 12 | guard-edge-numeric — Regra 1 (z.number sem .finite) · detecta z.number() em qualquer disposição de whitespace · aceita z.number().finite() com whitespace variável · ignora z.number() dentro de comentários e strings … |
| `src/lib/__tests__/meeting-summary-utils.test.ts` | 12 | isValidActionItem · aceita item válido · rejeita prioridade inválida · rejeita sem descrição … |
| `src/lib/__tests__/security-alerts-webhook-validation.test.ts` | 12 | validateWebhookConfig · aceita config mínima válida sem erros nem avisos · aceita URL vazia (= remover config) · rejeita URL inválida: %s … |
| `src/lib/security/__tests__/hsts-headers.coverage.test.ts` | 12 | buildHSTSHeader · builds header from default config · omits includeSubDomains and preload when false · includes only includeSubDomains when preload is false … |
| `src/lib/validation/__tests__/zod-schemas.property.test.ts` | 12 | Zod schemas — property-based (1000 runs cada) · uuidSchema aceita UUIDs válidos · uuidSchema rejeita strings arbitrárias não-UUID · emailSchema aceita emails válidos … |
| `src/hooks/__tests__/useAuth.coverage.test.tsx` | 11 | useAuth · calls getSession on mount and exposes API · hasRole false without profile, true with matching role · handles SIGNED_OUT auth state change … |
| `src/hooks/__tests__/useContacts.coverage.test.tsx` | 11 | useContacts (coverage) · fetches contacts on mount · fetchContacts with search filter · getContactByPhone success and not found … |
| `src/hooks/__tests__/useDNCCompliance.coverage.test.tsx` | 11 | useDNCCompliance · loads queries and getSettingValue parses values · checkDNC success and error branches · checkCallingHours success and error branches … |
| `src/hooks/__tests__/useLiveAssist.coverage.test.tsx` | 11 | useLiveAssist · is disabled (no fetch) without callSessionId · loads signals and subscribes to realtime when callSessionId present · analyze invokes edge function when throttle allows … |
| `src/hooks/__tests__/useLoginLockout.coverage.test.tsx` | 11 | useLoginLockout · checkLockout success returns parsed status · checkLockout handles error from rpc · checkLockout handles thrown exception … |
| `src/hooks/__tests__/useScheduledCallbacks.coverage.test.tsx` | 11 | useScheduledCallbacks · loads pending callbacks and upcoming count on mount · fetchCallbacks with status filter and error branch · fetchUpcomingCount error branch … |
| `src/hooks/__tests__/useSipCall.coverage.test.tsx` | 11 | useSipCall (coverage) · initial state is disconnected · connect succeeds and registers · connect with failover shows warning … |
| `src/hooks/__tests__/useSuccessPlans.coverage.test.tsx` | 11 | useSuccessPlans · loads plans and milestones with accountId · loads plans without accountId · handles empty plans (no milestone fetch) … |
| `src/hooks/__tests__/useTrackers.coverage.test.tsx` | 11 | useTrackers · loads trackers on mount (success) · logs error when load fails · createTracker success path … |
| `src/hooks/auth/__tests__/useAuthSession.coverage.test.tsx` | 11 | withTimeout · resolves when the promise resolves first · rejects with message on timeout · useAuthSession … |
| `src/lib/__tests__/holdReminderSounds.coverage.test.tsx` | 11 | holdReminderSounds · createNotificationSound plays two oscillators (timer branch) · createUrgentSound plays three beeps over time · formatHoldTime formats both branches … |
| `src/lib/__tests__/tracing.coverage.test.ts` | 11 | tracing (coverage) · exports header name constants · returns undefined trace id/operation when no scope is active · withTrace generates id, sets operation, and clears on success … |
| `src/lib/__tests__/voice-biometrics.coverage.test.ts` | 11 | voice-biometrics: isValidEmbedding · accepts an array of correct dimension with finite numbers · rejects non-arrays · rejects wrong-length arrays … |
| `src/lib/__tests__/voipProactiveSnapshot.coverage.test.ts` | 11 | voipProactiveSnapshot · isProactiveEnabled reflects localStorage pref · setProactiveEnabled writes the pref · shouldRunProactiveCheck false when disabled … |
| `src/pages/__tests__/Cadences.crud.test.tsx` | 11 | Cadences: acoes de edicao e exclusao na tela · mostra os controles de editar, ativar/desativar e excluir na cadencia · desativar a cadencia grava is_active=false pelo id · salvar o dialogo de edicao envia nome e descricao … |
| `supabase/functions/_shared/__tests__/resilient-fetch.test.ts` | 11 | resilientFetch: sucesso em 2xx passa direto · resilientFetch: 500 é reciclado e sucede na 3ª tentativa · resilientFetch: 404 NÃO é reciclado · resilientFetch: 500 esgota retries e propaga … |
| `supabase/functions/health-check/__tests__/slo-budget_test.ts` | 11 | budget - sem falhas mantem o budget intacto · budget - falha igual a tolerancia zera o budget · budget - falha acima da tolerancia escala o burn rate · budget - metade da tolerancia entra em warning … |
| `supabase/functions/voip-executive-summary/__tests__/index.test.ts` | 11 | computeHealthScore — perfeito = 100 · computeHealthScore — fórmula ponderada correta · computeHealthScore — cobre só as dimensões medidas · computeHealthScore — cobertura < 2 devolve null … |
| `src/components/admin/webhook-health/__tests__/WebhookSecretsCard.test.tsx` | 10 | WebhookSecretsCard · mostra estado vazio com chamada para cadastrar quando nao ha segredo · nunca renderiza o segredo completo antes de revelar · revela e copia o valor completo quando o admin pede … |
| `src/components/dialer/phone/__tests__/phone-dialer.test.ts` | 10 | phone-utils · sanitiza entrada removendo caracteres inválidos · formata número BR no display · valida se o número é discável … |
| `src/components/layout/__tests__/AppSidebar.test.tsx` | 10 | routeRoles (E088) · declara papéis para rota admin e undefined para rota aberta · AppSidebar — filtro por papel (E089) · agente não vê itens de rota com roles (Executivo, Logs de Auditoria) … |
| `src/hooks/__tests__/useAccountJourney.coverage.test.tsx` | 10 | useAccountJourney · carrega as etapas ativas e traduz a chave para o nome · mantem a chave visivel quando a etapa nao esta cadastrada · expoe erro na tela quando a leitura das etapas falha … |
| `src/hooks/__tests__/useAlerts.coverage.test.tsx` | 10 | useAlerts · loads alerts and computes counts · applies filters · checks for new alerts (success and none) … |
| `src/hooks/__tests__/useAnomalyRemediation.coverage.test.tsx` | 10 | useAnomalyRemediation · applied success · idempotent_skip → info · dryRun → info … |
| `src/hooks/__tests__/useDashboardGoals.coverage.test.tsx` | 10 | useDashboardGoals · fetches goals on mount · handles fetch error · opens dialog for new and for editing … |
| `src/hooks/__tests__/useGeoBlocking.coverage.test.tsx` | 10 | useGeoBlocking · carrega settings, restrictions e logs · inicializa settings quando ausentes · atualiza settings com sucesso … |
| `src/hooks/__tests__/useIPWhitelist.coverage.test.tsx` | 10 | useIPWhitelist · does not fetch when not admin · fetches data when admin · publishes the read error instead of an empty list … |
| `src/hooks/__tests__/useLiveTranslation.coverage.test.tsx` | 10 | useLiveTranslation · returns initial state · does nothing without callSessionId or empty text · queues short utterances below minWords without invoking … |
| `src/hooks/__tests__/useMeetingSummary.coverage.test.tsx` | 10 | useMeetingSummary · loads summary and runs generate/update/share · disabled when no callSessionId · generate handles skipped response … |
| `src/hooks/__tests__/useMultiChannelCall.coverage.test.tsx` | 10 | useMultiChannelCall · initiates calls, enforces MAX_SIMULTANEOUS_CALLS, switches and ends · updateCallStatus active starts timer, toggles mute/hold/recording, addTranscript · handles no-op branches when no active call id … |
| `src/hooks/__tests__/useReauth.grant.test.tsx` | 10 | Reauth grant persistido (HMAC) · grava grant assinado no sessionStorage apos verificar · rehidrata lastVerified em nova montagem (nao exige reauth) · descarta grant com assinatura invalida … |
| `src/hooks/__tests__/useRecordings.coverage.test.tsx` | 10 | useRecordings · fetches recordings and filters · handles fetch error · pagina as gravacoes em blocos de 50 e carrega a proxima pagina … |
| `src/hooks/__tests__/useScorecards.coverage.test.tsx` | 10 | useScorecards · loads templates and criteria without callSessionId · exposes the template read error instead of an empty model list · clears the template error on the next successful read … |
| `src/hooks/__tests__/useSessionManager.coverage.test.tsx` | 10 | useSessionManager · loads sessions and creates current session · revokes a non-current session · revokes the current session and signs out … |
| `src/hooks/auth/__tests__/useAuthActions.coverage.test.tsx` | 10 | useAuthActions · signIn success returns data and loads profile · signIn returns supabase error branch · signIn catch branch when request throws … |
| `src/lib/__tests__/hash-endpoint.test.ts` | 10 | hashEndpoint · gera hash de exatamente 12 caracteres hexadecimais · é determinístico (mesma URL → mesmo hash) · diferencia URLs quase idênticas (path) … |
| `src/lib/__tests__/language-detection.test.ts` | 10 | language-detection · detects Portuguese with diacritics · detects English stopwords · detects Spanish via ñ … |
| `src/lib/__tests__/security-alerts-webhook-validation.property.test.ts` | 10 | validateWebhookConfig — property-based (fast-check) · draft canônico válido nunca bloqueia (sem errors) · qualquer inteiro fora de faixa produz erro no campo · espaços em URL sempre produzem erro em url … |
| `src/lib/__tests__/utils.test.ts` | 10 | cn (classname utility) · merges class names · handles conditional classes · handles undefined and null … |
| `supabase/functions/enforce-sla/__tests__/index.test.ts` | 10 | enforce-sla: prioriza política de canal específico sobre  · enforce-sla: prioriza prioridade específica sobre  · enforce-sla: canal exato vence combinação genérica · enforce-sla: cai no fallback  … |
| `e2e/dashboard.spec.ts` | 9 | Dashboard · Unauthenticated · should redirect to login when not authenticated · Authenticated … |
| `src/components/ui/__tests__/search-input.test.tsx` | 9 | SearchInput · renderiza com placeholder e valor · chama onValueChange ao digitar · mostra botão limpar somente quando há valor … |
| `src/components/voice-security/__tests__/RedactionLogCard.test.tsx` | 9 | RedactionLogCard · mostra o estado vazio quando nao ha execucao registrada · lista a execucao com sessao abreviada, padroes e ocorrencias · explica o total de ocorrencias no cabecalho … |
| `src/hooks/__tests__/useAccounts.coverage.test.tsx` | 9 | useAccounts coverage · handles load error · create success · create error returns null … |
| `src/hooks/__tests__/useAlertsExport.test.ts` | 9 | useAlertsExport · exporta CSV com escopo  · filtra por scope= · filtra por scope= … |
| `src/hooks/__tests__/useCallPlaylists.coverage.test.tsx` | 9 | useCallPlaylists (coverage) · loads playlists on mount · handles list error · createPlaylist success and error … |
| `src/hooks/__tests__/useCallTimers.coverage.test.tsx` | 9 | useCallTimers · startDurationTimer increments duration each second · startDurationTimer clears existing timer when restarted · stopDurationTimer stops increments … |
| `src/hooks/__tests__/useCoaching.coverage.test.tsx` | 9 | useCoaching · returns empty without agentId (no fetch) · fetches recommendations and subscribes · handles fetch error … |
| `src/hooks/__tests__/useConferenceRecording.coverage.test.tsx` | 9 | useConferenceRecording (coverage) · auto-starts recording and fires onRecordingStarted · does not start when conference is null · saves recording when conference ends and fires onRecordingSaved … |
| `src/hooks/__tests__/useCriticalAlertNotifications.coverage.test.tsx` | 9 | useCriticalAlertNotifications · initAudioContext returns and memoizes an AudioContext · requestNotificationPermission returns true when granted · playAlertSound exercises all patterns (warning + critical) … |
| `src/hooks/__tests__/useDealPipelineTrend.test.tsx` | 9 | useDealPipelineTrend · le a tabela de retratos filtrando pelo inicio do periodo e em ordem cronologica · usa periodo de 7 dias por escolha da tela · propaga erro de leitura para a tela … |
| `src/hooks/__tests__/useDebouncedSearchParam.test.tsx` | 9 | useDebouncedSearchParam · hidrata a partir da URL · debounce: uma rajada de setValue commita apenas uma vez · string vazia aplica imediatamente (bypass debounce) … |
| `src/hooks/__tests__/useExtensionsOverview.scenarios.test.ts` | 9 | useExtensionsOverview — 50+ cenários de agregação · lista vazia retorna array vazio · 1 agente sem chamadas: call_count_7d=0 · 1 agente com 3 chamadas: count=3, média correta … |
| `src/hooks/__tests__/useKbArticleHistory.test.tsx` | 9 | useKbArticleHistory · nao consulta o banco sem artigo selecionado · filtra por artigo, ordena do mais recente e limita o resultado · propaga erro de leitura para a tela … |
| `src/hooks/__tests__/useMFA.coverage.test.tsx` | 9 | useMFA · loads factors and settings · enrollTOTP success and error · enrollPhone success and error … |
| `src/hooks/__tests__/useNotifications.coverage.test.tsx` | 9 | useNotifications · loads notifications and unread count · marks single and all as read · archives a notification … |
| `src/hooks/__tests__/useQualityTrendAnalyzer.coverage.test.tsx` | 9 | useQualityTrendAnalyzer · não faz nada quando desabilitado · ignora MOS null ou não finito · detecta degradação progressiva e persiste alerta … |
| `src/hooks/__tests__/useRedactionLog.test.tsx` | 9 | useRedactionLog · le redaction_log com as colunas esperadas e ordena do mais recente · respeita o limite informado · devolve lista vazia quando a tabela nao tem linhas … |
| `src/hooks/__tests__/useSLA.coverage.test.tsx` | 9 | useSLA · useSlaPolicies loads policies · useSlaPolicies surfaces error · useSlaCompliance computes compliance … |
| `src/hooks/__tests__/useSecurityDashboard.coverage.test.tsx` | 9 | useSecurityDashboard · returns early without userId · loads data and computes full score · computes lower score branches (no mfa, many sessions, ip off, no alerts) … |
| `src/hooks/__tests__/useShifts.coverage.test.tsx` | 9 | useShifts coverage · loads shifts and templates without weekStart · loads shifts with weekStart (gte/lt branch) · exposes CRUD mutations and runs createShift success … |
| `src/lib/__tests__/device-identity.test.ts` | 9 | device-identity · sanitize sempre respeita o CHECK do banco (trim + limite) · sanitize é idempotente · sanitize rejeita não-strings … |
| `src/lib/__tests__/errorReporter.test.ts` | 9 | errorReporter · nao monta linha sem usuario autenticado · grava so o pathname da rota (query e hash ficam de fora) · trunca mensagem e stack nos limites da tabela … |
| `src/lib/security/__tests__/https-enforcer.coverage.test.ts` | 9 | https-enforcer · does not enforce on localhost · does not enforce on 127.0.0.1 · does not enforce when already https … |
| `supabase/functions/__tests__/geo-decision.test.ts` | 9 | allowlist: pais listado e permitido · allowlist: pais fora da lista e bloqueado · blocklist: pais listado e bloqueado · blocklist: pais fora da lista e permitido … |
| `supabase/functions/_shared/__tests__/auth_test.ts` | 9 | auth: requireUser sem header Authorization devolve 401 · auth: requireUser com header que nao e Bearer devolve 401 · auth: header Bearer vazio devolve 401 · auth: erro de credencial devolve o envelope com CORS da origem do chamador … |
| `supabase/functions/_shared/__tests__/resilience.test.ts` | 9 | retry: sucesso na primeira tentativa não dorme · retry: exponencial sem jitter é determinístico · retry: respeita shouldRetry (não repete em 4xx) · retry: repete em 429 e 5xx … |
| `supabase/functions/compute-deal-health/__tests__/index.test.ts` | 9 | compute-deal-health: recencyScore decresce 5 pts/dia, mín 0 · compute-deal-health: recencyScore = 100 quando hoje · compute-deal-health: sentimentScore neutro = 50 · compute-deal-health: sentimentScore 100% positivo = 100 … |
| `supabase/functions/voip-recommendation-insights/__tests__/index.test.ts` | 9 | rejeita requisição sem JWT · rejeita período inválido (validação oneOf) · buildHeatmap gera 7×24 = 168 buckets · buildHeatmap incrementa bucket correto … |
| `supabase/functions/webauthn-authenticate/__tests__/verify.test.ts` | 9 | verify: assercao legitima e aceita e devolve signCount · verify: assinatura de OUTRA chave e rejeitada · verify: desafio diferente e rejeitado (replay) · verify: origem estranha e rejeitada (phishing) … |
| `src/__tests__/rls/audit-logs.test.ts` | 8 | RLS — audit_logs (imutabilidade + admin-only read) · admin pode ler logs de auditoria · admin pode inserir via função RPC · admin NÃO pode atualizar logs (imutabilidade) … |
| `src/components/executive/__tests__/DealPipelineTrendCard.test.tsx` | 8 | DealPipelineTrendCard · mostra carregamento enquanto a serie nao chega · explica quando ainda nao existe retrato no periodo · mostra erro com opcao de tentar de novo … |
| `src/components/knowledge/__tests__/ArticleHistoryCard.test.tsx` | 8 | ArticleHistoryCard · mostra carregamento enquanto a leitura nao termina · explica o vazio em vez de deixar a area muda · mostra erro e permite tentar de novo … |
| `src/hooks/__tests__/pageVisibility.gating.test.tsx` | 8 | etapa 253: poll de painel respeita a visibilidade da aba · ${file} usa usePageVisibility · ${file} nao tem refetchInterval sempre ligado · useQualityMetrics entrega refetchInterval falso com a aba oculta … |
| `src/hooks/__tests__/slaBreach.test.ts` | 8 | describeSlaBreach · sem primeira resposta e prazo vencido: culpa a primeira resposta · primeira resposta dentro do prazo mas resolucao atrasada · resolucao ainda em aberto conta o atraso contra agora … |
| `src/hooks/__tests__/useAchievementNotifications.coverage.test.tsx` | 8 | useAchievementNotifications (coverage) · não injeta badge inválida quando o enriquecimento falha · subscribes to channels and exposes initial state · handles a new badge award and shows a toast (no agent filter) … |
| `src/hooks/__tests__/useAgentStatus.coverage.test.tsx` | 8 | useAgentStatus (coverage) · fetches agents on mount · setAgent selects and toasts; clearAgent clears · updateStatus returns false without selected agent … |
| `src/hooks/__tests__/useCallHistory.coverage.test.tsx` | 8 | useCallHistory · fetches sessions on mount and maps summary · handles fetch error branch · exercises filters, setters, presets and clearFilters … |
| `src/hooks/__tests__/useCallRecording.coverage.test.tsx` | 8 | useCallRecording · starts recording successfully · handles start recording failure · stopAndSaveRecording returns null when no recorder … |
| `src/hooks/__tests__/useExecutiveDashboard.coverage.test.tsx` | 8 | useExecutiveDashboard helpers · getPeriodLabel covers all periods and fallback · formatDuration formats minutes and seconds · useExecutiveDashboardData … |
| `src/hooks/__tests__/useSavedFilters.coverage.test.tsx` | 8 | useSavedFilters · carrega os filtros salvos da entidade · expõe mensagem e lista vazia quando a leitura falha · salva o filtro com o usuário autenticado … |
| `src/hooks/__tests__/useSecurityMonitoringData.coverage.test.tsx` | 8 | useSecurityMonitoringData · fetches logs, alerts and computes stats · erro de leitura vira alarme, nao tranquilidade · limpa o erro na leitura seguinte bem-sucedida … |
| `src/hooks/__tests__/useSecurityNotifications.coverage.test.tsx` | 8 | useSecurityNotifications · detects support and initial permission · requestPermission granted path · requestPermission denied path … |
| `src/hooks/__tests__/useVoipQualityMonitor.coverage.test.tsx` | 8 | useVoipQualityMonitor · returns unknown state when no peer connection · collects stats and computes MOS for a good connection · uses candidate-pair RTT fallback and tolerates packet loss … |
| `src/hooks/__tests__/useWhatsappRewrite.test.tsx` | 8 | useWhatsappRewrite · invokes whatsapp-rewrite e retorna o texto reescrito · usa tone e context informados · retorna null sem invocar quando a mensagem é vazia … |
| `src/hooks/auth/__tests__/useAuthProfile.coverage.test.tsx` | 8 | useAuthProfile · returns profile data on success · returns null and logs on error · returns null when query throws … |
| `src/lib/__tests__/outbound-scoring.test.ts` | 8 | outbound-scoring · bloqueia números em DNC com score 0 · penaliza fortemente fora do horário permitido · aplica score base sem histórico suficiente … |
| `src/lib/__tests__/phone-normalization.property.test.ts` | 8 | phone-normalization — property-based (1000+ runs) · stripNonDigits preserva apenas dígitos (e + inicial) · normalizeBrPhone aceita 10-11 dígitos crus e prefixa +55 · normalizeBrPhone rejeita strings não numéricas longas … |
| `src/lib/__tests__/security-alerts-webhook-queue.test.ts` | 8 | security-alerts-webhook-queue · enqueues and loads items · caps queue at 50 entries · notifies subscribers on change … |
| `src/lib/__tests__/security-alerts-webhook.property.test.ts` | 8 | sendExportWebhook — property-based (fast-check) · URL inválida sempre curto-circuita sem tentativas · 4xx não-retriável (exceto 408/429) ⇒ attempts === 1 · status retriável persistente ⇒ attempts === maxAttempts … |
| `src/lib/__tests__/voice-command-history.test.ts` | 8 | voice-command-history · sanitiza qualquer entrada sem lançar e respeita o limite de tamanho · nunca excede o número máximo de entradas · faz dedupe case-insensitive mantendo o comando no topo … |
| `src/pages/admin/__tests__/CronHealthCard.test.tsx` | 8 | CronHealthCard · mostra esqueleto enquanto carrega · avisa quando nao ha cron agendado · exibe job saudavel com cadencia e execucoes … |
| `src/pages/roles/__tests__/useRoles.test.ts` | 8 | useRoles · carrega roles e enriquece com email/nome · mostra erro ao carregar falhar · addRole retorna false quando usuário não existe … |
| `supabase/functions/_shared/__tests__/cors.test.ts` | 8 | cors: origem de producao (Vercel) e ecoada · cors: origem desconhecida nao recebe Access-Control-Allow-Origin · cors: subdominio arbitrario de lovable.app nao e aceito por padrao · cors: preview da Lovable em uso continua liberado pela lista … |
| `supabase/functions/cleanup-lock-conflicts/__tests__/cron_auth_test.ts` | 8 | cron: aceita o bearer exato do Vault · cron: rejeita quando o secret nao esta configurado · cron: rejeita token errado de mesmo tamanho · cron: rejeita token com tamanho diferente … |
| `e2e/login.spec.ts` | 7 | Login Flow · should display login form · should show validation errors for empty fields · should show error for invalid credentials … |
| `e2e/sip-flow.spec.ts` | 7 | Fluxo SIP end-to-end · carrega softphone e exibe badge de status SIP · permite digitar número no dialpad e limpar via backspace · inicia tentativa de chamada SIP e atualiza UI … |
| `src/__tests__/rls/deals.test.ts` | 7 | RLS — deals · agent enxerga apenas próprias deals · supervisor enxerga todas · admin enxerga todas … |
| `src/__tests__/rls/rate-limit-logs.test.ts` | 7 | RLS — rate_limit_logs (admin-only forensics) · admin pode ler logs de rate limit · supervisor não pode ler · agent não pode ler … |
| `src/components/accounts/__tests__/AccountJourneyControl.test.tsx` | 7 | AccountJourneyControl · mostra o nome da etapa, nao a chave crua · mantem a chave visivel quando a etapa nao esta cadastrada · confirma a troca com motivo e recarrega a lista … |
| `src/components/admin/extensions/__tests__/HealthScoreBadge.test.tsx` | 7 | HealthScoreBadge — 100+ cenários · exibe ícone good (ShieldCheck) quando score >= 80 · exibe ícone warn (AlertTriangle) quando 50-79 · exibe ícone bad (Heart) quando < 50 … |
| `src/components/calls/__tests__/ActiveCallBar.espera.test.tsx` | 7 | ActiveCallBar: botao de espera · pede a espera ao contexto da chamada, que e quem grava o hold_event · mostra o estado de espera vindo do contexto, nao de um estado local · ActiveCallBar: botao de microfone … |
| `src/components/calls/__tests__/UnifiedSoftphone.falhas.test.tsx` | 7 | UnifiedSoftphone — estados de falha (etapa 233) · mostra o estado do registro SIP da propria linha no cabecalho · mostra o motivo da falha e tenta de novo quando o operador clica em Tentar agora · repete o registro automaticamente com espera crescente … |
| `src/components/calls/live-transcription/__tests__/useLiveTranscription.test.ts` | 7 | useLiveTranscription · estado inicial é seguro · define erro quando getUserMedia falha · startRecording ativa gravação e stopRecording faz cleanup … |
| `src/components/contacts/__tests__/ContactCard.test.tsx` | 7 | ContactCard - menu  · expõe o acionador  · o botão de e-mail aponta para mailto e não seleciona o cartão · clicar no cartão continua selecionando o contato … |
| `src/hooks/__tests__/use-toast.coverage.test.tsx` | 7 | use-toast (coverage) · adds a toast and exposes state via useToast · dismisses a toast and removes it after delay · updates a toast in place … |
| `src/hooks/__tests__/useActiveCallsRealtime.coverage.test.tsx` | 7 | useActiveCallsRealtime (coverage) · loads active calls and holds, computes derived data · filters by selected agent and hold status · starts a tick interval when there are active calls … |
| `src/hooks/__tests__/useAlertHistory.coverage.test.tsx` | 7 | useAlertHistory · loads with empty stats when there are no alerts · computes severity counts, read rate, types and daily stats · applies search, severity and type filters … |
| `src/hooks/__tests__/useAuditLog.coverage.test.tsx` | 7 | useAuditLog · logEvent chama rpc com os parâmetros corretos · logEvent registra erro quando rpc retorna error · logEvent captura exceção lançada … |
| `src/hooks/__tests__/useBestTimeToContact.coverage.test.tsx` | 7 | useBestTimeToContact (coverage) · loads pattern and top patterns when contactId provided · does not query single pattern when no contactId (disabled) · recompute success path … |
| `src/hooks/__tests__/useCallTransfer.coverage.test.tsx` | 7 | useCallTransfer · blind transfer stays pending until confirmed instead of auto-completing on a timer · attended transfer puts call on hold and does not auto-complete · completeTransfer returns early when call not found … |
| `src/hooks/__tests__/useDashboardLayout.coverage.test.tsx` | 7 | useDashboardLayout · initializes with default layout when nothing stored · initializes from stored layout · saves a new layout and persists to localStorage … |
| `src/hooks/__tests__/useDeviceDetection.coverage.test.tsx` | 7 | useDeviceDetection · returns device info helpers · detects new device when existing sessions and new IP · no notification when no existing sessions … |
| `src/hooks/__tests__/useExtensionAudit.scenarios.test.ts` | 7 | useExtensionAudit — cenários (fire-and-forget) · envia RPC log_audit_event com payload correto · lida com erro do RPC sem lançar (fire-and-forget) · lida com exception do RPC sem propagar … |
| `src/hooks/__tests__/useHealthCheck.coverage.test.tsx` | 7 | useHealthCheck · estado inicial: todos checking · runChecks com todos saudáveis => overall healthy · uma falha => degraded … |
| `src/hooks/__tests__/useHoldReminder.coverage.test.tsx` | 7 | useHoldReminder (coverage) · exposes settings and toggles · triggers warning then critical alerts as hold time crosses thresholds · requestBrowserNotifications resolves to granted … |
| `src/hooks/__tests__/useKeyMoments.coverage.test.tsx` | 7 | useKeyMoments · fetches moments when callSessionId provided · does not fetch without id · handles fetch error … |
| `src/hooks/__tests__/useObjectionLibrary.coverage.test.tsx` | 7 | useObjectionLibrary (coverage) · loads objections · list error throws · upsert success and error … |
| `src/hooks/__tests__/usePermissions.coverage.test.tsx` | 7 | usePermissions (coverage) · loads permissions for active roles · returns empty when no user · returns empty when user has no roles … |
| `src/hooks/__tests__/useRealtimeHoldAlerts.coverage.test.tsx` | 7 | useRealtimeHoldAlerts · initializes and fetches unread count · toggles notifications on and off · requests browser notification permission … |
| `src/hooks/__tests__/useRoutingRules.coverage.test.tsx` | 7 | useRoutingRules (coverage) · loads rules · rules fetch error · upsert success … |
| `src/hooks/__tests__/useTimeOff.coverage.test.tsx` | 7 | useTimeOff · lists requests on success · list error leaves requests empty · create success shows toast … |
| `src/hooks/__tests__/useVoipQualityForecast.coverage.test.tsx` | 7 | useVoipQualityForecast · returns forecast payload via functions.invoke · throws on invoke error · useVoipQualityForecastFetch … |
| `src/lib/__tests__/a11y-clickable.test.ts` | 7 | clickableRowProps · entrega semantica de controle focavel · ativa com Enter e com Espaco, consumindo o evento · ignora teclas que nao ativam … |
| `src/lib/__tests__/csv-export.property.test.ts` | 7 | exportToCSV — property-based (500 runs) · escapa aspas duplas conforme RFC 4180 · preserva conteúdo (round-trip de aspas) · aceita quebras de linha nos dados sem corromper estrutura … |
| `src/lib/__tests__/health-score.property.test.ts` | 7 | computeHealth — property-based (1000 runs) · score sempre entre 0 e 100 · máximo absoluto = 100 quando tudo true · mínimo absoluto = 0 quando tudo false … |
| `src/lib/__tests__/safe-number.instrumentation.test.ts` | 7 | safe-number instrumentation · emite evento com motivo e helper para input inválido · reporta clamp de min/max sem descartar o valor · propaga requestId ativo para os eventos … |
| `src/lib/__tests__/security-alerts-webhook-queue.property.test.ts` | 7 | security-alerts-webhook-queue — property-based (fast-check) · enqueue nunca excede MAX_QUEUE (50) · clearWebhookQueue sempre esvazia · hashEndpoint é determinístico e sempre 12 chars hex … |
| `src/lib/__tests__/session-expiry.test.ts` | 7 | isSessionExpiredError · reconhece o 401 do fetch do supabase-js · reconhece o PGRST301 do PostgREST mesmo sem status · reconhece a mensagem de JWT vencido de edge function … |
| `src/lib/metrics/__tests__/mos.test.ts` | 7 | classifyMos · usa 3.5 como fronteira de ruim · separa mediano, bom e excelente · trata ausência e valores inválidos como unknown … |
| `src/lib/mfa/__tests__/index.coverage.test.ts` | 7 | mfa (coverage) · returns disabled default when no settings row · maps existing settings row including backup codes · handles settings row with falsy/missing fields … |
| `src/lib/security/__tests__/helmet-config.coverage.test.ts` | 7 | helmet-config (coverage) · DEFAULT_SECURITY_HEADERS has expected secure defaults · getSecurityHeaders returns defaults when no overrides · getSecurityHeaders merges overrides … |
| `src/lib/session/__tests__/index.coverage.test.ts` | 7 | session/index · getActiveSessions maps rows · getActiveSessions handles null data and is_active falsy · terminateSession returns true when no error … |
| `src/pages/__tests__/SlaViolations.test.tsx` | 7 | SlaViolations · mostra os indicadores do periodo · lista contato, motivo e atraso de cada violacao · mostra vazio quando nao ha violacao … |
| `supabase/functions/cleanup-recordings/__tests__/retencao_test.ts` | 7 | corte de retencao fica exatamente 180 dias atras · gravacao com 179 dias ainda nao vence · gravacao com 181 dias vence · cron: aceita bearer exato do token configurado … |
| `supabase/functions/score-call-attempt/__tests__/index.test.ts` | 7 | score-call-attempt: 401 sem Authorization · score-call-attempt: validação rejeita phone curto demais · score-call-attempt: DNC força score=0 e recommendation=block · score-call-attempt: fora de horário multiplica score por 0.1 … |
| `supabase/functions/translate-utterance/__tests__/index.test.ts` | 7 | translate-utterance: 401 sem Authorization · translate-utterance: 400 com body inválido (sem callSessionId) · translate-utterance: rejeita idioma não suportado · translate-utterance: trata 429 (rate limit) sem expor stack … |
| `e2e/calls.spec.ts` | 6 | Calls Flow · should display calls page · should display softphone component · should navigate to call history … |
| `src/__tests__/rls/learning-completions.test.ts` | 6 | RLS — learning_completions · agente só vê próprias conclusões · supervisor vê todas · agente NÃO pode inserir conclusão de outro agente … |
| `src/__tests__/rls/storage-recordings.test.ts` | 6 | Storage — call-recordings (ownership por path) · bucket é privado: anônimo é bloqueado · agente lê apenas próprias gravações · agente faz upload apenas no próprio prefixo … |
| `src/components/auth/__tests__/PermissionGate.test.tsx` | 6 | PermissionGate · nao renderiza nada enquanto as permissoes carregam · mostra o estado padrao de sem permissao quando nao ha fallback · respeita fallback explicito, inclusive null … |
| `src/components/call-library/__tests__/SurveysPanel.test.tsx` | 6 | SurveysPanel · envia a pesquisa escolhida pelo id real (nao um valor fixo) · sem pesquisa cadastrada bloqueia o envio e explica o motivo · cria pesquisa com o nome informado … |
| `src/components/compliance/dnc/__tests__/DNCTable.test.tsx` | 6 | DNCTable — rastreabilidade e edicao (etapa 175) · tem rotulo acessivel para editar e para remover, com o telefone · pede confirmacao mostrando o numero antes de remover · mostra autor e data quando a entrada foi removida … |
| `src/components/contacts/__tests__/SavedFiltersBar.test.tsx` | 6 | SavedFiltersBar · avisa quando o usuário ainda não salvou nenhum filtro · aplica o preset clicado · aplica o filtro padrão uma única vez, mesmo com onApply trocando de identidade … |
| `src/hooks/__tests__/useAudioOutputDevices.test.tsx` | 6 | useAudioOutputDevices · reporta não suportado quando setSinkId ausente · enumera dispositivos de saída e ignora inputs · persiste a preferência ao chamar setSinkId com sucesso … |
| `src/hooks/__tests__/useBattleCardDetection.test.ts` | 6 | useBattleCardDetection · does nothing when inactive · matches contains keyword · matches exact keyword as a whole word … |
| `src/hooks/__tests__/useBitrixAndWebAuthn.test.ts` | 6 | useBitrix · gets contacts from Bitrix · handles unconfigured service · useWebAuthn … |
| `src/hooks/__tests__/useCadences.coverage.test.tsx` | 6 | useCadences · loads cadences and steps, creates and enrolls · handles create/add/enroll errors · useCadenceEnrollments … |
| `src/hooks/__tests__/useCallAnalytics.coverage.test.tsx` | 6 | useCallAnalytics · loads data and computes empty stats with no sessions · computes stats across sessions and summaries · filters sessions by date range … |
| `src/hooks/__tests__/useCallSearch.test.ts` | 6 | useCallSearch · inicia vazio · não chama backend quando query vazia · preenche resultados em sucesso … |
| `src/hooks/__tests__/useCoachingAssignments.coverage.test.tsx` | 6 | useCoachingAssignments · carrega assignments · cria assignment com sucesso · completa assignment com sucesso … |
| `src/hooks/__tests__/useCulturalHints.coverage.test.tsx` | 6 | useCulturalHints (coverage) · returns empty hints when no langCode provided · loads hints for a language code · handles null data gracefully … |
| `src/hooks/__tests__/useFinancialImpact.property.test.ts` | 6 | useFinancialImpact helpers (PBT) · summarize: linearidade dos totais e sinal do lucro coerente · summarize: aditividade — summarize(A∪B) == somar totais individuais · pct: identidade, previous=0 e simetria de sinal … |
| `src/hooks/__tests__/useGoalViolations.coverage.test.tsx` | 6 | useGoalViolations · fetches violations and processes chart data · subscribes to realtime channel and cleans up · handles fetch error … |
| `src/hooks/__tests__/useLiveSentiment.coverage.test.tsx` | 6 | useLiveSentiment · does nothing without callSessionId · loads snapshots and subscribes to realtime channel · handles null data from initial load … |
| `src/hooks/__tests__/useMeetingSummary.test.ts` | 6 | useMeetingSummary - parse · normaliza arrays nulos para [] · useMeetingSummary - generate · sucesso → toast.success … |
| `src/hooks/__tests__/useMultiChannelCall.compliance.test.tsx` | 6 | useMultiChannelCall — barreira de compliance (etapa 034) · bloqueia a discagem quando o pre-dial check reprova · libera a discagem quando ha mais de um motivo aprovado · chamada recebida ignora a barreira (skipComplianceCheck) … |
| `src/hooks/__tests__/useNetworkMonitor.coverage.test.tsx` | 6 | useNetworkMonitor (coverage) · pings /favicon.ico and classifies as online on success · reports offline when navigator is offline · handles ping error -> unstable then offline after repeated failures … |
| `src/hooks/__tests__/useRateLimitData.writeResult.test.tsx` | 6 | useRateLimitData — resultado real das escritas · pede a contagem ao banco nas duas escritas · unblockIP nao anuncia sucesso quando 0 linhas foram alteradas · unblockIP anuncia sucesso quando a linha foi alterada … |
| `src/hooks/__tests__/useTrunkHealth.coverage.test.tsx` | 6 | useTrunkHealth (coverage) · loads health history for a trunk · is disabled without trunkId · history fetch error throws … |
| `src/hooks/__tests__/useVoiceCommand.coverage.test.tsx` | 6 | useVoiceCommand (coverage) · processes audio successfully via start/stop · handles transcribe error · handles command error but keeps transcription … |
| `src/hooks/__tests__/useVoipAutoRemediation.coverage.test.tsx` | 6 | useVoipAutoRemediation · sugere remediação e dispara toast de erro · throttle impede segunda sugestão dentro de 30s · ação reconectar chama reconnect e toast de sucesso … |
| `src/hooks/telemetry/__tests__/useTelemetry.coverage.test.tsx` | 6 | useTelemetry · registra observadores de web-vitals quando há usuário · não registra quando não há usuário · envia métrica ao supabase (sucesso) … |
| `src/lib/__tests__/dialer-filter-storage.test.ts` | 6 | dialer-filter-storage · sanitiza qualquer entrada para um filtro válido · round-trip: o que é salvo é o que é lido · escopos distintos nunca compartilham valor … |
| `src/lib/__tests__/dialer-tag-filter.test.ts` | 6 | filtro rápido por etiqueta (PBT) · resultado é sempre subconjunto ordenado da lista original · filtro  · filtrar por uma etiqueta existente retorna apenas itens equivalentes … |
| `src/lib/__tests__/security-alerts-webhook-history.property.test.ts` | 6 | security-alerts-webhook-history (PBT) · respeita cap MAX_ENTRIES e mantém ordem do mais recente para o mais antigo · descarta entradas corrompidas no storage sem lançar · truncateResponseSnippet nunca retorna string maior que o input + marcador … |
| `src/lib/__tests__/webrtc-config.test.ts` | 6 | getIceServers · retorna STUN servers padrão sem TURN quando envs ausentes · inclui TURN quando todas as envs estão presentes · não inclui TURN quando falta uma das credenciais … |
| `src/lib/audio/__tests__/deviceTest.test.ts` | 6 | deviceTest · explica a recusa de permissão e não vaza stream · mede o nível e libera o microfone ao parar · avisa quando não há microfone disponível … |
| `src/lib/audit/__tests__/index.coverage.test.ts` | 6 | audit/index (coverage) · logAuditEvent returns id on success · logAuditEvent defaults details to empty object and resourceId undefined · logAuditEvent returns null on supabase error … |
| `src/pages/admin/__tests__/ClientErrors.test.tsx` | 6 | pagina Erros do Cliente · mostra os KPIs e a tabela com rota, mensagem e trace · resolve o erro escolhido · estado vazio explica o filtro de nao resolvidos … |
| `src/routes/__tests__/callHistoryAlias.test.tsx` | 6 | alias /call-history -> /history (etapa 266) · /call-history nao renderiza mais CallHistory, e sim o alias · /history continua entregando a pagina real · redireciona /call-history para /history … |
| `supabase/functions/__tests__/optimistic-lock.test.ts` | 6 | optimistic-lock: migration canonica do trigger existe · optimistic-lock: detecta divergencia de versao e lanca OPTIMISTIC_LOCK_CONFLICT · optimistic-lock: incrementa a versao quando nao ha divergencia · optimistic-lock: conflito e auditado em optimistic_lock_conflicts … |
| `supabase/functions/_shared/__tests__/allowed-hosts.test.ts` | 6 | aceita hosts públicos https · bloqueia loopback, metadata e esquemas perigosos · faixas privadas são liberáveis apenas com allowPrivate · metadata continua bloqueada mesmo com allowPrivate … |
| `supabase/functions/_shared/__tests__/cron-db-token_test.ts` | 6 | tokenDoBearer: aceita o formato do cron · tokenDoBearer: recusa header ausente, sem prefixo ou vazio · tokenCronValido: true apenas quando o banco devolve true · tokenCronValido: false quando o banco nega ou erra … |
| `supabase/functions/analyze-call/__tests__/schema_test.ts` | 6 | AnalyzeCallSchema - valid data · AnalyzeCallSchema - missing transcript · AnalyzeCallSchema - transcript too short · AnalyzeCallSchema - transcript too long … |
| `supabase/functions/bitrix-api/__tests__/upstream-falha.test.ts` | 6 | bitrix-api: caminho feliz devolve os contatos · bitrix-api: 500 do Bitrix e reenviado 2x e termina em 502 · bitrix-api: 429 do Bitrix e tratado como indisponibilidade (502) · bitrix-api: timeout do Bitrix vira 504 … |
| `supabase/functions/email-inbound/__tests__/index.test.ts` | 6 | email-inbound: sem message_id devolve 422 (sem chave nao ha idempotencia) · email-inbound: from/subject ausentes continuam devolvendo 400 · email-inbound: subject acima do teto devolve 422 com o campo apontado · email-inbound: ticket ja existente responde 200 idempotent_replay sem escrever … |
| `supabase/functions/record-consent/__tests__/index.test.ts` | 6 | record-consent: OPTIONS devolve preflight · record-consent: sem Authorization responde 401 · record-consent: token invalido nao grava consentimento · record-consent: canal fora do enum nao e aceito … |
| `supabase/functions/validate-ip/__tests__/index.test.ts` | 6 | validate-ip: CORS preflight retorna headers válidos · validate-ip: rejeita requisição sem Authorization header · validate-ip: extrai IP de cf-connecting-ip prioritariamente · validate-ip: fallback para x-forwarded-for quando cf/real ausentes … |
| `supabase/functions/voip-sla-report/__tests__/index.test.ts` | 6 | voip-sla-report: exige Authorization · voip-sla-report: rejeita token inválido · voip-sla-report: rejeita period inválido · voip-sla-report: aceita period=day/week/month na shape … |
| `supabase/functions/whatsapp-inbound/contract.test.ts` | 6 | WhatsApp Inbound V1 - Valid Payload · WhatsApp Inbound V1 - Missing Required Fields · WhatsApp Inbound V1 - Invalid Attachment URL · WhatsApp Inbound V2 - Valid Payload (New ID field) … |
| `e2e/observability.spec.ts` | 5 | Observability Dashboard · should display observability page · should display Web Vitals cards · should display health check results … |
| `src/__tests__/rls/contacts.test.ts` | 5 | RLS — contacts (matriz por role) · %s pode SELECT contacts · %s pode INSERT contacts · %s pode UPDATE contacts … |
| `src/components/calls/__tests__/AudioOutputSelector.test.tsx` | 5 | AudioOutputSelector · mostra mensagem quando não suportado · renderiza o combobox quando suportado · desabilita quando não há dispositivos disponíveis (usa fallback padrão) … |
| `src/components/calls/__tests__/CrmSuggestionsCard.test.tsx` | 5 | CrmSuggestionsCard · explica o vazio em vez de sumir da tela · mostra carregando enquanto a consulta roda · mostra o erro da consulta … |
| `src/components/calls/__tests__/NextBestActionPanel.test.tsx` | 5 | NextBestActionPanel · mostra o erro da consulta em vez de um painel vazio · distingue carregando de sem sugestao · lista o sinal e marca como usado … |
| `src/components/supervisor/panel/__tests__/TrendChartToggle.test.tsx` | 5 | TrendChartToggle · não monta o gráfico antes do primeiro clique · conserva o gráfico montado ao fechar, para o histórico não zerar · não reinicia o gráfico quando o pai reflete o fechamento … |
| `src/hooks/__tests__/useAnimatedCounter.coverage.test.tsx` | 5 | useAnimatedCounter · returns 0 initially and animates toward the end value · respects decimals option · early-returns when diff is zero … |
| `src/hooks/__tests__/useBlockedAccessLogs.coverage.test.tsx` | 5 | useBlockedAccessLogs · fetches logs and processes stats · handles fetch error · filters logs by search, country, reason; clears filters … |
| `src/hooks/__tests__/useConsent.coverage.test.tsx` | 5 | useConsent · carrega registros sem contactId · carrega registros filtrando por contactId · registra consentimento com sucesso … |
| `src/hooks/__tests__/useDeals.conflict.test.ts` | 5 | useDeals — OPTIMISTIC_LOCK_CONFLICT · trata conflito com toast PT-BR e dispara refetch · envia version da linha lida no update (lock otimista ativo) · updateStage (kanban) também envia version … |
| `src/hooks/__tests__/useExtensionAuditHistory.coverage.test.tsx` | 5 | useExtensionAuditHistory · fica desabilitado quando agentId é null · carrega histórico com sucesso · retorna lista vazia quando data é null … |
| `src/hooks/__tests__/useExtensionsOverview.coverage.test.tsx` | 5 | useExtensionsOverview · aggregates agents with trunks, devices, profiles and calls · handles empty datasets · throws when agents query errors … |
| `src/hooks/__tests__/useHoldSoundAlert.coverage.test.tsx` | 5 | useHoldSoundAlert · toggles sound and persists to localStorage · reads persisted disabled state · plays test sounds … |
| `src/hooks/__tests__/useLearning.coverage.test.tsx` | 5 | useLearning · loads modules and completions · markComplete success shows toast · markComplete error shows toast … |
| `src/hooks/__tests__/useMultiDeviceRing.coverage.test.tsx` | 5 | useMultiDeviceRing · loads devices and default settings, runs mutations · updateSettings updates existing record · não cria outra linha de configurações quando a leitura falha … |
| `src/hooks/__tests__/useOptimisticLockConflicts.coverage.test.tsx` | 5 | useOptimisticLockConflicts · aggregates stats for default 24h period · applies table filter via eq · does not filter when tableFilter is  … |
| `src/hooks/__tests__/useProfile.coverage.test.tsx` | 5 | useProfile · loads profile on mount · updates profile successfully · strips id/role from updates and rolls back on error … |
| `src/hooks/__tests__/useQualityAlerts.coverage.test.tsx` | 5 | useQualityAlerts · does not alert when there are no metrics · does not alert when quality is good · alerts when quality_label is poor … |
| `src/hooks/__tests__/useRateLimitData.coverage.test.tsx` | 5 | useRateLimitData · loads data and exposes derived state · filters logs by search term · runs refresh, resolveAlert, unblockIP and cleanOldLogs … |
| `src/hooks/__tests__/useTrunkFailoverMonitor.coverage.test.tsx` | 5 | useTrunkFailoverMonitor · subscribes to channel and cleans up on unmount · fires a warning toast when failover_count increases · does not fire when failover_count did not increase … |
| `src/hooks/__tests__/useTrunkUsageReporter.coverage.test.tsx` | 5 | useTrunkUsageReporter · records usage when trunk context present · no-op when no trunk_id · no-op when start given null … |
| `src/hooks/__tests__/useUnreadConflicts.coverage.test.tsx` | 5 | useUnreadConflicts (coverage) · returns the conflict count for admin · returns 0 when count is null · returns 0 on query error (logged, not thrown) … |
| `src/hooks/__tests__/useVoipCapacityRecommendations.coverage.test.tsx` | 5 | useVoipCapacityRecommendations (coverage) · fetches recommendations successfully (default horizon) · passes a custom forecast horizon · errors when there is no session … |
| `src/hooks/__tests__/useVoipExecutiveNarrative.coverage.test.tsx` | 5 | useVoipExecutiveNarrative (coverage) · is disabled by default and does not fetch · fetches when enabled (week) · fetches with month period … |
| `src/hooks/__tests__/useVoipMonitoringSettings.coverage.test.tsx` | 5 | useVoipMonitoringSettings (coverage) · loads settings successfully · updates existing settings (id present) · inserts when no existing settings … |
| `src/hooks/__tests__/useVoipRecommendationHistory.coverage.test.tsx` | 5 | useVoipRecommendationHistory · returns data on success with default options · passes custom period and limit · errors when invoke returns error … |
| `src/lib/__tests__/bitrix-sync-status.test.ts` | 5 | normalizarSyncStatus · traduz o vocabulario da edge · preserva o vocabulario do front · cai em pendente para nulo, vazio e valor desconhecido … |
| `src/lib/__tests__/favorite-sync-labels.test.ts` | 5 | maskPhone · preserva apenas os últimos dígitos · nunca vaza mais de 4 dígitos (PBT) · describeFavorite … |
| `src/lib/__tests__/navigation-progress-store.test.ts` | 5 | navigation-progress-store · starts idle · reports loading between start and finish and notifies subscribers · only stops loading when every concurrent navigation finished … |
| `src/lib/__tests__/predictive-pace.property.test.ts` | 5 | calculatePredictivePace — property-based (1000 runs) · sugestão sempre dentro de [minPace, maxPace] · sem agentes livres → suggested = minPace · abandono acima do alvo → nunca sobe o pace … |
| `src/lib/__tests__/web-vitals.coverage.test.ts` | 5 | web-vitals · getWebVitals returns an array · initWebVitals registers observers and records metrics across ratings · handles empty paint entries without throwing … |
| `src/lib/export/__tests__/index.coverage.test.ts` | 5 | export/index · exportToCSV downloads with BOM and formatting · exportToCSV no-ops on empty data · exportToJSON downloads … |
| `src/lib/security/__tests__/encryption.coverage.test.ts` | 5 | encryption (coverage) · round-trips encrypt/decrypt with a generated key · hashData returns base64 string with real crypto · arrayBufferToBase64 and base64ToArrayBuffer are inverse operations … |
| `src/lib/security/__tests__/security-headers-validator.coverage.test.ts` | 5 | security-headers-validator · returns all headers present when fetch succeeds · returns all headers absent when fetch rejects · handles a mixed set of present/absent headers … |
| `src/pages/__tests__/IPWhitelist.test.tsx` | 5 | IPWhitelist · alerts when the whitelist could not be read · shows the genuine empty state when the read succeeded · does not present an empty user table as  … |
| `src/pages/__tests__/SLAPolicies.enforce.test.tsx` | 5 | SLAPolicies — enforcement e violacoes (etapas 151 e 179) · o botao de verificacao dispara o enforcement · mostra as violacoes por canal, so os canais com violacao · lista as conversas em violacao … |
| `src/pages/__tests__/Status.test.tsx` | 5 | Status — sem medição (E092) · mostra  · mostra  · Status — erro no carregamento (E093) … |
| `supabase/functions/_shared/__tests__/rate-limit.test.ts` | 5 | rate-limit: DB liberado devolve allowed · rate-limit: DB bloqueando devolve allowed=false com motivo · rate-limit: erro do banco segue fail-open por padrao · rate-limit: erro do banco nega quando onError=deny … |
| `supabase/functions/analyze-call/__tests__/upstream-falha.test.ts` | 5 | analyze-call: caminho feliz devolve a analise estruturada · analyze-call: IA sem prazo devolve 503 AI_UNAVAILABLE sem gravar nada · analyze-call: 500 do provedor devolve 503 AI_SERVICE_UNAVAILABLE · analyze-call: 429 do provedor devolve 503 AI_SERVICE_UNAVAILABLE … |
| `supabase/functions/auto-scorecard/__tests__/upstream-falha.test.ts` | 5 | auto-scorecard: caminho feliz grava scorecard e respostas · auto-scorecard: IA sem prazo devolve 503 sem gravar nada · auto-scorecard: 429 do provedor devolve 503 sem gravar nada · auto-scorecard: 500 do provedor devolve 503 sem gravar nada … |
| `supabase/functions/chatbot-respond/__tests__/index.test.ts` | 5 | chatbot-respond: sem visitor_token e sem sessao devolve 401 · chatbot-respond: corpo sem conversation_id devolve 400 · chatbot-respond: conversation_id que nao e UUID devolve 400 · chatbot-respond: user_message acima do teto devolve 422 com o campo apontado … |
| `supabase/functions/chatbot-respond/__tests__/upstream-falha.test.ts` | 5 | chatbot-respond: caminho feliz responde ao visitante e grava a mensagem · chatbot-respond: IA sem prazo devolve 503 sem gravar nada · chatbot-respond: 429 do provedor devolve 503 sem gravar nada · chatbot-respond: 500 do provedor devolve 503 sem gravar nada … |
| `supabase/functions/notify-new-device/__tests__/index.test.ts` | 5 | notify-new-device: sem header Authorization devolve 401 · notify-new-device: header Authorization vazio tambem devolve 401 · notify-new-device: preflight OPTIONS responde com CORS da origem permitida · notify-new-device: HTML do aviso escapa todo valor vindo do corpo … |
| `supabase/functions/notify-new-device/__tests__/upstream-falha.test.ts` | 5 | notify-new-device: caminho feliz envia o e-mail e nao grava no banco · notify-new-device: timeout do Resend devolve 5xx sem gravar nada · notify-new-device: 429 do Resend devolve 5xx sem gravar nada · notify-new-device: 500 do Resend devolve 5xx sem gravar nada … |
| `supabase/functions/score-call/index.test.ts` | 5 | computeWeightedTotal — limita a nota ao max_score do critério · computeWeightedTotal — nota negativa vira zero · computeWeightedTotal — soma ponderada normal · computeWeightedTotal — critério desconhecido é ignorado … |
| `supabase/functions/voip-recommendation-simulate/__tests__/index.test.ts` | 5 | rejeita requisição sem JWT · rejeita corpo sem recommendationId · projectImpact retorna baseline nulo sem dados · projectImpact projeta melhoria de MOS positiva … |
| … +128 linhas — lista completa em `context.json` | | |

## L. Eventos de webhook tratados (contratos com sistemas externos)

_nenhum item encontrado_

## M. Efeitos colaterais (e-mail, SMS, cobrança, fila — não são idempotentes por padrão)

| Chamada | Arquivo |
|---|---|
| `notifySessionExpired` | `src/App.tsx` |
| `notify` | `src/components/callbacks/ScheduledCallbacksList.tsx` |
| `invoke(` | `src/components/calls/ActiveCallBar.tsx` |
| `invoke(` | `src/components/calls/UnifiedSoftphone.tsx` |
| `invoke(` | `src/components/coaching/CoachingCopilotCard.tsx` |
| `invoke(` | `src/components/contacts/ContactDetailSheet.tsx` |
| `notify_on_critical` | `src/components/dashboard/DashboardGoalsSettings.tsx` |
| `notify_on_warning` | `src/components/dashboard/DashboardGoalsSettings.tsx` |
| `invoke(` | `src/components/dashboard/SystemIntegrityDashboard.tsx` |
| `invoke(` | `src/components/network/CapacityForecastChart.tsx` |
| `invoke(` | `src/components/network/QualityHeatmap.tsx` |
| `invoke(` | `src/components/network/SlaReportCards.tsx` |
| `invoke(` | `src/components/settings/BitrixSyncStatus.tsx` |
| `invoke(` | `src/components/settings/SystemMaintenancePanel.tsx` |
| `.add('dark'` | `src/contexts/ThemeContext.tsx` |
| `invoke(` | `src/hooks/useAccounts.ts` |
| `invoke(` | `src/hooks/useAdherence.ts` |
| `notifyError` | `src/hooks/useAgentRanking.ts` |
| `invoke(` | `src/hooks/useAlerts.ts` |
| `invoke(` | `src/hooks/useBestTimeToContact.ts` |
| `invoke(` | `src/hooks/useBitrix.ts` |
| `invoke(` | `src/hooks/useCallScoring.ts` |
| `invoke(` | `src/hooks/useCallSearch.ts` |
| `enqueue(` | `src/hooks/useCallSession.ts` |
| `invoke(` | `src/hooks/useCallSession.ts` |
| `invoke(` | `src/hooks/useChatbot.ts` |
| `invoke(` | `src/hooks/useCoaching.ts` |
| `invoke(` | `src/hooks/useCoachingTrack.ts` |
| `invoke(` | `src/hooks/useConsent.ts` |
| `invoke(` | `src/hooks/useContactAlerts.ts` |
| `invoke(` | `src/hooks/useCrmFieldSuggestions.ts` |
| `notify_on_critical` | `src/hooks/useDashboardGoals.ts` |
| `notify_on_warning` | `src/hooks/useDashboardGoals.ts` |
| `invoke(` | `src/hooks/useDataLakeExports.ts` |
| `invoke(` | `src/hooks/useDealForecast.ts` |
| `invoke(` | `src/hooks/useDeals.ts` |
| `invoke(` | `src/hooks/useDeviceDetection.ts` |
| `notify` | `src/hooks/useDeviceDetection.ts` |
| `notifyError` | `src/hooks/useDeviceDetection.ts` |
| `invoke(` | `src/hooks/useForecastVolume.ts` |
| `invoke(` | `src/hooks/useGeoBlocking.ts` |
| `notify_on_block` | `src/hooks/useGeoBlocking.ts` |
| `invoke(` | `src/hooks/useHealthCheck.ts` |
| `notify_on_critical` | `src/hooks/useHoldSoundAlert.ts` |
| `notify_on_warning` | `src/hooks/useHoldSoundAlert.ts` |
| `invoke(` | `src/hooks/useIPValidation.ts` |
| `invoke(` | `src/hooks/useKeyMoments.ts` |
| `invoke(` | `src/hooks/useKnowledgeBase.ts` |
| `invoke(` | `src/hooks/useLDAPSync.ts` |
| `invoke(` | `src/hooks/useLiveAssist.ts` |
| `invoke(` | `src/hooks/useLiveTranslation.ts` |
| `invoke(` | `src/hooks/useLoginLockout.ts` |
| `invoke(` | `src/hooks/useMeetingSummary.ts` |
| `notify_incoming_calls` | `src/hooks/useNotificationPreferences.ts` |
| `notify_missed_calls` | `src/hooks/useNotificationPreferences.ts` |
| `notify_sound` | `src/hooks/useNotificationPreferences.ts` |
| `notify_voicemail` | `src/hooks/useNotificationPreferences.ts` |
| `invoke(` | `src/hooks/usePredictivePacing.ts` |
| `invoke(` | `src/hooks/useQueueMetrics.ts` |
| `notify_on_critical` | `src/hooks/useQueueMetrics.ts` |
| `notify_on_warning` | `src/hooks/useQueueMetrics.ts` |
| `invoke(` | `src/hooks/useRecordings.ts` |
| `invoke(` | `src/hooks/useSLA.ts` |
| `invoke(` | `src/hooks/useScorecards.ts` |
| `invoke(` | `src/hooks/useShiftSwapSuggestions.ts` |
| `invoke(` | `src/hooks/useSipCall.ts` |
| `invoke(` | `src/hooks/useSurveys.ts` |
| `notify` | `src/hooks/useSyncHistory.ts` |
| `invoke(` | `src/hooks/useTalkRatio.ts` |
| `invoke(` | `src/hooks/useTrunkHealth.ts` |
| `invoke(` | `src/hooks/useVirtualFaxOcr.ts` |
| `invoke(` | `src/hooks/useVoiceBiometrics.ts` |
| `invoke(` | `src/hooks/useVoiceCommand.ts` |
| `invoke(` | `src/hooks/useVoipDiagnosticVoiceQA.ts` |
| `invoke(` | `src/hooks/useVoipExecutiveNarrative.ts` |
| `invoke(` | `src/hooks/useVoipExecutiveSummary.ts` |
| `invoke(` | `src/hooks/useVoipQualityAlertsSummary.ts` |
| `invoke(` | `src/hooks/useVoipQualityForecast.ts` |
| `invoke(` | `src/hooks/useVoipRecommendationHistory.ts` |
| `invoke(` | `src/hooks/useVoipRecommendationInsights.ts` |
| `invoke(` | `src/hooks/useVoipRecommendationSimulate.ts` |
| `invoke(` | `src/hooks/useVoipRecommendations.ts` |
| `invoke(` | `src/hooks/useVoipTrunks.ts` |
| `invoke(` | `src/hooks/useWavoipCall.ts` |
| `invoke(` | `src/hooks/useWebAuthn.ts` |
| `notify_bloat_hotspots` | `src/integrations/supabase/types.ts` |
| `notify_idle_indexes` | `src/integrations/supabase/types.ts` |
| `notify_incoming_calls` | `src/integrations/supabase/types.ts` |
| `notify_missed_calls` | `src/integrations/supabase/types.ts` |
| `notify_on_block` | `src/integrations/supabase/types.ts` |
| `notify_on_critical` | `src/integrations/supabase/types.ts` |
| `notify_on_warning` | `src/integrations/supabase/types.ts` |
| `notify_sound` | `src/integrations/supabase/types.ts` |
| `notify_voicemail` | `src/integrations/supabase/types.ts` |
| `enqueue(` | `src/lib/pendingCallWrites.ts` |
| `notifySessionExpired` | `src/lib/session-expiry.ts` |
| `invoke(` | `src/lib/tracing.ts` |
| `invoke(` | `src/lib/notifications/index.ts` |
| `sendNotification` | `src/lib/notifications/index.ts` |
| `invoke(` | `src/pages/ExternalRecordingsImport.tsx` |
| `invoke(` | `src/pages/ForgotPassword.tsx` |
| `notify` | `src/pages/GeoBlocking.tsx` |
| `notify_on_block` | `src/pages/GeoBlocking.tsx` |
| `notify_on_critical` | `src/pages/HoldAlertSettings.tsx` |
| `notify_on_warning` | `src/pages/HoldAlertSettings.tsx` |
| `invoke(` | `src/pages/Login.tsx` |
| `notify` | `src/pages/Login.tsx` |
| `invoke(` | `src/pages/ObservabilityDashboard.tsx` |
| `invoke(` | `src/pages/PasswordResetApproval.tsx` |
| `notify_incoming_calls` | `src/pages/Settings.tsx` |
| `notify_missed_calls` | `src/pages/Settings.tsx` |
| `notify_sound` | `src/pages/Settings.tsx` |
| `notify_voicemail` | `src/pages/Settings.tsx` |
| `invoke(` | `src/pages/admin/SloDashboard.tsx` |
| `notify_on_critical` | `supabase/functions/check-goals/index.ts` |
| `notify_on_warning` | `supabase/functions/check-goals/index.ts` |
| `notify` | `supabase/functions/notify-blocked-ip/index.ts` |
| `notify` | `supabase/functions/notify-new-device/index.ts` |
| `invoke(` | `supabase/functions/sync-crm-queue/index.ts` |
| `notify_on_block` | `supabase/functions/validate-geo/index.ts` |
| `notify_ops_volume_drop` | `supabase/functions/voip-anomaly-remediation/index.ts` |
| `notify_supervisor_quality_drift` | `supabase/functions/voip-anomaly-remediation/index.ts` |
| `notifyInsertErr` | `supabase/functions/voip-failover-notifier/index.ts` |
| `notify_critical_event` | `supabase/migrations/20250103000000_triggers.sql` |
| `notify_critical_event_trigger` | `supabase/migrations/20250103000000_triggers.sql` |
| `notify_on_critical` | `supabase/migrations/20251223220228_f4ebbaa7-ea1c-447d-a07b-e1c0f583963d.sql` |
| `notify_on_warning` | `supabase/migrations/20251223220228_f4ebbaa7-ea1c-447d-a07b-e1c0f583963d.sql` |
| `notify_on_critical` | `supabase/migrations/20251224142716_d2c04aae-f048-4e7c-b447-1d6e3a840412.sql` |
| `notify_on_warning` | `supabase/migrations/20251224142716_d2c04aae-f048-4e7c-b447-1d6e3a840412.sql` |
| `notify_on_block` | `supabase/migrations/20260315143858_create_geo_tables_retroativo.sql` |
| `notify_lock_conflict_hotspot` | `supabase/migrations/20260418134513_8f99e4ad-bf44-4a71-b2ac-bc59c555a283.sql` |
| `notify_trunk_offline` | `supabase/migrations/20260418143532_ce6a3be9-4e9b-4d97-85ba-276c8ee1354c.sql` |
| `notify_bloat_hotspots` | `supabase/migrations/20260712110237_ae094d69-c026-433d-b7b1-232eb615e4cd.sql` |
| `notify_idle_indexes` | `supabase/migrations/20260712112627_4ad8101d-5e02-4b1c-a570-f8338fc90f70.sql` |
| `notify_suspicious_index_drop_activity` | `supabase/migrations/20260712115542_c8c86e0b-f57f-45aa-a5d4-d11855cbc993.sql` |
| `notify_webhook_failure_spike` | `supabase/migrations/20260712195929_25a722b8-6454-47c7-993c-ca936114bac7.sql` |
| `notify_bloat_hotspots` | `supabase/migrations/20260712220202_52e516fc-3b1c-45ce-9c00-3dd4f6acb406.sql` |
| `notify_idle_indexes` | `supabase/migrations/20260712220202_52e516fc-3b1c-45ce-9c00-3dd4f6acb406.sql` |
| `notify_lock_conflict_hotspot` | `supabase/migrations/20260712220202_52e516fc-3b1c-45ce-9c00-3dd4f6acb406.sql` |
| `notify_suspicious_index_drop_activity` | `supabase/migrations/20260712220202_52e516fc-3b1c-45ce-9c00-3dd4f6acb406.sql` |
| `notify_trunk_offline` | `supabase/migrations/20260712220202_52e516fc-3b1c-45ce-9c00-3dd4f6acb406.sql` |
| `notify_webhook_failure_spike` | `supabase/migrations/20260712220202_52e516fc-3b1c-45ce-9c00-3dd4f6acb406.sql` |
| `notify_bloat_hotspots` | `supabase/migrations/20261122183000_hardening_revoke_internal_functions.sql` |
| `notify_idle_indexes` | `supabase/migrations/20261122183000_hardening_revoke_internal_functions.sql` |
| `notify_lock_conflict_hotspot` | `supabase/migrations/20261122183000_hardening_revoke_internal_functions.sql` |
| `notify_suspicious_index_drop_activity` | `supabase/migrations/20261122183000_hardening_revoke_internal_functions.sql` |
| `notify_trunk_offline` | `supabase/migrations/20261122183000_hardening_revoke_internal_functions.sql` |
| `notify_webhook_failure_spike` | `supabase/migrations/20261122183000_hardening_revoke_internal_functions.sql` |
| `notify_lock_conflict_hotspot` | `supabase/migrations/20261122240000_policies_read_user_roles.sql` |
| `notify_bloat_hotspots` | `supabase/migrations/20261122270000_notification_recipients_use_user_roles.sql` |
| `notify_idle_indexes` | `supabase/migrations/20261122270000_notification_recipients_use_user_roles.sql` |
| `notify_suspicious_index_drop_activity` | `supabase/migrations/20261122270000_notification_recipients_use_user_roles.sql` |
| `notify_trunk_offline` | `supabase/migrations/20261122270000_notification_recipients_use_user_roles.sql` |
| `notify_webhook_failure_spike` | `supabase/migrations/20261122270000_notification_recipients_use_user_roles.sql` |
| `notify_incoming_calls` | `supabase/migrations/20261123120000_user_preferences.sql` |
| `notify_missed_calls` | `supabase/migrations/20261123120000_user_preferences.sql` |
| `notify_sound` | `supabase/migrations/20261123120000_user_preferences.sql` |
| `notify_voicemail` | `supabase/migrations/20261123120000_user_preferences.sql` |

## N. Regras citadas em comentários do código

| Comentário | Arquivo |
|---|---|
| Envia apenas os primeiros 5 caracteres (k-anonymity) | `src/components/auth/PasswordStrength.tsx` |
| Requer mínimo de 8 caracteres e caractere especial como obrigatórios | `src/components/auth/PasswordStrength.tsx` |
| A-212: "Ignorar" nao pode chamar markUsed — o botao registrava a sugestao como | `src/components/calls/NextBestActionPanel.tsx` |
| sipCall é estável (criado uma vez); setDbSessionId usa apenas um ref interno | `src/components/calls/UnifiedSoftphone.tsx` |
| Sem call aqui o motivo ja foi dito ao operador: limite de linhas no | `src/components/calls/UnifiedSoftphone.tsx` |
| Motivo: selecao inicial do agente: incluir `selectedAgentId` reexecutaria o efeito apenas para reafirmar o mesmo valor. | `src/components/coaching/CoachingPanel.tsx` |
| LGPD Consent Required */} | `src/components/compliance/ComplianceSettings.tsx` |
| Renderiza nada quando há apenas a opção "Todos" (nenhuma etiqueta em uso), | `src/components/dialer/phone/FavoriteTagFilter.tsx` |
| não carrega (profile === null), mantém apenas os itens sem `roles`, | `src/components/layout/AppSidebar.tsx` |
| não carrega, cada grupo mantém apenas os itens sem `roles` (menu mínimo). | `src/components/layout/AppSidebar.tsx` |
| e usa `location.pathname` apenas para reiniciar a animação ao trocar de página. | `src/components/navigation/NavigationProgress.tsx` |
| entrada (etapa 251) e segue sendo carregada apenas pelas rotas lazy que a usam. | `src/components/navigation/PageTransition.tsx` |
| Total alerts (não distribuímos por agente — apenas total para contexto) | `src/components/network/AgentQualityRanking.tsx` |
| Lógica de auto-apply: apenas critical + function (categoria infra implícita) | `src/components/network/VoipRecommendationsPanel.tsx` |
| Uma faixa desativada depois de salva não pode permanecer selecionada. | `src/components/queues/QueueAudioSlotSelect.tsx` |
| Teto explicito: sem .limit() o PostgREST devolve no maximo 1000 linhas e o painel | `src/hooks/useActiveCallsRealtime.ts` |
| ').eq('status', 'active').order('started_at', { ascending: false }).limit(ACTIVE_ROWS_LIMIT); | `src/hooks/useActiveCallsRealtime.ts` |
| ').is('ended_at', null).order('started_at', { ascending: false }).limit(ACTIVE_ROWS_LIMIT); | `src/hooks/useActiveCallsRealtime.ts` |
| autenticada ate a proxima consulta falhar. Reagimos apenas a remocao do | `src/hooks/useAuth.ts` |
| trocar o filtro durante um "carregar mais" nao pode anexar a pagina antiga na lista nova. | `src/hooks/useCallHistory.ts` |
| ').order('recorded_at', { ascending: false }).limit(RECORDINGS_LIMIT); | `src/hooks/useCallRecording.ts` |
| Etapa 035: falha de leitura nao pode virar "nao esta na DNC". Quem | `src/hooks/useDNCCompliance.ts` |
| discagem quando o RPC estava fora do ar ou sem permissao. | `src/hooks/useDNCCompliance.ts` |
| Paginas de 50 + desempate por id: o kanban nao pode receber o corte de 1000 | `src/hooks/useDeals.ts` |
| * - Digitar rapidamente atualiza `inputValue` imediatamente e enfileira apenas | `src/hooks/useDebouncedSearchParam.ts` |
| ').limit(1).maybeSingle(); | `src/hooks/useGeoBlocking.ts` |
| ').order('created_at', { ascending: false }).limit(50); | `src/hooks/useGeoBlocking.ts` |
| mesmo país não pode estar nas duas listas ao mesmo tempo. | `src/hooks/useGeoBlocking.ts` |
| ').order('created_at', { ascending: false }).limit(100); | `src/hooks/useIPWhitelist.ts` |
| * mínimo de palavras para disparar tradução */ | `src/hooks/useLiveTranslation.ts` |
| * A RPC falhou: não sabemos se a conta está bloqueada. Quem consome deve recusar a tentativa. */ | `src/hooks/useLoginLockout.ts` |
| rate limit por IP (lido do request, não do corpo) e chama as RPCs com | `src/hooks/useLoginLockout.ts` |
| Fire-and-forget de proposito: CRM fora do ar nao pode derrubar a ligacao, e | `src/hooks/useMultiChannelCall.ts` |
| Autoplay bloqueado pelo navegador nao pode quebrar o painel: o som e acessorio. | `src/hooks/useNotifications.ts` |
| critica nao repetimos o toast. O intervalo minimo existe para o caso de a | `src/hooks/useQueueMetrics.ts` |
| pelo intervalo minimo, ele nao pode reaparecer no ciclo seguinte. | `src/hooks/useQueueMetrics.ts` |
| No maximo um alarme por meta a cada 15 min: e o que impede a metrica que | `src/hooks/useQueueMetrics.ts` |
| ').order('created_at', { ascending: false }).limit(100), | `src/hooks/useRateLimitData.ts` |
| ').order('created_at', { ascending: false }).limit(50), | `src/hooks/useRateLimitData.ts` |
| Falhar aqui nao pode impedir o usuario de atender a chamada. | `src/hooks/useRingtoneSettings.ts` |
| * Classifica o prazo estourado de uma conversa marcada como sla_breached. | `src/hooks/useSLA.ts` |
| Marcada como violada mas sem prazo vencido calculável: mantém o rótulo genérico | `src/hooks/useSLA.ts` |
| ').order('created_at', { ascending: false }).limit(5); | `src/hooks/useSecurityDashboard.ts` |
| ').order('created_at', { ascending: false }).limit(50); | `src/hooks/useSecurityMonitoringData.ts` |
| ').order('created_at', { ascending: false }).limit(20); | `src/hooks/useSecurityMonitoringData.ts` |
| * Número/ramal do chamador (somente dígitos quando disponível). */ | `src/hooks/useSipCall.ts` |
| ').eq('call_session_id', callId).order('created_at', { ascending: false }).limit(20); | `src/hooks/useSupervisorPanel.ts` |
| ").order("created_at", { ascending: false }).limit(500); | `src/hooks/useTrackers.ts` |
| Apenas admin/supervisor têm acesso (gated por RLS de optimistic_lock_conflicts). | `src/hooks/useUnreadConflicts.ts` |
| * Registra a mudança no histórico curto de sincronização. Nunca deve | `src/hooks/useVoicePreferences.ts` |
| * Grava um patch no perfil; falhas são acessórias e apenas logadas. */ | `src/hooks/useVoicePreferences.ts` |
| nem inicia cronometro — a interface nao deve afirmar chamada inexistente. | `src/hooks/useWavoipCall.ts` |
| * A validação delega para `validateWebhookConfig` — o hook expõe o resultado | `src/hooks/useWebhookConfig.ts` |
| (`validation`) para a UI renderizar mensagens inline por campo e bloqueia | `src/hooks/useWebhookConfig.ts` |
| base já validado; garantimos apenas que max >= base ao persistir | `src/hooks/useWebhookConfig.ts` |
| validação (para UI inline) | `src/hooks/useWebhookConfig.ts` |
| * Mostra apenas o final do segredo; o valor completo só sai na ação de revelar/copiar. */ | `src/hooks/useWebhookSecrets.ts` |
| Le apenas papeis ativos e nao expirados, aplicando precedencia | `src/hooks/auth/useAuthProfile.ts` |
| somente se o usuario nao tiver nenhum papel em user_roles. | `src/hooks/auth/useAuthProfile.ts` |
| Telemetria e acessoria: nao pode quebrar a pagina do usuario. | `src/hooks/telemetry/useTelemetry.ts` |
| (botao, link) nao pode ativar a linha por borbulhamento. | `src/lib/a11y-clickable.ts` |
| — apenas duplicatas próximas no tempo (ruído da IA) são colapsadas. | `src/lib/agent-assist-utils.ts` |
| * Mascara telefone preservando apenas os 4 últimos dígitos. */ | `src/lib/blf.ts` |
| * slot_end - slot_start <= 99 → no máximo 100 vagas por órbita. */ | `src/lib/call-park.ts` |
| `otherActiveOrbits` deve conter apenas órbitas ativas diferentes da editada. | `src/lib/call-park.ts` |
| * Rótulo do resumo de tempo limite ("3 min", "45 s"). */ | `src/lib/call-park.ts` |
| * Aceita apenas UUIDs — impede enviar lixo em colunas com FK. */ | `src/lib/call-queue.ts` |
| * Erros de negócio que o banco também rejeitaria — antecipados na UI | `src/lib/call-queue.ts` |
| * Usada apenas para exibir "alterado em <dispositivo>" nas preferências | `src/lib/device-identity.ts` |
| derivado do user agent, e nunca deve ser usado para autorização. | `src/lib/device-identity.ts` |
| Colapsa espaços, remove caracteres de controle e trunca no limite do CHECK. | `src/lib/device-identity.ts` |
| e `tag = btrim(tag)`, então a normalização aqui é a mesma regra aplicada antes | `src/lib/dialer-favorite-tags.ts` |
| * Limite de caracteres imposto pelo CHECK da coluna `tag`. */ | `src/lib/dialer-favorite-tags.ts` |
| - `UNTAGGED_FILTER` → apenas itens sem etiqueta válida; | `src/lib/dialer-favorite-tags.ts` |
| * Retorna apenas os itens cuja posição mudou em relação ao valor original — | `src/lib/dialer-favorites-order.ts` |
| * Só para testes: zera o estado de dedupe/limite. */ | `src/lib/errorReporter.ts` |
| * `true` quando o relato deve ser gravado (fora da janela de dedupe e do teto). */ | `src/lib/errorReporter.ts` |
| gravado por inteiro: apenas os últimos dígitos, o suficiente para o agente | `src/lib/favorite-sync-labels.ts` |
| * Mascara um telefone preservando apenas os últimos dígitos. | `src/lib/favorite-sync-labels.ts` |
| - trunkOnline: +20 (apenas se hasTrunk) | `src/lib/health-score.ts` |
| restritos, SSR/JSDOM e contextos sem permissão de áudio/notificações. | `src/lib/incoming-call-alert.ts` |
| Não solicita permissão aqui: pedido sem gesto do usuário é bloqueado | `src/lib/incoming-call-alert.ts` |
| e polui a UX. A permissão é requisitada em `ensureNotificationPermission`. | `src/lib/incoming-call-alert.ts` |
| * Solicita permissão de notificação a partir de um gesto do usuário. */ | `src/lib/incoming-call-alert.ts` |
| - Dev: console com prefixo estruturado. Prod: apenas warn/error. | `src/lib/logger.ts` |
| * Store mínimo do estado de navegação, alimentado pelo Suspense das rotas. | `src/lib/navigation-progress-store.ts` |
| Limite de 20 itens; o mais antigo é descartado quando excede. | `src/lib/pendingCallWrites.ts` |
| * Erros de negócio antecipados na UI (o banco também os rejeitaria). */ | `src/lib/queue-audio.ts` |
| nenhum CHECK constraint nem o trigger de validação pode falhar depois disto. | `src/lib/ring-group.ts` |
| * Erros de negócio que o banco também rejeitaria — antecipados na UI | `src/lib/ring-group.ts` |
| * Tempo máximo de toque antes de cair na ação de "ninguém atendeu". | `src/lib/ring-group.ts` |
| subscriber isolado, nunca deve derrubar o helper */ } | `src/lib/safe-number.ts` |
| * Wrapper central de validação Zod. | `src/lib/schema.ts` |
| from '@/lib/validation/schemas'; | `src/lib/schema.ts` |
| from '@/lib/validation/contact-schema'; | `src/lib/schema.ts` |
| from '@/lib/validation/voip-trunk'; | `src/lib/schema.ts` |
| from '@/lib/validation/auth'; | `src/lib/schema.ts` |
| Mantém no máximo MAX_ENTRIES entradas ordenadas do mais recente ao mais antigo. | `src/lib/security-alerts-webhook-history.ts` |
| * Extrai apenas headers da allowlist (case-insensitive) para persistência segura. */ | `src/lib/security-alerts-webhook-history.ts` |
| * Validação centralizada da configuração do webhook de exportação. | `src/lib/security-alerts-webhook-validation.ts` |
| Retry: apenas para falhas transitórias (network/timeout, 408, 429, 5xx). | `src/lib/security-alerts-webhook.ts` |
| Timeout curto: webhook não deve travar a UX de exportação. | `src/lib/security-alerts-webhook.ts` |
| * Insere no topo e mantém no máximo `MAX_SYNC_HISTORY_ENTRIES` itens. */ | `src/lib/sync-history.ts` |
| * Validação rápida do vetor (consistência entre captura e backend). */ | `src/lib/voice-biometrics.ts` |
| truncado no limite aceito pelo banco. | `src/lib/voice-preferences.ts` |
| * Limite espelhado do CHECK `user_profiles_voice_tts_voice_len`. */ | `src/lib/voice-preferences.ts` |
| caracteres de controle ou acima do limite do banco). | `src/lib/voice-preferences.ts` |
| * Retorna true se a chamada deve ser bloqueada (circuito aberto). */ | `src/lib/bitrix/circuit-breaker.ts` |
| property-based testing (Onda D4). Deve espelhar 1:1 a lógica em produção. | `src/lib/dialer/predictive-pace.ts` |
| * Lotes para o `.in()` do PostgREST, que tem limite de tamanho de URL. */ | `src/lib/dnc/reconcile.ts` |
| * Classifica um MOS. O antigo limite de 3,6 para "mediano" foi dobrado em | `src/lib/metrics/mos.ts` |
| * Espera media em segundos, apenas sobre chamadas com espera mensuravel. */ | `src/lib/metrics/queue.ts` |
| * Zod schemas for runtime validation of API responses and form inputs. | `src/lib/validation/schemas.ts` |
| Extraído do componente para a camada central de validação. | `src/lib/validation/voip-trunk.ts` |
| Motivo: selecao inicial do agente: incluir `selectedAgentId` reexecutaria o efeito apenas para reafirmar o mesmo valor. | `src/pages/AgentRanking.tsx` |
| Gesto do usuário: momento válido para pedir permissão de notificação. | `src/pages/PhoneDialer.tsx` |
| ').order('created_at', { ascending: false }).limit(100); | `src/pages/SecurityMonitoring.tsx` |
| ').order('created_at', { ascending: false }).limit(200), | `src/pages/TranslationCenter.tsx` |
| ').order('created_at', { ascending: false }).limit(200), | `src/pages/admin/SecurityAuditDashboard.tsx` |
| ').order('created_at', { ascending: false }).limit(200), | `src/pages/admin/SecurityAuditDashboard.tsx` |
| * Regra: nenhum `fetch` com URL derivada de dado do usuário ou de configuração | `supabase/functions/_shared/allowed-hosts.ts` |
| deve sair sem passar por `assertSafeOutboundUrl`. | `supabase/functions/_shared/allowed-hosts.ts` |
| `allowPrivate` remove apenas o bloqueio de faixas privadas. | `supabase/functions/_shared/allowed-hosts.ts` |
| * Cálculo de prazo em minutos úteis, respeitando o horário comercial da | `supabase/functions/_shared/business-hours.ts` |
| Agenda sem nenhuma janela utilizável não pode travar o job: cai no prazo | `supabase/functions/_shared/business-hours.ts` |
| * Retorna o IP do cliente apenas quando ele e um literal valido; senao null. */ | `supabase/functions/_shared/client-ip.ts` |
| SECURITY DEFINER, executavel apenas por postgres/service_role | `supabase/functions/_shared/cron-db-token.ts` |
| Webhook também não deve lançar | `supabase/functions/_shared/external-payload-schemas_test.ts` |
| `::` representa no minimo um grupo zerado. | `supabase/functions/_shared/ip-range.ts` |
| da validacao de IP. `is_cidr` nao e consultado porque o prefixo diz tudo. | `supabase/functions/_shared/ip-range.ts` |
| * Classifica um MOS. O antigo limite de 3,6 para "mediano" foi dobrado em | `supabase/functions/_shared/mos.ts` |
| e garante que apenas números finitos sejam aceitos. | `supabase/functions/_shared/numeric-schemas_test.ts` |
| * Espera media em segundos, apenas sobre chamadas com espera mensuravel. */ | `supabase/functions/_shared/queue-metrics.ts` |
| * Check rate limit using persistent DB function. | `supabase/functions/_shared/rate-limit.ts` |
| ---------- Prazo de fetch ---------- | `supabase/functions/_shared/resilience.ts` |
| * Prazo padrao de uma chamada externa: 15 s. */ | `supabase/functions/_shared/resilience.ts` |
| * `fetch` com prazo. Sem signal do chamador, uma chamada pendurada aborta em | `supabase/functions/_shared/resilience.ts` |
| `timeoutMs` em vez de esperar o limite da plataforma. O erro e um | `supabase/functions/_shared/resilience.ts` |
| * Lightweight input validation helpers for Edge Functions. | `supabase/functions/_shared/validate.ts` |
| Provides Zod-like schema validation without external dependencies. | `supabase/functions/_shared/validate.ts` |
| * Escritas de negócio (tabelas), sem contar as RPCs de controle como o rate limit. */ | `supabase/functions/_shared/testing/backend-falso.ts` |
| Limit is 10000 | `supabase/functions/analyze-call/analyze-call_test.ts` |
| Input validation with auditing for 422 errors | `supabase/functions/analyze-call/index.ts` |
| Edge function ausente: existiam apenas os testes. Sem ela o discador nao tinha | `supabase/functions/check-calling-hours/index.ts` |
| Edge function ausente: existiam apenas os testes. As regras de negocio | `supabase/functions/check-dnc/index.ts` |
| Create a dummy call session for the alert (since call_session_id is required) | `supabase/functions/check-goals/index.ts` |
| ').limit(1).maybeSingle(); | `supabase/functions/check-hold-alerts/index.ts` |
| Apenas admin pode invocar manualmente | `supabase/functions/cleanup-lock-conflicts/index.ts` |
| nao toca storage, e o bucket `call-recordings` cresceria sem limite. A regra | `supabase/functions/cleanup-recordings/index.ts` |
| de negocio e 180 dias. | `supabase/functions/cleanup-recordings/index.ts` |
| entao a anon key publica nao pode ser suficiente para invoca-las. | `supabase/functions/compute-account-health/index.ts` |
| 2. Clean old rate limit logs (older than 7 days) | `supabase/functions/database-cleanup/index.ts` |
| 3. Clean resolved rate limit alerts (older than 30 days) | `supabase/functions/database-cleanup/index.ts` |
| entao a anon key publica nao pode ser suficiente para invoca-las. | `supabase/functions/detect-churn-risk/index.ts` |
| entao a anon key publica nao pode ser suficiente para invoca-las. | `supabase/functions/detect-key-moments/index.ts` |
| 2. Se for trigger, atualizar o banco. Se for busca, apenas retornar. | `supabase/functions/embed-kb-article/index.ts` |
| Sem configuração ativa, `business_hours_only` cai no prazo por tempo | `supabase/functions/enforce-sla/index.ts` |
| entao a anon key publica nao pode ser suficiente para invoca-las. | `supabase/functions/enforce-sla/index.ts` |
| ').limit(50000); | `supabase/functions/export-data-lake/index.ts` |
| Alvos permitidos: apenas Edge Functions deste projeto. Um `target` arbitrário | `supabase/functions/fuzz-test-runner/index.ts` |
| Somente supervisor/admin podem disparar geracao em massa. | `supabase/functions/generate-coaching-track/index.ts` |
| Rate-limit: uma trilha aberta por agente (evita duplicar). | `supabase/functions/generate-coaching-track/index.ts` |
| Budget esgotado alerta mesmo com status ainda dentro do limite: e o sinal | `supabase/functions/health-check/index.ts` |
| que uma tendencia: burn_rate de 1 e o alvo, nao o limite. | `supabase/functions/health-check/slo-budget.ts` |
| Endpoint publico (usuario deslogado precisa resetar). Sem rate limit, o | `supabase/functions/request-password-reset/index.ts` |
| ao max_score do critério — a IA pode devolver nota acima do máximo (A-029). | `supabase/functions/score-call/index.ts` |
| Mesma regra de clamp de auto-scorecard/index.ts. | `supabase/functions/score-call/index.ts` |
| busca passa a devolver apenas as chamadas que aquele agente pode ver. | `supabase/functions/search-calls/index.ts` |
| de sistema e nao deve carregar markup (E011). | `supabase/functions/send-notification/index.ts` |
| entao a anon key publica nao pode ser suficiente para invoca-las. | `supabase/functions/send-survey/index.ts` |
| entao a anon key publica nao pode ser suficiente para invoca-las. | `supabase/functions/sync-crm-queue/index.ts` |
| Token app-only nao resolve /me; usar /groups (Application permission Group.Read.All) | `supabase/functions/teams-fetch-recordings/index.ts` |
| entao a anon key publica nao pode ser suficiente para invoca-las. | `supabase/functions/teams-fetch-recordings/index.ts` |
| tela nao mudava nada. A regra fica aqui, isolada e testavel, porque um erro | `supabase/functions/validate-geo/decide.ts` |
| * - `allowlist`: permite apenas os paises da lista configurada. | `supabase/functions/validate-geo/decide.ts` |
| - `blocklist`: bloqueia apenas os paises da lista configurada. | `supabase/functions/validate-geo/decide.ts` |
| limite, cada request anonimo consumia uma chamada ao provedor externo. | `supabase/functions/validate-geo/index.ts` |
| Falha aberta por decisao de negocio: nao bloqueia o usuario se a checagem cair. | `supabase/functions/validate-geo/index.ts` |
| Header e controlado pelo cliente: sem validação, a whitelist de IP é | `supabase/functions/validate-ip/index.ts` |
| * Whitelist rígida — apenas ações não destrutivas. */ | `supabase/functions/voip-anomaly-remediation/index.ts` |
| requisicao: o salto edge->edge recebe no maximo metade, senao as duas edges | `supabase/functions/voip-capacity-recommendations/index.ts` |
| JWT obrigatório, CORS centralizado, validação via _shared/validate. | `supabase/functions/voip-executive-summary/index.ts` |
| 3. Insere notificações na tabela (que deve disparar Realtime) | `supabase/functions/voip-failover-notifier/index.ts` |
| JWT obrigatório, CORS centralizado, validação via _shared/validate. | `supabase/functions/voip-quality-alerts-summary/index.ts` |
| JWT obrigatório, CORS centralizado, validação numérica. | `supabase/functions/voip-quality-heatmap/index.ts` |
| JWT obrigatório, CORS centralizado, validação via _shared/validate. | `supabase/functions/voip-recommendation-history/index.ts` |
| JWT obrigatório, CORS centralizado, validação via _shared/validate. | `supabase/functions/voip-recommendation-insights/index.ts` |
| JWT obrigatório, CORS centralizado, validação Zod-like via _shared/validate. | `supabase/functions/voip-recommendation-simulate/index.ts` |
| JWT obrigatório, CORS centralizado, validação via _shared/validate. | `supabase/functions/voip-recommendations/index.ts` |
| validação Zod-like via _shared/validate, tracing via x-request-id. | `supabase/functions/voip-sla-report/index.ts` |
| do body: um atacante nao pode assumir a conta de outro usuario. | `supabase/functions/webauthn-authenticate/index.ts` |
| O e-mail NAO pode vir do corpo do request: a edge e publica, e um | `supabase/functions/webauthn-authenticate/index.ts` |
| comparamos - apenas registramos. | `supabase/functions/webauthn-authenticate/index.ts` |
| * Antes desta correcao a edge apenas conferia se o `credential_id` existia | `supabase/functions/webauthn-authenticate/verify.ts` |
| rpIdHash (32 bytes) deve bater com o RP configurado (o host). | `supabase/functions/webauthn-authenticate/verify.ts` |
| * Normaliza telefone para comparação (apenas dígitos). */ | `supabase/functions/whatsapp-inbound/idempotency.ts` |
| Erro de dedup não pode derrubar a entrega: registra e segue. | `supabase/functions/whatsapp-inbound/index.ts` |
| Required but empty | `supabase/functions/whatsapp-inbound/schema_test.ts` |

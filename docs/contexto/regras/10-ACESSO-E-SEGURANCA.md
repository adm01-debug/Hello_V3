# 10 · ACESSO E SEGURANÇA — quem pode o quê

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `bc47e27e49` · branch `main` · 2026-11-12 14:20 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Perfis / roles identificados

`admin`, `agent`, `customer`, `default`, `denied`, `granted`, `role`, `string`, `supervisor`, `user`, `viewer`

- Tabelas de perfil/permissão: `user_roles`, `permissions`, `role_permissions`, `call_queue_members`, `ring_group_members`
- Colunas de perfil: `user_profiles.role` (string not null), `user_roles.role` (public.app_role NOT NULL DEFAULT 'agent'), `role_permissions.role` (app_role NOT NULL)
- Claims do JWT usados em políticas/funções: `email`, `role`
- Funções usadas dentro de políticas RLS (a regra real está no corpo delas — veja `06`): `can_access_agent_data`, `get_user_agent_id`, `get_user_agent_name`, `get_user_role`, `has_role`, `is_active_agent`, `is_admin`, `is_admin_or_supervisor`, `is_admin_user`, `is_supervisor`

## Matriz tabela × operação → quem pode (derivada das políticas RLS)

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `account_journey_history` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = account_journey_history.account_id AND a.csm_agent_name = get_user_agen | authenticated: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = account_journey_history.account_id AND a.cs | — | — |
| `account_lockouts` | enabled | authenticated: is_admin_or_supervisor() | public: false | public: false | public: false |
| `accounts` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: csm_agent_name = get_user_agent_name() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor()<br>authenticated: csm_agent_name = get_user_agent_name() | authenticated: is_admin_or_supervisor() |
| `active_sessions` | enabled | public: auth.uid() = user_id<br>public: public.has_role(auth.uid(), 'admin') | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `agent_badges` | enabled | public: true<br>public: auth.uid() IS NOT NULL<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() |
| `agent_devices` | enabled | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name() | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name() | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name() | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name() |
| `agent_goals` | enabled | public: true<br>public: auth.uid() IS NOT NULL<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `agent_ring_settings` | enabled | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name() | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name() | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name() | public: is_admin_or_supervisor() |
| `agent_shifts` | enabled | authenticated: is_admin_or_supervisor() OR get_user_agent_name() = agent_name<br>authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `agent_skills` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: auth.uid() IS NOT NULL | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `agent_trunk_assignments` | enabled | authenticated: public.is_admin_user(auth.uid())<br>authenticated: agent_id = public.get_user_agent_id() | authenticated: public.is_admin_user(auth.uid()) | authenticated: public.is_admin_user(auth.uid()) | authenticated: public.is_admin_user(auth.uid()) |
| `agent_weekly_stats` | enabled | public: true<br>public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR agent_id = get_user_agent_id() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `agents` | enabled | public: true<br>public: true<br>public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR id = get_user_agent_id()<br>public: auth.uid() IS NOT NULL | public: true<br>public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() |
| `audit_logs` | enabled | public: get_user_role() = 'admin' | public: false<br>authenticated: false | — | authenticated: false |
| `badges` | enabled | public: true<br>public: auth.uid() IS NOT NULL<br>public: public.get_user_role() = 'admin' | public: true<br>public: public.get_user_role() = 'admin' | public: public.get_user_role() = 'admin' | public: public.get_user_role() = 'admin' |
| `barge_in_sessions` | enabled | public: true<br>public: public.is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() OR supervisor_name = get_user_agent_name() OR agent_name = get_user_agent_name() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() |
| `battle_card_triggers` | enabled | public: auth.uid() IS NOT NULL<br>authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `battle_cards` | enabled | public: auth.uid() IS NOT NULL AND is_active = true OR is_admin_or_supervisor()<br>authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `bitrix_departments` | enabled | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') |
| `bitrix_users` | enabled | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') |
| `blocked_access_logs` | enabled | public: get_user_role() = 'admin' | authenticated: is_admin_or_supervisor() | — | — |
| `bot_conversations` | enabled | public: is_admin_or_supervisor()<br>public: EXISTS ( SELECT 1 FROM public.conversations c WHERE c.id = bot_conversations.conversation_id AND c.assigned_agent_name = get_user_ag | public: is_admin_or_supervisor() | — | — |
| `cadence_enrollments` | enabled | public: agent_name = get_user_agent_name() OR is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>public: auth.uid() IS NOT NULL AND (is_admin_or_supervisor() OR agent_name = get_user_agent_name()) | public: agent_name = get_user_agent_name() OR is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `cadence_steps` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `cadences` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `call_alerts` | enabled | public: true<br>authenticated: is_admin_or_supervisor() OR call_session_id IN ( SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name() | public: true<br>authenticated: is_admin_or_supervisor() | public: true<br>authenticated: is_admin_or_supervisor()<br>authenticated: call_session_id IN ( SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name() ) | public: public.is_admin_or_supervisor() |
| `call_analyses` | enabled | public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_use | public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_use | public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `call_control_audit_logs` | enabled | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor'))<br>authenticated: public.is_admin()<br>public: is_admin_or_supervisor() OR source = (auth.jwt() ->> 'email') | authenticated: public.is_admin()<br>authenticated: public.is_admin_or_supervisor() OR (source = ((SELECT auth.jwt()) ->> 'email')) OR (source = ((SELECT auth.uid()))::text) | authenticated: public.is_admin() | authenticated: public.is_admin() |
| `call_flows` | enabled | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `call_key_moments` | enabled | public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_key_moments.call_session_id AND can_ac | authenticated: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_key_moments.call_session_id AND | — | authenticated: is_admin_or_supervisor() |
| `call_park_orbits` | enabled | authenticated: true | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `call_playlists` | enabled | authenticated: is_admin_or_supervisor() OR owner_agent_name = get_user_agent_name() OR (is_shared = true AND get_user_agent_name() = ANY (sh | authenticated: is_admin_or_supervisor() OR owner_agent_name = get_user_agent_name() | public: owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor() | public: owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor() |
| `call_quality_metrics` | enabled | public: public.is_admin_or_supervisor() OR public.get_user_agent_name() = agent_name<br>authenticated: public.is_admin()<br>public: is_admin() OR is_supervisor() OR (agent_name = get_user_agent_name()) | public: public.is_admin_or_supervisor() OR public.get_user_agent_name() = agent_name OR agent_name IS NULL<br>authenticated: public.is_admin() | public: public.is_admin_or_supervisor() OR public.get_user_agent_name() = agent_name<br>authenticated: public.is_admin() | public: public.is_admin_or_supervisor()<br>authenticated: public.is_admin() |
| `call_queue_members` | enabled | authenticated: true<br>authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `call_queues` | enabled | authenticated: true<br>authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `call_recordings` | enabled | public: true<br>public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_recordings.call_session_id AND cs.agen | public: true<br>public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_use | public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() |
| `call_records` | enabled | public: true | public: true | public: true | public: true |
| `call_scorecards` | enabled | public: agent_name = get_user_agent_name() OR is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `call_sessions` | enabled | authenticated: public.is_admin()<br>public: is_admin_or_supervisor() OR agent_name = get_user_agent_name() | authenticated: is_admin_or_supervisor() OR is_active_agent(agent_name)<br>authenticated: public.is_admin() | public: is_admin_or_supervisor() OR agent_name = get_user_agent_name()<br>authenticated: public.is_admin() | public: public.is_admin_or_supervisor()<br>authenticated: public.is_admin() |
| `call_summaries` | enabled | public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_use | public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name = get_use | public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `call_transcriptions` | enabled | public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR (EXISTS ( SELECT 1 FROM call_sessions cs WHERE cs.id = call_transcriptions.call_session_id AND cs.agent_ | public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR (EXISTS ( SELECT 1 FROM call_sessions cs WHERE cs.id = call_transcriptions.call_session_id AND cs.agent_ | public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `call_transcripts_searchable` | enabled | public: is_admin_or_supervisor() OR can_access_agent_data(agent_name) | authenticated: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_transcripts_searchable.call_ses | authenticated: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_transcripts_searchable.call_ses | — |
| `call_translations` | enabled | public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_translations.call_session_id AND can_a | authenticated: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_translations.call_session_id AN | — | authenticated: is_admin_or_supervisor() |
| `calling_hours_config` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `chat_sessions` | enabled | public: is_admin_or_supervisor()<br>public: conversation_id IS NOT NULL AND EXISTS ( SELECT 1 FROM public.conversations c WHERE c.id = chat_sessions.conversation_id AND c.assig<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `churn_risk_signals` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = churn_risk_signals.account_id AND a.csm_agent_name = get_user_agent_nam | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = churn_risk_signals.account_id AND a.csm_agent_name = get_user_agent_nam | authenticated: is_admin_or_supervisor() |
| `coaching_assignments` | enabled | authenticated: is_admin_or_supervisor() OR get_user_agent_name() = agent_name | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() OR get_user_agent_name() = agent_name | authenticated: is_admin_or_supervisor() |
| `coaching_recommendations` | enabled | public: true<br>public: is_admin_or_supervisor() OR agent_id = get_user_agent_id() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: is_admin_or_supervisor() OR agent_id = get_user_agent_id() | public: true<br>public: public.is_admin_or_supervisor() |
| `coaching_timestamps` | enabled | public: is_admin_or_supervisor() OR can_access_agent_data(agent_name) | authenticated: is_admin_or_supervisor() | — | public: is_admin_or_supervisor() |
| `compliance_rules` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `compliance_settings` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `consent_history` | enabled | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | — | — |
| `consent_records` | enabled | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_user(auth.uid()) |
| `contact_alerts` | enabled | public: true<br>public: is_admin_or_supervisor() | public: true<br>authenticated: is_admin_or_supervisor() | public: true<br>public: is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() |
| `contact_engagement_patterns` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) |
| `contact_interactions` | enabled | public: true<br>public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR (agent_name = get_user_agent_name() AND is_active_agent(agent_name)) | public: true<br>public: public.is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() OR is_active_agent(agent_name) | public: true<br>public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `contacts` | enabled | public: true<br>public: true<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.contact_interactions ci WHERE ci.contact_id = contacts.id AND ci.agent_nam | public: true<br>public: true<br>public: is_admin_or_supervisor() | public: true<br>public: true<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.contact_interactions ci WHERE ci.contact_id = contacts.id AND ci.agent_nam | public: true<br>public: true<br>public: public.is_admin_or_supervisor() |
| `conversation_messages` | enabled | public: is_admin_or_supervisor()<br>public: EXISTS ( SELECT 1 FROM public.conversations c WHERE c.id = conversation_messages.conversation_id AND c.assigned_agent_name = get_use<br>public: is_admin_or_supervisor()<br>public: EXISTS ( SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.assigned_agent_name = ( SELECT full_name FROM publi | public: is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.conversations c WHERE c.id = conversation_messages.conversation_id AND c.a | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `conversations` | enabled | public: is_admin_or_supervisor()<br>public: assigned_agent_name = get_user_agent_name()<br>public: is_admin_or_supervisor()<br>public: auth.uid() = id OR EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor') ) | public: is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>public: assigned_agent_name = get_user_agent_name() | public: is_admin_or_supervisor() |
| `crm_field_suggestions` | enabled | authenticated: public.is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `crm_sync_queue` | enabled | public: is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | — | — |
| `cultural_hints` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) |
| `customer_journey_stages` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: auth.uid() IS NOT NULL | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `dashboard_goals` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `data_lake_exports` | enabled | authenticated: public.is_admin() | authenticated: public.is_admin() | authenticated: public.is_admin() | authenticated: public.is_admin() |
| `deal_revenue_snapshots` | enabled | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `deals` | enabled | public: is_admin_or_supervisor()<br>public: owner_agent_name = get_user_agent_name() OR is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>public: auth.uid() IS NOT NULL AND ( is_admin_or_supervisor() OR owner_agent_name IS NULL OR owner_agent_name = get_user_agent_name() ) | public: is_admin_or_supervisor()<br>public: owner_agent_name = get_user_agent_name() | public: is_admin_or_supervisor() |
| `dialer_campaigns` | enabled | public: true<br>public: auth.uid() IS NOT NULL<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() |
| `dialer_favorites` | enabled | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id |
| `dialer_queue` | enabled | public: true<br>public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR assigned_agent = get_user_agent_name() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR assigned_agent = get_user_agent_name() | public: true<br>public: public.is_admin_or_supervisor() |
| `dnc_import_logs` | enabled | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | — | — |
| `dnc_list` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `email_tickets` | enabled | public: is_admin_or_supervisor()<br>public: EXISTS ( SELECT 1 FROM public.conversations c WHERE c.id = email_tickets.conversation_id AND c.assigned_agent_name = get_user_agent_<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `email_verification_tokens` | enabled | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: false | public: auth.uid() = user_id OR is_admin_user(auth.uid()) |
| `entity_versions` | enabled | public: true | public: auth.uid() = changed_by OR changed_by IS NULL | — | — |
| `financial_impact_daily` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `fraud_signals` | enabled | public: is_admin_or_supervisor()<br>public: agent_name = get_user_agent_name()<br>public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) |
| `geo_access_logs` | não encontrado | sem RLS | authenticated: is_admin_or_supervisor() | sem RLS | authenticated: is_admin_or_supervisor() |
| `geo_restrictions` | não encontrado | authenticated: auth.uid() IS NOT NULL | sem RLS | sem RLS | sem RLS |
| `geo_settings` | não encontrado | authenticated: is_admin_or_supervisor() | sem RLS | sem RLS | sem RLS |
| `goal_violations` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `hold_alert_settings` | enabled | public: true<br>public: auth.uid() IS NOT NULL<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `hold_events` | enabled | public: true<br>authenticated: is_admin_or_supervisor() OR agent_name = get_user_agent_name()<br>authenticated: public.is_admin() | public: true<br>authenticated: is_admin_or_supervisor()<br>authenticated: public.is_admin() | public: true<br>authenticated: is_admin_or_supervisor()<br>authenticated: public.is_admin() | public: public.is_admin_or_supervisor()<br>authenticated: public.is_admin() |
| `holidays` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `hot_desking_stations` | enabled | public: is_admin_or_supervisor()<br>public: auth.uid() IS NOT NULL | public: is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR current_user_name = (SELECT full_name FROM public.user_profiles WHERE id = auth.uid()) | public: is_admin_or_supervisor() |
| `index_drop_audit` | enabled | authenticated: public.is_admin() | — | — | — |
| `ip_whitelist` | enabled | public: get_user_role() = 'admin'<br>public: get_user_role() = 'admin' | public: get_user_role() = 'admin' | public: get_user_role() = 'admin' | public: get_user_role() = 'admin' |
| `kb_article_history` | enabled | public: is_admin_or_supervisor() | — | — | — |
| `kb_article_views` | enabled | public: is_admin_or_supervisor()<br>authenticated: viewer_id = auth.uid() | authenticated: viewer_type = 'agent' AND viewer_id = (SELECT auth.uid()) | — | — |
| `kb_articles` | enabled | public: auth.uid() IS NOT NULL AND status = 'published'<br>public: is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `kb_categories` | enabled | public: auth.uid() IS NOT NULL AND is_published = true<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `learning_completions` | enabled | authenticated: is_admin_or_supervisor() OR get_user_agent_name() = agent_name | authenticated: get_user_agent_name() = agent_name OR is_admin_or_supervisor() | — | authenticated: is_admin_or_supervisor() |
| `learning_modules` | enabled | authenticated: is_active OR is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `live_assist_signals` | enabled | public: is_admin_or_supervisor() OR agent_name = get_user_agent_name() | authenticated: is_admin_or_supervisor() | public: is_admin_or_supervisor() OR agent_name = get_user_agent_name() | authenticated: is_admin_or_supervisor() |
| `live_sentiment_snapshots` | enabled | public: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = live_sentiment_snapshots.call_session_id AN | authenticated: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = live_sentiment_snapshots.call_sessio | — | — |
| `login_attempts` | enabled | authenticated: is_admin_or_supervisor() | authenticated: false<br>public: false | authenticated: false | authenticated: false |
| `manager_alerts` | enabled | public: is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `meeting_summaries` | enabled | public: public.is_admin_or_supervisor()<br>public: EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = meeting_summaries.call_session_id AND cs.agent_name = public.get_user_a | public: EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = meeting_summaries.call_session_id AND cs.agent_name = public.get_user_a<br>authenticated: is_admin_or_supervisor() | public: public.is_admin_or_supervisor()<br>public: EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = meeting_summaries.call_session_id AND cs.agent_name = public.get_user_a | public: public.is_admin_user(auth.uid()) |
| `migration_rollbacks` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `notification_preferences` | enabled | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | — |
| `notifications` | enabled | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id |
| `number_porting_requests` | enabled | public: is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `objection_library` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `optimistic_lock_conflicts` | enabled | authenticated: public.is_admin_or_supervisor() | — | — | — |
| `parked_calls` | enabled | authenticated: true | authenticated: parked_by = auth.uid() AND status = 'parked' | authenticated: status = 'parked' OR public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `password_reset_requests` | enabled | public: is_admin_or_supervisor()<br>public: auth.uid() = user_id | public: is_admin_or_supervisor()<br>authenticated: auth.uid() = user_id | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `password_reset_tokens` | enabled | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: false | public: auth.uid() = user_id OR is_admin_user(auth.uid()) |
| `performance_metrics` | enabled | public: is_admin_or_supervisor() | public: auth.uid() = user_id | — | — |
| `permissions` | enabled | public: auth.uid() IS NOT NULL<br>public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') |
| `playlist_items` | enabled | public: EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (is_admin_or_supervisor() OR p.owner_agent_name = get_use<br>public: EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (p.owner_agent_name = get_user_agent_name() OR is_admin_o | public: EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (p.owner_agent_name = get_user_agent_name() OR is_admin_o | public: EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (p.owner_agent_name = get_user_agent_name() OR is_admin_o | public: EXISTS (SELECT 1 FROM public.call_playlists p WHERE p.id = playlist_id AND (p.owner_agent_name = get_user_agent_name() OR is_admin_o |
| `queue_audio_prompts` | enabled | authenticated: true<br>authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `queue_items` | enabled | public: true | public: true | public: true | public: true |
| `queue_metrics_settings` | enabled | public: is_admin_or_supervisor()<br>public: auth.uid() IS NOT NULL | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `queue_skill_requirements` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: auth.uid() IS NOT NULL | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `rate_limit_alerts` | enabled | public: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | public: public.has_role(auth.uid(), 'admin') | — |
| `rate_limit_logs` | enabled | public: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | — | — |
| `rate_limit_settings` | enabled | public: public.has_role(auth.uid(), 'admin')<br>public: has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') |
| `redaction_log` | enabled | public: is_admin_user(auth.uid()) | — | — | — |
| `renewals` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: owner_agent_name = get_user_agent_name() OR EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = renewals.account_id AND a.c | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor()<br>authenticated: owner_agent_name = get_user_agent_name() | authenticated: is_admin_or_supervisor() |
| `ring_group_members` | enabled | authenticated: true<br>authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `ring_groups` | enabled | authenticated: true<br>authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `rls_audit_logs` | enabled | authenticated: EXISTS ( SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin' ) | — | — | — |
| `role_permissions` | enabled | public: auth.uid() IS NOT NULL<br>public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') |
| `routing_rules` | enabled | public: is_admin_or_supervisor()<br>public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) |
| `saved_filters` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `scheduled_callbacks` | enabled | public: true<br>public: is_admin_or_supervisor() OR assigned_agent = get_user_agent_name() | public: true<br>public: is_admin_or_supervisor() | public: true<br>public: is_admin_or_supervisor() OR assigned_agent = get_user_agent_name() OR created_by = get_user_agent_name() | public: true<br>public: public.is_admin_or_supervisor() |
| `schema_migrations` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `scorecard_criteria` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `scorecard_responses` | enabled | public: EXISTS (SELECT 1 FROM public.call_scorecards cs WHERE cs.id = scorecard_id AND (cs.agent_name = get_user_agent_name() OR is_admin_or<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `scorecard_templates` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `security_alerts` | enabled | public: get_user_role() = 'admin' | authenticated: get_user_role() = 'admin' | public: get_user_role() = 'admin' | public: get_user_role() = 'admin' |
| `shift_swap_suggestions` | enabled | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() | authenticated: public.is_admin_or_supervisor() |
| `shift_templates` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: auth.uid() IS NOT NULL | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `skills` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: auth.uid() IS NOT NULL | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `sla_policies` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) | public: is_admin_user(auth.uid()) |
| `success_plan_milestones` | enabled | authenticated: EXISTS ( SELECT 1 FROM public.success_plans sp WHERE sp.id = success_plan_milestones.success_plan_id AND ( is_admin_or_superv<br>authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.success_plans sp WHERE sp.id = success_plan_milestones.success_plan_id AND sp.owner_agent_name  | authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.success_plans sp WHERE sp.id = success_plan_milestones.success_plan_id AND sp.owner_agent_name  | authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.success_plans sp WHERE sp.id = success_plan_milestones.success_plan_id AND sp.owner_agent_name  | authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.success_plans sp WHERE sp.id = success_plan_milestones.success_plan_id AND sp.owner_agent_name  |
| `success_plans` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: owner_agent_name = get_user_agent_name() OR EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = success_plans.account_id AN | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor()<br>authenticated: owner_agent_name = get_user_agent_name() | authenticated: is_admin_or_supervisor() |
| `survey_responses` | enabled | authenticated: is_admin_or_supervisor()<br>authenticated: EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = survey_responses.account_id AND a.csm_agent_name = get_user_agent_name( | authenticated: is_admin_or_supervisor() OR account_id IS NULL OR EXISTS ( SELECT 1 FROM public.accounts a WHERE a.id = survey_responses.acco<br>authenticated: is_admin_or_supervisor() | — | — |
| `surveys` | enabled | authenticated: is_active = true OR is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `system_settings` | enabled | public: auth.role() = 'authenticated'<br>public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') |
| `time_off_requests` | enabled | authenticated: is_admin_or_supervisor() OR get_user_agent_name() = agent_name | authenticated: get_user_agent_name() = agent_name OR is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() | authenticated: is_admin_or_supervisor() |
| `toll_free_numbers` | enabled | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `topic_detections` | enabled | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() OR EXISTS ( SELECT 1 FROM public.call_sessions cs WHERE cs.id = call_session_id AND cs.agent_name =  | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `topic_trends` | enabled | public: is_admin_or_supervisor()<br>public: auth.uid() IS NOT NULL | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `tracker_matches` | enabled | public: agent_name = get_user_agent_name() OR is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `trackers` | enabled | public: auth.uid() IS NOT NULL<br>public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `user_allowed_ips` | enabled | public: get_user_role() = 'admin'<br>public: auth.uid() = user_id | public: get_user_role() = 'admin' | public: get_user_role() = 'admin' | public: get_user_role() = 'admin' |
| `user_ip_restrictions` | enabled | public: get_user_role() = 'admin'<br>public: auth.uid() = user_id | public: get_user_role() = 'admin' | public: get_user_role() = 'admin' | public: get_user_role() = 'admin' |
| `user_mfa_settings` | enabled | public: auth.uid() = user_id<br>public: public.has_role(auth.uid(), 'admin') | public: auth.uid() = user_id | public: auth.uid() = user_id | authenticated: auth.uid() = user_id |
| `user_passkeys` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `user_profiles` | enabled | authenticated: auth.uid() = id<br>authenticated: public.is_admin_or_supervisor()<br>authenticated: public.is_admin_user(auth.uid()) | authenticated: public.is_admin_user(auth.uid())<br>authenticated: is_admin_user(auth.uid()) | authenticated: public.is_admin_user(auth.uid())<br>authenticated: auth.uid() = id<br>authenticated: public.is_admin_user(auth.uid()) | authenticated: public.is_admin_user(auth.uid()) |
| `user_roles` | enabled | public: auth.uid() = user_id<br>public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') |
| `video_conferences` | enabled | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor()<br>authenticated: host_name = get_user_agent_name() OR is_admin_or_supervisor() | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `virtual_fax` | enabled | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() OR created_by = auth.uid()::text | public: is_admin_or_supervisor()<br>authenticated: created_by = auth.uid()::text | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `voice_prints` | enabled | public: auth.uid() = user_id<br>public: is_admin_user(auth.uid()) | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `voicemail_messages` | enabled | public: is_admin_or_supervisor()<br>public: is_admin_or_supervisor() OR agent_name = get_user_agent_name() | public: is_admin_or_supervisor()<br>authenticated: is_admin_or_supervisor() OR is_active_agent(agent_name) | public: is_admin_or_supervisor() | public: is_admin_or_supervisor() |
| `voip_monitoring_settings` | enabled | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')<br>public: auth.role() = 'authenticated' | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') |
| `voip_quality_alerts` | enabled | public: auth.uid() = user_id OR public.is_admin_or_supervisor() | public: auth.uid() = user_id | public: auth.uid() = user_id OR public.is_admin_or_supervisor() | public: public.is_admin_or_supervisor() |
| `voip_recommendation_actions` | enabled | authenticated: auth.uid() = user_id<br>authenticated: public.is_admin_or_supervisor() | authenticated: auth.uid() = user_id | — | — |
| `voip_trunk_health_checks` | enabled | public: public.is_admin_user(auth.uid()) | public: false | — | — |
| `voip_trunk_usage_metrics` | enabled | authenticated: public.is_admin_or_supervisor()<br>authenticated: agent_id = public.get_user_agent_id()<br>authenticated: public.is_admin() | authenticated: false<br>authenticated: public.is_admin() | authenticated: public.is_admin() | authenticated: public.is_admin() |
| `voip_trunks` | enabled | authenticated: public.is_admin_user(auth.uid())<br>authenticated: public.is_admin() | authenticated: public.is_admin_user(auth.uid())<br>authenticated: public.is_admin() | authenticated: public.is_admin_user(auth.uid())<br>authenticated: public.is_admin() | authenticated: public.is_admin_user(auth.uid())<br>authenticated: public.is_admin() |
| `webauthn_challenges` | enabled | authenticated: user_id = auth.uid() | authenticated: user_id IS NOT NULL AND auth.uid() = user_id | authenticated: false | authenticated: expires_at < now() AND (user_id = auth.uid() OR is_admin_or_supervisor())<br>authenticated: user_id = auth.uid() |
| `webhook_flush_metrics` | enabled | authenticated: public.is_admin_or_supervisor() | authenticated: (SELECT auth.uid()) = user_id | — | — |
| `webhook_secrets` | enabled | public: EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin' )<br>authenticated: EXISTS ( SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin' ) | public: EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin' )<br>authenticated: EXISTS ( SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin' ) | public: EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin' )<br>authenticated: EXISTS ( SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin' ) | public: EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin' )<br>authenticated: EXISTS ( SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin' ) |
| `whisper_messages` | enabled | public: true<br>public: is_admin_or_supervisor() OR agent_name = get_user_agent_name() | public: true<br>public: public.is_admin_or_supervisor() | public: true<br>public: is_admin_or_supervisor() OR agent_name = get_user_agent_name() | public: true<br>public: public.is_admin_or_supervisor() |

> `—` com RLS ligado = ninguém além de service_role. `sem RLS` = qualquer chave anon lê/escreve tudo.

## Onde o RLS é IGNORADO (service_role) — 100 arquivo(s)

- `scripts/ai-context/cenarios.mjs`
- `scripts/ai-context/gerar.unit.mjs`
- `scripts/check-data.mjs`
- `scripts/check-rls.mjs`
- `scripts/inventario/gerar-banco.mjs`
- `scripts/regras_negocio/generate.py`
- `scripts/supabase_snapshot/snapshot.py`
- `scripts/test-auth-flow.mjs`
- `scripts/test-authenticated-queries.mjs`
- `scripts/test-rls-access.mjs`
- `supabase/functions/_shared/hmac.ts`
- `supabase/functions/_shared/rate-limit.ts`
- `supabase/functions/_shared/validator.ts`
- `supabase/functions/analyze-contact-profile/index.ts`
- `supabase/functions/analyze-live-utterance/index.ts`
- `supabase/functions/analyze-sentiment/index.ts`
- `supabase/functions/approve-password-reset/index.ts`
- `supabase/functions/auto-scorecard/index.ts`
- `supabase/functions/chat-widget-session/index.ts`
- `supabase/functions/chatbot-respond/index.ts`
- `supabase/functions/check-alerts/index.ts`
- `supabase/functions/check-contact-alerts/index.ts`
- `supabase/functions/check-goals/index.ts`
- `supabase/functions/check-hold-alerts/index.ts`
- `supabase/functions/check-queue-metrics/index.ts`
- `supabase/functions/cleanup-lock-conflicts/index.ts`
- `supabase/functions/compute-account-health/index.ts`
- `supabase/functions/compute-best-time/index.ts`
- `supabase/functions/compute-deal-health/index.ts`
- `supabase/functions/data-lake-flush/index.ts`
- `supabase/functions/database-backup/index.ts`
- `supabase/functions/database-cleanup/index.ts`
- `supabase/functions/detect-churn-risk/index.ts`
- `supabase/functions/detect-key-moments/index.ts`
- `supabase/functions/dialer-pacing-tick/index.ts`
- `supabase/functions/email-inbound/index.ts`
- `supabase/functions/embed-kb-article/index.ts`
- `supabase/functions/enforce-sla/index.ts`
- `supabase/functions/enroll-voice/index.ts`
- `supabase/functions/export-data-lake/index.ts`
- `supabase/functions/extract-crm-fields/index.ts`
- `supabase/functions/forecast-deals/index.ts`
- `supabase/functions/generate-coaching-track/index.ts`
- `supabase/functions/generate-coaching/index.ts`
- `supabase/functions/generate-meeting-summary/index.ts`
- `supabase/functions/global-load-test/index.ts`
- `supabase/functions/health-check/__tests__/index.test.ts`
- `supabase/functions/health-check/index.ts`
- `supabase/functions/migrate-helper/index.ts`
- `supabase/functions/ocr-virtual-fax/index.ts`
- `supabase/functions/process-digest/index.ts`
- `supabase/functions/record-consent/index.ts`
- `supabase/functions/redact-sensitive-audio/index.ts`
- `supabase/functions/request-password-reset/index.ts`
- `supabase/functions/rls-audit/index.ts`
- `supabase/functions/score-call-attempt/index.ts`
- `supabase/functions/score-call/index.ts`
- `supabase/functions/search-calls/index.ts`
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/send-survey/index.ts`
- `supabase/functions/sip-config/index.ts`
- `supabase/functions/suggest-shift-swaps/index.ts`
- `supabase/functions/sync-crm-queue/index.ts`
- `supabase/functions/teams-fetch-recordings/index.ts`
- `supabase/functions/transcribe-recording/index.ts`
- `supabase/functions/translate-summary/index.ts`
- `supabase/functions/translate-utterance/index.ts`
- `supabase/functions/validate-geo/index.ts`
- `supabase/functions/validate-ip/index.ts`
- `supabase/functions/verify-voice/index.ts`
- `supabase/functions/voice-command/index.ts`
- `supabase/functions/voip-failover-notifier/index.ts`
- `supabase/functions/voip-load-test/index.ts`
- `supabase/functions/voip-trunks-healthcheck/index.test.ts`
- `supabase/functions/voip-trunks-healthcheck/index.ts`
- `supabase/functions/voip-trunks-manage/index.ts`
- `supabase/functions/webauthn-authenticate/index.ts`
- `supabase/functions/webhook-handler/index.ts`
- `supabase/functions/whatsapp-inbound/index.ts`
- `supabase/migrations/20260417001429_4d360a46-05bd-40b3-a5db-9ad5586337f2.sql`
- `supabase/migrations/20260418123340_d3452a78-2e4f-4f47-9bd6-c59dabad34d6.sql`
- `supabase/migrations/20260418123436_9d9ee1c4-c236-426f-8034-7ca5df2e6d70.sql`
- `supabase/migrations/20260507194207_0b6ba7a2-4a8f-44f5-8d5f-f822e2ed9a3d.sql`
- `supabase/migrations/20260515173713_956eede7-264d-4ead-8440-33022635c0d9.sql`
- `supabase/migrations/20260522202120_9602a6a5-b48f-402b-a194-f1c009763fbc.sql`
- `supabase/migrations/20260522202145_242ac03f-8895-4f38-a4c3-0fd49b927174.sql`
- `supabase/migrations/20260711153050_e3d3822b-d711-42cf-8514-1f348c336641.sql`
- `supabase/migrations/20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql`
- `supabase/migrations/20260712195727_e87753b7-3685-42d0-b3c6-5fee033d22cf.sql`
- `supabase/migrations/20260712220353_071b40cb-ca2f-4b91-9f14-1f1baf77d987.sql`
- `supabase/migrations/20260713105943_b2f9b04c-7571-47f3-8b80-5a4fc5e40844.sql`
- `supabase/migrations/20260715185447_78833799-0540-48b7-9640-44ce0237af8d.sql`
- `supabase/migrations/20260722213602_011fe9c6-e570-4180-be7a-d9a276c66f2e.sql`
- `supabase/migrations/20260722213827_7ee185db-587f-4046-8507-474be04327a8.sql`
- `supabase/migrations/20260723114026_7c8c04ab-ff4d-4e6f-bbb0-8a93df42420b.sql`
- `supabase/migrations/20260726160049_14fac8e9-52d1-4daf-b825-2005ac32e981.sql`
- `supabase/migrations/20260726195450_0ffeebc4-7139-4dfa-8465-d41d8193ea38.sql`
- `supabase/migrations/20260726200037_ddb39a7d-1e45-4c97-be01-1923e0caea6d.sql`
- `supabase/migrations/20260726201157_da4cb47a-5f61-4783-9786-eb99a7ee6bfc.sql`
- `supabase/migrations/20260726202218_619850bb-a4f2-4112-96d7-872649f70b37.sql`

## Funções SQL `SECURITY DEFINER` (rodam com privilégio do dono, ignoram RLS)

- `add_to_dnc`
- `apply_predictive_pacing`
- `audit_role_change`
- `audit_table_change`
- `bridge_voip_alert_to_notification`
- `calculate_predictive_pace`
- `can_access_agent_data`
- `check_all_tables_rls_status`
- `check_calling_hours`
- `check_dnc`
- `check_idle_indexes`
- `check_ip_allowed`
- `check_ip_in_cidr`
- `check_login_lockout`
- `check_rate_limit`
- `check_rls_enabled`
- `check_suspicious_activity`
- `check_table_bloat`
- `cleanup_expired_challenges`
- `cleanup_old_data`
- `cleanup_old_logs`
- `enforce_optimistic_lock`
- `expire_parked_calls`
- `get_agent_financial_leaderboard`
- `get_agent_performance`
- `get_agents_with_active_calls`
- `get_auth_agent_id`
- `get_call_history_with_summaries`
- `get_call_queues_overview`
- `get_call_volume_stats`
- `get_dashboard_stats`
- `get_database_health_snapshot`
- `get_profile_role`
- `get_queue_stats`
- `get_top_slow_queries`
- `get_user_agent_id`
- `get_user_agent_name`
- `get_user_role`
- `get_user_roles`
- `handle_kb_article_history`
- `handle_new_user`
- `has_permission`
- `has_role`
- `is_active_agent`
- `is_admin`
- `is_admin_or_supervisor`
- `is_admin_user`
- `is_supervisor`
- `log_audit_event`
- `log_critical_rls_event`
- `log_index_drop_copy`
- `log_rls_event`
- `notify_bloat_hotspots`
- `notify_idle_indexes`
- `notify_lock_conflict_hotspot`
- `notify_suspicious_index_drop_activity`
- `notify_trunk_offline`
- `notify_webhook_failure_spike`
- `prevent_role_escalation`
- `process_audit_log`
- `recalc_deal_health`
- `record_failed_login`
- `record_successful_login`
- `record_trunk_usage`
- `reset_public_index_stats`
- `snapshot_deals_daily`
- `trg_recalc_deals_on_interaction`
- `trigger_auto_scorecard`
- `validate_audit_insert`
- `validate_call_queue`
- `validate_park_orbit`
- `validate_parked_call`
- `validate_queue_audio_slots`

## Edge functions públicas (sem JWT — qualquer um chama)

- `migrate-helper`

## Rotas protegidas no front

| Rota | Guard | Roles | Arquivo |
|---|---|---|---|
| /app | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| path | ProtectedRoute |  | `src/App.tsx` |

Guards usados: Protected, ProtectedRoute

Middleware matcher (Next.js): nenhum

## Grants / Revokes (agrupados por role e privilégio)

| Ação | Para/De | Privilégios | Objetos |
|---|---|---|---|
| grant | anon, authenticated | execute | `check_login_lockout`, `record_failed_login`, `record_successful_login`, `check_ip_allowed` |
| grant | authenticated | execute | `log_audit_event`, `get_dashboard_stats`, `get_queue_stats`, `log_audit_event`, `get_agent_performance`, `get_call_history_with_summaries`, `get_call_volume_stats`, `get_agents_with_active_calls`, `check_all_tables_rls_status`, `has_role`, `has_permission`, `get_user_role`, `get_user_agent_name`, `get_auth_agent_id`, `get_user_agent_id` … +18 |
| grant | authenticated | select | `financial_impact_daily`, `index_drop_audit` |
| grant | authenticated | select, insert | `webhook_flush_metrics` |
| grant | authenticated | select, insert, update, delete | `deal_revenue_snapshots`, `shift_swap_suggestions`, `data_lake_exports`, `dialer_favorites`, `call_queues`, `call_queue_members`, `ring_groups`, `ring_group_members`, `queue_audio_prompts`, `call_park_orbits`, `parked_calls` |
| grant | authenticated, service_role | execute | `get_agent_financial_leaderboard`, `calculate_predictive_pace`, `recalc_deal_health`, `expire_parked_calls` |
| grant | postgres | all privileges | `cron` |
| grant | service_role | all | `deal_revenue_snapshots`, `shift_swap_suggestions`, `data_lake_exports`, `index_drop_audit`, `webhook_flush_metrics`, `dialer_favorites`, `call_queues`, `call_queue_members`, `ring_groups`, `ring_group_members`, `queue_audio_prompts`, `call_park_orbits`, `parked_calls` |
| grant | service_role | execute | `check_all_tables_rls_status`, `log_rls_event`, `apply_predictive_pacing`, `snapshot_deals_daily`, `trigger_auto_scorecard` |
| revoke | PUBLIC | all | `log_index_drop_copy`, `expire_parked_calls` |
| revoke | PUBLIC | execute | `get_dashboard_stats`, `get_queue_stats`, `get_call_history_with_summaries`, `get_call_volume_stats`, `get_agents_with_active_calls`, `cleanup_old_logs`, `log_rls_event` |
| revoke | PUBLIC, anon | all | `calculate_predictive_pace`, `recalc_deal_health` |
| revoke | PUBLIC, anon, authenticated | all | `apply_predictive_pacing`, `snapshot_deals_daily` |
| revoke | PUBLIC, anon, authenticated | execute | `trigger_auto_scorecard` |
| revoke | anon | execute | `cleanup_old_logs` |
| revoke | anon, PUBLIC | execute | `get_agent_financial_leaderboard`, `get_agent_financial_leaderboard` |
| revoke | anon, authenticated | execute | `cleanup_old_data`, `check_all_tables_rls_status`, `cleanup_expired_challenges`, `check_all_tables_rls_status`, `cleanup_old_data`, `cleanup_expired_challenges`, `check_rls_enabled` |
| revoke | public | all | `get_agent_financial_leaderboard` |

## Riscos de acesso detectados

| Tabela | Problema | Arquivos |
|---|---|---|
| `crm_sync_queue` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/lib/bitrix/sync-log.ts` |
| `financial_impact_daily` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useFinancialImpact.ts` |
| `geo_access_logs` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useGeoBlocking.ts` |
| `geo_restrictions` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useGeoBlocking.ts` |
| `geo_settings` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useGeoBlocking.ts` |
| `rate_limit_logs` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/hooks/useRateLimitData.ts` |
| `rate_limit_logs` | front faz DELETE mas nenhuma política RLS permite DELETE → vai falhar/retornar vazio para usuários | `src/hooks/useRateLimitData.ts` |

## Multi-tenancy

- Chave de tenant: **`account_id`** presente em 7 tabela(s): `contacts`, `churn_risk_signals`, `renewals`, `account_journey_history`, `survey_responses`, `success_plans`, `conversations`
- Cobertura: 4% das tabelas. Abaixo de 60% — isolamento provavelmente por usuário (auth.uid()) ou misto; não flagado por tabela.

## Soft delete (registros 'apagados' continuam na tabela — filtre!)

| Tabela | Coluna |
|---|---|
| `dashboard_goals` | `is_active` |
| `user_roles` | `is_active` |
| `active_sessions` | `is_active` |
| `dnc_list` | `is_active` |
| `calling_hours_config` | `is_active` |
| `call_flows` | `is_active` |
| `battle_cards` | `is_active` |
| `battle_card_triggers` | `is_active` |
| `scorecard_templates` | `is_active` |
| `cadences` | `is_active` |
| `trackers` | `is_active` |
| `churn_risk_signals` | `is_active` |
| `customer_journey_stages` | `is_active` |
| `surveys` | `is_active` |
| `shift_templates` | `is_active` |
| `skills` | `is_active` |
| `learning_modules` | `is_active` |
| `chat_sessions` | `is_active` |
| `routing_rules` | `is_active` |
| `sla_policies` | `is_active` |
| `objection_library` | `is_active` |
| `compliance_rules` | `is_active` |
| `voice_prints` | `is_active` |
| `cultural_hints` | `is_active` |
| `voip_trunks` | `is_active` |
| `bitrix_users` | `active` |
| `call_queues` | `is_active` |
| `call_queue_members` | `is_active` |
| `ring_groups` | `is_active` |
| `queue_audio_prompts` | `is_active` |
| `call_park_orbits` | `is_active` |

## Auditoria (colunas de rastreio)

| Tabela | Colunas |
|---|---|
| `saved_filters` | `created_at`, `updated_at` |
| `contacts` | `created_at`, `updated_at` |
| `queue_items` | `created_at` |
| `agents` | `created_at`, `updated_at` |
| `call_sessions` | `created_at` |
| `call_transcriptions` | `created_at` |
| `call_analyses` | `created_at` |
| `call_summaries` | `created_at` |
| `call_alerts` | `created_at` |
| `agent_goals` | `created_at`, `updated_at` |
| `contact_interactions` | `created_at` |
| `contact_alerts` | `created_at` |
| `call_recordings` | `created_at` |
| `hold_events` | `created_at` |
| `hold_alert_settings` | `created_at`, `updated_at` |
| `whisper_messages` | `created_at` |
| `barge_in_sessions` | `created_at` |
| `scheduled_callbacks` | `created_at`, `created_by`, `updated_at` |
| `dialer_campaigns` | `created_at`, `created_by`, `updated_at` |
| `dialer_queue` | `created_at`, `updated_at` |
| `badges` | `created_at` |
| `agent_weekly_stats` | `created_at`, `updated_at` |
| `coaching_recommendations` | `created_at` |
| `user_profiles` | `created_at`, `updated_at` |
| `queue_metrics_settings` | `created_at`, `updated_at` |
| `dashboard_goals` | `created_at`, `updated_at` |
| `goal_violations` | `created_at` |
| `audit_logs` | `created_at` |
| `security_alerts` | `created_at` |
| `ip_whitelist` | `created_at`, `created_by` |
| `user_ip_restrictions` | `created_at`, `updated_at` |
| `user_allowed_ips` | `created_at` |
| `blocked_access_logs` | `created_at` |
| `user_roles` | `created_at`, `updated_at` |
| `permissions` | `created_at` |
| `role_permissions` | `created_at` |
| `rate_limit_logs` | `created_at` |
| `rate_limit_settings` | `created_at`, `updated_at` |
| `user_mfa_settings` | `created_at`, `updated_at` |
| `active_sessions` | `created_at` |
| `password_reset_tokens` | `created_at` |
| `email_verification_tokens` | `created_at` |
| `rate_limit_alerts` | `created_at` |
| `user_passkeys` | `created_at` |
| `webauthn_challenges` | `created_at` |
| `password_reset_requests` | `created_at` |
| `login_attempts` | `created_at` |
| `account_lockouts` | `created_at`, `updated_at` |
| `dnc_list` | `created_at`, `updated_at` |
| `dnc_import_logs` | `created_at` |
| `calling_hours_config` | `created_at`, `updated_at` |
| `holidays` | `created_at` |
| `consent_history` | `created_at` |
| `compliance_settings` | `created_at`, `updated_at`, `updated_by` |
| `notifications` | `created_at`, `updated_at` |
| `notification_preferences` | `created_at`, `updated_at` |
| `call_flows` | `created_at`, `created_by`, `updated_at` |
| `voicemail_messages` | `created_at` |
| `topic_detections` | `created_at` |
| `manager_alerts` | `created_at` |
| `video_conferences` | `created_at`, `updated_at` |
| `hot_desking_stations` | `created_at`, `updated_at` |
| `virtual_fax` | `created_at`, `created_by` |
| `number_porting_requests` | `created_at`, `created_by`, `updated_at` |
| `toll_free_numbers` | `created_at`, `updated_at` |
| `topic_trends` | `created_at` |
| `agent_devices` | `created_at`, `updated_at` |
| `agent_ring_settings` | `created_at`, `updated_at` |
| `call_key_moments` | `created_at` |
| `battle_cards` | `created_at`, `created_by`, `updated_at` |
| `battle_card_triggers` | `created_at` |
| `call_transcripts_searchable` | `created_at`, `updated_at` |
| `coaching_timestamps` | `created_at` |
| `live_sentiment_snapshots` | `created_at` |
| `deals` | `created_at`, `created_by`, `updated_at` |
| `scorecard_templates` | `created_at`, `created_by`, `updated_at` |
| `scorecard_criteria` | `created_at` |
| `call_scorecards` | `created_at`, `updated_at` |
| `scorecard_responses` | `created_at` |
| `cadences` | `created_at`, `created_by`, `updated_at` |
| `cadence_steps` | `created_at` |
| `cadence_enrollments` | `created_at`, `updated_at` |
| `trackers` | `created_at`, `created_by`, `updated_at` |
| `tracker_matches` | `created_at` |
| `call_playlists` | `created_at`, `created_by`, `updated_at` |
| `playlist_items` | `created_at` |
| `accounts` | `created_at`, `updated_at` |
| `churn_risk_signals` | `created_at` |
| `renewals` | `created_at`, `updated_at` |
| `customer_journey_stages` | `created_at`, `updated_at` |
| `account_journey_history` | `created_at` |
| `surveys` | `created_at`, `created_by`, `updated_at` |
| `survey_responses` | `created_at` |
| `success_plans` | `created_at`, `updated_at` |
| `success_plan_milestones` | `created_at`, `updated_at` |
| `shift_templates` | `created_at`, `created_by`, `updated_at` |
| `agent_shifts` | `created_at`, `created_by`, `updated_at` |
| `time_off_requests` | `created_at`, `updated_at` |
| `skills` | `created_at`, `updated_at` |
| `agent_skills` | `created_at`, `updated_at` |
| `queue_skill_requirements` | `created_at` |
| `coaching_assignments` | `created_at`, `updated_at` |
| `learning_modules` | `created_at`, `created_by`, `updated_at` |
| `conversations` | `created_at`, `updated_at` |
| `conversation_messages` | `created_at` |
| `email_tickets` | `created_at` |
| `chat_sessions` | `created_at` |
| `kb_categories` | `created_at`, `updated_at` |
| `kb_articles` | `created_at`, `updated_at` |
| `kb_article_views` | `created_at` |
| `bot_conversations` | `created_at` |
| `routing_rules` | `created_at`, `created_by`, `updated_at` |
| `sla_policies` | `created_at`, `updated_at` |
| `meeting_summaries` | `created_at`, `updated_at` |
| `live_assist_signals` | `created_at` |
| `objection_library` | `created_at`, `created_by`, `updated_at` |
| `compliance_rules` | `created_at`, `created_by`, `updated_at` |
| `crm_field_suggestions` | `created_at`, `updated_at` |
| `voice_prints` | `created_at`, `updated_at` |
| `fraud_signals` | `created_at`, `updated_at` |
| `redaction_log` | `created_at` |
| `consent_records` | `created_at`, `updated_at` |
| `contact_engagement_patterns` | `created_at`, `updated_at` |
| `call_translations` | `created_at` |
| `cultural_hints` | `created_at`, `updated_at` |
| `call_quality_metrics` | `created_at`, `updated_at` |
| `voip_quality_alerts` | `created_at` |
| `voip_trunks` | `created_at`, `created_by`, `updated_at` |
| `agent_trunk_assignments` | `created_at`, `created_by`, `updated_at` |
| `voip_trunk_health_checks` | `created_at` |
| `voip_trunk_usage_metrics` | `created_at` |
| `system_settings` | `created_at`, `updated_at` |
| `crm_sync_queue` | `created_at`, `updated_at` |
| `performance_metrics` | `created_at` |
| `kb_article_history` | `created_at` |
| `voip_monitoring_settings` | `created_at`, `updated_at` |
| `call_control_audit_logs` | `created_at` |
| `rls_audit_logs` | `created_at` |
| `webhook_secrets` | `created_at`, `updated_at` |
| `deal_revenue_snapshots` | `created_at` |
| `shift_swap_suggestions` | `created_at`, `updated_at` |
| `data_lake_exports` | `created_at` |
| `index_drop_audit` | `created_at` |
| `webhook_flush_metrics` | `created_at` |
| `dialer_favorites` | `created_at`, `updated_at` |
| `call_queues` | `created_at`, `created_by`, `updated_at` |
| `call_queue_members` | `created_at`, `updated_at` |
| `ring_groups` | `created_at`, `updated_at` |
| `ring_group_members` | `created_at`, `updated_at` |
| `queue_audio_prompts` | `created_at`, `created_by`, `updated_at` |
| `call_park_orbits` | `created_at`, `updated_at` |
| `parked_calls` | `created_at`, `updated_at` |
| `geo_access_logs` | `created_at` |
| `geo_restrictions` | `created_at`, `created_by`, `updated_at` |
| `geo_settings` | `created_at`, `updated_at` |

## Dados pessoais / sensíveis (LGPD — cuidado em logs, exports, prompts de IA)

| Tabela | Coluna |
|---|---|
| `contacts` | `phone` |
| `contacts` | `email` |
| `agents` | `email` |
| `dialer_queue` | `phone` |
| `user_profiles` | `email` |
| `audit_logs` | `ip_address` |
| `ip_whitelist` | `ip_address` |
| `user_allowed_ips` | `ip_address` |
| `blocked_access_logs` | `ip_address` |
| `rate_limit_logs` | `ip_address` |
| `active_sessions` | `ip_address` |
| `password_reset_tokens` | `ip_address` |
| `email_verification_tokens` | `email` |
| `rate_limit_alerts` | `ip_address` |
| `password_reset_requests` | `ip_address` |
| `login_attempts` | `email` |
| `login_attempts` | `ip_address` |
| `account_lockouts` | `email` |
| `dnc_list` | `phone` |
| `consent_history` | `phone` |
| `consent_history` | `ip_address` |
| `chat_sessions` | `ip_address` |
| `consent_records` | `phone` |
| `consent_records` | `ip_address` |
| `bitrix_users` | `email` |
| `dialer_favorites` | `phone` |
| `geo_access_logs` | `ip_address` |

## Colunas de dinheiro (tipo importa: numeric ✅ / float ❌)

| Tabela | Coluna | Tipo |
|---|---|---|
| `call_summaries` | `customer_satisfaction` | `INTEGER` |
| `dialer_campaigns` | `total_contacts` | `INTEGER` |
| `agent_weekly_stats` | `total_calls` | `INTEGER` |
| `agent_weekly_stats` | `total_duration_seconds` | `INTEGER` |
| `dnc_import_logs` | `total_records` | `INTEGER` |
| `topic_trends` | `total_occurrences` | `INTEGER` |
| `coaching_timestamps` | `feedback_type` | `TEXT` |
| `call_scorecards` | `total_score` | `NUMERIC(6,2)` |
| `call_scorecards` | `feedback` | `TEXT` |
| `contact_engagement_patterns` | `total_attempts` | `INTEGER` |
| `contact_engagement_patterns` | `total_answered` | `INTEGER` |
| `voip_trunks` | `cost_per_minute_cents` | `INTEGER` |
| `financial_impact_daily` | `total_calls` | `number` |
| `financial_impact_daily` | `total_seconds` | `number` |

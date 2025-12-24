-- Remover políticas públicas antigas e criar novas com autenticação

-- Helper function para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Helper function para verificar se usuário é admin ou supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  );
$$;

-- =============== AGENTS ===============
DROP POLICY IF EXISTS "Allow public read on agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public insert on agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public update on agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public delete on agents" ON public.agents;

CREATE POLICY "Authenticated users can view agents"
ON public.agents FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage agents"
ON public.agents FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== BADGES ===============
DROP POLICY IF EXISTS "Allow public read on badges" ON public.badges;
DROP POLICY IF EXISTS "Allow public insert on badges" ON public.badges;
DROP POLICY IF EXISTS "Allow public update on badges" ON public.badges;
DROP POLICY IF EXISTS "Allow public delete on badges" ON public.badges;

CREATE POLICY "Authenticated users can view badges"
ON public.badges FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL
USING (public.get_user_role() = 'admin');

-- =============== AGENT_BADGES ===============
DROP POLICY IF EXISTS "Allow public read on agent_badges" ON public.agent_badges;
DROP POLICY IF EXISTS "Allow public insert on agent_badges" ON public.agent_badges;
DROP POLICY IF EXISTS "Allow public update on agent_badges" ON public.agent_badges;
DROP POLICY IF EXISTS "Allow public delete on agent_badges" ON public.agent_badges;

CREATE POLICY "Authenticated users can view agent_badges"
ON public.agent_badges FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage agent_badges"
ON public.agent_badges FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== AGENT_GOALS ===============
DROP POLICY IF EXISTS "Allow public read on agent_goals" ON public.agent_goals;
DROP POLICY IF EXISTS "Allow public insert on agent_goals" ON public.agent_goals;
DROP POLICY IF EXISTS "Allow public update on agent_goals" ON public.agent_goals;
DROP POLICY IF EXISTS "Allow public delete on agent_goals" ON public.agent_goals;

CREATE POLICY "Authenticated users can view agent_goals"
ON public.agent_goals FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage agent_goals"
ON public.agent_goals FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== AGENT_WEEKLY_STATS ===============
DROP POLICY IF EXISTS "Allow public read on agent_weekly_stats" ON public.agent_weekly_stats;
DROP POLICY IF EXISTS "Allow public insert on agent_weekly_stats" ON public.agent_weekly_stats;
DROP POLICY IF EXISTS "Allow public update on agent_weekly_stats" ON public.agent_weekly_stats;
DROP POLICY IF EXISTS "Allow public delete on agent_weekly_stats" ON public.agent_weekly_stats;

CREATE POLICY "Authenticated users can view agent_weekly_stats"
ON public.agent_weekly_stats FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage agent_weekly_stats"
ON public.agent_weekly_stats FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== CALL_SESSIONS ===============
DROP POLICY IF EXISTS "Allow public read on call_sessions" ON public.call_sessions;
DROP POLICY IF EXISTS "Allow public insert on call_sessions" ON public.call_sessions;
DROP POLICY IF EXISTS "Allow public update on call_sessions" ON public.call_sessions;
DROP POLICY IF EXISTS "Allow public delete on call_sessions" ON public.call_sessions;

CREATE POLICY "Authenticated users can view call_sessions"
ON public.call_sessions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert call_sessions"
ON public.call_sessions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update call_sessions"
ON public.call_sessions FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete call_sessions"
ON public.call_sessions FOR DELETE
USING (public.is_admin_or_supervisor());

-- =============== CALL_RECORDINGS ===============
DROP POLICY IF EXISTS "Allow public read on call_recordings" ON public.call_recordings;
DROP POLICY IF EXISTS "Allow public insert on call_recordings" ON public.call_recordings;
DROP POLICY IF EXISTS "Allow public update on call_recordings" ON public.call_recordings;
DROP POLICY IF EXISTS "Allow public delete on call_recordings" ON public.call_recordings;

CREATE POLICY "Authenticated users can view call_recordings"
ON public.call_recordings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert call_recordings"
ON public.call_recordings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage call_recordings"
ON public.call_recordings FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== CALL_TRANSCRIPTIONS ===============
DROP POLICY IF EXISTS "Allow public read on call_transcriptions" ON public.call_transcriptions;
DROP POLICY IF EXISTS "Allow public insert on call_transcriptions" ON public.call_transcriptions;
DROP POLICY IF EXISTS "Allow public update on call_transcriptions" ON public.call_transcriptions;
DROP POLICY IF EXISTS "Allow public delete on call_transcriptions" ON public.call_transcriptions;

CREATE POLICY "Authenticated users can view call_transcriptions"
ON public.call_transcriptions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert call_transcriptions"
ON public.call_transcriptions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage call_transcriptions"
ON public.call_transcriptions FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== CALL_ANALYSES ===============
DROP POLICY IF EXISTS "Allow public read on call_analyses" ON public.call_analyses;
DROP POLICY IF EXISTS "Allow public insert on call_analyses" ON public.call_analyses;
DROP POLICY IF EXISTS "Allow public update on call_analyses" ON public.call_analyses;
DROP POLICY IF EXISTS "Allow public delete on call_analyses" ON public.call_analyses;

CREATE POLICY "Authenticated users can view call_analyses"
ON public.call_analyses FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert call_analyses"
ON public.call_analyses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage call_analyses"
ON public.call_analyses FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== CALL_SUMMARIES ===============
DROP POLICY IF EXISTS "Allow public read on call_summaries" ON public.call_summaries;
DROP POLICY IF EXISTS "Allow public insert on call_summaries" ON public.call_summaries;
DROP POLICY IF EXISTS "Allow public update on call_summaries" ON public.call_summaries;
DROP POLICY IF EXISTS "Allow public delete on call_summaries" ON public.call_summaries;

CREATE POLICY "Authenticated users can view call_summaries"
ON public.call_summaries FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert call_summaries"
ON public.call_summaries FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage call_summaries"
ON public.call_summaries FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== CALL_ALERTS ===============
DROP POLICY IF EXISTS "Allow public read on call_alerts" ON public.call_alerts;
DROP POLICY IF EXISTS "Allow public insert on call_alerts" ON public.call_alerts;
DROP POLICY IF EXISTS "Allow public update on call_alerts" ON public.call_alerts;
DROP POLICY IF EXISTS "Allow public delete on call_alerts" ON public.call_alerts;

CREATE POLICY "Authenticated users can view call_alerts"
ON public.call_alerts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert call_alerts"
ON public.call_alerts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update call_alerts"
ON public.call_alerts FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete call_alerts"
ON public.call_alerts FOR DELETE
USING (public.is_admin_or_supervisor());

-- =============== CONTACTS ===============
DROP POLICY IF EXISTS "Allow public read on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public insert on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public update on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public delete on contacts" ON public.contacts;

CREATE POLICY "Authenticated users can view contacts"
ON public.contacts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contacts"
ON public.contacts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contacts"
ON public.contacts FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete contacts"
ON public.contacts FOR DELETE
USING (public.is_admin_or_supervisor());

-- =============== CONTACT_INTERACTIONS ===============
DROP POLICY IF EXISTS "Allow public read on contact_interactions" ON public.contact_interactions;
DROP POLICY IF EXISTS "Allow public insert on contact_interactions" ON public.contact_interactions;
DROP POLICY IF EXISTS "Allow public update on contact_interactions" ON public.contact_interactions;
DROP POLICY IF EXISTS "Allow public delete on contact_interactions" ON public.contact_interactions;

CREATE POLICY "Authenticated users can view contact_interactions"
ON public.contact_interactions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contact_interactions"
ON public.contact_interactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage contact_interactions"
ON public.contact_interactions FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== CONTACT_ALERTS ===============
DROP POLICY IF EXISTS "Allow public read on contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Allow public insert on contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Allow public update on contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Allow public delete on contact_alerts" ON public.contact_alerts;

CREATE POLICY "Authenticated users can view contact_alerts"
ON public.contact_alerts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contact_alerts"
ON public.contact_alerts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contact_alerts"
ON public.contact_alerts FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete contact_alerts"
ON public.contact_alerts FOR DELETE
USING (public.is_admin_or_supervisor());

-- =============== WHISPER_MESSAGES ===============
DROP POLICY IF EXISTS "Allow public read on whisper_messages" ON public.whisper_messages;
DROP POLICY IF EXISTS "Allow public insert on whisper_messages" ON public.whisper_messages;
DROP POLICY IF EXISTS "Allow public update on whisper_messages" ON public.whisper_messages;
DROP POLICY IF EXISTS "Allow public delete on whisper_messages" ON public.whisper_messages;

CREATE POLICY "Authenticated users can view whisper_messages"
ON public.whisper_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can insert whisper_messages"
ON public.whisper_messages FOR INSERT
WITH CHECK (public.is_admin_or_supervisor());

CREATE POLICY "Users can update whisper_messages"
ON public.whisper_messages FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete whisper_messages"
ON public.whisper_messages FOR DELETE
USING (public.is_admin_or_supervisor());

-- =============== BARGE_IN_SESSIONS ===============
DROP POLICY IF EXISTS "Allow public read on barge_in_sessions" ON public.barge_in_sessions;
DROP POLICY IF EXISTS "Allow public insert on barge_in_sessions" ON public.barge_in_sessions;
DROP POLICY IF EXISTS "Allow public update on barge_in_sessions" ON public.barge_in_sessions;
DROP POLICY IF EXISTS "Allow public delete on barge_in_sessions" ON public.barge_in_sessions;

CREATE POLICY "Authenticated users can view barge_in_sessions"
ON public.barge_in_sessions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can manage barge_in_sessions"
ON public.barge_in_sessions FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== HOLD_EVENTS ===============
DROP POLICY IF EXISTS "Allow public read on hold_events" ON public.hold_events;
DROP POLICY IF EXISTS "Allow public insert on hold_events" ON public.hold_events;
DROP POLICY IF EXISTS "Allow public update on hold_events" ON public.hold_events;
DROP POLICY IF EXISTS "Allow public delete on hold_events" ON public.hold_events;

CREATE POLICY "Authenticated users can view hold_events"
ON public.hold_events FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert hold_events"
ON public.hold_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update hold_events"
ON public.hold_events FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete hold_events"
ON public.hold_events FOR DELETE
USING (public.is_admin_or_supervisor());

-- =============== HOLD_ALERT_SETTINGS ===============
DROP POLICY IF EXISTS "Allow public read on hold_alert_settings" ON public.hold_alert_settings;
DROP POLICY IF EXISTS "Allow public insert on hold_alert_settings" ON public.hold_alert_settings;
DROP POLICY IF EXISTS "Allow public update on hold_alert_settings" ON public.hold_alert_settings;
DROP POLICY IF EXISTS "Allow public delete on hold_alert_settings" ON public.hold_alert_settings;

CREATE POLICY "Authenticated users can view hold_alert_settings"
ON public.hold_alert_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage hold_alert_settings"
ON public.hold_alert_settings FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== SCHEDULED_CALLBACKS ===============
DROP POLICY IF EXISTS "Allow public read on scheduled_callbacks" ON public.scheduled_callbacks;
DROP POLICY IF EXISTS "Allow public insert on scheduled_callbacks" ON public.scheduled_callbacks;
DROP POLICY IF EXISTS "Allow public update on scheduled_callbacks" ON public.scheduled_callbacks;
DROP POLICY IF EXISTS "Allow public delete on scheduled_callbacks" ON public.scheduled_callbacks;

CREATE POLICY "Authenticated users can view scheduled_callbacks"
ON public.scheduled_callbacks FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert scheduled_callbacks"
ON public.scheduled_callbacks FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update scheduled_callbacks"
ON public.scheduled_callbacks FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete scheduled_callbacks"
ON public.scheduled_callbacks FOR DELETE
USING (public.is_admin_or_supervisor());

-- =============== DIALER_CAMPAIGNS ===============
DROP POLICY IF EXISTS "Allow public read on dialer_campaigns" ON public.dialer_campaigns;
DROP POLICY IF EXISTS "Allow public insert on dialer_campaigns" ON public.dialer_campaigns;
DROP POLICY IF EXISTS "Allow public update on dialer_campaigns" ON public.dialer_campaigns;
DROP POLICY IF EXISTS "Allow public delete on dialer_campaigns" ON public.dialer_campaigns;

CREATE POLICY "Authenticated users can view dialer_campaigns"
ON public.dialer_campaigns FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can manage dialer_campaigns"
ON public.dialer_campaigns FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== DIALER_QUEUE ===============
DROP POLICY IF EXISTS "Allow public read on dialer_queue" ON public.dialer_queue;
DROP POLICY IF EXISTS "Allow public insert on dialer_queue" ON public.dialer_queue;
DROP POLICY IF EXISTS "Allow public update on dialer_queue" ON public.dialer_queue;
DROP POLICY IF EXISTS "Allow public delete on dialer_queue" ON public.dialer_queue;

CREATE POLICY "Authenticated users can view dialer_queue"
ON public.dialer_queue FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update dialer_queue"
ON public.dialer_queue FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can manage dialer_queue"
ON public.dialer_queue FOR ALL
USING (public.is_admin_or_supervisor());

-- =============== COACHING_RECOMMENDATIONS ===============
DROP POLICY IF EXISTS "Anyone can view coaching recommendations" ON public.coaching_recommendations;
DROP POLICY IF EXISTS "Anyone can insert coaching recommendations" ON public.coaching_recommendations;
DROP POLICY IF EXISTS "Anyone can update coaching recommendations" ON public.coaching_recommendations;
DROP POLICY IF EXISTS "Anyone can delete coaching recommendations" ON public.coaching_recommendations;

CREATE POLICY "Authenticated users can view coaching_recommendations"
ON public.coaching_recommendations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can insert coaching_recommendations"
ON public.coaching_recommendations FOR INSERT
WITH CHECK (public.is_admin_or_supervisor());

CREATE POLICY "Authenticated users can update coaching_recommendations"
ON public.coaching_recommendations FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors can delete coaching_recommendations"
ON public.coaching_recommendations FOR DELETE
USING (public.is_admin_or_supervisor());
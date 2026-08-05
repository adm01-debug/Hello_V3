
-- 1. notifications: restrict INSERT to own user_id
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. contact_interactions: remove OR agent_name IS NULL
DROP POLICY IF EXISTS "Agents can insert own interactions" ON public.contact_interactions;
DROP POLICY IF EXISTS "Authenticated users can insert interactions" ON public.contact_interactions;
CREATE POLICY "Agents can insert own interactions"
  ON public.contact_interactions FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name));

-- 3. call_sessions: remove OR agent_name IS NULL
DROP POLICY IF EXISTS "Agents can insert own sessions" ON public.call_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert sessions" ON public.call_sessions;
CREATE POLICY "Agents can insert own call sessions"
  ON public.call_sessions FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name));

-- 4. webauthn_challenges: restrict to own user_id
DROP POLICY IF EXISTS "Authenticated users can insert challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Users can insert own challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can insert own challenges"
  ON public.webauthn_challenges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. hold_events: restrict INSERT and UPDATE
DROP POLICY IF EXISTS "Authenticated users can insert hold events" ON public.hold_events;
DROP POLICY IF EXISTS "Authenticated users can update hold events" ON public.hold_events;
CREATE POLICY "Admins or linked agents can insert hold events"
  ON public.hold_events FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor());
CREATE POLICY "Admins or linked agents can update hold events"
  ON public.hold_events FOR UPDATE TO authenticated
  USING (is_admin_or_supervisor());

-- 6. rate_limit_alerts: admin-only INSERT
DROP POLICY IF EXISTS "Authenticated users can insert rate limit alerts" ON public.rate_limit_alerts;
CREATE POLICY "Only admins can insert rate limit alerts"
  ON public.rate_limit_alerts FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor());

-- 7. rate_limit_logs: admin-only INSERT
DROP POLICY IF EXISTS "Authenticated users can insert rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "Only admins can insert rate limit logs"
  ON public.rate_limit_logs FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor());

-- 8. blocked_access_logs: admin-only INSERT
DROP POLICY IF EXISTS "Authenticated users can insert blocked access logs" ON public.blocked_access_logs;
CREATE POLICY "Only admins can insert blocked access logs"
  ON public.blocked_access_logs FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor());

-- 9. geo_access_logs: admin-only INSERT
DROP POLICY IF EXISTS "Authenticated users can insert geo access logs" ON public.geo_access_logs;
CREATE POLICY "Only admins can insert geo access logs"
  ON public.geo_access_logs FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor());

-- 10. voicemail_messages: restrict to own agent or admin
DROP POLICY IF EXISTS "Authenticated users can insert voicemails" ON public.voicemail_messages;
CREATE POLICY "Agents or admins can insert voicemails"
  ON public.voicemail_messages FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name));

-- 11. topic_detections: admin/supervisor only INSERT
DROP POLICY IF EXISTS "Authenticated users can insert topic detections" ON public.topic_detections;
CREATE POLICY "Only admins can insert topic detections"
  ON public.topic_detections FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor());

-- 12. geo_restrictions: explicit SELECT for authenticated
DROP POLICY IF EXISTS "Authenticated users can view geo restrictions" ON public.geo_restrictions;
CREATE POLICY "Authenticated users can read geo restrictions"
  ON public.geo_restrictions FOR SELECT TO authenticated
  USING (true);

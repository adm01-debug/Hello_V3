
-- notifications: remove broad policy
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;

-- password_reset_requests: restrict to own user_id
DROP POLICY IF EXISTS "Authenticated can request password reset" ON public.password_reset_requests;
CREATE POLICY "Users can request own password reset"
  ON public.password_reset_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- hold_events: remove broad policies
DROP POLICY IF EXISTS "Authenticated users can insert hold_events" ON public.hold_events;
DROP POLICY IF EXISTS "Authenticated users can update hold_events" ON public.hold_events;

-- voicemail_messages: remove broad policy
DROP POLICY IF EXISTS "System can insert voicemail" ON public.voicemail_messages;

-- topic_detections: remove broad policy
DROP POLICY IF EXISTS "System can insert topics" ON public.topic_detections;

-- geo_access_logs: remove broad policy
DROP POLICY IF EXISTS "Authenticated can insert geo access logs" ON public.geo_access_logs;
DROP POLICY IF EXISTS "Authenticated can insert geo_access_logs" ON public.geo_access_logs;

-- blocked_access_logs: remove broad policy
DROP POLICY IF EXISTS "Authenticated can insert blocked_access_logs" ON public.blocked_access_logs;
DROP POLICY IF EXISTS "Authenticated can insert blocked access logs" ON public.blocked_access_logs;

-- rate_limit_alerts: remove broad policy
DROP POLICY IF EXISTS "Authenticated can insert rate_limit_alerts" ON public.rate_limit_alerts;
DROP POLICY IF EXISTS "Authenticated can insert rate limit alerts" ON public.rate_limit_alerts;

-- rate_limit_logs: remove broad policy
DROP POLICY IF EXISTS "Authenticated can insert rate_limit_logs" ON public.rate_limit_logs;
DROP POLICY IF EXISTS "Authenticated can insert rate limit logs" ON public.rate_limit_logs;

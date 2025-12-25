-- Create helper function to get the agent_id for the current user
CREATE OR REPLACE FUNCTION public.get_user_agent_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT agent_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Create helper function to get the agent name for the current user
CREATE OR REPLACE FUNCTION public.get_user_agent_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT a.name FROM public.agents a
  INNER JOIN public.user_profiles up ON up.agent_id = a.id
  WHERE up.id = auth.uid();
$$;

-- Create helper function to check if user can access agent data
CREATE OR REPLACE FUNCTION public.can_access_agent_data(target_agent_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    is_admin_or_supervisor() 
    OR get_user_agent_name() = target_agent_name;
$$;

-- ============================================
-- Update RLS policies for agents table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view agents" ON public.agents;

CREATE POLICY "Agents can view own record, admins/supervisors view all"
ON public.agents FOR SELECT
USING (
  is_admin_or_supervisor() 
  OR id = get_user_agent_id()
);

-- ============================================
-- Update RLS policies for contacts table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.contacts;

-- Admins/Supervisors see all, agents see all (call center needs this for receiving calls)
CREATE POLICY "All authenticated users can view contacts"
ON public.contacts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert contacts"
ON public.contacts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update contacts"
ON public.contacts FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ============================================
-- Update RLS policies for call_sessions table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view call_sessions" ON public.call_sessions;
DROP POLICY IF EXISTS "Authenticated users can update call_sessions" ON public.call_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert call_sessions" ON public.call_sessions;

CREATE POLICY "Role-based view call_sessions"
ON public.call_sessions FOR SELECT
USING (
  is_admin_or_supervisor() 
  OR agent_name = get_user_agent_name()
);

CREATE POLICY "Role-based insert call_sessions"
ON public.call_sessions FOR INSERT
WITH CHECK (
  is_admin_or_supervisor() 
  OR agent_name = get_user_agent_name()
  OR agent_name IS NULL
);

CREATE POLICY "Role-based update call_sessions"
ON public.call_sessions FOR UPDATE
USING (
  is_admin_or_supervisor() 
  OR agent_name = get_user_agent_name()
);

-- ============================================
-- Update RLS policies for call_transcriptions table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view call_transcriptions" ON public.call_transcriptions;
DROP POLICY IF EXISTS "Authenticated users can insert call_transcriptions" ON public.call_transcriptions;

CREATE POLICY "Role-based view call_transcriptions"
ON public.call_transcriptions FOR SELECT
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

CREATE POLICY "Role-based insert call_transcriptions"
ON public.call_transcriptions FOR INSERT
WITH CHECK (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

-- ============================================
-- Update RLS policies for call_recordings table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view call_recordings" ON public.call_recordings;
DROP POLICY IF EXISTS "Authenticated users can insert call_recordings" ON public.call_recordings;

CREATE POLICY "Role-based view call_recordings"
ON public.call_recordings FOR SELECT
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

CREATE POLICY "Role-based insert call_recordings"
ON public.call_recordings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Update RLS policies for call_analyses table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view call_analyses" ON public.call_analyses;
DROP POLICY IF EXISTS "Authenticated users can insert call_analyses" ON public.call_analyses;

CREATE POLICY "Role-based view call_analyses"
ON public.call_analyses FOR SELECT
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

CREATE POLICY "Role-based insert call_analyses"
ON public.call_analyses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Update RLS policies for call_summaries table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view call_summaries" ON public.call_summaries;
DROP POLICY IF EXISTS "Authenticated users can insert call_summaries" ON public.call_summaries;

CREATE POLICY "Role-based view call_summaries"
ON public.call_summaries FOR SELECT
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs 
    WHERE cs.id = call_session_id 
    AND cs.agent_name = get_user_agent_name()
  )
);

CREATE POLICY "Role-based insert call_summaries"
ON public.call_summaries FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Update RLS policies for scheduled_callbacks table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view scheduled_callbacks" ON public.scheduled_callbacks;
DROP POLICY IF EXISTS "Authenticated users can update scheduled_callbacks" ON public.scheduled_callbacks;
DROP POLICY IF EXISTS "Authenticated users can insert scheduled_callbacks" ON public.scheduled_callbacks;

CREATE POLICY "Role-based view scheduled_callbacks"
ON public.scheduled_callbacks FOR SELECT
USING (
  is_admin_or_supervisor()
  OR assigned_agent = get_user_agent_name()
  OR created_by = get_user_agent_name()
);

CREATE POLICY "Role-based insert scheduled_callbacks"
ON public.scheduled_callbacks FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Role-based update scheduled_callbacks"
ON public.scheduled_callbacks FOR UPDATE
USING (
  is_admin_or_supervisor()
  OR assigned_agent = get_user_agent_name()
  OR created_by = get_user_agent_name()
);

-- ============================================
-- Update RLS policies for dialer_queue table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view dialer_queue" ON public.dialer_queue;
DROP POLICY IF EXISTS "Authenticated users can update dialer_queue" ON public.dialer_queue;

CREATE POLICY "Role-based view dialer_queue"
ON public.dialer_queue FOR SELECT
USING (
  is_admin_or_supervisor()
  OR assigned_agent = get_user_agent_name()
);

CREATE POLICY "Role-based update dialer_queue"
ON public.dialer_queue FOR UPDATE
USING (
  is_admin_or_supervisor()
  OR assigned_agent = get_user_agent_name()
);

-- ============================================
-- Update RLS policies for contact_interactions table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view contact_interactions" ON public.contact_interactions;
DROP POLICY IF EXISTS "Authenticated users can insert contact_interactions" ON public.contact_interactions;

CREATE POLICY "Role-based view contact_interactions"
ON public.contact_interactions FOR SELECT
USING (
  is_admin_or_supervisor()
  OR agent_name = get_user_agent_name()
);

CREATE POLICY "Role-based insert contact_interactions"
ON public.contact_interactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Update RLS policies for coaching_recommendations table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view coaching_recommendations" ON public.coaching_recommendations;
DROP POLICY IF EXISTS "Authenticated users can update coaching_recommendations" ON public.coaching_recommendations;

CREATE POLICY "Role-based view coaching_recommendations"
ON public.coaching_recommendations FOR SELECT
USING (
  is_admin_or_supervisor()
  OR agent_id = get_user_agent_id()
);

CREATE POLICY "Role-based update coaching_recommendations"
ON public.coaching_recommendations FOR UPDATE
USING (
  is_admin_or_supervisor()
  OR agent_id = get_user_agent_id()
);

-- ============================================
-- Update RLS policies for agent_weekly_stats table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view agent_weekly_stats" ON public.agent_weekly_stats;

CREATE POLICY "Role-based view agent_weekly_stats"
ON public.agent_weekly_stats FOR SELECT
USING (
  is_admin_or_supervisor()
  OR agent_id = get_user_agent_id()
);

-- ============================================
-- Update RLS policies for whisper_messages table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view whisper_messages" ON public.whisper_messages;

CREATE POLICY "Role-based view whisper_messages"
ON public.whisper_messages FOR SELECT
USING (
  is_admin_or_supervisor()
  OR agent_name = get_user_agent_name()
);

-- ============================================
-- Update RLS policies for contact_alerts table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Authenticated users can update contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert contact_alerts" ON public.contact_alerts;

CREATE POLICY "Role-based view contact_alerts"
ON public.contact_alerts FOR SELECT
USING (is_admin_or_supervisor());

CREATE POLICY "Role-based insert contact_alerts"
ON public.contact_alerts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Role-based update contact_alerts"
ON public.contact_alerts FOR UPDATE
USING (is_admin_or_supervisor());

-- agents: drop admin-only redundant (broader admin_or_supervisor policy already covers)
DROP POLICY IF EXISTS "Admins have full access to agents" ON public.agents;

-- agent_trunk_assignments: drop redundant admin-only
DROP POLICY IF EXISTS "Admins have full access to agent_trunk_assignments" ON public.agent_trunk_assignments;

-- user_profiles: drop redundant admin ALL
DROP POLICY IF EXISTS "Admins have full access to user_profiles" ON public.user_profiles;

-- user_roles: drop redundant admin ALL
DROP POLICY IF EXISTS "Admins have full access to user_roles" ON public.user_roles;

-- audit_logs: drop duplicate admin SELECT
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- active_sessions: SELECT redundante com ALL "Users can manage their own sessions"
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.active_sessions;

-- agent_ring_settings: SELECT redundante com ALL "Admins can manage ring_settings"
DROP POLICY IF EXISTS "Supervisors can read agent ring settings" ON public.agent_ring_settings;

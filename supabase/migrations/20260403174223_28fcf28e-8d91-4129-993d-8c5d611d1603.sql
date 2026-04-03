-- 1. Remove permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "Validated audit_logs insert" ON public.audit_logs;

-- 2. Remove remaining tables from Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.agents;
ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_alerts;
ALTER PUBLICATION supabase_realtime DROP TABLE public.call_alerts;
ALTER PUBLICATION supabase_realtime DROP TABLE public.scheduled_callbacks;
ALTER PUBLICATION supabase_realtime DROP TABLE public.goal_violations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.hold_events;
ALTER PUBLICATION supabase_realtime DROP TABLE public.agent_badges;
ALTER PUBLICATION supabase_realtime DROP TABLE public.badges;
ALTER PUBLICATION supabase_realtime DROP TABLE public.dialer_campaigns;
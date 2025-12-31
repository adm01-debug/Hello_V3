-- Enable realtime for security alerts table
ALTER TABLE public.security_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;

-- Enable realtime for blocked access logs
ALTER TABLE public.blocked_access_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_access_logs;

-- Enable realtime for rate limit alerts
ALTER TABLE public.rate_limit_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rate_limit_alerts;
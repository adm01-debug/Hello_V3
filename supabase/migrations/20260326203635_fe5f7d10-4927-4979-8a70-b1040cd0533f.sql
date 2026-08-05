CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON public.call_sessions(status) WHERE status IN ('active', 'ringing', 'on_hold');
CREATE INDEX IF NOT EXISTS idx_call_sessions_agent_date ON public.call_sessions(agent_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dnc_list_phone_active ON public.dnc_list(phone_normalized) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact ON public.contact_interactions(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hold_events_session ON public.hold_events(call_session_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_access_created ON public.blocked_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_lookup ON public.rate_limit_logs(ip_address, endpoint, created_at DESC);
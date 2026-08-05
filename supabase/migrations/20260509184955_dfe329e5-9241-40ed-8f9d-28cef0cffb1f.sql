-- VoIP Monitoring Settings
CREATE TABLE public.voip_monitoring_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occupancy_threshold_percent INTEGER NOT NULL DEFAULT 80,
    latency_threshold_ms INTEGER NOT NULL DEFAULT 200,
    check_interval_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Row Level Security for Settings
ALTER TABLE public.voip_monitoring_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage voip settings" ON public.voip_monitoring_settings
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "All authenticated can view voip settings" ON public.voip_monitoring_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Call Control Audit Logs
CREATE TABLE public.call_control_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id TEXT,
    event_type TEXT NOT NULL, -- 'mute', 'unmute', 'hold', 'unhold'
    source TEXT NOT NULL, -- 'local', 'remote'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Row Level Security for Audit
ALTER TABLE public.call_control_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view call control audit" ON public.call_control_audit_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor')));
CREATE POLICY "Agents can log call control events" ON public.call_control_audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Seed default settings
INSERT INTO public.voip_monitoring_settings (occupancy_threshold_percent, latency_threshold_ms)
VALUES (80, 200);

-- Table for agent device configurations (Multi-device Ring)
CREATE TABLE public.agent_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  device_name text NOT NULL,
  device_type text NOT NULL DEFAULT 'desktop',
  sip_uri text,
  extension text,
  is_enabled boolean NOT NULL DEFAULT true,
  ring_order integer NOT NULL DEFAULT 0,
  ring_delay_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ring group strategy per agent
CREATE TABLE public.agent_ring_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL UNIQUE,
  ring_strategy text NOT NULL DEFAULT 'simultaneous',
  ring_timeout_seconds integer NOT NULL DEFAULT 30,
  fallback_action text NOT NULL DEFAULT 'voicemail',
  dnd_enabled boolean NOT NULL DEFAULT false,
  dnd_schedule jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_ring_settings ENABLE ROW LEVEL SECURITY;

-- RLS: agents see own devices, admins see all
CREATE POLICY "Admins can manage agent_devices" ON public.agent_devices FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Agents can view own devices" ON public.agent_devices FOR SELECT USING (agent_name = get_user_agent_name());
CREATE POLICY "Agents can manage own devices" ON public.agent_devices FOR INSERT WITH CHECK (agent_name = get_user_agent_name());
CREATE POLICY "Agents can update own devices" ON public.agent_devices FOR UPDATE USING (agent_name = get_user_agent_name());
CREATE POLICY "Agents can delete own devices" ON public.agent_devices FOR DELETE USING (agent_name = get_user_agent_name());

CREATE POLICY "Admins can manage ring_settings" ON public.agent_ring_settings FOR ALL USING (is_admin_or_supervisor());
CREATE POLICY "Agents can view own ring_settings" ON public.agent_ring_settings FOR SELECT USING (agent_name = get_user_agent_name());
CREATE POLICY "Agents can insert own ring_settings" ON public.agent_ring_settings FOR INSERT WITH CHECK (agent_name = get_user_agent_name());
CREATE POLICY "Agents can update own ring_settings" ON public.agent_ring_settings FOR UPDATE USING (agent_name = get_user_agent_name());

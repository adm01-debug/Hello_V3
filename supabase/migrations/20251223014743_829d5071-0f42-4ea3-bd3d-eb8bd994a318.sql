-- Tabela de alertas de contatos
CREATE TABLE public.contact_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- buying_signal, sentiment_negative, sentiment_declining, low_engagement, vip_inactive
  severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_actioned BOOLEAN NOT NULL DEFAULT false,
  actioned_at TIMESTAMP WITH TIME ZONE,
  actioned_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para busca eficiente
CREATE INDEX idx_contact_alerts_contact ON public.contact_alerts(contact_id);
CREATE INDEX idx_contact_alerts_type ON public.contact_alerts(alert_type);
CREATE INDEX idx_contact_alerts_unread ON public.contact_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_contact_alerts_created ON public.contact_alerts(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.contact_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow public read on contact_alerts" 
ON public.contact_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on contact_alerts" 
ON public.contact_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on contact_alerts" 
ON public.contact_alerts 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on contact_alerts" 
ON public.contact_alerts 
FOR DELETE 
USING (true);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_alerts;
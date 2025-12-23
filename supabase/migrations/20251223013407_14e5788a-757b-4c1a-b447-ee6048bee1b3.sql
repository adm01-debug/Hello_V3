-- Tabela de contatos com perfil completo
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT, -- ID do Bitrix24 ou outro CRM
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  position TEXT,
  notes TEXT,
  tags TEXT[],
  preferences JSONB DEFAULT '{}',
  personality_insights JSONB DEFAULT '{}',
  source TEXT DEFAULT 'manual', -- manual, bitrix24, import
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para busca eficiente
CREATE INDEX idx_contacts_phone ON public.contacts(phone);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_external_id ON public.contacts(external_id);

-- Habilitar RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (sistema interno)
CREATE POLICY "Allow public read on contacts" 
ON public.contacts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on contacts" 
ON public.contacts 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on contacts" 
ON public.contacts 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de histórico de interações (todas as conversas/chamadas por contato)
CREATE TABLE public.contact_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  call_session_id UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL DEFAULT 'call', -- call, chat, email, note
  direction TEXT, -- inbound, outbound
  summary TEXT,
  transcript TEXT,
  sentiment TEXT,
  topics TEXT[],
  duration_seconds INTEGER,
  agent_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para histórico
CREATE INDEX idx_contact_interactions_contact ON public.contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_created ON public.contact_interactions(created_at DESC);
CREATE INDEX idx_contact_interactions_type ON public.contact_interactions(interaction_type);

-- Habilitar RLS
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow public read on contact_interactions" 
ON public.contact_interactions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on contact_interactions" 
ON public.contact_interactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on contact_interactions" 
ON public.contact_interactions 
FOR UPDATE 
USING (true);

-- Vincular call_sessions a contacts
ALTER TABLE public.call_sessions 
ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX idx_call_sessions_contact ON public.call_sessions(contact_id);
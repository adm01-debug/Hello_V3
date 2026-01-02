-- Migration: HELLO Contact Center - Tabelas de Produção

-- Tabela de Contatos
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  company TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  last_call TIMESTAMPTZ,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Registros de Chamada
CREATE TABLE IF NOT EXISTS public.call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing', 'missed')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'voicemail', 'busy', 'no_answer')),
  duration INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recording_url TEXT,
  transcription TEXT,
  notes TEXT,
  agent_id UUID,
  agent_name TEXT
);

-- Tabela de Fila de Atendimento
CREATE TABLE IF NOT EXISTS public.queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  wait_time INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  agent_assigned TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned')),
  queue_type TEXT DEFAULT 'general',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Agentes
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  extension TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'away', 'break')),
  skills TEXT[],
  max_concurrent_calls INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON public.contacts(favorite) WHERE favorite = true;
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON public.call_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calls_contact ON public.call_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.queue_items(status);

-- RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.call_records FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.queue_items FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.agents FOR ALL USING (true);

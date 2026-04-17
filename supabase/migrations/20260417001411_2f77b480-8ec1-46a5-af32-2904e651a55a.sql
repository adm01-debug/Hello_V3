
-- ============================================
-- OMNICHANNEL ENGAGEMENT SUITE
-- ============================================

-- 1. CONVERSATIONS (thread principal multi-canal)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('voice', 'whatsapp', 'email', 'chat', 'sms')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'snoozed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject TEXT,
  assigned_agent_name TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  external_id TEXT,
  external_metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  first_response_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  sla_first_response_due_at TIMESTAMPTZ,
  sla_resolution_due_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_channel ON public.conversations(channel);
CREATE INDEX idx_conversations_assigned_agent ON public.conversations(assigned_agent_name);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversations_contact ON public.conversations(contact_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Supervisor view all conversations" ON public.conversations
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Agents view assigned conversations" ON public.conversations
  FOR SELECT USING (assigned_agent_name = get_user_agent_name());

CREATE POLICY "Admin/Supervisor manage conversations" ON public.conversations
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Agents update assigned conversations" ON public.conversations
  FOR UPDATE USING (assigned_agent_name = get_user_agent_name())
  WITH CHECK (assigned_agent_name = get_user_agent_name());

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. CONVERSATION MESSAGES
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('contact', 'agent', 'bot', 'system')),
  sender_name TEXT,
  sender_identifier TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'markdown', 'audio', 'image', 'file')),
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_private_note BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.conversation_messages(conversation_id, created_at);
CREATE INDEX idx_messages_direction ON public.conversation_messages(direction);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Supervisor view all messages" ON public.conversation_messages
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Agents view messages from assigned convs" ON public.conversation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_messages.conversation_id
        AND c.assigned_agent_name = get_user_agent_name()
    )
  );

CREATE POLICY "Authenticated users insert messages" ON public.conversation_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/Supervisor manage messages" ON public.conversation_messages
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

-- 3. EMAIL TICKETS
CREATE TABLE public.email_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE,
  in_reply_to TEXT,
  thread_id TEXT,
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  headers JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_tickets_thread ON public.email_tickets(thread_id);
CREATE INDEX idx_email_tickets_conversation ON public.email_tickets(conversation_id);

ALTER TABLE public.email_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Supervisor view all email tickets" ON public.email_tickets
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Agents view tickets from assigned convs" ON public.email_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = email_tickets.conversation_id
        AND c.assigned_agent_name = get_user_agent_name()
    )
  );

CREATE POLICY "Admin/Supervisor manage email tickets" ON public.email_tickets
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

-- 4. CHAT SESSIONS (widget anônimo)
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  visitor_token TEXT NOT NULL UNIQUE,
  visitor_name TEXT,
  visitor_email TEXT,
  origin_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_sessions_token ON public.chat_sessions(visitor_token);
CREATE INDEX idx_chat_sessions_active ON public.chat_sessions(is_active) WHERE is_active = true;

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Supervisor view all chat sessions" ON public.chat_sessions
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Agents view sessions from assigned convs" ON public.chat_sessions
  FOR SELECT USING (
    conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = chat_sessions.conversation_id
        AND c.assigned_agent_name = get_user_agent_name()
    )
  );

CREATE POLICY "Admin/Supervisor manage chat sessions" ON public.chat_sessions
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

-- 5. KNOWLEDGE BASE - CATEGORIES
CREATE TABLE public.kb_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  parent_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read kb_categories" ON public.kb_categories
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

CREATE POLICY "Admin/Supervisor manage kb_categories" ON public.kb_categories
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

CREATE TRIGGER update_kb_categories_updated_at
  BEFORE UPDATE ON public.kb_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. KNOWLEDGE BASE - ARTICLES
CREATE TABLE public.kb_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  author_email TEXT,
  search_vector tsvector,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kb_articles_search ON public.kb_articles USING GIN(search_vector);
CREATE INDEX idx_kb_articles_category ON public.kb_articles(category_id);
CREATE INDEX idx_kb_articles_status ON public.kb_articles(status);
CREATE INDEX idx_kb_articles_tags ON public.kb_articles USING GIN(tags);

CREATE OR REPLACE FUNCTION public.update_kb_article_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER kb_articles_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.kb_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_kb_article_search_vector();

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read published articles" ON public.kb_articles
  FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'published');

CREATE POLICY "Admin/Supervisor view all articles" ON public.kb_articles
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Admin/Supervisor manage articles" ON public.kb_articles
  FOR ALL USING (is_admin_or_supervisor()) WITH CHECK (is_admin_or_supervisor());

-- 7. KNOWLEDGE BASE - ARTICLE VIEWS
CREATE TABLE public.kb_article_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  viewer_id UUID,
  viewer_type TEXT DEFAULT 'agent' CHECK (viewer_type IN ('agent', 'visitor', 'bot')),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kb_views_article ON public.kb_article_views(article_id);
CREATE INDEX idx_kb_views_created ON public.kb_article_views(created_at DESC);

ALTER TABLE public.kb_article_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Supervisor view all kb views" ON public.kb_article_views
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Authenticated insert kb views" ON public.kb_article_views
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. BOT CONVERSATIONS (chatbot audit)
CREATE TABLE public.bot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  intent TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  suggested_articles UUID[] DEFAULT ARRAY[]::UUID[],
  handoff_triggered BOOLEAN DEFAULT false,
  handoff_reason TEXT,
  response_time_ms INTEGER,
  model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_conversations_conv ON public.bot_conversations(conversation_id);
CREATE INDEX idx_bot_conversations_handoff ON public.bot_conversations(handoff_triggered) WHERE handoff_triggered = true;

ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Supervisor view bot conversations" ON public.bot_conversations
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Agents view bot convs from assigned" ON public.bot_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = bot_conversations.conversation_id
        AND c.assigned_agent_name = get_user_agent_name()
    )
  );

CREATE POLICY "Authenticated insert bot conversations" ON public.bot_conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 9. ROUTING RULES
CREATE TABLE public.routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT CHECK (channel IN ('voice', 'whatsapp', 'email', 'chat', 'sms', 'all')),
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  match_count INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_routing_rules_active_priority ON public.routing_rules(is_active, priority) WHERE is_active = true;

ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Supervisor view routing rules" ON public.routing_rules
  FOR SELECT USING (is_admin_or_supervisor());

CREATE POLICY "Admin manage routing rules" ON public.routing_rules
  FOR ALL USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON public.routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. SLA POLICIES
CREATE TABLE public.sla_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT CHECK (channel IN ('voice', 'whatsapp', 'email', 'chat', 'sms', 'all')),
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'all')),
  first_response_minutes INTEGER NOT NULL DEFAULT 60,
  resolution_minutes INTEGER NOT NULL DEFAULT 1440,
  business_hours_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  applies_to_tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_policies_active ON public.sla_policies(is_active) WHERE is_active = true;

ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view sla policies" ON public.sla_policies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage sla policies" ON public.sla_policies
  FOR ALL USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE TRIGGER update_sla_policies_updated_at
  BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial: políticas SLA padrão
INSERT INTO public.sla_policies (name, channel, priority, first_response_minutes, resolution_minutes) VALUES
  ('Padrão - Urgente', 'all', 'urgent', 5, 60),
  ('Padrão - Alta', 'all', 'high', 15, 240),
  ('Padrão - Normal', 'all', 'normal', 60, 1440),
  ('Padrão - Baixa', 'all', 'low', 240, 4320);

-- Seed inicial: categoria KB padrão
INSERT INTO public.kb_categories (name, slug, description, icon, sort_order) VALUES
  ('Geral', 'geral', 'Artigos gerais sobre o sistema', 'BookOpen', 1),
  ('Atendimento', 'atendimento', 'Procedimentos de atendimento ao cliente', 'Headphones', 2),
  ('Técnico', 'tecnico', 'Documentação técnica e troubleshooting', 'Wrench', 3);


-- Conversation messages: agentes só em conversas atribuídas
DROP POLICY IF EXISTS "Authenticated users insert messages" ON public.conversation_messages;

CREATE POLICY "Agents insert in assigned conversations" ON public.conversation_messages
  FOR INSERT WITH CHECK (
    is_admin_or_supervisor() OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_messages.conversation_id
        AND c.assigned_agent_name = get_user_agent_name()
    )
  );

-- KB article views: viewer_id deve corresponder ao auth.uid() quando viewer_type = 'agent'
DROP POLICY IF EXISTS "Authenticated insert kb views" ON public.kb_article_views;

CREATE POLICY "Authenticated insert own kb views" ON public.kb_article_views
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      viewer_type <> 'agent' OR viewer_id = auth.uid()
    )
  );

-- Bot conversations: apenas admin/supervisor ou service_role (edge functions com service key)
DROP POLICY IF EXISTS "Authenticated insert bot conversations" ON public.bot_conversations;

CREATE POLICY "Admin/Supervisor insert bot conversations" ON public.bot_conversations
  FOR INSERT WITH CHECK (is_admin_or_supervisor());

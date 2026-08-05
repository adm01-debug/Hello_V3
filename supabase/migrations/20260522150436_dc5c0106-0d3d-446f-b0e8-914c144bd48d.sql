-- Fix overly permissive RLS on conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  )
);

-- Fix RLS on conversation_messages
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages of their conversations" ON public.conversation_messages;
CREATE POLICY "Users can view messages of their conversations"
ON public.conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.assigned_agent_name = (
      SELECT full_name FROM public.user_profiles WHERE id = auth.uid()
    )
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  )
);

-- Ensure agents table is protected
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view agents" ON public.agents;
CREATE POLICY "Users can view agents"
ON public.agents
FOR SELECT
USING (auth.uid() IS NOT NULL);

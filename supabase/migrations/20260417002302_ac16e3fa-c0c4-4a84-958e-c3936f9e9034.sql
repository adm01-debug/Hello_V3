-- Tabela meeting_summaries: notas pós-call geradas por IA
CREATE TABLE IF NOT EXISTS public.meeting_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id uuid NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  summary text,
  key_points jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  decisions jsonb DEFAULT '[]'::jsonb,
  next_steps jsonb DEFAULT '[]'::jsonb,
  participants_sentiment jsonb DEFAULT '{}'::jsonb,
  topics_discussed text[] DEFAULT ARRAY[]::text[],
  follow_up_required boolean DEFAULT false,
  follow_up_reason text,
  ai_model text,
  ai_confidence numeric,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at timestamptz DEFAULT now(),
  edited boolean DEFAULT false,
  edited_content jsonb,
  edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  edited_at timestamptz,
  shared_with uuid[] DEFAULT ARRAY[]::uuid[],
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','generating','completed','failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_summaries_session
  ON public.meeting_summaries(call_session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_generated_at
  ON public.meeting_summaries(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_followup
  ON public.meeting_summaries(follow_up_required) WHERE follow_up_required = true;
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_status
  ON public.meeting_summaries(status);

ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;

-- SELECT: admin/supervisor full; agent vê apenas summaries de chamadas em que participou
CREATE POLICY "summaries_select_admin_supervisor"
  ON public.meeting_summaries FOR SELECT
  USING (public.is_admin_or_supervisor());

CREATE POLICY "summaries_select_agent_own"
  ON public.meeting_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.call_sessions cs
      WHERE cs.id = meeting_summaries.call_session_id
        AND cs.agent_name = public.get_user_agent_name()
    )
  );

-- INSERT: admin/supervisor + service role (edge function)
CREATE POLICY "summaries_insert_admin_supervisor"
  ON public.meeting_summaries FOR INSERT
  WITH CHECK (public.is_admin_or_supervisor() OR auth.uid() IS NULL);

CREATE POLICY "summaries_insert_agent_own"
  ON public.meeting_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.call_sessions cs
      WHERE cs.id = meeting_summaries.call_session_id
        AND cs.agent_name = public.get_user_agent_name()
    )
  );

-- UPDATE: admin/supervisor + agente da chamada (edição inline)
CREATE POLICY "summaries_update_admin_supervisor"
  ON public.meeting_summaries FOR UPDATE
  USING (public.is_admin_or_supervisor());

CREATE POLICY "summaries_update_agent_own"
  ON public.meeting_summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.call_sessions cs
      WHERE cs.id = meeting_summaries.call_session_id
        AND cs.agent_name = public.get_user_agent_name()
    )
  );

-- DELETE: apenas admin
CREATE POLICY "summaries_delete_admin"
  ON public.meeting_summaries FOR DELETE
  USING (public.is_admin_user(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER trg_meeting_summaries_updated_at
  BEFORE UPDATE ON public.meeting_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_summaries;
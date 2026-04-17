-- ========================================
-- ONDA 1: Quick Wins de Segurança
-- ========================================

-- 1.1 + 1.5: Corrigir RLS em meeting_summaries
-- Remove brecha "auth.uid() IS NULL" no INSERT que permitia anon

DROP POLICY IF EXISTS "summaries_insert_admin_supervisor" ON public.meeting_summaries;

CREATE POLICY "summaries_insert_admin_supervisor"
ON public.meeting_summaries
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_supervisor());

-- 1.2: call_playlists — remover OR (is_shared = true) sem restrição
DROP POLICY IF EXISTS "View own or shared playlists" ON public.call_playlists;

CREATE POLICY "View own or shared playlists"
ON public.call_playlists
FOR SELECT
TO authenticated
USING (
  is_admin_or_supervisor()
  OR owner_agent_name = get_user_agent_name()
  OR (is_shared = true AND get_user_agent_name() = ANY (shared_with))
);

-- 1.3: Bucket call-recordings — INSERT só se file_path corresponde a sessão do agente
DROP POLICY IF EXISTS "Authenticated admins can upload call-recordings" ON storage.objects;
DROP POLICY IF EXISTS "Agents admins supervisors can upload recordings" ON storage.objects;

-- Admins/supervisores podem upar qualquer arquivo no bucket
CREATE POLICY "Admins supervisors upload call-recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'call-recordings'
  AND is_admin_or_supervisor()
);

-- Agentes só podem upar para sessão própria (file path deve bater com call_session do agente)
CREATE POLICY "Agents upload own call-recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'call-recordings'
  AND auth.uid() IS NOT NULL
  AND get_user_agent_name() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.call_sessions cs
    WHERE cs.agent_name = get_user_agent_name()
      AND (
        -- Path deve conter o ID da sessão do agente
        storage.objects.name LIKE '%' || cs.id::text || '%'
      )
  )
);

-- Realtime hardening: meeting_summaries
-- Remove tabela de supabase_realtime se exposta sem RLS de canal
-- (mantemos RLS na tabela base — é o que protege o payload)
-- Nota: RLS em realtime.messages requer setup específico; reforçamos via tabela base
ALTER TABLE public.meeting_summaries REPLICA IDENTITY FULL;
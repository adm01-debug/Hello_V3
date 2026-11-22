-- Fonte unica de verdade para papel de usuario.
--
-- public.user_roles.role (enum app_role) ja governa ~255 policies via
-- is_admin_or_supervisor(). Mas 6 policies e o trigger de hotspot de conflito
-- liam public.user_profiles.role (text), que nada mantinha em sincronia.
--
-- Medido em producao antes deste fix: 1 usuario com user_profiles.role='admin'
-- e nenhuma linha em user_roles -- aparecia como admin na UI, recebia as
-- notificacoes de hotspot, e recebia vazio em toda query protegida por
-- is_admin_or_supervisor().
--
-- Esta migration troca as 6 leituras de user_profiles.role por
-- is_admin_or_supervisor(), que le user_roles, e consolida as duas policies
-- duplicadas de webhook_secrets em uma.

-- 1. Policies de admin: ler user_roles em vez de user_profiles.role
ALTER POLICY "Admins can view RLS audit logs" ON public.rls_audit_logs
  USING (public.is_admin_or_supervisor());

ALTER POLICY "Admins can manage webhook secrets" ON public.webhook_secrets
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

DROP POLICY IF EXISTS "Apenas administradores podem gerenciar segredos" ON public.webhook_secrets;

-- 2. conversations / conversation_messages: troca apenas o ramo de papel,
--    preservando o ramo de dono da conversa e o match por assigned_agent_name.
ALTER POLICY "Users can view their own conversations" ON public.conversations
  USING (
    (SELECT auth.uid()) = id
    OR public.is_admin_or_supervisor()
  );

ALTER POLICY "Users can view messages of their conversations" ON public.conversation_messages
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_messages.conversation_id
        AND c.assigned_agent_name = (
          SELECT up.full_name FROM public.user_profiles up WHERE up.id = (SELECT auth.uid())
        )
    )
    OR public.is_admin_or_supervisor()
  );

-- 3. Trigger de hotspot: notificar por user_roles, nao por user_profiles.role.
--    Antes, se as fontes divergissem, o admin recebia a notificacao e nao
--    conseguia abrir o painel -- pior dos mundos.
CREATE OR REPLACE FUNCTION public.notify_lock_conflict_hotspot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_threshold CONSTANT integer := 10;
  v_window CONSTANT interval := '1 hour';
  v_recent_count integer;
  v_already_notified boolean;
  v_admin record;
BEGIN
  SELECT COUNT(*) INTO v_recent_count
  FROM public.optimistic_lock_conflicts
  WHERE table_name = NEW.table_name
    AND attempted_at > now() - v_window;

  IF v_recent_count <= v_threshold THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE source_type = 'optimistic_lock_hotspot'
      AND source_id = NEW.table_name
      AND created_at > now() - v_window
  ) INTO v_already_notified;

  IF v_already_notified THEN
    RETURN NEW;
  END IF;

  FOR v_admin IN
    SELECT DISTINCT user_id AS id
    FROM public.user_roles
    WHERE role = 'admin'
  LOOP
    BEGIN
      INSERT INTO public.notifications (
        user_id, title, message, type, category, severity,
        action_url, action_label, source_type, source_id, metadata
      ) VALUES (
        v_admin.id,
        'Hotspot de conflito de concorrência',
        'Tabela "' || NEW.table_name || '" registrou ' || v_recent_count ||
          ' conflitos na última hora. Investigue possíveis problemas de UI ou contenção.',
        'warning',
        'system',
        'warning',
        '/concurrency-conflicts',
        'Ver dashboard',
        'optimistic_lock_hotspot',
        NEW.table_name,
        jsonb_build_object(
          'table_name', NEW.table_name,
          'count_last_hour', v_recent_count,
          'threshold', v_threshold,
          'detected_at', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 4. Documenta a fonte de verdade na coluna que permanece como espelho de exibicao.
COMMENT ON COLUMN public.user_profiles.role IS
  'Espelho de exibicao. NAO use para autorizacao: use public.user_roles.role via is_admin_or_supervisor().';
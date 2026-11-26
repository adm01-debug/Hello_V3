-- Etapa 082 (achado A-066): a fila de sincronizacao do CRM nasceu com SELECT e
-- INSERT e nunca recebeu policy de UPDATE.
--
-- Efeito medido no codigo: `src/lib/bitrix/sync-log.ts:29` grava a tentativa com
-- status 'in_progress' e `:50-53`/`:66-68` tentam fecha-la com 'success'/'failed'.
-- Sem policy de UPDATE o update e barrado pela RLS sem erro visivel (0 linhas), e
-- toda sincronizacao com o Bitrix fica "em progresso" para sempre -- inclusive a
-- coluna `updated_at`, que o trigger `update_crm_sync_queue_updated_at` existe
-- para mexer.
--
-- A policy casa com a de INSERT ("Admin supervisor insert crm sync queue",
-- 20260712220353): quem pode enfileirar pode fechar a propria tentativa. A tabela
-- nao tem coluna de autor, entao o criterio e o papel. Declarada TO authenticated
-- e sem FOR ALL, para nao abrir DELETE.
--
-- Reverter: DROP POLICY "Admin supervisor update crm sync queue" ON public.crm_sync_queue;

DROP POLICY IF EXISTS "Admin supervisor update crm sync queue" ON public.crm_sync_queue;
CREATE POLICY "Admin supervisor update crm sync queue"
ON public.crm_sync_queue
FOR UPDATE
TO authenticated
USING (public.is_admin_or_supervisor())
WITH CHECK (public.is_admin_or_supervisor());

-- Etapa 084 (achado A-055): o agente cadastra um lead, nao ve erro nenhum e o
-- lead nao existe nem no Bitrix nem na fila.
--
-- src/hooks/useBitrix.ts insere em public.crm_sync_queue com a sessao do usuario
-- quando a chamada ao Bitrix falha. A unica policy de INSERT da tabela exige
-- public.is_admin_or_supervisor() (20260712220353), entao o agente comum e
-- barrado pela RLS -- e o hook engolia o erro (`return null`), sem toast.
--
-- Aqui a permissao acompanha a autoria: qualquer usuario autenticado enfileira a
-- PROPRIA acao (requested_by = auth.uid()) e le a propria linha. As policies de
-- admin/supervisor continuam valendo (policies sao somadas com OR), e anon
-- nenhuma.
--
-- Aditiva e idempotente: coluna com DEFAULT auth.uid(), sem NOT NULL (o
-- service_role das edges pode enfileirar sem autor humano).

ALTER TABLE public.crm_sync_queue
  ADD COLUMN IF NOT EXISTS requested_by uuid DEFAULT auth.uid();

COMMENT ON COLUMN public.crm_sync_queue.requested_by IS
  'Autor do item da fila. DEFAULT auth.uid(): quem insere pela sessao fica amarrado automaticamente (etapa 084). NULL quando a origem e service_role/cron.';

CREATE INDEX IF NOT EXISTS idx_crm_sync_queue_requested_by
  ON public.crm_sync_queue (requested_by);

DROP POLICY IF EXISTS "Agente enfileira a propria acao" ON public.crm_sync_queue;
CREATE POLICY "Agente enfileira a propria acao" ON public.crm_sync_queue
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

DROP POLICY IF EXISTS "Agente le a propria acao" ON public.crm_sync_queue;
CREATE POLICY "Agente le a propria acao" ON public.crm_sync_queue
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

-- A fila e consumida pela edge com service_role; o service_role nao precisa de
-- policy (BYPASSRLS) e nada aqui muda o caminho do cron.
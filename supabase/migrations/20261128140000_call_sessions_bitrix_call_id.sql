-- Etapa 081 (achado A-077): a ponte que da nome ao produto ("Bitrix Call Connect").
-- registerCall/finishCall existiam em src/hooks/useBitrix.ts e a edge mapeava
-- telephony.externalcall.register/finish, mas nenhum caminho do app os chamava:
-- nenhuma ligacao aparecia no CRM do cliente.
--
-- O CALL_ID que o Bitrix devolve no register e o que identifica a chamada no
-- finish. Sem coluna para guarda-lo o id se perde entre o atendimento e o
-- desfecho, e o finish nao casa com nada. call_sessions nao tinha essa coluna.
--
-- Aditiva e idempotente; sem policy nova: a escrita usa o mesmo UPDATE de
-- call_sessions que o encerramento (etapa 059) ja faz pela sessao do agente.

ALTER TABLE public.call_sessions
  ADD COLUMN IF NOT EXISTS bitrix_call_id text;

COMMENT ON COLUMN public.call_sessions.bitrix_call_id IS
  'CALL_ID devolvido por telephony.externalcall.register no Bitrix24; usado no telephony.externalcall.finish. NULL = chamada nao registrada no CRM (Bitrix fora do ar ou canal sem numero) - etapa 081.';
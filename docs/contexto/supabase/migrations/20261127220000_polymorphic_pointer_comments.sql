-- Etapa 129 — contrato dos ponteiros polimorficos documentado no proprio banco.
--
-- Medido em producao (run 45865868536, sonda probe_129_polymorphic_rls_test.sql):
--   audit_logs.resource_type ......... contacts 107, SYSTEM 100, user_profiles 78, agents 20,
--                                      contact 8, user_roles 6, consent_record 3, webhook 3,
--                                      edge_function 3, call_recordings 3, api_endpoint 2,
--                                      voip_trunks 2, system 2, call_transcription 1, call_analysis 1
--   notifications.source_type ........ cron_health 16, optimistic_lock_hotspot 3, idle_index_hotspot 1
--   optimistic_lock_conflicts.table_name ... deals 4, contacts 3
-- Nenhuma das seis colunas tinha COMMENT (col_description = null).
--
-- Esta migration NAO cria CHECK: o conjunto medido tem grafias conviventes (contacts x contact,
-- SYSTEM x system) e normalizar antes de restringir e a etapa 139. Aqui so se documenta o mapa
-- tipo -> tabela, que hoje vive apenas no codigo que escreve.

COMMENT ON COLUMN public.audit_logs.resource_type IS
  'Tipo do recurso auditado: ou o nome da tabela de destino de resource_id, ou um marcador sintetico sem tabela. Valores medidos em producao em 2026-11-27: contacts (tabela public.contacts), contact (grafia antiga da MESMA tabela), user_profiles, agents, user_roles, consent_record (tabela public.consent_records), call_recordings, voip_trunks, call_transcription (tabela public.call_transcriptions), call_analysis (tabela public.call_analyses), webhook, edge_function, api_endpoint, system e SYSTEM (evento de sistema, sem tabela de destino). Mapa completo em docs/agentes/banco.md. CHECK previsto na etapa 139.'

COMMENT ON COLUMN public.audit_logs.resource_id IS
  'Id em texto da linha indicada por resource_type (nao ha FK: o tipo escolhe a tabela). NULL ou vazio nos tipos sinteticos (system/SYSTEM, edge_function, api_endpoint). A funcao public.log_audit_event(text,text,text,jsonb) grava o valor cru recebido; nenhuma validacao de existencia e feita aqui.'

COMMENT ON COLUMN public.notifications.source_type IS
  'Origem da notificacao. NAO e nome de tabela: e um marcador sintetico do produtor. Valores medidos em producao em 2026-11-27: cron_health (job monitorado), optimistic_lock_hotspot (tabela com conflito de versao), idle_index_hotspot (indice sem uso). CHECK previsto na etapa 139.'

COMMENT ON COLUMN public.notifications.source_id IS
  'Identificador do objeto de origem; o significado depende de source_type: cron_health -> nome do job, optimistic_lock_hotspot -> tabela com conflito, idle_index_hotspot -> nome do indice. Sem FK de proposito.'

COMMENT ON COLUMN public.optimistic_lock_conflicts.table_name IS
  'Tabela em que o conflito de versao aconteceu. Valores medidos em producao em 2026-11-27: deals, contacts.'

COMMENT ON COLUMN public.optimistic_lock_conflicts.record_id IS
  'PK, em texto, da linha de optimistic_lock_conflicts.table_name que sofreu o conflito. Sem FK: a tabela e escolhida por table_name.'

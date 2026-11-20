-- fix: data-lake-flush-daily falhava 100% (03:00 UTC) porque exportava call_summaries,
-- mas o CHECK da tabela data_lake_exports nao permitia esse dataset (constraint
-- data_lake_exports_dataset_check so aceitava call_sessions/deals/contacts/audit_logs).
-- O insert do job estourava a constraint -> edge retornava 500 -> cron marcava falha.
-- call_summaries e tabela real (8 edges usam). Adiciona o valor ao CHECK alterando a
-- constraint (DROP+ADD em bloco unico para nao deixar intervalo sem constraint).
ALTER TABLE public.data_lake_exports
  DROP CONSTRAINT data_lake_exports_dataset_check,
  ADD CONSTRAINT data_lake_exports_dataset_check
    CHECK (dataset IN ('call_sessions','deals','contacts','audit_logs','call_summaries'));
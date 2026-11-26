# Vault (somente nomes — valores nunca são exportados)

| nome | descrição | criado em |
|---|---|---|
| auto_scorecard_token | Bearer usado pelo trigger_auto_scorecard ao chamar a edge auto-scorecard | 2026-11-26 00:15:15.447994+00:00 |
| cleanup_lock_conflicts_cron_token | Token do cron semanal de purga de optimistic_lock_conflicts (>90 dias) | 2026-11-22 02:39:26.437636+00:00 |
| cleanup_recordings_cron_token | Token do cron diario de retencao de gravacoes (180 dias) | 2026-11-22 15:59:17.618880+00:00 |
| coaching_cron_token | Token do cron de coaching (D4) | 2026-11-22 00:52:23.452551+00:00 |
| crm_sync_cron_token | Token do job de 5 min que processa public.crm_sync_queue pela edge sync-crm-queue | 2026-11-26 21:46:00.832533+00:00 |
| data_lake_cron_token | Token do cron diario do data-lake-flush (03:00 UTC) | 2026-11-22 16:58:44.649607+00:00 |
| dialer_cron_token | Token do cron do discador preditivo | 2026-11-22 00:52:23.452551+00:00 |
| edge_functions_base_url | Base das edge functions, usada por public.edge_function_url(slug) | 2026-11-26 00:15:15.447994+00:00 |
| optimistic_lock_dblink_dsn | Role de privilegio minimo usado pelo trigger enforce_optimistic_lock via dblink | 2026-11-22 02:36:16.535732+00:00 |

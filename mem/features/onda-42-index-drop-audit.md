---
name: Onda 42 - Auditoria de DROP INDEX + Reset trimestral de stats
description: index_drop_audit registra cópias de comandos DROP INDEX por admin via RPC log_index_drop_copy. Cron trimestral quarterly-reset-index-stats zera pg_stat_user_indexes do schema public para reavaliar índices ociosos.
type: feature
---

Tabela `public.index_drop_audit` (admin-only via RLS + is_admin). Escrita exclusiva pela RPC `log_index_drop_copy(p_index_name, p_table_name)` SECURITY DEFINER. UI em `/admin/database-health` chama a RPC best-effort ao copiar o SQL e exibe card com últimas 20 ações. Cron `quarterly-reset-index-stats` (0 6 1 1,4,7,10 *) executa `reset_public_index_stats()` — zera estatísticas de todos os índices em `public` para reavaliar ociosos com baseline limpo por trimestre.

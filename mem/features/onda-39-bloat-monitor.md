---
name: Onda 39 - Bloat Monitor Semanal
description: check_table_bloat() + notify_bloat_hotspots() rodando via pg_cron dom 05:00 UTC. Threshold dead>10k e ratio>20%. Debounce 7d por tabela.
type: feature
---

Duas funções SECURITY DEFINER + cron semanal `weekly-bloat-monitor` (dom 05:00 UTC, após vacuum-analyze 04:30). `notify_bloat_hotspots` insere `notifications` com `source_type='table_bloat_hotspot'`, action_url `/admin/database-health`. Anti-spam via lookup em `notifications` últimos 7d por `source_id=table_name`.

---
name: Onda 41 - Idle Index Monitor
description: check_idle_indexes() lista índices idx_scan=0 e >1MB (exclui PK/unique). notify_idle_indexes() avisa admins com debounce 30d. Cron domingo 05:30 UTC.
type: feature
---

Duas funções SECURITY DEFINER + cron `weekly-idle-index-monitor` (dom 05:30 UTC, após bloat monitor 05:00). Notificação `source_type='idle_index_hotspot'`, action_url `/admin/database-health`. Debounce 30 dias por `indexrelname`.

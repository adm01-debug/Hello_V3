---
name: Onda 40 - Database Health Dashboard
description: Painel admin /admin/database-health consumindo get_database_health_snapshot() (bloat, top tabelas, atividade) e get_top_slow_queries() (pg_stat_statements). Ambas admin-only via is_admin().
type: feature
---

RPCs SECURITY DEFINER `get_database_health_snapshot()` e `get_top_slow_queries(int)` no schema public, com guard `is_admin()`. Página lazy-loaded em `src/pages/admin/DatabaseHealth.tsx`, rota `/admin/database-health` restrita a admin. Auto-refresh a cada 60s.

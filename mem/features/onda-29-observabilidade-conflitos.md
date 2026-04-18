---
name: Onda 29 - Observabilidade de Conflitos
description: Painel admin de conflitos de optimistic locking + edge function de retenção 90d
type: feature
---

Painel `/concurrency-conflicts` (admin/supervisor) lê `optimistic_lock_conflicts` com KPIs, timeline (recharts), top 5 tabelas/usuários e tabela recente. Filtros por período (24h/7d/30d) e tabela. Hook `useOptimisticLockConflicts` (React Query, staleTime 5min).

Edge function `cleanup-lock-conflicts` (admin only, JWT obrigatório) executa `DELETE WHERE attempted_at < now() - 90 days`, retorna `{ deleted_count, oldest_remaining, cutoff }`. Cron-ready via `pg_cron`. Smoke test Deno valida 401 sem auth e preflight CORS. ADR-043.

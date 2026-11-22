# ADR-043 — Onda 29: Observabilidade de Conflitos + Retenção Automática

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Onda 28 entregou auditoria de conflitos de optimistic locking via tabela `optimistic_lock_conflicts`. Faltava interface de visualização e política de retenção.

## Decisão

1. **Painel admin/supervisor** em `/concurrency-conflicts`:
   - KPIs: total, tabelas afetadas, usuários envolvidos
   - Timeline (recharts) com agrupamento diário
   - Top 5 tabelas e top 5 usuários
   - Tabela de conflitos recentes (50 últimos)
   - Filtros: período (24h/7d/30d) e tabela
   - Hook `useOptimisticLockConflicts` (React Query, staleTime 5min)
   - RLS já existente (`is_admin_or_supervisor()`) garante o controle de acesso

2. **Edge function `cleanup-lock-conflicts`** (TTL 90 dias):
   - Validação JWT obrigatória + verificação `role = 'admin'`
   - `DELETE FROM optimistic_lock_conflicts WHERE attempted_at < now() - interval '90 days'`
   - Retorna `{ deleted_count, oldest_remaining, cutoff }`
   - Cron-ready (pode ser agendada via `pg_cron` posteriormente)
   - Smoke test Deno (401 sem auth + preflight CORS)

## Correção (22/11)

Esta onda construiu painel, hook e edge de limpeza sobre `optimistic_lock_conflicts`,
mas a tabela **nunca recebeu uma linha**: o trigger `enforce_optimistic_lock` fazia o
`INSERT` do conflito e o `RAISE EXCEPTION` na mesma transação, então o próprio
Postgres desfazia o registro. Painel e badge ficavam permanentemente vazios.
Corrigido em `supabase/migrations/20261122210000_optimistic_lock_audit_survives_rollback.sql`
(registro do conflito por conexão separada, sobrevive ao rollback). Também foi
agendada a purga de 90 dias que esta ADR descrevia como cron-ready:
`20261122220000_lock_conflicts_retention_cron.sql`.

## Consequências

- ✅ Hotspots de concorrência visíveis em produção
- ✅ Auditoria com retenção controlada (sem inflação ilimitada)
- ✅ Zero novas tabelas (apenas leitura/cleanup)
- ✅ Reversível (DROP FUNCTION cleanup-lock-conflicts)
- ⚠️ Cron job ainda manual — agendamento via `pg_cron` fica para Onda futura se necessário

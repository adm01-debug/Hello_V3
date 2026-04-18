
Sistema em **10/10 sustentado** após Ondas 23–28. Cobertura total de locking (7 entidades), auditoria de conflitos, RLS hardening, HIBP, coverage gate. Próxima evolução defensiva incremental:

## Onda 29 — Observabilidade de Conflitos + Retenção Automática

### 1. Painel admin de conflitos de concorrência
- `src/pages/ConcurrencyConflicts.tsx` (admin/supervisor only) lendo `optimistic_lock_conflicts`
- KPIs: total 24h, top 5 tabelas, top 5 usuários, gráfico timeline 7d (recharts)
- Filtros por `table_name` e período (24h/7d/30d)
- Hook `useOptimisticLockConflicts` (React Query, staleTime 5min)
- Rota `/concurrency-conflicts` protegida por `is_admin_or_supervisor()`
- Link no menu admin

### 2. Job de retenção automática (TTL 90d)
- Edge function `cleanup-lock-conflicts` (cron-ready) — `DELETE FROM optimistic_lock_conflicts WHERE attempted_at < now() - interval '90 days'`
- Validação JWT + `is_admin_user()` para invocação manual
- Retorna `{ deleted_count, oldest_remaining }`
- Teste Deno (1 cenário smoke)

### 3. ADR-043 + memória de fechamento
- `docs/adr/043-onda-29-observabilidade-conflitos.md`
- `mem/features/onda-29-observabilidade-conflitos.md`
- Atualizar `mem/index.md`

## Considerações
- Zero novas tabelas — apenas leitura/cleanup da existente
- Admin/supervisor only via RLS já vigente
- ≤400 linhas, PT-BR, sonner, logger central, cyberpunk
- Edge function reversível (DROP FUNCTION)

## Ordem de execução
1. Hook `useOptimisticLockConflicts` + página + rota + link menu
2. Edge function `cleanup-lock-conflicts` + teste Deno
3. ADR-043 + memória + índice
4. Validação: `tsc --noEmit` + linter Supabase

Resultado: **10/10 sustentado** com observabilidade visual de hotspots de concorrência e retenção controlada da trilha de auditoria.

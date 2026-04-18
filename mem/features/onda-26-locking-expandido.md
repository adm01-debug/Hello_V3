---
name: Onda 26 — Locking Expandido + Teste de Conflito
description: Optimistic locking aplicado a agents, cadences e playbooks reaproveitando enforce_optimistic_lock(). Teste defensivo de OPTIMISTIC_LOCK_CONFLICT em useDeals.
type: feature
---

## Locking expandido (5 entidades agora cobertas)
- `deals`, `contacts` (Onda 24)
- `agents`, `cadences`, `playbooks` (Onda 26 — esta)
- Reaproveitam `public.enforce_optimistic_lock()` SECURITY DEFINER

## Teste defensivo
- `src/hooks/__tests__/useDeals.conflict.test.ts`: mock retorna `OPTIMISTIC_LOCK_CONFLICT`
  → valida toast PT-BR + refetch automático.
- Protege regressões futuras no tratamento de conflito.

## Para expandir a novas tabelas
```sql
ALTER TABLE public.X ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE TRIGGER X_optimistic_lock BEFORE UPDATE ON public.X
  FOR EACH ROW EXECUTE FUNCTION public.enforce_optimistic_lock();
```

## ADR
docs/adr/040-onda-26-locking-expandido.md

# ADR-040 — Onda 26: Optimistic Locking expandido + Testes defensivos

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Consolidação operacional pós-10/10 (Ondas 23–25).

## Decisão

### 1. Locking expandido para 3 entidades adicionais
Reaproveita `public.enforce_optimistic_lock()` (criada na Onda 24) em:

| Tabela     | Justificativa                                              |
|------------|------------------------------------------------------------|
| `agents`   | Edição concorrente por admin + supervisor                  |
| `cadences` | Sequências editadas por times de vendas em paralelo        |
| `playbooks`| Scripts editados por times de enablement                   |

Cada tabela ganhou `version INTEGER NOT NULL DEFAULT 1` + trigger
`BEFORE UPDATE`. Comportamento idêntico ao de `deals`/`contacts`:
mismatch → `RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'`.

**Cobertura final:** 5 entidades críticas com locking otimista.

### 2. Teste defensivo de conflito
`src/hooks/__tests__/useDeals.conflict.test.ts` valida o fluxo completo:
mock retorna erro `OPTIMISTIC_LOCK_CONFLICT` → hook exibe toast PT-BR
e dispara refetch automático. Garante que regressões futuras no
tratamento de conflito quebrem o build.

## Consequências

- ✅ 5 tabelas críticas protegidas contra last-write-wins.
- ✅ Padrão SQL reaproveitável: novas tabelas só precisam de `version` + trigger.
- ✅ Teste de regressão protege fluxo de UX em conflito.
- ⚠️ Hooks de `agents`/`cadences`/`playbooks` ainda usam fluxo legado;
  expandir tratamento conforme demanda real de conflito.

## Rollback
```sql
DROP TRIGGER agents_optimistic_lock ON public.agents;
DROP TRIGGER cadences_optimistic_lock ON public.cadences;
DROP TRIGGER playbooks_optimistic_lock ON public.playbooks;
ALTER TABLE public.agents DROP COLUMN version;
ALTER TABLE public.cadences DROP COLUMN version;
ALTER TABLE public.playbooks DROP COLUMN version;
```

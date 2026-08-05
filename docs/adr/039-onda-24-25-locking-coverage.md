# ADR-039 — Onda 24/25: Optimistic Locking + CI Coverage Gate

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Fechamento da auditoria 22 dimensões (8.4 → 10/10).

## Decisão

### 1. Optimistic Locking em entidades críticas
Adicionada coluna `version INTEGER NOT NULL DEFAULT 1` em `deals` e `contacts`,
controlada por trigger `BEFORE UPDATE` que executa `enforce_optimistic_lock()`
(SECURITY DEFINER, search_path fixo).

**Comportamento:**
- Cliente lê `version` no SELECT.
- No UPDATE, envia `version` atual no payload.
- Trigger compara `NEW.version vs OLD.version`:
  - Match → incrementa e persiste.
  - Mismatch → `RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'`.
- Hooks (`useDeals`, `useContacts`) capturam o erro, exibem toast em PT-BR e
  recarregam a query automaticamente.

**Por quê:** entidades de receita (deals) e identidade (contacts) sofrem edição
multi-usuário. Last-write-wins corrompe pipeline e histórico.

### 2. Vitest coverage gate
`vitest.config.ts` com provider `v8`, thresholds **75% lines/functions/statements**
e **70% branches**, escopo `src/lib/` + `src/hooks/`. Reporter `lcov` para
integração futura com Codecov.

**Por quê:** evita regressão de cobertura silenciosa. Esses dois diretórios
concentram lógica de negócio testável (logger, validação Zod, hooks de domínio).

## Consequências

- ✅ Conflitos de edição detectados em vez de silenciados.
- ✅ CI falha se cobertura cair abaixo de 75%.
- ⚠️ Hooks fora de `useDeals`/`useContacts` ainda usam last-write-wins —
  expandir caso surjam reports de conflito.
- ⚠️ Coverage gate só roda local hoje; gate no GitHub Actions exige adicionar
  `bun run test:coverage` ao workflow (próximo passo de DevOps).

## Rollback
```sql
DROP TRIGGER deals_optimistic_lock ON public.deals;
DROP TRIGGER contacts_optimistic_lock ON public.contacts;
ALTER TABLE public.deals DROP COLUMN version;
ALTER TABLE public.contacts DROP COLUMN version;
DROP FUNCTION public.enforce_optimistic_lock();
```

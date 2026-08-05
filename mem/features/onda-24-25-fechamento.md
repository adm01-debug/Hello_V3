---
name: Onda 24/25 — Optimistic Locking + Coverage Gate
description: Locking otimista em deals/contacts via trigger enforce_optimistic_lock + Vitest coverage threshold 75% em src/lib e src/hooks. Fecha auditoria em 10/10.
type: feature
---

## Optimistic Locking
- Tabelas: `deals`, `contacts` ganharam coluna `version INTEGER NOT NULL DEFAULT 1`.
- Trigger `BEFORE UPDATE` chama `enforce_optimistic_lock()` (SECURITY DEFINER).
- Erro `OPTIMISTIC_LOCK_CONFLICT` → hooks tratam com toast PT-BR + refetch.
- Hooks atualizados: `useDeals.updateDeal`, `useContacts.updateContact`.

## Coverage Gate
- `vitest.config.ts`: provider v8, thresholds 75% (branches 70%).
- Escopo: `src/lib/**`, `src/hooks/**`.
- Reporter: text, html, lcov.
- Dependência adicionada: `@vitest/coverage-v8`.

## Como rodar
- Local: `bunx vitest run --coverage`
- CI: adicionar step `bun run test:coverage` ao `.github/workflows/ci.yml` quando script existir no package.json.

## ADR
docs/adr/039-onda-24-25-locking-coverage.md

---
name: testing-infrastructure
description: Infraestrutura de testes Vitest/JSDOM + Playwright. Onda 38 (2026-04-18) corrigiu 4 bugs reais em produção (rankSignals, matchesKeywords, dedupeSignals, logger.ts) — 1.862/1.862 verdes.
type: feature
---

Infraestrutura de testes composta por **1.862 cenários automatizados** (Vitest/JSDOM, 76 arquivos) e 22 testes E2E (Playwright).

## Marcos
- **Onda 37 (PBT/Fuzz)**: Adicionou fast-check com 5.000+ runs aleatórios validando invariantes em `health-score.ts`, `phone-normalization.ts`, CSV export, schemas Zod e validate.ts.
- **Onda 38 (Auditoria pré-produção)**: Detectou e corrigiu **4 bugs reais em código de produção**:
  1. `rankSignals` em `agent-assist-utils.ts` — prioridade de intent passou a dominar (priority × 1000 + confidence) para garantir que compliance/churn nunca sejam suprimidos por confiança alta de intent secundário.
  2. `matchesKeywords` — keywords compostas agora tokenizam por espaço e exigem todas as palavras (ordem livre).
  3. `dedupeSignals` — `Map<key, T[]>` em vez de `Map<key, T>` preserva sinais separados por mais que a janela.
  4. `logger.ts` — refatorado de 160 → 87 linhas (limite arquitetural 150).

## Comandos
- `npx vitest run` — suíte completa (~33s)
- `npx vitest run src/hooks` — apenas hooks (971 testes)
- `npx tsc --noEmit` — type-check
- `npx playwright test` — E2E

## Convenções
- Mock de Supabase: implementar `.then` no builder para suportar chains dinâmicas (`.select().eq().order().eq()`).
- Mutations com `traceHeaders()`: usar `expect.objectContaining({ body: {...} })` em vez de `toHaveBeenCalledWith` estrito.
- `QueryClient` deve ser hoistado para fora do wrapper (criar uma vez por teste).
- `mockResolvedValue` em `beforeEach` quando vitest config tem `mockReset: true`.

Ver `docs/qa/onda-38-auditoria-producao.md` para o relatório completo da última auditoria.

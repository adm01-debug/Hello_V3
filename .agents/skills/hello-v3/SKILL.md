---
name: hello-v3
description: Convenções de código e commit do Hello V3 / Bitrix Call Connect (TypeScript, Conventional Commits, safe-number). Use ao alterar código, criar testes ou escrever mensagem de commit neste repositório; as regras operacionais ficam em AGENTS.md.
---

# Hello V3 — convenções

As regras de trabalho (banco, fluxo Git, PR, comunicação) estão em `AGENTS.md` na raiz — este skill só
resume convenções de código e commit. Referência longa em `docs/agentes/`.

## Commits

Padrão Conventional Commits: `<tipo>(<escopo>): <descrição>` — escopo opcional e minúsculo; assunto com pelo
menos 10 caracteres, sem ponto final; tipos: `feat fix docs style refactor perf test build ci chore security
revert`. Mensagem em PT-BR, modo imperativo, primeira linha curta. **Não há hook `commit-msg` nem husky neste
repo** — o padrão é cobrado por revisão, não por máquina.

Exemplo: `fix(voip): liga setCallDbSession no fluxo de chamada`

## Código

- Linguagem: TypeScript (front Vite + React 18 em `src/`, edge functions Deno em `supabase/functions/`).
- Funções `camelCase`, componentes/classes `PascalCase`, constantes `SCREAMING_SNAKE_CASE`.
- **Exports nomeados** (o repo usa `export function`/`export const`; `export default` é exceção).
  Alias de import: `@/` → `src/`. Siga o padrão de import do arquivo vizinho.
- **Proibido `parseInt`, `parseFloat`, `Number.parseInt`, `Number.parseFloat`** — use `safeParseInt`,
  `safeParseFloat` ou `safeToFixed` de `@/lib/safe-number`. Cobrado por `eslint.config.js:31-41` (severidade
  `error`) e pelo guard `scripts/codemod-safe-number.mjs --check`, que é o **primeiro passo do CI**: uma
  ocorrência derruba o pipeline inteiro.
- Em edge function, número de input externo passa por schema Zod com `.finite()`; `Number(` cru é a violação
  R2 de `scripts/guard-edge-numeric.mjs`.
- Log: `logger` de `@/lib/logger` (tem request id). `console.log` é warning no ESLint; só `console.warn` e
  `console.error` são permitidos.
- `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts` e
  `src/integrations/lovable/index.ts` são **gerados** — não editar à mão.
- Testes unitários ao lado do módulo em `__tests__/`; E2E em `tests/e2e/` (único diretório que o Playwright
  alcança — `e2e/` na raiz está órfão). Rode só o que tocou: `npx vitest run <caminho>`.
- Siga os padrões já existentes no módulo; não desvie sem motivo registrado na PR.

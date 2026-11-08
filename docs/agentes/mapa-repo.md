# Mapa do repositório — referência para agentes

Ler quando precisar saber onde fica algo antes de buscar por texto.

## Onde olhar primeiro

| Precisa de | Leia |
|---|---|
| **O que está quebrado, com evidência `arquivo:linha`** | **`ESTADO_ATUAL.md`** — auditoria de 2026-08-16 sobre 1.412 arquivos, com auto-auditoria dos próprios erros (§5c). É a fonte de estado deste repo |
| Tabela de evidência por dimensão (rotas, hooks, componentes, edges, migrations, libs) | `docs/estado/` (18 arquivos) — **pistas com endereço, não fatos verificados duas vezes**; não passaram por revisão adversarial |
| Pendências com status honesto (🔴/🟡/🟢/⚪/⛔) | `docs/audits/pendencias-2026-07.md` — o documento mais confiável do repositório |
| Auditoria de backend de origem | `docs/audits/2026-07-12-backend-audit.md` |
| Banco, CI, Lovable, edges, telefonia | `AGENTS.md` + `docs/agentes/*.md` (esta pasta) |
| Intenção de arquitetura (histórico) | `docs/adr/` — 52 ADRs, **todos** "Aceito"; ADR-045 não existe (lacuna 044→046) e há **dois** ADR-012. Use como intenção, nunca como estado |
| Memória de feature por onda | `mem/` (44 arquivos), `.lovable/memory/` (4) |
| Plano da onda corrente | `.lovable/plan.md` — intenção do Lovable, não estado |
| Lista de funcionalidades | `SYSTEM_FEATURES.md` — datado 2026-03-15, **185 itens todos marcados `[x]`**. Histórico, **não** estado |
| Runbook de incidente | `docs/runbooks/incident-response.md` |
| Comparativo de mercado / escopo planejado | `docs/analises/comparativo-3cx.md`, `docs/estado/funcionalidades-planejadas.md` |

**Não existe grafo de código gerado neste repo** (sem `graphify`, sem `graph.json`). O índice antes do grep é
`ESTADO_ATUAL.md` + `docs/estado/`.

## Mapa rápido

| Onde | O que tem |
|---|---|
| `src/` | front Vite + React 18 + TS: `components/` (343 arquivos, 57 shadcn/ui), `hooks/` (343 arquivos; subpastas `auth/`, `telemetry/`, `predictive-dialer/`, o resto flat), `pages/` (130), `lib/` (157), `routes/` (`protectedRoutes.tsx` 94 rotas + `publicRoutes.tsx` 11), `contexts/`, `integrations/`, `data/`, `test/` (setup do Vitest), `__tests__/rls/` |
| `src/integrations/` | `supabase/client.ts` + `supabase/types.ts` (**gerados** — "Do not edit it directly") e `lovable/index.ts` (**auto-gerado** pelo Lovable) |
| `src/lib/security/` | 17 módulos (CSP, HSTS, rate-limiter, XSS, CSRF, JWT…) importados **somente** pelo barrel `index.ts`, que **não tem nenhum importador**. Existem, são testados e nenhum caminho de execução chega neles |
| `supabase/functions/` | 98 diretórios (94 com `index.ts`) + `_shared/` — detalhe em `docs/agentes/edge-functions.md` |
| `supabase/migrations/` | 207 arquivos `.sql` — detalhe em `docs/agentes/banco.md` |
| `supabase/config.toml` | 4 linhas: `project_id` + um único `verify_jwt` |
| `supabase/.temp/` | **8 arquivos versionados** com `project-ref`, `organization_id`, **`pooler-url`** (host, porta e usuário do pooler) e versões exatas de GoTrue/Postgres/Storage/REST. Fingerprinting; não acrescente nada aqui |
| `tests/e2e/` | **os únicos specs que um runner alcança** (`playwright.config.ts:4`): `auth`, `workflow`, `performance`, `webhook-audit-ndjson`, + `helpers/adminSession.ts` |
| `e2e/` | 7 specs (`calls`, `dashboard`, `extensions-management`, `login`, `observability`, `security-lockout`, `sip-flow`, 330 linhas) **sem runner nenhum** — `testDir` não aponta para cá |
| `scripts/` | 19 arquivos flat. **Só 2 são usados** (o CI chama `codemod-safe-number.mjs` e `guard-edge-numeric.mjs`); os outros 17 são órfãos e 7 carregam JWT `service_role` de produção |
| `scripts/ci/` | guardas do CI mantidos à mão: `check-claude-md-integrity.mjs` (vigia `AGENTS.md` + `docs/agentes/`) |
| `coverage/` + `covout/` | **466 arquivos versionados** (23% dos 2.016 rastreados) — saída de build do Istanbul/v8, com o código-fonte duplicado dentro de HTML. Ruído em todo `git grep`: ao buscar por texto, exclua as duas pastas |
| `public/locales/en/common.json` | 10 strings. `i18n.json` declara `en`/`pt-BR`/`es` e **nada lê nenhum dos dois**; não há biblioteca de i18n no `package.json` e a interface é hardcoded em português |

## Automações

Automação nova vive em `scripts/<nome>/`, um subdiretório por automação, cada um com `README.md` dizendo o
que faz, como rodar e que secrets usa. Nunca em `supabase/` (o CLI do Supabase é dono do diretório) nem em
`src/` (entra no bundle). Os 19 arquivos flat em `scripts/` são legado — não siga esse padrão e **leia o
README da automação antes de alterar**.

## Comandos

O CI usa **bun** (`bun install`), mas há **três lockfiles** (`bun.lock`, `bun.lockb`, `package-lock.json`),
dois gerenciadores e dois registries — detalhe em `docs/agentes/lovable-deploy.md`. `npm ci` funciona e
instala mais pacotes que `bun install` em ambiente sem credencial da Lovable.

- type-check: `bun run type-check` (`tsc --noEmit`). **Cobre só `src/`** (`tsconfig.json:26`,
  `"include": ["src"]`): `e2e/`, `tests/`, `scripts/` e os `*.config.ts` ficam de fora.
  `tsconfig.app.json` e `tsconfig.node.json` existem e **não são referenciados** — configs órfãs.
- lint dos arquivos tocados: `npx eslint <arquivos>`. **Ignora `supabase/**`** (as 98 edges nunca são
  lintadas) e o glob `**/*.{ts,tsx}` não cobre `scripts/*.mjs`.
- testes unitários só do que tocou: `npx vitest run <caminho>`; suíte inteira `npx vitest run`.
  Cobertura mede **só `src/lib/**` e `src/hooks/**`** (`vitest.config.ts:21`) com thresholds 75/75/70/75 —
  os 473 arquivos de `components/` + `pages/` ficam fora da métrica.
- E2E: `bunx playwright test`. **Hoje não sobe:** `playwright.config.ts:11,23` espera `localhost:5173` e
  `vite.config.ts:14` serve em **8080**.
- edges: `deno test -A supabase/functions/` (sem `deno.json`, imports resolvem por URL remota).
- guards do CI antes da PR: `node scripts/codemod-safe-number.mjs --check`,
  `node scripts/guard-edge-numeric.mjs --check`, `node scripts/ci/check-claude-md-integrity.mjs`.
- dev server: `bun run dev` → `http://localhost:8080`. **Aponta para o banco de produção**
  (`src/integrations/supabase/client.ts` não tem desvio local) — confira antes de testar tela.
- **Não há husky nem hook de git neste repo**: nada roda automaticamente antes do commit.

## Qualidade dos testes — o que não protege

- **29 de 268 arquivos de teste (11%) não importam nada do projeto** — reimplementam a lógica e asseveram
  sobre a própria cópia. Os piores pela promessa que fazem: `useSecurityHardening.test.ts` (863 linhas,
  importa só `vitest`, declara validar RLS/HSTS/escalonamento), os 7 de `src/__tests__/rls/` (verificam que
  uma matriz literal contém os próprios valores) e `useMFA.test.ts` (testa reimplementação com
  `Math.random()` enquanto o código real usa `crypto.getRandomValues`, `useMFA.ts:161-170`).
- **Teste verde desses arquivos não é evidência.** Ao mexer em algo que eles cobrem, verifique no código.
- `src/lib/talkRatio.ts` é cópia declarada da lógica de `supabase/functions/analyze-talk-ratio/index.ts:36-102`
  com **0 consumidores em produção**: o teste valida a cópia, não o deployado. Divergência entre as duas é
  silenciosa.

## O que está sólido (para não reescrever sem motivo)

- **Tipagem:** `tsc --noEmit` passa com **0 erros** em ≈165 mil linhas, sem `any` disseminado.
- **Suíte:** 3.272 de 3.276 testes passam; 233 dos 268 arquivos exercitam o alvo real, com testes de
  propriedade (`fast-check`) e fuzz.
- **RLS/RBAC:** 714 policies sobre 162 tabelas; só 2 tabelas sem RLS, de controle interno
  (`schema_migrations`, `migration_rollbacks`). Tabela de papéis separada, 22 rotas admin-only e 25
  supervisor+admin, com guarda declarativa.
- **Concorrência:** locking otimista implementado e coberto por testes defensivos reais.
- **Roteamento:** 100% lazy-loaded com code splitting; 103 de 129 páginas roteadas, 1 órfã real.
- Os 4 testes vermelhos conhecidos estão em `src/hooks/__tests__/useSessionManager.coverage.test.tsx`
  (reproduzível em isolamento — **não é flaky**).

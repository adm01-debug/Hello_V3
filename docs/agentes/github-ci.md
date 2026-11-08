# GitHub (perímetro, CI, workflows) — referência para agentes

Ler quando mexer em settings do repo, `.github/workflows/`, ou quando um merge ou um workflow falhar de
forma estranha.

## Escrita no GitHub

- Repo `adm01-debug/Hello_V3` (grafia canônica; a API aceita `hello_v3`), branch `main`, **privado**.
- **Escrita: somente MCP `GITHUB - MCP - FOREVER`** (`github_push_files`). O MCP padrão do GitHub retorna
  403 em write. `github_push_files` sobrescreve o arquivo — mande o conteúdo integral com apenas a mudança
  semântica, e confira depois que o arquivo remoto bate com o que você testou. Ele aceita `files` e `delete`
  no mesmo commit (1 commit atômico).
- Commits: `<tipo>(<escopo>): <assunto>` com assunto ≥ 10 caracteres e sem ponto final, em PT-BR, imperativo.
  **Não há hook `commit-msg` nem husky neste repo** — o padrão é cobrado por revisão. `infra` existe só como
  tipo de **branch**; para o commit use `ci:` ou `chore:`.
- Sessão na nuvem: o repo é **privado**, então leitura por `raw.githubusercontent.com` **não** funciona sem
  token, e `git push` volta 403 do proxy quando o repo não está entre as fontes autorizadas da sessão —
  escreva pelo MCP. Para listar PRs abertas com os arquivos que tocam numa chamada só, use `github_graphql`
  (`pullRequests(states:OPEN){ nodes { number files { nodes { path } } } }`):
  `github_list_pull_requests` devolve o repositório inteiro em cada nó e estoura o contexto.
- **A `main` recebe commits de fora dos agentes:** o app do Lovable commita direto como
  `gpt-engineer-app[bot]` ("Lovable update", "Visual edit in Lovable", "Work in progress"). Os três últimos
  commits de `main` em 2026-08 são dele. Re-sync antes de editar; nunca force-push em `main`.

## Perímetro do GitHub — estado canônico

**Regra:** qualquer mudança nos campos abaixo atualiza **esta tabela** no mesmo PR.

| Campo | Estado canônico (medido 2026-11-08) | Como verificar |
|---|---|---|
| Visibilidade | **privado** | `github_get_repo` / `github_graphql` → `isPrivate: true` |
| Branch default | `main` | idem |
| Branch protection em `main` | **nenhuma** — a API responde `404 Branch not protected` | `github_get_branch_protection` |
| Required status checks | **nenhum** | consequência do acima |
| Merge — squash / merge commit / rebase | **todos `true`** | `github_graphql` |
| `allow_auto_merge` | **`false`** | idem |
| `delete_branch_on_merge` | **`false`** — apague a branch à mão depois do merge | idem |
| Environments | nenhum declarado em `.github/workflows/ci.yml` | leitura do workflow |
| Workflows | **1** arquivo: `.github/workflows/ci.yml` (2 jobs: `quality`, `security`) | `ls .github/workflows/` |
| Checks de app externo | **GitHub App do Vercel instalado**: `Vercel Preview Comments` e `Vercel Agent Review` rodam em cada PR (nenhum é required check) | `github_list_check_runs` no head de uma PR |

Fatos do perímetro que importam:

- **Nada no servidor impede merge com CI vermelho.** Sem branch protection e sem required check, o único
  gate é a disciplina do agente. É por isso que a regra "chame o dono" de `AGENTS.md` vale literalmente.
- **`on: push/pull_request branches: [main]`** (`ci.yml:3-7`): push em branch de trabalho **não** dispara
  nada; só PRs *para* `main` e pushes na própria `main`. Não há `workflow_dispatch` — **é impossível rodar o
  CI sob demanda**. Não há filtro `paths:`: quando dispara, dispara inteiro.
- **`.github/SECURITY.md` é herdado e falso** para este projeto (versões "1.x", e-mail `security@hello.app`).
  Não o cite como política vigente.

## CI vermelho — causa exata, não "a suíte está quebrada"

**Estado medido em 2026-11-08 pela API do GitHub:** 244 execuções no total; as **15 mais recentes falharam,
zero sucessos**, de 2026-07-26 a 2026-08-28. O último run é `33167166764` (`main`, commit `7307a87`,
2026-08-28) e **não houve nenhuma execução desde então**.

O pipeline morre no **primeiro guard**, antes de lint, type-check, testes ou build:

```
❌ safe-number codemod: 1 ocorrência(s) em 1 arquivo(s)
  • src/components/voice/overlay/usePhaseColors.ts (1 substituição)
##[error]Process completed with exit code 1.
```

A linha é `src/components/voice/overlay/usePhaseColors.ts:9` — usa `Number.parseFloat` onde
`scripts/codemod-safe-number.mjs` e `eslint.config.js:38-41` exigem `safeParseFloat` de `@/lib/safe-number`.
**Uma linha derruba o pipeline inteiro desde julho** — e por isso os erros de lint e os testes vermelhos
medidos em `ESTADO_ATUAL.md` nunca chegaram a ser executados no CI.

**Segundo modo de falha, observado em 2026-08-16 e aparentemente resolvido:** as execuções `31973391673` e
`31973471456` falharam em segundos com `404` nos logs de **ambos** os jobs — inclusive o `Security audit`,
cujo único passo é `bun audit || true` e que por construção não pode falhar por conteúdo. A assinatura era
de execução que **não chegava a rodar** (limite de minutos do Actions em repo privado, ou aprovação
pendente). **Em 2026-11-08 isso não se repetiu:** o push de uma PR disparou o run `42526433947` e os dois
jobs entraram em execução normalmente. Logo o bloqueio efetivo hoje é só o guard do `usePhaseColors.ts:9`.

## Gate por gate — o que cada um realmente faz

| Gate | `ci.yml` | O que realmente faz | Veredito |
|---|---|---|---|
| Guard `codemod-safe-number --check` | `:31-32` | Hoje **0 ocorrências em `src/`** *se* `usePhaseColors.ts` for corrigido. Furos: `parseInt(x, 16)` sai com exit 0 e mensagem de sucesso **falsa** (`:136-141` + `:207-211` + `:224`); `computeSkipRanges` (`:75-84`) trata apóstrofo de JSX como abertura de string e engole código; escopo fixo em `src/` (`:30`), sem `scripts/`, `tests/`, `e2e/`; `Number(` não é verificado (124 usos em `src/`). Redundante com `eslint.config.js:31-41`. | 🟨 passa com buracos |
| Guard `guard-edge-numeric --check` | `:34-35` | `Number.parseInt`/`Number.parseFloat` estão na **allowlist** (`:41-42`) contradizendo o próprio cabeçalho (`:9-11`) — a regra R2 está desarmada. Só varre arquivos chamados exatamente `index.ts` (`:53`) e **pula `_shared/` inteiro** (`:51`), onde `_shared/validate.ts:24` já viola R2. R1 só casa `z.number()` literal com `.finite(` imediato (`:118-122`). 27 supressões `// safe-numeric-ok` ativas. | 🟨 regra furada |
| Lint | `:37-39` | `eslint.config.js:8` ignora **`supabase/**`** → as 98 edge functions **nunca são lintadas**; o glob `**/*.{ts,tsx}` não cobre `scripts/*.mjs` (19 scripts sem lint). | 🟨 cego para 2 diretórios |
| Type-check | `:41-42` | `tsconfig.json:26` tem `"include": ["src"]` → `e2e/`, `tests/`, `scripts/` e os `*.config.ts` **nunca são type-checkados**. `tsconfig.app.json` e `tsconfig.node.json` existem e **não são referenciados** (sem `"references"`) — configs órfãs. | 🟨 parcial |
| Unit tests (Vitest) | `:44-47` | Thresholds 75/75/70/75 são reais (`vitest.config.ts:28-33`), mas `coverage.include` (`:21`) mede só `src/lib/**` e `src/hooks/**` → os **473 arquivos de `components/` + `pages/` ficam fora** (~34% da superfície medida). `exclude` de `*.integration.*` é configuração morta (0 arquivos). | 🟨 threshold sobre 1/3 do código |
| E2E Playwright | `:49-54` | **Não pode passar.** `playwright.config.ts:11,23` espera `http://localhost:5173`; `vite.config.ts:14` serve em **8080** → `webServer` dá timeout. `testDir: './tests/e2e'` (`:4`) deixa os **7 specs de `e2e/` sem runner nenhum**. `tests/e2e/auth.spec.ts:22` espera título `/Freight/i` e `index.html:6` declara `CallCenter Pro`. Credenciais (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`/`E2E_SUPABASE_SESSION_JSON`) não são injetadas — o único `env:` do passo é `CI: true`. | ⬛ quebrado |
| Edge Function Tests (Deno) | `:56-61` | 40 arquivos de teste Deno existem e a descoberta padrão os pega. Mas **não há `deno.json` nem import map**: imports resolvem por URL remota a cada execução, sem lockfile — build não determinístico. | 🟨 sem hermeticidade |
| Build | `:64-65` | Passa **porque `.env` está versionado**: `src/integrations/supabase/client.ts:8-12` lança exceção sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`. | ✅ por motivo errado |
| Job `security` | `:75-85` | `bun audit \|\| true` — o `\|\| true` anula o resultado: **verde por construção mesmo com CVE crítico**. Sem SAST, secret scanning, CodeQL ou verificação de licença. | ⬛ não valida nada |

## Guards que você pode rodar antes da PR

- `node scripts/codemod-safe-number.mjs --check` (o que derruba o CI hoje);
- `node scripts/guard-edge-numeric.mjs --check` (se mexer em `supabase/functions/`);
- `node scripts/ci/check-claude-md-integrity.mjs` (se mexer em `AGENTS.md` ou `docs/agentes/`: exige os
  cabeçalhos do `AGENTS.md` e barra o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolher >30%,
  ou qualquer arquivo vigiado encolher >50%);
- `bun run type-check`, `npx eslint <arquivos>`, `npx vitest run <caminho>` do que tocou.

## Ao mexer em `.github/workflows/`

Rodar `actionlint` antes da PR, se disponível, e **deixar a PR aberta chamando o dono** (regra de
`AGENTS.md`): workflow, segredo e `.env*` não são escopo de auto-merge. Pin de action por SHA ainda não é
política deste repo — `ci.yml` usa tags (`actions/checkout@v4`, `oven-sh/setup-bun@v2`) e
`bun-version: latest`, que torna o build não reprodutível; mudar isso é decisão do dono, não iniciativa.

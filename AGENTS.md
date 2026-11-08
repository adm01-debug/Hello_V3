# AGENTS.md — Hello V3

Regras do dono para qualquer agente de IA; vencem `docs/`, `SYSTEM_FEATURES.md` e os ADRs (histórico).
Detalhe em `docs/agentes/<tema>.md`; divergiu da realidade → corrija no mesmo PR do fix. Responda sempre em PT-BR.

## Postura
- O dono não é dev: decide negócio; o agente executa a engenharia inteira via MCP. Nunca passo manual do
  dono nem pedir que ele revise diff.
- Qualidade + velocidade, mínimo de tokens. Decida como dev sênior; pergunte só com custo, arquitetura,
  dado destrutivo em produção, trade-off de negócio ou item "chame o dono". Para ler, não peça permissão.
- Verdade acima de validação: não sabe → diga; falhou → diga. Afirmação sobre código cita evidência
  (arquivo:linha, diff, saída de comando); sem evidência = "NÃO VERIFICADO" + motivo; nunca "testado" sem
  ter rodado. Branch/commit/PR não provam nada — leia o código. **Aqui o documento que declara conclusão é o
  menos preciso** (`SYSTEM_FEATURES.md` marca 185/185 pronto; os 52 ADRs estão todos "Aceito"): histórico,
  não estado. Estado = `ESTADO_ATUAL.md`.
- Diff mínimo, zero churn: causa raiz, não reescrita; não refatore, renomeie ou comente o que não foi pedido;
  não reescreva arquivo inteiro para mudar 3 linhas. Dependência nova ou bump major só se indispensável (avise na PR).
- `APROVADO` = execute o plano como descrito, sem reconfirmar.
- Uma tarefa por vez, cada uma com sua branch/PR. Outro bug → "Próximos passos". Travou → reporte o erro
  exato e pare; não contorne regra. Releia o pedido antes de concluir.
- Tokens: leia só o trecho necessário; `ESTADO_ATUAL.md` e `docs/estado/` antes de buscar por texto (e
  exclua `coverage/` e `covout/` do grep — são 466 arquivos de build versionados); exploração ampla →
  subagente; nenhuma tool "por garantia"; não gere código que não será aplicado.
- Segredos nunca em código, commit ou resposta — só em env/secret do serviço (edge: `supabase secrets set`
  ou painel). Nunca imprima nem commite `.env`, JWT de `service_role` ou chave de API. **Sete scripts em
  `scripts/` já carregam um JWT `service_role` de produção versionado** (`docs/agentes/banco.md`): não copie
  esse padrão, não execute esses scripts.

## Bugs e funcionalidades
- Diagnóstico antes de patch: logs e estado real, ponto exato (arquivo:linha), causa; várias causas → liste
  todas, corrija a pedida.
- Antes da PR: `bun run type-check`, `npx eslint <arquivos>` e `npx vitest run <caminho>` do que tocou.
  Só erro seu conta; erro herdado da `main` → "Próximos passos". **A `main` está com CI vermelho desde
  2026-07-26, por uma linha** (`docs/agentes/github-ci.md`): CI vermelho na sua PR não prova que você
  quebrou algo — confira qual passo falhou antes de qualquer patch.
- "Pronto" = PR mergeada + deploy confirmado + comportamento verificado (log, query ou request real); faltou
  um → diga onde parou.
- Funcionalidade pronta = integrada ponta a ponta (rota em `src/routes/`, entrada no menu **com filtro de
  papel**, hook/edge chamados, tabela com RLS **e migration versionada**, estados erro/loading/vazio,
  submit), sem mock, hardcode ou TODO. Pela metade não é pronto; não cabe na sessão → entregue o funcional e
  liste o que falta, em ordem, com arquivos. Nunca deixe código morto ou feature "quase" sem dizer.
- **Proibido painel decorativo.** Nenhum número, selo "10/10" ou badge de saúde sem fonte de dados real; sem
  dado → estado vazio honesto. O repo já tem 6 painéis fabricados e 2 botões que gravam dados fictícios em
  produção (`ESTADO_ATUAL.md` §3 R3/R4, lista em `docs/agentes/telefonia-voip.md`) — não aumente a conta.
- Antes de "implementar" feature: confira se já existe backend pronto sem consumidor (10 hooks e 7 edges
  nessa situação, `ESTADO_ATUAL.md` §3 R10). Ligar o fio costuma ser o trabalho todo.

## Comunicação
- Resultado primeiro, só o que muda decisão do dono. Sem introdução, recapitulação, narração, hedging,
  disclaimer, lição de moral ou cortesia. Efeito no negócio; técnica só se perguntarem. Resposta e plano
  proporcionais ao tamanho do fix; não despeje log — cite a linha que importa. Caminhos, comandos e links
  completos. Destrutivo de verdade: uma linha ("isso apaga X, sem volta — confirma?").
- Toda execução fecha com exatamente 3 "Próximos passos" (`N. [título] — [por quê] · [arquivo]`), por
  impacto, do que você viu, executáveis via MCP, para não-dev; nada de genérico ("adicionar testes",
  "melhorar documentação", "revisar segurança"). É um menu: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco
  devolvido = executar na ordem, sem reconfirmar. Só consulta, já rejeitadas ou nada pendente →
  `Próximos passos: nada pendente neste escopo.`

## Fluxo Git — detalhe em `docs/agentes/github-ci.md`
- Repo `adm01-debug/Hello_V3`, `main`, **privado**. Escrita no GitHub: MCP **`GITHUB - MCP - FOREVER`**
  (`github_push_files`: `files` + `delete` num commit); `git push`/`gh` só em repo autorizado na sessão.
- Nunca commite em `main`. Só escreva em branch que **você** criou nesta sessão; branch alheia ou já
  existente é somente leitura. Antes do push, confira que o último commit é seu.
- **A `main` recebe commits que não são de agente:** o app do Lovable escreve direto nela como
  `gpt-engineer-app[bot]`, sem PR e sem CI verde. Re-sync antes de editar; nunca force-push em `main`.
- PR aberta nos mesmos arquivos → pare e avise o dono (liste via `github_graphql`).
- Branch de `main` atualizado: `claude/<fix|feat|chore|docs|ci>-<slug>-<AAMMDD-HHMM>`.
- Commit PT-BR, 1 atômico, `<tipo>(<escopo>): <assunto ≥10 chars, sem ponto>`. **Não há hook `commit-msg`
  nem husky** — o padrão é cobrado por revisão, não por máquina.
- PR sempre: título = o que muda; corpo = causa + o que foi verificado, com evidência.
- `main` **não tem branch protection** nem required check: nada no servidor impede merge com CI vermelho, e
  `delete_branch_on_merge` é `false` (apague a branch à mão). A disciplina é sua.
- Mergeie sem aprovação (squash, apague a branch) PR sua pronta: CI verde ou vermelho só por erro herdado,
  sem conflito, escopo comum (front, edge, docs, config). **Deixe aberta e chame o dono**: DDL/migration em
  produção; `.github/workflows/`, segredos, `.env*`; deleção de dado, arquitetura ou custo; conflito com PR
  de outro agente.
- Conflito: rebase em `main`; `--force-with-lease` só na sua branch.
- Merge = produção (o Lovable publica a partir da `main`): confira o deploy e reporte. CI vermelha → leia o
  resumo da falha antes de qualquer patch; do seu merge → `fix:` em branch nova na mesma sessão.
- Fim: link da PR + estado.

## Banco — ler `docs/agentes/banco.md` antes de SQL, migration ou deploy
- Oficial: Supabase Cloud **`cfmlmcdyjuotqobjapng`** ("Hello - V3", `supabase/config.toml:1`).
- **NÃO escrever em `dyibdjwuoibwwpidgsxu`** — projeto anterior, ainda citado pelos 2 únicos cron jobs com
  HTTP do repo (`20260723114001_…:13,50`). Resíduo de migração, não o banco atual.
- **Não há MCP de SQL para este banco nesta sessão** e o host é bloqueado pela rede do ambiente de nuvem
  (`curl` → `000`). Os MCPs Supabase carregados apontam para outros sistemas — confira qual carregou antes de
  rodar SQL. Logo todo veredito sobre runtime do banco (dados, RLS efetiva, `pg_cron`, migrations aplicadas)
  é **NÃO VERIFICADO** até o dono liberar acesso. Não invente estado de banco.
- Diagnóstico = produção só leitura; teste = Postgres descartável. DDL só pelo fluxo de `banco.md` (arquivo →
  PR → merge → deploy do código → apply; nunca de branch aberta; o ledger ao vivo é a verdade). Destrutivo,
  segredos e rotação: só com o dono.
- **O ambiente não é reconstruível a partir do repo** (3 tabelas em uso sem `CREATE TABLE` nas 207
  migrations): toda tabela nova nasce com migration + RLS. Os testes de `src/__tests__/rls/` não tocam
  banco — não são evidência de RLS.

## Serviços
- **Lovable** — `docs/agentes/lovable-deploy.md` antes de confirmar deploy, mexer em `.lovable/`, CORS, auth
  OAuth ou dependência. É dono do deploy e commita na `main`; `_shared/cors.ts:20` libera **qualquer**
  `*.lovable.app`. `LOVABLE_API_KEY` (AI Gateway) é secret de edge, nunca no front.
- **Edge Functions** — `docs/agentes/edge-functions.md` ao criar/alterar função em `supabase/functions/`.
  98 diretórios, 94 com `index.ts`; `supabase/config.toml` versiona **um só** `verify_jwt`, então a
  exposição real das outras 93 não está no repositório.
- **Telefonia (SIP/WebRTC/WhatsApp)** — `docs/agentes/telefonia-voip.md` ao mexer em chamada, softphone,
  ramal, fila ou métrica de chamada. `jssip` é real; Wavoip e ElevenLabs são stub.
- **GitHub/CI** — `docs/agentes/github-ci.md` ao mexer em `.github/workflows/`, settings, ou quando um
  merge/CI falhar de forma estranha.

## Stack e comandos — detalhe em `docs/agentes/mapa-repo.md`
- Vite + React 18 + TS (`src/`), Supabase (`supabase/functions/` Deno, `supabase/migrations/`),
  Vitest + jsdom, Playwright (`tests/e2e/`), Tailwind + shadcn/ui. Node ≥ 20. O CI usa **bun**
  (`bun install`), mas há três lockfiles e o `bun.lock` fixa um registry privado da Lovable — leia
  `lovable-deploy.md` antes de mexer em dependência.
- `bun run type-check` (cobre só `src/`); `npx eslint <arquivos>` (ignora `supabase/**` e `scripts/`);
  `npx vitest run <caminho>`; `deno test -A supabase/functions/`; `bun run dev` → **8080**, apontando para
  **produção**. `bunx playwright test` hoje **não sobe** (porta 5173 ≠ 8080).
- Guards antes da PR: `node scripts/codemod-safe-number.mjs --check`,
  `node scripts/guard-edge-numeric.mjs --check`, `node scripts/ci/check-claude-md-integrity.mjs`.
- **Proibido `parseInt`/`parseFloat`/`Number.parseInt`/`Number.parseFloat`** em `src/` — use
  `@/lib/safe-number`. É `error` no ESLint e o primeiro guard do CI.
- Automação nova em `scripts/<nome>/` com README; nunca em `supabase/` (o CLI é dono) nem `src/` (entra no
  bundle). Os 19 scripts soltos em `scripts/` são legado órfão — só 2 são usados pelo CI.

## Onde olhar primeiro
| Precisa de | Leia |
|---|---|
| O que está quebrado, com evidência `arquivo:linha` | **`ESTADO_ATUAL.md`** |
| Pendências com status honesto (🔴/🟡/🟢/⚪) | `docs/audits/pendencias-2026-07.md` — o doc mais confiável do repo |
| Onde fica cada coisa, comandos, qualidade dos testes | `docs/agentes/mapa-repo.md` |
| Tabelas de evidência por dimensão | `docs/estado/` — pistas com endereço, não fatos verificados duas vezes |
| Intenção de arquitetura / memória de feature | `docs/adr/`, `mem/`, `.lovable/` — histórico, não estado |

Não há grafo de código gerado neste repo: o índice antes do grep é `ESTADO_ATUAL.md` + `docs/estado/`.

# Onda 39 — Varredura de branches e PRs (nenhum trabalho de outro agente perdido)

**Data:** 2026-11-26
**Escopo:** provar, byte a byte, que nenhum trabalho de outro agente de IA ficou perdido no remoto antes de qualquer exclusao de branch — e resgatar o que estivesse fora da `main`.
**Resultado:** 354 PRs mergeadas conferidas (**0 fora da `main`**) • 14 PRs fechadas sem merge triadas individualmente • **1 resgate real** (PR #374) • 2 branches obsoletas apagadas (PR #302 e `claude_04/*`, ja registradas em checkpoint anterior).

---

## 1. Metodo (o que foi medido, nao o que foi suposto)

1. **PRs mergeadas:** para cada PR fechada com `merged_at != null`, peguei o `merge_commit_sha` pela API (`repos/:owner/:repo/pulls?state=closed`) e rodei `git merge-base --is-ancestor <sha> origin/main`. Clone completo (`--is-shallow-repository` = `false`), entao o objeto local e o mesmo do remoto.
   - **354 PRs conferidas, 0 fora da main, 0 sem objeto local.**
2. **Branches remotas:** `git branch -r` apos `fetch --prune` + `git merge-base --is-ancestor` em cada uma.
3. **PRs fechadas sem merge:** comparacao de **blob SHA** (`pulls/:n/files` devolve o `sha` do blob de cada arquivo; `git rev-parse origin/main:<path>` devolve o mesmo tipo de hash). Blob SHA e hash do conteudo: igual = **byte a byte identico**. Quando diferia, extrai as linhas adicionadas do `patch` e procurei cada uma em `origin/main` com `git grep -F`.

## 2. Estado do remoto no momento da varredura

| Ref | Situacao |
| --- | --- |
| `origin/main` | linha base (`a7450263`) |
| `origin/contexto` | branch **gerada**, orfa (sem merge-base com a main): `docs/contexto/*` regerados a cada 10 min pelo workflow `contexto.yml`; o proprio arquivo diz "nunca abra PR desta branch" (`contexto.yml:21,384-387`). Nao e trabalho perdido — e prova gerada. |
| `claude/feat-bitrix-call-bridge-261126-1924` | PR **#373** aberta (etapa 081, DDL) |
| `claude/feat-cadence-tick-261126-1759` | PR **#370** aberta (etapa 085) |
| `claude/feat-crm-queue-trigger-261126-1833` | PR **#371** aberta (etapa 083) |
| `claude/fix-crm-queue-enqueue-261126-1908` | PR **#372** aberta (etapa 084) |
| `claude/fix-claim-atomico-discador-261126-1950` | PR **#375** aberta (etapa 079, DDL) |
| `claude/test-client-ip-1956` | PR **#374** aberta (resgate da #309) |

Nenhuma branch orfa de outro agente: todas as que sobraram estao cobertas por PR aberta ou sao geradas.

## 3. As 14 PRs fechadas sem merge (triagem uma a uma)

| PR | Assunto | Veredito | Evidencia |
| --- | --- | --- | --- |
| #1 | varredura de bugs (toolchain, hooks, runtime) | **superada** | itens checados em `origin/main`: `glowColor` (`StatsCard.tsx`), `aria-labelledby`, `getRandomValues` (`useMFA.ts`), decodificacao base64url (`jwt-handler.ts`), guarda de env (`client.ts`), invalidacao de cache (`Index.tsx`), `DEFAULT_LAYOUT`, `DEFAULT_SOUND_CONFIG`, `largest-contentful-paint` (`web-vitals.ts`); `LazyComponent.tsx` foi substituido por lazy routing (ADR 007); `eslint.config.js` da main e um flat config mais novo |
| #9 | `safeParseFloat` no parse de HSL do tema | **incorporada** | todas as linhas adicionadas presentes |
| #12 | `no-control-regex` + safe-number | **incorporada** | `safeParseFloat` em `usePhaseColors.ts:10`; casos de `error-boundaries.test.tsx` presentes com assercao por regex (`:119-124,248`) |
| #15 | rebase da #12 | **incorporada** | idem #12 |
| #18 | force IPv4 no apt do Playwright | **incorporada** | `Acquire::ForceIPv4 "true"` em `.github/workflows/ci.yml:65` |
| #19 | secrets Supabase no job E2E | **incorporada** | `VITE_SUPABASE_*` no job E2E (`ci.yml:60-71`) e seeding por `E2E_ADMIN_EMAIL`/`E2E_SUPABASE_SESSION_JSON` (`tests/e2e/auth.spec.ts:20-26`) |
| #20 | suite deno verde | **superada** | `deno.lock` existe na main; `health-check` hoje usa wrapper proprio (`Deno.serve(withRequestLog(...))`, `:159`) |
| #47 | workflow de diagnostico do `startup_failure` | **obsoleta por desenho** | o proprio titulo diz "temporario"; `diag-ci.yml` nao existe mais e o startup_failure esta resolvido |
| #49 | dump do error-context no E2E | **incorporada** | todas as linhas adicionadas presentes |
| #94 | `fuzz-test-runner` exige admin | **incorporada** | `supabase/functions/fuzz-test-runner/index.ts:22-61` (auth + `is_admin_user` + fallback por `user_roles`) |
| #104 | conflitos de optimistic lock registrados/purgados | **incorporada** | `supabase/functions/__tests__/optimistic-lock.test.ts` existe com a guarda `enforce_optimistic_lock`; `cleanup-lock-conflicts` purga |
| #106 | reconciliar as duas fontes de papel | **incorporada** | migrations na main: `20261122230000_reconcile_admin_role_sources.sql`, `..._policies_read_user_roles.sql`, `..._role_checks_honor_active_and_expiry.sql`, `20261127200000_revoke_anon_role_helpers.sql` |
| #169 | persistir transcricoes (E061+E063) | **incorporada** | `allTranscriptsRef` em `src/hooks/useCallSession.ts:43-74`; E061–E073 landaram em `a81e535` |
| **#309** | teste do IP literal da geo | **RESGATADA** | o arquivo nao existia na main (`git cat-file -e` falhava) e a branch foi apagada; recuperado byte a byte do commit `9c93dff9` (sha256 `52be096b035e282c59846ab174cf122fc0a110751ccd9ad5cb80ae2009867463`) — **PR #374** |

## 4. O resgate (#309 → #374)

`supabase/functions/_shared/client-ip.ts` (`isIpLiteral` + `clientIpFromHeaders`) esta em producao e impede que o header do cliente chegue cru na URL do provedor de geo (hostname, porta, `/../`). O teste dele nasceu na branch `claude/fix-validate-geo-ip-261122-0500`, foi resgatado na PR #309 e a PR foi **fechada sem merge** — sem branch no remoto, o trabalho estava inacessivel pelo Git normal (so pelo commit via API).
Resultado: arquivo de 32 linhas recuperado byte a byte, `deno test -A` -> **4 passed / 0 failed** contra o modulo da main de hoje. PR #374 (apenas teste, nao toca producao).

## 5. Limites desta varredura

- A varredura compara **PRs** e **branches** com a `main`; nao julga valor de negocio de codigo ja mergeado.
- Sessoes antigas usaram clones proprios: aqui, `merge_commit_sha` + `--is-ancestor` cobrem o que foi mergeado, que e o universo do "nao se perde o que entrou".
- As 4 PRs abertas (#370–#373) e as 2 desta onda (#374, #375) continuam **abertas de proposito** (DDL/cron/segredo = regra 8).
## 6. Segunda passada — auditoria do que foi descartado (2026-11-27)

Pergunta do dono: *"analise exaustiva em tudo que foi descartado, procurando o que NAO deveria ter sido descartado por ser trabalho de outro agente, PARCIAL"*. Metodo: nada de amostragem — **todos** os arquivos de **todas** as PRs fechadas sem merge foram reauditados, e todas as branches locais/remotas apagadas foram confrontadas com a `main` por conteudo.

### 6.1 Metodo (byte a byte, nao por nome)

1. `gh api .../pulls?state=closed` (paginado) -> universo de PRs fechadas.
2. Para cada PR: `git fetch origin <head_sha>` e `git diff --numstat origin/main...<sha>` (tres pontos = so o que a PR acrescentou).
3. Para cada arquivo: `git show origin/main:<path>` e comparacao **linha a linha** das linhas acrescentadas, com normalizacao de espacos/aspas/pontuacao (elimina falso "faltando" por reformatacao).
4. Veredito so com `arquivo:linha` na `main`.

### 6.2 As 14 PRs fechadas sem merge, reauditadas arquivo por arquivo

Resultado: **nenhuma funcionalidade perdida**. Todo diferenca restante e codigo que a `main` reescreveu depois.

| PR | O que a 2a passada achou na `main` |
| --- | --- |
| #1 | `StatsCard` com `glowColor` (`:15,25,77,120`), `useMFA` com alfabeto Crockford + `crypto.getRandomValues` (`:162-166`), `jwt-handler` com decode base64url (`:21-23`), `web-vitals` FCP (`:119`), `useDashboardLayout` (`:37`), `useSupervisorPanel` (`:55-79`), `client.ts` com guarda de env, `Index.tsx` invalidando cache (`:58`). `LazyComponent.tsx` extinto por ADR 007 (remocao deliberada). Os 4 testes antigos (`useComprehensive`, `useDeviceAndSecurity`, `useAuthAndDataIntegrity`, `useAlertSoundAndNotifications`) foram consolidados: a `main` tem **168** arquivos de teste em `src/hooks/__tests__`. |
| #9 | todas as linhas acrescentadas presentes |
| #12 / #15 | `usePhaseColors.ts:10` com `safeParseFloat(..., { context })`; `error-boundaries.test.tsx:123` cobre `/Erro ao carregar/` |
| #18 / #19 | semeadura de sessao admin vive em `tests/e2e/helpers/adminSession.ts` + `skipGuard.ts` |
| #20 | `deno.lock` com `react-router-dom@^7.18.6` (mais novo que o da PR); `health-check/index.ts:159` com `Deno.serve(withRequestLog(...))` |
| #47 | `diag-ci.yml` era diagnostico temporario do `startup_failure`; nada equivalente e necessario hoje |
| #49 | todas as linhas presentes |
| #94 | exigencia de admin em `fuzz-test-runner/index.ts:22-46` (401 + `is_admin_user`) |
| #104 | `cleanup-lock-conflicts/index.ts:25-39` com token de cron `CLEANUP_CRON_TOKEN`; teste `optimistic-lock.test.ts` existe (conteudo reescrito depois) |
| #106 | as **18** migrations da PR estao identicas na `main`; `data-lake-flush/index.ts:30-51` com token de cron + 401/403 |
| #169 | persistencia de transcricao em `useCallSession.ts:43-76`; **`hold_events` e gravado e fechado** em `useMultiChannelCall.ts:225-255`; botao de cancelar transferencia em `ActiveCallDisplay.tsx:254-274` |
| #309 | resgatada na 1a passada (PR #374) — arquivo identico na `main` |

### 6.3 As 16 PRs mergeadas com conflito resolvido a mao (#353–#368)

A 1a passada provou apenas **existencia** de arquivo (`git cat-file -e`). A 2a passada provou **conteudo**: `git diff origin/main...<head>` de cada PR -> **0 linhas ausentes** nas 16. A resolucao mecanica dos conflitos de `docs/qa/05-PROGRESSO.md` e `docs/agentes/banco.md` nao perdeu byte.

### 6.4 Branches apagadas

- **16 branches locais** do clone antigo: 13 mapeiam para PRs **mergeadas** (merge commit ancestral da `main`), 1 e a branch da PR **#370** (aberta, conteudo vivo), 2 sao sondas (`tmp-probe`, `tmp-probe-128`).
- **13 branches remotas apagadas** (Events API, janela de 300 eventos): 11 mapeiam para PRs mergeadas; `claude/test-e076-rls-*` teve o conteudo incorporado pela **#313** (`supabase/tests/user_preferences_rls_test.sql` esta na `main`); `claude/tmp-diag-hold-rls-*` era sonda de diagnostico; `tmp-probe-128` sonda.
- `claude/fix-espera-nao-grava-hold-*` -> **PR #321 mergeada**; o codigo esta em `src/hooks/useMultiChannelCall.ts:225-255`.
- `claude/infra-geo-tables-retroativo-*` (sem PR): sonda de leitura do DDL real em producao; a entrega real (CREATE TABLE retroativo) entrou pela **#355**.

### 6.5 Arquivos deletados do historico da `main`

`git log --diff-filter=D`: **1** migration apagada em toda a historia — `supabase/migrations/20250102000000_performance_indexes.sql`, removida pela **#318** porque reusava a versao `20250102000000` (nunca registrava em `public.schema_migrations`) e foi substituida por `20261125120000_indices_auditoria_e_busca_contatos.sql`. **0** testes E2E e **0** gates (`supabase/tests/`) apagados.

### 6.6 Nao perdido, porem nao adotado (hardening mais fraco que o proposto)

`src/lib/voipProactiveSnapshot.ts` e `src/lib/voipRecommendationCoaching.ts` tem `try/catch` em volta do `JSON.parse` do `localStorage`, mas **sem validacao de forma** (a PR #1 validava `ids`/`takenAt` e filtrava o array). Com JSON valido de forma errada o retorno pode sair `NaN`/nao-array. Sem efeito hoje (chaves sao escritas so por este modulo); registrado como divida, nao como perda.

### 6.7 Limites

- A Events API do GitHub devolve no maximo 300 eventos por chamada (paginacao limitada) — branches remotas apagadas **antes** dessa janela nao sao enumeraveis por ela. O universo "mergeado" continua coberto por completo: toda PR mergeada foi provada por `merge_commit_sha` + `--is-ancestor`, e toda PR fechada sem merge foi reauditada arquivo por arquivo.
- Branches que nunca subiram para o remoto e nunca viraram PR so existiriam em clones locais; os clones que restam (`/tmp/hv2`, `/tmp/hv083`) foram auditados por inteiro.

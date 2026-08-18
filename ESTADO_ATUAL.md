# Estado Atual do Sistema — Auditoria de Estado

> **Sistema:** `hello-v3` — plataforma VoIP / Call Center ("Bitrix Call Connect")
> **Data da auditoria:** 2026-08-16
> **Commit auditado:** `9160623` (branch `claude/system-status-features-boms0f`, a partir de `main`)
> **Método:** medição direta do código, em 16 lotes com manifesto de arquivos pré-alocado.
> **Escopo medido:** 1.394 arquivos de código / 168.866 linhas — **0 lacunas e 0 sobreposições** entre lotes (verificado por `comm` e `uniq -d`).

---

## 1. Veredito em uma tela

O sistema é **grande e majoritariamente real**: 95 Edge Functions, 159 tabelas, 104 rotas, 172 hooks e 3.276 testes que passam. A engenharia de base — RLS, RBAC, locking otimista, realtime, testes de propriedade — existe e tem lastro.

O problema não é ausência de implementação. É que **os instrumentos que deveriam dizer se o sistema está bem estão fabricados ou quebrados**, e por isso o sistema *parece* mais pronto do que está:

1. **O CI está vermelho há 30 execuções seguidas** — nenhuma execução verde desde 2026-07-26. Todo gate de qualidade descrito no `ci.yml` está, na prática, desligado.
2. **Painéis de saúde exibem números inventados.** O dashboard (`/dashboard`) abre com "Análise IA de Performance: crescimento de 12%… Health Score 9.8" — texto 100% hardcoded, zero dados. A página `/observability` mostra "SIP Gateway Online 45ms / RLS 10/10", também fixos.
3. **A chave `service_role` de produção está versionada no repositório**, em 7 scripts, válida até 2036. Ela ignora toda a RLS do banco.
4. **O ambiente não é reconstruível a partir do repositório**: três tabelas em uso (`geo_settings`, `geo_restrictions`, `geo_access_logs`) não têm `CREATE TABLE` em nenhuma migration.
5. **A camada de segurança do frontend não é executada.** Os 17 módulos de `src/lib/security/` (CSP, HSTS, rate-limiter, XSS, CSRF) só são importados por um barrel que ninguém importa. E a página `/security-report` declara "22 tabelas com RLS" — o número real é 160.
6. **A documentação canônica está invertida.** `SYSTEM_FEATURES.md` lista 185 funcionalidades e marca **todas** como concluídas; os 52 ADRs estão **todos** com status "Aceito". Nenhum dos dois registra um único item pendente.

Não há aqui um sistema "de fachada": há um sistema real cuja camada de auto-observação foi construída como decoração. É isso que precisa ser corrigido primeiro, porque enquanto ela mentir, nenhuma outra medição do sistema é confiável — inclusive as futuras.

---

## 2. Contagem por classificação

Estes números vêm de **recontagem mecânica da coluna de classificação das tabelas de evidência** dos 12 lotes que classificam item a item — não dos resumos em prosa que os lotes escreveram sobre si mesmos. (Ver §5c: as duas fontes divergem, e a primeira versão deste documento usava a errada.)

| Lote | Itens classificados | ✅ | 🟨 | 🟦 | ⬛ |
|---|---:|---:|---:|---:|---:|
| Componentes (C1–C4) | 289 | 235 | 34 | 3 | 17 |
| Páginas (P1–P2) | 130 | 98 | 31 | 0 | 1 |
| Hooks (H3–H4) | 175 | 159 | 4 | 0 | 12 |
| Edge Functions (F1–F2) | 98 | 66 | 22 | 3 | 7 |
| Módulos `src/lib` (L1–L2) | 85 | 48 | 6 | 25 | 6 |
| **Total** | **777** | **606 (78%)** | **97 (12%)** | **31 (4%)** | **43 (6%)** |

**O que este total é e o que não é.** É a soma dos itens que receberam classificação com evidência `arquivo:linha` nas tabelas dos lotes. **Não** é um "percentual do sistema pronto", por três razões declaradas: (1) itens ≠ arquivos — `C4` classifica 31 itens sobre 80 arquivos porque trata os 57 shadcn/ui em bloco, e `L1` classifica 9 porque é um lote só de testes; (2) há sobreposição conceitual entre dimensões — um hook contado em `H3` e o componente que o consome contado em `C2` podem ser a mesma funcionalidade vista de dois ângulos; (3) os lotes `H1`, `H2`, `M1` e `X1` estão fora desta tabela porque não classificam item a item (são, respectivamente, dois lotes de arquivos de teste, o inventário de dados e o de infraestrutura).

**Denominadores medidos por mim, independentes dos lotes:** 172 hooks de produção, 335 componentes de produção (57 shadcn/ui), 129 páginas + 1 subcomponente, 76 módulos `src/lib` de produção, 93 Edge Functions com `index.ts` (95 diretórios), 159 tabelas em `types.ts`, 268 arquivos de teste / 3.276 testes.

**Leitura:** o número que importa não é o percentual de "pronto", e sim a distância entre o que os painéis afirmam (10/10, 9.8, "tudo concluído") e o que a medição mostra. Essa distância é o risco.

---

## 3. Riscos estruturais, por gravidade

### 🔴 R1 — Chave `service_role` de produção versionada no Git
**Evidência:** 7 scripts contêm um JWT com `role=service_role` e `ref=cfmlmcdyjuotqobjapng` (o projeto declarado em `supabase/config.toml:1`), com expiração em 2036:
`scripts/check-data.mjs:2`, `scripts/test-api-direct.mjs:3`, `scripts/test-auth-flow.mjs:3`, `scripts/test-authenticated-queries.mjs:3`, `scripts/test-call-volume-rpc.mjs:2`, `scripts/test-dashboard-rpcs.mjs:2`, `scripts/test-validate-ip.mjs:3`.
Outros 10 scripts embutem string de conexão Postgres literal com `rejectUnauthorized: false`.
**Impacto:** essa chave ignora **toda** a RLS. Está no histórico do Git — rotacionar é obrigatório, remover o arquivo não basta.
**Agravante:** nenhum desses 17 scripts é chamado por `package.json`, pelo CI ou por outro script. São órfãos — o risco existe sem contrapartida de utilidade.

> **Nota de precisão:** o arquivo `.env`, também versionado (`git ls-files .env` retorna `.env`; `.gitignore` não tem entrada para ele), contém **apenas a chave `anon`**, que é pública por design. O `.env` é higiene ruim; os scripts são o incidente.

### 🔴 R2 — CI vermelho em 100% das execuções recentes
**Evidência (runtime, via API do GitHub):** das 30 execuções mais recentes do workflow `ci.yml` na branch `main`, **25 falharam e 5 foram canceladas. Zero sucessos**, desde 2026-07-26 até 2026-08-11 (commit `9160623`).
**Consequência:** os gates prometidos — lint, type-check, testes, E2E, testes Deno, build — não protegem nada. Cada merge em `main` entrou sem verificação efetiva.

Medi cada gate localmente, com as dependências instaladas via `npm ci`:

| Gate | Promessa | Resultado real medido |
|---|---|---|
| `type-check` | tipos válidos | ✅ **0 erros** |
| `lint` | código limpo | ❌ **2 erros**, 284 warnings → reprova o job |
| `vitest` | suíte verde | ❌ **4 testes falham** de 3.276 (`src/hooks/__tests__/useSessionManager.coverage.test.tsx`), reproduzível em isolamento — **não é flaky** |
| Playwright | E2E | ❌ não pode passar: `playwright.config.ts:11,23` espera porta 5173, `vite.config.ts:14` serve em 8080 |
| `deno test` | Edge Functions | ⚠️ não verificado — Deno indisponível no ambiente de auditoria |
| `security` | auditoria de dependências | ⚠️ **verde por construção**: `bun audit \|\| true` (`.github/workflows/ci.yml`) |

> **Correção incorporada após a primeira redação deste documento.** A tabela acima mede cada gate *isoladamente*, no meu ambiente. Ela não explica **onde** o CI realmente morre — e a resposta muda o que precisa ser feito.
>
> Ao ler os logs da última execução na `main` (run `31532465470`, commit `9160623`), o pipeline **falha no primeiro guard**, muito antes de chegar a lint, type-check ou testes:
> ```
> ❌ safe-number codemod: 1 ocorrência(s) em 1 arquivo(s)
>   • src/components/voice/overlay/usePhaseColors.ts (1 substituição)
> ##[error]Process completed with exit code 1.
> ```
> Reproduzi localmente: `node scripts/codemod-safe-number.mjs --check` sai com código 1 por causa de **uma única linha** — `usePhaseColors.ts:9`, que usa `Number.parseFloat` onde o guard do próprio repositório exige `safeParseFloat`.
>
> **Consequência prática:** as 25 falhas de CI não são "a suíte está quebrada". São **uma linha** derrubando o pipeline no primeiro passo, há três semanas — e, por isso, os 4 testes que falham e os 2 erros de lint que medi **nunca chegaram a ser executados no CI**. Eles são problemas reais, mas estavam escondidos atrás deste.
>
> **Segundo modo de falha, distinto do primeiro.** As duas execuções disparadas por este PR (runs `31973391673` e `31973471456`) falharam em segundos, com `404` nos logs de **ambos** os jobs — inclusive o job `Security audit`, cujo único passo é `bun audit || true` e que, por construção, **não pode falhar por conteúdo**.
>
> Um job que não pode falhar falhando, sem produzir uma linha de log, é consistente com execuções que **não chegam a rodar** — o caso mais comum sendo limite de gasto/minutos do GitHub Actions em repositório privado, ou aprovação pendente de workflow. **Isto é inferência a partir da assinatura da falha, não fato verificado:** não tenho acesso à página de billing da conta para confirmar.
>
> **O que isso significa na prática:** há provavelmente **dois** problemas empilhados. Corrigir `usePhaseColors.ts:9` destrava o guard, mas se as execuções não estiverem começando, o CI seguirá vermelho. Vale checar o billing do Actions antes de investir em correções de código.

### 🔴 R3 — Painéis de saúde e performance com dados fabricados
| Componente | Onde aparece | O que exibe |
|---|---|---|
| `src/components/dashboard/PerformanceNarrative.tsx:24-45` | Dashboard em `/dashboard` (`src/pages/Index.tsx:116`) | "crescimento de 12%", "meta 94%", "Eficiência +5.2%", "Health Score 9.8" — **zero imports de dados**, sob o rótulo "Análise IA de Performance" e badge "Atualizado agora" |
| `src/components/dashboard/SystemIntegrityDashboard.tsx:6-11` | `/observability` (`src/pages/ObservabilityDashboard.tsx:104`) | "SIP Gateway Online 45ms", "RLS Policies Seguro 10/10" — array literal |
| `src/components/executive/SecurityAuditCard.tsx` | `RealtimeQualityDashboard.tsx:124` | "Auditoria de Segurança (10/10)" com "última validação" = hora do render |
| `src/components/supervisor/QueueTrendChart.tsx:23-24` | Painel do supervisor em `/dashboard` (`TrendChartToggle` → `SupervisorPanel` → `pages/Index.tsx:14`) | Gráfico "Tendência do Dia" com `waiting`/`active` gerados por `Math.random()`; `supabase` é importado em `:3` e **nunca usado** — exibido ao lado de métricas reais |
| `src/pages/SecurityReport.tsx:97-101` | `/security-report` | Exporta um `.txt` de auditoria com "teste de carga < 50ms" e "Meta 10/10" hardcoded |
| `src/pages/Status.tsx:52` | `/status` — **rota pública** | Exibe "Todos os sistemas operacionais" mesmo com zero amostras nas tabelas de saúde |

**Por que é o risco mais insidioso:** um monitor que nunca fica vermelho é pior que a ausência de monitor. Uma degradação real de SIP, RLS ou performance não gera chamado — o painel continua verde.

**Segundo botão de fabricação de dados:** além do R4, `src/components/…/CallAlertsList.tsx:63` ("Criar Testes") chama `useAlerts.ts:239`, que insere `call_sessions` e `call_alerts` fictícios em produção, também sem guarda de papel.

### 🔴 R4 — Botão em produção que grava dados fabricados no banco
**Evidência:** `src/hooks/useAgentRanking.ts:262-307` (`createTestData`) gera com `Math.random()` chamadas, durações, sentimentos e notas de satisfação, e faz `INSERT` real em `call_sessions` (:274), `call_summaries` (:286) e `call_analyses` (:292), com nomes de agente literais ("Lucas Ferreira", "Ana Carolina Silva"…).
**Exposição:** botão **"Criar Dados"** em `src/pages/AgentRanking.tsx:47`, na rota `/ranking` (`src/routes/protectedRoutes.tsx:118`) — **sem restrição de papel**: qualquer usuário autenticado alcança.
**Impacto:** contamina ranking, dashboards executivos, relatórios e histórico, sem coluna que permita separar o fabricado do real depois.

### 🔴 R5 — Ambiente não reconstruível a partir do repositório
**Evidência:** `geo_settings`, `geo_restrictions` e `geo_access_logs` existem em `src/integrations/supabase/types.ts:3666,3711,3744` (portanto, existem no ambiente real) e são usadas em produção por `src/hooks/useGeoBlocking.ts:35,44,53` e `supabase/functions/validate-geo/`. **Nenhuma migration as cria** (`grep "CREATE TABLE.*geo_"` → vazio). Cinco migrations executam `DROP POLICY IF EXISTS … ON public.geo_*`, que aborta contra relação inexistente.
**Consequência:** um `supabase db reset` a partir do Git não reproduz o ambiente. Não há caminho versionado de volta ao estado atual do banco.

### 🟠 R6 — Cron jobs apontando para outro projeto Supabase
**Evidência:** `supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql:13` e `:50` fixam `https://dyibdjwuoibwwpidgsxu.supabase.co/functions/v1/auto-scorecard` e `/data-lake-flush`, enquanto o projeto declarado é `cfmlmcdyjuotqobjapng`. A mesma migration embute o JWT `anon` de produção nas linhas `:14` e `:53`.
**Leitura:** resíduo da migração de projeto ("feat: Migração Banco Lovable para Supabase Hello - V3", commit `9422246`). Os dois únicos agendamentos automáticos do repositório apontam para um projeto que não é este.

### 🟠 R7 — Bypass de RLS por construção em `search-calls`
**Evidência:** `supabase/functions/search-calls/index.ts:28-33` cria o cliente com `SUPABASE_SERVICE_ROLE_KEY` e repassa `Authorization: authHeader || ''`. Não há checagem de autenticação nem retorno 401 em lugar algum do arquivo.
**Efeito:** qualquer chamador que a alcance recebe leitura com papel de serviço sobre transcrições de chamadas — escalonamento horizontal mesmo para o papel mais baixo.
**Verificado no arquivo inteiro (122 linhas):** não há `getUser()`, não há retorno 401, não há módulo de autenticação em `supabase/functions/_shared/` que ela pudesse importar. Ela desvia do padrão do próprio repositório — `verify-voice/index.ts:24-27` faz `supabase.auth.getUser()` e devolve 401.
**Ressalva:** `supabase/config.toml` tem **uma única linha** (`project_id`) — nenhum `verify_jwt` está versionado para nenhuma função. Se a exposição é anônima ou apenas autenticada depende de configuração de plataforma que **não está no repositório** → `NAO_VERIFICADO`.

### 🟠 R8 — Fio de dados quebrado em métricas de espera (hold)
**Evidência:** `src/hooks/useMultiChannelCall.ts:143` é o único gravador de `hold_events` em todo o repositório. A função `setCallDbSession` (`:169`), que preencheria `call_session_id` e `agent_name`, **nunca é chamada em código de produção** — `grep -rn setCallDbSession src` retorna apenas a definição (`:169`), o export (`:241`) e um teste (`useMultiChannelCall.coverage.test.tsx:110`).
**Cadeia de consequências:** todo hold é gravado com ambos os campos nulos → o encerramento (`:145`) compara `call_session_id` com `''` e nunca casa → `ended_at` nunca é preenchido → `useHoldMetrics.ts:60` zera a métrica por agente e `supabase/functions/check-hold-alerts/index.ts:52` (`.is('ended_at', null)`) gera alertas que nunca cessam.

### 🟠 R9 — Testes que não protegem
**Medição própria:** **29 de 268** arquivos de teste (11%) não importam **nada** do projeto — reimplementam a lógica localmente e asseveram sobre a própria cópia.
Os mais graves pela promessa que fazem:
- `src/hooks/__tests__/useSecurityHardening.test.ts` (863 linhas) — importa apenas `vitest`. Declara validar RLS, políticas de storage, HSTS e prevenção de escalonamento de privilégio. Não carrega uma linha de produção.
- Os 7 arquivos de `src/__tests__/rls/` — declaram uma matriz e verificam que a matriz contém os próprios valores. Zero contato com banco ou migrations.
- `src/hooks/__tests__/useMFA.test.ts` — testa uma reimplementação com `Math.random()`, enquanto o código real usa `crypto.getRandomValues` (`useMFA.ts:161-170`).

Complementarmente, a cobertura mede apenas `src/lib/**` e `src/hooks/**` (`vitest.config.ts`) — os 473 arquivos de `components/` e `pages/` ficam **fora** da métrica de 75%.

### 🟡 R10 — Funcionalidades completas e dormentes
Backend provisionado (tabela + edge function), **zero consumidores** no `src/` — confirmado por múltiplos padrões de busca, incluindo import dinâmico:
`useAdherence`, `useChatbot`, `useChurnRisk`, `useCallPlaylists`, `useCoachingAssignments`, `useComplianceRules`, `useScorecards` (deixa 4 tabelas sem leitor), `useSurveys` (edge `send-survey` sem gatilho), `useNotifications`, `useMultiChannelCallConference`.
Mais 7 Edge Functions sem chamador identificado: `cleanup-lock-conflicts`, `fuzz-test-runner`, `generate-coaching-track`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary`.

### 🔴 R3b — A camada de segurança do frontend inteira está inativa
**Evidência:** os 17 arquivos de `src/lib/security/` (~700 linhas) — CSP, HSTS, `https-enforcer`, `rate-limiter`, `input-sanitizer`, `xss-prevention`, `csrf-token`, `sql-sanitizer`, `jwt-handler` — são importados **somente** pelo barrel `src/lib/security/index.ts`, e esse barrel **não tem nenhum importador** (`grep -rn "from '@/lib/security'" src` fora de testes → vazio).
**Efeito:** existem, são testados, e nenhum caminho de execução chega neles. A proteção é de papel.
**Agravante correlato:** `src/lib/security-report-data.ts:20` exibe, na página `/security-report`, o texto fixo **"22 tabelas com RLS habilitado"**. A contagem real nas migrations é **160** (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`, nomes distintos). O relatório de conformidade é hardcoded e está errado por um fator de 7.

### 🔴 R4b — A barra de chamada ativa nunca renderiza
**Evidência:** `src/components/calls/ActiveCallBar.tsx:63` inicializa `call` como `null`; a **única** chamada a `setCall` em todo o arquivo é `:213 setCall(null)`. Logo `call` é sempre nulo e o componente cai em `:124 return null`.
**Alcance:** está montado em **todas** as páginas via `src/components/layout/AppLayout.tsx:85`. Com ele morrem a transcrição ao vivo real (`useLiveTranscription` → edge `voice-transcribe`), o `NextBestActionPanel`, o `CrmSuggestionsCard` e as edges `generate-summary` / `extract-crm-fields` — todas implementadas de verdade e inalcançáveis por esse fio.

### 🟠 R7b — KPI de negócio medindo cliques que não fazem nada
**Evidência:** `src/components/…/VoipRecommendationsPanel.tsx:104-125` — "Aplicar recomendação" apenas executa `navigate()` (5 das 6 recomendações são do tipo `link`, conforme `supabase/functions/voip-recommendations/index.ts:108-187`), mas emite `toast.success('Aplicado')` e grava `outcome:'applied'`. Esses registros alimentam o KPI **"Efetividade %"** em `RecommendationInsightsCard.tsx:124-131`.
**Mesmo padrão em `voip-anomaly-remediation`:** as ações da whitelist (`force_codec_opus_low`, `pause_outbound_campaigns`, `throttle_concurrent_calls`) **nunca são executadas** — viram linha em `voip_recommendation_actions` com `outcome:'auto_applied'` (`index.ts:216`).
**Efeito:** existe uma métrica de eficácia operacional cujo numerador é composto de não-ações.

### 🟠 R9b — Guarda de navegação divergente da guarda de rota
**Evidência:** `AppSidebar.tsx` expõe 76 links **sem filtro por papel**, contra 47 rotas que declaram `roles:` em `src/routes/protectedRoutes.tsx`.
**Efeito:** um agente comum vê itens de menu que o levam a `/unauthorized`. Não é falha de segurança (a rota barra), é falha de produto — e mascara quais funcionalidades o usuário realmente tem.
**Relacionado:** 15 rotas ativas não têm entrada em nenhum menu (6 de negócio + 9 administrativas).

### 🟠 R12 — `bun.lock` fixa um registry privado da Lovable
**Evidência:** `bun.lock` contém **143 URLs de tarball** apontando para `europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache` — um Artifact Registry privado — enquanto `package-lock.json` aponta para `registry.npmjs.org` em 793 entradas. Não há `.npmrc` nem `bunfig.toml` versionado.
**Efeito:** o CI usa `bun install` (`.github/workflows/ci.yml:29`), que consome o `bun.lock`. Qualquer ambiente sem credencial para `lovable-core-prod` — um fork, um runner novo, um desenvolvedor externo — não consegue instalar as dependências pelo caminho oficial do projeto. **Aqui, `bun install` recuperou 393 pacotes contra 503 do `npm ci`**, deixando de fora `fast-check`, `@dnd-kit/core`, `jspdf`, `web-vitals` e `react-markdown`.
**Ressalva que impede uma conclusão maior:** o host `europe-west1-npm.pkg.dev` também é bloqueado pela política de rede **deste ambiente de auditoria** (`curl` devolve `000`; `registry.npmjs.org` devolve `200`). Portanto **não posso atribuir a falha do CI a isso** — e há prova em contrário: a execução da `main` de 2026-08-11 passou do `bun install` e chegou ao guard. O que fica é o risco de reprodutibilidade e de dependência de infraestrutura de terceiro, não uma causa de falha comprovada.
**Adjacente:** três lockfiles coexistem no repositório (`bun.lock`, `bun.lockb`, `package-lock.json`), com dois gerenciadores e dois registries distintos.

### 🟡 R13 — Internacionalização declarada e inexistente
**Evidência:** `i18n.json` declara três locales (`en`, `pt-BR`, `es`) e um mapa de namespaces por página. Medição:
- **Zero consumidores** — nada em `src/`, `vite.config.ts` ou `package.json` referencia o arquivo.
- **Nenhuma biblioteca de i18n** no `package.json` (sem `i18next`, `react-intl`, `useTranslation` em lugar algum de `src/`).
- Dos 3 locales declarados, **só `en` tem arquivo**: `public/locales/en/common.json`, com 10 strings. E nada lê esse diretório.
- A interface inteira é hardcoded em português, enquanto o `defaultLocale` declarado é `en`.
**Contraste:** a *tradução de conversas* — que é outra coisa — existe de verdade (`useLiveTranslation.ts`, `TranslationCenter.tsx`, edges `translate-utterance` e `translate-summary`), ainda que `LiveTranslationPanel.tsx` seja órfão e `translate-summary` não tenha chamador.
**Leitura:** o ADR-016 ("Multilingual Real-Time Translation & **Localization** Suite", status "Aceito") cobre duas features. A tradução está 🟨; a localização da interface é 🟦 — só a declaração existe.

### 🟡 R14 — Relatórios de cobertura versionados no repositório
**Evidência:** `covout/` (413 arquivos) e `coverage/` (53) somam **466 arquivos rastreados pelo Git — 23% do repositório**, sendo 436 HTML, 12 JS e 8 PNG. São saída de build do Istanbul/v8, e replicam o código-fonte dentro de páginas HTML. Nenhum dos dois está no `.gitignore`.
**Efeito:** ruído em todo `git grep`, diffs poluídos, e o código-fonte duplicado em formato não versionável de forma útil. É a mesma classe de problema do `.env` versionado: higiene, não incidente.

### 🟡 R11 — Bloqueador de runtime declarado e não fechado
`.lovable/plan.md` (Onda 39) registra o bug "Rendered more hooks than during the previous render" causado por hooks chamados dentro de funções auxiliares, listando 8 páginas.
**Medição por varredura de profundidade de chaves em todo o `src/`:** 7 das 8 foram corrigidas; **resta 1** — `src/pages/TopicDetection.tsx:100`, onde `usePageTitle` é chamado dentro do subcomponente `TrendIcon` (definido em `:99`). É a única ocorrência do padrão no repositório inteiro.

---

## 4. O que está bom (sem distorcer o quadro)

Isto não é um sistema improvisado. O que a medição mostra de sólido:

- **Tipagem:** `tsc --noEmit` retorna **0 erros** em ≈165 mil linhas, sem `any` disseminado.
- **Suíte de testes:** 3.272 de 3.276 testes passam; 233 dos 268 arquivos importam e exercitam o alvo real, incluindo testes de propriedade com `fast-check` e testes de fuzz.
- **RLS:** 714 políticas sobre 162 tabelas; apenas 2 tabelas sem RLS, e são de controle interno (`schema_migrations`, `migration_rollbacks`).
- **RBAC:** tabela de papéis separada (padrão correto), 22 rotas admin-only e 25 supervisor+admin, com guarda declarativa.
- **Concorrência:** locking otimista implementado e coberto por testes defensivos reais (Ondas 24–29).
- **Telefonia real:** `jssip` de fato integrado em `useSipCall.ts` — não é simulação.
- **IA real:** as chamadas ao Lovable AI Gateway / Gemini e ElevenLabs são requisições HTTP genuínas, com segredo próprio, não stubs.
- **Arquitetura de rotas:** 100% lazy-loaded com code splitting, 103 de 129 páginas roteadas e apenas 1 órfã real.

---

## 5. O que esta auditoria NÃO cobriu

Declarado, não escondido:

**Contabilidade completa do escopo** — 2.013 arquivos rastreados pelo Git, dos quais auditei 1.412:

| Escopo | Arquivos | Tratamento |
|---|---:|---|
| Código + configs de raiz | 1.412 | **Auditado** em 16 lotes, com evidência `arquivo:linha` |
| `covout/` + `coverage/` | 466 | **Não auditado** — saída de build versionada (ver R14) |
| `docs/` | 79 | Lido para reconciliação, não auditado como código |
| `mem/` | 44 | **Não auditado** — memória de features por onda |
| `.lovable/` | 5 | Apenas `plan.md` lido; os 4 arquivos de `memory/` não |
| Lockfiles, `README`, `SYSTEM_FEATURES` | 5 | Lidos; lockfiles analisados só quanto a registry (R12) |
| Não classificados | 2 | — |

1. **Todo o runtime do banco — `NAO_VERIFICADO`.** O MCP do Supabase retorna `No SQL transport available` e a política de rede do ambiente bloqueia o host `cfmlmcdyjuotqobjapng.supabase.co` (`502` no CONNECT, confirmado em `/__agentproxy/status`). Portanto **nada** foi verificado sobre: tabelas vazias vs. povoadas, execução e falha de jobs `pg_cron`, tráfego real de webhooks, políticas RLS efetivamente ativas, migrations aplicadas vs. versionadas, ou uso real de qualquer feature.
2. **Testes de Edge Function não foram executados** — Deno não está instalado no ambiente. Os 33 arquivos de teste Deno foram lidos, nunca rodados.
3. **Nenhum teste E2E foi executado** — exigem servidor e credenciais indisponíveis.
4. **UX e comportamento visual** — nenhuma tela foi aberta.
5. **Inventário estático de RLS é incompleto por construção:** existe uma função que reescreve políticas em runtime via `format('CREATE POLICY %I …')` (`supabase/migrations/20260711192700_…`). Qualquer contagem de políticas feita a partir do repositório é um limite inferior.
6. **Confiança parcial no lote `H2`:** a recontagem confirmou apenas 18 dos 84 arquivos citados nominalmente (o lote relata por hook-alvo, não por arquivo de teste). Suas conclusões são plausíveis mas não foram confirmadas arquivo a arquivo.
7. **Tabelas "sem consumidor" citadas apenas como string** (10 dos 23 casos) são indício, não conclusão — acesso via RPC ou nome dinâmico não é detectável estaticamente.

---

## 5b. Verificação independente (Fase D) — o que ela mudou

Esta auditoria foi executada por 16 lotes paralelos. **Relato de lote não foi aceito como evidência.** Duas verificações mudaram o resultado:

**Recontagem de cobertura.** Extraí os arquivos citados em cada saída e comparei com o manifesto: **1.163 de 1.412 arquivos (82%) citados nominalmente**. Dez lotes atingiram 100%. Seis ficaram abaixo de 90%, cada um com razão declarada e aceita:

| Lote | Cobertura nominal | Razão |
|---|---|---|
| `M1` (migrations) | 60% | Método de altitude **exigido** pelo escopo: 10 migrations lidas na íntegra, 197 por extração agregada |
| `H2` (testes de hooks) | 21% | Relata por hook-alvo, não por arquivo de teste → **confiança parcial declarada** |
| `L1` (testes de lib) | 45% | Idem — agrupa testes por alvo exercitado |
| `C4` (componentes) | 62% | Trata os 57 arquivos shadcn/ui em bloco, conforme instruído |
| `X1` (infra) | 74% | Não citados são assets e configs sem lógica (favicon, postcss) |
| `F1` (edge functions) | 89% | Não citados são testes compartilhados de `_shared` |

**Três achados foram corrigidos durante a execução** — todos teriam entrado errados no relatório:

1. **"137 componentes/páginas órfãos"** → o número real é **34**. Meu primeiro detector não reconhecia `lazy(() => import(...))` e classificou 104 páginas roteadas como mortas. É exatamente a armadilha do "candidato a remover com falso-negativo": se alguém tivesse agido sobre a primeira lista, teria apagado o sistema inteiro.
2. **"85 testes-espelho (32%)"** → o número real é **35 (13%)**. Meu regex exigia `import` e `from` na mesma linha; imports multilinha (`import {\n … \n} from "@/lib/x"`) foram lidos como ausência de import. `safe-number.test.ts` e `blf.test.ts`, acusados, importam o alvo corretamente.
3. **"459 erros de type-check"** → o real é **0**. Os erros vinham de um `bun install` incompleto no ambiente de auditoria (393 de 503 pacotes). Após `npm ci`, `tsc --noEmit` passa limpo. Era defeito do meu ambiente, não do código.

**Sete achados severos de lote foram reproduzidos por mim antes de entrar no relatório**, todos confirmados: chave `service_role` versionada, CI vermelho em 30/30, `PerformanceNarrative`/`SystemIntegrityDashboard` hardcoded, `createTestData` exposto sem guarda, tabelas `geo_*` sem migration, `setCallDbSession` nunca chamado, `ActiveCallBar` inalcançável, `src/lib/security/` sem importadores e `elevenlabs-stub` emitindo "Conectado".

---

## 5c. Auto-auditoria — erros encontrados na primeira versão deste documento

Uma segunda passagem foi feita **contra este relatório**, com dois revisores instruídos a assumir que cada afirmação estava errada até a evidência forçar o contrário. Ela encontrou seis erros meus. Os números foram corrigidos no corpo do texto; nada foi apagado sem registro.

**Cobertura da revisão adversarial, declarada:**
- **Seis afirmações sobre dado fabricado** (botão "Criar Dados", `PerformanceNarrative`, `SystemIntegrityDashboard`, "22 tabelas com RLS", `QueueTrendChart`, `setCallDbSession`) passaram por revisão adversarial completa: **3 confirmadas, 1 confirmada com atenuante de audiência, 2 exageradas. Nenhuma refutada.**
- **Cinco afirmações de segurança e infraestrutura** (chave `service_role`, `search-calls`, `src/lib/security/`, `ActiveCallBar`, guard do CI) tiveram o revisor interrompido por reinício do ambiente. **Eu mesmo reproduzi as cinco**, em momentos distintos deste trabalho: os 7 scripts com JWT `service_role` decodificado; `src/lib/security/index.ts` sem nenhum importador; `setCall` chamado uma única vez com `null`; o guard `codemod-safe-number --check` saindo com código 1; e `search-calls/index.ts` — 122 linhas, **nenhuma** checagem de autenticação, sem módulo de auth em `_shared`, enquanto outras funções do repositório fazem `supabase.auth.getUser()` e devolvem 401 (`verify-voice/index.ts:24-27`). Este último desvia do padrão estabelecido pelo próprio repositório.
- **Não passaram por revisão adversarial:** as tabelas de evidência dos 16 lotes em `docs/estado/`. Elas trazem centenas de linhas cuja verificação individual está fora do que consegui fazer; use-as como pistas com endereço, não como fatos verificados duas vezes.

### C1 — A tabela de contagem estava construída sobre a fonte errada
**Era:** uma tabela por dimensão com números como "Componentes 283 ✅ / 29 🟨". **Problema:** eu a montei a partir dos **resumos em prosa** que cada lote escreveu sobre si mesmo, e esses resumos **divergem das tabelas de evidência dos próprios lotes**. Exemplos medidos: `F1` resumiu "46 ✅ / 13 🟨 / 7 ⬛" enquanto sua tabela tem 50/13/7; `P2` resumiu "39 ✅ / 26 🟨" e sua tabela tem 47/19; `H3` resumiu 68 ✅ e sua tabela tem 72.
**Agravante:** a aritmética não fechava em 4 das 6 linhas (componentes somavam 328 sobre denominador 343; lib somava 90 sobre denominador 76).
**Corrigido:** §2 foi refeita por recontagem mecânica da coluna de classificação das tabelas de evidência. Agora fecha exatamente: 777 = 606 + 97 + 31 + 43.
**Lição:** é a mesma armadilha de "evidência fabricada em inventário anterior" que a auditoria procurou no repositório — só que um nível acima, no meu próprio consolidado.

### C2 — "181 tabelas em `types.ts`" — errado, são 159
Meu `awk` casava `^      nome: {` dentro de **todos** os blocos de `types.ts`, somando `Tables` (159) + `Views` (1) + `Functions` (21) = 181. Os lotes `M1` e `X1` haviam reportado 159 independentemente; eu publiquei o meu número em vez de investigar a divergência.

### C3 — "161 tabelas com RLS" — são 160
Meu primeiro `grep` não normalizava `IF EXISTS`/`ONLY`/aspas. A contagem correta de tabelas distintas com `ENABLE ROW LEVEL SECURITY` é **160**, o que converge com o `M1` (162 tabelas, 2 sem RLS).

### C4 — "35 testes-espelho (13%)" — são 29 (11%)
Meu detector exigia `from '@/...'` mas não reconhecia `await import('@/...')` nem `require()`. Seis arquivos foram acusados injustamente — entre eles `logger.test.ts:18` e `webrtc-config.test.ts:20`, que **carregam o alvo dinamicamente**. Este é o **segundo** erro do mesmo tipo neste trabalho: já havia acontecido com imports multilinha. Um detector de import que eu escrevo tende a subestimar as formas de importar.

### C5 — O dashboard não está em `/`
Publiquei que `PerformanceNarrative` e `QueueTrendChart` estão "no dashboard principal `/`". **`protectedRoutes.tsx:105` mapeia `/` para `PhoneDialer`; o `Index` está em `/dashboard` (`:106`).** Corrigido em todas as ocorrências. O achado permanece — o conteúdo é fabricado —, mas a rota estava errada.

### C6 — O impacto do botão "Criar Dados" estava superdimensionado
Publiquei que "qualquer usuário autenticado" pode poluir produção. **A RLS contém o dano:** a policy de INSERT vigente em `call_sessions` é `WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name))` (`20260404153900_c14f803b….sql:16-18`), e `is_active_agent` (`20260403173646_….sql:2-16`) exige que o nome esteja vinculado ao `auth.uid()` do chamador. Como `createTestData` usa nomes fixos ("Lucas Ferreira", "Ana Carolina Silva"…), **o INSERT de um agente comum é rejeitado**. Só admin e supervisor gravam de fato.
**Mas o achado não desaparece — ele muda de forma:** `useAgentRanking.ts:282` engole o erro com `continue` e `:301` exibe `toast.success('Dados de teste criados com sucesso!')` de qualquer jeito. O agente comum recebe **confirmação de sucesso sobre uma operação que a RLS rejeitou**. Continua sendo: poluição real de produção por admin/supervisor, mais feedback enganoso para todos os outros.

### C7 — Ressalva sobre `QueueTrendChart`
O `Math.random()` é real e sem qualquer fallback (`:23-24`), e o componente importa `supabase` em `:3` sem nunca usá-lo. Mas ele fica dentro de um colapsável que **inicia fechado** (`useSupervisorPanel.ts:52`), então só é montado depois que o supervisor expande "Tendência do Dia". Menos exposto do que a redação original sugeria.

---

## 6. Próximos passos

### Barato e seguro — posso executar sem tocar em produção
1. **Corrigir `src/pages/TopicDetection.tsx:100`** — mover `usePageTitle` para o topo do componente. Uma linha; fecha o último bloqueador de runtime da Onda 39.
2. **Destravar o CI — comece por uma linha.** `src/components/voice/overlay/usePhaseColors.ts:9` troca `Number.parseFloat` por `safeParseFloat` de `@/lib/safe-number`. É o que derruba o pipeline no primeiro guard e mantém tudo o mais sem execução. Depois disso, corrigir os 4 testes de `useSessionManager.coverage.test.tsx` e o segundo erro de lint (`voice-preferences.test.ts:125`), que só então passarão a ser exercitados.
3. **Alinhar a porta do Playwright** (5173 → 8080) e apontar `testDir` para incluir `e2e/`, hoje sem runner.
4. **Trocar `bun audit || true` por `bun audit`** no job `security`, que hoje é verde por construção.
5. **Adicionar `.env` ao `.gitignore`** e remover os 17 scripts órfãos que carregam segredos — nenhum é chamado por nada.
6. **Substituir os 3 painéis fabricados** por estado honesto ("sem dados") ou ligá-los a dados reais. Enquanto exibirem 10/10 fixo, mascaram regressão.
7. **Reescrever ou remover os 29 testes-espelho**, começando pelos que declaram validar segurança.
8. **Corrigir `ActiveCallBar`** — `setCall` nunca recebe valor não-nulo, o que deixa inalcançável toda a cadeia de chamada ativa (transcrição ao vivo, next-best-action, sugestões de CRM). É um fio solto, não uma reescrita.
9. **Filtrar `AppSidebar` por papel** (76 links contra 47 rotas com `roles:`), para o menu deixar de oferecer o que leva a `/unauthorized`.
10. **Corrigir `src/lib/security-report-data.ts:20`** — "22 tabelas com RLS" contra 160 reais.

### Toca produção ou é decisão sua
11. **Rotacionar a chave `service_role`** do projeto `cfmlmcdyjuotqobjapng` — está no histórico do Git; remover os arquivos não revoga a chave. **Decisão e execução são suas.**
12. **Remover os dois botões de fabricação de dados** — "Criar Dados" em `/ranking` (`AgentRanking.tsx:47`) e "Criar Testes" (`CallAlertsList.tsx:63`) — ou restringi-los a `admin` fora de produção. Decidir também se os dados já inseridos precisam ser identificados e expurgados.
13. **Escrever a migration ausente das tabelas `geo_*`** a partir do schema real — exige ler o banco, que não tenho como acessar.
14. **Decidir o destino dos cron jobs** que apontam para `dyibdjwuoibwwpidgsxu`: reapontar para o projeto correto ou remover.
15. **Adicionar checagem de autenticação em `search-calls`** e versionar `verify_jwt` por função em `supabase/config.toml`.
16. **Ligar `setCallDbSession`** no fluxo de chamada para consertar a cadeia de métricas de hold — precisa de decisão sobre os dados históricos já gravados nulos.
17. **Decidir sobre as 16 unidades dormentes:** ativar (dar-lhes consumidor) ou remover, com as tabelas correspondentes.
18. **Decidir sobre `src/lib/security/`:** ligar os 17 módulos ao pipeline real ou remover as ~700 linhas. Hoje só produzem confiança falsa.
19. **Corrigir o KPI "Efetividade %"** das recomendações VoIP, ou removê-lo: hoje mede ações que não são executadas.

---

## 7. Documentos de detalhe

As tabelas de evidência completas, por dimensão, estão em [`docs/estado/`](docs/estado/):

| Documento | Escopo |
|---|---|
| [`dados-schema-migrations.md`](docs/estado/dados-schema-migrations.md) | 207 migrations, 162 tabelas, 714 policies, 93 funções, 7 cron jobs, drift `types.ts` × migrations |
| [`edge-functions-parte1.md`](docs/estado/edge-functions-parte1.md) | 66 Edge Functions: gatilho, tabelas, segredos, segurança |
| [`edge-functions-parte2.md`](docs/estado/edge-functions-parte2.md) | 27 Edge Functions: idem |
| [`infra-ci-rotas-integracoes.md`](docs/estado/infra-ci-rotas-integracoes.md) | 104 rotas, gates do CI um a um, segredos, integrações de terceiros, scripts |
| [`hooks-parte1.md`](docs/estado/hooks-parte1.md) … [`hooks-parte4.md`](docs/estado/hooks-parte4.md) | 172 hooks de produção: consumidores, persistência, dado fictício |
| [`componentes-parte1.md`](docs/estado/componentes-parte1.md), [`parte2`](docs/estado/componentes-parte2.md), [`parte3`](docs/estado/componentes-parte3.md), [`parte4`](docs/estado/componentes-parte4.md) | 343 componentes: fonte de dados, órfãos, ações sem efeito |
| [`paginas-parte1.md`](docs/estado/paginas-parte1.md), [`parte2`](docs/estado/paginas-parte2.md) | 129 páginas: rota, papel, navegabilidade |
| [`lib-parte1.md`](docs/estado/lib-parte1.md), [`parte2`](docs/estado/lib-parte2.md) | 76 módulos de lógica + auditoria da suíte de testes |
| [`funcionalidades-planejadas.md`](docs/estado/funcionalidades-planejadas.md) | O que foi **sugerido ou planejado** × o que existe: 52 ADRs, roadmaps, pendências |
| [`integracoes.md`](docs/estado/integracoes.md) | Todas as integrações de terceiros, implementadas e planejadas |

---

## 8. Divergências encontradas na documentação existente

Conforme os guard-rails desta auditoria, **não editei** nenhum documento de outra trilha. As divergências viram linha de relatório:

| Documento | Afirma | Medição |
|---|---|---|
| `SYSTEM_FEATURES.md` | 185 itens, **todos** `[x]`; roadmap P0–P3 "✅ Concluída" | Nenhum item pendente registrado; documento datado de 2026-03-15 enquanto migrations vão até 2026-08 |
| `docs/adr/` (52 ADRs) | **Todos** "Aceito/Accepted" | Nenhum "Proposto" ou "Superado"; ADR-045 não existe (lacuna 044→046); há **dois** ADR-012 |
| `README.md` | "PermissionGate para controle granular de UI" | `src/components/auth/PermissionGate.tsx` **não tem nenhum importador** |
| `docs/audits/pendencias-2026-07.md` | Rastreia pendências com status honesto (🔴/🟢/⚪) | **É o documento mais confiável do repositório** — corresponde à realidade medida |
| `.lovable/plan.md` (Onda 39) | Bloqueador de hooks em 8 páginas | 7 corrigidas; 1 remanescente (`TopicDetection.tsx:100`) |

**Padrão observado:** os documentos que declaram conclusão são os menos precisos; o que rastreia pendências é o mais preciso. É o inverso do que a leitura casual sugere.

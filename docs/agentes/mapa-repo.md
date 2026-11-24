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
- guards do CI antes da PR: `node scripts/ci/check-claude-md-integrity.mjs`,
  `node scripts/codemod-safe-number.mjs --check`, `node scripts/guard-edge-numeric.mjs --check`.
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

## Mensagens de confirmação de sucesso (etapa 267)

Convenção para `toast.success`:

- a mensagem **descreve o que foi gravado**, não um adjetivo: `Contato criado` com o nome na descrição,
  em vez de "salvo com sucesso";
- só aparece **depois** da confirmação da gravação — `error` checado e `await` concluído;
- **nunca** dentro de `catch`: o guard `scripts/guard-supabase-error.mjs` (CI) reprova `toast.success` em `catch`;
- operação que não grava nada (conectar, abrir, copiar) não usa verbo de gravação.

Fora de escopo: reescrever em massa as mensagens antigas do sistema. As telas que o plano tocou seguem a
convenção (`useContacts`, `useRoles`, `useAgentRanking`, `UnifiedSoftphone`); telas novas já nascem assim.

## O que está sólido (para não reescrever sem motivo)

- **Tipagem:** `tsc --noEmit` passa com **0 erros** em ≈165 mil linhas, sem `any` disseminado.
- **Suíte:** 3.272 de 3.276 testes passam; 233 dos 268 arquivos exercitam o alvo real, com testes de
  propriedade (`fast-check`) e fuzz.
- **RLS/RBAC:** 714 policies; 160 tabelas com `ENABLE ROW LEVEL SECURITY` nas migrations, 159 em `types.ts`
  — fonte canônica em `docs/agentes/banco.md` §Estrutura. Sem RLS por design: `schema_migrations` e
  `migration_rollbacks`. Tabela de papéis separada, 22 rotas admin-only e 25 supervisor+admin, com guarda declarativa.
- **Concorrência:** locking otimista implementado e coberto por testes defensivos reais.
- **Roteamento:** 100% lazy-loaded com code splitting; 103 de 129 páginas roteadas, 1 órfã real.
- Os 4 testes vermelhos conhecidos estão em `src/hooks/__tests__/useSessionManager.coverage.test.tsx`
  (reproduzível em isolamento — **não é flaky**).

## Alertas derivados de métrica (etapa 246)

Regra que vale para qualquer alerta disparado a partir de um número, não de um evento: **avise na
transição, não no estado**. Um limiar é avaliado a cada leitura (realtime agrupado + rede de segurança),
então notificar sempre que `valor > limite` entrega o mesmo toast dezenas de vezes por hora e ensina o
supervisor a ignorá-lo. O desenho usado em `src/hooks/useQueueMetrics.ts` (`checkAndNotifyGoals` +
`goalStateRef`): estado anterior em `useRef` (nunca em `useState` — vira laço de re-render, ver etapa
245), aviso ao entrar em aviso/crítico, aviso de normalização na volta, e intervalo mínimo de 15 min por
meta para métrica que oscila em cima do limiar.

## Consulta periódica × aba oculta (etapa 253)

Regra: **poll de painel só com a aba visível**; `src/hooks/usePageVisibility.ts` é a fonte, e o padrão é
`const isVisible = usePageVisibility(); refetchInterval: isVisible ? N : false`. Aplicado em
`useQualityMetrics`, `useTrunkUsageMetrics`, `useVoipAnomalies`, `useAdherence` e nos cinco hooks de
`useDashboardData` (`useDashboardStats`, `useAgentsListData`, `useRecentCallsData`, `useCallVolumeData`,
`useQueueStatsData`). Antes disso só `useBlfBoard`, `useQueueMetrics`, `useExtensionsOverview` e
`useSecurityMonitoringData` respeitavam a visibilidade — num call center isso é dezenas de abas
consultando o banco sem ninguém olhando.

**Hooks que NÃO devem pausar, e por quê:**

| Hook | Por que continua rodando com a aba oculta |
|---|---|
| `useSipCall`, `useMultiChannelCall`, `useWavoipCall` | A ligação não para porque o agente trocou de aba: pausar o canal derruba o áudio e perde o evento de desligamento. |
| `useActiveCallsRealtime`, `useCallTimers`, `useHoldReminder`, `useHoldSoundAlert` | Cronômetro e alerta de espera de uma chamada **em curso**; congelar o contador enquanto o cliente espera é erro de negócio. |
| `useSessionManager` | Renovação de sessão/token — pausar derruba o login de quem voltou para a aba. |
| `useVoipQualityMonitor` | Amostra de MOS/jitter da chamada ativa; sem amostra no meio da ligação o relatório de qualidade fica cego. |

`useQueueMetrics` já resolve o caso com o poll de 60 s guardado por visibilidade (etapa 244), e o realtime
dele continua ativo — realtime não é poll.

**Monitoramento fora das páginas públicas (A-134):** `<GlobalServices />` (troncos + alertas de qualidade)
estava acima do `BrowserRouter` em `src/App.tsx`, então cada visita anônima a `/landing`, `/pricing` ou
`/login` abria um canal de realtime em `voip_trunks` e disparava
`GET /rest/v1/call_quality_metrics` — a cada 5 s, pelo `refetchInterval` do `useQualityMetrics`. Agora ele
monta **dentro** do `ProtectedRoute`, junto do `AppLayout`, e a consulta pede as colunas usadas em vez de
`select('*')`. Teste de guarda: `src/hooks/__tests__/pageVisibility.gating.test.tsx`.

## Rotas protegidas sem `roles:` (etapa 090)

**Estado em 24/11/2026** (verificado no arquivo, nao no relatorio antigo): `src/routes/protectedRoutes.tsx` tem **95 rotas**, das quais **49 declaram `roles:` e 46 nao declaram** (45 telas + o catch-all `*`). O plano (A-088) falava em 49 sem papel no momento da auditoria; entre a auditoria e hoje 3 rotas passaram a declarar papel.

Esta tabela **nao** declara papel nenhum — e insumo para a decisao. "O que a tela faz" foi derivado do codigo da tela (`usePageTitle` e os hooks que ela consome), nao do nome da rota. `sim` na coluna *Confirmar com o dono* significa que declarar o papel hoje pode tirar acesso de alguem que usa a tela.

| Rota | Componente (`src/pages/`) | O que a tela faz (derivado do codigo) | Papel minimo proposto | Confirmar com o dono |
|---|---|---|---|---|
| `/` | `PhoneDialer` | Discador com DNC, favoritos e historico proprio (`useDialerFavorites`, `useDNCCompliance`) | `agent` | nao |
| `/dashboard` | `Index` | Painel inicial do usuario; le `useDashboardData`/`useDashboardStats` e o proprio layout | `agent` | nao |
| `/onboarding` | `Onboarding` | Configuracao inicial da operacao (checklist de implantacao) | `admin` | sim |
| `/calls` | `Calls` | Central de chamadas do atendente (`useSipCall`) com registro no historico | `agent` | nao |
| `/contacts` | `Contacts` | Cadastro/consulta de contatos, sync Bitrix (`useBitrixSync`) | `agent` | nao |
| `/call-park` | `CallPark` | Estacionamento de chamadas do ramal (`useCallPark`) | `agent` | nao |
| `/blf` | `BlfBoard` | Painel de status dos ramais da equipe (`useBlfBoard`) — expoe presenca de colegas | `agent` | sim |
| `/contacts/insights` | `ContactInsights` | Insights agregados de contatos/leads (`useContactInsights`) | `supervisor` | sim |
| `/history` | `CallHistory` | Historico de chamadas do proprio atendente | `agent` | nao |
| `/call-history` | `CallHistoryAlias` | Alias de `/history`: redireciona preservando a query string (`?session=…`) | `agent` | nao |
| `/analytics` | `CallAnalytics` | Analytics agregado de chamadas da operacao | `supervisor` | nao |
| `/alerts` | `Alerts` | Central de alertas (fila, espera, sentimento) de toda a operacao | `supervisor` | sim |
| `/alert-history` | `AlertHistory` | Historico dos alertas da operacao (`useAlertHistory`) | `supervisor` | nao |
| `/ranking` | `AgentRanking` | Ranking/gamificacao entre agentes — exposicao de desempenho de colegas | `supervisor` | sim |
| `/ai` | `AIAssistant` | Assistente de IA de uso livre pelo atendente | `agent` | nao |
| `/reports` | `Reports` | Relatorios agregados de volume e desempenho | `supervisor` | nao |
| `/recordings` | `Recordings` | Escuta/download de gravacoes — inclui chamadas de outros atendentes | `supervisor` | sim |
| `/hold-metrics` | `HoldMetrics` | Metricas de tempo de espera da operacao (`useHoldMetrics`) | `supervisor` | nao |
| `/hold-alerts` | `HoldAlerts` | Alertas de espera disparados por limiar | `supervisor` | nao |
| `/hold-settings` | `HoldAlertSettings` | Define os limiares de alerta de espera (afeta a operacao inteira) | `admin` | sim |
| `/callbacks` | `Callbacks` | Fila de retornos agendados do atendente | `agent` | nao |
| `/coaching` | `Coaching` | Coaching por IA do proprio atendente — confirmar se mostra a equipe | `agent` | sim |
| `/settings` | `Settings` | Configuracoes do produto (inclui os switches da etapa 077) | `admin` | sim |
| `/notifications` | `NotificationCenter` | Central de notificacoes do proprio usuario (`useNotificationCenter`) | `agent` | nao |
| `/two-factor-auth` | `TwoFactorAuth` | Ativa/gerencia o 2FA do proprio usuario (`useMFA`) | `agent` | nao |
| `/passkeys` | `Passkeys` | Gerencia as passkeys do proprio usuario | `agent` | nao |
| `/sessions` | `SessionManagement` | Sessoes ativas (`useSessionManager`) — confirmar se lista sessoes de outros usuarios | `agent` | sim |
| `/security` | `SecurityDashboard` | Recomendacoes de seguranca da propria conta (`useSecurityDashboard`) | `agent` | nao |
| `/voicemail` | `Voicemail` | Correio de voz — confirmar se o atendente ve apenas a propria caixa | `agent` | sim |
| `/video-conference` | `VideoConference` | Salas de videoconferencia da equipe | `agent` | nao |
| `/hot-desking` | `HotDesking` | Troca de posto/ramal entre atendentes — mexe na configuracao de terceiros | `supervisor` | sim |
| `/virtual-fax` | `VirtualFax` | Envio e recebimento de fax com OCR (`useVirtualFaxOcr`) | `agent` | nao |
| `/multi-device-ring` | `MultiDeviceRing` | Toque simultaneo em varios dispositivos (`useMultiDeviceRing`), do proprio usuario | `agent` | nao |
| `/call-library` | `CallLibrary` | Busca em biblioteca de chamadas gravadas (`useCallSearch`) — conteudo de terceiros | `supervisor` | sim |
| `/deals` | `Deals` | Pipeline de oportunidades do atendente (`useDeals`) | `agent` | nao |
| `/accounts` | `Accounts` | Carteiras de Customer Success (`useAccounts`) | `agent` | nao |
| `/renewals` | `Renewals` | Pipeline de renovacoes (`useRenewals`) | `agent` | nao |
| `/success-plans` | `SuccessPlans` | Planos de sucesso por conta (`useSuccessPlans`) | `agent` | nao |
| `/learning` | `Learning` | Biblioteca de aprendizagem (`useLearning`) | `agent` | nao |
| `/meeting-summaries` | `MeetingSummaries` | Resumos de reuniao gerados por IA — confirmar se sao so as proprias reunioes | `agent` | sim |
| `/agent-assist` | `AgentAssist` | Assistencia em tempo real e objecoes durante a chamada (`useLiveAssist`) | `agent` | nao |
| `/voice-security` | `VoiceSecurity` | Biometria de voz, deteccao de fraude e redacao de audio — dado sensivel | `admin` | sim |
| `/translation-center` | `TranslationCenter` | Traducao de conversas — confirmar se alcanca conversas de outros atendentes | `agent` | sim |
| `/inbox` | `Inbox` | Inbox omnichannel (WhatsApp/chat) do atendente (`useConversations`) | `agent` | nao |
| `/knowledge` | `Knowledge` | Base de conhecimento: leitura pelo atendente; edicao de artigo pode exigir supervisor | `agent` | sim |
| `*` | `NotFound` | Catch-all 404 (`NotFound`) — nao e tela de negocio | `agent (autenticado)` | nao |

### Decisoes que voltam para o dono

17 das 46 rotas ficaram marcadas com `sim`. O agrupamento por motivo:

- **Expoe dado de terceiros** (`/recordings`, `/call-library`, `/ranking`, `/blf`, `/contacts/insights`, `/analytics` como consequencia): hoje qualquer `agent` autenticado chega nelas; a RLS e a unica barreira (A-089).
- **Mexe na operacao inteira** (`/hold-settings`, `/settings`, `/hot-desking`): mudanca de limiar, de produto ou de posto afeta quem nao esta na tela.
- **Dado sensivel** (`/voice-security`, `/sessions`, `/translation-center`, `/meeting-summaries`, `/voicemail`, `/coaching`, `/knowledge`, `/onboarding`).

### Observacoes que sairam deste levantamento

- `/history` e a rota canonica do `CallHistory`; `/call-history` e **alias** (`CallHistoryAlias`, `protectedRoutes.tsx`) que redireciona para `/history` preservando a query string — nao e mais uma segunda montagem do mesmo componente (etapa 266).
- `/dashboard` (`Index`) e `/` (`PhoneDialer`) coexistem: a raiz autenticada e o discador, e o menu aponta para `/dashboard`.
- O catch-all `*` (`NotFound`) nao deve receber `roles:`: precisa continuar acessivel a qualquer sessao autenticada.

## Cobertura de menu das rotas protegidas (etapa 265)

**Medido no arquivo em 24/11/2026**, não no relatório de agosto (que contava 15 rotas sem menu):
`src/routes/protectedRoutes.tsx` tem **95 rotas** (94 telas + o catch-all `*`), `AppSidebar.tsx` tem
**93 itens** somando os 7 grupos (`mainNavItems`, `crmNavItems`, `omnichannelNavItems`, `toolsNavItems`,
`securityNavItems`, `settingsNavItems`, `adminNavItems`), a `CommandPalette` 79 e o `MobileBottomNav` 5.

| Cruzamento | Resultado |
|---|---|
| Rotas protegidas sem item de menu | **1** — só `/call-history` |
| Itens de menu sem rota correspondente | 0 (nenhum link morto) |
| Itens de menu repetidos | 0 |
| Itens da paleta de comandos sem rota | 0 (79/79) |

### Decisão por rota (as três respostas que o plano aceita)

| Caso | Decisão | Motivo |
|---|---|---|
| 93 rotas com item de menu | **no menu** — nenhuma mudança | já era o estado do arquivo; o achado A-086 estava desatualizado |
| `/call-history` | **registrada como link direto** | alias que redireciona para `/history` preservando a query (etapa 266); o acesso real é o deep link `src/pages/CallLibrary.tsx` → `/call-history?session=…`; um item de menu seria uma segunda entrada para a mesma tela |
| Nenhuma rota | **removida** | nenhuma funcionalidade foi substituída |
| `*` | fora da conta | catch-all do `NotFound`, não é tela de negócio |

**Por que não fica só no documento:** um rota nova sem entrada de navegação volta a passar despercebida.
`src/components/layout/__tests__/AppSidebar.test.tsx` (bloco `E265`) cruza `protectedRoutes` com
`sidebarNavItems` (exportado de `AppSidebar.tsx`) e aceita rota sem menu **apenas** se ela estiver em
`DIRECT_LINK_ROUTES`; o mesmo teste exige que o link direto continue existindo como rota — quando a
etapa 266 apagar `/call-history`, o teste falha e obriga a limpar a lista.

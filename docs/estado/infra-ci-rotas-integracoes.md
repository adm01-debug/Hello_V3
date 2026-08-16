<!-- Gerado pela auditoria de estado. Fonte: lote X1. -->

> **Procedência:** lote `X1` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 64/86 arquivos citados (74%); não citados são assets e configs sem lógica (favicon, postcss).
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote X1 — Infra, CI, rotas, integrações, configuração

## Cobertura

Auditoria estática (somente leitura) dos 86 arquivos do manifesto `X1.txt`, em `/home/user/hello-v3`.
Nenhum teste, build ou script foi executado. Nenhuma documentação (`README.md`, `SYSTEM_FEATURES.md`, `docs/`, `mem/`) foi lida.

Lidos integralmente: `src/App.tsx`, `src/routes/*.tsx`, `src/main.tsx`, `.github/workflows/ci.yml`, `.github/SECURITY.md`, `playwright.config.ts`, `vitest.config.ts`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `.env.example`, `.gitignore`, `.prettierrc`, `.prettierignore`, `.editorconfig`, `i18n.json`, `components.json`, `index.html`, `package.json`, `public/*`, `supabase/.temp/*`, `supabase/config.toml`, `src/contexts/*.tsx`, `src/integrations/lovable/index.ts`, `src/integrations/supabase/client.ts`, `src/test/setup.ts`, `src/test/__mocks__/supabase.ts`, `src/__tests__/rls/*.ts`, `e2e/*.spec.ts`, `tests/e2e/**`, `scripts/codemod-safe-number.mjs`, `scripts/guard-edge-numeric.mjs`, `scripts/full-audit.sh`.

Analisados por grep agregado (sem despejo integral, conforme instrução): `src/integrations/supabase/types.ts` (7.787 linhas), `src/pages/**` (125 arquivos), `supabase/functions/**` (98 diretórios), `src/lib/**`, `src/hooks/**`, `src/components/**`.

Fora do escopo deste lote (citado apenas como evidência de acoplamento): conteúdo funcional das edge functions e dos componentes.

---

## (A) Mapa completo de rotas + páginas sem rota

### Arquitetura de roteamento

`src/App.tsx:47-100` monta um `BrowserRouter` com duas camadas:
- **Camada pública** (`src/App.tsx:52-62`): itera `publicRoutes`, cada rota envolta apenas em `<Suspense>`. Sem `ProtectedRoute`.
- **Camada protegida** (`src/App.tsx:65-96`): uma única `<Route path="/*">` envolta em `<ProtectedRoute>` → `AchievementNotificationProvider` → `AppLayout` → `<Routes>` aninhado que itera `protectedRoutes`. Rotas com `roles` recebem um **segundo** `<ProtectedRoute requiredRoles={roles}>` (`src/App.tsx:79-85`).

Consequência estrutural: a autenticação é aplicada uma vez no wrapper `/*`; a autorização por papel é aplicada por rota. Não há `ProtectedRoute` por rota pública — correto por desenho.

### Contagem

| Item | Valor | Evidência |
|---|---|---|
| Entradas em `protectedRoutes` | **93** (92 paths reais + `"*"` catch-all) | `src/routes/protectedRoutes.tsx:103-204` |
| Entradas em `publicRoutes` | **11** | `src/routes/publicRoutes.tsx:17-29` |
| **Total de entradas de rota** | **104** | — |
| Componentes de página distintos referenciados | **103** | `CallHistory` serve 2 paths (`protectedRoutes.tsx:113-114`) |
| Rotas protegidas **admin-only** | 22 | `roles: ["admin"]` |
| Rotas protegidas **supervisor+admin** | 25 | `roles: ["supervisor", "admin"]` |
| Rotas protegidas **sem `roles`** (qualquer autenticado, inclusive `viewer`) | 46 (inclui `"*"`) | ausência de `roles:` |
| Arquivos `.tsx` em `src/pages/**` (recursivo) | **125** | `find src/pages -name '*.tsx'` |
| Arquivos de página com rota | **103** | — |
| Arquivos de página sem rota | **22** | — |

> Nota: o enunciado da tarefa fala em "130 arquivos de src/pages". A contagem real é **125** arquivos `.tsx` (96 entradas no primeiro nível, sendo 91 arquivos e 5 diretórios: `admin/`, `call-analytics/`, `marketing/`, `roles/`, `two-factor/`).

### Rotas públicas (path → componente → role)

| Path | Componente | Role |
|---|---|---|
| `/login` | `pages/Login` | pública |
| `/register` | `pages/Register` | pública |
| `/forgot-password` | `pages/ForgotPassword` | pública |
| `/reset-password` | `pages/ResetPassword` | pública |
| `/verify-email` | `pages/VerifyEmail` | pública |
| `/unauthorized` | `pages/Unauthorized` | pública |
| `/landing` | `pages/marketing/Landing` | pública |
| `/pricing` | `pages/marketing/Pricing` | pública |
| `/vs/3cplus` | `pages/marketing/VsThreeCPlus` | pública |
| `/status` | `pages/Status` | pública |
| `/marketplace` | `pages/Marketplace` | pública |

Evidência: `src/routes/publicRoutes.tsx:18-28`.

### Rotas protegidas — sem exigência de papel (autenticado, qualquer role)

`src/routes/protectedRoutes.tsx:105-157`:

| Path | Componente |
|---|---|
| `/` | `PhoneDialer` |
| `/dashboard` | `Index` |
| `/onboarding` | `Onboarding` |
| `/calls` | `Calls` |
| `/contacts` | `Contacts` |
| `/call-park` | `CallPark` |
| `/blf` | `BlfBoard` |
| `/contacts/insights` | `ContactInsights` |
| `/history` | `CallHistory` |
| `/call-history` | `CallHistory` *(duplicata de componente)* |
| `/analytics` | `CallAnalytics` |
| `/alerts` | `Alerts` |
| `/alert-history` | `AlertHistory` |
| `/ranking` | `AgentRanking` |
| `/ai` | `AIAssistant` |
| `/reports` | `Reports` |
| `/recordings` | `Recordings` |
| `/hold-metrics` | `HoldMetrics` |
| `/hold-alerts` | `HoldAlerts` |
| `/hold-settings` | `HoldAlertSettings` |
| `/callbacks` | `Callbacks` |
| `/coaching` | `Coaching` |
| `/settings` | `Settings` |
| `/notifications` | `NotificationCenter` |
| `/two-factor-auth` | `TwoFactorAuth` |
| `/passkeys` | `Passkeys` |
| `/sessions` | `SessionManagement` |
| `/security` | `SecurityDashboard` |
| `/voicemail` | `Voicemail` |
| `/video-conference` | `VideoConference` |
| `/hot-desking` | `HotDesking` |
| `/virtual-fax` | `VirtualFax` |
| `/multi-device-ring` | `MultiDeviceRing` |
| `/call-library` | `CallLibrary` |
| `/deals` | `Deals` |
| `/accounts` | `Accounts` |
| `/renewals` | `Renewals` |
| `/success-plans` | `SuccessPlans` |
| `/learning` | `Learning` |
| `/meeting-summaries` | `MeetingSummaries` |
| `/agent-assist` | `AgentAssist` |
| `/voice-security` | `VoiceSecurity` |
| `/translation-center` | `TranslationCenter` |
| `/inbox` | `Inbox` |
| `/knowledge` | `Knowledge` |
| `*` (catch-all) | `NotFound` (`protectedRoutes.tsx:203`) |

### Rotas protegidas — `supervisor` + `admin`

`src/routes/protectedRoutes.tsx:139-190`:

`/battle-cards` → `BattleCards` · `/external-recordings-import` → `ExternalRecordingsImport` · `/cadences` → `Cadences` · `/trackers` → `Trackers` · `/scheduling` → `Scheduling` · `/skills` → `Skills` · `/routing-rules` → `RoutingRules` · `/sla-policies` → `SLAPolicies` · `/queue-dashboard` → `QueueMetricsDashboard` · `/call-queues` → `CallQueues` · `/ring-groups` → `RingGroups` · `/executive` → `ExecutiveDashboard` · `/queue-metrics-settings` → `QueueMetricsAlertSettings` · `/dialer` → `Dialer` · `/dialer/predictive` → `PredictiveDialer` · `/admin/voice-quality` → `admin/VoiceQuality` · `/compliance` → `Compliance` · `/outbound-compliance` → `OutboundCompliance` · `/call-flow-designer` → `CallFlowDesigner` · `/topic-detection` → `TopicDetection` · `/qr-provisioning` → `QRProvisioning` · `/network-diagnostics` → `NetworkDiagnostics` · `/concurrency-conflicts` → `ConcurrencyConflicts` · `/financial-impact` → `FinancialImpact` · `/shift-swap-suggestions` → `ShiftSwapSuggestions`

### Rotas protegidas — `admin` apenas

`src/routes/protectedRoutes.tsx:175-200`:

`/audit-logs` → `AuditLogs` · `/security-report` → `SecurityReport` · `/security-monitoring` → `SecurityMonitoring` · `/ip-whitelist` → `IPWhitelist` · `/blocked-access-logs` → `BlockedAccessLogs` · `/roles` → `Roles` · `/permissions` → `Permissions` · `/rate-limit` → `RateLimitDashboard` · `/geo-blocking` → `GeoBlocking` · `/password-reset-approval` → `PasswordResetApproval` · `/number-porting` → `NumberPorting` · `/toll-free-numbers` → `TollFreeNumbers` · `/ldap-sync` → `LDAPSync` · `/observability` → `ObservabilityDashboard` · `/admin/voip-trunks` → `admin/VoipTrunksAdmin` · `/admin/extensions` → `admin/ExtensionsAdmin` · `/admin/security-audit` → `admin/SecurityDashboard` · `/admin/data-export` → `admin/DataExport` · `/admin/database-health` → `admin/DatabaseHealth` · `/admin/security-alerts` → `admin/SecurityAlerts` · `/admin/webhook-health` → `admin/WebhookHealth` · `/admin/slo` → `admin/SloDashboard`

### Páginas sem rota (22 arquivos)

Verificação cruzada: `find src/pages -name '*.tsx'` × imports `@/pages/...` em `src/routes/*` e `src/App.tsx`, seguida de busca por imports relativos (`from './x'`).

**Órfão real — 1 arquivo:**

| Arquivo | Linhas | Imports em todo o `src/` | Classificação |
|---|---|---|---|
| `src/pages/admin/SecurityAuditDashboard.tsx` | 313 | **0** | ⬛ MORTO_OU_ABANDONADO |

Ponto crítico: a rota `/admin/security-audit` (`src/routes/protectedRoutes.tsx:193`) aponta para `SecurityAudit = lazy(() => import("@/pages/admin/SecurityDashboard"))` (`protectedRoutes.tsx:85`) — um arquivo **diferente**. `SecurityAuditDashboard.tsx` (313 linhas, com `supabase`, `recharts`, `Tabs`, filtros e export) nunca é montado por nenhuma rota nem importado por nenhum componente. É código morto compilado e type-checkado, mas inalcançável.

**Falsos positivos — 21 arquivos que são subcomponentes, não páginas** (importados por caminho relativo pela página irmã, todos ✅ IMPLEMENTADO_TOTAL e alcançáveis):

- `admin/database-health/{ActivityCards, BloatCard, DropAuditCard, IdleIndexesCard, SlowQueriesCard, TopTablesCard}` → importados por `src/pages/admin/DatabaseHealth.tsx:13` e vizinhas.
- `call-analytics/{AnalyticsHeader, CallsByDayChart, KpiCards, SentimentBreakdown, SentimentPieChart, TopTopicsList}` → `src/pages/CallAnalytics.tsx:6`.
- `marketing/MarketingLayout` → 5 importadores (`src/pages/Marketplace.tsx:1`, `src/pages/marketing/Landing.tsx:22`, etc.).
- `roles/{AddRoleDialog, RoleAuditTrail, RoleStatsCards, RolesTable}` → `src/pages/Roles.tsx:10`.
- `two-factor/{BackupCodesCard, DevicesCard, SmsCard, TotpCard}` → `src/pages/TwoFactorAuth.tsx:14`.

**Achado de organização:** 21 componentes de UI residem em `src/pages/` em vez de `src/components/`, o que corrompe qualquer métrica automática de "páginas sem rota" e infla a contagem de páginas em ~17%.

**Integridade de rotas:** nenhuma rota aponta para arquivo inexistente; nenhum `path` duplicado. Único componente reutilizado em 2 paths: `CallHistory` (`/history` e `/call-history`).

---

## (B) Auditoria do CI — gate por gate

`.github/workflows/ci.yml` tem 85 linhas, 2 jobs (`quality`, `security`).

| Gate | O que promete | O que realmente faz | Veredito |
|---|---|---|---|
| **Trigger** (`ci.yml:3-7`) `on: push/pull_request branches:[main]` | Rodar CI nas mudanças | Push em branch de trabalho **não** dispara nada. O branch atual do repo é `claude/system-status-features-boms0f` — nenhuma execução de CI cobre o trabalho em andamento. PRs *para* `main` disparam normalmente. Não há filtro `paths:`, então quando dispara, dispara para qualquer mudança. Não há `workflow_dispatch` (impossível rodar sob demanda). | 🟨 PARCIAL — cobre só o merge para `main` |
| **Guard `codemod-safe-number.mjs --check`** (`ci.yml:31-32`) | "parseInt/parseFloat proibidos fora de safe-number.ts" | O script existe (230 linhas) e o mecanismo é sério (tokenizador de strings/comentários, `computeSkipRanges`, `splitTopLevelArgs`). **Estado atual: 0 ocorrências em `src/`** — o gate passa legitimamente hoje. **Mas tem falsos-negativos estruturais** (ver abaixo). É também **redundante**: `eslint.config.js:31-41` já proíbe `parseInt`/`parseFloat`/`Number.parseInt` via `no-restricted-globals` + `no-restricted-syntax` com severidade `error`. | 🟨 PARCIAL — passa, mas com buracos |
| **Guard `guard-edge-numeric.mjs --check`** (`ci.yml:34-35`) | "Edge Functions com coerção numérica insegura" (R1 `z.number()` sem `.finite()`; R2 sem `Number(`/`parseInt(`) | Existe (206 linhas) e é exercitado por PBT (`src/lib/__tests__/guard-edge-numeric.test.ts`, fast-check). **Mas contém falso-negativo explícito e um buraco de escopo que já é violado em produção** (detalhes abaixo). | 🟨 PARCIAL — regra furada |
| **Lint** (`ci.yml:37-39`) `bun run lint` = `eslint .` | Lint do projeto | `eslint.config.js:8` ignora `dist`, `build`, `coverage`, `node_modules`, `*.config.js`, `*.config.ts` e **`supabase/**`** → as **98 edge functions nunca são lintadas**. O glob `files: ["**/*.{ts,tsx}"]` também **não cobre `scripts/*.mjs`** (19 scripts sem lint). `continue-on-error: false` é o padrão — declaração redundante. | 🟨 PARCIAL — lint cego para 2 diretórios inteiros |
| **Type-check** (`ci.yml:41-42`) `tsc --noEmit` | Type-check do projeto | `tsconfig.json:26` tem `"include": ["src"]`. Portanto **`e2e/`, `tests/`, `scripts/`, `playwright.config.ts`, `vite.config.ts` e `vitest.config.ts` nunca são type-checkados**. `tsconfig.app.json` e `tsconfig.node.json` existem mas **não são referenciados** por `tsconfig.json` (não há `"references"`) — são configs órfãs. | 🟨 PARCIAL |
| **Unit tests (Vitest)** (`ci.yml:44-47`) `bunx vitest run --coverage` | Testes unitários + thresholds de cobertura | Roda 268 arquivos de teste sob `src/**`. Thresholds 75/75/70/75 (`vitest.config.ts:28-33`) mas `coverage.include` (`vitest.config.ts:21`) restringe a medição a **`src/lib/**` e `src/hooks/**`** apenas. Ver "Cobertura mede o quê?" abaixo. | 🟨 PARCIAL — thresholds reais mas sobre 34% da superfície |
| **E2E Playwright** (`ci.yml:49-54`) | E2E real do produto | **Não pode passar.** `playwright.config.ts:11,23` aponta `baseURL`/`webServer.url` para `http://localhost:5173`; `vite.config.ts:13-14` define `server.port = 8080`. O `webServer` sobe `npm run dev` (8080) e espera 5173 → timeout. Além disso `playwright.config.ts:4` fixa `testDir: './tests/e2e'`, então **os 7 arquivos de `e2e/` (330 linhas) nunca rodam**. E `tests/e2e/auth.spec.ts:22` espera `toHaveTitle(/Freight/i)` enquanto `index.html:6` declara `CallCenter Pro` — asserção de outro produto. | ⬛ QUEBRADO |
| **Edge Function Tests (Deno)** (`ci.yml:56-61`) | `deno test -A supabase/functions/` | **Existem 40 arquivos de teste Deno** que a descoberta padrão do Deno pegaria (`*_test.ts` e `*.test.ts`), incluindo `_shared/__tests__/validate.fuzz.test.ts`, `analyze-call/__tests__/schema.property.test.ts`, `bitrix-api/index.test.ts`. Não há `deno.json`/`import_map.json` no repo — imports resolvem por URL remota (`deno.land`, `esm.sh`) a cada execução, sem lockfile: build não determinístico e dependente de rede/terceiros. | 🟨 PARCIAL — o gate tem substância, mas sem hermeticidade |
| **Build** (`ci.yml:64-65`) `vite build` | Build de produção | Funciona **porque `.env` está versionado** (ver seção C): `src/integrations/supabase/client.ts:8-12` lança exceção se `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` faltarem. Sem o `.env` commitado, o app quebraria em runtime. | ✅ passa (por motivo errado) |
| **Job `security`** (`ci.yml:75-85`) | "Security audit" | 6 linhas úteis: checkout, setup-bun, `bun audit \|\| true`. O `\|\| true` **anula qualquer resultado** — o job é verde por construção mesmo com CVE crítico. Não roda SAST, secret-scanning, `npm audit --audit-level`, CodeQL, Dependabot, nem verificação de licenças. Não valida absolutamente nada. | ⬛ TEATRO |

### Falsos-negativos dos guards (detalhado)

**`scripts/guard-edge-numeric.mjs`:**

1. **`Number.parseInt` / `Number.parseFloat` estão na allowlist** — `guard-edge-numeric.mjs:41-42` inclui `"parseInt"` e `"parseFloat"` em `ALLOW_NUMBER_MEMBERS`, e `guard-edge-numeric.mjs:136-140` faz `continue` quando o membro está na allowlist. Isso **contradiz diretamente** a regra R2 documentada no próprio cabeçalho (`guard-edge-numeric.mjs:9-11`, que lista `Number.parseInt(` e `Number.parseFloat(` como proibidos). Escrever `Number.parseInt(req.query.n)` em qualquer edge function passa no gate silenciosamente. Hoje há 0 ocorrências, mas a regra está desarmada.
2. **Só varre arquivos chamados exatamente `index.ts`** — `guard-edge-numeric.mjs:53` (`else if (entry === "index.ts")`). Qualquer `handler.ts`, `schema.ts`, `utils.ts` fica fora. Existem 2 arquivos assim hoje (`analyze-call/schema.ts`, `whatsapp-inbound/schema.ts`), ambos limpos — mas a superfície não é coberta.
3. **`_shared/` é pulado inteiro** — `guard-edge-numeric.mjs:51`. **Isto já é uma violação viva:** `supabase/functions/_shared/validate.ts:24` faz `const n = typeof value === 'number' ? value : Number(value);` — coerção crua de input externo, exatamente o que R2 proíbe, no **validador compartilhado** usado por dezenas de funções. O guard não o vê.
4. **R1 só casa a forma literal `z.number()`** — regex em `guard-edge-numeric.mjs:118`. Não pega `z.coerce.number()`, `z.number().int()` com `.finite()` ausente em outra posição da cadeia (só olha os 200 chars seguintes e exige `.finite(` **imediatamente**, `guard-edge-numeric.mjs:121-122`), nem `number()` importado nomeadamente de `zod`.
5. **Supressão inline é ampla** — `// safe-numeric-ok` (`guard-edge-numeric.mjs:157-161`) desarma a linha inteira. **Há 27 supressões ativas** em `supabase/functions/`. O gate "0 violações" é em parte um artefato de supressões, não de ausência de coerção.

**`scripts/codemod-safe-number.mjs`:**

6. **Radix custom vira falso-negativo silencioso** — `codemod-safe-number.mjs:136-141`: quando `parseInt(x, 16)` é encontrado, o script registra a razão em `reasons` e faz `continue` **sem incrementar `changes`**. Como `report.push` só ocorre se `changes > 0` (`codemod-safe-number.mjs:207-211`) e `process.exit(1)` depende de `totalChanges > 0` (`codemod-safe-number.mjs:224`), um arquivo que contenha **apenas** `parseInt(x, 16)` produz saída "✅ Nenhum parseInt/parseFloat nativo encontrado" e **exit 0**. A mensagem de sucesso é literalmente falsa nesse caso.
7. **`Number(...)` não é verificado no frontend** — o codemod só busca `parseInt|parseFloat|Number.parseInt|Number.parseFloat` (`codemod-safe-number.mjs:97`), e o ESLint idem (`eslint.config.js:31-41`). Há **124 usos de `Number(` em `src/` fora de testes**, incluindo `src/main.tsx:25-31` (`Number(detail.pending_before ?? 0)` etc., sobre payload de `CustomEvent` — input não confiável). Assimetria grave: `Number(` é proibido nas edge functions (R2) e livre no frontend.
8. **`computeSkipRanges` confunde apóstrofo em JSX com string** — `codemod-safe-number.mjs:75-84` trata qualquer `'` como abertura de string. Texto JSX do tipo `<p>It's fine</p>` inicia um "range de string" que se estende até a próxima aspa simples, engolindo código real e escondendo chamadas dentro dele. Também não trata literais de regex (`/…/`), que podem conter aspas.
9. **Escopo limitado a `src/`** — `codemod-safe-number.mjs:30` (default `--path=src`); o CI não passa `--path`. `scripts/`, `tests/`, `e2e/` não são verificados.

### Playwright: o que realmente testa

- **`webServer` configurado?** Sim (`playwright.config.ts:21-25`), com `command: 'npm run dev'`. Mas a porta esperada (5173) diverge da porta servida (8080, `vite.config.ts:14`) → **o gate não pode ficar verde**. Também há inconsistência de gerenciador: CI instala com `bun` (`ci.yml:29`) e o webServer chama `npm`.
- **`testDir: './tests/e2e'`** (`playwright.config.ts:4`) → apenas 4 specs (190 linhas) são candidatos. Os **7 specs em `e2e/`** (`calls`, `dashboard`, `extensions-management`, `login`, `observability`, `security-lockout`, `sip-flow` — 330 linhas) **estão órfãos**: nenhum runner os alcança. ⬛ MORTO_OU_ABANDONADO.
- **Dependência de credenciais**: `tests/e2e/helpers/adminSession.ts:32-49` exige `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` + (`E2E_SUPABASE_SESSION_JSON` **ou** `E2E_ADMIN_EMAIL`+`E2E_ADMIN_PASSWORD`). Nenhuma dessas duas últimas é injetada em `ci.yml` (o único `env:` do passo é `CI: true`). `tests/e2e/webhook-audit-ndjson.spec.ts:74-77` faz `test.skip()` quando não semeado → **passaria vacuamente** se o webServer subisse.
- **Specs órfãos em `e2e/` também dependem de credenciais ausentes**: `e2e/calls.spec.ts:7-8`, `e2e/dashboard.spec.ts:18-19`, `e2e/observability.spec.ts:6-7` fazem login com `process.env.TEST_USER_EMAIL || 'test@example.com'` / `TEST_USER_PASSWORD || 'testpassword123'` — fallback hardcoded que jamais autenticaria.
- **Smoke vazio confirmado**: `e2e/security-lockout.spec.ts:4-10` afirma testar "5 logins falhos disparam lockout" mas o corpo só faz `expect(count).toBeGreaterThanOrEqual(0)` — asserção que é verdadeira para **qualquer** valor, inclusive 0. `e2e/extensions-management.spec.ts:8-14` aceita `/login` **ou** `/admin/extensions` — passa nos dois desfechos opostos. `e2e/calls.spec.ts:18-24` engole o próprio `expect` num `.catch(() => expect(true).toBeTruthy())`.
- **Specs que quebrariam mesmo com servidor correto**: `tests/e2e/auth.spec.ts:22` (título `Freight` × `CallCenter Pro`), `tests/e2e/workflow.spec.ts:21-25` (navega para `/admin/security-audit` sem sessão → redirect para login → `h1` não contém "Auditoria"), `tests/e2e/performance.spec.ts:9-11` (`/calls` sem sessão → `[role="list"]` não visível).

### Cobertura: mede o quê?

**Confirmado.** `vitest.config.ts:21`: `include: ['src/lib/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}']`.

| Diretório | Arquivos-fonte | Na medição de cobertura? |
|---|---|---|
| `src/lib/**` | 75 | ✅ sim (81 arquivos de teste) |
| `src/hooks/**` | 172 | ✅ sim (171 arquivos de teste) |
| `src/components/**` + `src/pages/**` | **473** | ❌ **não** |

Os thresholds 75/75/70/75 (`vitest.config.ts:28-33`) são reais e bloqueiam o CI — mas incidem sobre **247 arquivos de 720** (~34% da superfície de `src/`). **Toda a camada de UI (473 arquivos, 66%) está fora da métrica**: um componente sem nenhum teste não move o número. A cobertura reportada não é a cobertura do produto.

**`exclude` de `*.integration.*`** (`vitest.config.ts:12`): existem **0 arquivos** correspondendo a `src/**/*.integration.{test,spec}.{ts,tsx}`. É configuração morta — não esconde nada hoje, mas é ruído que sugere uma suíte de integração que não existe. ⬛

**Testes RLS são tautológicos** (`src/__tests__/rls/`, 7 arquivos, 443 linhas): não tocam banco nem mock de PostgREST. `src/__tests__/rls/contacts.test.ts:11-17` declara `const MATRIX = {...}` e `function can(role, op) { return MATRIX[role][op]; }`, e então `contacts.test.ts:20-36` asserta que `can(...)` devolve exatamente o que `MATRIX` contém. O teste prova que um objeto literal contém os valores do próprio objeto literal. Idem `rls-policies.test.ts:28-56` (`POLICY_MATRIX` → `simulatePolicy` → asserção) e `rls-policies.test.ts:126-138` (`simulateUpload` inline, 3 linhas de `if`). Nenhuma migration em `supabase/migrations/` é lida ou comparada. Estas suítes **não podem detectar uma regressão de RLS**. ⬛ TEATRO.

---

## (C) Segredos e variáveis de ambiente

> Nenhum valor de segredo é reproduzido abaixo — apenas nomes e localizações.

### 🔴 `.env` está versionado

```
$ git ls-files .env
.env
```

O arquivo `.env` **está rastreado pelo git** e `.gitignore` **não contém nenhuma entrada `.env`** (`.gitignore:1-27` cobre apenas logs, `node_modules`, `dist`, `dist-ssr`, `*.local` e diretórios de editor). Variáveis presentes no `.env` versionado (nomes apenas): `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`.

Mitigação parcial: são as três chaves *publicáveis* do Supabase (destinadas ao bundle do cliente), não o `service_role`. **Mas** ver o achado de `scripts/` na seção F, onde chaves `service_role` e senha de superusuário Postgres **estão** versionadas.

### 🔴 Artefatos de build/cobertura versionados

`git ls-files` retorna **466 arquivos** sob `coverage/` e `covout/` (23% dos 1.994 arquivos rastreados). `.gitignore` não lista `coverage`, `covout`, `playwright-report`, `test-results`. Além do ruído, relatórios de cobertura HTML embutem o **código-fonte completo** (ex.: `covout/hooks/useGeoBlocking.ts.html`), duplicando a superfície exposta.

### `supabase/.temp/` versionado

8 arquivos rastreados (`git ls-files supabase/.temp` → 8). Expõem: `project-ref` (`cfmlmcdyjuotqobjapng`), `linked-project.json` (ref + `organization_id` + `organization_slug`), **`pooler-url`** (host, porta e usuário do pooler Postgres — falta apenas a senha), e versões exatas de GoTrue `v2.195.0`, Postgres `17.6.1.155`, Storage `v1.67.26`, REST `v14.15`. Fingerprinting de versões facilita ataque direcionado a CVEs conhecidos. 🟨

### `VITE_*` — usados em `src/` × documentados em `.env.example`

| Variável | Usos em `src/` | Em `.env.example`? | Status |
|---|---|---|---|
| `VITE_SUPABASE_URL` | 7 (`src/integrations/supabase/client.ts:5`, …) | ✅ | OK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 7 (`src/integrations/supabase/client.ts:6`, …) | ✅ | OK |
| `VITE_SUPABASE_PROJECT_ID` | 1 | ✅ | OK |
| **`VITE_TURN_URL`** | 1 | ❌ | **usada, não documentada** |
| **`VITE_TURN_USER`** | 1 | ❌ | **usada, não documentada** |
| **`VITE_TURN_CRED`** | 1 | ❌ | **usada, não documentada** (credencial de servidor TURN) |

### `Deno.env.get(...)` — usados em `supabase/functions/` × documentados

| Variável | Ocorrências | Em `.env.example`? | Observação |
|---|---|---|---|
| `SUPABASE_URL` | 101 | ❌ | injetada pela plataforma Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | 68 | ❌ | idem — **mas ver `sip-config` abaixo** |
| `SUPABASE_ANON_KEY` | 64 | ❌ | idem |
| `LOVABLE_API_KEY` | 23 | ❌ | **não documentada** — chave do AI Gateway |
| `VITE_SUPABASE_URL` | 8 | ✅ | uso de var `VITE_*` **dentro de edge function** — vazamento de convenção frontend para o backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 5 | ✅ | idem |
| `ELEVENLABS_API_KEY` | 3 | ❌ | **não documentada** |
| `RESEND_API_KEY` | 2 | ❌ | **não documentada** |
| `FROM_EMAIL` | 2 | ❌ | **não documentada** |
| `WAVOIP_TOKEN` | 1 | ❌ | **não documentada** |
| `SUPABASE_DB_URL` | 1 | ❌ | **não documentada** |
| `SIP_USERNAME` / `SIP_SERVER` / `SIP_PASSWORD` | 1 cada | ❌ | **não documentadas** (`supabase/functions/sip-config/index.ts:106-108`) |
| `MICROSOFT_TEAMS_API_KEY` | 1 | ❌ | **não documentada** |
| `ELEVENLABS_AGENT_ID` | 1 | ❌ | **não documentada** |
| `BITRIX_WEBHOOK_URL` | 1 | ❌ | **não documentada** |
| `ADMIN_EMAIL` | 1 | ❌ | **não documentada** |

**Usadas mas não documentadas — 17 nomes:** `VITE_TURN_URL`, `VITE_TURN_USER`, `VITE_TURN_CRED`, `LOVABLE_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `RESEND_API_KEY`, `FROM_EMAIL`, `WAVOIP_TOKEN`, `MICROSOFT_TEAMS_API_KEY`, `BITRIX_WEBHOOK_URL`, `ADMIN_EMAIL`, `SIP_SERVER`, `SIP_USERNAME`, `SIP_PASSWORD`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### Documentadas mas nunca usadas — 38 de 44 entradas do `.env.example`

`.env.example` tem 44 variáveis; apenas 6 aparecem em código (`VITE_SUPABASE_*` ×3 no frontend + as duas `VITE_*` reaproveitadas nas functions). As **38 restantes não têm nenhuma ocorrência** em `src/`, `supabase/functions/`, `scripts/`, `tests/` ou `e2e/`:

`NODE_ENV`, `PORT`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_VERSION`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_IDLE_TIMEOUT`, `DB_CONNECTION_TIMEOUT`, `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_QUEUE_DB`, `JWT_SECRET`, `JWT_EXPIRATION`, `JOB_ENCRYPTION_KEY`, `ALLOWED_ORIGIN`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX`, `CALLS_SERVICE_URL`, `CONTACTS_SERVICE_URL`, `EMAIL_SERVICE_API_KEY`, `EMAIL_FROM`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `DD_API_KEY`, `DD_APP_KEY`, `LOG_LEVEL`, `TEST_DATABASE_URL`, `TEST_REDIS_HOST`, `TEST_REDIS_PORT`, `FEATURE_ANALYTICS`, `FEATURE_NOTIFICATIONS`, `FEATURE_BETA_FEATURES`.

Os prefixos `NEXT_PUBLIC_*` (`.env.example:3-4`) denunciam que este `.env.example` foi copiado de um projeto **Next.js** — o projeto é Vite/React SPA. `DB_*`/`REDIS_*`/`*_SERVICE_URL` descrevem uma arquitetura de microsserviços com Postgres e Redis diretos que **não existe** neste repositório (todo o acesso a dados passa por Supabase). ⬛ MORTO — o `.env.example` é ficção herdada, o que torna impossível usá-lo como fonte de verdade de configuração.

### Outras variáveis de teste

`TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (4 usos cada, `e2e/*.spec.ts`), `TEST_SIP_NUMBER`, `TI_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SESSION_JSON` — nenhuma documentada, nenhuma injetada no CI.

### 🔴 Fallback de segredo hardcoded

`supabase/functions/sip-config/index.ts:5`:
```ts
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-key";
```
Se a variável não estiver setada, o segredo usado para operações de configuração SIP passa a ser a string literal `"fallback-key"` — em vez de falhar fechado, a função falha **aberta** com um segredo público e previsível.

---

## (D) Inventário de integrações de terceiros

`src/integrations/lovable/index.ts` (38 linhas): wrapper fino sobre `@lovable.dev/cloud-auth-js`. Expõe apenas `lovable.auth.signInWithOAuth('google'|'apple')` (`index.ts:14-36`), que delega a `lovableAuth.signInWithOAuth` e, no sucesso, injeta os tokens em `supabase.auth.setSession(result.tokens)` (`index.ts:31`). Arquivo marcado "auto-generated by Lovable. Do not modify" (`index.ts:1`).

| Integração | Onde (arquivo:linha) | Real ou stub | Segredo | Classificação |
|---|---|---|---|---|
| **Supabase** (DB/Auth/Storage/Functions) | `src/integrations/supabase/client.ts:14`; 101 usos de `Deno.env.get('SUPABASE_URL')` nas functions | **Real** — cliente tipado por `Database`, throw se env faltar (`client.ts:8-12`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | ✅ IMPLEMENTADO_TOTAL |
| **Lovable Cloud Auth (OAuth Google/Apple)** | `src/integrations/lovable/index.ts:3-36` | **Real** — chamada de SDK, troca de sessão para Supabase | gerido pelo SDK Lovable | ✅ IMPLEMENTADO_TOTAL |
| **Lovable AI Gateway → Gemini** | 20 edge functions chamam `https://ai.gateway.lovable.dev/v1/chat/completions` (ex.: `supabase/functions/ocr-virtual-fax/index.ts:53`, `whatsapp-rewrite/index.ts:83`) | **Real** — `fetch` HTTP com `Authorization: Bearer LOVABLE_API_KEY`; modelo `google/gemini-2.5-flash` | `LOVABLE_API_KEY` | ✅ IMPLEMENTADO_TOTAL |
| **Lovable AI (endpoint alternativo)** | `supabase/functions/generate-coaching/index.ts:184`, `supabase/functions/voice-command/index.ts:53` → `https://api.lovable.dev/v1/chat/completions` | **Real**, mas **host divergente** dos outros 20 (`ai.gateway.` vs `api.`) — inconsistência não explicada | `LOVABLE_API_KEY` | 🟨 IMPLEMENTADO_PARCIAL |
| **Bitrix24 (CRM)** | `supabase/functions/bitrix-api/index.ts:112` (`buildWebhookBaseUrl`), `:181` (`fetch` real dentro de `resilientCall` com retry/backoff); frontend em `src/components/settings/BitrixIntegration.tsx`, `src/components/contacts/useBitrixSync.ts` | **Real** — retorna 503 `{configured:false}` se `BITRIX_WEBHOOK_URL` ausente (`:113-127`); circuit breaker + retries (`:186-190`) | `BITRIX_WEBHOOK_URL` | ✅ IMPLEMENTADO_TOTAL |
| **Bitrix24 — fila de sincronização** | `supabase/functions/sync-crm-queue/index.ts:36-59` | **Real** — lê `crm_sync_queue`, invoca `bitrix-api`, backoff exponencial (2^n min, máx 5 tentativas) | herda `BITRIX_WEBHOOK_URL` | ✅ IMPLEMENTADO_TOTAL |
| **ElevenLabs — Speech-to-Text** | `supabase/functions/voice-transcribe/index.ts:63` (`https://api.elevenlabs.io/v1/speech-to-text`); `transcribe-recording/index.ts:45` | **Real** | `ELEVENLABS_API_KEY` | ✅ IMPLEMENTADO_TOTAL |
| **ElevenLabs — Conversational AI (token)** | `supabase/functions/elevenlabs-conversation-token/index.ts:35,49,59` | **Real** — emite token de sessão do agente | `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | ✅ IMPLEMENTADO_TOTAL |
| **ElevenLabs — WebRTC no frontend** | `src/lib/elevenlabs-stub.ts:5-22`, consumido por `src/components/calls/UnifiedSoftphone.tsx:3` | **STUB explícito** — `startSession` só emite `logger.warn('ElevenLabs not configured. Install @elevenlabs/react…')` e dispara `onConnect` como se tivesse conectado; `status` fixo em `'disconnected'`; `setVolume` é no-op. `@elevenlabs/react` **não está** em `package.json`. | — | 🟦 SUGERIDO_OU_INICIADO |
| **Microsoft Teams** (importação de gravações) | `supabase/functions/teams-fetch-recordings/index.ts:4` (`connector-gateway.lovable.dev/microsoft_teams`), `:33` (`fetch /me/joinedTeams`) | **Parcial** — a chamada ao Graph via gateway é real, mas `:59-64` admite em comentário "*this endpoint logs available teams and creates **placeholder** records*" e grava `file_path: teams-imports/${team.id}-${Date.now()}.placeholder`. Nenhuma gravação é de fato baixada. | `LOVABLE_API_KEY`, `MICROSOFT_TEAMS_API_KEY` | 🟨 IMPLEMENTADO_PARCIAL |
| **WhatsApp — inbound (webhook)** | `supabase/functions/whatsapp-inbound/index.ts:29-90`, schema em `whatsapp-inbound/schema.ts` | **Real** — valida payload, casa contato por telefone, cria/reaproveita `conversations`, roteia para agente `available` com menos conversas ativas | `SUPABASE_SERVICE_ROLE_KEY` | ✅ IMPLEMENTADO_TOTAL |
| **WhatsApp — reescrita por IA** | `supabase/functions/whatsapp-rewrite/index.ts:70,83` | **Real** (via Lovable AI Gateway) | `LOVABLE_API_KEY` | ✅ IMPLEMENTADO_TOTAL |
| **Wavoip — chamadas de voz via WhatsApp** | `supabase/functions/wavoip-call/index.ts:41-105` | **STUB** — exige `WAVOIP_TOKEN` (`:41-49`, retorna 503 sem ele) mas **`grep -c 'fetch(' == 0`**: o token nunca é usado. Todos os `case` retornam objetos fabricados: `connect` → `{connected:true}` (`:64`), `start` → `callId: 'wavoip-'+Date.now()` (`:77`), `end` → `{status:'ended'}` (`:92`), `status` → `{connected:true, status:'ready'}` (`:96`). Nenhuma chamada real acontece; a UI recebe sucesso sempre. | `WAVOIP_TOKEN` (exigido, não usado) | 🟦 SUGERIDO_OU_INICIADO |
| **Resend — e-mail transacional** | `supabase/functions/notify-new-device/index.ts:52`, `notify-blocked-ip/index.ts:48` (`https://api.resend.com/emails`) | **Real** — 2 fluxos: novo dispositivo e IP bloqueado. Fallback de remetente `security@resend.dev` (`notify-new-device/index.ts:59`) — domínio de sandbox do Resend, não entrega para terceiros em produção. | `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL` | 🟨 IMPLEMENTADO_PARCIAL |
| **OCR (fax virtual)** | `supabase/functions/ocr-virtual-fax/index.ts:53-60` | **Real** — não é OCR dedicado; usa Gemini via Lovable AI Gateway com prompt "Extraia TODO o texto do documento" | `LOVABLE_API_KEY` | ✅ IMPLEMENTADO_TOTAL |
| **SIP / VoIP (softphone)** | `src/hooks/useSipCall.ts:4` (`import JsSIP from 'jssip'`); credenciais servidas por `supabase/functions/sip-config/index.ts:106-108` | **Real** — `jssip@^3.13.6` em `package.json:72`, chunk dedicado `vendor-voip` (`vite.config.ts:44`) | `SIP_SERVER`, `SIP_USERNAME`, `SIP_PASSWORD`; TURN via `VITE_TURN_URL`/`VITE_TURN_USER`/`VITE_TURN_CRED` | ✅ IMPLEMENTADO_TOTAL (mas ver `sip-config/index.ts:5`, seção C) |
| **Videoconferência (Jitsi Meet)** | `src/pages/VideoConference.tsx:37` | **Parcial** — monta URL pública `https://meet.jit.si/<titulo>-<id8>` por concatenação de string. Sem SDK, sem JWT, sem sala privada: qualquer um que adivinhe o slug entra na reunião. | nenhum | 🟨 IMPLEMENTADO_PARCIAL |
| **Geolocalização por IP (ipapi.co)** | `src/hooks/useSessionManager.ts:61`, `src/hooks/useDeviceDetection.ts:48`, `src/pages/Login.tsx:57` | **Real** — 3 chamadas independentes ao tier gratuito, sem chave, sem cache compartilhado. Dispara na **tela de login**, ou seja, para usuário não autenticado. | nenhum | 🟨 IMPLEMENTADO_PARCIAL |
| **api.ipify.org** (fallback de IP) | `src/pages/Login.tsx:60` | **Real** — fallback quando `ipapi.co` falha | nenhum | ✅ IMPLEMENTADO_TOTAL |
| **HaveIBeenPwned (k-anonymity)** | `src/components/auth/PasswordStrength.tsx:36` (`api.pwnedpasswords.com/range/${prefix}`) | **Real** — usa range de prefixo SHA-1 (não vaza a senha) | nenhum | ✅ IMPLEMENTADO_TOTAL |
| **Twilio (HMAC)** | `supabase/functions/_shared/hmac.ts` (menção) | Apenas utilitário de assinatura; nenhuma chamada a API Twilio, nenhuma credencial Twilio no repo | — | 🟦 SUGERIDO_OU_INICIADO |
| **SMS** | — | **Não existe.** Nenhuma integração de SMS (Twilio/Zenvia/Infobip) foi encontrada, apesar de `src/pages/two-factor/SmsCard.tsx` existir na UI. | — | ⬛ inexistente no backend |
| **Storage externo (S3/R2)** | `.env.example:38-42` (`STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`) | **Nenhum consumo** — 0 ocorrências em código. Todo storage é Supabase Storage. A única URL R2 é a imagem OG estática em `index.html:15`. | — | ⬛ MORTO_OU_ABANDONADO |
| **Sentry / Datadog** | `.env.example:44-47` (`SENTRY_DSN`, `DD_API_KEY`, `DD_APP_KEY`) | **Nenhum consumo.** `src/main.tsx:5` importa `initErrorTracking` de `./lib/error-tracking` (implementação própria); nenhum SDK Sentry/Datadog em `package.json`. | — | ⬛ MORTO_OU_ABANDONADO |
| **i18n / traduções** | `i18n.json:2` declara `["en","pt-BR","es"]` | **Nenhum consumo** — `grep -rn "locales/\|i18n" src` → **0 resultados**. Só existe `public/locales/en/common.json` (11 chaves); `pt-BR` e `es` não têm arquivo. Nenhuma lib de i18n em `package.json`. A UI é hardcoded em pt-BR. | — | ⬛ MORTO_OU_ABANDONADO |

---

## (E) Objetos declarados em `types.ts`

`src/integrations/supabase/types.ts` — 7.787 linhas, arquivo gerado (`client.ts:1` "automatically generated"). Extração por grep de identificadores no nível de indentação 6 dentro de cada bloco (`Tables:` L16, `Views:` L7444, `Functions:` L7458, `Enums:` L7648, `CompositeTypes:` L7657).

### `Tables:` — **159**

`account_journey_history`, `account_lockouts`, `accounts`, `active_sessions`, `agent_badges`, `agent_devices`, `agent_goals`, `agent_ring_settings`, `agent_shifts`, `agent_skills`, `agent_trunk_assignments`, `agent_weekly_stats`, `agents`, `audit_logs`, `badges`, `barge_in_sessions`, `battle_card_triggers`, `battle_cards`, `bitrix_departments`, `bitrix_users`, `blocked_access_logs`, `bot_conversations`, `cadence_enrollments`, `cadence_steps`, `cadences`, `call_alerts`, `call_analyses`, `call_control_audit_logs`, `call_flows`, `call_key_moments`, `call_park_orbits`, `call_playlists`, `call_quality_metrics`, `call_queue_members`, `call_queues`, `call_recordings`, `call_scorecards`, `call_sessions`, `call_summaries`, `call_transcriptions`, `call_transcripts_searchable`, `call_translations`, `calling_hours_config`, `chat_sessions`, `churn_risk_signals`, `coaching_assignments`, `coaching_recommendations`, `coaching_timestamps`, `compliance_rules`, `compliance_settings`, `consent_history`, `consent_records`, `contact_alerts`, `contact_engagement_patterns`, `contact_interactions`, `contacts`, `conversation_messages`, `conversations`, `crm_field_suggestions`, `crm_sync_queue`, `cultural_hints`, `customer_journey_stages`, `dashboard_goals`, `data_lake_exports`, `deal_revenue_snapshots`, `deals`, `dialer_campaigns`, `dialer_favorites`, `dialer_queue`, `dnc_import_logs`, `dnc_list`, `email_tickets`, `email_verification_tokens`, `fraud_signals`, `geo_access_logs`, `geo_restrictions`, `geo_settings`, `goal_violations`, `hold_alert_settings`, `hold_events`, `holidays`, `hot_desking_stations`, `index_drop_audit`, `ip_whitelist`, `kb_article_history`, `kb_article_views`, `kb_articles`, `kb_categories`, `learning_completions`, `learning_modules`, `live_assist_signals`, `live_sentiment_snapshots`, `login_attempts`, `manager_alerts`, `meeting_summaries`, `notification_preferences`, `notifications`, `number_porting_requests`, `objection_library`, `optimistic_lock_conflicts`, `parked_calls`, `password_reset_requests`, `password_reset_tokens`, `performance_metrics`, `permissions`, `playlist_items`, `queue_audio_prompts`, `queue_metrics_settings`, `queue_skill_requirements`, `rate_limit_alerts`, `rate_limit_logs`, `rate_limit_settings`, `redaction_log`, `renewals`, `ring_group_members`, `ring_groups`, `rls_audit_logs`, `role_permissions`, `routing_rules`, `scheduled_callbacks`, `scorecard_criteria`, `scorecard_responses`, `scorecard_templates`, `security_alerts`, `shift_swap_suggestions`, `shift_templates`, `skills`, `sla_policies`, `success_plan_milestones`, `success_plans`, `survey_responses`, `surveys`, `system_settings`, `time_off_requests`, `toll_free_numbers`, `topic_detections`, `topic_trends`, `tracker_matches`, `trackers`, `user_allowed_ips`, `user_ip_restrictions`, `user_mfa_settings`, `user_passkeys`, `user_profiles`, `user_roles`, `video_conferences`, `virtual_fax`, `voice_prints`, `voicemail_messages`, `voip_monitoring_settings`, `voip_quality_alerts`, `voip_recommendation_actions`, `voip_trunk_health_checks`, `voip_trunk_usage_metrics`, `voip_trunks`, `webauthn_challenges`, `webhook_flush_metrics`, `webhook_secrets`, `whisper_messages`

### `Views:` — **1**

`financial_impact_daily`

> **Achado:** 159 tabelas para 1 única view. Toda agregação vive em RPC ou no cliente.

### `Functions:` — **54**

`add_to_dnc`, `apply_predictive_pacing`, `calculate_predictive_pace`, `can_access_agent_data`, `check_all_tables_rls_status`, `check_calling_hours`, `check_dnc`, `check_idle_indexes`, `check_ip_allowed`, `check_ip_in_cidr`, `check_login_lockout`, `check_rate_limit`, `check_rls_enabled`, `check_table_bloat`, `cleanup_expired_challenges`, `cleanup_old_data`, `cleanup_old_logs`, `expire_parked_calls`, `get_agent_financial_leaderboard`, `get_agent_performance`, `get_agents_with_active_calls`, `get_auth_agent_id`, `get_call_history_with_summaries`, `get_call_queues_overview`, `get_call_volume_stats`, `get_dashboard_stats`, `get_database_health_snapshot`, `get_profile_role`, `get_queue_stats`, `get_top_slow_queries`, `get_user_agent_id`, `get_user_agent_name`, `get_user_role`, `get_user_roles`, `has_permission`, `has_role`, `is_active_agent`, `is_admin`, `is_admin_or_supervisor`, `is_admin_user`, `is_supervisor`, `log_audit_event`, `log_index_drop_copy`, `log_rls_event`, `match_kb_articles`, `notify_bloat_hotspots`, `notify_idle_indexes`, `recalc_deal_health`, `record_failed_login`, `record_successful_login`, `record_trunk_usage`, `reset_public_index_stats`, `snapshot_deals_daily`, `validate_audit_insert`

> **Achado:** proliferação de predicados de papel quase-sinônimos — `is_admin`, `is_admin_user`, `is_admin_or_supervisor`, `is_supervisor`, `has_role`, `get_user_role`, `get_user_roles`, `get_profile_role`, `has_permission`. Nove funções para responder "quem é este usuário". Em políticas RLS isso é fonte clássica de divergência de autorização entre tabelas.

### `Enums:` — **2**

| Enum | Valores | Evidência |
|---|---|---|
| `app_role` | `admin`, `supervisor`, `agent`, `viewer` | `types.ts:7650` |
| `voip_provider` | `nvoip`, `directcall`, `totalvoice`, `generic`, `wavoip` | `types.ts:7651-7656` |

Ambos replicados em runtime em `export const Constants` (`types.ts:7780-7787`).

> **Divergência:** `src/contexts/AuthContext.tsx:6` declara `UserRole = 'admin'|'supervisor'|'agent'|'viewer'` — alinhado com `app_role`. Mas as rotas só usam 3 papéis: `viewer` **nunca aparece** em nenhum `roles:` de `src/routes/protectedRoutes.tsx`. Um usuário `viewer` autenticado tem acesso às **46 rotas sem `roles`**, exatamente como um `agent`. O quarto papel existe no schema e no tipo, mas é inerte no roteamento. 🟦

### `CompositeTypes:` — **0**

`types.ts:7658` → `[_ in never]: never` (bloco vazio).

**Total: 159 tabelas + 1 view + 54 funções + 2 enums + 0 tipos compostos = 216 objetos.**

---

## (F) Scripts

19 arquivos em `scripts/` (18 executáveis + 1 `.sql`).

**Quem chama o quê** (`grep -rn "scripts/"` em `.json`, `.yml`, `.sh`, `.mjs`, `.ts`, excluindo `node_modules`):
- `.github/workflows/ci.yml:32` → `codemod-safe-number.mjs`
- `.github/workflows/ci.yml:35` → `guard-edge-numeric.mjs`
- `src/lib/__tests__/guard-edge-numeric.test.ts:21` → `guard-edge-numeric.mjs` (PBT com `execSync`)
- `scripts/apply-call-volume-fix.mjs:3` → lê `fix-get-call-volume-stats.sql`
- **`package.json:6-14` tem apenas 5 scripts** (`dev`, `build`, `build:dev`, `preview`, `lint`, `lint:fix`, `type-check`) — **nenhum** aponta para `scripts/`. Não há script `test` nem `test:e2e`.

| Script | Linhas | O que faz | Quem chama | Classificação |
|---|---|---|---|---|
| `codemod-safe-number.mjs` | 230 | Codemod/verificador: reescreve `parseInt`/`parseFloat`/`Number.parse*` → `safeParseInt`/`safeParseFloat`, com tokenizador de strings/comentários e injeção de import | CI (`ci.yml:32`) | ✅ IMPLEMENTADO_TOTAL (com falsos-negativos, seção B) |
| `guard-edge-numeric.mjs` | 206 | Guard R1/R2 de coerção numérica em edge functions | CI (`ci.yml:35`) + teste PBT | 🟨 IMPLEMENTADO_PARCIAL |
| `full-audit.sh` | 26 | "Auditoria Técnica Completa" | **ninguém** | ⬛ MORTO — e enganoso |
| `fix-get-call-volume-stats.sql` | 42 | `CREATE OR REPLACE FUNCTION public.get_call_volume_stats()` | `apply-call-volume-fix.mjs:3` | 🟨 PARCIAL (só alcançável por script quebrado) |
| `apply-call-volume-fix.mjs` | 35 | Aplica o SQL acima via `pg` | **ninguém** | ⬛ MORTO — quebrado |
| `check-cfmlmc-db.mjs` | 103 | Inspeção do banco via `pg` | **ninguém** | ⬛ MORTO |
| `check-data.mjs` | 70 | Conta linhas em `contacts`/`deals`/`agents`/`call_sessions`/`performance_metrics` via REST | **ninguém** | ⬛ MORTO |
| `check-rls.mjs` | 79 | Verifica RLS via `pg` | **ninguém** | ⬛ MORTO |
| `clean-hold-events.mjs` | 66 | Limpa `hold_events` (**escrita destrutiva**) | **ninguém** | ⬛ MORTO |
| `cleanup-and-count.mjs` | 72 | Limpeza + contagem (**escrita destrutiva**) | **ninguém** | ⬛ MORTO |
| `fix-user-profile.mjs` | 79 | Corrige perfil de usuário (**escrita**) | **ninguém** | ⬛ MORTO |
| `inspect-schema.mjs` | 63 | Dump de schema via `pg` | **ninguém** | ⬛ MORTO |
| `test-api-direct.mjs` | 30 | Testa REST como anon e service_role | **ninguém** | ⬛ MORTO |
| `test-auth-flow.mjs` | 65 | Login real de `ti@promobrindes.com.br` + queries | **ninguém** | ⬛ MORTO |
| `test-authenticated-queries.mjs` | 94 | Idem, com comentário "*Como não tenho a senha…, vou usar um truque: service_role pode criar um magic link*" (`:4-5`) | **ninguém** | ⬛ MORTO |
| `test-call-volume-rpc.mjs` | 46 | Chama `get_call_volume_stats` como service_role e anon | **ninguém** | ⬛ MORTO |
| `test-dashboard-rpcs.mjs` | 27 | Chama 4+ RPCs de dashboard | **ninguém** | ⬛ MORTO |
| `test-rls-access.mjs` | 76 | Testa RLS via `pg` direto | **ninguém** | ⬛ MORTO |
| `test-validate-ip.mjs` | 50 | Testa a edge function `validate-ip`, criando usuário via signup | **ninguém** | ⬛ MORTO |

**16 dos 19 scripts (84%) são órfãos** — nenhum caller em CI, `package.json` ou outro script.

### Por que os órfãos também estão quebrados

1. **`pg` não é dependência.** 8 scripts fazem `import { Client } from 'pg'` (`check-cfmlmc-db.mjs:1`, `check-rls.mjs:1`, `clean-hold-events.mjs:1`, `cleanup-and-count.mjs:1`, `fix-user-profile.mjs:1`, `inspect-schema.mjs:1`, `test-rls-access.mjs:4`, `apply-call-volume-fix.mjs:2`). `grep -c '"pg"' package.json` → **0**. Falham com `ERR_MODULE_NOT_FOUND` na primeira linha.
2. **Caminho absoluto Windows.** `scripts/apply-call-volume-fix.mjs:3`: `readFileSync('d:\\Projetos\\hello-v3-main\\scripts\\fix-get-call-volume-stats.sql')` — inexecutável em Linux/CI/macOS. É o único consumidor de `fix-get-call-volume-stats.sql`.

### 🔴 Segredos hardcoded em `scripts/`

Os scripts órfãos **contêm segredos de produção em texto claro, versionados**:
- **Senha do superusuário Postgres** literal em `check-cfmlmc-db.mjs:7`, `check-rls.mjs:7`, `clean-hold-events.mjs:7`, `cleanup-and-count.mjs:7`, `fix-user-profile.mjs:7`, `inspect-schema.mjs:*`, `test-rls-access.mjs:*`, `apply-call-volume-fix.mjs:*` — sempre `user: 'postgres'` no host `db.cfmlmcdyjuotqobjapng.supabase.co:5432` com `ssl: { rejectUnauthorized: false }`.
- **JWT `service_role`** literal (constante `SERVICE_KEY`) em `check-data.mjs:2`, `test-api-direct.mjs:4`, `test-authenticated-queries.mjs:5`, `test-call-volume-rpc.mjs:3`, `test-dashboard-rpcs.mjs:3`. O `service_role` **bypassa toda RLS** do projeto.
- **JWT `anon`** literal em `test-api-direct.mjs:3`, `test-auth-flow.mjs:3`, `test-authenticated-queries.mjs:3`, `test-call-volume-rpc.mjs:2`, `test-dashboard-rpcs.mjs:2`, `test-rls-access.mjs:2`, `test-validate-ip.mjs:3`.
- **E-mail de usuário real** (`ti@promobrindes.com.br`) em `test-auth-flow.mjs`, `test-authenticated-queries.mjs:6`.

As claims dos JWTs mostram `exp` no ano de **2036** — chaves de vida longa. Tudo isso está no histórico do git e replicado nos 466 arquivos HTML de cobertura versionados.

### `full-audit.sh` — o script que declara vitória

26 linhas (`scripts/full-audit.sh`):
- `:7-9` — lint e type-check **comentados** ("Skip lint/type-check in this sandbox if it's too slow or noisy").
- `:14` — `bunx vitest run --reporter=verbose --passWithNoTests` — a flag `--passWithNoTests` faz a suíte passar mesmo sem nenhum teste.
- `:18-23` — `if command -v deno` … `else echo "Deno not found, skipping EF tests."` — pula silenciosamente.
- `:25` — imprime **`✅ Auditoria concluída com sucesso! Sistema 10/10.`**

Com `set -e` no topo (`:2`), a única forma de falhar é o Vitest quebrar. Um ambiente sem Deno, com lint comentado e `--passWithNoTests` imprime "10/10" tendo verificado quase nada. É a declaração de qualidade menos sustentada do repositório.

---

## Achados graves

**1. 🔴 `.env`, chaves `service_role` e senha do Postgres versionados no git.**
`git ls-files .env` retorna `.env`, e `.gitignore` (27 linhas) não contém nenhuma entrada `.env`. Pior: 5 scripts órfãos (`scripts/check-data.mjs:2`, `test-api-direct.mjs:4`, `test-authenticated-queries.mjs:5`, `test-call-volume-rpc.mjs:3`, `test-dashboard-rpcs.mjs:3`) embutem o **JWT `service_role`** — que ignora toda RLS — e 8 scripts embutem a **senha do superusuário `postgres`** do host `db.cfmlmcdyjuotqobjapng.supabase.co` (`check-cfmlmc-db.mjs:7` e irmãos), com `ssl: { rejectUnauthorized: false }`. As claims dos tokens expiram em 2036. `supabase/.temp/pooler-url` (versionado) completa a string de conexão. Além disso, **466 arquivos de relatório de cobertura** (`coverage/`, `covout/`) estão rastreados — 23% dos 1.994 arquivos do repo — e embutem o código-fonte. Rotação de credenciais e limpeza de histórico são pré-requisito de qualquer outra correção.

**2. 🔴 O gate Playwright do CI não pode passar, e 63% dos specs E2E são inalcançáveis.**
`playwright.config.ts:11,23` espera `http://localhost:5173`; `vite.config.ts:13-14` serve em `8080` — o `webServer` sobe o app e aguarda uma porta que nunca abre. Mesmo resolvido, `playwright.config.ts:4` fixa `testDir: './tests/e2e'`, deixando os **7 specs de `e2e/` (330 das 520 linhas de E2E) órfãos de qualquer runner**. Dos 4 specs alcançáveis, `tests/e2e/auth.spec.ts:22` asserta `toHaveTitle(/Freight/i)` contra um app intitulado `CallCenter Pro` (`index.html:6`) — asserção importada de outro produto; `workflow.spec.ts:21-25` e `performance.spec.ts:9-11` navegam para rotas protegidas sem sessão; e `webhook-audit-ndjson.spec.ts:74-77` faz `test.skip()` porque `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` não são injetados em `ci.yml`. Os specs órfãos são, em sua maioria, tautológicos: `e2e/security-lockout.spec.ts:9` asserta `expect(count).toBeGreaterThanOrEqual(0)` — verdade para qualquer valor; `e2e/extensions-management.spec.ts:13` aceita `/login` **ou** `/admin/extensions`, passando nos dois desfechos opostos. Não existe cobertura E2E efetiva.

**3. 🔴 Os gates de segurança e de RLS validam a si mesmos, não o sistema.**
O job `security` (`ci.yml:75-85`) inteiro é `bun audit || true` — verde por construção mesmo com CVE crítico; sem SAST, secret-scanning ou CodeQL. As 7 suítes "RLS" (`src/__tests__/rls/`, 443 linhas) não tocam banco nem migration: `contacts.test.ts:11-17` declara `const MATRIX` e `function can(role,op){return MATRIX[role][op]}`, e `:20-36` asserta que `can()` devolve o conteúdo do próprio `MATRIX` — o teste prova que um objeto literal contém seus próprios valores. `rls-policies.test.ts:28-56` repete o padrão com `POLICY_MATRIX`/`simulatePolicy`. Nenhuma regressão de política é detectável. Em paralelo, o guard `guard-edge-numeric.mjs` desarma a própria regra R2: `parseInt`/`parseFloat` estão na `ALLOW_NUMBER_MEMBERS` (`:41-42`), contradizendo o cabeçalho `:9-11`; o scanner só lê arquivos chamados `index.ts` (`:53`) e pula `_shared/` (`:51`) — onde `_shared/validate.ts:24` faz `Number(value)` sobre input externo, **uma violação viva de R2 no validador compartilhado**. Os 27 comentários `// safe-numeric-ok` espalhados pelas functions completam o quadro: o "0 violações" é resultado de exclusões, não de ausência de risco. Somado à cobertura medida apenas sobre `src/lib/**` e `src/hooks/**` (247 de 720 arquivos; os **473 arquivos de `components/` + `pages/` ficam fora**, `vitest.config.ts:21`), o CI produz um sinal verde que não corresponde a garantia alguma — e `scripts/full-audit.sh:25` chega a imprimir "✅ Sistema 10/10" com lint comentado, `--passWithNoTests` e Deno pulado.

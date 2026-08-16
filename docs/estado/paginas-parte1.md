<!-- Gerado pela auditoria de estado. Fonte: lote P1. -->

> **Procedência:** lote `P1` da auditoria de estado.
> **Recontagem de cobertura (Fase D):** 63/63 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime — nada nesta página é verificado contra produção.

# Lote P1 — src/pages (parte 1)

## Cobertura

63/63 arquivos do manifesto auditados (~11.073 linhas). Fontes de verdade lidas antes das páginas:

- `src/App.tsx:49-95` — montagem de rotas: `publicRoutes` no topo, `protectedRoutes` sob `<ProtectedRoute>` + `<AppLayout>`; roles aplicadas por rota via `<ProtectedRoute requiredRoles={roles}>` (`src/App.tsx:76-80`).
- `src/routes/protectedRoutes.tsx:103-204` — 96 rotas protegidas, todas via `lazy(() => import("@/pages/X"))`.
- `src/routes/publicRoutes.tsx:17-29` — 11 rotas públicas.
- Navegação: `src/components/layout/AppSidebar.tsx:20-107` (menu principal), `src/components/layout/CommandPalette.tsx:23-86` (paleta ⌘K), `src/components/layout/MobileBottomNav.tsx:7-11` (5 itens), `src/pages/marketing/MarketingLayout.tsx:45` (link público para Marketplace).

Resultado: **63/63 páginas do lote estão registradas em rota**. Nenhuma página órfã de rota, nenhuma página morta neste lote.

Distribuição: ✅ 49 · 🟨 14 · 🟦 0 · ⬛ 0

### Verificação anti-crash (hooks em subcomponentes aninhados)
Busca por definição de componentes dentro do corpo das páginas (`^ {2,}(const [A-Z]...=\(|function [A-Z]...\()`) e por chamadas de hook com indentação ≥4 nas 63 páginas: **nenhuma ocorrência**. Os 3 casos com indentação ≥4 (`src/pages/BlfBoard.tsx:16`, `src/pages/PhoneDialer.tsx:49`, `src/pages/QueueMetricsAlertSettings.tsx:15`) são apenas quebras de linha de destructuring no topo do componente — não há violação das Rules of Hooks neste lote.

## Tabela de funcionalidades

| Página | Classificação | Rota (arquivo:linha) | No menu? | Dado real? | Role | O que falta |
|---|---|---|---|---|---|---|
| AIAssistant.tsx | 🟨 PARCIAL | protectedRoutes.tsx:119 `/ai` | Sim (AppSidebar.tsx:35) | Parcial | qualquer | Aba "Simulação ao Vivo" usa roteiro fixo (`src/components/ai/CallSimulation.tsx:25-38`, 11 falas hardcoded). Aba "Análise" é real (edge fn `analyze-call`, `src/components/ai/AICallAnalysis.tsx:93`) |
| Accounts.tsx | 🟨 PARCIAL | protectedRoutes.tsx:144 `/accounts` | **Não** (ausente de AppSidebar e CommandPalette) | Sim (`src/hooks/useAccounts.ts:38,54,72` tabela `accounts`) | qualquer | Link no menu |
| AgentAssist.tsx | ✅ TOTAL | protectedRoutes.tsx:151 `/agent-assist` | Sim (AppSidebar.tsx:64) | Sim (`useLiveAssist.ts`, `useObjectionLibrary.ts`) | qualquer | — (somente leitura, por design) |
| AgentRanking.tsx | 🟨 PARCIAL | protectedRoutes.tsx:118 `/ranking` | Sim (AppSidebar.tsx:50) | Leitura real; escrita fictícia | qualquer | Botão "Criar Dados" (`AgentRanking.tsx:47`) grava dados aleatórios em produção — ver Achados |
| AlertHistory.tsx | ✅ TOTAL | protectedRoutes.tsx:117 `/alert-history` | Sim (AppSidebar.tsx:49) | Sim (`useAlertHistory.ts:44` `call_alerts`) | qualquer | — |
| Alerts.tsx | ✅ TOTAL | protectedRoutes.tsx:116 `/alerts` | Sim (AppSidebar.tsx:48) | Sim (`useAlerts.ts`, 20 refs supabase) | qualquer | — |
| AuditLogs.tsx | ✅ TOTAL | protectedRoutes.tsx:175 `/audit-logs` | Sim (AppSidebar.tsx:97) | Sim (`AuditLogs.tsx:4` supabase direto) | admin | — (read-only por design) |
| BattleCards.tsx | ✅ TOTAL | protectedRoutes.tsx:139 `/battle-cards` | Sim (AppSidebar.tsx:58) | Sim (CRUD `BattleCards.tsx:84,87,93,96,109`) | supervisor, admin | — |
| BlfBoard.tsx | ✅ TOTAL | protectedRoutes.tsx:111 `/blf` | Sim (AppSidebar.tsx:27) | Sim (`useBlfBoard.ts`) | qualquer | — |
| BlockedAccessLogs.tsx | ✅ TOTAL | protectedRoutes.tsx:179 `/blocked-access-logs` | Sim (AppSidebar.tsx:84) | Sim (`useBlockedAccessLogs.ts`) | admin | — |
| Cadences.tsx | 🟨 PARCIAL | protectedRoutes.tsx:142 `/cadences` | **Não** | Sim (`useCadences.ts:45,56,65,72`) | supervisor, admin | Link no menu |
| CallAnalytics.tsx | ✅ TOTAL | protectedRoutes.tsx:115 `/analytics` | Sim (AppSidebar.tsx:47) | Sim (`useCallAnalytics.ts:36,41`) | qualquer | — |
| CallFlowDesigner.tsx | ✅ TOTAL | protectedRoutes.tsx:170 `/call-flow-designer` | Sim (AppSidebar.tsx:37) | Sim (CRUD `call_flows`, linhas 200,222,233) | supervisor, admin | — |
| CallHistory.tsx | ✅ TOTAL | protectedRoutes.tsx:113 `/history` **e** :114 `/call-history` | Sim (AppSidebar.tsx:31; CommandPalette.tsx:45) | Sim (`useCallHistory.ts`) | qualquer | Rota duplicada (`/history` + `/call-history`) rotulada de forma divergente ("Histórico Completo" vs "Transcrições") |
| CallLibrary.tsx | ✅ TOTAL | protectedRoutes.tsx:138 `/call-library` | Sim (AppSidebar.tsx:57) | Sim (`useCallSearch.ts`) | qualquer | — |
| CallPark.tsx | ✅ TOTAL | protectedRoutes.tsx:110 `/call-park` | Sim (AppSidebar.tsx:26) | Sim (`useCallPark.ts`, 11 refs) | qualquer | — |
| CallQueues.tsx | ✅ TOTAL | protectedRoutes.tsx:161 `/call-queues` | Sim (AppSidebar.tsx:103) | Sim (`useCallQueues.ts`) | supervisor, admin | — |
| Callbacks.tsx | ✅ TOTAL | protectedRoutes.tsx:125 `/callbacks` | Sim (AppSidebar.tsx:43) | Sim (`ScheduledCallbacksList.tsx:37` → `useScheduledCallbacks`) | qualquer | — |
| Calls.tsx | ✅ TOTAL | protectedRoutes.tsx:108 `/calls` | Sim (AppSidebar.tsx:25) | Sim (`useSipCall.ts:4` JsSIP real, WebSocket SIP) | qualquer | — |
| Coaching.tsx | ✅ TOTAL | protectedRoutes.tsx:126 `/coaching` | Sim (AppSidebar.tsx:36) | Sim (`CoachingPanel.tsx:23` + edge fn `generate-coaching-plan`, `CoachingCopilotCard.tsx:25`) | qualquer | — |
| Compliance.tsx | ✅ TOTAL | protectedRoutes.tsx:168 `/compliance` | Sim (AppSidebar.tsx:93) | Sim (6 abas → `useDNCCompliance` etc., `DNCListManager.tsx:6`) | supervisor, admin | — |
| ConcurrencyConflicts.tsx | ✅ TOTAL | protectedRoutes.tsx:190 `/concurrency-conflicts` | Sim (AppSidebar.tsx:88) | Sim (`useOptimisticLockConflicts.ts:41` `optimistic_lock_conflicts`) | supervisor, admin | — |
| ContactInsights.tsx | ✅ TOTAL | protectedRoutes.tsx:112 `/contacts/insights` | Sim (AppSidebar.tsx:30) | Sim (`useContactInsights.ts:60` `contact_interactions`) | qualquer | — |
| Contacts.tsx | ✅ TOTAL | protectedRoutes.tsx:109 `/contacts` | Sim (AppSidebar.tsx:29) | Sim (`useContacts.ts` + `useBitrixSync`, `Contacts.tsx:29`) | qualquer | — |
| Deals.tsx | 🟨 PARCIAL | protectedRoutes.tsx:141 `/deals` | **Não** | Sim (`useDeals.ts:68,75,93` + realtime channel :61) | qualquer | Link no menu |
| Dialer.tsx | ✅ TOTAL | protectedRoutes.tsx:165 `/dialer` | Sim (AppSidebar.tsx:28) | Sim (`PredictiveDialerPanel.tsx:21` → `usePredictiveDialer`) | supervisor, admin | — |
| ExecutiveDashboard.tsx | ✅ TOTAL | protectedRoutes.tsx:163 `/executive` | Sim (AppSidebar.tsx:22) | Sim (`useExecutiveDashboard.ts`, 8 refs supabase) | supervisor, admin | — |
| ExternalRecordingsImport.tsx | 🟨 PARCIAL | protectedRoutes.tsx:140 `/external-recordings-import` | Sim (AppSidebar.tsx:59) | Parcial | supervisor, admin | Card Zoom/Google Meet é stub: `ExternalRecordingsImport.tsx:71` "Em breve" + `:75` `<Button disabled>`. Teams é real (`:20` edge fn `teams-fetch-recordings`) |
| FinancialImpact.tsx | ✅ TOTAL | protectedRoutes.tsx:194 `/financial-impact` | Sim (AppSidebar.tsx:23) | Sim (`useFinancialImpact.ts:2` + agregação real) | supervisor, admin | — |
| ForgotPassword.tsx | ✅ TOTAL | publicRoutes.tsx:20 `/forgot-password` | Link em `Login.tsx:148` e `ResetPassword.tsx:131` | Sim (edge fn `request-password-reset`, `ForgotPassword.tsx:40`) | pública | — |
| GeoBlocking.tsx | ✅ TOTAL | protectedRoutes.tsx:183 `/geo-blocking` | Sim (AppSidebar.tsx:82) | Sim (`useGeoBlocking.ts`, 9 refs) | admin | — |
| HoldAlertSettings.tsx | ✅ TOTAL | protectedRoutes.tsx:124 `/hold-settings` | Sim (AppSidebar.tsx:95) | Sim (`HoldAlertSettings.tsx:63` update) | qualquer | Rota sem restrição de role apesar de configurar alertas globais |
| HoldAlerts.tsx | ✅ TOTAL | protectedRoutes.tsx:123 `/hold-alerts` | Sim (AppSidebar.tsx:46) | Sim (`HoldAlerts.tsx:3` supabase direto) | qualquer | — |
| HoldMetrics.tsx | ✅ TOTAL | protectedRoutes.tsx:122 `/hold-metrics` | Sim (AppSidebar.tsx:45) | Sim (`useHoldMetrics.ts`) | qualquer | — |
| HotDesking.tsx | ✅ TOTAL | protectedRoutes.tsx:135 `/hot-desking` | Sim (AppSidebar.tsx:42) | Sim (`HotDesking.tsx:28,43` update `hot_desking_stations`) | qualquer | — |
| IPWhitelist.tsx | ✅ TOTAL | protectedRoutes.tsx:178 `/ip-whitelist` | Sim (AppSidebar.tsx:81) | Sim (`useIPWhitelist.ts`, 12 refs) | admin | — |
| Inbox.tsx | ✅ TOTAL | protectedRoutes.tsx:154 `/inbox` | Sim (AppSidebar.tsx:70) | Sim (`useConversations.ts`, 11 refs; `useSendMessage`) | qualquer | — |
| Index.tsx | ✅ TOTAL | protectedRoutes.tsx:106 `/dashboard` | Sim (AppSidebar.tsx:21) | Sim (`useDashboardData.ts`) | qualquer | — |
| Knowledge.tsx | ✅ TOTAL | protectedRoutes.tsx:155 `/knowledge` | Sim (AppSidebar.tsx:71) | Sim (`useKnowledgeBase.ts`, 9 refs; `useUpsertArticle`) | qualquer | — |
| LDAPSync.tsx | 🟨 PARCIAL | protectedRoutes.tsx:187 `/ldap-sync` | Sim (AppSidebar.tsx:56) | **Não — 100% fictício** | admin | Ver Achados graves #1 |
| Learning.tsx | ✅ TOTAL | protectedRoutes.tsx:149 `/learning` | Sim (AppSidebar.tsx:62) | Sim (`useLearning.ts`; `markComplete` em `Learning.tsx:59`) | qualquer | — |
| Login.tsx | ✅ TOTAL | publicRoutes.tsx:18 `/login` | Entrada pública / redirect de `ProtectedRoute` | Sim (AuthContext + lockout + IP validation) | pública | — |
| Marketplace.tsx | 🟨 PARCIAL | publicRoutes.tsx:28 `/marketplace` | Sim, só no site público (`marketing/MarketingLayout.tsx:45`); ausente do app logado | **Não** — catálogo hardcoded (`Marketplace.tsx:29-...` `const INTEGRATIONS`) | pública | Catálogo estático; status "beta"/"roadmap" não reflete estado real de integração |
| MeetingSummaries.tsx | ✅ TOTAL | protectedRoutes.tsx:150 `/meeting-summaries` | Sim (AppSidebar.tsx:63) | Sim (`useMeetingSummary.ts`, 10 refs) | qualquer | — |
| MultiDeviceRing.tsx | ✅ TOTAL | protectedRoutes.tsx:137 `/multi-device-ring` | Sim (AppSidebar.tsx:41) | Sim (`useMultiDeviceRing.ts:17,26,34` `agent_devices`/`agent_ring_settings`) | qualquer | — |
| NetworkDiagnostics.tsx | ✅ TOTAL | protectedRoutes.tsx:189 `/network-diagnostics` | Sim (AppSidebar.tsx:87) | Sim — ping real via `performance.now()` + AbortController (`useNetworkMonitor.ts:62-101`), sem Math.random | supervisor, admin | — |
| NotFound.tsx | ✅ TOTAL | protectedRoutes.tsx:203 `*` | n/a (catch-all) | n/a | qualquer | Texto em inglês ("Oops! Page not found", `NotFound.tsx:19-21`) num app pt-BR |
| NotificationCenter.tsx | ✅ TOTAL | protectedRoutes.tsx:128 `/notifications` | Sim (AppSidebar.tsx:92) | Sim (`components/notification-center/useNotificationCenter.ts`, 9 refs) | qualquer | — |
| NumberPorting.tsx | ✅ TOTAL | protectedRoutes.tsx:185 `/number-porting` | Sim (AppSidebar.tsx:53) | Sim (`NumberPorting.tsx:33` insert `number_porting_requests`) | admin | — |
| ObservabilityDashboard.tsx | ✅ TOTAL | protectedRoutes.tsx:188 `/observability` | Sim (AppSidebar.tsx:86) | Sim (edge fn `voip-load-test` :39; rpc `check_all_tables_rls_status` :55; `useHealthCheck`) | admin | — |
| Onboarding.tsx | 🟨 PARCIAL | protectedRoutes.tsx:107 `/onboarding` | **Não** | **Não** — passos hardcoded (`Onboarding.tsx:31` `const STEPS`) e progresso só em `useState` (`:73-74`), perdido no reload | qualquer | Persistência do progresso + link/redirect pós-registro |
| OutboundCompliance.tsx | ✅ TOTAL | protectedRoutes.tsx:169 `/outbound-compliance` | Sim (AppSidebar.tsx:94) | Sim (`useConsent.ts`, `useBestTimeToContact.ts`, `useCallScoring.ts:26` edge fn) | supervisor, admin | — |
| Passkeys.tsx | ✅ TOTAL | protectedRoutes.tsx:130 `/passkeys` | Sim (AppSidebar.tsx:80) | Sim (`PasskeyManager` + WebAuthn) | qualquer | — |
| PasswordResetApproval.tsx | ✅ TOTAL | protectedRoutes.tsx:184 `/password-reset-approval` | Sim (AppSidebar.tsx:83) | Sim (supabase direto) | admin | — |
| Permissions.tsx | 🟨 PARCIAL | protectedRoutes.tsx:181 `/permissions` | **Não** — sidebar só expõe `/roles` (AppSidebar.tsx:100) | Sim (`Permissions.tsx:126,134` insert/delete `role_permissions`) | admin | Link no menu (página de 318 linhas inalcançável pela navegação) |
| PhoneDialer.tsx | ✅ TOTAL | protectedRoutes.tsx:105 `/` | Sim (AppSidebar.tsx:20; MobileBottomNav.tsx:7) | Sim (`useSipCall`, `useDialerFavorites.ts`, `useMultiChannelCall`) | qualquer | — |
| PredictiveDialer.tsx | 🟨 PARCIAL | protectedRoutes.tsx:166 `/dialer/predictive` | **Não** | Sim (`PredictiveDialer.tsx:34` `dialer_campaigns`; rpc `calculate_predictive_pace` e edge fn `dialer-pacing-tick` em `usePredictivePacing.ts:24,38`) | supervisor, admin | Link no menu; página também ignora `usePageTitle` (usa `document.title` direto, `:27-29`) |
| QRProvisioning.tsx | 🟨 PARCIAL | protectedRoutes.tsx:172 `/qr-provisioning` | Sim (AppSidebar.tsx:55) | Parcial — QR real via `qrcode.react` (`:2`), mas config só em `useState` (`:46,58`), nada persistido | supervisor, admin | Persistir perfis de provisionamento; associar a ramal real |
| QueueMetricsAlertSettings.tsx | ✅ TOTAL | protectedRoutes.tsx:164 `/queue-metrics-settings` | Sim (AppSidebar.tsx:96) | Sim (`components/queue-alerts/useQueueMetricsSettings.ts`) | supervisor, admin | — |
| QueueMetricsDashboard.tsx | ✅ TOTAL | protectedRoutes.tsx:160 `/queue-dashboard` | Sim (AppSidebar.tsx:24) | Sim (`useQueueMetrics.ts`, 8 refs) | supervisor, admin | — |
| RateLimitDashboard.tsx | ✅ TOTAL | protectedRoutes.tsx:182 `/rate-limit` | Sim (AppSidebar.tsx:85) | Sim (`useRateLimitData.ts`, 9 refs) | admin | — |
| Recordings.tsx | ✅ TOTAL | protectedRoutes.tsx:121 `/recordings` | Sim (AppSidebar.tsx:44) | Sim (`useRecordings.ts`, 7 refs) | qualquer | — |
| Register.tsx | ✅ TOTAL | publicRoutes.tsx:19 `/register` | Links em `Login.tsx:174`, `VerifyEmail.tsx:183`, `marketing/Landing.tsx:369`, `marketing/Pricing.tsx:22` | Sim (`Register.tsx:45` `signUp` do AuthContext) | pública | — |

## Páginas sem rota

**Nenhuma.** As 63 páginas do manifesto estão registradas em `src/routes/protectedRoutes.tsx` ou `src/routes/publicRoutes.tsx`.

O problema análogo neste lote é **rota sem porta de entrada**: 6 páginas têm rota ativa mas nenhum link em `AppSidebar.tsx`, `CommandPalette.tsx` ou `MobileBottomNav.tsx` — só acessíveis digitando a URL:

| Página | Rota | Tamanho | Evidência de ausência |
|---|---|---|---|
| Accounts.tsx | `/accounts` (protectedRoutes.tsx:144) | 128 linhas | `grep "/accounts"` em `src/**/*.tsx` (fora de `routes/`): 0 ocorrências |
| Cadences.tsx | `/cadences` (protectedRoutes.tsx:142) | 140 linhas | idem, 0 ocorrências |
| Deals.tsx | `/deals` (protectedRoutes.tsx:141) | 145 linhas | idem, 0 ocorrências |
| Onboarding.tsx | `/onboarding` (protectedRoutes.tsx:107) | 216 linhas | idem, 0 ocorrências |
| Permissions.tsx | `/permissions` (protectedRoutes.tsx:181) | 318 linhas | idem, 0 ocorrências (sidebar só tem `/roles`, AppSidebar.tsx:100) |
| PredictiveDialer.tsx | `/dialer/predictive` (protectedRoutes.tsx:166) | 199 linhas | idem, 0 ocorrências |

Total: ~1.146 linhas de código funcional (todas com persistência real em Supabase) inalcançáveis pela navegação da aplicação.

## Achados graves

### 1. LDAPSync é uma simulação completa apresentada como funcionalidade admin
`src/pages/LDAPSync.tsx` está no menu (`AppSidebar.tsx:56`), restrita a admin (`protectedRoutes.tsx:187`), e **não fala com LDAP algum**:
- Logs de sincronização são constante importada: `LDAPSync.tsx:12` importa `MOCK_SYNC_LOGS` de `src/components/admin/ldap/types.ts:49`, atribuído em `LDAPSync.tsx:25` (`const [logs] = useState(MOCK_SYNC_LOGS)`).
- "Testar conexão" apenas dorme 2s e declara sucesso: `LDAPSync.tsx:33` `await new Promise(r => setTimeout(r, 2000));` seguido de `:34-35` `setTesting(false); toast.success('Conexão LDAP testada com sucesso!')`.
- "Sincronizar" é uma barra de progresso falsa em loop de 300ms (`:44-47`) que termina com número inventado: `:50` `toast.success('Sincronização concluída! 245 contatos atualizados.')` — o "245" é literal no código, nenhum registro é lido ou gravado.
- Zero referências a `supabase` no arquivo (confirmado por grep de imports).

Risco: um administrador crê ter importado 245 contatos do Active Directory quando nada aconteceu.

### 2. Botão de geração de dados sintéticos exposto em produção (AgentRanking)
`src/pages/AgentRanking.tsx:47` renderiza incondicionalmente `<Button variant="outline" onClick={createTestData}>Criar Dados</Button>` — sem guarda de role, sem flag de ambiente, sem confirmação. O handler grava registros aleatórios direto nas tabelas de produção (`src/hooks/useAgentRanking.ts:269-296`):
- `:269` `const numCalls = Math.floor(Math.random() * 10) + 5;`
- `:275-279` insert em `call_sessions` com `caller_name: \`Cliente ${Math.floor(Math.random() * 1000)}\``, telefone e datas aleatórios;
- `:286-291` insert em `call_summaries` com satisfação/performance aleatórias;
- `:292-296` insert em `call_analyses` com sentimento/emoção/urgência sorteados.

Como `/ranking` não tem restrição de role (`protectedRoutes.tsx:118`), **qualquer agente autenticado** pode poluir permanentemente as métricas que alimentam `/executive`, `/analytics`, `/financial-impact` e `/ranking`.

### 3. Rota duplicada com rótulos contraditórios
`CallHistory` é registrada duas vezes: `/history` (`protectedRoutes.tsx:113`) e `/call-history` (`:114`). A sidebar chama `/history` de "Histórico Completo" (`AppSidebar.tsx:31`) e a paleta de comandos chama `/call-history` de "Transcrições" (`CommandPalette.tsx:45`) — dois nomes para a mesma tela, o que sugere uma feature de transcrições planejada e nunca separada.

### 4. Configuração global sem restrição de role
`/hold-settings` (`HoldAlertSettings.tsx`, 320 linhas) está registrada **sem `roles`** (`protectedRoutes.tsx:124`) e faz `update` em configuração de alertas (`HoldAlertSettings.tsx:63`). Comparar com o par lógico `/queue-metrics-settings`, que é `["supervisor","admin"]` (`protectedRoutes.tsx:164`). Qualquer agente pode alterar limiares de alerta de espera de toda a operação.

### 5. Estado não persistido apresentado como progresso (Onboarding)
`src/pages/Onboarding.tsx:73-74` guarda o checklist em `useState<Set<string>>(new Set())` e `useState(0)`. O progresso ("X de 4 concluídos", barra em `:88`) evapora a cada reload, e a página nem sequer está no menu — não há como um cliente novo chegar nela.

### 6. Simulação hardcoded na aba padrão do Assistente IA
`AIAssistant.tsx:67` define `defaultValue="simulation"`, ou seja, a primeira coisa que o usuário vê em `/ai` é `CallSimulation`, cujo conteúdo é um diálogo fixo de 11 falas escrito no código (`src/components/ai/CallSimulation.tsx:25-38`, incluindo "CPF 123.456.789-00" e "protocolo 2024-789456"). A aba realmente funcional (`AICallAnalysis`, edge function `analyze-call` em `:93`) é a secundária.

### 7. Catálogo de integrações estático (Marketplace)
`src/pages/Marketplace.tsx:29` define `const INTEGRATIONS: Integration[]` com status `"disponivel" | "beta" | "roadmap"` escritos à mão. É uma página pública de marketing que promete integrações (ElevenLabs "beta" etc.) sem qualquer verificação contra o estado real do sistema.

### 8. `src/data/mockData.ts` (311 linhas) é código morto de produção
Nenhuma página ou componente importa esse arquivo; o único importador é `src/lib/__tests__/mock-data-integrity.test.ts:16`. Ou seja, existe um teste que valida a integridade de dados que ninguém consome. (Arquivo fora do manifesto P1, registrado aqui por relevância.)

## Integrações de terceiros observadas

| Integração | Onde | Evidência | Estado |
|---|---|---|---|
| Supabase (DB, Auth, Storage, Edge Functions) | espinha dorsal de todo o lote | `@/integrations/supabase/client` em ~50 hooks/páginas | Real |
| JsSIP / WebRTC (SIP softphone) | `Calls.tsx`, `PhoneDialer.tsx` | `src/hooks/useSipCall.ts:4` `import JsSIP from 'jssip'`; `:153` `new JsSIP.WebSocketInterface(wsServer)`; `:162` `new JsSIP.UA(...)`; failover de trunk em `:145` | Real |
| Bitrix24 (CRM) | `Contacts.tsx:29` | `import { useBitrixSync } from '@/components/contacts/useBitrixSync'` | Real (hook de sync) |
| Microsoft Teams (importação de gravações) | `ExternalRecordingsImport.tsx:20` | `supabase.functions.invoke('teams-fetch-recordings')` | Real (requer conector ativo, `:59`) |
| Zoom / Google Meet | `ExternalRecordingsImport.tsx:69-75` | "Em breve. Requer configuração OAuth dedicada." + `<Button disabled>` | **Não implementado** |
| Lovable Auth (OAuth Google) | `Login.tsx:17,166` | `lovable.auth.signInWithOAuth("google", ...)`; pasta `src/integrations/lovable/` | Real |
| LDAP / Active Directory | `LDAPSync.tsx` | nenhuma chamada de rede; `MOCK_SYNC_LOGS` + `setTimeout` | **Fictício** (Achado #1) |
| Edge Functions de IA | várias | `analyze-call` (`AICallAnalysis.tsx:93`), `generate-coaching-plan` (`CoachingCopilotCard.tsx:25`), `score-call-attempt` (`useCallScoring.ts:26`), `compute-deal-health` (`useDeals.ts:93`), `dialer-pacing-tick` (`usePredictivePacing.ts:38`), `voip-load-test` (`ObservabilityDashboard.tsx:39`), `request-password-reset` (`ForgotPassword.tsx:40`) | Real (invocações; implementação server-side fora do escopo P1) |
| Recharts (gráficos) | 8 páginas | `AlertHistory.tsx:12`, `BlockedAccessLogs.tsx:10`, `ConcurrencyConflicts.tsx:7`, `ContactInsights.tsx:13`, `FinancialImpact.tsx:12`, `HoldMetrics.tsx:9`, `NetworkDiagnostics.tsx:7`, `QueueMetricsDashboard.tsx:7`, `RateLimitDashboard.tsx:9` | Real |
| qrcode.react | `QRProvisioning.tsx:2` | `import { QRCodeSVG } from 'qrcode.react'` | Real (geração client-side) |
| @dnd-kit (dashboard arrastável) | `Index.tsx:22-23` | `DndContext`, `SortableContext` | Real |
| Navigator Network Information API | `NetworkDiagnostics.tsx` | `useNetworkMonitor.ts:46` `(navigator as ...).connection`; ping real em `:76-101` | Real |

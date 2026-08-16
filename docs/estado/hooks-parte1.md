<!-- Gerado pela auditoria de estado. Fonte: lote H1. -->

> **Procedência:** lote `H1` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 78/78 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote H1 — src/hooks (parte 1)

## Cobertura (arquivos lidos; declare os não lidos e por quê)

**Escopo real do lote:** os 78 arquivos do manifesto `H1.txt` são **todos** arquivos de teste
(`src/hooks/__tests__/*`), somando exatamente 11.029 linhas. Não há nenhum hook de produção no
manifesto. Portanto o lote foi auditado como **suíte de testes**, e cada teste foi rastreado até o
hook de produção que ele alega cobrir (esses hooks foram lidos fora do manifesto, como evidência de
apoio).

**Lidos integralmente (extração de imports/mocks + varredura de padrões):** os 78 arquivos do
manifesto, via extração programática de `import ... from '...'` multilinha, `vi.mock('...')`,
`await import('...')` e `require('...')`, mais varredura de `.skip/.only/.todo/xit/xdescribe`,
`Math.random`, `TODO|FIXME|XXX|HACK|stub` e contagem de asserções triviais.

**Lidos em profundidade (corpo do arquivo):** os 11 testes-espelho
(`useAlertSoundAndNotifications`, `useAuthAndDataIntegrity`, `useBusinessLogic`,
`useCallSession.test.ts`, `useCoachingAndRecording`, `useComprehensive`, `useContactsAndCompliance`,
`useDeviceAndSecurity`, `useEdgeFunctionIntegrity`, `useEdgeFunctions`,
`useGamificationAndCallbacks`), mais `useAdherence.test.tsx`, `useContactAlerts.coverage.test.tsx`,
`useAgentRanking.coverage.test.tsx` (trecho 150-177).

**Lidos fora do manifesto (fonte de verdade para classificar cada funcionalidade):**
`src/hooks/useAgentRanking.ts` (235-314), `useAnomalyRemediation.ts`, `useCallTransfer.ts` (1-40),
`useAdherence.ts`, `useAuth.ts` (1-40), `src/pages/AgentRanking.tsx` (35-60),
`src/integrations/supabase/types.ts` (grep de existência de tabelas), `supabase/functions/` (ls).

**Não lidos:** `README.md`, `SYSTEM_FEATURES.md`, `docs/`, `mem/` — proibidos pela regra 2.
Nenhum teste foi executado (regra 5); nenhuma afirmação sobre passar/falhar é feita.

### Método de detecção de consumidor (patterns testados)

Para cada hook foram testados **três** padrões independentes, e só declarei órfão quando os três
falharam:

1. `from '@/hooks/X'` **ou** `from '../X'` **ou** `from './X'` — grep sobre o *token do caminho*,
   não sobre a instrução inteira, logo **imports multilinha são capturados** (o `from '...'` pode
   estar em qualquer linha).
2. `import('@/hooks/X')` — cobre `lazy(() => import("@/hooks/X"))` e import dinâmico.
3. Grep do **identificador nu** (`useChatbot`, `usePlaylistItems`, …) em todo `src/`, excluindo
   `__tests__` e o próprio arquivo do hook — cobre barris, re-exports e `import * as`.

Verifiquei ainda que **não existe `src/hooks/index.ts`/`index.tsx`** (sem barril), o que elimina a
hipótese de re-export indireto.

---

## Tabela de funcionalidades

Legenda da coluna *Consumidor*: arquivo de produção (fora de `__tests__`) que importa o alvo.

### A) Hooks com lógica + persistência + consumidor real e teste que importa o alvo

| Funcionalidade | Classificação | Evidência (arquivo:linha) | Consumidor | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| useIsMobile (use-mobile) | ✅ IMPLEMENTADO_TOTAL | `src/hooks/use-mobile.tsx:9` (matchMedia); teste importa alvo em `src/hooks/__tests__/use-mobile.coverage.test.tsx:3` | `src/components/ui/sidebar.tsx` | — (browser API) | Teste mocka supabase/sonner sem necessidade (ruído) |
| use-toast | ✅ IMPLEMENTADO_TOTAL | `src/hooks/use-toast.ts:1`; teste `use-toast.coverage.test.tsx:3` importa `useToast, toast, reducer` | `src/components/ui/use-toast.ts`, `toaster.tsx` | — (estado local) | — |
| useAccounts | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAccounts.ts:1`; testes `useAccounts.coverage.test.tsx:3` e `useAccounts.test.ts:3` | `src/pages/Accounts.tsx` | `accounts`; edge `compute-account-health`, `detect-churn-risk` | Dois testes para o mesmo hook (duplicação) |
| useAchievementNotifications | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAchievementNotifications.ts:1`; teste `useAchievementNotifications.coverage.test.tsx:3` | `src/components/gamification/AchievementNotificationProvider.tsx` | `agents`, `badges`; realtime `badge-achievements`, `goal-achievements` | — |
| useActiveCallsRealtime | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useActiveCallsRealtime.ts:1`; teste `useActiveCallsRealtime.coverage.test.tsx:3` | `src/components/dashboard/ActiveCallsRealtime.tsx` | `call_sessions`, `hold_events`; canal `active-calls-realtime` | — |
| useAgentStatus | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAgentStatus.ts:1`; teste `useAgentStatus.coverage.test.tsx:3` | `AchievementNotificationProvider.tsx`, `UnifiedSoftphone.tsx`, `CoachingPanel.tsx`, `pages/AgentRanking.tsx` | `agents`; canal `agents-status` | — |
| useAlertHistory | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAlertHistory.ts:1`; teste `useAlertHistory.coverage.test.tsx:3` (`@/hooks/useAlertHistory`) | `src/pages/AlertHistory.tsx` | `call_alerts` | — |
| useAlerts | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAlerts.ts:1`; teste `useAlerts.coverage.test.tsx:3` | `UnifiedNotificationDropdown.tsx`, `pages/Alerts.tsx` | `call_alerts`, `call_sessions`, `contact_alerts`; edge `check-contact-alerts` | — |
| useAlertsExport | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAlertsExport.ts:81` (`from("notifications")`); teste `useAlertsExport.test.ts:3` | `src/pages/admin/SecurityAlerts.tsx` | `notifications`; libs `security-alerts-export/-webhook/-webhook-queue` | — |
| useAnimatedCounter | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAnimatedCounter.ts:1`; teste `useAnimatedCounter.coverage.test.tsx:3` | `src/components/dashboard/StatsCard.tsx` | — (rAF) | — |
| useAnomalyRemediation | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAnomalyRemediation.ts:40` invoca `voip-anomaly-remediation`; teste `useAnomalyRemediation.coverage.test.tsx:3` | `src/components/network/AnomalyDetectionCard.tsx` | edge `voip-anomaly-remediation` (existe em `supabase/functions/`) | — |
| useAudioOutputDevices | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAudioOutputDevices.ts:29` (`navigator.`), `:36` (localStorage); teste `useAudioOutputDevices.test.tsx:4` | `WebRTCCall.tsx`, `AudioOutputSelector.tsx` | — (mediaDevices + localStorage) | — |
| useAuditLog | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAuditLog.ts` rpc `log_audit_event`; teste `useAuditLog.coverage.test.tsx:3` | `CoachingPanel.tsx`, `ContactDetailSheet.tsx`, `useRecordings.ts`, `useCallHistory.ts` | rpc `log_audit_event` | — |
| useAuth | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useAuth.ts:11` compõe `auth/useAuthState|Profile|Session|Actions`; teste `useAuth.coverage.test.tsx:3` importa o alvo e mocka só as dependências | 11 consumidores (`contexts/AuthContext.tsx`, `routes/protectedRoutes.tsx`, 6 páginas, …) | Supabase Auth (`onAuthStateChange`) | — |
| useBattleCardDetection | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useBattleCardDetection.ts:1`; teste `useBattleCardDetection.test.ts:4` | `LiveTranscription.tsx`, `BattleCardAlert.tsx` | `battle_cards`, `battle_card_triggers` | — |
| useBestTimeToContact | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useBestTimeToContact.ts:1`; teste `useBestTimeToContact.coverage.test.tsx:3` | `src/pages/OutboundCompliance.tsx` | `contact_engagement_patterns`; edge `compute-best-time` | — |
| useBitrix | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useBitrix.ts:1`; testes `useBitrix.coverage.test.tsx:3` e `useBitrixAndWebAuthn.test.ts:4` | `components/contacts/useBitrixSync.ts`, `settings/BitrixIntegration.tsx` | `bitrix_departments`, `bitrix_users`, `crm_sync_queue`; edge `bitrix-api` | — |
| useWebAuthn | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useWebAuthn.ts:1`; teste `useBitrixAndWebAuthn.test.ts:5` | `PasskeyLogin.tsx`, `PasskeyManager.tsx` | `user_passkeys`, `user_profiles`, `webauthn_challenges`; edge `webauthn-authenticate` | — |
| useBlockedAccessLogs | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useBlockedAccessLogs.ts:1`; teste `useBlockedAccessLogs.coverage.test.tsx:3` | `src/pages/BlockedAccessLogs.tsx` | `blocked_access_logs` | — |
| useCallAnalytics | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallAnalytics.ts:1`; teste `useCallAnalytics.coverage.test.tsx:3` | `pages/call-analytics/AnalyticsHeader.tsx`, `pages/CallAnalytics.tsx` | `call_sessions`, `call_summaries` | — |
| useCallHistory | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallHistory.ts:1`; teste `useCallHistory.coverage.test.tsx:3` | `CallDetailDialog.tsx`, `CallSessionsList.tsx`, `PhoneDialer.tsx`, `CallHistory.tsx` | `call_analyses`, `call_summaries`, `call_transcriptions`; rpc `get_call_history_with_summaries` | — |
| useCallRecording | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallRecording.ts:1`; teste `useCallRecording.coverage.test.tsx:3` | `src/hooks/useConferenceRecording.ts` | `call_recordings` | Consumidor é outro hook; cadeia termina em `UnifiedSoftphone.tsx` |
| useCallScoring | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallScoring.ts:1`; teste `useCallScoring.coverage.test.tsx:3` | `src/pages/OutboundCompliance.tsx` | edge `score-call-attempt` | — |
| useCallSearch | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallSearch.ts:1`; teste `useCallSearch.test.ts:4` | `src/pages/CallLibrary.tsx` | edge `search-calls` | — |
| useCallSession | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallSession.ts:1`; teste real `useCallSession.coverage.test.tsx:4` | `src/components/calls/ActiveCallBar.tsx` | `call_sessions`, `call_analyses`, `call_summaries`, `call_transcriptions`, `call_transcripts_searchable`; edge `analyze-talk-ratio`, `detect-key-moments`, `generate-meeting-summary` | O segundo arquivo `useCallSession.test.ts` é teste-espelho (ver seção C) |
| useCallTimers | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallTimers.ts:1`; teste `useCallTimers.coverage.test.tsx:3` | `src/hooks/useMultiChannelCall.ts` | — (timers) | — |
| useCallTransfer | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCallTransfer.ts:7` (lógica pura de estado, sem Supabase); teste `useCallTransfer.coverage.test.tsx:3` | `src/hooks/useMultiChannelCall.ts` | — (estado em memória) | Transferência **não persiste** nem sinaliza PBX: só muda estado local (`useCallTransfer.ts:16-33`) |
| useCoaching | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCoaching.ts:1`; teste `useCoaching.coverage.test.tsx:3` | `src/components/coaching/CoachingPanel.tsx` | `coaching_recommendations`; canal `coaching-updates`; edge `generate-coaching` | — |
| useConferenceRecording | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useConferenceRecording.ts:1` (delega a `useCallRecording`); teste `useConferenceRecording.coverage.test.tsx:3` | `src/components/calls/UnifiedSoftphone.tsx` | via `useCallRecording` → `call_recordings` | Teste mocka `../useCallRecording`, então a persistência não é exercida aqui |
| useConsent | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useConsent.ts:1`; teste `useConsent.coverage.test.tsx:5` | `src/pages/OutboundCompliance.tsx` | `consent_records`; edge `record-consent` | — |
| useContactAlerts | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useContactAlerts.ts:1`; teste `useContactAlerts.coverage.test.tsx:49` (mock encadeável) | `UnifiedNotificationDropdown.tsx`, `ContactAlertsDropdown.tsx` | `contact_alerts`; canal `contact-alerts-changes`; edge `check-contact-alerts` | — |
| useContactInsights | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useContactInsights.ts:1`; teste `useContactInsights.coverage.test.tsx:3` | `src/pages/ContactInsights.tsx` | `contact_interactions` | — |
| useContacts | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useContacts.ts:1`; testes `useContacts.coverage.test.tsx:3` e `useContacts.conflict.test.ts:4` | 12 consumidores (`pages/Contacts.tsx`, `ContactGrid.tsx`, `ActiveCallBar.tsx`, …) | `contacts`, `contact_interactions` | — |
| useConversations (+ useConversationMessages/useSendMessage/useUpdateConversation) | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useConversations.ts:1`; teste `useConversations.coverage.test.tsx:5` importa os 4 exports | `pages/Inbox.tsx:17-19,68-70`, `executive/OmnichannelCard.tsx` | `conversations`, `conversation_messages`; canal `conversations-realtime` | — |
| useCriticalAlertNotifications | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCriticalAlertNotifications.ts:1`; teste `useCriticalAlertNotifications.coverage.test.tsx:3` | `AlertSoundSettings.tsx`, `SoundProfileManager.tsx`, `useSupervisorPanel.ts` | canal `critical-alerts-notifications` | — |
| useCrmFieldSuggestions | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCrmFieldSuggestions.ts:1`; teste `useCrmFieldSuggestions.coverage.test.tsx:5` | `src/components/calls/CrmSuggestionsCard.tsx` | `crm_field_suggestions`, `contacts`; edge `extract-crm-fields` | — |
| useCulturalHints | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useCulturalHints.ts:1`; teste `useCulturalHints.coverage.test.tsx:3` | `src/components/translation/LiveTranslationPanel.tsx` | `cultural_hints` | — |
| useDNCCompliance | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDNCCompliance.ts:1`; teste `useDNCCompliance.coverage.test.tsx:5` | `ComplianceSettings.tsx`, `DNCListManager.tsx` | `dnc_list`, `compliance_settings`, `calling_hours_config`; rpc `add_to_dnc`, `check_calling_hours`, `check_dnc` | — |
| useDashboardData (5 hooks) | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDashboardData.ts:1`; teste `useDashboardData.coverage.test.tsx:4` importa os 5 exports | `pages/Index.tsx`, `pages/Reports.tsx`, 4 componentes de dashboard | `call_sessions`; rpc `get_dashboard_stats`, `get_agents_with_active_calls`, `get_call_volume_stats`, `get_queue_stats` | — |
| useDashboardGoals | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDashboardGoals.ts:1`; teste `useDashboardGoals.coverage.test.tsx:4` | `src/components/dashboard/DashboardGoalsSettings.tsx` | `dashboard_goals` | — |
| useDashboardLayout | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDashboardLayout.ts:34` (localStorage); teste `useDashboardLayout.coverage.test.tsx:3` | `WidgetLibrary.tsx`, `pages/Index.tsx` | — (localStorage; **sem persistência no Supabase**) | Layout do dashboard não é sincronizado entre dispositivos |
| useDealForecast | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDealForecast.ts:25` invoca `forecast-deals`; teste `useDealForecast.test.ts:4` | `src/components/executive/ForecastCard.tsx` | edge `forecast-deals` | — |
| useDeals | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDeals.ts:48` (`from("deals")`), `:93` (`compute-deal-health`); testes `useDeals.test.ts:4`, `useDeals.conflict.test.ts:4` | `src/pages/Deals.tsx` | `deals`; edge `compute-deal-health` | — |
| useDebouncedSearchParam | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDebouncedSearchParam.ts:1`; teste property-based `useDebouncedSearchParam.test.tsx:6` (fast-check) | 6 páginas (`Voicemail`, `SecurityAlerts`, `Recordings`, `Contacts`, `CallHistory`, `MeetingSummaries`) | — (URL search params) | — |
| useDeviceDetection | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useDeviceDetection.ts:1`; teste `useDeviceDetection.coverage.test.tsx:3` | `src/hooks/useSessionManager.ts` | `active_sessions`; edge `notify-new-device` | Teste com só 9 asserções, 3 delas triviais (`toBeDefined/toBeTruthy`) |
| useExecutiveDashboard | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useExecutiveDashboard.ts:1`; teste `useExecutiveDashboard.coverage.test.tsx:3` importa `useExecutiveDashboardData, getPeriodLabel, formatDuration` | `pages/ExecutiveDashboard.tsx` + 3 componentes | `call_sessions`, `call_summaries`, `call_alerts`, `agent_goals`, `hold_events`; canal `executive-dashboard-realtime` | Lê `call_sessions/call_summaries/call_analyses` — **contaminável** pelo `createTestData` (ver Achados) |
| useExtensionAudit | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useExtensionAudit.ts:1`; teste `useExtensionAudit.scenarios.test.ts:4` | `BulkAssignTrunkDialog.tsx`, `useExtensionsAdmin.ts` | rpc `log_audit_event` | — |
| useExtensionAuditHistory | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useExtensionAuditHistory.ts:1`; teste `useExtensionAuditHistory.coverage.test.tsx:4` | `ExtensionAuditTimeline.tsx` | `audit_logs` | — |
| useExtensionsOverview | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useExtensionsOverview.ts:5,178` usa `computeHealth`; teste `useExtensionsOverview.coverage.test.tsx:5` | `ExtensionDetailsDrawer.tsx`, `ExtensionsTable.tsx`, `ExtensionStatusBadge.tsx`, `useExtensionsAdmin.ts` | `agents`, `agent_devices`, `agent_trunk_assignments`, `user_profiles`, `call_sessions`; canal `extensions-overview-realtime` | — |
| computeHealth (extraído p/ `@/lib/health-score`) | ✅ IMPLEMENTADO_TOTAL | teste `useExtensionsOverview.scenarios.test.ts:2` importa `computeHealth` de `@/lib/health-score`, que é exatamente o que o hook usa (`useExtensionsOverview.ts:5`) | via `useExtensionsOverview` | — (função pura) | Bom padrão: lógica extraída para lib testável, não reimplementada |
| useFinancialImpact (summarize/pct/financialImpactToCSV) | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useFinancialImpact.ts:41,61,114`; teste property-based `useFinancialImpact.property.test.ts:3` importa os exports reais | `src/pages/FinancialImpact.tsx` | `financial_impact_daily` | Teste cobre só as funções puras; o hook `useFinancialImpact` (`:66`) não é exercido |
| useForecastVolume | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useForecastVolume.ts:1`; teste `useForecastVolume.coverage.test.tsx:4` | `src/components/executive/VolumeForecastCard.tsx` | edge `forecast-call-volume` | — |
| useGamification | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useGamification.ts:1`; teste `useGamification.coverage.test.tsx:3` | 4 componentes de gamification, `useAchievementNotifications.ts`, `pages/AgentRanking.tsx` | `agents`, `badges`, `agent_badges`, `agent_weekly_stats` | — |
| useGeoBlocking | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useGeoBlocking.ts:1`; teste `useGeoBlocking.coverage.test.tsx:4` | `src/pages/GeoBlocking.tsx` | `geo_restrictions`, `geo_settings`, `geo_access_logs`; edge `validate-geo` | — |
| useGoalViolations | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useGoalViolations.ts:1`; teste `useGoalViolations.coverage.test.tsx:4` | `src/components/dashboard/GoalViolationsHistory.tsx` | `goal_violations`; canal `goal-violations` | — |
| useHealthCheck | ✅ IMPLEMENTADO_TOTAL | `src/hooks/useHealthCheck.ts:1`; teste `useHealthCheck.coverage.test.tsx:3` | `src/pages/ObservabilityDashboard.tsx` | `agents`; canal `health-check-probe`; edge `health-check` | — |
| useCadences | ✅ IMPLEMENTADO_TOTAL (com ressalva) | `src/hooks/useCadences.ts:45,46,72`; teste `useCadences.coverage.test.tsx:3` importa `useCadences, useCadenceEnrollments` | `src/pages/Cadences.tsx` (só `useCadences`) | `cadences`, `cadence_steps`, `cadence_enrollments` | **`useCadenceEnrollments` (`useCadences.ts:~70`) é export órfão** — 0 referências em `src/` fora do teste (3 patterns testados) |

### B) Funcionalidade com dado fabricado gravado em tabela real

| Funcionalidade | Classificação | Evidência (arquivo:linha) | Consumidor | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| useAgentRanking — `createTestData` | 🟨 IMPLEMENTADO_PARCIAL | `src/hooks/useAgentRanking.ts:262` (`createTestData`), `:269-295` (`Math.random()` em cascata), `:274` insert em `call_sessions`, `:288` insert em `call_summaries`, `:292` insert em `call_analyses`; exposto no retorno em `:312`; **botão em produção** em `src/pages/AgentRanking.tsx:47` (`onClick={createTestData}`, rótulo "Criar Dados"), **sem gating** de `import.meta.env`/`NODE_ENV`; teste que legitima em `src/hooks/__tests__/useAgentRanking.coverage.test.tsx:159-167` | `src/pages/AgentRanking.tsx` + 6 componentes de ranking | `call_sessions`, `call_summaries`, `call_analyses`, `agent_goals`, `call_alerts` | Remover `createTestData` do caminho de produção (ou gatear por env/role); o restante do hook (fetch/goals) está íntegro |

### C) Testes-espelho — nenhum caminho de execução até `src/`

Estes 11 arquivos (**3.462 linhas = 31,4% do lote**) **não importam nada de `src/`**. Reimplementam a
lógica localmente dentro do próprio `describe` e asseveram sobre a cópia. Testam a si mesmos.

| Funcionalidade | Classificação | Evidência (arquivo:linha) | Consumidor | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| useContactsAndCompliance.test.ts (444 l.) | ⬛ MORTO_OU_ABANDONADO | Único import é `vitest` (`:1`); lógica local em `:6` (`phone.replace(/\D/g,'')`), `:3,104,190,298,378,426` (6 describes duplicando Contacts/Alerts/DNC/Permissions/Audit/IP) | — | nenhuma | Reescrever importando `@/hooks/useContacts`, `useContactAlerts`, `useDNCCompliance` |
| useDeviceAndSecurity.test.ts (433 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` só `vitest`; `detectBrowser` local em `:5-12`, `detectOS` local em `:24-30`; 8 describes (`:3,103,163,228,299,328,355,409`) | — | nenhuma | Importar `@/hooks/useDeviceDetection`, `useGeoBlocking`, `useConsent`, … |
| useAlertSoundAndNotifications.test.ts (378 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` só `vitest`; config literal em `:5-12`; `getBeepCount` local em `:38-46`; describes `:3,138,278` | — | nenhuma | Importar `@/hooks/useCriticalAlertNotifications` (que existe e é consumido) |
| useAuthAndDataIntegrity.test.ts (373 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` só `vitest`; `validRoles` literal em `:5`; asserções tautológicas como `:43` (`expect(10000).toBe(10000)`), `:31-38` (`expect(!!user).toBe(true)`) | — | nenhuma | Importar `@/hooks/useAuth` / `auth/useAuthState` |
| useComprehensive.test.ts (322 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` só `vitest`; `analyzePassword` reimplementado em `:4-24`; describes `:3,78,105,144,168,223,252,272,294` | — | nenhuma | Extrair a lógica real para `src/lib` e importar |
| useGamificationAndCallbacks.test.ts (318 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` só `vitest`; cálculo de `weekStart` copiado em `:8-11`; describes `:3,185,273` | — | nenhuma | Importar `@/hooks/useGamification` (existe, 308 l., 6 consumidores) |
| useEdgeFunctions.test.ts (290 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` importa só `vitest`; rate limiter reconstruído com `Map` local em `:6-17`; 9 describes (`:4,62,76,90,121,179,213,248,266`) | — | nenhuma (não toca `supabase/functions/`) | Testar as edge functions reais em `supabase/functions/` |
| useEdgeFunctionIntegrity.test.ts (265 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` só `vitest`; "Edge Function: check-contact-alerts" em `:3` apenas monta objetos literais (`:5-8`); 7 describes | — | nenhuma | Idem acima — o nome promete integridade de edge function e não abre nenhuma |
| useBusinessLogic.test.ts (256 l.) | ⬛ MORTO_OU_ABANDONADO | `vi.mock('@/integrations/supabase/client')` em `:4-34` **sem nenhum import de SUT** → mock nunca é injetado em nada; describes locais em `:36,83,112,123,159,200,221` | — | nenhuma (mock morto) | Importar os hooks que o mock pretende servir |
| useCallSession.test.ts (128 l.) | ⬛ MORTO_OU_ABANDONADO | `vi.mock` de supabase em `:3-16` sem import do hook; `:20` (`const session = {status:'active'}; expect(session.status).toBe('active')`) | — | nenhuma (mock morto) | Já existe `useCallSession.coverage.test.tsx` que faz o certo — este é redundante e falso |
| useCoachingAndRecording.test.ts (255 l.) | ⬛ MORTO_OU_ABANDONADO | `:1` só `vitest`; `validStatuses` literal em `:5`; describes `:3,104,210` | — | nenhuma | Importar `@/hooks/useCoaching`, `useCallRecording`, `useConferenceRecording` |

### D) Hooks completos, porém sem consumidor em produção (fio solto)

Os 3 patterns de detecção descritos acima falharam para todos; não há barril `src/hooks/index.ts`.
Tabelas/edge functions **existem** (conferido em `src/integrations/supabase/types.ts` e
`supabase/functions/`), então não é fio quebrado a jusante — é ausência de UI.

| Funcionalidade | Classificação | Evidência (arquivo:linha) | Consumidor | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| useAdherence | 🟦 SUGERIDO_OU_INICIADO | `src/hooks/useAdherence.ts:11` (hook), `:15` invoca `compute-adherence`; teste `useAdherence.test.tsx:5` importa o alvo mas só 2 asserções (`:25` trivial, `:26` real) | **NENHUM** | edge `compute-adherence` (existe) | Nenhuma tela consome aderência; teste cobre só o happy path |
| useCallPlaylists (+ usePlaylistItems) | 🟦 SUGERIDO_OU_INICIADO | `src/hooks/useCallPlaylists.ts:26` e `:61`; tabelas em `:33` (`call_playlists`), `:50` (`playlist_items`); teste `useCallPlaylists.coverage.test.tsx:3` | **NENHUM** (ambos os exports) | `call_playlists`, `playlist_items` (existem) | UI de playlists de chamadas |
| useChatbot | 🟦 SUGERIDO_OU_INICIADO | `src/hooks/useChatbot.ts:15`; invoca `chatbot-respond`; teste `useChatbot.coverage.test.tsx:6` | **NENHUM** | edge `chatbot-respond` (existe) | Nenhum componente de chat monta o hook |
| useChurnRisk | 🟦 SUGERIDO_OU_INICIADO | `src/hooks/useChurnRisk.ts:21`; tabela `churn_risk_signals`; teste `useChurnRisk.test.ts:3` | **NENHUM** | `churn_risk_signals` (existe) | Note: `useAccounts` invoca a edge `detect-churn-risk`, mas ninguém lê os sinais gravados |
| useCoachingAssignments | 🟦 SUGERIDO_OU_INICIADO | `src/hooks/useCoachingAssignments.ts:21`; tabela `coaching_assignments`; teste `useCoachingAssignments.coverage.test.tsx:5` | **NENHUM** | `coaching_assignments` (existe) | `CoachingPanel.tsx` usa `useCoaching`, não este |
| useComplianceRules | 🟦 SUGERIDO_OU_INICIADO | `src/hooks/useComplianceRules.ts:23`; tabela `compliance_rules`; teste `useComplianceRules.coverage.test.tsx:4` | **NENHUM** | `compliance_rules` (existe) | `ComplianceSettings.tsx` usa `useDNCCompliance`, não este |
| useCadenceEnrollments (export secundário) | 🟦 SUGERIDO_OU_INICIADO | `src/hooks/useCadences.ts:72` (`from("cadence_enrollments")`); importado só pelo teste `useCadences.coverage.test.tsx:3` | **NENHUM** | `cadence_enrollments` (existe) | `pages/Cadences.tsx` importa apenas `useCadences` |

---

## Achados graves

### 1. 🔴 CRÍTICO — Botão em produção grava dados fabricados com `Math.random()` em tabelas reais

`src/hooks/useAgentRanking.ts:262-306` define `createTestData()`, que em laço gera de 5 a 14
chamadas por agente para 6 nomes fixos (`'Lucas Ferreira', 'Ana Carolina Silva', …`,
`useAgentRanking.ts:263`) e faz **INSERT direto** em três tabelas de produção:

- `call_sessions` (`useAgentRanking.ts:274`) — com `caller_name: \`Cliente ${Math.floor(Math.random()*1000)}\``, `caller_phone` randômico, `started_at`/`ended_at` randômicos nos últimos 7 dias;
- `call_summaries` (`useAgentRanking.ts:288`) — `customer_satisfaction` e `agent_performance_score` randômicos, `overall_sentiment` sorteado;
- `call_analyses` (`useAgentRanking.ts:292`) — `sentiment`, `emotion`, `urgency` sorteados.

O gatilho está exposto na UI: `src/pages/AgentRanking.tsx:47` renderiza
`<Button onClick={createTestData}>Criar Dados</Button>` **sem qualquer gating** — confirmei ausência
de `import.meta.env`, `NODE_ENV` ou `DEV` no arquivo inteiro. Qualquer usuário que abra
"Gamificação & Ranking" pode contaminar a base.

**Amplitude do dano:** essas mesmas três tabelas alimentam `useExecutiveDashboard`
(`call_sessions`, `call_summaries`, `call_alerts`), `useCallAnalytics`, `useDashboardData`,
`useCallHistory`, `useAlerts` e `useActiveCallsRealtime`. Ou seja, o dado fictício não fica contido
no ranking: propaga-se para o dashboard executivo, relatórios e histórico de chamadas.

**Agravante de auditoria:** o teste `src/hooks/__tests__/useAgentRanking.coverage.test.tsx:159-167`
(`'createTestData inserts rows and toasts success'`) **fixa `Math.random` em 0.5**
(`vi.spyOn(Math,'random').mockReturnValue(0.5)`, linha 160) e assevera que o toast de sucesso foi
emitido. Isto é, a suíte **certifica a fabricação como comportamento correto** e travará qualquer
tentativa de remoção.

### 2. 🔴 31,4% do lote (3.462 de 11.029 linhas) são testes-espelho que não tocam código de produção

Onze arquivos não importam **nada** de `src/`: reimplementam a regra dentro do próprio teste e
asseveram sobre a cópia. Provas por arquivo estão na seção C; os casos mais ilustrativos:

- `useComprehensive.test.ts:4-24` reescreve inteiro um `analyzePassword` que não existe naquele
  formato no código-fonte;
- `useDeviceAndSecurity.test.ts:5-12` reescreve `detectBrowser`, enquanto
  `src/hooks/useDeviceDetection.ts` (158 linhas, consumido por `useSessionManager.ts`) fica intocado;
- `useEdgeFunctionIntegrity.test.ts:3` intitula-se "Edge Function: check-contact-alerts" e **não abre
  nenhum arquivo de `supabase/functions/`** — apenas monta objetos literais;
- `useAuthAndDataIntegrity.test.ts:43` é literalmente `const timeout = 10000; expect(timeout).toBe(10000)`.

Dois deles são piores ainda: `useBusinessLogic.test.ts:4-34` e `useCallSession.test.ts:3-16`
declaram um `vi.mock('@/integrations/supabase/client')` elaborado que **nunca é injetado em nada**,
porque nenhum módulo sob teste é importado — o mock é código morto dentro de teste morto.

Consequência prática: esses 3.462 linhas produzem "verde" e inflam a contagem de testes sem
proteger nenhuma linha de produção. Pior, `useCallSession.test.ts` (espelho) convive com
`useCallSession.coverage.test.tsx` (real) — quem lê a lista de arquivos supõe cobertura dupla.

### 3. 🟠 Sete unidades completas com persistência real e zero consumidores (trabalho pago e não entregue)

`useAdherence` (edge `compute-adherence`), `useCallPlaylists` + `usePlaylistItems`
(`call_playlists`, `playlist_items`), `useChatbot` (edge `chatbot-respond`), `useChurnRisk`
(`churn_risk_signals`), `useCoachingAssignments` (`coaching_assignments`), `useComplianceRules`
(`compliance_rules`) e `useCadenceEnrollments` (`cadence_enrollments`).

Todos possuem: hook implementado, tabela existente em `src/integrations/supabase/types.ts`, edge
function existente em `supabase/functions/`, e teste que importa o alvo. Falta **só o consumidor**.
Verifiquei com três patterns (caminho `@/hooks/X`, caminho relativo, `import()` dinâmico e
identificador nu em todo `src/`) e confirmei que **não existe `src/hooks/index.ts`**, logo não há
re-export indireto possível.

Caso mais revelador: `useAccounts.ts` invoca a edge `detect-churn-risk`, que presumivelmente popula
`churn_risk_signals`; `useChurnRisk.ts:21` lê essa tabela — e nenhuma tela lê `useChurnRisk`. O
pipeline grava e ninguém consome.

### 4. 🟡 `useCallTransfer` não persiste nem sinaliza a transferência

`src/hooks/useCallTransfer.ts:7` não importa `supabase` (confirmado por varredura de
`from(...)`/`rpc(...)`/`invoke(...)`: zero ocorrências). `completeTransfer` (`:16-33`) apenas move a
chamada de `activeCalls` para `callHistory` em memória. O teste
`useCallTransfer.coverage.test.tsx:3` mocka `@/integrations/supabase/client` e `sonner`, sugerindo
que se esperava persistência — mas o hook não faz nenhuma. Transferência de chamada é operação
de PBX; nada aqui alcança o backend.

### 5. 🟡 `useDashboardLayout` persiste só em `localStorage`

`src/hooks/useDashboardLayout.ts:34` usa `localStorage`; nenhuma tabela. Consumido por
`pages/Index.tsx` e `WidgetLibrary.tsx`. Layout do dashboard não sobrevive a troca de navegador ou
dispositivo, enquanto `dashboard_goals` (hook irmão) persiste no banco — inconsistência de camada.

---

## Qualidade dos testes deste lote

**Higiene formal — impecável.** Varredura sobre os 78 arquivos:
- `.skip` / `.only` / `.todo` / `xit(` / `xdescribe(`: **zero ocorrências**;
- `TODO` / `FIXME` / `XXX` / `HACK`: **zero** (as únicas ocorrências são `vi.stubGlobal`,
  `const stub =` e um código de erro fictício `'XXX'` em `useGamification.coverage.test.tsx:131`);
- `Math.random` em teste: **zero** (o único uso é o `vi.spyOn(Math,'random')` de
  `useAgentRanking.coverage.test.tsx:160`, que é mitigação correta — sobre lógica que não deveria existir).

**Duas famílias de qualidade radicalmente diferentes convivem no mesmo diretório:**

*Família `*.coverage.test.tsx` / `*.test.ts` com import do alvo (67 arquivos, ~7.567 linhas) —
boa qualidade.* Os mocks de Supabase são encadeáveis e realistas: `useContactAlerts.coverage.test.tsx:24-47`
constrói `makeSelectChain`/`makeUpdateChain`/`makeDeleteChain` *thenables* que respeitam a API do
query-builder, e `:22` captura o handler de realtime para disparar payloads. Ramos de erro são
exercitados de verdade — `useAgentRanking.coverage.test.tsx:152-157` força
`setTable('call_sessions', null, {message:'boom'})` e assevera o toast de erro específico. Asserções
triviais (`toBeDefined`/`toBeTruthy`) são raras: o pior caso é
`useDeviceDetection.coverage.test.tsx` com 3 de 9; a maioria fica em 0-2.

*Família teste-espelho (11 arquivos, 3.462 linhas) — sem valor.* Detalhada na seção C. Nenhuma
importa `src/`. Note que **o critério "procure `from '@/...'` em qualquer linha" foi aplicado com
extração multilinha** (regex `[\s\S]*?` entre `import` e `from`), justamente porque vários testes do
lote usam import de múltiplas linhas — por exemplo `useConversations.coverage.test.tsx` e
`useDashboardData.coverage.test.tsx`, cujos imports de 4-5 símbolos quebram linha. Mesmo assim, os 11
arquivos não têm nenhum `from` apontando para `src/`.

**Padrões dignos de nota (positivos):**
- Property-based testing real com `fast-check` em `useDebouncedSearchParam.test.tsx:6` e
  `useFinancialImpact.property.test.ts:4`;
- `useExtensionsOverview.scenarios.test.ts:2` é o **contraexemplo correto do teste-espelho**: em vez
  de recopiar a regra de health score, testa `computeHealth` importado de `@/lib/health-score` — a
  mesma função que `useExtensionsOverview.ts:5,178` consome. O comentário
  `useExtensionsOverview.ts:78` (*"computeHealth movido para src/lib/health-score.ts (testável
  property-based)"*) mostra que alguém já conhecia o padrão certo. Ele simplesmente não foi aplicado
  aos outros 11.

**Duplicação:** `useAccounts`, `useContacts`, `useDeals` e `useCallSession` têm dois arquivos de
teste cada. Nos três primeiros ambos importam o alvo (redundância aceitável, ângulos diferentes:
`.conflict` testa concorrência). Em `useCallSession` o segundo arquivo é espelho — redundância falsa.

**Lacuna estrutural:** os testes cobrem os hooks *individualmente* com Supabase mockado. Nenhum teste
deste lote valida contrato contra o schema real (`src/integrations/supabase/types.ts`) nem contra as
edge functions em `supabase/functions/`. Um `from('tabela_inexistente')` passaria verde em todos eles.

---

## Integrações de terceiros observadas

| Integração | Como aparece | Evidência |
|---|---|---|
| **Supabase — PostgREST** | ~45 tabelas distintas acessadas via `.from()`. Todas as tabelas verificadas existem em `src/integrations/supabase/types.ts` | `useContacts.ts` (`contacts`), `useDNCCompliance.ts` (`dnc_list`), `useExtensionsOverview.ts` (`agents`, `agent_devices`, `agent_trunk_assignments`), … |
| **Supabase — RPC (funções SQL)** | `log_audit_event`, `add_to_dnc`, `check_calling_hours`, `check_dnc`, `get_call_history_with_summaries`, `get_dashboard_stats`, `get_agents_with_active_calls`, `get_call_volume_stats`, `get_queue_stats` | `useAuditLog.ts`, `useDNCCompliance.ts`, `useCallHistory.ts`, `useDashboardData.ts`, `useExtensionAudit.ts` |
| **Supabase — Edge Functions** | 22 funções invocadas, **todas presentes** em `supabase/functions/`: `compute-account-health`, `detect-churn-risk`, `compute-adherence`, `compute-best-time`, `bitrix-api`, `webauthn-authenticate`, `chatbot-respond`, `score-call-attempt`, `search-calls`, `analyze-talk-ratio`, `detect-key-moments`, `generate-meeting-summary`, `generate-coaching`, `record-consent`, `validate-geo`, `extract-crm-fields`, `notify-new-device`, `check-contact-alerts`, `forecast-call-volume`, `forecast-deals`, `compute-deal-health`, `voip-anomaly-remediation`, `health-check` | ls de `supabase/functions/` cruzado com grep de `functions.invoke(` nos hooks |
| **Supabase — Realtime** | 10 canais: `active-calls-realtime`, `agents-status`, `badge-achievements`, `goal-achievements`, `alerts_page_calls`, `alerts_page_contacts`, `contact-alerts-changes`, `conversations-realtime`, `coaching-updates`, `critical-alerts-notifications`, `executive-dashboard-realtime`, `goal-violations`, `extensions-overview-realtime`, `health-check-probe` | `useActiveCallsRealtime.ts`, `useConversations.ts`, `useExecutiveDashboard.ts`, … |
| **Supabase Auth** | `supabase.auth.onAuthStateChange` | `src/hooks/useAuth.ts:30` |
| **Bitrix24 (CRM)** | Sincronização bidirecional via edge `bitrix-api`, filas em `crm_sync_queue`, espelho de `bitrix_users`/`bitrix_departments` | `src/hooks/useBitrix.ts` (311 linhas); consumido por `components/contacts/useBitrixSync.ts`, `settings/BitrixIntegration.tsx` |
| **WebAuthn / Passkeys (FIDO2)** | `user_passkeys`, `webauthn_challenges`, edge `webauthn-authenticate`, lib `@/lib/webauthn/webauthn-utils` (mockada em `useBitrixAndWebAuthn.test.ts`) | `src/hooks/useWebAuthn.ts` (335 linhas); `PasskeyLogin.tsx`, `PasskeyManager.tsx` |
| **TanStack Query (`@tanstack/react-query`)** | `useQuery`/`useMutation` em ~15 hooks; testes montam `QueryClientProvider` | `useAdherence.ts:1`, `useAnomalyRemediation.ts:1`, `useDNCCompliance`, `useGeoBlocking`, `useConsent`, `useCallScoring`, `useForecastVolume`, … |
| **sonner (toasts)** | Camada de feedback ao usuário; mockada em 30+ testes | `useAgentRanking.ts` (`toast.success/error`), `useAnomalyRemediation.ts:51-64` |
| **fast-check (property-based testing)** | Duas suítes property-based genuínas | `useDebouncedSearchParam.test.tsx:6`, `useFinancialImpact.property.test.ts:4` |
| **Web APIs do navegador** | `matchMedia` (`use-mobile.tsx:9`), `navigator.mediaDevices` + `setSinkId` (`useAudioOutputDevices.ts:29`), `requestAnimationFrame` (`useAnimatedCounter.ts`), Web Audio (osciladores 440/880 Hz descritos nos espelhos), `localStorage` (`useDashboardLayout.ts:34`, `useAudioOutputDevices.ts:36`), Notification API | vários |
| **Observabilidade interna** | `@/lib/logger`, `@/lib/tracing`, `@/lib/error-tracking` — mockados em 25+ testes | `useBestTimeToContact.coverage.test.tsx` (mocka `@/lib/tracing`), `useContacts.coverage.test.tsx` (mocka `@/lib/error-tracking`) |

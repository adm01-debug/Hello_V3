<!-- Gerado pela auditoria de estado. Fonte: lote H3. -->

> **Procedência:** lote `H3` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 88/88 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote H3 — src/hooks (parte 3)

## Cobertura

- 88 arquivos do manifesto `H3.txt`, 11.084 linhas — **todos existem em disco** (verificação `[ -f ]` sem falhas).
- Composição: **79 módulos de produção** (hooks + `auth/`, `predictive-dialer/`, `telemetry/`) + **9 arquivos de teste**.
- Método de detecção de consumidor: para cada módulo, `grep -rlE "hooks/(base|.*/base)['\"]|from ['\"][^'\"]*/base['\"]"` sobre `src/**/*.ts(x)` — cobre import estático (`@/hooks/X`), relativo (`./X`, `../X`) e **multilinha** (o padrão casa o especificador da linha `from`, não a linha do `import`). Para os 6 candidatos a órfão foi feita **segunda passada por identificador nu** (`grep -rn "useX" src`), que captura `lazy(() => import("@/hooks/X"))`, `await import(...)` e re-export. Nenhum consumidor dinâmico apareceu.
- Padrões de dado fictício testados por grep em todos os 79: `Math.random`, `TODO`, `FIXME`, `mock/Mock`, `stub`, `placeholder`, `hardcod`, `fake/Fake`, `dummy`, `simulado`, `// simula`, `não implementado`, `em breve`, `provisório`, `WIP`.
- Não foram lidos README.md, SYSTEM_FEATURES.md, docs/ nem mem/. Nenhum teste foi executado.

## Tabela de funcionalidades

| Funcionalidade | Classificação | Evidência | Consumidor | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `auth/index.ts` (barrel de auth) | ⬛ MORTO_OU_ABANDONADO | src/hooks/auth/index.ts:1-7 (re-exporta 5 símbolos) | **NENHUM** — `grep -rn "hooks/auth['\"]\|from './auth'\|from '../auth'\|@/hooks/auth"` = 0 resultados (nem teste) | — | Barrel nunca importado; consumidores usam `@/hooks/useAuth` ou os arquivos diretos |
| `auth/useAuthState` (tipos + estado base) | ✅ | src/hooks/auth/useAuthState.ts:1-33 | useAuthSession.ts, useAuthActions.ts, useAuthProfile.ts, src/hooks/useAuth.ts | — (estado local) | — |
| `auth/useAuthSession` (sessão + `withTimeout` + purge de token) | ✅ | src/hooks/auth/useAuthSession.ts:6-18 (limpeza de localStorage), :98 | useAuth.ts, useAuthActions.ts | supabase.auth | — |
| `auth/useAuthActions` (signIn/signOut) | ✅ | src/hooks/auth/useAuthActions.ts:1-86 | useAuth.ts | supabase.auth | — |
| `auth/useAuthProfile` (perfil/role) | ✅ | src/hooks/auth/useAuthProfile.ts:10 | useAuth.ts | `user_profiles` | — |
| `useAuth` (fachada de auth) | ✅ | src/hooks/useAuth.ts:1-96 | 11 consumidores (AuthContext.tsx, protectedRoutes.tsx, pages/CallPark, CallQueues, RingGroups, SecurityMonitoring, SecurityReport, NotificationCenter, useNotifications.ts, SyncHistoryPanel.tsx) | supabase.auth + `user_profiles` | — |
| `predictive-dialer/api.ts` (CRUD campanhas/fila) | ✅ | src/hooks/predictive-dialer/api.ts:11,20,31,52,66,71,82,91,106,119,128,134,139 | src/hooks/usePredictiveDialer.ts:19 | `dialer_campaigns`, `dialer_queue` | Sem teste próprio (coberto indiretamente) |
| `predictive-dialer/types.ts` | ✅ | src/hooks/predictive-dialer/types.ts:1-68 | usePredictiveDialer.ts:26,33 | — | — |
| `telemetry/useTelemetry` (web-vitals → DB) | ✅ | src/hooks/telemetry/useTelemetry.ts:20,27 | src/components/layout/AppLayout.tsx | `performance_metrics` | — |
| `use-mobile` | ✅ | src/hooks/use-mobile.tsx:1-19 | src/components/ui/sidebar.tsx | — | — |
| `use-toast` | ✅ | src/hooks/use-toast.ts:1-186 | src/components/ui/use-toast.ts, toaster.tsx | — | — |
| `useAccounts` (contas + health + churn) | ✅ | src/hooks/useAccounts.ts:38,54,72,84,98 | src/pages/Accounts.tsx | `accounts`; edge `compute-account-health`, `detect-churn-risk` | — |
| `useAchievementNotifications` | ✅ | src/hooks/useAchievementNotifications.ts:41,48,54-61 | components/gamification/AchievementNotificationProvider.tsx | `badges`, `agents` | — |
| `useActiveCallsRealtime` | ✅ | src/hooks/useActiveCallsRealtime.ts:35,40 | components/dashboard/ActiveCallsRealtime.tsx | `call_sessions`, `hold_events` | — |
| `useAdherence` (aderência de escala) | ⬛ MORTO_OU_ABANDONADO | src/hooks/useAdherence.ts:15 (`invoke('compute-adherence')`) | **NENHUM em produção**; só src/hooks/\_\_tests\_\_/useAdherence.test.tsx:5 | edge `compute-adherence` | Nenhuma tela consome; edge fn possivelmente sem uso |
| `useAgentFinancialLeaderboard` | ✅ | src/hooks/useAgentFinancialLeaderboard.ts:20 | components/financial/AgentFinancialLeaderboard.tsx | RPC `get_agent_financial_leaderboard` | Sem teste |
| **`useAgentRanking`** (ranking + metas + **createTestData**) | 🟨 IMPLEMENTADO_PARCIAL | leitura real: src/hooks/useAgentRanking.ts:107,110,123,132,148,165,166,218,224; **fabricação: :262-307 com `Math.random` em :269,271,272,275,276,278,279,284,285,288,290,293,294,295** | 7 consumidores (pages/AgentRanking.tsx + 6 components/ranking/\*); botão em src/pages/AgentRanking.tsx:47 | lê `call_sessions`,`call_summaries`,`call_alerts`,`agent_goals`,`call_analyses`; **grava** `call_sessions`,`call_summaries`,`call_analyses` | Remover/gatear `createTestData` — ver Achados graves |
| `useAgentStatus` | ✅ | src/hooks/useAgentStatus.ts:39,81,125 (PATCH REST com `keepalive` no unload) | AchievementNotificationProvider.tsx, UnifiedSoftphone.tsx, CoachingPanel.tsx, pages/AgentRanking.tsx | `agents` | — |
| `useAlertHistory` | ✅ | src/hooks/useAlertHistory.ts:44 | src/pages/AlertHistory.tsx | `call_alerts` | — |
| `useAlertPresets` (presets em localStorage) | ✅ | src/hooks/useAlertPresets.ts:19-55 | src/pages/admin/SecurityAlerts.tsx | localStorage (por design) | Sem teste |
| `useAlerts` | ✅ | src/hooks/useAlerts.ts:92,97,104,121-251 | UnifiedNotificationDropdown.tsx, pages/Alerts.tsx | `call_alerts`, `contact_alerts`; edge `check-contact-alerts` | — |
| `useAlertsExport` (export paginado) | ✅ | src/hooks/useAlertsExport.ts:74-97 | src/pages/admin/SecurityAlerts.tsx | `notifications` | — |
| `useAnimatedCounter` | ✅ | src/hooks/useAnimatedCounter.ts:1-46 | components/dashboard/StatsCard.tsx | — | — |
| `useAnomalyRemediation` | ✅ | src/hooks/useAnomalyRemediation.ts:40-60 (inclui trilha dry-run/idempotência) | components/network/AnomalyDetectionCard.tsx | edge `voip-anomaly-remediation` | — |
| `useAudioOutputDevices` | ✅ | src/hooks/useAudioOutputDevices.ts:29,42,68,84 | WebRTCCall.tsx, AudioOutputSelector.tsx | navigator.mediaDevices + localStorage | — |
| `useAuditLog` | ✅ | src/hooks/useAuditLog.ts:40 | CoachingPanel.tsx, ContactDetailSheet.tsx, useRecordings.ts, useCallHistory.ts | RPC `log_audit_event` | — |
| `useBattleCardDetection` | ✅ | src/hooks/useBattleCardDetection.ts:35,36 | LiveTranscription.tsx, BattleCardAlert.tsx | `battle_cards`, `battle_card_triggers` | — |
| `useBestTimeToContact` | ✅ | src/hooks/useBestTimeToContact.ts:31,44,57 | src/pages/OutboundCompliance.tsx | `contact_engagement_patterns`; edge `compute-best-time` | — |
| `useBitrix` (integração Bitrix24) | ✅ | src/hooks/useBitrix.ts:77,137,172,227,262 | components/contacts/useBitrixSync.ts, settings/BitrixIntegration.tsx | `bitrix_users`, `bitrix_departments`, `crm_sync_queue`; edge `bitrix-api` | — |
| `useBlfBoard` | ✅ | src/hooks/useBlfBoard.ts:24,26,30,112 | src/pages/BlfBoard.tsx | `agents`, `call_sessions`, `parked_calls` | Sem teste |
| `useBlockedAccessLogs` | ✅ | src/hooks/useBlockedAccessLogs.ts:83 | src/pages/BlockedAccessLogs.tsx | `blocked_access_logs` | — |
| `useCadences` | ✅ | src/hooks/useCadences.ts:45,46,56,65,72,92 | src/pages/Cadences.tsx | `cadences`, `cadence_steps`, `cadence_enrollments` | — |
| `useCallAnalytics` | ✅ | src/hooks/useCallAnalytics.ts:36,41 | pages/CallAnalytics.tsx, call-analytics/AnalyticsHeader.tsx | `call_sessions`, `call_summaries` | — |
| `useCallHistory` | ✅ | src/hooks/useCallHistory.ts:87,136,137,138 | CallDetailDialog.tsx, CallSessionsList.tsx, PhoneDialer.tsx, CallHistory.tsx | RPC `get_call_history_with_summaries`; `call_transcriptions`,`call_analyses`,`call_summaries` | — |
| `useCallPark` | ✅ | src/hooks/useCallPark.ts:40,54,83,99,114,143,185,212 | src/pages/CallPark.tsx | `call_park_orbits`, `parked_calls`; RPC `expire_parked_calls` | Sem teste |
| `useCallPlaylists` / `usePlaylistItems` | ⬛ MORTO_OU_ABANDONADO | src/hooks/useCallPlaylists.ts:33,42,50,67 | **NENHUM em produção**; só \_\_tests\_\_/useCallPlaylists.coverage.test.tsx:3 | `call_playlists`, `playlist_items` | Tabelas existem, UI não |
| `useCallQueues` | ✅ | src/hooks/useCallQueues.ts:36,51,70,90,105,121 | pages/CallQueues.tsx, pages/RingGroups.tsx | `call_queues`, `call_queue_members` | Sem teste |
| `useCallRecording` | ✅ | src/hooks/useCallRecording.ts:29,56,75 | src/hooks/useConferenceRecording.ts:15 | `call_recordings` + MediaRecorder | — |
| `useCallScoring` | ✅ | src/hooks/useCallScoring.ts:26 | src/pages/OutboundCompliance.tsx | edge `score-call-attempt` | — |
| `useCallSearch` | ✅ | src/hooks/useCallSearch.ts:39 | src/pages/CallLibrary.tsx | edge `search-calls` | — |
| `useCallSession` | ✅ | src/hooks/useCallSession.ts:47,71,91,133,151,155,161,175,181 | components/calls/ActiveCallBar.tsx | `call_sessions`,`call_transcriptions`,`call_analyses`,`call_transcripts_searchable`,`call_summaries`; edges `analyze-talk-ratio`,`detect-key-moments`,`generate-meeting-summary` | — |
| `useCallTimers` | ✅ | src/hooks/useCallTimers.ts:13-40 | src/hooks/useMultiChannelCall.ts | — (timers locais, por design) | — |
| **`useCallTransfer`** | 🟨 IMPLEMENTADO_PARCIAL | src/hooks/useCallTransfer.ts:36-65; **`setTimeout(() => completeTransfer(callId), 2000)` na linha 63** conclui a transferência cega por temporizador | src/hooks/useMultiChannelCall.ts | **nenhuma** — só estado React | Não emite REFER/SIP nem persiste; transferência é simulada no cliente |
| `useChatbot` | ⬛ MORTO_OU_ABANDONADO | src/hooks/useChatbot.ts:22 (`invoke('chatbot-respond')`) | **NENHUM em produção**; só \_\_tests\_\_/useChatbot.coverage.test.tsx:6 | edge `chatbot-respond` | Sem UI de chatbot |
| `useChurnRisk` | ⬛ MORTO_OU_ABANDONADO | src/hooks/useChurnRisk.ts:29,47 | **NENHUM em produção**; só \_\_tests\_\_/useChurnRisk.test.ts:3 (`useAccounts` chama a edge fn `detect-churn-risk` por conta própria) | `churn_risk_signals` | Sem tela de risco de churn |
| `useCoaching` | ✅ | src/hooks/useCoaching.ts:37,55,84,102 | components/coaching/CoachingPanel.tsx | `coaching_recommendations`; edge `generate-coaching` | — |
| `useCoachingAssignments` | ⬛ MORTO_OU_ABANDONADO | src/hooks/useCoachingAssignments.ts:28,38,49 | **NENHUM em produção**; só \_\_tests\_\_/useCoachingAssignments.coverage.test.tsx:5 | `coaching_assignments` | Sem UI de atribuição de coaching |
| `useComplianceRules` | ⬛ MORTO_OU_ABANDONADO | src/hooks/useComplianceRules.ts:30,40,56,68 | **NENHUM em produção**; só \_\_tests\_\_/useComplianceRules.coverage.test.tsx:4 | `compliance_rules` | Regras de compliance sem tela (a página usa `useDNCCompliance`) |
| `useConferenceRecording` | ✅ | src/hooks/useConferenceRecording.ts:19-48 | components/calls/UnifiedSoftphone.tsx | via `useCallRecording` → `call_recordings` | — |
| `useConsent` | ✅ | src/hooks/useConsent.ts:43,56 | src/pages/OutboundCompliance.tsx | `consent_records`; edge `record-consent` | — |
| `useContactAlerts` | ✅ | src/hooks/useContactAlerts.ts:30,58,76,93,115,130 | UnifiedNotificationDropdown.tsx, ContactAlertsDropdown.tsx | `contact_alerts`; edge `check-contact-alerts` | — |
| `useContactInsights` | ✅ | src/hooks/useContactInsights.ts:56-123 (métricas derivadas em `useMemo`, sem números fixos) | src/pages/ContactInsights.tsx | `contact_interactions` + `useContacts` | — |
| `useContacts` | ✅ | src/hooks/useContacts.ts:76,114,148,212,247,272,323 | 12 consumidores (pages/Contacts, ContactInsights, components/contacts/\*, dialer/AddContactsDialog, calls/ActiveCallBar) | `contacts`, `contact_interactions` | — |
| `useConversations` | ✅ | src/hooks/useConversations.ts:61,108,156,169,180,199 | pages/Inbox.tsx, executive/OmnichannelCard.tsx | `conversations`, `conversation_messages` | — |
| `useCriticalAlertNotifications` | ✅ | src/hooks/useCriticalAlertNotifications.ts:60-78 (WebAudio), :141-147 (realtime `call_alerts`) | AlertSoundSettings.tsx, SoundProfileManager.tsx, useSupervisorPanel.ts | realtime `call_alerts` | — |
| `useCrmFieldSuggestions` | ✅ | src/hooks/useCrmFieldSuggestions.ts:35,71,78,101,114 | components/calls/CrmSuggestionsCard.tsx | `crm_field_suggestions`, `contacts`; edge `extract-crm-fields` | — |
| `useCulturalHints` | ✅ | src/hooks/useCulturalHints.ts:26 | components/translation/LiveTranslationPanel.tsx | `cultural_hints` | — |
| `useDNCCompliance` | ✅ | src/hooks/useDNCCompliance.ts:65,79,93,106,120,144,167,185,212 | ComplianceSettings.tsx, DNCListManager.tsx | `dnc_list`,`calling_hours_config`,`compliance_settings`; RPCs `check_dnc`,`check_calling_hours`,`add_to_dnc` | — |
| `useDashboardData` | ✅ | src/hooks/useDashboardData.ts:56,71,87,102,114 | 6 consumidores (pages/Index, pages/Reports, 4 components/dashboard) | RPCs `get_dashboard_stats`,`get_agents_with_active_calls`,`get_call_volume_stats`,`get_queue_stats`; `call_sessions` | — |
| `useDashboardGoals` | ✅ | src/hooks/useDashboardGoals.ts:61,94,95,102,108 | components/dashboard/DashboardGoalsSettings.tsx | `dashboard_goals` | — |
| `useDashboardLayout` | ✅ | src/hooks/useDashboardLayout.ts:18-58 (persistência localStorage) | pages/Index.tsx, WidgetLibrary.tsx | localStorage (por design) | — |
| `useDataLakeExports` | ✅ | src/hooks/useDataLakeExports.ts:29,47 | src/pages/admin/DataExport.tsx | `data_lake_exports`; edge `export-data-lake` | Sem teste |
| `useDealForecast` | ✅ | src/hooks/useDealForecast.ts:25 | components/executive/ForecastCard.tsx | edge `forecast-deals` | — |
| `useDeals` | ✅ | src/hooks/useDeals.ts:48,68,75,93 | src/pages/Deals.tsx | `deals`; edge `compute-deal-health` | — |
| `useDebouncedSearchParam` | ✅ | src/hooks/useDebouncedSearchParam.ts:1-105 | 6 páginas (Voicemail, SecurityAlerts, Recordings, Contacts, CallHistory, MeetingSummaries) | — | — |
| `useDeviceDetection` (fingerprint + geo) | ✅ | src/hooks/useDeviceDetection.ts:48 (`fetch('https://ipapi.co/json/')`), :88,:109-135 | src/hooks/useSessionManager.ts | `active_sessions`; edge `notify-new-device`; **terceiro: ipapi.co** | Fallback `ip: 'Unknown'` (:64) degrada a detecção de dispositivo novo quando ipapi falha |
| `useDeviceLabel` | ✅ | src/hooks/useDeviceLabel.ts:36,59 | components/dialer/phone/DeviceNameSetting.tsx | `user_profiles` | Sem teste |
| `useDialerFavorites` | ✅ | src/hooks/useDialerFavorites.ts:65,82,112,138,158 | src/pages/PhoneDialer.tsx | `dialer_favorites` | Sem teste |
| `useExecutiveDashboard` | ✅ | src/hooks/useExecutiveDashboard.ts:114,118,119,120,122 | 4 consumidores (pages/ExecutiveDashboard + components/executive/\*) | `call_sessions`,`call_summaries`,`call_alerts`,`agent_goals`,`hold_events` | Agregação 100% client-side (custo de leitura alto) |
| `useExtensionAudit` | ✅ | src/hooks/useExtensionAudit.ts:29 | BulkAssignTrunkDialog.tsx, useExtensionsAdmin.ts | RPC `log_audit_event` | — |
| `useExtensionAuditHistory` | ✅ | src/hooks/useExtensionAuditHistory.ts:30 | components/admin/extensions/ExtensionAuditTimeline.tsx | `audit_logs` | — |
| `useExtensionsAdmin` | ✅ | src/hooks/useExtensionsAdmin.ts:77 | src/pages/admin/ExtensionsAdmin.tsx | `agents` | Sem teste |
| `useExtensionsOverview` | ✅ | src/hooks/useExtensionsOverview.ts:108,112,115,118,122 | 4 consumidores (components/admin/extensions/\*, useExtensionsAdmin.ts) | `agents`,`user_profiles`,`agent_trunk_assignments`,`agent_devices`,`call_sessions` | — |
| `useFinancialImpact` | ✅ | src/hooks/useFinancialImpact.ts:42,78,83,119,125 | src/pages/FinancialImpact.tsx | `financial_impact_daily` | Custo/receita vêm da tabela (`estimated_cost_cents`), não do cliente |
| `useForecastVolume` | ✅ | src/hooks/useForecastVolume.ts:24 | components/executive/VolumeForecastCard.tsx | edge `forecast-call-volume` | — |
| `useGamification` | ✅ | src/hooks/useGamification.ts:69,86,111,129,140,172,209,225,230 | 6 consumidores (components/gamification/\*, useAchievementNotifications.ts, pages/AgentRanking.tsx) | `badges`,`agent_badges`,`agent_weekly_stats`,`agents` | — |
| `useGeoBlocking` | ✅ | src/hooks/useGeoBlocking.ts:35,44,53,61,71,82,91,100 | src/pages/GeoBlocking.tsx | `geo_settings`,`geo_restrictions`,`geo_access_logs`; edge `validate-geo` | — |
| `useGoalViolations` | ✅ | src/hooks/useGoalViolations.ts:54 | components/dashboard/GoalViolationsHistory.tsx | `goal_violations` | — |
| `useHealthCheck` | ✅ | src/hooks/useHealthCheck.ts:59,68 + probes de Auth/Storage/Realtime :63-90 | src/pages/ObservabilityDashboard.tsx | `agents`; edge `health-check`; storage; realtime | — |
| Testes: `useVoipTrunks.coverage`, `useWavoipCall.coverage`, `useWebAuthn.coverage`, `useWebVitals.coverage` | ✅ (testes reais) | importam o alvo: useVoipTrunks.coverage.test.tsx:12; useWavoipCall.coverage.test.tsx:26; useWebAuthn.coverage.test.tsx:3; useWebVitals.coverage.test.tsx:14 | — | — | Alvos pertencem a outro lote |
| Testes `auth/*` e `telemetry/*` | ✅ (testes reais) | useAuthActions.coverage.test.tsx:3; useAuthProfile.coverage.test.tsx:26; useAuthSession.coverage.test.tsx:26; useTelemetry.coverage.test.tsx:33 | — | — | — |
| **`useWavoipAndReauth.test.ts`** | ⬛ teste-espelho | src/hooks/\_\_tests\_\_/useWavoipAndReauth.test.ts:1-242 — **nenhum `import` de `@/...` ou `../`**; assertivas sobre literais reescritos (`:5`, `:12`, `:27-29`, `:41`) | — | — | Não exercita `useWavoipCall` nem o fluxo de reauth |

## Achados graves

1. **🔴 CRÍTICO — `createTestData` fabrica e grava dados em tabelas de produção, exposto por botão na UI.**
   `src/hooks/useAgentRanking.ts:262-307` gera nomes, telefones, durações, sentimentos, notas de satisfação e scores de performance com `Math.random()` (14 ocorrências: linhas 269, 271, 272, 275, 276, 278, 279, 284, 285, 288, 290, 293, 294, 295) e faz `INSERT` real em **`call_sessions`** (`:274`), **`call_summaries`** (`:286`) e **`call_analyses`** (`:292`). Não há guarda de ambiente, de papel/role nem confirmação — o gatilho é um `<Button onClick={createTestData}>` em `src/pages/AgentRanking.tsx:47`, na tela normal de ranking.
   Contaminação em cascata: essas três tabelas alimentam `useAgentRanking` (:107,148,165), `useCallAnalytics` (:36,41), `useDashboardData` (:87), `useExecutiveDashboard` (:114,118), `useCallHistory` (:136-138) e `useCallSession` (:47,181). Métricas executivas, ranking de agentes e histórico de chamadas passam a misturar chamadas inexistentes com reais, sem coluna de marcação (`is_test`/`source`) que permita separá-las depois.

2. **🟠 Transferência de chamada é simulada no cliente.** `src/hooks/useCallTransfer.ts:63` conclui a transferência cega com `setTimeout(() => completeTransfer(callId), 2000)`; todo o hook opera só sobre estado React (`:16-70`), sem sinalização SIP/REFER nem persistência em tabela. A UI reporta sucesso após 2 s independentemente do resultado real no PBX.

3. **🟠 Seis módulos órfãos com backend já provisionado** (nenhum consumidor de produção; apenas testes que os importam): `useAdherence` (edge `compute-adherence`), `useChatbot` (edge `chatbot-respond`), `useChurnRisk` (`churn_risk_signals`), `useCallPlaylists`+`usePlaylistItems` (`call_playlists`, `playlist_items`), `useCoachingAssignments` (`coaching_assignments`), `useComplianceRules` (`compliance_rules`). São ~415 linhas de código mantidas e testadas que nada exercita em runtime — e sinalizam tabelas/edge functions possivelmente sem escrita nem leitura reais.

4. **🟡 Barrel `src/hooks/auth/index.ts` morto.** Re-exporta 5 símbolos (`:1-7`) e não é importado em lugar nenhum de `src/` — busca por `hooks/auth'`, `@/hooks/auth`, `./auth`, `../auth` retorna zero. Cria dois caminhos de import concorrentes para o mesmo módulo de autenticação.

5. **🟡 Dependência externa não crítica degrada silenciosamente a detecção de dispositivo novo.** `src/hooks/useDeviceDetection.ts:48` chama `https://ipapi.co/json/`; em falha retorna `{ ip: 'Unknown' }` (`:64`) e a checagem `isNewIP` (`:109`) fica sempre `false`, suprimindo o alerta de novo dispositivo (`invoke('notify-new-device')`, `:124`) — um controle de segurança que desliga sem erro visível.

6. **🟡 Agregação de dashboards executivos feita no cliente.** `src/hooks/useExecutiveDashboard.ts:114-122` puxa 5 tabelas brutas (`call_sessions`, `call_summaries`, `call_alerts`, `agent_goals`, `hold_events`) para somar no browser, enquanto `useDashboardData` já usa RPCs agregadoras (`:56,71,102,114`). Inconsistência de arquitetura e risco de estouro do limite de linhas do PostgREST à medida que o volume cresce.

## Qualidade dos testes deste lote

- 9 arquivos de teste no manifesto. **8 de 9 importam o alvo de fato** — `useVoipTrunks.coverage.test.tsx:12`, `useWavoipCall.coverage.test.tsx:26` (`from '@/hooks/useWavoipCall'`), `useWebAuthn.coverage.test.tsx:3`, `useWebVitals.coverage.test.tsx:14`, `auth/useAuthActions.coverage.test.tsx:3`, `auth/useAuthProfile.coverage.test.tsx:26`, `auth/useAuthSession.coverage.test.tsx:26`, `telemetry/useTelemetry.coverage.test.tsx:33`.
- **1 de 9 é espelho puro:** `src/hooks/__tests__/useWavoipAndReauth.test.ts` (242 linhas) não tem um único `import` de código do projeto (`:1` importa só `vitest`); testa objetos literais reescritos no próprio arquivo — ex.: `:5` declara a lista de status, `:12` monta o "estado inicial" à mão, `:27-29` reimplementa a transição `calling → active`, `:41` reimplementa `isInCall`. Se `useWavoipCall` mudar ou for deletado, esses 242 testes continuam verdes. Contam para cobertura de arquivos sem cobrir uma linha do alvo.
- **Nenhum `.skip`, `.todo` ou `.only`** nos 9 arquivos.
- Descasamento entre lote de testes e lote de código: os 5 testes de `__tests__/` cobrem hooks de outro lote (`useVoipTrunks`, `useWavoipCall`, `useWebAuthn`, `useWebVitals`), enquanto **10 hooks de produção deste lote não têm teste algum**: `useAgentFinancialLeaderboard`, `useAlertPresets`, `useBlfBoard`, `useCallPark`, `useCallQueues`, `useDataLakeExports`, `useDeviceLabel`, `useDialerFavorites`, `useExtensionsAdmin`, `predictive-dialer/api.ts` — vários deles com mutação/escrita (`useCallPark:143,185`, `useDialerFavorites:112,138,158`, `useCallQueues:70,90,105,121`).
- Os testes que existem para o restante do lote (`*.coverage.test.tsx` referenciados na coluna Consumidor) são majoritariamente de cobertura com `supabase` mockado; para os 6 hooks órfãos, **o teste é o único consumidor**, o que dá falsa sensação de funcionalidade viva.

## Integrações de terceiros observadas

| Integração | Onde | Natureza |
|---|---|---|
| **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions) | onipresente; ex. `src/hooks/useHealthCheck.ts:59-90` exercita os 5 subsistemas | Backend principal |
| **Bitrix24 (CRM)** | `src/hooks/useBitrix.ts:77` (`invoke('bitrix-api')`), tabelas `bitrix_users`/`bitrix_departments`/`crm_sync_queue` (:137,172,227,262) | CRM externo via edge function; mensagem de instabilidade tratada em `:235` |
| **ipapi.co** | `src/hooks/useDeviceDetection.ts:48` — `fetch('https://ipapi.co/json/')` | Geolocalização por IP, **única chamada HTTP direta a domínio externo em todo o lote**; fallback silencioso em `:64` |
| **web-vitals** | `src/hooks/telemetry/useTelemetry.ts` (→ `performance_metrics`, `:20`); `__tests__/useTelemetry.coverage.test.tsx:3` importa `type { Metric } from 'web-vitals'` | Telemetria de performance |
| **WebRTC / Web Audio nativos** | `useAudioOutputDevices.ts:29,42,84`; `useCallRecording.ts:29` (`getUserMedia` + MediaRecorder); `useCriticalAlertNotifications.ts:60-78` (`AudioContext`/oscillator) | APIs do browser, sem SDK terceiro |
| **Notification API do browser** | `src/hooks/useCriticalAlertNotifications.ts:45-49` | Permissão e push local |
| **TanStack Query + sonner (toast)** | ex. `useAnomalyRemediation.ts:1-2`, `useDeals.ts`, `useCadences.ts` | Bibliotecas de estado/UI, padrão do projeto |
| Sem evidência no lote | — | Nenhum Stripe, Twilio, Asterisk/AMI, OpenAI ou webhook n8n aparece diretamente nos 79 módulos; toda IA/telefonia passa por edge functions Supabase (`analyze-talk-ratio`, `detect-key-moments`, `generate-coaching`, `extract-crm-fields`, `score-call-attempt`, `chatbot-respond`, `forecast-*`) |

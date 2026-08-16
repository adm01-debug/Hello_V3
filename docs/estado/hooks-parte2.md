<!-- Gerado pela auditoria de estado. Fonte: lote H2. -->

> **Procedência:** lote `H2` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 18/84 arquivos citados (21%) — o lote relata por hook-alvo, não por arquivo de teste. **Confiança parcial**: a cobertura declarada não pôde ser confirmada arquivo a arquivo.
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote H2 — src/hooks (parte 2)

## Cobertura

- Manifesto: 84 arquivos, 11.069 linhas — **todos os 84 são arquivos de teste** em `src/hooks/__tests__/` (nenhum arquivo de produção no manifesto).
- Mapeados para **76 alvos distintos**: 72 hooks de produção existentes em `src/hooks/*.ts` + 4 nomes de teste **sem hook correspondente** (`useSecurityHardening`, `useSecurityHooks`, `useSessionAndAgent`, `useUncoveredHooks`).
- Para cada alvo auditei o hook de produção (tabelas/RPC/edge fn), consumidores e o(s) teste(s).
- **Padrões de import testados no grep de consumidores** (declarados conforme exigido): (a) `grep -rlE "\bNOME\b" src --include=*.ts --include=*.tsx` — pega import estático de linha única, import multilinha, `lazy(() => import(...))`, re-export e uso em string; (b) para os 4 órfãos, re-grep sem `-l` (`grep -rn`) em todo `src/`, excluindo `__tests__` e o próprio arquivo — zero ocorrências em ambos.
- Verificação cruzada: as 66 tabelas tocadas por este lote **existem todas** nas migrations (`cut -d'|' -f1 scratchpad/tabelas_mig.txt`); as 5 RPCs (`match_kb_articles`, `check_login_lockout`, `record_failed_login`, `record_successful_login`, `record_trunk_usage`) existem em `funcs.txt`; as 28 edge functions invocadas **existem todas** em `supabase/functions/`.
- Não executei testes. Nenhuma escrita fora deste arquivo.

## Tabela de funcionalidades

| Funcionalidade | Classificação | Evidência | Consumidor | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| useHoldMetrics | 🟨 | `src/hooks/useHoldMetrics.ts:30,58-64` | `src/pages/HoldMetrics.tsx` | `hold_events`, `call_sessions`, `agents` | Métrica por agente filtra `h.agent_name === agent.name` (`useHoldMetrics.ts:60`) mas o único gravador nunca preenche `agent_name` — ver Achado #1 |
| useHoldReminder | ✅ | `src/hooks/useHoldReminder.ts:26-33` | `src/components/calls/HoldReminderSettings.tsx`, `ActiveCallsIndicator.tsx` | — (localStorage via `@/lib/holdReminderSounds`) | Preferências só locais; sem sync por usuário no banco |
| useHoldSoundAlert | ✅ | `src/hooks/useHoldSoundAlert.ts` (159 l.) | `src/hooks/useActiveCallsRealtime.ts` → `src/components/dashboard/ActiveCallsRealtime.tsx` | `hold_alert_settings` | — |
| useIPValidation | ✅ | `src/hooks/useIPValidation.ts:10` | `src/pages/Login.tsx` | edge `validate-ip` | Fail-open deliberado (`{allowed:true}` em erro, linhas 16 e 23) — decisão de risco, não bug |
| useIPWhitelist | ✅ | `src/hooks/useIPWhitelist.ts` (150 l.) | `src/pages/IPWhitelist.tsx` | `ip_whitelist`, `user_allowed_ips`, `user_ip_restrictions`, `blocked_access_logs`, `user_profiles` | — |
| useKeyMoments | ✅ | `src/hooks/useKeyMoments.ts` (65 l.) | `KeyMomentsTimeline.tsx`, `CallDetailDialog.tsx` | `call_key_moments`, edge `detect-key-moments` | — |
| useKnowledgeBase | ✅ | `src/hooks/useKnowledgeBase.ts` (186 l.) | `src/pages/Knowledge.tsx` | `kb_articles`, `kb_categories`, `kb_article_views`, RPC `match_kb_articles`, edge `embed-kb-article` | — |
| useLearning | ✅ | `src/hooks/useLearning.ts` (73 l.) | `src/pages/Learning.tsx` | `learning_modules`, `learning_completions` | — |
| useLiveAssist | ✅ | `src/hooks/useLiveAssist.ts` (156 l.) | `AgentAssistDashboardCard.tsx`, `NextBestActionPanel.tsx`, `ActiveCallBar.tsx`, `src/pages/AgentAssist.tsx` | `live_assist_signals`, edge `analyze-live-utterance` | — |
| useLiveSentiment | ✅ | `src/hooks/useLiveSentiment.ts` (50 l.) | `LiveSentimentGraph.tsx`, `CallDetailDialog.tsx` | `live_sentiment_snapshots` | — |
| useLiveTranslation | ✅ | `src/hooks/useLiveTranslation.ts` (93 l.) | `src/components/translation/LiveTranslationPanel.tsx` | edge `translate-utterance` | Sem persistência do histórico traduzido |
| useLoginLockout | ✅ | `src/hooks/useLoginLockout.ts` (114 l.) | `src/pages/Login.tsx` | RPCs `check_login_lockout`, `record_failed_login`, `record_successful_login` | — |
| useMFA | ✅ | `src/hooks/useMFA.ts` (212 l.) | `ReauthDialog.tsx`, `src/hooks/useSecurityDashboard.ts`, `src/pages/TwoFactorAuth.tsx` | `user_mfa_settings` + `supabase.auth.mfa` | — |
| useMeetingSummary | ✅ | `src/hooks/useMeetingSummary.ts` (259 l.) | `MeetingSummaryDashboardCard.tsx`, `MeetingSummaryCard.tsx`, `src/lib/meeting-summary-utils.ts`, `src/pages/MeetingSummaries.tsx` | `meeting_summaries`, edge `generate-meeting-summary` | — |
| useMultiChannelCall | 🟨 | `src/hooks/useMultiChannelCall.ts:143-146,169` | 16 arquivos (`UnifiedSoftphone.tsx`, `PhoneDialer.tsx`, `useCallTimers`, `useCallTransfer`, `useHoldReminder`…) | `hold_events` | `setCallDbSession` (linha 169) é exportado mas **nunca chamado** em `src/` → toda escrita em `hold_events` sai com `call_session_id`/`agent_name` NULL e nunca é encerrada. Ver Achado #1 |
| useMultiChannelCallConference | ⬛ | `src/hooks/useMultiChannelCallConference.ts:17`; `grep -rn useMultiChannelCallConference src` fora de `__tests__` = 0 resultados | **nenhum** | — (estado local) | Lógica de conferência duplicada e viva dentro de `useMultiChannelCall.ts:189-215` (`startConference`/`addToConference`/`endConference`) — este arquivo é o gêmeo morto |
| useMultiDeviceRing | ✅ | `src/hooks/useMultiDeviceRing.ts` (84 l.) | `src/pages/MultiDeviceRing.tsx` | `agent_devices`, `agent_ring_settings` | — |
| useNetworkMonitor | ✅ | `src/hooks/useNetworkMonitor.ts:31-70` | `NetworkStatusBadge.tsx`, `NetworkStatusIndicator.tsx`, `src/pages/NetworkDiagnostics.tsx` | — (Navigator Connection API + ping) | Métricas não são persistidas em nenhuma tabela |
| useNotifications | ⬛ | `src/hooks/useNotifications.ts` (219 l.); `grep -rn useNotifications src` fora de `__tests__` = 0 | **nenhum** | `notifications`, `notification_preferences` | Substituído por `src/components/notification-center/useNotificationCenter` (usado em `src/pages/NotificationCenter.tsx:16,37`). 219 linhas mortas |
| useObjectionLibrary | ✅ | `src/hooks/useObjectionLibrary.ts` (95 l.) | `src/pages/AgentAssist.tsx` | `objection_library` | — |
| useOptimisticLockConflicts | ✅ | `src/hooks/useOptimisticLockConflicts.ts` (95 l.) | `src/pages/ConcurrencyConflicts.tsx` | `optimistic_lock_conflicts` | — |
| usePageTitle | ✅ | `src/hooks/usePageTitle.ts` (16 l.) | 95 páginas | — | — |
| usePermissions | ✅ | `src/hooks/usePermissions.ts` (100 l.) | `src/components/auth/PermissionGate.tsx` | `user_roles`, `role_permissions` | — |
| usePredictiveDialer | ✅ | `src/hooks/usePredictiveDialer.ts:5-19,263` + `src/hooks/predictive-dialer/api.ts` | `PredictiveDialerPanel.tsx`, `DialerControlPanel.tsx`, `CreateCampaignDialog.tsx`, `AddContactsDialog.tsx` | `dialer_campaigns`, `dialer_queue` (via `predictive-dialer/api.ts`) + realtime channel | — |
| useProfile | ✅ | `src/hooks/useProfile.ts` (70 l.) | `src/components/settings/ProfileSettings.tsx` | `user_profiles` | — |
| useQualityAlerts | ✅ | `src/hooks/useQualityAlerts.ts:9-22` | `src/components/layout/GlobalServices.tsx` | — (deriva de `useQualityMetrics`) | Alerta é só toast+log; não grava em `voip_quality_alerts` nem desduplica entre sessões |
| useQualityMetrics | ✅ | `src/hooks/useQualityMetrics.ts` (56 l.) | `RealtimeQualityDashboard.tsx`, `src/hooks/useQualityAlerts.ts` | `call_quality_metrics`, `voip_trunk_usage_metrics` | — |
| useQualityTrendAnalyzer | ✅ | `src/hooks/useQualityTrendAnalyzer.ts` (115 l.) | `src/hooks/useSipCall.ts` → 5 telas | `voip_quality_alerts` | — |
| useQueueMetrics | ✅ | `src/hooks/useQueueMetrics.ts` (182 l.) | `QueueMetricsCards.tsx`, `QueueGoalsTab.tsx`, `QueueRealtimeCharts.tsx`, `src/pages/QueueMetricsDashboard.tsx` | `call_sessions`, `agents`, `dashboard_goals`, edge `check-goals` | — |
| useRateLimitData | ✅ | `src/hooks/useRateLimitData.ts` (138 l.) | `src/pages/RateLimitDashboard.tsx` | `rate_limit_logs`, `rate_limit_alerts`, `rate_limit_settings` | — |
| useRealtimeHoldAlerts | ✅ | `src/hooks/useRealtimeHoldAlerts.ts` (274 l.) | `NotificationBell.tsx`, `UnifiedNotificationDropdown.tsx` | `call_alerts` + localStorage (7 refs) | Depende de `hold_events` encerrados corretamente — impactado pelo Achado #1 |
| useReauth | ✅ | `src/hooks/useReauth.ts:55,79,85` | `ReauthDialog.tsx`, `src/pages/SessionManagement.tsx` | — (`supabase.auth.signInWithPassword` / `auth.mfa`) | — |
| useRecordings | ✅ | `src/hooks/useRecordings.ts` (163 l.) | `TranscriptionDialog.tsx`, `src/pages/Recordings.tsx` | `call_recordings`, edge `transcribe-recording`, `analyze-sentiment` | — |
| useRenewals | ✅ | `src/hooks/useRenewals.ts` (86 l.) | `src/pages/Renewals.tsx` | `renewals` | — |
| useRoutingRules | ✅ | `src/hooks/useRoutingRules.ts` (77 l.) | `src/pages/RoutingRules.tsx` | `routing_rules` | — |
| useSLA | ✅ | `src/hooks/useSLA.ts` (113 l.) | `OmnichannelCard.tsx`, `src/pages/SLAPolicies.tsx` | `sla_policies`, `conversations`, edge `enforce-sla` | — |
| useScheduledCallbacks | ✅ | `src/hooks/useScheduledCallbacks.ts` (240 l.) | `ScheduleCallbackDialog.tsx`, `ScheduledCallbacksList.tsx` | `scheduled_callbacks` | — |
| useScorecards | ⬛ | `src/hooks/useScorecards.ts` (88 l.); `grep -rn useScorecards src` fora de `__tests__` = 0; menção a "scorecard" em `src/` só em `src/pages/marketing/Landing.tsx` (texto de marketing) | **nenhum** | `scorecard_templates`, `scorecard_criteria`, `scorecard_responses`, `call_scorecards`, edge `score-call` | Feature inteira sem UI: 4 tabelas + 1 edge function provisionadas, hook pronto, nenhuma tela |
| useSecurityDashboard | ✅ | `src/hooks/useSecurityDashboard.ts` (87 l.) | `src/pages/SecurityDashboard.tsx` | `security_alerts`, `blocked_access_logs`, `user_ip_restrictions` | — |
| useSecurityHardening *(só teste)* | ⬛ | `src/hooks/__tests__/useSecurityHardening.test.ts` (863 l.); nenhum `import` de `@/` ou `../` no arquivo (linha 15 é o único import: `vitest`); `src/hooks/useSecurityHardening.ts` **não existe** | — | — | Ver Achado #2: 863 linhas que afirmam validar RLS/storage/HSTS sem tocar em nenhum código-fonte nem no banco |
| useSecurityHooks *(só teste)* | ⬛ | `src/hooks/__tests__/useSecurityHooks.test.ts:1` (único import = `vitest`), `describe('usePermissions')` l.40, `describe('useReauth')` l.118, `describe('useIPValidation')` l.151, `describe('useAuditLog')` l.180; hook homônimo inexistente | — | — | Espelho: reimplementa a lógica dos 4 hooks nomeados; monta mock de supabase (l.9-27) que nunca é consumido pelo alvo real |
| useSecurityMonitoringData | ✅ | `src/hooks/useSecurityMonitoringData.ts` (109 l.) | `src/pages/SecurityMonitoring.tsx` | `security_alerts`, `audit_logs` | — |
| useSecurityNotifications | ✅ | `src/hooks/useSecurityNotifications.ts:79,95,108` | `src/components/security/NotificationPermissionBanner.tsx` | 3 canais realtime (security/blocked-access/rate-limit) | — |
| useSessionAndAgent *(só teste)* | ⬛ | `src/hooks/__tests__/useSessionAndAgent.test.ts:1-4` (constantes literais `SESSION_DURATION_HOURS`/`REFRESH_THRESHOLD_MINUTES` redeclaradas), sem import de produção; hook homônimo inexistente | — | — | Espelho de `useSessionManager`; se as constantes reais mudarem, o teste continua verde |
| useSessionManager | ✅ | `src/hooks/useSessionManager.ts` (250 l.) | `src/hooks/useSecurityDashboard.ts`, `src/pages/SessionManagement.tsx` | `active_sessions` | — |
| useShifts | ✅ | `src/hooks/useShifts.ts` (104 l.) | `src/pages/Scheduling.tsx` | `agent_shifts`, `shift_templates` | Testes fracos (ver seção de qualidade) |
| useSipCall | ✅ | `src/hooks/useSipCall.ts:4-11,153,162,176` | `SipConnectionStatus.tsx`, `UnifiedSoftphone.tsx`, `DialerControlPanel.tsx`, `PhoneDialer.tsx`, `Calls.tsx` | edge `sip-config` + JsSIP/WebRTC real | — |
| useSkills | ✅ | `src/hooks/useSkills.ts` (74 l.) | `src/pages/Skills.tsx` | `skills`, `agent_skills` | Testes fracos |
| useSuccessPlans | ✅ | `src/hooks/useSuccessPlans.ts` (101 l.) | `src/pages/SuccessPlans.tsx` | `success_plans`, `success_plan_milestones` | — |
| useSupervisorPanel | ✅ | `src/hooks/useSupervisorPanel.ts:59-98` | `SupervisorPanel.tsx`, `panel/QueueMetricsGrid.tsx`, `panel/types.ts` | `call_sessions`, `barge_in_sessions`, `whisper_messages` + localStorage | Config de som só local |
| useSurveys | ⬛ | `src/hooks/useSurveys.ts` (66 l.); `grep -rn useSurveys src` e `grep -rln "survey_responses\|Survey" src` fora de `__tests__` retornam só o próprio hook e `integrations/supabase/types.ts` | **nenhum** | `survey_responses`, edge `send-survey` | Sem tela de CSAT/NPS; tabela + edge function ociosas |
| useTalkRatio | ✅ | `src/hooks/useTalkRatio.ts` (47 l.) | `TalkRatioChart.tsx`, `CallDetailDialog.tsx` | edge `analyze-talk-ratio` | — |
| useTimeOff | ✅ | `src/hooks/useTimeOff.ts` (65 l.) | `src/pages/Scheduling.tsx` | `time_off_requests` | — |
| useTrackers | ✅ | `src/hooks/useTrackers.ts` (78 l.) | `src/pages/Trackers.tsx` | `trackers`, `tracker_matches` | — |
| useTrunkFailoverMonitor | ✅ | `src/hooks/useTrunkFailoverMonitor.ts:11-48` | `src/components/layout/GlobalServices.tsx` | realtime channel em trunks | Só notifica (toast); não registra o evento de failover em tabela |
| useTrunkHealth | ✅ | `src/hooks/useTrunkHealth.ts` (53 l.) | `TrunkHealthHistoryDrawer.tsx`, `src/pages/admin/VoipTrunksAdmin.tsx` | `voip_trunk_health_checks`, edge `voip-trunks-healthcheck` | — |
| useTrunkMetrics | ✅ | `src/hooks/useTrunkMetrics.ts` (97 l.) | `src/components/admin/voip/TrunkMetricsTab.tsx` | `voip_trunks`, `voip_trunk_usage_metrics` | — |
| useTrunkRealtimeMetrics | ✅ | `src/hooks/useTrunkRealtimeMetrics.ts` (74 l.) | `src/pages/admin/VoipTrunksAdmin.tsx` | `voip_trunks`, `call_sessions` | — |
| useTrunkUsageReporter | ✅ | `src/hooks/useTrunkUsageReporter.ts` (58 l.) | `src/hooks/useSipCall.ts` → 5 telas | RPC `record_trunk_usage` | — |
| useUncoveredHooks *(só teste)* | ⬛ | `src/hooks/__tests__/useUncoveredHooks.test.ts:1` (único import = `vitest`), 15 blocos `describe` (l.86-663) rotulados "…Logic"; hook homônimo inexistente | — | — | Ver Achado #3: 699 linhas de espelho, inclusive testando "CORS Headers" (l.648) e "Rate Limiter" (l.663) de edge functions sem importar nenhuma |
| useUnreadConflicts | ✅ | `src/hooks/useUnreadConflicts.ts` (34 l.) | `src/components/layout/AppSidebar.tsx` | `optimistic_lock_conflicts` | — |
| useVoiceBiometrics | ✅ | `src/hooks/useVoiceBiometrics.ts` (202 l.) | `src/pages/VoiceSecurity.tsx` | `voice_prints`, `fraud_signals`, edges `enroll-voice`, `verify-voice`, `redact-sensitive-audio` | — |
| useVoiceCommand | ✅ | `src/hooks/useVoiceCommand.ts` (82 l.) | `VoiceAssistantDialog.tsx`, `softphone/ActiveCallDisplay.tsx` | edges `voice-transcribe`, `voice-command` | — |
| useVoipAnomalies | ✅ | `src/hooks/useVoipAnomalies.ts:50-55` | `AnomalyDetectionCard.tsx`, `src/hooks/useAnomalyRemediation.ts` | edge (invoke tipado `AnomaliesResponse`) | — |
| useVoipAutoRemediation | ✅ | `src/hooks/useVoipAutoRemediation.ts:18-53` | `src/hooks/useSipCall.ts` | — (toast + callbacks) | Nome sugere automação, mas por design "nunca executa ação automática" (comentário l.16); nenhuma remediação é persistida para auditoria |
| useVoipCapacityRecommendations | ✅ | `src/hooks/useVoipCapacityRecommendations.ts:26-30` | `src/components/network/QualityForecastCard.tsx` | deriva de `useVoipQualityForecast` (edge) | — |
| useVoipDiagnosticVoiceQA | ✅ | `src/hooks/useVoipDiagnosticVoiceQA.ts` (45 l.) | `src/components/network/VoipVoiceQAPanel.tsx` | edge `voip-diagnostic-voice-qa` | — |
| useVoipExecutiveNarrative | ✅ | `src/hooks/useVoipExecutiveNarrative.ts` (54 l.) | `src/components/network/ExecutiveSummaryDialog.tsx` | edge `voip-executive-narrative` | — |
| useVoipExecutiveSummary | ✅ | `src/hooks/useVoipExecutiveSummary.ts` (68 l.) | `ExecutiveReportExport.tsx`, `VoipHealthScoreCard.tsx` | edge `voip-executive-summary` | — |
| useVoipMonitoringSettings | ✅ | `src/hooks/useVoipMonitoringSettings.ts` (58 l.) | `VoipMonitoringSettingsDialog.tsx`, `src/pages/admin/VoipTrunksAdmin.tsx` | `voip_monitoring_settings` | Teste contém `expect(true)` (ver qualidade) |
| useVoipQualityForecast | ✅ | `src/hooks/useVoipQualityForecast.ts` (68 l.) | `QualityForecastCard.tsx`, `src/hooks/useVoipCapacityRecommendations.ts` | edge `voip-quality-forecast` | — |
| useVoipQualityMonitor | ✅ | `src/hooks/useVoipQualityMonitor.ts:60,77` | 6 arquivos (`WebRTCCall.tsx`, `PostCallSummary.tsx`, `VoipQualityIndicator.tsx`, `CallQualityIndicator.tsx`, `WebRTCMetricsPanel.tsx`, `useSipCall.ts`) | `call_quality_metrics` + `RTCPeerConnection.getStats()` real | — |
| useVoipRecommendationHistory | ✅ | `src/hooks/useVoipRecommendationHistory.ts` (70 l.) | `src/components/network/RecommendationHistoryDrawer.tsx` | edge `voip-recommendation-history` | — |
| useVoipRecommendationInsights | ✅ | `src/hooks/useVoipRecommendationInsights.ts` (50 l.) | `src/components/network/RecommendationInsightsCard.tsx` | edge `voip-recommendation-insights` | — |
| useVoipRecommendationSimulate | ✅ | `src/hooks/useVoipRecommendationSimulate.ts:40-41` | `src/components/network/WhatIfSimulatorDialog.tsx` | edge `voip-recommendation-simulate` | — |
| useVoipRecommendations | ✅ | `src/hooks/useVoipRecommendations.ts` (71 l.) | `WhatIfSimulatorDialog.tsx`, `VoipRecommendationsPanel.tsx`, `src/pages/NetworkDiagnostics.tsx` | edge `voip-recommendations` | — |

Totais: **68 ✅ · 2 🟨 · 0 🟦 · 8 ⬛** (4 hooks órfãos + 4 arquivos de teste sem hook alvo).

## Achados graves

### #1 (CRÍTICO) — `hold_events` recebe registros permanentemente incompletos e nunca encerrados

`useMultiChannelCall` é o **único gravador** de `hold_events` em todo o repositório (confirmado por `grep -rn "hold_events" src supabase/functions` → escrita apenas em `src/hooks/useMultiChannelCall.ts:143,146`).

- Linha 143: `insert({ call_session_id: callSessionId || null, agent_name: agentName || null, ... })`.
- Os valores vêm de `call.dbSessionId` / `call.agentName` (linha 157), preenchidos exclusivamente por `setCallDbSession` (linha 169).
- `setCallDbSession` é exportado (linha 241) e **nunca é invocado**: `grep -rn "setCallDbSession" src` retorna apenas as próprias linhas 169 e 241 do hook.

Consequências verificáveis:
1. Todo hold gravado sai com `call_session_id = NULL` e `agent_name = NULL` — dado fabricado/órfão em tabela real.
2. O encerramento (linha 145) busca `.eq('call_session_id', callSessionId ?? '')` → compara com string vazia, que nunca casa com linhas NULL → **`ended_at` e `duration_seconds` jamais são preenchidos**.
3. `src/hooks/useHoldMetrics.ts:60-62` calcula tempo/contagem de hold por agente filtrando `h.agent_name === agent.name` → sempre 0 para todos os agentes; o dashboard `src/pages/HoldMetrics.tsx` exibe métrica zerada como se fosse real.
4. `supabase/functions/check-hold-alerts/index.ts:49-52` seleciona `hold_events` com `.is('ended_at', null)` → cada hold vira um "hold ativo eterno", gerando alertas em `call_alerts` indefinidamente; `src/hooks/useActiveCallsRealtime.ts:40` faz a mesma leitura e acumula holds fantasmas.

### #2 (GRAVE) — `useSecurityHardening.test.ts`: 863 linhas de garantia de segurança sem código sob teste

`src/hooks/__tests__/useSecurityHardening.test.ts` declara no cabeçalho (l.1-13) validar "RLS policy hardening, storage policy enforcement, realtime channel restrictions, privilege escalation prevention, brute force protection, audit log integrity, token security, input sanitization". Os `describe` confirmam o escopo: `'RLS Policy Hardening'` (l.57), `'Storage Policy Enforcement'` (l.144), `'Privilege Escalation Prevention'` (l.239), `'Audit Log Integrity'` (l.419), `'HTTPS Enforcement'` (l.639), `'HSTS Headers'` (l.663), `'Database Security Functions'` (l.687).

O único `import` do arquivo é `vitest` (l.15) — nenhuma policy, migration, edge function ou hook é carregado; o mock de supabase (l.18-30) nunca é entregue a código de produção. O arquivo asserta literais reescritos à mão. **É um selo de conformidade de segurança que não pode falhar quando a segurança regredir.** Não existe `src/hooks/useSecurityHardening.ts`.

### #3 (GRAVE) — `useUncoveredHooks.test.ts`: 699 linhas de espelho batizadas de cobertura

`src/hooks/__tests__/useUncoveredHooks.test.ts` monta um mock completo de supabase (l.4-30) e roda 15 blocos `describe` rotulados "…Logic" (l.86-663), cobrindo `Agent Status`, `Contact Alerts`, `IP Validation`, `Permissions`, `Audit Log`, `Notification Preferences`, `Session Manager`, `Security Notification`, `Hold Sound Alert`, `Voice Command`, `Realtime Hold Alerts`, `Conference Recording` e até `Edge Function CORS Headers` (l.648) e `Edge Function Rate Limiter` (l.663). Único `import`: `vitest` (l.1). Nenhum hook nem edge function é importado — o mock é decorativo. O nome do arquivo sugere que os hooks "descobertos" ganharam cobertura; não ganharam.

### #4 (MÉDIO) — Quatro features completas mortas com infraestrutura provisionada

| Hook | Linhas | Infra ociosa |
|---|---|---|
| `useScorecards` | 88 | `scorecard_templates`, `scorecard_criteria`, `scorecard_responses`, `call_scorecards` + edge `score-call` |
| `useNotifications` | 219 | `notifications`, `notification_preferences` — substituído por `src/components/notification-center/useNotificationCenter` (`src/pages/NotificationCenter.tsx:16,37`) |
| `useSurveys` | 66 | `survey_responses` + edge `send-survey` |
| `useMultiChannelCallConference` | 134 | duplica `useMultiChannelCall.ts:189-215` |

Todas as 4 tabelas/edges existem nas migrations e em `supabase/functions/` — ou seja, custo de manutenção e superfície de RLS mantidos para código sem nenhum consumidor. Cada um ainda tem teste de cobertura passando, o que mascara o abandono.

### #5 (MENOR) — `useVoipAutoRemediation` promete mais do que faz
`src/hooks/useVoipAutoRemediation.ts:16` documenta "Nunca executa ação automática". O nome do hook e a nomenclatura "auto-remediation" na UI de rede sugerem automação; além disso nenhuma remediação (aceita ou recusada) é registrada em tabela — não há trilha de auditoria para o que foi sugerido durante degradação de qualidade.

### #6 (MENOR) — `useIPValidation` é fail-open
`src/hooks/useIPValidation.ts:16` e `:23` retornam `{ allowed: true }` quando a edge `validate-ip` falha ou lança. Consumido em `src/pages/Login.tsx`: indisponibilidade do serviço de validação libera o login de qualquer IP. Pode ser decisão consciente, mas não há flag/alerta que registre o bypass.

## Qualidade dos testes deste lote

**Positivo**
- **Zero `.skip` / `.todo` / `.only` / `xit` / `xdescribe`** em todos os 84 arquivos (grep sobre o manifesto inteiro).
- 75 dos 84 arquivos usam `renderHook` contra o hook real; 741 casos `it()` no total.
- Os `*.coverage.test.tsx` são, no geral, de boa qualidade: mockam `@/integrations/supabase/client`, `@/lib/tracing`, `@/lib/logger` e `sonner`, e então importam o alvo real e verificam o contrato de chamada. Exemplo de referência: `useVoipRecommendations.coverage.test.tsx:27` (`import { useVoipRecommendations } from '../useVoipRecommendations'`) com asserção do payload exato do invoke (l.63-66) e do caminho de erro (l.78-83).

**Negativo — 9 arquivos (≈2.947 linhas, 27% do lote) são espelhos que não importam nada de produção**

`useHoldReminder.test.ts` (263 l.), `useMFA.test.ts` (172), `useMultiChannelCall.test.ts` (207), `usePredictiveDialer.test.ts` (202), `useSecurityHardening.test.ts` (863), `useSecurityHooks.test.ts` (197), `useSessionAndAgent.test.ts` (209), `useUncoveredHooks.test.ts` (699) — único `import` é `vitest`. `useLoginLockout.test.ts` (135) importa apenas `@/integrations/supabase/client` (l.10) e testa o formato de retorno das RPCs mockadas, não o hook.

Padrão recorrente: constantes e algoritmos do hook são **redigitados dentro do teste** — `MAX_SIMULTANEOUS_CALLS = 3` em `useMultiChannelCall.test.ts:3` (o real está em `useMultiChannelCall.ts`), `SESSION_DURATION_HOURS = 24` / `REFRESH_THRESHOLD_MINUTES = 30` em `useSessionAndAgent.test.ts:3-4`, `generateBackupCodes` reimplementado em `useMFA.test.ts:5-8`, `getNewStatus` reimplementado em `usePredictiveDialer.test.ts:23-31`. Se o valor real mudar, o teste permanece verde. São testes que testam a si mesmos.

**Outras fraquezas**
- 5 arquivos apoiam-se em asserções `toBe('function')` (só verificam que o hook devolve callbacks): `useNotifications.coverage.test.tsx`, `usePredictiveDialer.coverage.test.tsx`, `useShifts.coverage.test.tsx`, `useShifts.test.tsx`, `useSkills.test.tsx`.
- 2 arquivos contêm `expect(true)`: `useHoldSoundAlert.coverage.test.tsx`, `useVoipMonitoringSettings.coverage.test.tsx`.
- 4 hooks órfãos (Achado #4) mantêm testes de cobertura passando — a suíte sinaliza saúde para código sem consumidor.
- Nenhum teste cobre o defeito do Achado #1: `useMultiChannelCall.coverage.test.tsx` importa o hook real (2×) mas não exercita `setCallDbSession` nem valida o payload de `hold_events`.

## Integrações de terceiros observadas

- **Supabase** (`@/integrations/supabase/client`) — onipresente: PostgREST (66 tabelas), 5 RPCs, Realtime (`supabase.channel` em `useSecurityNotifications.ts:79,95,108`, `useTrunkFailoverMonitor.ts:11`, `usePredictiveDialer.ts:263`), Auth/MFA (`useReauth.ts:55,79,85`; `useMFA.ts`) e Edge Functions (28 distintas, todas presentes em `supabase/functions/`).
- **JsSIP** (`jssip`) — pilha SIP real em `src/hooks/useSipCall.ts:4-6,153,162` (`JsSIP.WebSocketInterface`, `JsSIP.UA`), com `RTCSession` e `RTCPeerConnection` (l.176-180).
- **WebRTC nativo** — `RTCPeerConnection.getStats()` em `src/hooks/useVoipQualityMonitor.ts:60,77` alimentando `call_quality_metrics` (métricas reais, não sintéticas).
- **Network Information API** — `navigator.connection` (`effectiveType`/`downlink`/`rtt`) em `src/hooks/useNetworkMonitor.ts:45-51`.
- **TanStack Query** (`@tanstack/react-query`) — camada de cache da maioria dos hooks de leitura (ex.: `useVoipAnomalies.ts:1,50`, `useVoipCapacityRecommendations.ts:1,26`).
- **sonner** — toasts; em `useQualityAlerts.ts:16` e `useVoipAutoRemediation.ts:29` o toast é o *único* efeito do alerta (nada persistido).
- **lucide-react** — importado dentro de um hook (`useTrunkFailoverMonitor.ts:5`: `AlertTriangle`, `RefreshCw`), acoplando camada de dados a ícones de UI.
- **Web APIs de navegador** — `localStorage` (`useHoldSoundAlert`, `useRealtimeHoldAlerts` 7 refs, `useSupervisorPanel.ts:59-98`), Notification API (`useHoldReminder.ts:33`, `useSecurityNotifications`) e WebAudio via `@/lib/holdReminderSounds` (`useHoldReminder.ts:6-11`).
- Nenhum SDK de terceiro fora do Supabase/JsSIP foi encontrado neste lote (sem Twilio, Stripe, OpenAI direto no cliente — a IA fica nas edge functions).

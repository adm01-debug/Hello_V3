<!-- Gerado pela auditoria de estado. Fonte: lote H4. -->

> **Procedência:** lote `H4` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 93/93 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote H4 — src/hooks (parte 4)

## Cobertura

- **93/93 arquivos do manifesto existem e foram auditados**; `wc -l` confere 11.005 linhas.
- Método de consumo: para cada hook rodei 3 padrões independentes de busca em `src/**/*.{ts,tsx}`:
  1. `hooks/<nome>['"]` (import absoluto `@/hooks/...`);
  2. `/<nome>['"]` (import relativo `./` e `../`, cobre também import multilinha, pois o casamento é na linha do *specifier* e não na linha do `import`);
  3. `\b<nome>\b` (identificador nu — pega re-export, `React.lazy(() => import(...))`, string dinâmica e uso indireto).
  Depois refiz busca por substring simples (`grep -rn <nome>`) nos candidatos a órfão para confirmar. Não existe barrel/`index.ts` em `src/hooks` que pudesse mascarar consumo (verificado: nenhum arquivo do lote é re-exportado).
- Edge functions: cruzei todos os `functions.invoke('<x>')` do lote contra `ls supabase/functions` — **todas as 32 funções invocadas existem no repositório**. Nenhuma invocação aponta para função inexistente.
- Varredura de dado fictício: `Math.random|TODO|FIXME|stub|mock|fake|dummy|placeholder|hardcoded|not implemented|simula|sample data|lorem` sobre os 93 arquivos. Retorno útil em apenas 3 arquivos (detalhado em Achados graves); os demais hits foram falsos positivos (palavra "todos" em português, identificador `Simulate` de uma feature legítima de what-if).
- Testes: para cada hook procurei `src/hooks/__tests__/<nome>.{coverage.test.tsx,test.ts,test.tsx}` e verifiquei se o arquivo contém `from '@/hooks/<nome>'` ou `from '../<nome>'` em **qualquer** linha, além de contar `.skip|xit(|xdescribe(`.
- Não executei testes nem build. Nenhuma escrita fora deste arquivo.

## Tabela de funcionalidades

| Funcionalidade | Classificação | Evidência | Consumidor | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| useHoldMetrics — métricas de espera | ✅ | useHoldMetrics.ts:30,41,52 | src/pages/HoldMetrics.tsx (rota `/hold-metrics`, protectedRoutes.tsx:122) | `hold_events`, `call_sessions`, `agents` | — |
| useHoldReminder — lembrete/alerta de espera | ✅ | useHoldReminder.ts:26,79,87,133-134 | components/calls/HoldReminderSettings.tsx, ActiveCallsIndicator.tsx | local (Notification API + localStorage) | teste `.test.ts` é espelho (ver Qualidade) |
| useHoldSoundAlert — alerta sonoro de espera | ✅ | useHoldSoundAlert.ts:73,82 | hooks/useActiveCallsRealtime.ts | `hold_alert_settings` + realtime channel | — |
| useIPValidation — valida IP no login | ✅ | useIPValidation.ts:10 | src/pages/Login.tsx | edge `validate-ip` | — |
| useIPWhitelist — allowlist de IPs | ✅ | useIPWhitelist.ts:48,80,94,105,117,125,139 | src/pages/IPWhitelist.tsx | `ip_whitelist`, `user_profiles`, `user_ip_restrictions`, `blocked_access_logs`, `user_allowed_ips` | `created_by:'admin'` fixo (useIPWhitelist.ts:80) em vez do usuário real |
| useKeyMoments — momentos-chave da chamada | ✅ | useKeyMoments.ts:31,48 | conversation-intelligence/KeyMomentsTimeline.tsx, call-history/CallDetailDialog.tsx | `call_key_moments`, edge `detect-key-moments` | — |
| useKnowledgeBase — KB com busca semântica | ✅ | useKnowledgeBase.ts:40,66,73,89,122,147,174 | src/pages/Knowledge.tsx | `kb_categories`, `kb_articles`, `kb_article_views`, RPC `match_kb_articles`, edge `embed-kb-article` | — |
| useLearning — trilhas de treinamento | ✅ | useLearning.ts:35,47,56 | src/pages/Learning.tsx | `learning_modules`, `learning_completions` | — |
| useLiveAssist — sugestões em tempo real | ✅ | useLiveAssist.ts:49,63,99,115,145 | pages/AgentAssist.tsx, calls/ActiveCallBar.tsx, calls/NextBestActionPanel.tsx, executive/AgentAssistDashboardCard.tsx | `live_assist_signals`, edge `analyze-live-utterance` | — |
| useLiveSentiment — sentimento ao vivo | ✅ | useLiveSentiment.ts:24,33,41 | conversation-intelligence/LiveSentimentGraph.tsx, CallDetailDialog.tsx | `live_sentiment_snapshots` + realtime | — |
| useLiveTranslation — tradução de fala | ✅ | useLiveTranslation.ts:52 | translation/LiveTranslationPanel.tsx | edge `translate-utterance` | — |
| useLoginLockout — bloqueio por tentativas | ✅ | useLoginLockout.ts:21,53,86 | src/pages/Login.tsx | RPC `check_login_lockout`, `record_failed_login`, `record_successful_login` | teste `.test.ts` não importa o hook (espelho) |
| useMFA — 2FA (TOTP + backup codes) | ✅ | useMFA.ts:55,161-170,176 | pages/TwoFactorAuth.tsx, auth/ReauthDialog.tsx, hooks/useSecurityDashboard.ts | `user_mfa_settings` + supabase.auth.mfa | teste `.test.ts` é espelho e valida algoritmo divergente (ver Achados) |
| useMeetingSummary — resumo de reunião | ✅ | useMeetingSummary.ts:69,82,105,134,154,185,209,239 | pages/MeetingSummaries.tsx, calls/MeetingSummaryCard.tsx, executive/MeetingSummaryDashboardCard.tsx | `meeting_summaries`, edge `generate-meeting-summary` | — |
| useMultiChannelCall — softphone multicanal | ✅ | useMultiChannelCall.ts:89,143-146,190-238 | 22 arquivos (UnifiedSoftphone.tsx, softphone/*, ActiveCallsIndicator.tsx, useCallTimers.ts, useConferenceRecording.ts…) | `hold_events` | `Math.random` só gera id local de UI (:89), não vai para o banco |
| useMultiChannelCallConference — conferência | ⬛ | useMultiChannelCallConference.ts:17,23,130 — lógica idêntica já inline em useMultiChannelCall.ts:189-238 | **nenhum em produção** (só `__tests__/useMultiChannelCallConference.coverage.test.tsx`) | nenhuma | remover ou refatorar useMultiChannelCall para consumi-lo |
| useMultiDeviceRing — toque multi-dispositivo | ✅ | useMultiDeviceRing.ts:17,26,34,48,56,64 | src/pages/MultiDeviceRing.tsx | `agent_devices`, `agent_ring_settings` | — |
| useNetworkMonitor — saúde de rede | ✅ | useNetworkMonitor.ts:45-52,62-80 (ping real + Network Information API) | calls/NetworkStatusBadge.tsx, network/NetworkStatusIndicator.tsx, pages/NetworkDiagnostics.tsx | local (fetch/AbortController) | — |
| useNotifications — central de notificações | ⬛ | useNotifications.ts:51-52,177 | **nenhum em produção** (só coverage test); substituído por components/notification-center/useNotificationCenter.ts, que usa a mesma `notification_preferences` e é consumido por pages/NotificationCenter.tsx | `notifications`, `notification_preferences` | remover duplicata |
| useObjectionLibrary — biblioteca de objeções | ✅ | useObjectionLibrary.ts:33,43,58,78 | src/pages/AgentAssist.tsx | `objection_library` | — |
| useOptimisticLockConflicts — conflitos de lock | ✅ | useOptimisticLockConflicts.ts:41,72,77,82 | src/pages/ConcurrencyConflicts.tsx | `optimistic_lock_conflicts` | — |
| usePageTitle — título da aba | ✅ | usePageTitle.ts:9-15 | 95 arquivos de página | nenhuma | — |
| usePageVisibility — visibilidade da aba | ✅ | usePageVisibility.ts:18-28 | useBlfBoard.ts, useSecurityMonitoringData.ts, useExtensionsOverview.ts | nenhuma | sem teste |
| usePermissions — RBAC do usuário | ✅ | usePermissions.ts:27,44,55 | auth/PermissionGate.tsx | `user_roles`, `role_permissions` | — |
| usePersistedTagFilter — filtro de tags persistido | ✅ | usePersistedTagFilter.ts:76,107,150 | dialer/phone/PhoneQuickAccess.tsx | `user_profiles` + realtime | sem teste |
| usePredictiveDialer — discador preditivo | ✅ | usePredictiveDialer.ts:264 | dialer/PredictiveDialerPanel.tsx, DialerControlPanel.tsx, CreateCampaignDialog.tsx, AddContactsDialog.tsx | realtime `dialer-changes` (tabelas via serviços) | teste `.test.ts` é espelho |
| usePredictivePacing — cadência preditiva | ✅ | usePredictivePacing.ts:24,39 | src/pages/PredictiveDialer.tsx | RPC `calculate_predictive_pace`, edge `dialer-pacing-tick` | sem teste |
| useProfile — perfil do usuário | ✅ | useProfile.ts:24,40 | settings/ProfileSettings.tsx | `user_profiles` | — |
| useQualityAlerts — toast de MOS crítico | ✅ | useQualityAlerts.ts:6-22 | layout/GlobalServices.tsx | deriva de useQualityMetrics | — |
| useQualityMetrics — métricas de qualidade | ✅ | useQualityMetrics.ts:29,46 | executive/RealtimeQualityDashboard.tsx, hooks/useQualityAlerts.ts | `call_quality_metrics`, `voip_trunk_usage_metrics` | — |
| useQualityTrendAnalyzer — tendência de MOS | ✅ | useQualityTrendAnalyzer.ts:95-114 (persiste medição real) | hooks/useSipCall.ts | `voip_quality_alerts` | — |
| useQueueAudioPrompts — áudios de fila | ✅ | useQueueAudioPrompts.ts:39,70,85,111,123,140 | queues/QueueAudioLibrary.tsx, pages/CallQueues.tsx | `queue_audio_prompts` + Storage bucket | sem teste |
| useQueueMetrics — métricas de fila | ✅ | useQueueMetrics.ts:49,86-89,139,149 | pages/QueueMetricsDashboard.tsx, queue/QueueMetricsCards.tsx, QueueGoalsTab.tsx, QueueRealtimeCharts.tsx | `dashboard_goals`, `call_sessions`, `agents`, edge `check-goals` | — |
| useRateLimitData — painel de rate limit | ✅ | useRateLimitData.ts:50-52,71,91,100,111 | src/pages/RateLimitDashboard.tsx | `rate_limit_logs`, `rate_limit_alerts`, `rate_limit_settings` | — |
| useRealtimeHoldAlerts — alertas de espera | ✅ | useRealtimeHoldAlerts.ts:183,211,249 | notifications/NotificationBell.tsx, UnifiedNotificationDropdown.tsx | `call_alerts` + realtime | — |
| useReauth — reautenticação sensível | ✅ | useReauth.ts:22-48,50+ | auth/ReauthDialog.tsx, pages/SessionManagement.tsx | supabase.auth (senha) | janela de 5 min só em memória (:24-28) — reset no reload é conservador, não é falha |
| useRecordings — gravações e transcrição | ✅ | useRecordings.ts:53,61,100,102,115,140 | pages/Recordings.tsx, recordings/TranscriptionDialog.tsx | `call_recordings`, Storage `call-recordings`, edges `transcribe-recording`, `analyze-sentiment` | — |
| useRenewals — renovações | ✅ | useRenewals.ts:32,45,46 | src/pages/Renewals.tsx | `renewals` | — |
| useRingGroups — grupos de toque | ✅ | useRingGroups.ts:38,52,66,98,118,133,149,170,212,224 | pages/RingGroups.tsx, ringgroups/RingGroupCard.tsx | `ring_groups`, `ring_group_members`, `agents` | sem teste (253 linhas) |
| useRingtoneSettings — ringtone do usuário | ✅ | useRingtoneSettings.ts:72,122,183 | dialer/phone/RingtoneSettings.tsx | `user_profiles` + realtime | sem teste (283 linhas) |
| useRoutingRules — regras de roteamento | ✅ | useRoutingRules.ts:26,43,65 | src/pages/RoutingRules.tsx | `routing_rules` | — |
| useSLA — políticas de SLA | ✅ | useSLA.ts:27,45,75,99 | pages/SLAPolicies.tsx, executive/OmnichannelCard.tsx | `sla_policies`, `conversations`, edge `enforce-sla` | — |
| useScheduledCallbacks — callbacks agendados | ✅ | useScheduledCallbacks.ts:43,71,88,121,142,164,183,202 | callbacks/ScheduleCallbackDialog.tsx, ScheduledCallbacksList.tsx | `scheduled_callbacks` + realtime | — |
| useScorecards — scorecards de chamada | ⬛ | useScorecards.ts:54,55,62,67,78 | **nenhum em produção** (só coverage test); a mesma edge `score-call` é consumida por hooks/useCallScoring.ts | `scorecard_templates`, `scorecard_criteria`, `call_scorecards`, `scorecard_responses`, edge `score-call` | decidir entre useScorecards e useCallScoring; hoje 4 tabelas ficam sem leitor de produção |
| useSecurityAlertNotifications — alertas admin | ✅ | useSecurityAlertNotifications.ts:44,80,96,174,188,201 | src/pages/admin/SecurityAlerts.tsx | `notifications` + realtime | sem teste (225 linhas) |
| useSecurityDashboard — painel de segurança | ✅ | useSecurityDashboard.ts:51,54,61 | src/pages/SecurityDashboard.tsx | `user_ip_restrictions`, `security_alerts`, `blocked_access_logs` | — |
| useSecurityMonitoringData — auditoria ao vivo | ✅ | useSecurityMonitoringData.ts:51,66,79,86,100 | src/pages/SecurityMonitoring.tsx | `audit_logs`, `security_alerts` + realtime | — |
| useSecurityNotifications — push de segurança | ✅ | useSecurityNotifications.ts:80,95,108 | security/NotificationPermissionBanner.tsx | realtime em `security_alerts`, `blocked_access_logs`, rate limit | — |
| useSessionManager — sessões ativas | ✅ | useSessionManager.ts:74,104,134,145,168 | pages/SessionManagement.tsx, hooks/useSecurityDashboard.ts | `active_sessions` | — |
| useShiftSwapSuggestions — troca de turno | ✅ | useShiftSwapSuggestions.ts:26,41,58 | src/pages/ShiftSwapSuggestions.tsx (rota protegida, protectedRoutes.tsx:195) | `shift_swap_suggestions`, edge `suggest-shift-swaps` | sem teste |
| useShifts — escalas | ✅ | useShifts.ts:37,52,60,73,86 | src/pages/Scheduling.tsx | `agent_shifts`, `shift_templates` | — |
| useSipCall — softphone SIP (JsSIP) | ✅ | useSipCall.ts:132 + imports `jssip`, `jssip/lib/UA`, `jssip/lib/RTCSession` | pages/PhoneDialer.tsx, pages/Calls.tsx, calls/UnifiedSoftphone.tsx, calls/SipConnectionStatus.tsx, dialer/DialerControlPanel.tsx | edge `sip-config` | — |
| useSkills — skills de agente | ✅ | useSkills.ts:28,37,45,56 | src/pages/Skills.tsx | `skills`, `agent_skills` | — |
| useSuccessPlans — planos de sucesso | ✅ | useSuccessPlans.ts:42,51,71,84 | src/pages/SuccessPlans.tsx | `success_plans`, `success_plan_milestones` | — |
| useSupervisorPanel — painel do supervisor | ✅ | useSupervisorPanel.ts:110,117,118,133,138,144,155,167,178,188 | supervisor/SupervisorPanel.tsx, supervisor/panel/QueueMetricsGrid.tsx | `call_sessions`, `barge_in_sessions`, `whisper_messages` + realtime | — |
| useSurveys — pesquisas de satisfação | ⬛ | useSurveys.ts:28,45 | **nenhum** — nem página, nem componente; único arquivo que cita `survey_responses`/`send-survey` além dele é o coverage test | `survey_responses`, edge `send-survey` | falta UI; feature nunca ligada ao app |
| useSyncHistory — histórico de sincronização | ✅ | useSyncHistory.ts:18-47 | dialer/phone/SyncHistoryPanel.tsx + 5 hooks (useDialerFavorites, useVoicePreferences, useDeviceLabel, useRingtoneSettings, usePersistedTagFilter) | localStorage via lib/sync-history | sem teste |
| useTalkRatio — proporção de fala | ✅ | useTalkRatio.ts:34 | conversation-intelligence/TalkRatioChart.tsx, CallDetailDialog.tsx | edge `analyze-talk-ratio` | — |
| useTestWebhook — teste de webhook | ✅ | useTestWebhook.ts:33,42-45 | src/pages/admin/SecurityAlerts.tsx | lib/security-alerts-webhook (HTTP externo) | sem teste |
| useTimeOff — folgas/férias | ✅ | useTimeOff.ts:26,36,47 | src/pages/Scheduling.tsx | `time_off_requests` | — |
| useTrackers — trackers de conversa | ✅ | useTrackers.ts:34,43,51,63 | src/pages/Trackers.tsx | `trackers`, `tracker_matches` | — |
| useTrunkFailoverMonitor — failover de tronco | ✅ | useTrunkFailoverMonitor.ts:12 | layout/GlobalServices.tsx | realtime `voip-failover-events` | — |
| useTrunkHealth — healthcheck de tronco | ✅ | useTrunkHealth.ts:22,39 | pages/admin/VoipTrunksAdmin.tsx, admin/voip/TrunkHealthHistoryDrawer.tsx | `voip_trunk_health_checks`, edge `voip-trunks-healthcheck` | — |
| useTrunkMetrics — métricas de tronco | ✅ | useTrunkMetrics.ts:39,42,70,91 | admin/voip/TrunkMetricsTab.tsx | `voip_trunk_usage_metrics`, `voip_trunks` | — |
| useTrunkRealtimeMetrics — ocupação em tempo real | 🟨 | useTrunkRealtimeMetrics.ts:40-41,56-57 — ocupação **derivada por divisão uniforme** das chamadas ativas entre troncos, com comentário "Simulação" no código | pages/admin/VoipTrunksAdmin.tsx | `call_sessions`, `voip_trunks` + realtime | `call_sessions` não tem `trunk_id`; a ocupação exibida não reflete o tronco real |
| useTrunkUsageReporter — reporta uso do tronco | ✅ | useTrunkUsageReporter.ts:42 | hooks/useSipCall.ts | RPC `record_trunk_usage` | — |
| useUnreadConflicts — badge de conflitos | ✅ | useUnreadConflicts.ts:23 | layout/AppSidebar.tsx | `optimistic_lock_conflicts` | — |
| useVirtualFaxOcr — OCR de fax | ✅ | useVirtualFaxOcr.ts:9 | src/pages/VirtualFax.tsx (rota `/virtual-fax`) | edge `ocr-virtual-fax` | sem teste |
| useVoiceBiometrics — biometria de voz | ✅ | useVoiceBiometrics.ts:40,59,91,110,149,166 | src/pages/VoiceSecurity.tsx | `voice_prints`, `fraud_signals`, edges `enroll-voice`, `verify-voice`, `redact-sensitive-audio` | — |
| useVoiceCommand — comando de voz | ✅ | useVoiceCommand.ts:30,35 | voice/VoiceAssistantDialog.tsx, softphone/ActiveCallDisplay.tsx | edges `voice-transcribe`, `voice-command` | — |
| useVoicePreferences — preferências de voz | ✅ | useVoicePreferences.ts:95,119 | voice/VoiceAssistantDialog.tsx, dialer/phone/VoicePreferencesPanel.tsx | `user_profiles` | sem teste (198 linhas) |
| useVoipAnomalies — detecção de anomalia | ✅ | useVoipAnomalies.ts:31-47,55 (classificação determinística sobre z-score do backend) | network/AnomalyDetectionCard.tsx, hooks/useAnomalyRemediation.ts | edge `voip-anomaly-detector` | — |
| useVoipAutoRemediation — remediação sugerida | ✅ | useVoipAutoRemediation.ts:18-54 (só sugere via toast; nunca age sozinho — documentado :16) | hooks/useSipCall.ts | nenhuma | nome sugere automação que, por design, não existe |
| useVoipCapacityRecommendations — capacidade | ✅ | useVoipCapacityRecommendations.ts:30-37 (fetch direto autenticado) | network/QualityForecastCard.tsx | edge `voip-capacity-recommendations` | — |
| useVoipDiagnosticVoiceQA — QA por voz | ✅ | useVoipDiagnosticVoiceQA.ts:33 | network/VoipVoiceQAPanel.tsx | edge `voip-diagnostic-voice-qa` | — |
| useVoipExecutiveNarrative — narrativa executiva | ✅ | useVoipExecutiveNarrative.ts:35 | network/ExecutiveSummaryDialog.tsx | edge `voip-executive-narrative` | — |
| useVoipExecutiveSummary — resumo executivo | ✅ | useVoipExecutiveSummary.ts:46 | network/ExecutiveReportExport.tsx, network/VoipHealthScoreCard.tsx | edge `voip-executive-summary` | — |
| useVoipMonitoringSettings — config monitoramento | ✅ | useVoipMonitoringSettings.ts:19,34,43 | admin/voip/VoipMonitoringSettingsDialog.tsx, pages/admin/VoipTrunksAdmin.tsx | `voip_monitoring_settings` | — |
| useVoipQualityForecast — previsão de qualidade | ✅ | useVoipQualityForecast.ts:38 | network/QualityForecastCard.tsx, hooks/useVoipCapacityRecommendations.ts | edge `voip-quality-forecast` | — |
| useVoipQualityMonitor — MOS/jitter via WebRTC | ✅ | useVoipQualityMonitor.ts:150-179 (agrega `getStats()` real e persiste) | 6 componentes de chamada + hooks/useSipCall.ts | `call_quality_metrics` | — |
| useVoipRecommendationHistory | ✅ | useVoipRecommendationHistory.ts:48 | network/RecommendationHistoryDrawer.tsx | edge `voip-recommendation-history` | — |
| useVoipRecommendationInsights | ✅ | useVoipRecommendationInsights.ts:28 | network/RecommendationInsightsCard.tsx | edge `voip-recommendation-insights` | — |
| useVoipRecommendationSimulate — what-if | ✅ | useVoipRecommendationSimulate.ts:37-50 | network/WhatIfSimulatorDialog.tsx | edge `voip-recommendation-simulate` | — |
| useVoipRecommendations | ✅ | useVoipRecommendations.ts:49 | pages/NetworkDiagnostics.tsx, network/VoipRecommendationsPanel.tsx, WhatIfSimulatorDialog.tsx | edge `voip-recommendations` | — |
| useVoipTrunks — CRUD de troncos | ✅ | useVoipTrunks.ts:42 | pages/admin/VoipTrunksAdmin.tsx, admin/voip/TrunkAssignmentsTab.tsx, VoipTrunkFormDrawer.tsx, executive/VoipInfrastructureTab.tsx | edge `voip-trunks-manage` | — |
| useWavoipCall — chamada WhatsApp | 🟨 | useWavoipCall.ts:51,101,165 (edge real) **mas** :125-135 força `calling→active` por `setTimeout(2000)` com comentário "Simulate connection" | calls/UnifiedSoftphone.tsx | edge `wavoip-call` | estado de conexão não é event-driven: UI mostra "ativa" mesmo se o destino não atendeu |
| useWebAuthn — passkeys | ✅ | useWebAuthn.ts:49,90,116,170,186,193,210,221,230,240,270,289 | auth/PasskeyLogin.tsx, auth/PasskeyManager.tsx | `user_passkeys`, `webauthn_challenges`, `user_profiles`, edge `webauthn-authenticate` | — |
| useWebVitals — Core Web Vitals | ✅ | useWebVitals.ts:4-19 | src/pages/ObservabilityDashboard.tsx | lib/web-vitals | — |
| useWebhookConfig — config do webhook | ✅ | useWebhookConfig.ts:33-96 (draft/committed + validação) | src/pages/admin/SecurityAlerts.tsx | localStorage via lib/security-alerts-webhook | sem teste |
| useWebhookHealthData — saúde do webhook | ✅ | useWebhookHealthData.ts:23 | src/pages/admin/WebhookHealth.tsx | `webhook_flush_metrics` | sem teste |
| useWebhookHistory — histórico de envios | ✅ | useWebhookHistory.ts:16-52 | src/pages/admin/SecurityAlerts.tsx | localStorage via lib/security-alerts-webhook-history | sem teste |
| useWebhookQueue — fila de reenvio | ✅ | useWebhookQueue.ts:16-76 | pages/admin/SecurityAlerts.tsx, hooks/useWebhookHistory.ts | localStorage via lib/security-alerts-webhook-queue | sem teste |
| useWhatsappRewrite — reescrita por IA | ✅ | useWhatsappRewrite.ts:26,38-41 | whatsapp/WhatsappComposer.tsx | edge `whatsapp-rewrite` | sem teste |

**Totais:** ✅ 87 · 🟨 2 · 🟦 0 · ⬛ 4.

## Achados graves

1. **`useMFA.test.ts` valida um algoritmo que não é o do código — e o algoritmo testado é inseguro.**
   O teste reimplementa a geração de backup codes com `Math.random().toString(36)` (useMFA.test.ts:5-8) e afirma "codes are 6 characters / alphanumeric / unique". O hook real usa `crypto.getRandomValues` sobre um alfabeto sem caracteres ambíguos e garante unicidade por `Set` (useMFA.ts:161-170). O arquivo de teste não importa `useMFA` em nenhuma linha. Resultado: a suíte fica verde exercitando um PRNG não-criptográfico que **não existe em produção**, e o código real de credencial de recuperação de 2FA fica sem cobertura de comportamento. É o achado mais sério do lote — dá falsa confiança sobre um controle de segurança.

2. **Ocupação de tronco exibida ao admin é derivada, não medida.**
   `useTrunkRealtimeMetrics.ts:56-57` distribui as chamadas ativas igualmente entre todos os troncos (`Math.ceil(activeCalls.length / trunks.length)`) porque, como o próprio comentário admite em :40-41, `call_sessions` não possui `trunk_id`. O número renderizado em `pages/admin/VoipTrunksAdmin.tsx` como "ocupação" e "chamadas ativas por tronco" é um rateio arbitrário. Não há qualquer aviso na UI. Nada é gravado em tabela (a leitura é read-only), então não contamina o banco — mas embasa decisão operacional de capacidade sobre número fabricado.

3. **`useWavoipCall` declara chamada "ativa" por temporizador, não por evento.**
   Após a edge `wavoip-call` retornar `callId`, o hook agenda `setTimeout(..., 2000)` que muda o status para `active` e **inicia o cronômetro de duração** (useWavoipCall.ts:125-135), com comentário "in production this would be event-driven". Ou seja: 2 s depois de discar, a UI mostra chamada atendida e conta duração mesmo que ninguém tenha atendido. Consumido em produção por `calls/UnifiedSoftphone.tsx`.

4. **Quatro hooks são código morto, três deles duplicando features vivas.**
   - `useMultiChannelCallConference.ts` (134 L): a mesma lógica de conferência está copiada inline em `useMultiChannelCall.ts:189-238`, que é a versão realmente usada por `UnifiedSoftphone.tsx:38`. Duas cópias divergirão.
   - `useNotifications.ts` (219 L): concorre com `components/notification-center/useNotificationCenter.ts` sobre a mesma tabela `notification_preferences`; só o segundo é consumido (`pages/NotificationCenter.tsx`).
   - `useScorecards.ts` (88 L): invoca a edge `score-call`, que já é chamada por `useCallScoring.ts`. Sem consumidor de produção, as tabelas `scorecard_templates`, `scorecard_criteria`, `call_scorecards`, `scorecard_responses` ficam **sem leitor algum na aplicação**.
   - `useSurveys.ts` (66 L): sem consumidor e sem UI. `survey_responses` e a edge `send-survey` existem no backend mas são inalcançáveis pelo front — feature entregue pela metade.

5. **`useIPWhitelist` grava autoria literal `'admin'`.**
   `useIPWhitelist.ts:80` insere `created_by: 'admin'` fixo em `ip_whitelist`, em vez do usuário autenticado. É constante hardcoded escrita em tabela real de controle de acesso — a trilha de auditoria de quem liberou um IP fica inutilizável.

6. **Hooks grandes de escrita em produção sem nenhum teste.** `useRingGroups` (253 L, 10 operações de escrita em `ring_groups`/`ring_group_members`), `useRingtoneSettings` (283 L), `useSecurityAlertNotifications` (225 L, marca notificações de segurança como lidas), `useVoicePreferences` (198 L) e `useQueueAudioPrompts` (158 L, upload + delete em Storage) não possuem arquivo de teste algum.

## Qualidade dos testes deste lote

- **76 dos 93 hooks têm arquivo de teste** em `src/hooks/__tests__/`. **17 não têm nenhum:** usePageVisibility, usePersistedTagFilter, usePredictivePacing, useQueueAudioPrompts, useRingGroups, useRingtoneSettings, useSecurityAlertNotifications, useShiftSwapSuggestions, useSyncHistory, useTestWebhook, useVirtualFaxOcr, useVoicePreferences, useWebhookConfig, useWebhookHealthData, useWebhookHistory, useWebhookQueue, useWhatsappRewrite.
- **Todos os 76 arquivos `*.coverage.test.tsx` importam de fato o hook alvo** (`from '@/hooks/<nome>'`) — não são espelhos. Essa é a camada boa da suíte.
- **Cinco arquivos legados `*.test.ts` NÃO importam o alvo** e reimplementam a lógica dentro do próprio teste (espelhos): `useHoldReminder.test.ts` (263 L), `useMFA.test.ts` (172 L), `useMultiChannelCall.test.ts` (207 L), `usePredictiveDialer.test.ts` (202 L) — todos com `import { describe, it, expect } from 'vitest'` como única importação — e `useLoginLockout.test.ts` (135 L), que importa apenas `@/integrations/supabase/client`, nunca o hook. São **979 linhas de teste que não exercitam uma linha do código auditado**, e inflam artificialmente a percepção de cobertura. O caso do `useMFA.test.ts` é o mais grave (item 1 dos Achados).
- **Zero `.skip` / `xit(` / `xdescribe(`** em todo o lote — nenhum teste desativado escondido.
- Padrão de tamanho: os coverage tests variam de 26 L (usePageTitle) a 468 L (usePredictiveDialer); os maiores hooks de escrita em banco (useWebAuthn 309 L de teste, useSupervisorPanel 254 L, useWavoipCall 240 L) estão razoavelmente cobertos.
- Três hooks (`useMeetingSummary`, `useShifts`, `useSkills`) têm dois arquivos de teste e **ambos** importam o alvo — duplicação benigna, não espelho.

## Integrações de terceiros observadas

Levantadas por varredura de imports não-relativos nos 93 arquivos:

| Pacote | Ocorrências | Onde / para quê |
|---|---|---|
| `react` | 63 | base |
| `sonner` | 52 | toasts de feedback em praticamente todo hook com efeito colateral |
| `@tanstack/react-query` | 37 | cache/mutations — padrão dominante nos hooks de dados |
| `date-fns` + `date-fns/locale` | 5 | formatação pt-BR (escalas, callbacks, métricas) |
| `jssip` (`jssip`, `jssip/lib/UA`, `jssip/lib/RTCSession`) | 3 | **useSipCall.ts** — única integração de telefonia real do lote (SIP over WebSocket) |
| `lucide-react` | 1 | ícone em hook que devolve elemento |

Integrações via backend (não são libs, mas dependências externas efetivas alcançadas por estes hooks):

- **Supabase** — cliente único `@/integrations/supabase/client`: Postgres (≈70 tabelas distintas), Realtime (18 canais), Storage (buckets `call-recordings` e o de prompts de fila), Auth (MFA/TOTP, sessões, `getUser`), RPC (`match_kb_articles`, `check_login_lockout`, `record_failed_login`, `record_successful_login`, `calculate_predictive_pace`, `record_trunk_usage`) e 32 Edge Functions — **todas as 32 existem em `supabase/functions/`**, nenhuma invocação órfã.
- **WebAuthn / Passkeys** — API nativa do navegador em `useWebAuthn.ts`, com desafios persistidos em `webauthn_challenges`.
- **Wavoip (WhatsApp voice)** — via edge `wavoip-call` em `useWavoipCall.ts`.
- **WebRTC `getStats()`** — `useVoipQualityMonitor.ts`, fonte real de MOS/jitter/RTT.
- **Notification API / Page Visibility API / Network Information API** — `useHoldReminder`, `usePageVisibility`, `useNetworkMonitor`.
- **Webhook HTTP externo com HMAC** — `useTestWebhook` / `useWebhookConfig` / `useWebhookQueue`, através de `lib/security-alerts-webhook*` (destino configurável pelo admin, persistido em localStorage).

<!-- Gerado por scripts/inventario/gerar-hooks-dormentes.mjs (etapa 159). Nao editar a mao. -->

# Hooks dormentes — inventário conferido por leitura de código

> **Procedência:** `src/hooks/**` cruzado com os importadores em `src/**` e `supabase/functions/**`
> (alias `@/`, caminho relativo, `import()` dinâmico e `export ... from`), com o alcance real a partir de
> `src/routes/*.tsx`, `src/App.tsx` e `src/main.tsx` (fechamento de imports, inclusive por `src/components/`),
> e com `inventario/estado/banco.json` (linhas por tabela, medido em 2026-11-20T18:21:37Z).
> **Regenerar:** `node scripts/inventario/gerar-hooks-dormentes.mjs` (aceita `--listar`).
> **Limitação:** a contagem de linhas é a foto do banco na data acima; "alcance" é estático — não prova
> que a tela monta o componente em runtime (só que o import existe a partir de uma rota ou do shell).

**Resumo:** 172 hooks de produção — **2 efetivamente dormentes** (0 sem nenhum consumidor + 2 que só existem dentro de componente órfão), 0 sem rota, 10 alcançados só pelo shell do app e 160 em uso por rota.

## 1. Sem nenhum consumidor de produção

| Hook | Arquivo | Importadores (producao) | Teste | Alcance | Tabelas (linhas) | RPC | Edge | O que o produto ganha |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — |

## 2. Só existem dentro de componente órfão (componente que nada importa)

| Hook | Arquivo | Importadores (producao) | Teste | Alcance | Tabelas (linhas) | RPC | Edge | O que o produto ganha |
|---|---|---|---|---|---|---|---|---|
| `useAudioOutputDevices` | `src/hooks/useAudioOutputDevices.ts` | `src/components/calls/WebRTCCall.tsx` | 1 | — | — | — | — | Escolher a saída de áudio (alto-falante/fone) durante a chamada — hoje só o componente `WebRTCCall.tsx`, que nenhuma tela monta. |
| `useContactAlerts` | `src/hooks/useContactAlerts.ts` | `src/components/contacts/ContactAlertsDropdown.tsx` | 1 | — | contact_alerts (0) | — | check-contact-alerts | Avisar o agente sobre alerta de relacionamento do contato — hoje só o dropdown `ContactAlertsDropdown.tsx`, que nenhuma tela monta. |

## 3. Têm consumidor vivo, mas nenhuma rota nem o shell alcança

| Hook | Arquivo | Importadores (producao) | Teste | Alcance | Tabelas (linhas) | RPC | Edge | O que o produto ganha |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — |

## 4. Alcançados apenas pelo shell do app (layout, providers, serviços globais)

| Hook | Arquivo | Importadores (producao) | Teste | Alcance | Tabelas (linhas) | RPC | Edge | O que o produto ganha |
|---|---|---|---|---|---|---|---|---|
| `use-mobile` | `src/hooks/use-mobile.tsx` | `src/components/ui/sidebar.tsx` | 1 | src/App.tsx, src/main.tsx | — | — | — | Decide se o layout usa a versão de celular. |
| `useAchievementNotifications` | `src/hooks/useAchievementNotifications.ts` | `src/components/gamification/AchievementNotificationProvider.tsx` | 1 | src/App.tsx, src/main.tsx | agent_badges (0), agent_weekly_stats (0), agents (1), badges (0) | — | — | Notifica o agente quando ele ganha uma conquista. |
| `useBattleCardDetection` | `src/hooks/useBattleCardDetection.ts` | `src/components/calls/LiveTranscription.tsx` | 1 | src/App.tsx, src/main.tsx | battle_card_triggers (0), battle_cards (0) | — | — | Detecta na transcrição ao vivo o momento de mostrar o battle card. |
| `useCrmFieldSuggestions` | `src/hooks/useCrmFieldSuggestions.ts` | `src/components/calls/CrmSuggestionsCard.tsx` | 1 | src/App.tsx, src/main.tsx | contacts (51), crm_field_suggestions (0) | — | extract-crm-fields | Sugere campos de CRM na tela da chamada a partir do que já foi preenchido. |
| `useNotifications` | `src/hooks/useNotifications.ts` | `src/components/notifications/UnifiedNotificationDropdown.tsx` | 1 | src/App.tsx, src/main.tsx | notification_preferences (0), notifications (1), user_profiles (3), user_roles (2) | — | — | Sino de notificações do topo (lido/não lido) para o agente logado. |
| `useQualityAlerts` | `src/hooks/useQualityAlerts.ts` | `src/components/layout/GlobalServices.tsx` | 1 | src/App.tsx, src/main.tsx | call_quality_metrics (4), voip_trunk_usage_metrics (3) | — | — | Alertas de qualidade da chamada (métricas de tronco e de áudio) para o supervisor. |
| `useRealtimeHoldAlerts` | `src/hooks/useRealtimeHoldAlerts.ts` | `src/components/notifications/NotificationBell.tsx`<br>`src/components/notifications/UnifiedNotificationDropdown.tsx` | 2 | src/App.tsx, src/main.tsx | call_alerts (0) | — | — | Badge em tempo real quando outra sessão deixa um cliente em espera. |
| `useTelemetry` | `src/hooks/telemetry/useTelemetry.ts` | `src/components/layout/AppLayout.tsx` | 1 | src/App.tsx, src/main.tsx | performance_metrics (2021), user_profiles (3), user_roles (2) | — | — | Mede desempenho do app por rota para achar tela lenta. |
| `useTrunkFailoverMonitor` | `src/hooks/useTrunkFailoverMonitor.ts` | `src/components/layout/GlobalServices.tsx` | 1 | src/App.tsx, src/main.tsx | — | — | — | Avisa quando um tronco VoIP cai e o tráfego muda de rota. |
| `useUnreadConflicts` | `src/hooks/useUnreadConflicts.ts` | `src/components/layout/AppSidebar.tsx` | 1 | src/App.tsx, src/main.tsx | optimistic_lock_conflicts (0), user_profiles (3), user_roles (2) | — | — | Avisa quando dois agentes editaram o mesmo registro (conflito de edição). |

## 5. Em uso por rota

160 hooks são alcançados por pelo menos uma rota. Lista (hook → tabelas):

- `useAccounts` - `useActiveCallsRealtime` - `useAdherence` - `useAgentFinancialLeaderboard` - `useAgentRanking` - `useAgentStatus` - `useAlertHistory` - `useAlertPresets` - `useAlerts` - `useAlertsExport` - `useAnimatedCounter` - `useAnomalyRemediation` - `useAuditLog` - `useAuth` - `useAuthActions` - `useAuthProfile` - `useAuthSession` - `useAuthState` - `useAvatar` - `useBestTimeToContact` - `useBitrix` - `useBlfBoard` - `useBlockedAccessLogs` - `useCadences` - `useCallAnalytics` - `useCallHistory` - `useCallPark` - `useCallPlaylists` - `useCallQueues` - `useCallRecording` - `useCallScoring` - `useCallSearch` - `useCallSession` - `useCallTimers` - `useCallTransfer` - `useChatbot` - `useChurnRisk` - `useCoaching` - `useCoachingAssignments` - `useCoachingTrack` - `useComplianceRules` - `useConferenceRecording` - `useConsent` - `useContactInsights` - `useContacts` - `useConversations` - `useCriticalAlertNotifications` - `useCulturalHints` - `useDashboardData` - `useDashboardGoals` - `useDashboardLayout` - `useDataLakeExports` - `useDealForecast` - `useDeals` - `useDebouncedSearchParam` - `useDeviceDetection` - `useDeviceLabel` - `useDialerFavorites` - `useDNCCompliance` - `useExecutiveDashboard` - `useExtensionAudit` - `useExtensionAuditHistory` - `useExtensionsAdmin` - `useExtensionsOverview` - `useFinancialImpact` - `useForecastVolume` - `useGamification` - `useGeoBlocking` - `useGoalViolations` - `useHealthCheck` - `useHoldMetrics` - `useHoldReminder` - `useHoldSoundAlert` - `useIPValidation` - `useIPWhitelist` - `useKeyMoments` - `useKnowledgeBase` - `useLDAPSync` - `useLearning` - `useLiveAssist` - `useLiveSentiment` - `useLiveTranslation` - `useLoginLockout` - `useMeetingSummary` - `useMFA` - `useMultiChannelCall` - `useMultiDeviceRing` - `useNetworkMonitor` - `useObjectionLibrary` - `useOptimisticLockConflicts` - `usePageTitle` - `usePageVisibility` - `usePermissions` - `usePersistedTagFilter` - `usePredictiveDialer` - `usePredictivePacing` - `useProfile` - `useQualityMetrics` - `useQualityTrendAnalyzer` - `useQueueAudioPrompts` - `useQueueMetrics` - `useRateLimitData` - `useReauth` - `useRecordings` - `useRenewals` - `useRingGroups` - `useRingtoneSettings` - `useRoutingRules` - `useScheduledCallbacks` - `useScorecards` - `useSecurityAlertNotifications` - `useSecurityDashboard` - `useSecurityMonitoringData` - `useSecurityNotifications` - `useSessionManager` - `useShifts` - `useShiftSwapSuggestions` - `useSipCall` - `useSkills` - `useSLA` - `useSuccessPlans` - `useSupervisorPanel` - `useSurveys` - `useSyncHistory` - `useTalkRatio` - `useTestWebhook` - `useTimeOff` - `useTrackers` - `useTrunkHealth` - `useTrunkMetrics` - `useTrunkRealtimeMetrics` - `useTrunkUsageReporter` - `useVirtualFaxOcr` - `useVoiceBiometrics` - `useVoiceCommand` - `useVoicePreferences` - `useVoipAnomalies` - `useVoipAutoRemediation` - `useVoipCapacityRecommendations` - `useVoipDiagnosticVoiceQA` - `useVoipExecutiveNarrative` - `useVoipExecutiveSummary` - `useVoipMonitoringSettings` - `useVoipQualityAlertsSummary` - `useVoipQualityForecast` - `useVoipQualityMonitor` - `useVoipRecommendationActions` - `useVoipRecommendationHistory` - `useVoipRecommendationInsights` - `useVoipRecommendations` - `useVoipRecommendationSimulate` - `useVoipTrunks` - `useWavoipCall` - `useWebAuthn` - `useWebhookConfig` - `useWebhookHealthData` - `useWebhookHistory` - `useWebhookQueue` - `useWebVitals` - `useWhatsappRewrite`

## Como foi verificado

```bash
# regenerar este arquivo (varredura completa)
node scripts/inventario/gerar-hooks-dormentes.mjs --listar
# conferir um hook na mão: nenhuma linha = sem consumidor de produção
grep -rn "from '@/hooks/<hook>'" src supabase/functions --include='*.ts' --include='*.tsx' | grep -v __tests__
# conferir um componente órfão
grep -rn "from '@/components/<pasta>/<Componente>'" src --include='*.tsx' | grep -v __tests__
```

O `inventario/estado/rotas.json` é entrada deste script; se ele estiver defasado, rode antes
`node scripts/inventario/gerar-rotas.mjs`.

<!-- Gerado pela auditoria de estado. Fonte: lote C2. -->

> **Procedência:** lote `C2` da auditoria de estado.
> **Recontagem de cobertura (Fase D):** 96/96 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime — nada nesta página é verificado contra produção.

# Lote C2 — src/components (parte 2)

## Cobertura

96 arquivos do manifesto `C2.txt`, 11.060 linhas verificadas (`wc -l` bate exatamente com o alvo declarado). Nenhum arquivo de `src/components/ui/*` (shadcn) neste lote — a regra de tratamento em bloco não se aplica.

**Método de detecção de consumidores.** Para cada arquivo rodei grep em `src/` com os padrões, declarados:
1. `(from|import\(|require\()...['"].../<stem>['"]` — cobre import estático, `import()` dinâmico e `require`, incluindo imports **multilinha** (o grep casa a linha do path, que em import multilinha é a última linha `} from '...'`).
2. Path relativo completo (`./calling-hours/types`, `./constants`) para desambiguar stems genéricos.
3. Busca pelo **nome do símbolo** em todo `src/` (`grep -rn "<Nome>"`), usada como rede de segurança para confirmar órfãos — é o padrão que pegaria `lazy(() => import(...))` com string quebrada ou re-export via barrel.

Os stems genéricos `constants.ts`, `constants.tsx` e `types.ts` produziram falso-positivo em massa (58 e 17 "consumidores") no padrão 1 por casarem qualquer `/constants` e `/types` do projeto; foram reclassificados pelo padrão 2. Não há barrels `index.ts` nessas pastas.

**Varreduras transversais executadas** (resultado no corpo do relatório): `Math.random`, `mock|fake|dummy|stub|hardcod`, `TODO|FIXME|em breve|coming soon|not implemented|WIP`, `console.log`, `onClick={() => {}}`, literais numéricos com `%`/`ms` em JSX, arrays literais de dados de negócio, handlers só-toast, `functions.invoke`, `.channel(` e libs de terceiros.

Não executei testes e não afirmo nada sobre sua aprovação.

## Tabela de funcionalidades

| Componente/Funcionalidade | Classificação | Evidência | Consumidor | Fonte de dados | O que falta |
|---|---|---|---|---|---|
| **calls/softphone/HeaderDropdowns.tsx** — dropdowns de canal/status do softphone | ✅ | `HeaderDropdowns.tsx:12` importa `./constants` | `calls/UnifiedSoftphone.tsx` | `@/hooks/useMultiChannelCall` | — |
| **calls/softphone/TabContents.tsx** — abas de canais/contatos | ✅ | `TabContents.tsx:6` | `calls/UnifiedSoftphone.tsx` | `@/hooks/useMultiChannelCall` | — |
| **calls/softphone/constants.tsx** — ícones/cores de canal, `formatCallDuration`, `dialPadButtons` | ✅ | consumido em `UnifiedSoftphone.tsx:21`, `ActiveCallDisplay.tsx:15`, `DialpadTab.tsx:9`, `HeaderDropdowns.tsx:12`, `TabContents.tsx:6`, `lib/__tests__/softphone-utils.test.ts:2` | 6 arquivos | constantes de UI (legítimo) | — |
| **coaching/CoachingCopilotCard.tsx** — gera plano de coaching por IA | ✅ | `CoachingCopilotCard.tsx:25` `supabase.functions.invoke('generate-coaching-plan')` | `pages/Coaching.tsx` | Edge Function `generate-coaching-plan` | — |
| **coaching/CoachingPanel.tsx** — painel de coaching (375 linhas) | ✅ | imports de `useCoaching`, `useAgentStatus`, `useAuditLog` | `pages/Coaching.tsx` | `useCoaching` + auditoria | — |
| **compliance/CallingHoursConfig.tsx** — orquestra config de horários | ✅ | `CallingHoursConfig.tsx:14` importa `./calling-hours/types` | `pages/Compliance.tsx` | via `useCallingHoursManager` | — |
| **compliance/ComplianceSettings.tsx** — ajustes de compliance | ✅ | importa `useDNCCompliance`, `lib/safe-number` | `pages/Compliance.tsx` | `useDNCCompliance` | — |
| **compliance/ConsentHistoryViewer.tsx** — histórico de consentimento | ✅ | `.from('consent_history')` | `pages/Compliance.tsx` | tabela `consent_history` | — |
| **compliance/DNCImportLogs.tsx** — logs de importação DNC | ✅ | `.from('dnc_import_logs')` | `pages/Compliance.tsx` | tabela `dnc_import_logs` | — |
| **compliance/DNCListManager.tsx** — gestão lista DNC + export CSV | ✅ | `DNCListManager.tsx:28` monta CSV real | `pages/Compliance.tsx` | `useDNCCompliance` | — |
| **compliance/HolidaysManager.tsx** — feriados, recorrência | ✅ | `.from('holidays')`; `HolidaysManager.tsx:112` flag recorrente | `pages/Compliance.tsx` | tabela `holidays` | — |
| **compliance/calling-hours/RegionFormDialog.tsx** — form de região (277 linhas) | ✅ | `RegionFormDialog.tsx:27` importa `./types` | `CallingHoursConfig.tsx` | props + `useCallingHoursManager` | — |
| **compliance/calling-hours/RegionsTable.tsx** — tabela de regiões | ✅ | `RegionsTable.tsx:13-14` | `CallingHoursConfig.tsx` | props | — |
| **compliance/calling-hours/StatusCheckCard.tsx** — status de janela de discagem | ✅ | `StatusCheckCard.tsx:12` | `CallingHoursConfig.tsx` | props | — |
| **compliance/calling-hours/types.ts** — tipos + `normalizeTime` | ✅ | consumido em `useCallingHoursManager.ts:6-7`, `StatusCheckCard.tsx:12`, `RegionsTable.tsx:13`, `RegionFormDialog.tsx:27` | 4 arquivos | — | — |
| **compliance/calling-hours/useCallingHoursManager.ts** — CRUD de horários | ✅ | `.from('calling_hours_config')` + `lib/logger` | `CallingHoursConfig.tsx` | tabela `calling_hours_config` | — |
| **compliance/dnc/AddDNCDialog.tsx** — adicionar número à DNC | ✅ | `AddDNCDialog.tsx:9` importa `DNC_REASONS` | `DNCListManager.tsx` | props/`useDNCCompliance` | — |
| **compliance/dnc/DNCStats.tsx** — cards de estatística DNC | ✅ | props vindas de `DNCListManager` | `DNCListManager.tsx` | props (`useDNCCompliance`) | — |
| **compliance/dnc/DNCTable.tsx** — tabela DNC | ✅ | `DNCTable.tsx:8` `getReasonLabel/Variant` | `DNCListManager.tsx` | props | — |
| **compliance/dnc/ImportDNCDialog.tsx** — importação em lote | ✅ | `ImportDNCDialog.tsx:8` | `DNCListManager.tsx` | props | — |
| **compliance/dnc/constants.ts** — `DNC_REASONS`, `getReasonLabel`, `getReasonVariant` | ✅ | `constants.ts:1,11,15`; consumido em `AddDNCDialog.tsx:9`, `ImportDNCDialog.tsx:8`, `DNCTable.tsx:8` | 3 arquivos | — | — |
| **contacts/ContactAlertsDropdown.tsx** — dropdown de alertas de contato (246 linhas, marcar lido, deletar, re-checar) | ⬛ | `grep -rn "ContactAlertsDropdown" src/` → **zero ocorrências** fora do próprio arquivo | **NENHUM — órfão** | `@/hooks/useContactAlerts` (real) | Montagem em alguma página/header; código funcional mas inalcançável |
| **contacts/ContactCard.tsx** — card de contato | ✅ | importa `useContacts` | `contacts/ContactGrid.tsx` | `useContacts` | — |
| **contacts/ContactDetailSheet.tsx** — ficha do contato + análise IA | ✅ | `ContactDetailSheet.tsx:55` `functions.invoke('analyze-contact-profile')` | `pages/Contacts.tsx` | Edge Function + `useContacts` | — |
| **contacts/ContactFilters.tsx** — filtros | ✅ | importa `useContacts` | `pages/Contacts.tsx` | `useContacts` | — |
| **contacts/ContactGrid.tsx** — grid | ✅ | importa `useContacts` | `pages/Contacts.tsx` | `useContacts` | — |
| **contacts/ContactHistoryTab.tsx** — histórico | ✅ | importa `useContacts` | `ContactDetailSheet.tsx` | `useContacts` | — |
| **contacts/ContactPagination.tsx** — paginação | ✅ | props de `pages/Contacts.tsx` | `pages/Contacts.tsx` | props | — |
| **contacts/ContactProfileTab.tsx** — aba de perfil | ✅ | props de `ContactDetailSheet` | `ContactDetailSheet.tsx` | props | — |
| **contacts/CreateContactDialog.tsx** — criação com validação zod | ✅ | importa `lib/validation/contact-schema` + `useContacts` | `pages/Contacts.tsx` | `useContacts` | — |
| **contacts/CustomerJourneyTimeline.tsx** — timeline da jornada | ✅ | props de `ContactDetailSheet` | `ContactDetailSheet.tsx` | props | — |
| **contacts/useBitrixSync.ts** — sincronização Bitrix24 | ✅ | `useBitrixSync.ts:19,29,51,56` (erro/vazio/sucesso reais) | `pages/Contacts.tsx` | `@/hooks/useBitrix` + `useContacts` | — |
| **conversation-intelligence/BattleCardAlert.tsx** — alerta de battle card ao vivo | ✅ | `.from('coaching_timestamps')` + `useBattleCardDetection` | `calls/LiveTranscription.tsx` | tabela `coaching_timestamps` | — |
| **conversation-intelligence/CallPlayerWithTranscript.tsx** — player + transcrição sincronizada | ✅ | props do `CallDetailDialog` | `call-history/CallDetailDialog.tsx` | props | — |
| **conversation-intelligence/CoachingTimeline.tsx** — marcos de coaching | ✅ | `.from('coaching_timestamps')` | `call-history/CallDetailDialog.tsx` | tabela `coaching_timestamps` | — |
| **conversation-intelligence/HighlightedSnippet.tsx** — realce de trecho | ✅ | props | `pages/CallLibrary.tsx` | props | — |
| **conversation-intelligence/KeyMomentsTimeline.tsx** — momentos-chave | ✅ | importa `useKeyMoments` | `call-history/CallDetailDialog.tsx` | `useKeyMoments` | — |
| **conversation-intelligence/LiveSentimentGraph.tsx** — sentimento ao vivo | ✅ | importa `useLiveSentiment` | `call-history/CallDetailDialog.tsx` | `useLiveSentiment` | — |
| **conversation-intelligence/TalkRatioChart.tsx** — proporção de fala | ✅ | importa `useTalkRatio` | `call-history/CallDetailDialog.tsx` | `useTalkRatio` | — |
| **dashboard/ActiveCallsRealtime.tsx** — chamadas ativas + filtros | ✅ | `ActiveCallsRealtime.tsx:67-68` filtros ligados a estado real | `pages/Index.tsx` | `useActiveCallsRealtime` | — |
| **dashboard/AgentsList.tsx** — lista de agentes | ✅ | importa `useDashboardData` | `pages/Index.tsx` | `useDashboardData` | — |
| **dashboard/CallVolumeChart.tsx** — volume de chamadas (recharts) | ✅ | importa `useDashboardData` | `pages/Index.tsx`, `lib/__tests__/dashboard-integration.test.ts` | `useDashboardData` | — |
| **dashboard/DashboardGoalsSettings.tsx** — configuração de metas | ✅ | importa `useDashboardGoals` | `pages/QueueMetricsDashboard.tsx`, `hooks/useQueueMetrics.ts` + teste | `useDashboardGoals` | — |
| **dashboard/GoalViolationsHistory.tsx** — violações de meta | ✅ | importa `useGoalViolations` | `pages/QueueMetricsDashboard.tsx` | `useGoalViolations` | — |
| **dashboard/HoldTrendChart.tsx** — tendência de espera (polling) | ✅ | `HoldTrendChart.tsx:25-48` agrega `call_sessions` + `hold_events` reais; único arquivo do lote com `.channel(` | `pages/Index.tsx` | tabelas `call_sessions`, `hold_events` | — |
| **dashboard/PerformanceNarrative.tsx** — "Análise IA de Performance" no dashboard principal | 🟦 | `PerformanceNarrative.tsx:26-27` texto fixo "crescimento de **12%**", "acima da meta (**94%**)"; `:32` "Eficiência +5.2%"; `:36` "Pico esperado às 16:00"; `:44` Health Score **9.8**; `:21` badge "Atualizado agora". Zero imports de hook/supabase | `pages/Index.tsx:26,116` | **NENHUMA — 100% hardcoded** | Ligar a `useDashboardData`/serviço de IA; hoje é fachada exibida como métrica real |
| **dashboard/QueueStatus.tsx** — status de fila | ✅ | importa `useDashboardData` | `pages/Index.tsx` | `useDashboardData` | — |
| **dashboard/RecentCalls.tsx** — chamadas recentes | ✅ | importa `useDashboardData` | `pages/Index.tsx` | `useDashboardData` | — |
| **dashboard/SortableWidget.tsx** — wrapper drag-and-drop | ✅ | usa `@dnd-kit/sortable` + `@dnd-kit/utilities` | `pages/Index.tsx` | props | — |
| **dashboard/StatsCard.tsx** — card de KPI animado | ✅ | importa `useAnimatedCounter`, `lib/safe-number` | `pages/Index.tsx`, `lib/__tests__/dashboard-integration.test.ts` | props | — |
| **dashboard/SystemIntegrityDashboard.tsx** — "Integridade da Infraestrutura (10/10)" | 🟦 | `SystemIntegrityDashboard.tsx:6-11` array literal: `SIP Gateway / Online / '45ms'`, `RLS Policies / Seguro / '10/10'`, `Supabase DB / Otimizado`. Sem hook/supabase | `pages/ObservabilityDashboard.tsx:8,104` | **NENHUMA — 100% hardcoded** | Latência e status precisam vir de health-check real; hoje sempre "Online/45ms" |
| **dashboard/WidgetLibrary.tsx** — biblioteca de widgets | ✅ | importa `useDashboardLayout` | `pages/Index.tsx` | `useDashboardLayout` | — |
| **dialer/AddContactsDialog.tsx** — adicionar contatos à fila | ✅ | `AddContactsDialog.tsx:64` monta `AddToQueueInput[]` real; `:187` selecionar/desmarcar todos | `DialerControlPanel.tsx`, `PredictiveDialerPanel.tsx` | `usePredictiveDialer` + `useContacts` | — |
| **dialer/CreateCampaignDialog.tsx** — criar campanha | ✅ | importa `usePredictiveDialer` | `PredictiveDialerPanel.tsx` | `usePredictiveDialer` | — |
| **dialer/DialerControlPanel.tsx** — controles do discador | ✅ | importa `usePredictiveDialer`, `useSipCall` | `PredictiveDialerPanel.tsx` | `usePredictiveDialer` + SIP | — |
| **dialer/PredictiveDialerPanel.tsx** — painel do discador preditivo | ✅ | `PredictiveDialerPanel.tsx:95` desestrutura 11 ações do hook; `:119` `await completeCall(...)` antes do toast `:120` | `pages/Dialer.tsx` | `usePredictiveDialer` | — |
| **dialer/phone/DeviceNameSetting.tsx** — nome do dispositivo | ✅ | importa `lib/device-identity`, `useDeviceLabel` | `RingtoneSettings.tsx` | `useDeviceLabel` | — |
| **dialer/phone/FavoriteTagFilter.tsx** — filtro por etiqueta | ✅ | `FavoriteTagFilter.tsx:12` comentário de comportamento; importa `lib/dialer-favorite-tags` | `PhoneQuickAccess.tsx` | `lib/dialer-favorite-tags` | — |
| **dialer/phone/FavoriteTagMenu.tsx** — menu de etiquetas | ✅ | importa `lib/dialer-favorite-tags` | `PhoneQuickAccess.tsx` | `lib/dialer-favorite-tags` | — |
| **dialer/phone/PhoneCallScreen.tsx** — tela de chamada | ✅ | props de `pages/PhoneDialer.tsx` | `pages/PhoneDialer.tsx` | props + `phone-utils` | — |
| **dialer/phone/PhoneDialpad.tsx** — teclado | ✅ | importa `phone-utils` | `pages/PhoneDialer.tsx` | props | — |
| **dialer/phone/PhoneFrame.tsx** — moldura do telefone | ✅ | wrapper visual | `pages/PhoneDialer.tsx` | props | — |
| **dialer/phone/PhoneQuickAccess.tsx** — acesso rápido/favoritos (345 linhas) | ✅ | importa `usePersistedTagFilter`, `lib/dialer-favorite-tags` | `pages/PhoneDialer.tsx` | favoritos persistidos | — |
| **dialer/phone/RemoteOriginNotice.tsx** — aviso de origem remota | ✅ | importa `lib/device-identity` | `RingtoneSettings.tsx`, `PhoneQuickAccess.tsx` | `lib/device-identity` | — |
| **dialer/phone/RingtoneSettings.tsx** — toques | ✅ | importa `useRingtoneSettings`, `lib/ringtone-presets` | `PhoneQuickAccess.tsx` | `useRingtoneSettings` | — |
| **dialer/phone/SyncHistoryPanel.tsx** — histórico de sync + export CSV | ✅ | `SyncHistoryPanel.tsx:40,42` toast após export real; importa `useSyncHistory`, `lib/sync-history` | `PhoneQuickAccess.tsx` | `useSyncHistory` | — |
| **dialer/phone/VoicePreferencesPanel.tsx** — preferências de voz/TTS | ✅ | importa `useVoicePreferences`, `lib/voice-speech` | `PhoneQuickAccess.tsx` | `useVoicePreferences` | — |
| **dialer/phone/phone-utils.ts** — utilitários de telefone | ✅ | consumido por `PhoneDialpad`, `PhoneCallScreen`, `PhoneQuickAccess`, `pages/PhoneDialer.tsx` e seu teste (5 importadores) | 5 arquivos | — | — |
| **dialer/phone/__tests__/phone-dialer.test.ts** — teste unitário | ✅ | importa `phone-utils`; sem importadores (normal para teste) | runner de testes | — | — |
| **error-boundary/ErrorBoundary.tsx** — captura de erros | ✅ | importa `lib/logger`, `lib/error-tracking` | `App.tsx`, `pages/Index.tsx`, `lib/__tests__/error-boundaries.test.tsx` | `lib/error-tracking` | — |
| **executive/AgentAssistDashboardCard.tsx** — assistência ao agente | ✅ | importa `useLiveAssist`, `lib/agent-assist-utils` | `pages/ExecutiveDashboard.tsx` | `useLiveAssist` | — |
| **executive/ConversationIntelligenceCard.tsx** — inteligência de conversa | ✅ | `.from('call_key_moments')`, `.from('call_sessions')` | `pages/ExecutiveDashboard.tsx` | 2 tabelas | — |
| **executive/CustomerSuccessCard.tsx** — churn/renovações | ✅ | `.from('accounts')`, `.from('churn_risk_signals')`, `.from('renewals')` | `pages/ExecutiveDashboard.tsx` | 3 tabelas | — |
| **executive/DashboardCharts.tsx** — gráficos executivos | ✅ | `DashboardCharts.tsx:9` `COLORS` é paleta de UI (não dado); importa `useExecutiveDashboard` | `pages/ExecutiveDashboard.tsx` | `useExecutiveDashboard` | — |
| **executive/ForecastCard.tsx** — previsão de receita | ✅ | `ForecastCard.tsx:15` `useDealForecast(period)`; `:39-40` estado vazio honesto; `:43-47` valores do `data` | `pages/ExecutiveDashboard.tsx` | `useDealForecast` | — |
| **executive/GoalsComparisonSection.tsx** — comparação de metas | ✅ | importa `useExecutiveDashboard` | `pages/ExecutiveDashboard.tsx` | `useExecutiveDashboard` | — |
| **executive/KPICards.tsx** — cards de KPI | ✅ | importa `useExecutiveDashboard` | `pages/ExecutiveDashboard.tsx` | `useExecutiveDashboard` | — |
| **executive/MeetingSummaryDashboardCard.tsx** — resumos de reunião | ✅ | importa `useMeetingSummary`; `:22` link real `/meeting-summaries` | `pages/ExecutiveDashboard.tsx` | `useMeetingSummary` | — |
| **executive/MultilingualDashboardCard.tsx** — traduções | ✅ | `.from('call_translations')` + `lib/language-detection` | `pages/ExecutiveDashboard.tsx` | tabela `call_translations` | — |
| **executive/OmnichannelCard.tsx** — canais + SLA | ✅ | `OmnichannelCard.tsx:10` `channelMeta` é metadado de UI; importa `useConversations`, `useSLA` | `pages/ExecutiveDashboard.tsx` + teste | `useConversations`, `useSLA` | — |
| **executive/OutboundComplianceCard.tsx** — compliance de saída | ✅ | `.from('consent_records')`, `.from('contact_engagement_patterns')` | `pages/ExecutiveDashboard.tsx` | 2 tabelas | — |
| **executive/PendingFollowupsCard.tsx** — follow-ups pendentes | ✅ | `.from('scheduled_callbacks')`; `:35` link `/callbacks` | `pages/ExecutiveDashboard.tsx` | tabela `scheduled_callbacks` | — |
| **executive/QualityTrunkDashboard.tsx** — qualidade de troncos | ✅ | `.from('call_quality_metrics')`, `.from('voip_trunk_usage_metrics')` | `pages/ObservabilityDashboard.tsx` | 2 tabelas | — |
| **executive/RealtimeQualityDashboard.tsx** — qualidade em tempo real | ✅ | importa `useQualityMetrics`; `:8,124` monta `SecurityAuditCard` | `pages/ObservabilityDashboard.tsx` | `useQualityMetrics` | — |
| **executive/SecurityAuditCard.tsx** — "Auditoria de Segurança (10/10)" | 🟦 | `SecurityAuditCard.tsx:6-11` array literal com status fixos `Ativo/Validado/Ativo/Imutável`; `:18` título "(10/10)"; `:40` "Última validação automática: `{new Date().toLocaleTimeString()}`" — carimbo de hora do render, não de verificação. Sem hook/supabase | `RealtimeQualityDashboard.tsx:8,124` | **NENHUMA — 100% hardcoded** | Consultar RLS/políticas reais; hoje afirma conformidade sem verificar nada |
| **executive/TrendIndicator.tsx** — seta de tendência | ✅ | props de `KPICards` | `executive/KPICards.tsx` | props | — |
| **executive/VoipInfrastructureTab.tsx** — infraestrutura VoIP | ✅ | importa `useVoipTrunks` | `pages/ObservabilityDashboard.tsx` | `useVoipTrunks` | — |
| **executive/VolumeForecastCard.tsx** — previsão de volume | ✅ | importa `useForecastVolume` | `pages/ExecutiveDashboard.tsx` | `useForecastVolume` | — |
| **executive/__tests__/OmnichannelCard.test.tsx** — teste | ✅ | `:7,19` `vi.mock` de `useConversations`/`useSLA` (mock legítimo de teste); `:46` caso "lista todos os canais" | runner de testes | — | — |
| **financial/AgentFinancialLeaderboard.tsx** — ranking financeiro + CSV | ✅ | `:19` `useAgentFinancialLeaderboard(days)`; `:24` recusa exportar sem dados; `:37` toast após export real | `pages/FinancialImpact.tsx` | `useAgentFinancialLeaderboard` | — |
| **gamification/AchievementCelebration.tsx** — animação de conquista | ✅ | `:35-37` `Math.random()` usado só para posição/atraso de confete (decorativo, **não** métrica) | `AchievementNotificationProvider.tsx` | `useGamification` | — |
| **gamification/AchievementNotificationProvider.tsx** — provider de notificações | ✅ | importa `useAchievementNotifications`, `useAgentStatus` | `App.tsx` | `useAchievementNotifications` | — |
| **gamification/AgentGoalsProgress.tsx** — progresso de metas do agente | 🟨 | `AgentGoalsProgress.tsx:29` `current_calls: 0, // Would be populated from real-time stats`; renderizado como métrica em `:56` (`callProgress`), `:69` `{goal.current_calls}/{goal.calls_target}` e barra `:71` | `GamificationDashboard.tsx` (que é órfão) | tabela `agent_goals` (metas reais) | Popular `current_calls` com estatística real; hoje a barra é sempre 0% |
| **gamification/BadgeCard.tsx** — card de badge | ✅ | importa `useGamification` | `BadgesShowcase.tsx` | `useGamification` | — |
| **gamification/BadgesShowcase.tsx** — vitrine de badges | ✅ | `:15` `categories` é agrupamento de UI; importa `useGamification` | `GamificationDashboard.tsx` (órfão) **e** `pages/AgentRanking.tsx` (vivo) | `useGamification` | — |
| **gamification/GamificationDashboard.tsx** — dashboard de gamificação (ranking/badges/metas) | ⬛ | `grep -rn "GamificationDashboard" src/` → **zero ocorrências** fora do próprio arquivo. Importa `WeeklyRanking`, `BadgesShowcase`, `AgentGoalsProgress` (`:3-5`) | **NENHUM — órfão** | `useGamification` (`:10`) | Rota/página que o monte. `BadgesShowcase` sobrevive via `pages/AgentRanking.tsx`; `AgentGoalsProgress` e `WeeklyRanking` ficam inalcançáveis por aqui |

**Totais:** ✅ 90 · 🟨 1 · 🟦 3 · ⬛ 2.

## Achados graves

**1. `PerformanceNarrative` — narrativa de negócio inventada no dashboard principal (mais grave do lote).**
Renderizada em `pages/Index.tsx:116`, a primeira coisa que o usuário lê no dashboard. Sob o rótulo **"Análise IA de Performance"** com badge **"Atualizado agora"** (`PerformanceNarrative.tsx:19,21`), o componente afirma como fato: crescimento de **12%** no volume de chamadas, taxa de atendimento **acima da meta (94%)**, **Eficiência +5.2%**, **pico esperado às 16:00** e **Health Score 9.8** (`:26-27,32,36,44`). Todos os valores são literais no JSX — o arquivo não importa nenhum hook, nenhum `supabase`, nada. Nunca muda, independentemente da operação real. É o caso exato de dado fictício apresentado como número de negócio, agravado pela atribuição a uma "IA" e pelo selo de recência.

**2. `SecurityAuditCard` — atestado de conformidade de segurança sem verificação alguma.**
Montado em `RealtimeQualityDashboard.tsx:124`. Declara **"Auditoria de Segurança (10/10)"** (`SecurityAuditCard.tsx:18`) e lista RLS "Ativo", Isolamento de Dados "Validado", Criptografia SIP "Ativo", Logs de Auditoria "Imutável" — todos strings fixas em `:6-11`. O rodapé (`:40`) imprime *"Última validação automática: {new Date().toLocaleTimeString()} - Todas as políticas de RLS estão em conformidade"*, onde o horário é apenas o instante do render. O componente não consulta política, tabela ou endpoint nenhum. Um card de segurança que sempre diz "10/10 conforme" é pior que ausência de card: mascara regressão real de RLS.

**3. `SystemIntegrityDashboard` — saúde de infraestrutura fixa.**
Em `pages/ObservabilityDashboard.tsx:104`. Array literal em `:6-11` com "SIP Gateway / Online / **45ms**" e "RLS Policies / Seguro / **10/10**". Exibido numa página de *observabilidade*, cuja função é justamente detectar quando algo saiu do normal — e que, aqui, nunca sairá.

**4. Dois componentes completos e inalcançáveis (órfãos).**
`ContactAlertsDropdown.tsx` (246 linhas) implementa alertas de contato com hook real `useContactAlerts` — marcar como lido, marcar todos, deletar, re-checar — e **nenhum arquivo em `src/` sequer menciona o nome**. `GamificationDashboard.tsx` idem: monta `WeeklyRanking`, `BadgesShowcase` e `AgentGoalsProgress` em abas, e nenhum importador. Ambos confirmados pelos três padrões de busca. Trabalho pronto que o usuário não alcança.

**5. `AgentGoalsProgress` — barra de progresso permanentemente zerada.**
`AgentGoalsProgress.tsx:29` fixa `current_calls: 0` com o comentário *"Would be populated from real-time stats"*. As metas (`calls_target`, `satisfaction_target`) vêm de verdade da tabela `agent_goals`, mas o numerador não: o usuário sempre vê `0/{meta}` e barra em 0% (`:56,69,71`). Meia funcionalidade exibida como completa — e hoje inalcançável, já que seu único consumidor é o órfão do item 4.

**Nota de contraste — o lote é majoritariamente sólido.** As varreduras não encontraram: nenhum `console.log`, nenhum `onClick` vazio, nenhum `TODO/FIXME/em breve/not implemented`, nenhum mock fora de arquivos de teste, e nenhum `Math.random` em métrica (o único uso, `AchievementCelebration.tsx:35-37`, posiciona confete). Os quatro handlers que pareciam "só toast" foram verificados e todos persistem antes de notificar (ex.: `PredictiveDialerPanel.tsx:119` faz `await completeCall(...)` antes do toast em `:120`; `AgentFinancialLeaderboard.tsx:24` inclusive se recusa a exportar quando não há dados). Os problemas estão concentrados em 3 cards de fachada e 2 órfãos.

## Integrações de terceiros observadas

| Integração | Onde | Observação |
|---|---|---|
| **Supabase (PostgREST)** | 14 arquivos com `.from(...)` | Tabelas tocadas neste lote: `consent_history`, `dnc_import_logs`, `holidays`, `calling_hours_config`, `coaching_timestamps`, `call_sessions`, `hold_events`, `call_key_moments`, `accounts`, `churn_risk_signals`, `renewals`, `call_translations`, `consent_records`, `contact_engagement_patterns`, `scheduled_callbacks`, `call_quality_metrics`, `voip_trunk_usage_metrics`, `agent_goals` |
| **Supabase Edge Functions** | `CoachingCopilotCard.tsx:25` → `generate-coaching-plan`; `ContactDetailSheet.tsx:55` → `analyze-contact-profile` | Únicos dois `functions.invoke` do lote — os recursos de IA que de fato chamam backend |
| **Supabase Realtime** | `HoldTrendChart.tsx` (único `.channel(` do lote) | Demais dashboards usam polling/react-query |
| **Bitrix24 (CRM)** | `contacts/useBitrixSync.ts` via `@/hooks/useBitrix` | Sincronização de contatos com tratamento de "não configurado" (`:19`) e "nenhum contato" (`:29`) |
| **SIP / VoIP** | `DialerControlPanel.tsx` via `@/hooks/useSipCall`; `VoipInfrastructureTab.tsx` via `useVoipTrunks` | Telefonia real |
| **recharts** | 7 arquivos | Gráficos |
| **@tanstack/react-query** | 8 arquivos | Cache/fetching |
| **sonner** | 9 arquivos | Toasts |
| **framer-motion** | 5 arquivos | Animações |
| **@dnd-kit** (`sortable`, `utilities`) | `dashboard/SortableWidget.tsx` | Dashboard reordenável |
| **date-fns** (+ `locale/ptBR`) | 19 ocorrências | Datas em pt-BR |
| **zod** + **react-hook-form** | `CreateContactDialog.tsx` (via `lib/validation/contact-schema`) | Validação de formulário |
| **react-router-dom** | 8 arquivos | Navegação |
| **Web Speech / TTS** | `VoicePreferencesPanel.tsx` via `lib/voice-speech` | Preferências de voz |

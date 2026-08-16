<!-- Gerado pela auditoria de estado. Fonte: lote C1. -->

> **Procedência:** lote `C1` da auditoria de estado.
> **Recontagem de cobertura (Fase D):** 80/80 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime — nada nesta página é verificado contra produção.

# Lote C1 — src/components (parte 1)

## Cobertura

- **80/80 arquivos do manifesto auditados** (11.061 linhas), diretório `src/components/`.
- Fontes lidas: apenas código em `src/`, `e2e/`, `tests/`. Nenhum README/SYSTEM_FEATURES/docs/mem consultado.
- **Padrões de import testados** para detecção de consumidor (declarados conforme exigido):
  1. `grep -rl "<Basename>" src/ e2e/ tests/` — varredura ampla por símbolo (captura import multilinha, pois casa a linha do símbolo dentro de `import {\n  X\n} from`).
  2. `grep -rnE "(from|import\()\s*['\"][^'\"]*<Basename>['\"]"` — casa `from '...'`, `from "..."` **e** `import("...")` dinâmico/`lazy(() => import("@/..."))`.
  3. Grep por símbolo isolado (`grep -rn "PermissionGate" src/`) para descartar reexport via barrel ou uso em JSX sem import direto.
  4. Grep por caminho de subpasta (`live-call/types`, `live-transcription/types`, `ldap/types`) para arquivos `types` cujo basename é genérico e gera falso positivo massivo.
- Barrels (`index.ts`) em `src/components/` foram procurados: nenhum reexporta os arquivos declarados órfãos.
- 5 arquivos do lote são `__tests__` (não recebem classificação funcional; contados à parte).
- Não foram executados testes nem build. Nenhuma afirmação sobre suíte passando.

**Distribuição:** ✅ 51 · 🟨 16 · 🟦 0 · ⬛ 8 · (5 arquivos de teste)

`src/components/ui/*` (shadcn) **não pertence a este lote** (manifesto C1 não os inclui); a única interseção observada é o duplicado `SearchInput` documentado abaixo.

---

## Tabela de funcionalidades

| Componente/Funcionalidade | Classificação | Evidência | Consumidor | Fonte de dados | O que falta |
|---|---|---|---|---|---|
| `SearchInput.tsx` (busca genérica) | ⬛ | `src/components/SearchInput.tsx:1-88`; grep por caminho retorna **zero** importadores; todas as 5 páginas importam o duplicado `@/components/ui/search-input` (`src/pages/Contacts.tsx:10`, `src/pages/Recordings.tsx:5`, `src/pages/CallHistory.tsx:2`, `src/pages/MeetingSummaries.tsx:7`, `src/pages/Voicemail.tsx:8`) | nenhum | — | Remover: duplicata morta de `ui/search-input.tsx:32` |
| `admin/EndpointSparkline.tsx` | ✅ | `src/components/admin/EndpointSparkline.tsx:1-81` | `src/components/admin/webhook-health/EndpointList.tsx` | props derivadas de `useWebhookHealthData` (`src/pages/admin/WebhookHealth.tsx:16`) | — |
| `admin/extensions/BulkActionsBar.tsx` | ✅ | `src/components/admin/extensions/BulkActionsBar.tsx:1-43` | `src/pages/admin/ExtensionsAdmin.tsx` | props de `useExtensionsAdmin` | — |
| `admin/extensions/BulkAssignTrunkDialog.tsx` | ✅ | insere de fato: `BulkAssignTrunkDialog.tsx:75` `supabase.from('agent_trunk_assignments').insert(rows)`; lê `voip_trunks:42`, `agent_trunk_assignments:63`; audita via `useExtensionAudit:32` | `src/pages/admin/ExtensionsAdmin.tsx` | `voip_trunks`, `agent_trunk_assignments` | — |
| `admin/extensions/ExtensionAuditTimeline.tsx` | ✅ | `ExtensionAuditTimeline.tsx:23` `useExtensionAuditHistory(agentId)` | `ExtensionDetailsDrawer.tsx` | histórico de auditoria de ramais | — |
| `admin/extensions/ExtensionDetailsDrawer.tsx` | ✅ | `ExtensionDetailsDrawer.tsx:1-183`, navegação real `:22` | `src/pages/admin/ExtensionsAdmin.tsx` | props + timeline de auditoria | — |
| `admin/extensions/ExtensionStatusBadge.tsx` | ✅ | `ExtensionStatusBadge.tsx:1-38` | `ExtensionsTable.tsx`, `ExtensionDetailsDrawer.tsx`, `BulkAssignTrunkDialog.tsx` | props | — |
| `admin/extensions/ExtensionsFilters.tsx` | ✅ | `src/pages/admin/ExtensionsAdmin.tsx:15`; tipo consumido em `src/hooks/useExtensionsAdmin.ts:9` | ExtensionsAdmin | estado de filtro do hook | — |
| `admin/extensions/ExtensionsTable.tsx` | ✅ | `ExtensionsTable.tsx:111-125` menu com handlers reais (`onSelect`, `navigate('/admin/users')`) | `src/pages/admin/ExtensionsAdmin.tsx` | `useExtensionsAdmin` | — |
| `admin/extensions/HealthScoreBadge.tsx` | ✅ | `HealthScoreBadge.tsx:1-60`; consumido em `ExtensionsTable.tsx:106` com `ext.health_score` real | ExtensionsTable | campo `health_score` do ramal | — |
| `admin/extensions/StatCard.tsx` | ✅ | `src/pages/admin/ExtensionsAdmin.tsx:14` | ExtensionsAdmin | props numéricas do hook | — |
| `admin/ldap/LDAPConfigTab.tsx` | 🟨 | `src/pages/LDAPSync.tsx:31-35`: `handleTestConnection` = `await new Promise(r => setTimeout(r, 2000))` + `toast.success('Conexão LDAP testada com sucesso!')` — **sucesso fabricado, nenhuma conexão feita** | `src/pages/LDAPSync.tsx` | `useState(DEFAULT_LDAP_CONFIG)` — **não persiste** (`LDAPSync.tsx:21`) | Edge function de teste LDAP; persistência da config |
| `admin/ldap/LDAPMappingTab.tsx` | 🟨 | `src/components/admin/ldap/LDAPMappingTab.tsx:1-48`; mapeamento gravado só em `useState` local | `src/pages/LDAPSync.tsx` | estado local volátil | Tabela/endpoint de persistência do mapeamento |
| `admin/ldap/LDAPLogsTab.tsx` | 🟨 | Renderiza `logs` recebidos; a página passa `MOCK_SYNC_LOGS` (`src/pages/LDAPSync.tsx:25` `const [logs] = useState(MOCK_SYNC_LOGS)`) | `src/pages/LDAPSync.tsx` | **array hardcoded** | Tabela real de execuções de sync |
| `admin/ldap/types.ts` | 🟨 | `src/components/admin/ldap/types.ts:49-82` `export const MOCK_SYNC_LOGS` com `contactsSynced: 245`, `duration: '4.2s'` exibidos como histórico real | `src/pages/LDAPSync.tsx:12` | constante fictícia | Substituir por consulta real |
| `admin/voip/TrunkAssignmentsTab.tsx` | ✅ | `TrunkAssignmentsTab.tsx:14-25`: `useTrunkAssignments`, `useVoipTrunks`, `supabase.from('agents')`, `useSaveAssignment`, `useDeleteAssignment` | `src/pages/admin/VoipTrunksAdmin.tsx` | `agent_trunk_assignments`, `voip_trunks`, `agents` | — |
| `admin/voip/TrunkHealthHistoryDrawer.tsx` | ✅ | `TrunkHealthHistoryDrawer.tsx:17` `useTrunkHealthHistory(trunkId, 24)`; uptime/latência **calculados** de `h.latency_ms` (`:22,:30-31`) | `src/pages/admin/VoipTrunksAdmin.tsx` | histórico de health de tronco | — |
| `admin/voip/TrunkMetricsTab.tsx` | ✅ | `TrunkMetricsTab.tsx:15` `useTrunkMetrics(days)` | `src/pages/admin/VoipTrunksAdmin.tsx` | métricas de tronco | — |
| `admin/voip/VoipMonitoringSettingsDialog.tsx` | ✅ | `VoipMonitoringSettingsDialog.tsx:11` `useVoipMonitoringSettings()` com `save` | `src/pages/admin/VoipTrunksAdmin.tsx` | settings de monitoramento | — |
| `admin/voip/VoipTrunkFormDrawer.tsx` | ✅ | `VoipTrunkFormDrawer.tsx:34` `useSaveTrunk()` | `src/pages/admin/VoipTrunksAdmin.tsx` | `voip_trunks` | — |
| `admin/webhook-health/EndpointList.tsx` | ✅ | `EndpointList.tsx:47-60`, ratio calculado de dados agregados | `src/pages/admin/WebhookHealth.tsx` | `useWebhookHealthData` + `aggregateEndpoints` (`WebhookHealth.tsx:80`) | — |
| `admin/webhook-health/EndpointsToolbar.tsx` | ✅ | `EndpointsToolbar.tsx:58-90`, handlers via props | `src/pages/admin/WebhookHealth.tsx` | estado da página | — |
| `admin/webhook-health/HealthHeatmap.tsx` | ✅ | `HealthHeatmap.tsx:1-87`; buckets de `aggregateHeatmap(filteredRows)` (`WebhookHealth.tsx:81`) | `src/pages/admin/WebhookHealth.tsx` | entregas de webhook | — |
| `admin/webhook-health/KpiCards.tsx` | ✅ | `KpiCards.tsx:31` `{globalRatio.toFixed(1)}%` a partir de props reais | `src/pages/admin/WebhookHealth.tsx:6` | agregação de `useWebhookHealthData` | — |
| `agent/BargeInNotification.tsx` | ✅ | `BargeInNotification.tsx:43` `.from('barge_in_sessions')` (realtime) | `src/pages/Index.tsx` | `barge_in_sessions` | — |
| `agent/WhisperNotification.tsx` | ✅ | `WhisperNotification.tsx:57,104,121` leitura + update em `.from('whisper_messages')` | `src/pages/Index.tsx` | `whisper_messages` | — |
| `ai/AICallAnalysis.tsx` | 🟨 | Edge function real (`AICallAnalysis.tsx:93` `/functions/v1/analyze-call`), **porém**: `callInfo` fixo `{contactName:'Cliente', duration:'5:30', type:'incoming'}` (`:102-106`); botões "Marcar como resolvido" e "Requer follow-up" **sem `onClick`** (`:371`, `:375`); resultado nunca persistido | `src/pages/AIAssistant.tsx` | edge fn `analyze-call` | Vincular a `call_sessions` reais; persistir análise; implementar os 2 botões |
| `ai/CallSimulation.tsx` | 🟨 | `CallSimulation.tsx:26-38` `simulatedConversation` — 11 falas roteirizadas ("Agente Maria"/"Cliente João", CPF `123.456.789-00`, protocolo `2024-789456`) | `src/pages/AIAssistant.tsx` | **roteiro hardcoded** | Nada persiste; é demo (rotulada "Simulação" na UI), mas alimenta `LiveCallAnalysis` com dado fictício |
| `ai/LiveCallAnalysis.tsx` | ✅ | `LiveCallAnalysis.tsx:63` `useLiveInsights({...})` | `ai/CallSimulation.tsx:15`, `calls/ActiveCallBar.tsx:18` | edge fn `realtime-analysis` | — |
| `ai/live-call/InsightPanels.tsx` | ✅ | `InsightPanels.tsx:1-73`, props de insights reais | `ai/LiveCallAnalysis.tsx` | `useLiveInsights` | — |
| `ai/live-call/TranscriptPreview.tsx` | ✅ | `TranscriptPreview.tsx:1-49` | `ai/LiveCallAnalysis.tsx` | props de transcrição | — |
| `ai/live-call/types.tsx` | ✅ | `src/components/ai/LiveCallAnalysis.tsx:21` `import type { TranscriptEntry } from './live-call/types'` | LiveCallAnalysis | type-only | — |
| `ai/live-call/useLiveInsights.ts` | ✅ | `useLiveInsights.ts:48` POST `/functions/v1/realtime-analysis` com JWT; **persiste** `:85` `.from('live_sentiment_snapshots').insert(...)` a cada 5s | `ai/LiveCallAnalysis.tsx` | edge fn + `live_sentiment_snapshots` | — |
| `alerts/AlertStatsCards.tsx` | ✅ | `AlertStatsCards.tsx:1-57`, presentational puro | `src/pages/Alerts.tsx:14`, `src/pages/HoldAlerts.tsx` (via `hold-alerts/HoldAlertStatsCards`) | contagens de `useAlerts` | — |
| `alerts/AlertsDropdown.tsx` | ⬛ | 285 linhas; grep por caminho e por símbolo `AlertsDropdown` retorna **zero** ocorrências fora do próprio arquivo. `src/components/contacts/ContactAlertsDropdown.tsx:29` é componente distinto | nenhum | (leria `call_alerts`, `call_sessions`) | Remover; contém ainda `insert` de alertas de teste (`:161`) |
| `alerts/AlertsTrendChart.tsx` | ✅ | `AlertsTrendChart.tsx:56,61` `.from('call_alerts')` e `.from('contact_alerts')`; séries calculadas (`:78`, `:110`) | `src/pages/Alerts.tsx` | `call_alerts`, `contact_alerts` | — |
| `alerts/CallAlertsList.tsx` | 🟨 | Ações reais (`:67,:72,:127`), **mas** botão "Criar Testes" exposto em produção: `CallAlertsList.tsx:63` `onClick={alerts.createTestAlerts}` → `src/hooks/useAlerts.ts:239-245` insere `call_sessions` `{caller_name:'Cliente Teste', agent_name:'Agente Teste'}` + 3 `call_alerts` fabricados | `src/pages/Alerts.tsx` | `call_alerts` | Remover/gatear o botão de seed por ambiente ou role |
| `alerts/ContactAlertsList.tsx` | ✅ | `ContactAlertsList.tsx:67-73,140-149` — read/actioned/delete em lote, todos persistindo | `src/pages/Alerts.tsx` | `contact_alerts` | — |
| `auth/LoginBranding.tsx` | ✅ | `LoginBranding.tsx:1-77`, apenas apresentação/motion | `src/pages/Login.tsx` | estático (institucional, não é métrica) | — |
| `auth/PasskeyLogin.tsx` | ✅ | `PasskeyLogin.tsx:14` `useWebAuthn()` com `authenticateWithPasskey` | `src/pages/Login.tsx` | WebAuthn | — |
| `auth/PasskeyManager.tsx` | ✅ | `PasskeyManager.tsx:56` `useWebAuthn()`; botões em `:134`/`:277` são triggers de Dialog/Dropdown (`asChild`) | `src/pages/Passkeys.tsx` | credenciais WebAuthn | — |
| `auth/PasswordStrength.tsx` | ✅ | `PasswordStrength.tsx:36` `fetch('https://api.pwnedpasswords.com/range/${prefix}')` — verificação real de vazamento (k-anonymity) | `src/pages/Register.tsx`, `src/pages/ResetPassword.tsx`, `src/lib/password/index.ts` | HaveIBeenPwned | — |
| `auth/PermissionGate.tsx` | ⬛ | `PermissionGate.tsx:23` implementa `usePermissions()` completo, mas grep por caminho **e** por símbolo em `src/` + `e2e/` retorna **zero** ocorrências fora do arquivo | nenhum | `usePermissions` | Componente de autorização nunca aplicado — permissões de UI não são impostas por ele em lugar algum |
| `auth/ProtectedRoute.tsx` | ✅ | `ProtectedRoute.tsx:14` `useAuthContext()` + `hasRole` | `src/App.tsx` | sessão/roles | — |
| `auth/ReauthDialog.tsx` | ✅ | `ReauthDialog.tsx:35-36` `useReauth()` (`verifyWithPassword`, `verifyWithMFA`) + `useMFA()` | `src/pages/SessionManagement.tsx` | auth + fatores MFA | — |
| `blf/BlfLampCard.tsx` | ✅ | `BlfLampCard.tsx:1-115` | `src/pages/BlfBoard.tsx` | `useBlfBoard` → `agents`, `call_sessions`, `parked_calls` + canal realtime (`src/hooks/useBlfBoard.ts:24-30,71`) | — |
| `blf/BlfSummaryBar.tsx` | ✅ | `BlfSummaryBar.tsx:25` `{summary.occupancyPercent}%` — derivado de `useBlfBoard`, não constante | `src/pages/BlfBoard.tsx` | idem acima | — |
| `call-history/CallDetailDialog.tsx` | ✅ | `CallDetailDialog.tsx:58-60` `useTalkRatio`, `useKeyMoments`, `useLiveSentiment`; `:74` `.from('call_recordings')`; `:84` `.from('coaching_timestamps')` | `src/pages/CallHistory.tsx` | `call_recordings`, `coaching_timestamps`, snapshots | — |
| `call-history/CallSessionsList.tsx` | ✅ | `CallSessionsList.tsx:1-129`, lista props de sessões reais | `src/pages/CallHistory.tsx` | `call_sessions` | — |
| `callbacks/ScheduleCallbackDialog.tsx` | ✅ | `ScheduleCallbackDialog.tsx:52` `createCallback` de `useScheduledCallbacks` | `callbacks/ScheduledCallbacksList.tsx` | tabela de callbacks | — |
| `callbacks/ScheduledCallbacksList.tsx` | ✅ | `:50` `useScheduledCallbacks()`; `:340-350` menu com `onComplete`/`onCancel` reais. O texto "Em breve" (`:155`) é rótulo **temporal** (≤15 min), não promessa de feature | `src/pages/Callbacks.tsx`, `src/pages/Index.tsx` | callbacks agendados | — |
| `calls/ActiveCallBar.tsx` | 🟨 | **`setCall` só é invocado com `null`** (`ActiveCallBar.tsx:63` declaração, `:213` `setCall(null)` — única chamada). Nenhum caminho preenche `call`, então `:124 return null` sempre executa → 379 linhas de UI inalcançáveis. Além disso: `:323,:327,:331` botões Volume/Transferir/Mais **sem `onClick`**; mute/hold só mudam estado visual (`:308`, `:317`) sem tocar SIP; `'Agente Demo'` gravado no banco (`:78`, `:181`) | `src/components/layout/AppLayout.tsx` | `useCallSession`, `useContacts`, `useLiveAssist`, edge fns `generate-summary` (`:138`) e `extract-crm-fields` (`:191`) | Ligação com o estado real de chamada (SIP/multichannel); implementar transferência/volume; remover agente hardcoded |
| `calls/ActiveCallsIndicator.tsx` | ✅ | `ActiveCallsIndicator.tsx:36` `useHoldReminder(activeCalls)`; `:60` é trigger de Popover | `calls/UnifiedSoftphone.tsx` | `useMultiChannelCall` | — |
| `calls/AudioOutputSelector.tsx` | ⬛ | Importado apenas por `calls/WebRTCCall.tsx` (ele próprio órfão) e por `calls/__tests__/AudioOutputSelector.test.tsx` | nenhum em produção | `useAudioOutputDevices` | Cadeia morta junto de `WebRTCCall` |
| `calls/CallQualityIndicator.tsx` | ⬛ | Único importador: `calls/WebRTCCall.tsx` (órfão) | nenhum em produção | `useVoipQualityMonitor` | Idem |
| `calls/ConferenceSection.tsx` | ✅ | `ConferenceSection.tsx:39,45,63,74` handlers via props (`onEndConference`, `onAddToConference`, …) | `calls/ActiveCallsIndicator.tsx` | `useMultiChannelCall` (conference) | — |
| `calls/CrmSuggestionsCard.tsx` | 🟨 | `CrmSuggestionsCard.tsx:27` `useCrmFieldSuggestions` com `accept`/`reject` reais, **porém** único importador é `ActiveCallBar.tsx:120` — bloco pós-chamada inalcançável (ver achado #1) | `calls/ActiveCallBar.tsx` (inalcançável) | sugestões de campo CRM | Consumidor vivo |
| `calls/HoldReminderSettings.tsx` | ✅ | `HoldReminderSettings.tsx:57,77,85` handlers reais (`toggleAlerts`, `requestBrowserNotifications`, `clearAlerts`) | `calls/ActiveCallsIndicator.tsx` | `useHoldReminder` | — |
| `calls/LiveTranscription.tsx` | 🟨 | `LiveTranscription.tsx:17,22` `useBattleCardDetection` + `useLiveTranscription` (reais); único importador `ActiveCallBar.tsx:19` (inalcançável) | `calls/ActiveCallBar.tsx` (inalcançável) | edge fn `voice-transcribe` | Consumidor vivo |
| `calls/MeetingSummaryCard.tsx` | ✅ | `MeetingSummaryCard.tsx:36` `useMeetingSummary(callSessionId)` com `generate`/`updateContent` | `call-history/CallDetailDialog.tsx:24`, `src/pages/MeetingSummaries.tsx:17` | resumos de reunião | — |
| `calls/NetworkStatusBadge.tsx` | ✅ | `NetworkStatusBadge.tsx:8` `useNetworkMonitor()`; `:28,:35,:38` exibem `net.latencyMs`/`net.rttMs` medidos | `src/pages/Calls.tsx` | monitor de rede do browser | — |
| `calls/NextBestActionPanel.tsx` | 🟨 | `NextBestActionPanel.tsx:41` `useLiveAssist` com `markUsed` real; único importador `ActiveCallBar.tsx:19-20` (inalcançável) | `calls/ActiveCallBar.tsx` (inalcançável) | sinais de live-assist | Consumidor vivo |
| `calls/PostCallSummary.tsx` | ⬛ | `PostCallSummary.tsx:185`; importadores: só `calls/WebRTCCall.tsx` (órfão) e `calls/__tests__/PostCallSummary.test.tsx` | nenhum em produção | props | Cadeia morta |
| `calls/SipConnectionStatus.tsx` | ✅ | `SipConnectionStatus.tsx:1-55`; consumido por `src/pages/Calls.tsx` e exercitado em `e2e/sip-flow.spec.ts` | `src/pages/Calls.tsx` | `useSipCall` (via props) | — |
| `calls/TransferCallDialog.tsx` | ✅ | `TransferCallDialog.tsx:23-25,74` `handleTransfer` chama `onTransfer(callId, target, type)` | `calls/ActiveCallsIndicator.tsx` | `transferCall` de `useMultiChannelCall` | — |
| `calls/UnifiedSoftphone.tsx` | 🟨 | Canais SIP/Wavoip reais (`:43,:42`, `:101`), **mas o canal WebRTC é stub inerte**: `:3` `import { useConversation } from '@/lib/elevenlabs-stub'` e `src/lib/elevenlabs-stub.ts:13-18` — `startSession` apenas loga warning e chama `options?.onConnect?.()`, disparando `:57` `updateCallStatus('active')` + `toast.success('Conectado')` sem mídia | `src/pages/Calls.tsx` | `useMultiChannelCall`, `useSipCall`, `useWavoipCall`; edge fn `elevenlabs-conversation-token` (`:82`) | Instalar/implementar `@elevenlabs/react` ou desabilitar o canal WebRTC na UI |
| `calls/VoipQualityIndicator.tsx` | ✅ | `VoipQualityIndicator.tsx:12` `useVoipQualityMonitor(pc, { persistOnEnd: true })`; `:60,:64` exibem `quality.jitterAvgMs`/`rttAvgMs` medidos do `RTCPeerConnection` | `calls/softphone/ActiveCallDisplay.tsx:70` | WebRTC stats + persistência | — |
| `calls/WebRTCCall.tsx` | ⬛ | 371 linhas; único importador é `calls/__tests__/WebRTCCall.test.tsx:3`. `src/pages/PhoneDialer.tsx:29` tem apenas um **rótulo** de canal `{ id:'webrtc', label:'WebRTC' }` e renderiza `PhoneCallScreen` (`PhoneDialer.tsx:15`), não este componente | nenhum em produção | `useVoipQualityMonitor` (`:56`), `useAudioOutputDevices` (`:249`) | Componente completo sem rota; arrasta 4 filhos mortos |
| `calls/WebRTCMetricsPanel.tsx` | ⬛ | Único importador: `calls/WebRTCCall.tsx` (órfão) | nenhum em produção | props de stats | Cadeia morta |
| `calls/live-transcription/TranscriptList.tsx` | 🟨 | `TranscriptList.tsx:1-191`; importador único `calls/LiveTranscription.tsx` → `ActiveCallBar` (inalcançável) | cadeia inalcançável | props de transcrição | Consumidor vivo |
| `calls/live-transcription/TranscriptionHeader.tsx` | 🟨 | `TranscriptionHeader.tsx:1-53`; mesma cadeia | cadeia inalcançável | props | Consumidor vivo |
| `calls/live-transcription/types.ts` | ✅ | `src/components/calls/LiveTranscription.tsx:7` `import type { TranscriptEntry } from './live-transcription/types'` | LiveTranscription | type-only | — |
| `calls/live-transcription/useLiveTranscription.ts` | 🟨 | Implementação real: `MediaRecorder` (`:22-26`) + POST `/functions/v1/voice-transcribe` (`:53`) com diarização (`:65-72`). Só é alcançado via `LiveTranscription` → `ActiveCallBar` (inalcançável) | `calls/LiveTranscription.tsx` (+ teste) | edge fn `voice-transcribe` | Consumidor vivo |
| `calls/softphone/ActiveCallDisplay.tsx` | 🟨 | **Sentimento constante** exibido como métrica do cliente: `:86-98` — comentário `{/* Sentiment Indicator (Mock/placeholder for real sentiment) */}` e badge fixo `<Smile className="text-success"/>` com tooltip `"Sentimento do cliente: Positivo"`. **Métricas de rede hardcoded**: `:116` `<span>Latência: 45ms</span>`, `:117` `Codec: OPUS`. Botão **Transferir sem `onClick`**: `:205-207` | `calls/UnifiedSoftphone.tsx` | `useVoiceCommand` (`:36`) e `VoipQualityIndicator` (`:70`) são reais | Ligar sentimento a `useLiveSentiment`; usar `quality.rttAvgMs` real em vez de 45ms; implementar transferência |
| `calls/softphone/DialpadTab.tsx` | ✅ | `DialpadTab.tsx:1-153`, dígitos via props → `handleDigitPress` que envia DTMF real (`UnifiedSoftphone.tsx:69-71`) | `calls/UnifiedSoftphone.tsx` | `useSipCall.sendDTMF` | — |
| **Arquivos de teste** (5): `admin/extensions/__tests__/HealthScoreBadge.test.tsx`, `calls/__tests__/{AudioOutputSelector,PostCallSummary,WebRTCCall}.test.tsx`, `calls/live-transcription/__tests__/useLiveTranscription.test.ts` | — | Sem classificação funcional. Observação: 3 deles são os **únicos** consumidores de componentes órfãos, o que mascara a morte de `WebRTCCall`, `PostCallSummary` e `AudioOutputSelector` em varreduras ingênuas | — | — | — |

---

## Achados graves

**1. `ActiveCallBar` é código inalcançável — a barra de chamada ativa global nunca aparece.**
`src/components/calls/ActiveCallBar.tsx:63` declara `const [call, setCall] = useState<ActiveCall | null>(null)`, e a **única** chamada a `setCall` em todo o arquivo é `:213 setCall(null)`. Não há prop, hook, subscription ou evento que popule `call`. Logo `:124 return null` é o caminho sempre executado. Isso torna inalcançáveis, além das 379 linhas do próprio arquivo: `LiveTranscription` + `useLiveTranscription` + `TranscriptList` + `TranscriptionHeader` (transcrição ao vivo real, com `MediaRecorder` e edge function), `NextBestActionPanel`, `CrmSuggestionsCard`, e as invocações de `generate-summary` (`:138`) e `extract-crm-fields` (`:191`). Está importado em `src/components/layout/AppLayout.tsx`, ou seja, monta em todas as páginas e não renderiza nada.

**2. Canal WebRTC do softphone reporta "Conectado" sem nenhuma chamada real.**
`src/lib/elevenlabs-stub.ts:13-18`: `startSession` executa `logger.warn('ElevenLabs not configured...')` e em seguida `options?.onConnect?.()`. Em `src/components/calls/UnifiedSoftphone.tsx:57`, esse `onConnect` dispara `updateCallStatus('active')` e `toast.success('Conectado')`. O usuário do `/Calls` vê uma chamada "ativa", com cronômetro e badge, sem áudio ou peer connection. O token real é buscado em `:82` (`elevenlabs-conversation-token`) e não é usado por nenhum cliente WebRTC. Agrava-se em `calls/softphone/ActiveCallDisplay.tsx:116-117`, que exibe `Latência: 45ms` e `Codec: OPUS` **literais**, e `:86-98`, que exibe "Sentimento do cliente: Positivo" fixo — três métricas fabricadas apresentadas como leitura real durante a chamada.

**3. Módulo LDAP inteiro é fachada, com números de negócio inventados.**
`src/pages/LDAPSync.tsx:31-35`: testar conexão = `setTimeout(2000)` + `toast.success('Conexão LDAP testada com sucesso!')`. `:42-50`: sincronizar = laço de progresso falso + `toast.success('Sincronização concluída! 245 contatos atualizados.')` — o número 245 é literal e não vem de lugar nenhum. O histórico vem de `src/components/admin/ldap/types.ts:49-82` (`MOCK_SYNC_LOGS`, com `contactsSynced: 245`, `duration: '4.2s'`, erros fictícios), renderizado como tabela real por `LDAPLogsTab.tsx:37-56`. A configuração e o mapeamento vivem só em `useState` (`LDAPSync.tsx:21`) e se perdem ao recarregar. Nenhuma tabela, nenhuma edge function, nenhum cliente LDAP.

**4. Botão de seed de dados fictícios exposto em produção.**
`src/components/alerts/CallAlertsList.tsx:63` renderiza `"Criar Testes"` chamando `alerts.createTestAlerts`, que em `src/hooks/useAlerts.ts:239-245` insere uma `call_sessions` com `caller_name:'Cliente Teste'`/`agent_name:'Agente Teste'` e três `call_alerts` fabricados (inclusive `severity:'critical'`). Sem gate de ambiente ou de role — contamina permanentemente as métricas de alertas e o histórico de chamadas.

**5. Oito arquivos mortos, 1.130+ linhas, sendo dois de segurança/UX crítica.**
`auth/PermissionGate.tsx` implementa gate de permissão completo (`:23 usePermissions()`) e **não é usado em lugar nenhum** — nenhum elemento de UI é protegido por ele. `SearchInput.tsx` é duplicata integral de `ui/search-input.tsx`, com todas as 5 páginas consumindo a outra. A cadeia `WebRTCCall` → `AudioOutputSelector` / `CallQualityIndicator` / `WebRTCMetricsPanel` / `PostCallSummary` (≈880 linhas) só é referenciada por testes; `src/pages/PhoneDialer.tsx:29` tem apenas o rótulo `'WebRTC'` e renderiza `PhoneCallScreen`. `alerts/AlertsDropdown.tsx` (285 linhas) não tem nenhum importador.

**6. Identidade de agente hardcoded gravada no banco.**
`src/components/calls/ActiveCallBar.tsx:78` `startSession(call.contactName, call.contactPhone, 'Agente Demo')` e `:181` `agent_name: 'Agente Demo'` em `addContactInteraction`. Mesmo que hoje inalcançável (achado #1), o caminho de persistência grava um agente fictício em `call_sessions`/interações de contato em vez do usuário autenticado.

---

## Integrações de terceiros observadas

| Integração | Onde | Situação |
|---|---|---|
| **Supabase** (Postgres + Realtime + Edge Functions) | `agent/BargeInNotification.tsx:43` (`barge_in_sessions`), `agent/WhisperNotification.tsx:57,104,121` (`whisper_messages`), `alerts/AlertsTrendChart.tsx:56,61`, `ai/live-call/useLiveInsights.ts:85` (`live_sentiment_snapshots`), `admin/extensions/BulkAssignTrunkDialog.tsx:75`, `call-history/CallDetailDialog.tsx:74,84` | Real e funcional; base da maior parte do lote |
| **Edge Functions** | `analyze-call` (`ai/AICallAnalysis.tsx:93`), `realtime-analysis` (`ai/live-call/useLiveInsights.ts:48`), `voice-transcribe` (`calls/live-transcription/useLiveTranscription.ts:53`), `generate-summary` (`calls/ActiveCallBar.tsx:138`), `extract-crm-fields` (`calls/ActiveCallBar.tsx:191`), `elevenlabs-conversation-token` (`calls/UnifiedSoftphone.tsx:82`) | Chamadas reais. As duas de `ActiveCallBar` estão em código inalcançável; a de token ElevenLabs alimenta um stub |
| **ElevenLabs** (`@elevenlabs/react`) | `src/lib/elevenlabs-stub.ts` ← `calls/UnifiedSoftphone.tsx:3` | **Não instalado.** Stub inerte que simula conexão bem-sucedida (achado #2) |
| **HaveIBeenPwned** (`api.pwnedpasswords.com`) | `auth/PasswordStrength.tsx:36` | Real, com k-anonymity por prefixo SHA-1 |
| **WebAuthn / Passkeys** (API do navegador) | `auth/PasskeyLogin.tsx:14`, `auth/PasskeyManager.tsx:56` via `useWebAuthn` | Real |
| **SIP / WebRTC** (`useSipCall`, `RTCPeerConnection`) | `calls/UnifiedSoftphone.tsx:43,101`, `calls/VoipQualityIndicator.tsx:12`, `calls/SipConnectionStatus.tsx` (+ `e2e/sip-flow.spec.ts`) | Real; canal SIP é o único caminho de voz efetivo do softphone |
| **Wavoip (WhatsApp)** | `calls/UnifiedSoftphone.tsx:42,87-89` via `useWavoipCall` | Real, condicionado a `wavoip.isConfigured` (`:51`) |
| **MediaRecorder / getUserMedia** | `calls/live-transcription/useLiveTranscription.ts:22-26`, `calls/UnifiedSoftphone.tsx:78` | Real |
| **Recharts** | `admin/voip/TrunkHealthHistoryDrawer.tsx:77`, `alerts/AlertsTrendChart.tsx` | Real, sobre dados agregados |
| **LDAP / Active Directory** | `src/pages/LDAPSync.tsx`, `admin/ldap/*` | **Inexistente.** Nenhum cliente, endpoint ou tabela (achado #3) |

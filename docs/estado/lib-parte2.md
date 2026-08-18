<!-- Gerado pela auditoria de estado. Fonte: lote L2. -->

> **Procedência:** lote `L2` da auditoria de estado.
> **Recontagem de cobertura (Fase D):** 89/90 arquivos citados (99%).
> **Limitação global:** sem acesso ao banco/runtime — nada nesta página é verificado contra produção.

# Lote L2 — src/lib (parte 2)

## Cobertura

- **90/90 arquivos do manifesto auditados** (9.331 linhas), sendo **76 módulos de produção** e **14 arquivos de teste**.
- Método: leitura direta dos módulos + `grep` de importadores em `src/` e `supabase/` (padrão `['"]…@/lib/<caminho>|/<basename>['"]`, que captura o `from '…'` mesmo em imports multilinha, pois a cláusula `from` fica sempre na mesma linha do literal).
- **Ressalva metodológica registrada:** a varredura por basename gera falso-positivo para arquivos chamados `index.ts` (qualquer import terminado em `/index` casa). Todos os 8 barris (`audit`, `export`, `mfa`, `notifications`, `password`, `session`, `security`, `validation`) foram **re-verificados individualmente** com padrão ancorado no diretório — os resultados abaixo já são os corrigidos.
- Não foram executados testes. Nenhum arquivo do repositório foi alterado.

### Placar

| Classificação | Módulos | Linhas aprox. |
|---|---|---|
| ✅ IMPLEMENTADO_TOTAL | 44 | ~5.100 |
| 🟨 IMPLEMENTADO_PARCIAL | 5 | ~440 |
| 🟦 SUGERIDO_OU_INICIADO | 24 | ~1.030 |
| ⬛ MORTO_OU_ABANDONADO | 3 | ~220 |

---

## Tabela de funcionalidades (módulos)

> Coluna "Quem importa" lista **apenas consumidores de produção** (testes contados à parte). "0 (só testes)" = nenhum componente/hook/página/edge function importa.

### Núcleo de utilidades e observabilidade

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/utils.ts` | ✅ | `utils.ts:4` `cn()`, `:9` `formatDuration`, `:32` `formatCurrency`, `:40` `formatNumber` | 149 arquivos (`components/SearchInput.tsx`, `components/ai/AICallAnalysis.tsx`, …) | — | — |
| `src/lib/logger.ts` | 🟨 | `logger.ts:4` promete "Mascara PII automaticamente", mas `logger.ts:18` só cobre `password\|token\|secret\|authorization\|cookie\|session\|key\|credential`; `logger.ts:22` devolve primitivos sem máscara e `logger.ts:68` concatena `message` cru | 182 arquivos de produção | — | PII real (nome, e-mail, telefone, CPF) e o próprio `message` não são mascarados; `isDev` (`logger.ts:31`) é `false` em staging, silenciando `debug/info` fora de localhost |
| `src/lib/tracing.ts` | ✅ | `tracing.ts:34` `traceHeaders()`, `:46` `withTrace()`, `:80` `startTrace()` | 21 hooks (`useDeals.ts`, `useHealthCheck.ts`, `useChatbot.ts`, …) | headers p/ `supabase.functions.invoke` (`tracing.ts:12` doc) | — |
| `src/lib/error-tracking.ts` | 🟨 | `error-tracking.ts:21` `const ERROR_BUFFER: ErrorReport[] = []` / `:22` `MAX_BUFFER = 20`; `:29` `sendToLog` só faz `console.error`; cabeçalho `:3` "can be extended to forward to a logging endpoint" | `main.tsx`, `ErrorBoundary.tsx`, `ObservabilityDashboard.tsx`, `ErrorsTab.tsx`, `useContacts.ts` | nenhuma (in-memory) | Sem persistência: buffer de 20 itens morre no reload; o dashboard de erros só vê a sessão atual |
| `src/lib/web-vitals.ts` | 🟨 | `web-vitals.ts:37` `getWebVitals()`, `:53/:76/:98/:149` `new PerformanceObserver` manual; sem `supabase`/`localStorage` | `main.tsx`, `hooks/useWebVitals.ts`, `components/observability/VitalsTab.tsx` | nenhuma (in-memory) | Duplicado por `hooks/telemetry/useTelemetry.ts` — ver "Refactors abandonados" |
| `src/lib/safe-date.ts` | ✅ | `safe-date.ts:4` `toValidDate()` guarda `null/undefined/""` | 100 arquivos de produção | — | — |
| `src/lib/safe-number.ts` | ✅ | `safe-number.ts:2-6` doc; `safeParseInt`/`safeToFixed` usados em `holdReminderSounds.ts:4` e `outbound-scoring.ts:5` | 15 arquivos (`StatsCard.tsx`, `ComplianceSettings.tsx`, …) | — | — |
| `src/lib/route-prefetch.ts` | ✅ | `route-prefetch.ts:14-46` mapa de 31 rotas → `import()`; `:48` `prefetchRoute`, `:61` `prefetchHandlers` | `components/layout/AppSidebar.tsx` | — | `route-prefetch.ts:6` admite sync **manual** com `src/routes/protectedRoutes.tsx` — risco de drift |
| `src/lib/geo-countries.ts` | ✅ | `geo-countries.ts:1-23` lista estática de 61 países (dado de referência, não fictício) | `hooks/useGeoBlocking.ts` | — | — |

### Telefonia / discador

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/blf.ts` | ✅ | `blf.ts:2-5` doc; deriva lâmpada de `public.agents` + `public.call_sessions` | 7 (`BlfLampCard.tsx`, `BlfSummaryBar.tsx`, `AppSidebar.tsx`, `CommandPalette.tsx`, `useBlfBoard.ts`, `BlfBoard.tsx`, `routes/protectedRoutes.tsx`) | `agents`, `call_sessions` (lógica pura; I/O no hook) | — |
| `src/lib/call-park.ts` | ✅ | `call-park.ts:3-5` "Espelha 1:1 os CHECK constraints e os triggers `validate_park_orbit`/`validate_parked_call`" | 9 (`ParkCallDialog.tsx`, `ParkOrbitCard.tsx`, `useCallPark.ts`, `CallPark.tsx`, …) | park orbits (triggers citados) | Espelho manual de constraints SQL — drift silencioso se a migração mudar |
| `src/lib/call-queue.ts` | ✅ | `call-queue.ts:2-5` lógica pura de `public.call_queues` | 4 (`QueueCard.tsx`, `QueueFormDialog.tsx`, `useCallQueues.ts`, `CallQueues.tsx`) | `call_queues` | — |
| `src/lib/ring-group.ts` | ✅ | `ring-group.ts:2-5` "Espelha exatamente os CHECK constraints e o trigger `validate_ring_group`" | 4 (`RingGroupCard.tsx`, `RingGroupFormDialog.tsx`, `useRingGroups.ts`, `RingGroups.tsx`) | `ring_groups` | Mesmo risco de drift do espelho |
| `src/lib/queue-audio.ts` | ✅ | `queue-audio.ts:2-5` espelha CHECKs de `public.queue_audio_prompts` e trigger `validate_queue_audio_slots` | 4 (`QueueAudioLibrary.tsx`, `QueueAudioSlotSelect.tsx`, `QueueFormDialog.tsx`, `useQueueAudioPrompts.ts`) | `queue_audio_prompts` | Idem |
| `src/lib/incoming-call-alert.ts` | ✅ | `incoming-call-alert.ts:2-6` WebAudio + Notification com degradação | `useRingtoneSettings.ts`, `pages/PhoneDialer.tsx` | — | — |
| `src/lib/ringtone-presets.ts` | ✅ | `ringtone-presets.ts:4-6` tons sintetizados via WebAudio; `:` guard de `localStorage` | `RingtoneSettings.tsx`, `useRingtoneSettings.ts`, `incoming-call-alert.ts` | `localStorage` | — |
| `src/lib/holdReminderSounds.ts` | ✅ | `holdReminderSounds.ts:4` importa `safeParseInt`; helpers de `localStorage` | `hooks/useHoldReminder.ts` | `localStorage` | — |
| `src/lib/webrtc-config.ts` | ✅ | `webrtc-config.ts:5-20` STUN Google/Cloudflare + TURN opcional via `VITE_TURN_*` | `components/calls/WebRTCCall.tsx` | envs `VITE_TURN_URL/USER/CRED` | Sem TURN configurado, chamadas atrás de NAT simétrico falham (degradação silenciosa) |
| `src/lib/device-identity.ts` | ✅ | `device-identity.ts:3-5` "rótulo cosmético, não identificador de segurança" | 8 (`DeviceNameSetting.tsx`, `useDeviceLabel.ts`, `useDialerFavorites.ts`, …) | `localStorage` | — |
| `src/lib/dialer-favorite-tags.ts` | ✅ | `dialer-favorite-tags.ts:4-5` replica `char_length(btrim(tag)) BETWEEN 1 AND 24` | 6 (`FavoriteTagFilter.tsx`, `FavoriteTagMenu.tsx`, `useDialerFavorites.ts`, `dialer-filter-storage.ts`, …) | tabela de favoritos (CHECK espelhado) | — |
| `src/lib/dialer-favorites-order.ts` | ✅ | `dialer-favorites-order.ts:2-6` ordenação pura p/ PBT | `hooks/useDialerFavorites.ts` | — | — |
| `src/lib/dialer-filter-storage.ts` | ✅ | `dialer-filter-storage.ts:3-5` `Storage` injetável; guard de quota | `hooks/usePersistedTagFilter.ts` | `localStorage` | — |
| `src/lib/favorite-sync-labels.ts` | ✅ | `favorite-sync-labels.ts:2-5` grava só últimos dígitos do telefone | `hooks/useDialerFavorites.ts` | `localStorage` | — |
| `src/lib/sync-history.ts` | ✅ | `sync-history.ts:2-5` histórico local escopado por usuário (hot desking) | `SyncHistoryPanel.tsx`, `useSyncHistory.ts` | `localStorage` | — |
| `src/lib/phone-normalization.ts` | ✅ | `phone-normalization.ts:2-3` normalização BR/internacional | `hooks/useContacts.ts`, `lib/validation/contact-schema.ts` | — | — |
| `src/lib/outbound-scoring.ts` | ✅ | `outbound-scoring.ts:2-3`; `:5` usa `safeToFixed` | `hooks/useCallScoring.ts`, `pages/OutboundCompliance.tsx` | — | — |
| `src/lib/health-score.ts` | ✅ | `health-score.ts:29-39` pesos somando 100; `:41` `healthTier` | `hooks/useExtensionsOverview.ts` | — | `health-score.ts:2` diz "extraído de useExtensionsOverview" — extração concluída e adotada |

### Voz / IA / assistente

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/agent-assist-utils.ts` | ✅ | `agent-assist-utils.ts:2-3` utilitários puros de Agent Assist | 4 (`ActiveCallBar.tsx`, `NextBestActionPanel.tsx`, `AgentAssistDashboardCard.tsx`, `pages/AgentAssist.tsx`) | — | — |
| `src/lib/language-detection.ts` | ✅ | `language-detection.ts:2-3` heurística caracteres+stopwords, 8 idiomas (`:5`) | 5 (`MultilingualDashboardCard.tsx`, `LiveTranslationPanel.tsx`, `useCulturalHints.ts`, `useLiveTranslation.ts`, `TranslationCenter.tsx`) | — | `language-detection.ts:3` admite "não substitui um modelo" — precisão limitada por design |
| `src/lib/voice-biometrics.ts` | ✅ | `voice-biometrics.ts:2-3` features espectrais via `AnalyserNode`; `:122` `VOICE_VECTOR_DIM` fixo 64 | `hooks/useVoiceBiometrics.ts` | — | Sem ML: `voice-biometrics.ts:2` "Sem ML pesado" — capacidade de discriminação não verificada aqui |
| `src/lib/voice-preferences.ts` | ✅ | `voice-preferences.ts:2-5` lógica pura p/ PBT | 4 (`VoicePreferencesPanel.tsx`, `VoiceAssistantDialog.tsx`, `useVoicePreferences.ts`, `voice-speech.ts`) | perfil + `localStorage` | — |
| `src/lib/voice-speech.ts` | ✅ | `voice-speech.ts:2-4` wrapper defensivo sobre Web Speech Synthesis | 3 (`VoicePreferencesPanel.tsx`, `VoiceAssistantDialog.tsx`, `useVoicePreferences.ts`) | — | — |
| `src/lib/voice-command-history.ts` | ✅ | `voice-command-history.ts:2-6` sanitização + degradação sem `localStorage` | `useVoicePreferences.ts`, `voice-preferences.ts` | `localStorage` | — |
| `src/lib/elevenlabs-stub.ts` | 🟨 | `elevenlabs-stub.ts:1` "Stub for @elevenlabs/react - provides a mock useConversation hook"; `:12` `status: 'disconnected' as const`; `:21` `setVolume: () => {}` no-op; `@elevenlabs/react` **ausente do `package.json`** | `components/calls/UnifiedSoftphone.tsx` | — | Retorno constante. O softphone unificado nunca conecta ao ElevenLabs; só emite `logger.warn` (`:15`) |

### VoIP / rede / Bitrix

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/voipProactiveSnapshot.ts` | ✅ | `voipProactiveSnapshot.ts:1-3` compara críticas atuais vs. vistas; `:4` `toast` (sonner) | `RecommendationInsightsCard.tsx`, `pages/NetworkDiagnostics.tsx` | `localStorage` | — |
| `src/lib/voipRecommendationCoaching.ts` | ✅ | `voipRecommendationCoaching.ts:2-8` fluxo de verificação 2h; lê `.from('call_quality_metrics')` | `components/network/VoipRecommendationsPanel.tsx` | `call_quality_metrics` (migração `20260417164448_…sql`) | Fila só em `localStorage` — verificação perdida se o agente trocar de estação |
| `src/lib/bitrix/circuit-breaker.ts` | ✅ | `circuit-breaker.ts:2-5` estados closed/open/half-open, espelha `resilientFetch` do servidor | `hooks/useBitrix.ts` | edge `bitrix-api` (existe em `supabase/functions/bitrix-api`) | Espelho client-side do padrão do servidor — estados não são compartilhados entre abas |
| `src/lib/bitrix/sync-log.ts` | ✅ | `sync-log.ts:1-4`; grava em `.from('crm_sync_queue')` | `BitrixSyncStatus.tsx`, `useBitrix.ts` | `crm_sync_queue` (migração `20260507220616_…sql`) | — |

### Security Alerts (webhook / export / presets)

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/security-alerts-webhook.ts` | ✅ | `security-alerts-webhook.ts:129-136` HMAC-SHA256 via `crypto.subtle`; `:238` `X-Lovable-Signature: sha256=…`; `:342` backoff com jitter `Math.random()` (uso legítimo) | 6 (`WebhookConfigDialog.tsx`, `useAlertsExport.ts`, `useTestWebhook.ts`, `useWebhookConfig.ts`, `…-queue.ts`, `…-validation.ts`) | `localStorage` (`:2` "não envolve backend") | `:242` engole falha de HMAC e **envia sem assinatura** — degradação silenciosa de segurança |
| `src/lib/security-alerts-webhook-queue.ts` | ✅ | `…-queue.ts:1-3` fila local, reenvio ao voltar online; `:88` id `${Date.now()}-${Math.random()…}` (legítimo) | `useAlertsExport.ts`, `useWebhookQueue.ts` | `localStorage` | — |
| `src/lib/security-alerts-webhook-history.ts` | ✅ | `…-history.ts:1-5` trilha por tentativa com `request_id`; `:85` id gerado | 7 (`WebhookConfigDialog.tsx`, `WebhookHistoryEntryRow.tsx`, `useWebhookHistory.ts`, …) | `localStorage` | Trilha de auditoria vive **só no navegador** — não auditável centralmente |
| `src/lib/security-alerts-webhook-validation.ts` | ✅ | `…-validation.ts:2-6` erros bloqueantes + avisos | `WebhookConfigDialog.tsx`, `useWebhookConfig.ts` | — | — |
| `src/lib/security-alerts-presets.ts` | ✅ | `…-presets.ts:2-5` "Não usa Supabase — offline-first"; `:66` id gerado | 4 (`AlertsFilterBar.tsx`, `PresetsMenu.tsx`, `useAlertPresets.ts`, `pages/admin/SecurityAlerts.tsx`) | `localStorage` | Presets não sincronizam entre dispositivos (decisão documentada) |
| `src/lib/security-alerts-export.ts` | ✅ | `…-export.ts:1-5` `papaparse` + `jsPDF` + `jspdf-autotable` + `date-fns` + `safeFormatDate` | `hooks/useAlertsExport.ts` | — | — |
| `src/lib/security-report-data.ts` | 🟨 | `security-report-data.ts:20` afirma **"22 tabelas com RLS habilitado"**; contagem real nas migrações: **160** tabelas com `ENABLE ROW LEVEL SECURITY` | `pages/SecurityReport.tsx` | — | Dado **hardcoded e desatualizado** exibido como status do sistema — ver "Achados graves" |

### Admin / webhook health

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/webhook-health-utils.ts` | ✅ | `webhook-health-utils.ts:1-3` `SPARK_HOURS=24`, `AUTO_REFRESH_MS=30_000` | 5 (`EndpointList.tsx`, `EndpointsToolbar.tsx`, `HealthHeatmap.tsx`, `useWebhookHealthData.ts`, `pages/admin/WebhookHealth.tsx`) | — | — |

### WebAuthn / Export / Validação

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/webauthn/webauthn-utils.ts` | ✅ | `webauthn-utils.ts:103` `navigator.credentials.create`, `:141` `navigator.credentials.get` — API nativa real, não stub | `hooks/useWebAuthn.ts`, `pages/Login.tsx` | — | — |
| `src/lib/export/index.ts` | ✅ | `export/index.ts:14` `exportToCSV`, `:44` `exportToJSON`, `:53` `exportToHTML` | `components/network/ExecutiveReportExport.tsx:5`, `hooks/useExtensionsAdmin.ts:6` | — | Único barril de `src/lib/*/index.ts` realmente adotado |
| `src/lib/validation/contact-schema.ts` | ✅ | `contact-schema.ts:2-4` "Schema Zod único"; `:18` `contactInputSchema` | `CreateContactDialog.tsx`, `hooks/useContacts.ts` | — | Conflita com `createContactSchema` — ver "Refactors abandonados" |
| `src/lib/validation/schemas.ts` | 🟦 | `schemas.ts:2-3` "Single source of truth"; 20 schemas (`:9`–`:190`). Importadores: **só testes** (`__tests__/zod-schemas.property.test.ts:10`, `__tests__/validation-schemas.test.ts`) | 0 (só testes) | — | Nunca ligado à UI; a UI usa `contact-schema.ts` |
| `src/lib/validation/index.ts` | 🟦 | 1 linha: `export * from './schemas'`. Zero importadores (grep ancorado em `@/lib/validation`) | 0 | — | Barril órfão |

### Bloco `src/lib/security/*` — escrito, testado, **nunca ligado à aplicação**

Verificação: `grep -rn "['\"](@/lib/security\|…/security)['\"]" src supabase` → **zero resultados**. E cada submódulo, grepado por `security/<nome>`, só aparece em `src/lib/security/index.ts` e em arquivos `__tests__`.

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `security/index.ts` | 🟦 | `security/index.ts:1-3` "Security utilities barrel export"; reexporta 16 módulos | **0** | — | Barril nunca importado |
| `security/api-key-rotation.ts` | 🟦 | `api-key-rotation.ts:2-3` | 0 (só `security-advanced.test.ts`) | — | Não plugado |
| `security/content-security-policy.ts` | 🟦 | `content-security-policy.ts:2` | 0 (só `security-infrastructure.test.ts`) | — | CSP nunca aplicado ao `index.html`/headers |
| `security/cors-config.ts` | 🟦 | `cors-config.ts:2` "CORS configuration utility **for frontend reference**" | 0 (só teste) | — | Auto-declarado como referência; edge functions têm CORS próprio |
| `security/csrf-token.ts` | 🟦 | `csrf-token.ts:3` `CSRF_STORAGE_KEY`; usa `sessionStorage` | 0 (só testes) | `sessionStorage` | Token gerado mas nenhum request o envia |
| `security/encryption.ts` | 🟦 | `encryption.ts:2` Web Crypto | 0 (só testes) | — | Nada é criptografado em produção |
| `security/helmet-config.ts` | 🟦 | `helmet-config.ts:2` "Helmet-like for SPAs" | 0 (só testes) | — | Headers nunca emitidos (SPA estática) |
| `security/hsts-headers.ts` | 🟦 | `hsts-headers.ts:2` | 0 (só testes) | — | HSTS depende do host, não do bundle |
| `security/https-enforcer.ts` | 🟦 | `https-enforcer.ts:2-4` `shouldEnforceHTTPS()` | 0 (só testes) | — | Nunca chamado no bootstrap (`main.tsx` não importa) |
| `security/input-sanitizer.ts` | 🟦 | `input-sanitizer.ts:2` | 0 (só testes) | — | Entrada de usuário não passa por ele |
| `security/jwt-handler.ts` | 🟦 | `jwt-handler.ts:2-3` "NOTE: Never validate JWTs client-side" | 0 (só testes) | — | — |
| `security/penetration-test-reporter.ts` | 🟦 | `penetration-test-reporter.ts:2-3` | 0 (só teste) | — | Gera relatório que nenhuma tela consome |
| `security/rate-limiter.ts` | 🟦 | `rate-limiter.ts:2` sliding window client-side | 0 (só testes) | — | Nenhum caminho de chamada é limitado |
| `security/secrets-scanner.ts` | 🟦 | `secrets-scanner.ts:2`, `:4` padrão AWS `AKIA…` | 0 (só testes) | — | Não roda em CI nem em runtime |
| `security/security-headers-validator.ts` | 🟦 | `security-headers-validator.ts:2` | 0 (só testes) | — | — |
| `security/sql-sanitizer.ts` | 🟦 | `sql-sanitizer.ts:2-3` "Always prefer parameterized queries" | 0 (só testes) | — | — |
| `security/xss-prevention.ts` | 🟦 | `xss-prevention.ts:2-3` `DANGEROUS_PROTOCOLS` | 0 (só testes) | — | — |

### Barris `audit / mfa / notifications / password / session` — escritos, testados, não adotados

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/audit/index.ts` | 🟦 | `audit/index.ts:31` `supabase.rpc("log_audit_event", …)`; `:51` `createAuditLogger`. Importadores reais: só `src/lib/__tests__/export-audit-notifications.test.ts` | 0 | RPC `log_audit_event` (migrações `20260507204618_…`, `20260522144442_…`) | Produção usa `hooks/useAuditLog.ts`, não este módulo |
| `src/lib/mfa/index.ts` | 🟦 | `mfa/index.ts:16` `.from("user_mfa_settings")`; `:33` `generateBackupCodes`. Importadores: `edge-cases-stress.test.ts`, `utilities-comprehensive.test.ts` | 0 | `user_mfa_settings` (migração `20251231115936_…sql`) | Duplicado por `hooks/useMFA.ts:55` — ver "Refactors abandonados" |
| `src/lib/session/index.ts` | 🟦 | `session/index.ts:20/42/54` `.from("active_sessions")`. Importador: só `utilities-comprehensive.test.ts` | 0 | `active_sessions` (migração `20251231115936_…sql`) | Duplicado por `hooks/useSessionManager.ts:74,104,134,145,168` |
| `src/lib/notifications/index.ts` | 🟦 | `notifications/index.ts:26` `supabase.functions.invoke('send-notification')`; `:56` `sendLocalNotification`; `:82` `validateNotification`. Importadores: 3 arquivos de teste | 0 | edge `send-notification` (existe em `supabase/functions/`) | Produção usa `hooks/useNotifications.ts:51-52` (`notifications`, `notification_preferences`) |
| `src/lib/password/index.ts` | 🟦 | `password/index.ts:11` `checkPasswordStrength`, `:51` `generateSecurePassword`. Importadores: `edge-cases-stress.test.ts`, `utilities-comprehensive.test.ts` | 0 | — | `components/auth/PasswordStrength.tsx` **não** importa `checkPasswordStrength` (grep sem resultado) |

### Módulos mortos (zero consumidores, inclusive testes à parte)

| Módulo | Classificação | Evidência | Quem importa | Tabela/edge fn | O que falta |
|---|---|---|---|---|---|
| `src/lib/dialer/predictive-pace.ts` | ⬛ | `predictive-pace.ts:2-3` "**Port TS puro** da função SQL `calculate_predictive_pace` … Deve espelhar 1:1 a lógica em produção". SQL real em `supabase/migrations/20260722213602_011fe9c6-e570-4180-be7a-d9a276c66f2e.sql:11` | 0 produção, 1 teste | RPC `calculate_predictive_pace` (+ `apply_predictive_pacing`, mesmo arquivo `:98`) | Código-espelho: testar a cópia TS **não** valida a função SQL que roda de fato |
| `src/lib/talkRatio.ts` | ⬛ | `talkRatio.ts:1` "Pure helper **extracted from edge function** `analyze-talk-ratio` for unit testability"; `:23` `computeTalkRatio`. Edge real existe em `supabase/functions/analyze-talk-ratio` | 0 produção, 1 teste | edge `analyze-talk-ratio` | Idem: espelho de uma edge function; a edge não importa este arquivo |
| `src/lib/meeting-summary-utils.ts` | ⬛ | `meeting-summary-utils.ts:6/17/30` `isValidActionItem`, `isValidParticipantSentiment`, `serializeSummaryAsText`. Grep dos 3 nomes em `src/` retorna **apenas** o próprio arquivo e `__tests__/meeting-summary-utils.test.ts` | 0 produção, 1 teste | — | `hooks/useMeetingSummary.ts:49` tem seu próprio `parse()` sem validação de `priority`/`sentiment` |

---

## Auditoria de testes

14 arquivos de teste no lote (1.238 linhas). Resultado agregado:

- **`.skip` / `.only` / `.todo`: NENHUM** (grep `\.(skip|todo|only)\(` sobre os 14 arquivos → zero).
- **Alvo inexistente: NENHUM.** Todos os caminhos importados existem (verificados um a um; ex.: `audit/__tests__/index.coverage.test.ts:2` → `../index` = `src/lib/audit/index.ts` ✓).
- **Testes-espelho (não importam o alvo): NENHUM.** Todos importam o módulo real. Atenção especial a `src/lib/__tests__/webrtc-config.test.ts`, cujo `grep` de topo não mostra import: ele usa **import dinâmico** dentro de cada `it` (`webrtc-config.test.ts:20,34,50,59` → `await import("@/lib/webrtc-config")`), necessário por causa do `vi.resetModules()` na linha 10. É legítimo.

### Problemas encontrados

| Arquivo | Problema | Evidência |
|---|---|---|
| `src/lib/export/__tests__/index.coverage.test.ts` | **Asserções não verificam o que o nome promete.** O teste `'exportToCSV downloads with BOM and formatting'` não inspeciona o conteúdo do Blob: só checa `createdUrl === true` e `clickSpy` chamado. Idem `'exportToHTML escapes and downloads'` — o nome promete escaping, a asserção só confere o clique. BOM, o `format: (v) => 'R$'+v` (`:21`), o escaping de `Ana "A"` (`:25`) e de `Title <x> & "y"` (`:46`) **nunca são assertados** | `:29-33`, `:45-48` (4 `it`, 5 `expect`) |
| `src/lib/__tests__/webrtc-config.test.ts` | `expect(turn).toBeDefined()` é a asserção mais fraca possível para "achou o servidor TURN" — passaria com qualquer objeto. Mitigado pelas duas linhas seguintes, que checam `username`/`credential` | `:39` |
| `src/lib/security/__tests__/encryption.coverage.test.ts` | `expect(key).toBeTruthy()` — não valida algoritmo, tamanho nem `usages` da `CryptoKey` gerada | `:23` |
| `src/lib/security/__tests__/hsts-headers.coverage.test.ts` | Razão asserção/caso baixa: 9 `it` para 9 `expect` (1 asserção por caso). Mesmo padrão em `https-enforcer.coverage.test.ts` (8/8) | — |
| **Todos os `*.coverage.test.ts` de `security/`, `mfa/`, `session/`, `audit/`, `notifications/`, e `validation/__tests__/zod-schemas.property.test.ts`** | **Testam código sem consumidor de produção.** A cobertura produzida é real, mas não protege nenhum caminho executado pelo usuário | ver seção "🟦" acima |

### Pontos positivos

- `src/lib/validation/__tests__/zod-schemas.property.test.ts` é um **teste property-based sério**: `fast-check` com `numRuns` de 500–1000 e seeds fixas (`:24,34,42,52,60,68,77,90,104,116`), cobrindo aceitação **e** rejeição de cada schema. (Único porém: o alvo `schemas.ts` é código não adotado.)
- `src/lib/webauthn/__tests__/webauthn-utils.coverage.test.ts` (14 `it` / 20 `expect`) e `src/lib/__tests__/webhook-health-utils.test.ts` (10 `it` / 29 `expect`) têm boa densidade de asserção.
- `security-headers-validator.coverage.test.ts`: 4 `it` / 13 `expect` — asserções específicas.

---

## Refactors abandonados

### 1. Web Vitals — implementação manual (antiga, **ainda importada**) vs. pacote `web-vitals` (nova)

| | Antigo (ativo) | Novo (ativo) |
|---|---|---|
| Arquivo | `src/lib/web-vitals.ts` (165 linhas) | `src/hooks/telemetry/useTelemetry.ts` |
| Técnica | `new PerformanceObserver(...)` manual (`web-vitals.ts:53,76,98,149`) | `import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'` (`useTelemetry.ts:2`) |
| Persistência | **Nenhuma** — array em memória (`web-vitals.ts:37` `getWebVitals()`) | `supabase.from('performance_metrics').insert(...)` (`useTelemetry.ts:20`) |
| Importadores | `src/main.tsx`, `src/hooks/useWebVitals.ts`, `src/components/observability/VitalsTab.tsx` | `src/components/layout/AppLayout.tsx:1,26` |

**Prova:** `grep -rn "from 'web-vitals'" src` → só `useTelemetry.ts:2` e seu teste; `package.json:95` `"web-vitals": "^5.2.0"` já está instalado. As duas implementações coletam as **mesmas métricas simultaneamente** em toda sessão logada (main.tsx + AppLayout). O dashboard `/observability` (aba Vitals) lê a versão **antiga**, em memória — ou seja, mostra dados da sessão atual enquanto a tabela `performance_metrics` acumula os da versão nova. Migração iniciada e não concluída.

### 2. Schemas de contato — `createContactSchema` (schemas.ts) vs. `contactInputSchema` (contact-schema.ts)

- `src/lib/validation/schemas.ts:2-3` se declara **"Single source of truth for data shapes across frontend boundaries"** e define `createContactSchema` em `:62-72`.
- `src/lib/validation/contact-schema.ts:2-4` se declara **"Schema Zod único para criação/atualização de contatos"** e define `contactInputSchema` em `:18`.
- **Quem produção importa:** `contact-schema.ts` → `src/components/contacts/CreateContactDialog.tsx` e `src/hooks/useContacts.ts`. **`schemas.ts` → ninguém** (só `__tests__/zod-schemas.property.test.ts:10` e `__tests__/validation-schemas.test.ts`).
- Dois arquivos afirmando ser a fonte única, ambos vivos, com o mais antigo/genérico (`schemas.ts`, 206 linhas, 20 schemas) abandonado depois de escrito **e** com o teste property-based mais robusto do lote apontado para ele.

### 3. Camada `src/lib/{mfa,session,audit,notifications,password}` — extração para lib nunca adotada; hooks seguem sendo o caminho real

| Domínio | Módulo lib (0 consumidores de produção) | Implementação viva |
|---|---|---|
| MFA | `src/lib/mfa/index.ts:16` `.from("user_mfa_settings")` | `src/hooks/useMFA.ts:55` `.from('user_mfa_settings')`, `:176` `.upsert(...)` |
| Sessões | `src/lib/session/index.ts:20,42,54` `.from("active_sessions")` | `src/hooks/useSessionManager.ts:74,104,134,145,168` `.from('active_sessions')` |
| Notificações | `src/lib/notifications/index.ts:26` `functions.invoke('send-notification')` | `src/hooks/useNotifications.ts:51-52` `.from('notifications')` / `.from('notification_preferences')` |
| Auditoria | `src/lib/audit/index.ts:31` `rpc("log_audit_event")` | `src/hooks/useAuditLog.ts` |
| Senha | `src/lib/password/index.ts:11` `checkPasswordStrength` | `src/components/auth/PasswordStrength.tsx` (implementação própria — grep de `checkPasswordStrength` no componente: **zero**) |

Mesma tabela/edge function tocada dos dois lados; a versão em `lib/` tem suíte `*.coverage.test.ts` dedicada e **nenhum** consumidor de UI. Padrão: extração feita "para testar", o código de produção nunca foi migrado.

### 4. Espelhos de lógica servidor→cliente (variante do mesmo padrão)

`src/lib/dialer/predictive-pace.ts:2-3` e `src/lib/talkRatio.ts:1` declaram explicitamente ser cópias TS de, respectivamente, a função SQL `calculate_predictive_pace` (`supabase/migrations/20260722213602_…sql:11`) e a edge function `analyze-talk-ratio` (`supabase/functions/analyze-talk-ratio`). Nenhum dos dois lados importa o outro — a cópia TS só existe para o teste. Qualquer alteração no SQL/edge não quebra nenhum teste.

O mesmo padrão, porém **adotado corretamente**, aparece em `call-park.ts:3`, `ring-group.ts:4`, `queue-audio.ts:3-5` e `dialer-favorite-tags.ts:4` — ali o espelho é usado pela UI para pré-validar antes de escrever, o que justifica a duplicação (mas mantém o risco de drift em relação às migrações).

---

## Achados graves

1. **`src/lib/security/` inteiro (17 arquivos, ~700 linhas) é código não executado em produção.** Nenhum arquivo fora de `src/lib/security/` e de `__tests__` importa o barril ou qualquer submódulo (`grep` ancorado retornou vazio para `@/lib/security` e para cada `security/<nome>`). Consequência concreta: CSP (`content-security-policy.ts`), HSTS (`hsts-headers.ts`), redirect HTTPS (`https-enforcer.ts:2-4`), rate limit (`rate-limiter.ts`), sanitização de input (`input-sanitizer.ts`), XSS (`xss-prevention.ts`) e CSRF (`csrf-token.ts`) **existem como biblioteca testada, mas não estão ativos**. Os `*.coverage.test.ts` dão cobertura verde para proteções que não protegem nada.

2. **`src/lib/security-report-data.ts:20` publica número desatualizado como status de segurança.** A página `/security-report` (`src/pages/SecurityReport.tsx`) exibe `'22 tabelas com RLS habilitado'` (`security-report-data.ts:20`), com `status: 'implemented'` (`:18`) e o texto "Todas as tabelas possuem políticas RLS ativas" (`:19`). A contagem real de `ALTER TABLE … ENABLE ROW LEVEL SECURITY` nas migrações é **160 tabelas distintas** — 7x o valor exibido. Todo o arquivo (`:15-52` features, `:54-60+` decisões) é um array literal hardcoded, sem nenhuma leitura do banco: é um relatório de segurança que não observa o sistema que descreve.

3. **`src/lib/logger.ts:4` promete mascaramento de PII que não existe.** `maskSensitive` (`:20-29`) só redige chaves que casam com `password|token|secret|authorization|cookie|session|key|credential` (`:18`). Não há regra para nome, e-mail, telefone, CPF ou endereço. Além disso: (a) `:22` devolve qualquer valor não-objeto sem tratamento, então `logger.info('x', userEmail)` loga o e-mail cru; (b) `:68` concatena `entry.message` sem passar por máscara alguma. Com 182 arquivos de produção usando o logger, a garantia documentada não se sustenta.

4. **`src/lib/security-alerts-webhook.ts:242` degrada segurança em silêncio.** O bloco `catch` da assinatura HMAC tem apenas o comentário `/* se HMAC falhar, envia sem assinatura */` — o POST segue (`:257`) sem o header `X-Lovable-Signature` (`:238`) e sem nenhum log ou aviso ao usuário. O destinatário do webhook não tem como distinguir "remetente não configurou segredo" de "assinatura falhou".

5. **`src/lib/elevenlabs-stub.ts` é um stub de retorno constante em caminho de produção.** `:12` `status: 'disconnected' as const`, `:21` `setVolume` no-op; a dependência `@elevenlabs/react` **não está no `package.json`**. É importado por `src/components/calls/UnifiedSoftphone.tsx` — ou seja, a funcionalidade de conversação por voz do softphone unificado nunca funciona; `startSession` (`:14-17`) dispara `onConnect` como se tivesse conectado, mascarando a falha para o resto da UI.

6. **Toda a trilha de auditoria do webhook de exportação vive em `localStorage`.** `security-alerts-webhook-history.ts:1-5` descreve "trilha de auditoria detalhada por envio"; a persistência é `window.localStorage` (`:` load/save). Limpar o navegador apaga a auditoria; nada é auditável centralmente e a trilha não sobrevive à troca de estação (hot desking, cenário que o próprio `sync-history.ts:3-5` reconhece existir).

7. **Observabilidade de erros sem persistência.** `error-tracking.ts:21-22` mantém `MAX_BUFFER = 20` em memória e `sendToLog` (`:29`) só chama `console.error`. `ObservabilityDashboard.tsx`/`ErrorsTab.tsx` consomem esse buffer: erros anteriores ao carregamento da aba, ou de outras sessões/usuários, são invisíveis. O cabeçalho (`:3`) reconhece: "can be extended to forward to a logging endpoint".

---

## Integrações de terceiros observadas

| Integração | Onde | Evidência | Situação |
|---|---|---|---|
| **Supabase** (`@/integrations/supabase/client`) | `audit/index.ts:31` (RPC `log_audit_event`), `mfa/index.ts:16` (`user_mfa_settings`), `session/index.ts:20,42,54` (`active_sessions`), `notifications/index.ts:26` (edge `send-notification`), `bitrix/sync-log.ts` (`crm_sync_queue`), `voipRecommendationCoaching.ts` (`call_quality_metrics`) | tabelas/RPC/edge todos existentes nas migrações e em `supabase/functions/` | Ativo apenas em `bitrix/sync-log.ts` e `voipRecommendationCoaching.ts`; os demais estão no bloco 🟦 |
| **Bitrix24** (via edge `bitrix-api`) | `bitrix/circuit-breaker.ts:2-5`, `bitrix/sync-log.ts` | `supabase/functions/bitrix-api` existe | ✅ Ativo (`hooks/useBitrix.ts`) |
| **ElevenLabs** (`@elevenlabs/react`) | `elevenlabs-stub.ts:1,3,15` | **Ausente do `package.json`** | ⬛ Somente stub |
| **papaparse** `^5.5.3` | `security-alerts-export.ts:1` | `package.json:75` (+ `@types/papaparse` `:102`) | ✅ Ativo |
| **jsPDF** `^4.2.1` + **jspdf-autotable** `^5.0.7` | `security-alerts-export.ts:2-3` | `package.json:70-71` | ✅ Ativo |
| **date-fns** (+ locale `ptBR`) | `safe-date.ts:1-2`, `security-alerts-export.ts:4` | — | ✅ Ativo |
| **zod** `^3.22.4` | `validation/schemas.ts:5`, `validation/contact-schema.ts` | `package.json:97` | ✅ `contact-schema` ativo; 🟦 `schemas.ts` |
| **clsx + tailwind-merge** | `utils.ts:1-2` | — | ✅ Ativo (149 importadores) |
| **sonner** (toast) `^2.0.7` | `voipProactiveSnapshot.ts:4` | `package.json:87` | ✅ Ativo |
| **web-vitals** `^5.2.0` | **não** importado por `lib/web-vitals.ts`; só por `hooks/telemetry/useTelemetry.ts:2` | `package.json:95` | ⚠️ Duplicidade (refactor #1) |
| **fast-check** `^4.7.0` | `validation/__tests__/zod-schemas.property.test.ts:2` | `package.json:65` | ✅ Ativo (testes) |
| **STUN Google / Cloudflare** | `webrtc-config.ts:7-8` | — | ✅ Ativo |
| **TURN externo** | `webrtc-config.ts:11-16` via `VITE_TURN_URL/USER/CRED` | — | 🟨 Opcional; sem envs, não há relay |
| **Webhook externo genérico** | `security-alerts-webhook.ts:257` `fetch(url, {method:'POST'})` com HMAC-SHA256 (`:129-136`) e headers `X-Lovable-Signature`/`X-Lovable-Request-Id` (`:238,232`) | — | ✅ Ativo (com a ressalva do achado #4) |
| **APIs nativas do navegador** | WebAuthn (`webauthn-utils.ts:103,141`), Web Crypto (`security/encryption.ts:2`, `security-alerts-webhook.ts:129`), WebAudio (`voice-biometrics.ts:2`, `ringtone-presets.ts:4`), Speech Synthesis (`voice-speech.ts:2`), Notification (`incoming-call-alert.ts:2`), PerformanceObserver (`web-vitals.ts:53`) | — | ✅ Ativas (exceto `security/encryption.ts`, 🟦) |

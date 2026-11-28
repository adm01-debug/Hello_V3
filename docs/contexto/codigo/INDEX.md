# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado em `docs/contexto/codigo/` na branch `contexto` (gerada, nunca abra PR dela) a cada push em `main` e a cada 10 minutos pelo workflow `contexto.yml`; índice único das três fontes em `docs/contexto/00-INDEX.md`. Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `ff1ffe61ce6849f0eab44206e923cf1c57c427d2` (2026-11-28T12:36:00-03:00).

## Como usar (leia antes de planejar ou executar qualquer tarefa)
1. **Tela/rota/menu** → `rotas.json` (url/vista/menu → arquivo → hooks → tabelas → edges; `rotas_http_backend` para APIs) e `modulos.json` (módulo inteiro + dependências entre módulos).
2. **Hook/serviço/lógica** → `hooks.json`, `logica.json` (quem usa, o que toca, se tem teste).
3. **Edge function / serverless** → `edge-functions.json` (verify_jwt, tabelas, env, quem chama, órfãs).
4. **Banco** → `banco.json` (colunas, RLS, policies, índices, FKs, triggers, cron jobs, buckets, drift migration×types, uso no código) — visão do código; para o banco vivo use o MCP.
5. **Antes de criar arquivo** → `convencoes.json` (onde ficam as coisas, nomenclatura, alias), `componentes.json` (nomes duplicados, órfãos), `grafo.json` (hubs, ciclos de import) e `grafo-graphify.json` (grafo por AST: comunidades, símbolos mais chamados, comunidade de cada arquivo).
6. **CI/scripts/deploy/env/integrações/permissões/flags** → `ferramentas.json` e `scripts.json`.
7. **Antes de abrir PR** → `testes.json` (o que tem e não tem teste, onde os testes ficam), `baseline.json` (alertas, TODOs, hotspots, últimos commits).
Os JSONs são grandes: filtre com `grep`/`jq` pelo caminho/arquivo/tabela da sua tarefa; não carregue tudo.

## Stack
- linguagens: TypeScript (1359), SQL (309), Markdown (122), JavaScript (31), JSON (16), Python (5), YAML (5), Shell (2)
- linguagem_principal: TypeScript
- framework: React
- backend_http: n/d
- bundler: Vite
- roteador: react-router
- banco: Supabase
- testes: vitest, playwright
- ui: tailwind, radix/shadcn
- estado: react-query
- gerenciador_pacotes: bun
- node: >=20.0.0
- python: n/d
- deploy: vercel
- monorepo: n/d
- pastas_fonte: src

## Números
| item | qtd |
|---|---|
| arquivos_total | 1863 |
| arquivos_codigo | 1394 |
| linhas_codigo | 186399 |
| rotas | 108 |
| rotas_http_backend | 11 |
| vistas_por_id | 0 |
| itens_menu | 98 |
| modulos | 83 |
| componentes | 456 |
| hooks | 203 |
| edge_functions | 99 |
| tabelas | 172 |
| migrations | 273 |
| cron_jobs | 13 |
| testes | 468 |
| workflows | 5 |
| scripts | 36 |
| docs_md | 122 |

## Onde ficam as coisas
- telas: src/pages (107), src/routes (1)
- componentes: src/components (320), src/pages (129), src/contexts (5)
- hooks: src/hooks (183), src/components (12), src/contexts (5)
- servicos_logica: src/lib (92), src/integrations (3), scripts/regras_negocio (2)
- testes: co-localizado (__tests__) (408), tests/ (9), e2e/ (7)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/inventario (7), scripts/regras_negocio (3), scripts/ai-context (2)
- docs: (raiz) (5), docs (3), .github (1)
- nomenclatura: {"componentes":"PascalCase (88%)","hooks":"use + PascalCase","servicos":"kebab-case (64%)","edge_functions":"kebab-case (100%)","tabelas":"snake_case (90%)"}
- instruções para agentes no repo: AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| components/admin | 0 | 0 | 24 | 16 | 2 | 11 |
| components/ai | 0 | 0 | 7 | 1 | 2 | 1 |
| components/auth | 0 | 0 | 8 | 13 | 2 | 6 |
| components/calls | 0 | 0 | 23 | 43 | 15 | 27 |
| components/compliance | 0 | 0 | 19 | 3 | 0 | 7 |
| components/contacts | 0 | 0 | 14 | 6 | 3 | 7 |
| components/conversation-intelligence | 0 | 0 | 7 | 5 | 2 | 5 |
| components/dashboard | 0 | 0 | 12 | 12 | 1 | 5 |
| components/dialer | 0 | 0 | 16 | 18 | 1 | 11 |
| components/executive | 0 | 0 | 18 | 29 | 6 | 22 |
| components/gamification | 0 | 0 | 7 | 3 | 0 | 5 |
| components/layout | 0 | 0 | 9 | 238 | 68 | 156 |
| components/network | 0 | 0 | 17 | 16 | 12 | 3 |
| components/observability | 0 | 0 | 6 | 0 | 0 | 0 |
| components/queue-alerts | 0 | 0 | 8 | 1 | 0 | 1 |
| components/ranking | 0 | 0 | 6 | 1 | 0 | 5 |
| components/security-alerts | 0 | 0 | 11 | 0 | 0 | 0 |
| components/settings | 0 | 0 | 6 | 9 | 1 | 7 |
| components/supervisor | 0 | 0 | 11 | 5 | 1 | 7 |
| components/ui | 0 | 0 | 56 | 7 | 0 | 0 |
| components/voice | 0 | 0 | 7 | 4 | 2 | 1 |
| contexts | 0 | 0 | 5 | 15 | 3 | 11 |
| hooks | 0 | 0 | 177 | 220 | 58 | 133 |
| hooks/auth | 0 | 0 | 5 | 5 | 0 | 2 |
| lib | 0 | 0 | 54 | 123 | 30 | 78 |
| lib/security | 0 | 0 | 17 | 0 | 0 | 0 |
| lib/validation | 0 | 0 | 5 | 7 | 1 | 0 |
| pages | 88 | 94 | 94 | 202 | 68 | 146 |
| pages/admin | 10 | 10 | 18 | 40 | 4 | 20 |
| pages/call-analytics | 0 | 0 | 7 | 1 | 0 | 2 |
| pages/marketing | 0 | 3 | 4 | 0 | 0 | 0 |
| pages/roles | 0 | 0 | 6 | 1 | 0 | 3 |
| routes | 0 | 1 | 3 | 225 | 70 | 154 |

## Rotas (url → arquivo)
- `/` [tela] → src/pages/PhoneDialer.tsx
- `/*` [tela] → src/pages/NotFound.tsx
- `/accounts` [tela] → src/pages/Accounts.tsx
- `/admin/client-errors` [tela] → src/pages/admin/ClientErrors.tsx
- `/admin/data-export` [tela] → src/pages/admin/DataExport.tsx
- `/admin/database-health` [tela] → src/pages/admin/DatabaseHealth.tsx
- `/admin/extensions` [tela] → src/pages/admin/ExtensionsAdmin.tsx
- `/admin/security-alerts` [tela] → src/pages/admin/SecurityAlerts.tsx
- `/admin/security-audit` [tela] → src/pages/admin/SecurityAuditDashboard.tsx
- `/admin/slo` [tela] → src/pages/admin/SloDashboard.tsx
- `/admin/voice-quality` [tela] → src/pages/admin/VoiceQuality.tsx
- `/admin/voip-trunks` [tela] → src/pages/admin/VoipTrunksAdmin.tsx
- `/admin/webhook-health` [tela] → src/pages/admin/WebhookHealth.tsx
- `/agent-assist` [tela] → src/pages/AgentAssist.tsx
- `/ai` [tela] → src/pages/AIAssistant.tsx
- `/alert-history` [tela] → src/pages/AlertHistory.tsx
- `/alerts` [tela] → src/pages/Alerts.tsx
- `/analytics` [tela] → src/pages/CallAnalytics.tsx
- `/audit-logs` [tela] → src/pages/AuditLogs.tsx
- `/battle-cards` [tela] → src/pages/BattleCards.tsx
- `/blf` [tela] → src/pages/BlfBoard.tsx
- `/blocked-access-logs` [tela] → src/pages/BlockedAccessLogs.tsx
- `/cadences` [tela] → src/pages/Cadences.tsx
- `/call-flow-designer` [tela] → src/pages/CallFlowDesigner.tsx
- `/call-history` [tela] → src/routes/CallHistoryAlias.tsx
- `/call-library` [tela] → src/pages/CallLibrary.tsx
- `/call-park` [tela] → src/pages/CallPark.tsx
- `/call-queues` [tela] → src/pages/CallQueues.tsx
- `/callbacks` [tela] → src/pages/Callbacks.tsx
- `/calls` [tela] → src/pages/Calls.tsx
- `/coaching` [tela] → src/pages/Coaching.tsx
- `/compliance` [tela] → src/pages/Compliance.tsx
- `/concurrency-conflicts` [tela] → src/pages/ConcurrencyConflicts.tsx
- `/contacts` [tela] → src/pages/Contacts.tsx
- `/contacts/insights` [tela] → src/pages/ContactInsights.tsx
- `/dashboard` [tela] → src/pages/Index.tsx
- `/deals` [tela] → src/pages/Deals.tsx
- `/dialer` [tela] → src/pages/Dialer.tsx
- `/dialer/predictive` [tela] → src/pages/PredictiveDialer.tsx
- `/executive` [tela] → src/pages/ExecutiveDashboard.tsx
- `/external-recordings-import` [tela] → src/pages/ExternalRecordingsImport.tsx
- `/financial-impact` [tela] → src/pages/FinancialImpact.tsx
- `/forgot-password` [tela] → src/pages/ForgotPassword.tsx
- `/gamification` [tela] → src/pages/Gamification.tsx
- `/geo-blocking` [tela] → src/pages/GeoBlocking.tsx
- `/history` [tela] → src/pages/CallHistory.tsx
- `/hold-alerts` [tela] → src/pages/HoldAlerts.tsx
- `/hold-metrics` [tela] → src/pages/HoldMetrics.tsx
- `/hold-settings` [tela] → src/pages/HoldAlertSettings.tsx
- `/hot-desking` [tela] → src/pages/HotDesking.tsx
- `/inbox` [tela] → src/pages/Inbox.tsx
- `/ip-whitelist` [tela] → src/pages/IPWhitelist.tsx
- `/knowledge` [tela] → src/pages/Knowledge.tsx
- `/landing` [tela] → src/pages/marketing/Landing.tsx
- `/ldap-sync` [tela] → src/pages/LDAPSync.tsx
- `/learning` [tela] → src/pages/Learning.tsx
- `/login` [tela] → src/pages/Login.tsx
- `/marketplace` [tela] → src/pages/Marketplace.tsx
- `/meeting-summaries` [tela] → src/pages/MeetingSummaries.tsx
- `/multi-device-ring` [tela] → src/pages/MultiDeviceRing.tsx
- `/network-diagnostics` [tela] → src/pages/NetworkDiagnostics.tsx
- `/notifications` [tela] → src/pages/NotificationCenter.tsx
- `/number-porting` [tela] → src/pages/NumberPorting.tsx
- `/observability` [tela] → src/pages/ObservabilityDashboard.tsx
- `/onboarding` [tela] → src/pages/Onboarding.tsx
- `/outbound-compliance` [tela] → src/pages/OutboundCompliance.tsx
- `/passkeys` [tela] → src/pages/Passkeys.tsx
- `/password-reset-approval` [tela] → src/pages/PasswordResetApproval.tsx
- `/permissions` [tela] → src/pages/Permissions.tsx
- `/pricing` [tela] → src/pages/marketing/Pricing.tsx
- `/qr-provisioning` [tela] → src/pages/QRProvisioning.tsx
- `/queue-dashboard` [tela] → src/pages/QueueMetricsDashboard.tsx
- `/queue-metrics-settings` [tela] → src/pages/QueueMetricsAlertSettings.tsx
- `/ranking` [tela] → src/pages/AgentRanking.tsx
- `/rate-limit` [tela] → src/pages/RateLimitDashboard.tsx
- `/recordings` [tela] → src/pages/Recordings.tsx
- `/register` [tela] → src/pages/Register.tsx
- `/renewals` [tela] → src/pages/Renewals.tsx
- `/reports` [tela] → src/pages/Reports.tsx
- `/reset-password` [tela] → src/pages/ResetPassword.tsx
- `/ring-groups` [tela] → src/pages/RingGroups.tsx
- `/roles` [tela] → src/pages/Roles.tsx
- `/routing-rules` [tela] → src/pages/RoutingRules.tsx
- `/scheduling` [tela] → src/pages/Scheduling.tsx
- `/scorecards` [tela] → src/pages/Scorecards.tsx
- `/security` [tela] → src/pages/SecurityDashboard.tsx
- `/security-monitoring` [tela] → src/pages/SecurityMonitoring.tsx
- `/security-report` [tela] → src/pages/SecurityReport.tsx
- `/sessions` [tela] → src/pages/SessionManagement.tsx
- `/settings` [tela] → src/pages/Settings.tsx
- `/shift-swap-suggestions` [tela] → src/pages/ShiftSwapSuggestions.tsx
- `/skills` [tela] → src/pages/Skills.tsx
- `/sla-policies` [tela] → src/pages/SLAPolicies.tsx
- `/sla-violations` [tela] → src/pages/SlaViolations.tsx
- `/status` [tela] → src/pages/Status.tsx
- `/success-plans` [tela] → src/pages/SuccessPlans.tsx
- `/toll-free-numbers` [tela] → src/pages/TollFreeNumbers.tsx
- `/topic-detection` [tela] → src/pages/TopicDetection.tsx
- `/trackers` [tela] → src/pages/Trackers.tsx
- `/translation-center` [tela] → src/pages/TranslationCenter.tsx
- `/two-factor-auth` [tela] → src/pages/TwoFactorAuth.tsx
- `/unauthorized` [tela] → src/pages/Unauthorized.tsx
- `/verify-email` [tela] → src/pages/VerifyEmail.tsx
- `/video-conference` [tela] → src/pages/VideoConference.tsx
- `/virtual-fax` [tela] → src/pages/VirtualFax.tsx
- `/voice-security` [tela] → src/pages/VoiceSecurity.tsx
- `/voicemail` [tela] → src/pages/Voicemail.tsx
- `/vs/3cplus` [tela] → src/pages/marketing/VsThreeCPlus.tsx

## Rotas HTTP de backend
- `GET /{t}` → scripts/ai-context/cenarios.mjs
- `GET /a` → scripts/ai-context/cenarios.mjs
- `GET /a` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `DELETE /c` → scripts/ai-context/cenarios.mjs
- `PUT /d` → scripts/ai-context/cenarios.mjs
- `GET /items` → scripts/ai-context/gerar.unit.mjs
- `GET /u` → scripts/ai-context/cenarios.mjs
- `GET /users` → scripts/ai-context/cenarios.mjs
- `POST /users/:id` → scripts/ai-context/cenarios.mjs

## Vistas por id (menu/ViewRouter → arquivo)
- (nenhum)

## Edge functions
- `analyze-call` — tabelas: -; chamada por 1 arquivo(s) do front
- `analyze-contact-profile` — tabelas: contact_interactions, contacts; chamada por 1 arquivo(s) do front
- `analyze-live-utterance` — tabelas: compliance_rules, live_assist_signals, objection_library; chamada por 1 arquivo(s) do front
- `analyze-sentiment` — tabelas: call_summaries; chamada por 1 arquivo(s) do front
- `analyze-talk-ratio` — tabelas: -; chamada por 2 arquivo(s) do front
- `approve-password-reset` — tabelas: audit_logs, password_reset_requests; chamada por 1 arquivo(s) do front
- `auto-scorecard` — tabelas: call_scorecards, call_sessions, scorecard_criteria, scorecard_responses, scorecard_templates; chamada por 0 arquivo(s) do front, por SQL/cron
- `bitrix-api` — tabelas: -; chamada por 1 arquivo(s) do front
- `chat-widget-session` — tabelas: agents, chat_sessions, conversation_messages, conversations; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `chatbot-respond` — tabelas: bot_conversations, chat_sessions, conversation_messages, conversations, kb_articles, system_settings; chamada por 1 arquivo(s) do front
- `check-alerts` — tabelas: call_alerts; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `check-calling-hours` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `check-contact-alerts` — tabelas: contact_alerts, contacts; chamada por 2 arquivo(s) do front
- `check-dnc` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `check-goals` — tabelas: call_alerts, call_sessions, dashboard_goals, goal_violations; chamada por 1 arquivo(s) do front
- `check-hold-alerts` — tabelas: call_alerts, hold_alert_settings, hold_events; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `check-queue-metrics` — tabelas: call_alerts, call_sessions, queue_metrics_settings; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `cleanup-lock-conflicts` (verify_jwt=false) — tabelas: optimistic_lock_conflicts, user_profiles; chamada por 0 arquivo(s) do front, por SQL/cron
- `cleanup-recordings` (verify_jwt=false) — tabelas: call_recordings, user_profiles; chamada por 0 arquivo(s) do front, por SQL/cron
- `compute-account-health` — tabelas: accounts, call_sessions, call_summaries, churn_risk_signals, survey_responses; chamada por 1 arquivo(s) do front
- `compute-adherence` — tabelas: agent_shifts, agent_status_history; chamada por 1 arquivo(s) do front
- `compute-best-time` — tabelas: call_sessions, contact_engagement_patterns, contacts; chamada por 1 arquivo(s) do front
- `compute-deal-health` — tabelas: call_key_moments, call_sessions, call_summaries, deals; chamada por 1 arquivo(s) do front
- `data-lake-flush` (verify_jwt=false) — tabelas: data_lake_exports, user_profiles; chamada por 0 arquivo(s) do front, por SQL/cron
- `database-backup` — tabelas: audit_logs, user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `database-cleanup` — tabelas: account_lockouts, audit_logs, login_attempts, rate_limit_alerts, rate_limit_logs, user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `detect-churn-risk` — tabelas: accounts, call_key_moments, call_sessions, call_summaries, churn_risk_signals; chamada por 1 arquivo(s) do front
- `detect-key-moments` — tabelas: call_key_moments; chamada por 2 arquivo(s) do front
- `dialer-pacing-tick` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front, por SQL/cron
- `elevenlabs-conversation-token` — tabelas: -; chamada por 1 arquivo(s) do front
- `email-inbound` — tabelas: agents, contacts, conversation_messages, conversations, email_tickets; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `embed-kb-article` — tabelas: kb_articles; chamada por 1 arquivo(s) do front
- `enforce-sla` — tabelas: calling_hours_config, conversations, holidays, notifications, sla_policies; chamada por 1 arquivo(s) do front
- `enroll-voice` — tabelas: voice_prints; chamada por 1 arquivo(s) do front
- `export-data-lake` — tabelas: data_lake_exports, user_roles; chamada por 1 arquivo(s) do front
- `extract-crm-fields` — tabelas: contacts, crm_field_suggestions; chamada por 2 arquivo(s) do front
- `forecast-call-volume` — tabelas: call_sessions; chamada por 1 arquivo(s) do front
- `forecast-deals` — tabelas: deals; chamada por 1 arquivo(s) do front
- `fuzz-test-runner` — tabelas: user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `generate-coaching` — tabelas: agent_goals, agents, call_sessions, call_summaries, call_transcriptions, coaching_recommendations, coaching_timestamps; chamada por 1 arquivo(s) do front, por SQL/cron
- `generate-coaching-plan` — tabelas: call_sessions; chamada por 1 arquivo(s) do front
- `generate-coaching-track` (verify_jwt=false) — tabelas: agents, call_sessions, coaching_assignments, notifications, user_profiles; chamada por 1 arquivo(s) do front, por SQL/cron
- `generate-meeting-summary` — tabelas: call_sessions, call_transcriptions, meeting_summaries; chamada por 2 arquivo(s) do front
- `generate-summary` — tabelas: -; chamada por 1 arquivo(s) do front
- `global-load-test` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `health-check` — tabelas: voip_trunk_health_checks, webhook_flush_metrics; chamada por 3 arquivo(s) do front
- `ldap-sync` — tabelas: audit_logs, contacts, system_settings, user_roles; chamada por 1 arquivo(s) do front
- `login-attempt` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `notify-blocked-ip` — tabelas: -; chamada por 1 arquivo(s) do front
- `notify-new-device` — tabelas: -; chamada por 1 arquivo(s) do front
- `ocr-virtual-fax` — tabelas: virtual_fax; chamada por 1 arquivo(s) do front
- `process-digest` — tabelas: notification_preferences, notifications; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `realtime-analysis` — tabelas: -; chamada por 1 arquivo(s) do front
- `record-consent` — tabelas: consent_records, user_profiles; chamada por 1 arquivo(s) do front
- `redact-sensitive-audio` — tabelas: call_transcriptions, redaction_log; chamada por 1 arquivo(s) do front
- `request-password-reset` — tabelas: password_reset_requests, security_alerts; chamada por 1 arquivo(s) do front
- `rls-audit` — tabelas: user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `score-call` — tabelas: call_scorecards, call_sessions, call_summaries, call_transcripts_searchable, scorecard_criteria, scorecard_responses; chamada por 1 arquivo(s) do front
- `score-call-attempt` — tabelas: contact_engagement_patterns; chamada por 1 arquivo(s) do front
- `search-calls` — tabelas: call_key_moments, call_transcripts_searchable; chamada por 1 arquivo(s) do front
- `send-notification` — tabelas: notification_preferences, notifications; chamada por 1 arquivo(s) do front
- `send-survey` — tabelas: survey_responses, surveys; chamada por 1 arquivo(s) do front
- `sip-config` — tabelas: agent_trunk_assignments, user_profiles; chamada por 1 arquivo(s) do front
- `suggest-shift-swaps` — tabelas: agent_shifts, agent_weekly_stats, shift_swap_suggestions, user_roles; chamada por 1 arquivo(s) do front
- `sync-crm-queue` — tabelas: crm_sync_queue; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `teams-fetch-recordings` — tabelas: call_recordings; chamada por 1 arquivo(s) do front
- `transcribe-recording` — tabelas: call_recordings, call_transcriptions; chamada por 1 arquivo(s) do front
- `translate-summary` — tabelas: call_summaries; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `translate-utterance` — tabelas: call_translations; chamada por 1 arquivo(s) do front
- `validate-geo` — tabelas: geo_access_logs, geo_restrictions, geo_settings, security_alerts; chamada por 1 arquivo(s) do front
- `validate-ip` — tabelas: blocked_access_logs, ip_whitelist, user_allowed_ips, user_ip_restrictions; chamada por 1 arquivo(s) do front
- `verify-voice` — tabelas: call_sessions, fraud_signals, voice_prints; chamada por 1 arquivo(s) do front
- `voice-command` — tabelas: -; chamada por 1 arquivo(s) do front
- `voice-transcribe` — tabelas: -; chamada por 2 arquivo(s) do front
- `voip-anomaly-detector` — tabelas: call_quality_metrics; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `voip-anomaly-remediation` — tabelas: voip_recommendation_actions; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `voip-capacity-forecast` — tabelas: call_sessions; chamada por 1 arquivo(s) do front
- `voip-capacity-recommendations` — tabelas: agents; chamada por 1 arquivo(s) do front
- `voip-diagnostic-voice-qa` — tabelas: call_quality_metrics, voip_quality_alerts, voip_recommendation_actions; chamada por 1 arquivo(s) do front
- `voip-executive-narrative` — tabelas: call_quality_metrics, voip_quality_alerts, voip_recommendation_actions; chamada por 1 arquivo(s) do front
- `voip-executive-summary` — tabelas: call_quality_metrics, call_sessions, voip_quality_alerts; chamada por 1 arquivo(s) do front
- `voip-failover-notifier` — tabelas: agent_trunk_assignments, notifications, voip_trunks; chamada por 0 arquivo(s) do front
- `voip-load-test` — tabelas: call_quality_metrics; chamada por 1 arquivo(s) do front
- `voip-quality-alerts-summary` — tabelas: voip_quality_alerts; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `voip-quality-forecast` — tabelas: call_quality_metrics; chamada por 1 arquivo(s) do front
- `voip-quality-heatmap` — tabelas: call_quality_metrics; chamada por 1 arquivo(s) do front
- `voip-recommendation-history` — tabelas: voip_recommendation_actions; chamada por 1 arquivo(s) do front
- `voip-recommendation-insights` — tabelas: call_quality_metrics, voip_recommendation_actions; chamada por 1 arquivo(s) do front
- `voip-recommendation-simulate` — tabelas: call_quality_metrics, voip_quality_alerts; chamada por 1 arquivo(s) do front
- `voip-recommendations` — tabelas: call_quality_metrics, call_sessions, voip_quality_alerts; chamada por 1 arquivo(s) do front
- `voip-sla-report` — tabelas: call_quality_metrics; chamada por 1 arquivo(s) do front
- `voip-trunks-healthcheck` — tabelas: agent_trunk_assignments, voip_trunk_health_checks, voip_trunks; chamada por 1 arquivo(s) do front
- `voip-trunks-manage` — tabelas: agent_trunk_assignments, call_control_audit_logs, user_roles, voip_trunks; chamada por 1 arquivo(s) do front
- `wavoip-call` — tabelas: -; chamada por 1 arquivo(s) do front
- `webauthn-authenticate` — tabelas: audit_logs, user_passkeys, webauthn_challenges; chamada por 1 arquivo(s) do front
- `webauthn-challenge` — tabelas: user_passkeys, user_profiles, webauthn_challenges; chamada por 1 arquivo(s) do front
- `webhook-handler` — tabelas: audit_logs; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `whatsapp-inbound` — tabelas: agents, contacts, conversation_messages, conversations; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `whatsapp-rewrite` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**

## Cron jobs (pg_cron / vercel)
- `cleanup-lock-conflicts-weekly` 0 3 * * 0 → edge cleanup-lock-conflicts (20261122220000_lock_conflicts_retention_cron.sql)
- `cleanup-recordings-daily` 45 3 * * * → edge cleanup-recordings (20261125220000_recordings_retention_cron.sql)
- `cron-watchdog-hourly` 5 * * * * (20261126170000_cron_watchdog.sql)
- `daily-cleanup-old-logs` 15 3 * * * (20260711185006_44492a26-e136-43de-93b9-066bed1b40a8.sql)
- `data-lake-flush-daily` 0 3 * * * → edge data-lake-flush (20261122180000_data_lake_flush_cron_token.sql)
- `deal-pipeline-snapshot-daily` 5 3 * * * (20261126120000_deal_pipeline_snapshots.sql)
- `dialer-pacing-tick` * * * * * → edge dialer-pacing-tick (20261122140000_dialer_pacing_cron.sql)
- `generate-coaching-tracks-daily` 15 3 * * * → edge generate-coaching-track (20261122120000_coaching_auto_tracks_cron.sql)
- `quarterly-reset-index-stats` 0 6 1 1,4,7,10 * (20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql)
- `weekly-bloat-monitor` 0 5 * * 0 (20260712110237_ae094d69-c026-433d-b7b1-232eb615e4cd.sql)
- `weekly-idle-index-monitor` 30 5 * * 0 (20260712112627_4ad8101d-5e02-4b1c-a570-f8338fc90f70.sql)
- `weekly-pgss-reset` 0 4 * * 0 (20260711194708_409831f1-bcdb-4529-ae31-eece4fe2a6e2.sql)
- `weekly-vacuum-analyze-hot-tables` 30 4 * * 0 (20260711194708_409831f1-bcdb-4529-ae31-eece4fe2a6e2.sql)

## Integrações externas
- SDKs: Supabase, react-query, zod
- hosts mais citados: openrouter.ai, hello-v3.vercel.app, cfmlmcdyjuotqobjapng.supabase.co, mock.supabase.co, lovable.dev, api.elevenlabs.io, api.resend.com, ex.com, ipapi.co, exemplo.com, id-preview--e326811c-e59a-4850-bf9e-cfc9d6748662.lovable.app, x.supabase.co, a.com, api.acme.io, api.bitrix24.com.br
- webhooks recebidos: cleanup-lock-conflicts, cleanup-recordings, data-lake-flush, dialer-pacing-tick, generate-coaching-track, login-attempt
- env de integração (só nomes): BITRIX_WEBHOOK_URL, CLEANUP_CRON_TOKEN, COACHING_CRON_TOKEN, DATA_LAKE_CRON_TOKEN, DD_API_KEY, DIALER_CRON_TOKEN, ELEVENLABS_AGENT_ID, ELEVENLABS_API_KEY, EMAIL_SERVICE_API_KEY, JWT_SECRET, MS_CLIENT_ID, MS_CLIENT_SECRET, OPENROUTER_API_KEY, RECORDINGS_CRON_TOKEN, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_QUEUE_DB, RESEND_API_KEY, SENTRY_DSN, SENTRY_ENVIRONMENT, STORAGE_BUCKET, STORAGE_SECRET_KEY, TESTE_CRON_TOKEN, TEST_REDIS_HOST, TEST_REDIS_PORT, WAVOIP_TOKEN

## Permissões / papéis
- papéis no código: admin (37), user (23), agent (20), system (17), alert (14), button (14), supervisor (9), group (7), status (6), img (4), article (3), dialog (3), navigation (3), viewer (3), anon (2), customer (2), link (2), region (2), string (2), tab (2), checkbox (1), combobox (1), god (1), menuitem (1), presentation (1), progressbar (1), radio (1), searchbox (1), separator (1), switch (1), table (1)
- enums de papel: app_role: admin|supervisor|agent|viewer
- guards: src/components/auth/ProtectedRoute.tsx · rotas protegidas: 0 · públicas: /, /*, /accounts, /admin/client-errors, /admin/data-export, /admin/database-health, /admin/extensions, /admin/security-alerts, /admin/security-audit, /admin/slo, /admin/voice-quality, /admin/voip-trunks, /admin/webhook-health, /agent-assist, /ai, /alert-history, /alerts, /analytics, /audit-logs, /battle-cards, /blf, /blocked-access-logs, /cadences, /call-flow-designer, /call-history, /call-library, /call-park, /call-queues, /callbacks, /calls, /coaching, /compliance, /concurrency-conflicts, /contacts, /contacts/insights, /dashboard, /deals, /dialer, /dialer/predictive, /executive, /external-recordings-import, /financial-impact, /forgot-password, /gamification, /geo-blocking, /history, /hold-alerts, /hold-metrics, /hold-settings, /hot-desking, /inbox, /ip-whitelist, /knowledge, /landing, /ldap-sync, /learning, /login, /marketplace, /meeting-summaries, /multi-device-ring, /network-diagnostics, /notifications, /number-porting, /observability, /onboarding, /outbound-compliance, /passkeys, /password-reset-approval, /permissions, /pricing, /qr-provisioning, /queue-dashboard, /queue-metrics-settings, /ranking, /rate-limit, /recordings, /register, /renewals, /reports, /reset-password, /ring-groups, /roles, /routing-rules, /scheduling, /scorecards, /security, /security-monitoring, /security-report, /sessions, /settings, /shift-swap-suggestions, /skills, /sla-policies, /sla-violations, /status, /success-plans, /toll-free-numbers, /topic-detection, /trackers, /translation-center, /two-factor-auth, /unauthorized, /verify-email, /video-conference, /virtual-fax, /voice-security, /voicemail, /vs/3cplus
- feature flags: novo-inbox

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 0
- componentes_ambiguos: 0
- menu_sem_destino: 0
- edges_orfas: 21 — ex.: chat-widget-session, check-alerts, check-calling-hours
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 2 — ex.: migration_rollbacks, schema_migrations
- tabelas_usadas_sem_definicao: 1 — ex.: agent_status_history
- tabelas_com_drift_migration_vs_types: 0
- rpcs_sem_definicao: 0
- componentes_orfaos: 13 — ex.: src/components/SearchInput.tsx, src/components/ui/animations.tsx, src/components/ui/breadcrumb.tsx
- componentes_com_nome_duplicado: 4 — ex.: KpiCards, SearchInput, Skeleton
- scripts_orfaos: 0
- env_usadas_nao_declaradas: 4 — ex.: DEV, VITE_TURN_CRED, VITE_TURN_URL
- ciclos_de_import: 1
- possiveis_segredos_no_codigo: 3 — ex.: src/lib/__tests__/security-advanced.test.ts:203, src/lib/__tests__/security-advanced.test.ts:208, src/lib/__tests__/security-advanced.test.ts:213

## Grafo de código (graphify)
- 10751 nós · 28265 arestas · 855 comunidades · grafo do commit `ff1ffe61`
- comunidades maiores: card.tsx (285), client.ts (257), react (198), vitest (188), protectedRoutes.tsx (169), CallDetailDialog.tsx (163), lucide-react (163), traceHeaders (162), ref_https (157), @tanstack/react-query (118), cn (116), 5. Em uso por rota (102)
- símbolos mais chamados: cn() (src/lib/utils.ts), usePageTitle() (src/hooks/usePageTitle.ts), safeFormatDatePtBR() (src/lib/safe-date.ts), useAuthContext() (src/contexts/AuthContext.tsx), q() (scripts/supabase_snapshot/snapshot.py), safeFormatDistanceToNow() (src/lib/safe-date.ts), traceHeaders() (src/lib/tracing.ts), withTrace() (src/lib/tracing.ts), safeToLocaleString() (src/lib/safe-date.ts), buildCorsHeaders() (supabase/functions/_shared/cors.ts), .collect() (scripts/supabase_snapshot/test_snapshot.py), formatDuration() (src/lib/utils.ts)
- consulta local: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<X>"`

## Hotspots (arquivos mais alterados, 90 dias)
- docs/qa/05-PROGRESSO.md (170)
- docs/estado/funcionalidades-planejadas.md (26)
- src/components/calls/UnifiedSoftphone.tsx (13)
- src/hooks/useMultiChannelCall.ts (12)
- src/components/layout/AppSidebar.tsx (11)
- src/components/layout/CommandPalette.tsx (11)
- docs/audits/pendencias-2026-07.md (10)
- src/components/calls/ActiveCallBar.tsx (10)
- .github/workflows/migrations.yml (9)
- docs/qa/03-ACHADOS.md (9)
- supabase/functions/data-lake-flush/index.ts (9)
- docs/agentes/mapa-repo.md (8)
- src/hooks/useAgentRanking.ts (8)
- src/integrations/supabase/types.ts (8)
- src/pages/PhoneDialer.tsx (8)

## Workflows
- `ci.yml` — CI (pull_request, push)
- `contexto.yml` — Contexto para agentes de IA (10 min) (push, schedule, workflow_dispatch; cron 3 * * * *)
- `deploy-edge-functions.yml` — Deploy edge function (workflow_dispatch)
- `inventario-estado-semanal.yml` — Inventário do estado real (semanal) (schedule, workflow_dispatch; cron 23 10 * * 1)
- `migrations.yml` — Aplicar migration (manual) (schedule, workflow_dispatch; cron 0 12 * * 1)

## Scripts npm
- `dev`: `vite`
- `build`: `vite build`
- `build:dev`: `vite build`
- `preview`: `vite preview`
- `lint`: `eslint .`
- `lint:fix`: `eslint . --fix`
- `type-check`: `tsc --noEmit`
- `contexto:ia`: `node scripts/ai-context/gerar.mjs --out docs/contexto/codigo`
- `contexto:ia:test`: `node --test scripts/ai-context/gerar.unit.mjs`
- `contexto:regras`: `python3 scripts/regras_negocio/generate.py --repo . --out docs/contexto/regras --profile regras --schema-snapshot docs/contexto/supabase --index-path docs/contexto/00-INDEX.md --no-pointer`
- `contexto:regras:test`: `python3 scripts/regras_negocio/test_generate.py`
- `contexto:banco`: `python3 scripts/supabase_snapshot/snapshot.py`
- `contexto:banco:test`: `python3 scripts/supabase_snapshot/test_snapshot.py`
- `inventario:rotas`: `node scripts/inventario/gerar-rotas.mjs`
- `inventario:edges`: `node scripts/inventario/gerar-repo.mjs`
- `inventario:banco`: `node scripts/inventario/gerar-banco.mjs`

## Documentos (raiz e docs/)
- `.github/SECURITY.md` — Security Policy (35 linhas)
- `AGENTS.md` — AGENTS.md — Hello V3 (148 linhas)
- `CLAUDE.md` (2 linhas)
- `ESTADO_ATUAL.md` — Estado Atual do Sistema — Auditoria de Estado (349 linhas)
- `README.md` — 📞 Bitrix Call Connect - VoIP Enterprise & AI Intelligence (79 linhas)
- `SYSTEM_FEATURES.md` — 📋 Levantamento Completo de Funcionalidades do Sistema (360 linhas)
- `docs/CONTEXTO-PARA-AGENTES.md` — Contexto para agentes de IA — leia ANTES de qualquer tarefa (41 linhas)
- `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md` — 📊 Inventário Exaustivo de Funcionalidades e Roadmap - VoIP Enterprise (84 linhas)
- `docs/prod-readiness.md` (97 linhas)
- subpastas de docs/: docs/adr (53), docs/estado (19), docs/pendencias (12), docs/qa (9), docs/agentes (6), docs/audits (2), docs/contexto (2), docs/analises (1), docs/audit (1), docs/edge-functions (1), docs/observabilidade (1), docs/runbooks (1)


## Últimos commits
- 2026-11-28 `ff1ffe6` fix: escuta do supervisor sai no nome de quem entrou, nao no literal Supervisor (#385)
- 2026-11-28 `324a522` fix: liberar escrita de hold_events para o agente da chamada (tempo de espera) (#382)
- 2026-11-28 `40b31fd` fix: feriado de outro pais nao bloqueia mais a discagem (#383)
- 2026-11-26 `2e9fb87` chore: registrar varredura final de cobertura backend -> tela (#381)
- 2026-11-26 `77bac04` feat: dar tela a jornada do cliente (etapas da conta e historico de transicoes) (#380)
- 2026-11-26 `0448f16` feat: barra de filtros salvos na tela de contatos (#379)
- 2026-11-26 `0a4fed0` fix: valida forma do snapshot e da fila de coaching VoIP no localStorage (#378)
- 2026-11-26 `bdbd99f` docs: reaudita o que foi descartado, arquivo por arquivo (nenhuma perda) (#377)
- 2026-11-26 `80b9200` chore: registrar a varredura de branches e PRs (nenhum trabalho perdido) (#376)
- 2026-11-26 `dc142b6` test: recuperar o teste do IP literal que ficou fora da main (resgate da PR 309) (#374)
- 2026-11-26 `a745026` docs: etapa 122 provada — feriado recorrente ja bloqueia; contrato escrito na funcao (#365)
- 2026-11-26 `8bed0e5` fix: restringir a authenticated o restante de public e provar storage bucket por bucket (etapa 145) (#360)
- 2026-11-26 `957a283` fix: guarda idempotente nos ALTER POLICY das geo_ (etapa 131) (#368)
- 2026-11-26 `c2181b6` docs(db): contrato dos ponteiros polimorficos (etapa 129) (#363)
- 2026-11-26 `b85ce49` feat: somar o placar semanal da gamificacao no banco (etapa 126) (#366)

## Arquivos deste diretório
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/manifest.json` (commit, data, hashes, erros — único arquivo com data/hora)

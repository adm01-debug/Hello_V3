# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado em `docs/contexto/codigo/` na branch `contexto` (gerada, nunca abra PR dela) a cada push em `main` e a cada 10 minutos pelo workflow `contexto.yml`; índice único das três fontes em `docs/contexto/00-INDEX.md`. Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `feeb6788bac936272b2cf4e67bdc5805580abb9e` (2026-11-13T20:19:59-03:00).

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
- linguagens: TypeScript (1159), SQL (209), Markdown (100), JavaScript (27), JSON (15), Python (5), YAML (3), Shell (2)
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
- deploy: n/d
- monorepo: n/d
- pastas_fonte: src

## Números
| item | qtd |
|---|---|
| arquivos_total | 1533 |
| arquivos_codigo | 1190 |
| linhas_codigo | 163240 |
| rotas | 104 |
| rotas_http_backend | 12 |
| vistas_por_id | 0 |
| itens_menu | 79 |
| modulos | 75 |
| componentes | 441 |
| hooks | 188 |
| edge_functions | 94 |
| tabelas | 171 |
| migrations | 207 |
| cron_jobs | 7 |
| testes | 322 |
| workflows | 3 |
| scripts | 31 |
| docs_md | 100 |

## Onde ficam as coisas
- telas: src/pages (103)
- componentes: src/components (313), src/pages (125), src/contexts (2)
- hooks: src/hooks (171), src/components (12), src/contexts (2)
- servicos_logica: src/lib (76), src/integrations (3), scripts/regras_negocio (2)
- testes: co-localizado (__tests__) (300), e2e/ (7), tests/ (6)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/inventario (5), scripts/regras_negocio (3), scripts/ai-context (2)
- docs: (raiz) (5), docs (3), .github (1)
- nomenclatura: {"componentes":"PascalCase (88%)","hooks":"use + PascalCase","servicos":"kebab-case (70%)","edge_functions":"kebab-case (100%)","tabelas":"snake_case (89%)"}
- instruções para agentes no repo: AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| components/admin | 0 | 0 | 23 | 15 | 2 | 10 |
| components/ai | 0 | 0 | 7 | 1 | 2 | 1 |
| components/alerts | 0 | 0 | 5 | 0 | 0 | 3 |
| components/auth | 0 | 0 | 7 | 11 | 1 | 6 |
| components/calls | 0 | 0 | 27 | 29 | 12 | 19 |
| components/compliance | 0 | 0 | 16 | 2 | 0 | 6 |
| components/contacts | 0 | 0 | 11 | 6 | 3 | 6 |
| components/conversation-intelligence | 0 | 0 | 7 | 4 | 2 | 5 |
| components/dashboard | 0 | 0 | 13 | 11 | 0 | 5 |
| components/dialer | 0 | 0 | 16 | 17 | 1 | 7 |
| components/executive | 0 | 0 | 18 | 26 | 6 | 20 |
| components/gamification | 0 | 0 | 7 | 3 | 0 | 5 |
| components/layout | 0 | 0 | 9 | 113 | 28 | 68 |
| components/network | 0 | 0 | 17 | 14 | 12 | 3 |
| components/observability | 0 | 0 | 6 | 0 | 0 | 0 |
| components/queue-alerts | 0 | 0 | 8 | 1 | 0 | 1 |
| components/ranking | 0 | 0 | 6 | 1 | 0 | 5 |
| components/security-alerts | 0 | 0 | 10 | 0 | 0 | 0 |
| components/settings | 0 | 0 | 6 | 8 | 1 | 6 |
| components/supervisor | 0 | 0 | 11 | 2 | 0 | 3 |
| components/ui | 0 | 0 | 56 | 7 | 0 | 0 |
| components/voice | 0 | 0 | 7 | 4 | 2 | 1 |
| hooks | 0 | 0 | 165 | 205 | 54 | 121 |
| hooks/auth | 0 | 0 | 5 | 5 | 0 | 1 |
| lib | 0 | 0 | 46 | 96 | 26 | 61 |
| lib/security | 0 | 0 | 17 | 0 | 0 | 0 |
| pages | 76 | 92 | 91 | 173 | 59 | 128 |
| pages/admin | 3 | 9 | 17 | 35 | 4 | 16 |
| pages/call-analytics | 0 | 0 | 7 | 1 | 0 | 2 |
| pages/marketing | 0 | 3 | 4 | 0 | 0 | 0 |
| pages/roles | 0 | 0 | 6 | 1 | 0 | 3 |

## Rotas (url → arquivo)
- `/` [tela] → src/pages/PhoneDialer.tsx
- `/*` [tela] → src/pages/NotFound.tsx
- `/accounts` [tela] → src/pages/Accounts.tsx
- `/admin/data-export` [tela] → src/pages/admin/DataExport.tsx
- `/admin/database-health` [tela] → src/pages/admin/DatabaseHealth.tsx
- `/admin/extensions` [tela] → src/pages/admin/ExtensionsAdmin.tsx
- `/admin/security-alerts` [tela] → src/pages/admin/SecurityAlerts.tsx
- `/admin/security-audit` [tela] → src/pages/admin/SecurityDashboard.tsx
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
- `/call-history` [tela] → src/pages/CallHistory.tsx
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
- `/security` [tela] → src/pages/SecurityDashboard.tsx
- `/security-monitoring` [tela] → src/pages/SecurityMonitoring.tsx
- `/security-report` [tela] → src/pages/SecurityReport.tsx
- `/sessions` [tela] → src/pages/SessionManagement.tsx
- `/settings` [tela] → src/pages/Settings.tsx
- `/shift-swap-suggestions` [tela] → src/pages/ShiftSwapSuggestions.tsx
- `/skills` [tela] → src/pages/Skills.tsx
- `/sla-policies` [tela] → src/pages/SLAPolicies.tsx
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
- `GET /x` → scripts/ai-context/cenarios.mjs

## Vistas por id (menu/ViewRouter → arquivo)
- (nenhum)

## Edge functions
- `analyze-call` — tabelas: -; chamada por 1 arquivo(s) do front
- `analyze-contact-profile` — tabelas: contact_interactions, contacts; chamada por 1 arquivo(s) do front
- `analyze-live-utterance` — tabelas: compliance_rules, live_assist_signals, objection_library; chamada por 1 arquivo(s) do front
- `analyze-sentiment` — tabelas: call_summaries; chamada por 1 arquivo(s) do front
- `analyze-talk-ratio` — tabelas: -; chamada por 2 arquivo(s) do front
- `approve-password-reset` — tabelas: audit_logs, password_reset_requests, user_profiles; chamada por 1 arquivo(s) do front
- `auto-scorecard` — tabelas: call_scorecards, call_sessions, scorecard_criteria, scorecard_responses, scorecard_templates; chamada por 0 arquivo(s) do front, por SQL/cron
- `bitrix-api` — tabelas: -; chamada por 1 arquivo(s) do front
- `chat-widget-session` — tabelas: agents, chat_sessions, conversation_messages, conversations; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `chatbot-respond` — tabelas: bot_conversations, conversation_messages, conversations, kb_articles, system_settings; chamada por 1 arquivo(s) do front
- `check-alerts` — tabelas: call_alerts; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `check-contact-alerts` — tabelas: contact_alerts, contacts; chamada por 2 arquivo(s) do front
- `check-goals` — tabelas: call_alerts, call_sessions, dashboard_goals, goal_violations; chamada por 1 arquivo(s) do front
- `check-hold-alerts` — tabelas: call_alerts, hold_alert_settings, hold_events; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `check-queue-metrics` — tabelas: call_alerts, call_sessions, queue_metrics_settings; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `cleanup-lock-conflicts` — tabelas: optimistic_lock_conflicts, user_profiles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `compute-account-health` — tabelas: accounts, call_sessions, call_summaries, churn_risk_signals, survey_responses; chamada por 1 arquivo(s) do front
- `compute-adherence` — tabelas: agent_shifts, agent_status_history; chamada por 1 arquivo(s) do front
- `compute-best-time` — tabelas: call_sessions, contact_engagement_patterns, contacts; chamada por 1 arquivo(s) do front
- `compute-deal-health` — tabelas: call_key_moments, call_sessions, call_summaries, deals; chamada por 1 arquivo(s) do front
- `data-lake-flush` — tabelas: data_lake_exports; chamada por 0 arquivo(s) do front, por SQL/cron
- `database-backup` — tabelas: audit_logs, user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `database-cleanup` — tabelas: account_lockouts, audit_logs, login_attempts, rate_limit_alerts, rate_limit_logs, user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `detect-churn-risk` — tabelas: accounts, call_key_moments, call_sessions, call_summaries, churn_risk_signals; chamada por 1 arquivo(s) do front
- `detect-key-moments` — tabelas: call_key_moments; chamada por 2 arquivo(s) do front
- `dialer-pacing-tick` — tabelas: -; chamada por 1 arquivo(s) do front
- `elevenlabs-conversation-token` — tabelas: -; chamada por 1 arquivo(s) do front
- `email-inbound` — tabelas: agents, contacts, conversation_messages, conversations, email_tickets; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `embed-kb-article` — tabelas: kb_articles; chamada por 1 arquivo(s) do front
- `enforce-sla` — tabelas: conversations, notifications, sla_policies; chamada por 1 arquivo(s) do front
- `enroll-voice` — tabelas: voice_prints; chamada por 1 arquivo(s) do front
- `export-data-lake` — tabelas: data_lake_exports, user_profiles; chamada por 1 arquivo(s) do front
- `extract-crm-fields` — tabelas: contacts, crm_field_suggestions; chamada por 2 arquivo(s) do front
- `forecast-call-volume` — tabelas: call_sessions; chamada por 1 arquivo(s) do front
- `forecast-deals` — tabelas: deals; chamada por 1 arquivo(s) do front
- `fuzz-test-runner` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `generate-coaching` — tabelas: agent_goals, agents, call_sessions, call_summaries, call_transcriptions, coaching_recommendations, coaching_timestamps, user_profiles; chamada por 1 arquivo(s) do front
- `generate-coaching-plan` — tabelas: call_sessions; chamada por 1 arquivo(s) do front
- `generate-coaching-track` — tabelas: agents, call_analyses, call_sessions, coaching_assignments, learning_modules, notifications, user_profiles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `generate-meeting-summary` — tabelas: call_sessions, call_transcriptions, meeting_summaries; chamada por 2 arquivo(s) do front
- `generate-summary` — tabelas: -; chamada por 1 arquivo(s) do front
- `global-load-test` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `health-check` — tabelas: voip_trunk_health_checks, webhook_flush_metrics; chamada por 2 arquivo(s) do front
- `migrate-helper` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `notify-blocked-ip` — tabelas: -; chamada por 1 arquivo(s) do front
- `notify-new-device` — tabelas: -; chamada por 1 arquivo(s) do front
- `ocr-virtual-fax` — tabelas: virtual_fax; chamada por 1 arquivo(s) do front
- `process-digest` — tabelas: notification_preferences, notifications; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `realtime-analysis` — tabelas: -; chamada por 1 arquivo(s) do front
- `record-consent` — tabelas: consent_records, user_profiles; chamada por 1 arquivo(s) do front
- `redact-sensitive-audio` — tabelas: call_transcriptions, redaction_log; chamada por 1 arquivo(s) do front
- `request-password-reset` — tabelas: password_reset_requests, security_alerts; chamada por 1 arquivo(s) do front
- `rls-audit` — tabelas: pg_class, pg_policies; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `score-call` — tabelas: call_scorecards, call_sessions, call_summaries, call_transcripts_searchable, scorecard_criteria, scorecard_responses; chamada por 1 arquivo(s) do front
- `score-call-attempt` — tabelas: contact_engagement_patterns; chamada por 1 arquivo(s) do front
- `search-calls` — tabelas: call_key_moments, call_transcripts_searchable; chamada por 1 arquivo(s) do front
- `send-notification` — tabelas: notification_preferences, notifications; chamada por 1 arquivo(s) do front
- `send-survey` — tabelas: survey_responses, surveys; chamada por 1 arquivo(s) do front
- `sip-config` — tabelas: agent_trunk_assignments, user_profiles; chamada por 1 arquivo(s) do front
- `suggest-shift-swaps` — tabelas: agent_shifts, agent_weekly_stats, shift_swap_suggestions, user_profiles; chamada por 1 arquivo(s) do front
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
- `webauthn-authenticate` — tabelas: audit_logs, user_passkeys; chamada por 1 arquivo(s) do front
- `webhook-handler` — tabelas: audit_logs; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `whatsapp-inbound` — tabelas: agents, contacts, conversation_messages, conversations; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `whatsapp-rewrite` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**

## Cron jobs (pg_cron / vercel)
- `daily-cleanup-old-logs` 15 3 * * * (20260711185006_44492a26-e136-43de-93b9-066bed1b40a8.sql)
- `data-lake-flush-daily` 0 3 * * * → edge data-lake-flush (20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql)
- `quarterly-reset-index-stats` 0 6 1 1,4,7,10 * (20260712115343_8332dd3d-29a2-4017-954c-edc625f7029b.sql)
- `weekly-bloat-monitor` 0 5 * * 0 (20260712110237_ae094d69-c026-433d-b7b1-232eb615e4cd.sql)
- `weekly-idle-index-monitor` 30 5 * * 0 (20260712112627_4ad8101d-5e02-4b1c-a570-f8338fc90f70.sql)
- `weekly-pgss-reset` 0 4 * * 0 (20260711194708_409831f1-bcdb-4529-ae31-eece4fe2a6e2.sql)
- `weekly-vacuum-analyze-hot-tables` 30 4 * * 0 (20260711194708_409831f1-bcdb-4529-ae31-eece4fe2a6e2.sql)

## Integrações externas
- SDKs: Supabase, react-query, zod
- hosts mais citados: ai.gateway.lovable.dev, cfmlmcdyjuotqobjapng.supabase.co, lovable.dev, api.elevenlabs.io, api.resend.com, ex.com, example.supabase.co, ipapi.co, mock.supabase.co, api.lovable.dev, exemplo.com, x.supabase.co, a.com, api.acme.io, api.ipify.org
- webhooks recebidos: migrate-helper
- env de integração (só nomes): BITRIX_WEBHOOK_URL, DD_API_KEY, ELEVENLABS_AGENT_ID, ELEVENLABS_API_KEY, EMAIL_SERVICE_API_KEY, JWT_SECRET, LOVABLE_API_KEY, MICROSOFT_TEAMS_API_KEY, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_QUEUE_DB, RESEND_API_KEY, SENTRY_DSN, SENTRY_ENVIRONMENT, STORAGE_BUCKET, STORAGE_SECRET_KEY, TEST_REDIS_HOST, TEST_REDIS_PORT, WAVOIP_TOKEN

## Permissões / papéis
- papéis no código: admin (32), user (24), system (18), agent (15), alert (7), supervisor (6), group (5), status (5), button (3), img (3), navigation (3), viewer (3), anon (2), article (2), customer (2), dialog (2), god (1), link (1), list (1), presentation (1), region (1), searchbox (1), separator (1), string (1), sup (1), table (1)
- enums de papel: app_role: admin|supervisor|agent|viewer
- guards: src/components/auth/ProtectedRoute.tsx · rotas protegidas: 0 · públicas: /, /*, /accounts, /admin/data-export, /admin/database-health, /admin/extensions, /admin/security-alerts, /admin/security-audit, /admin/slo, /admin/voice-quality, /admin/voip-trunks, /admin/webhook-health, /agent-assist, /ai, /alert-history, /alerts, /analytics, /audit-logs, /battle-cards, /blf, /blocked-access-logs, /cadences, /call-flow-designer, /call-history, /call-library, /call-park, /call-queues, /callbacks, /calls, /coaching, /compliance, /concurrency-conflicts, /contacts, /contacts/insights, /dashboard, /deals, /dialer, /dialer/predictive, /executive, /external-recordings-import, /financial-impact, /forgot-password, /geo-blocking, /history, /hold-alerts, /hold-metrics, /hold-settings, /hot-desking, /inbox, /ip-whitelist, /knowledge, /landing, /ldap-sync, /learning, /login, /marketplace, /meeting-summaries, /multi-device-ring, /network-diagnostics, /notifications, /number-porting, /observability, /onboarding, /outbound-compliance, /passkeys, /password-reset-approval, /permissions, /pricing, /qr-provisioning, /queue-dashboard, /queue-metrics-settings, /ranking, /rate-limit, /recordings, /register, /renewals, /reports, /reset-password, /ring-groups, /roles, /routing-rules, /scheduling, /security, /security-monitoring, /security-report, /sessions, /settings, /shift-swap-suggestions, /skills, /sla-policies, /status, /success-plans, /toll-free-numbers, /topic-detection, /trackers, /translation-center, /two-factor-auth, /unauthorized, /verify-email, /video-conference, /virtual-fax, /voice-security, /voicemail, /vs/3cplus
- feature flags: FEATURE_X, nova-tela, novo-inbox

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 0
- componentes_ambiguos: 0
- menu_sem_destino: 0
- edges_orfas: 21 — ex.: chat-widget-session, check-alerts, check-hold-alerts
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 2 — ex.: migration_rollbacks, schema_migrations
- tabelas_usadas_sem_definicao: 3 — ex.: agent_status_history, pg_class, pg_policies
- tabelas_com_drift_migration_vs_types: 9 — ex.: agents, blocked_access_logs, call_control_audit_logs
- rpcs_sem_definicao: 2 — ex.: check_db_policies, get_table_policies
- componentes_orfaos: 20 — ex.: src/components/alerts/AlertsDropdown.tsx, src/components/calls/WebRTCCall.tsx, src/components/contacts/ContactAlertsDropdown.tsx
- componentes_com_nome_duplicado: 5 — ex.: KpiCards, SearchInput, SecurityDashboard
- scripts_orfaos: 0
- env_usadas_nao_declaradas: 3 — ex.: VITE_TURN_CRED, VITE_TURN_URL, VITE_TURN_USER
- ciclos_de_import: 1
- possiveis_segredos_no_codigo: 18 — ex.: scripts/ai-context/cenarios.mjs:102, scripts/check-data.mjs:2, scripts/test-api-direct.mjs:3

## Grafo de código (graphify)
- 8812 nós · 23536 arestas · 678 comunidades · grafo do commit `feeb6788`
- comunidades maiores: lucide-react (257), badge.tsx (185), react (179), client.ts (162), traceHeaders (152), protectedRoutes.tsx (129), usePageTitle (120), vitest (112), cn (111), snapshot.py (102), @tanstack/react-query (90), gerar.mjs (84)
- símbolos mais chamados: cn() (src/lib/utils.ts), usePageTitle() (src/hooks/usePageTitle.ts), safeFormatDatePtBR() (src/lib/safe-date.ts), q() (scripts/supabase_snapshot/snapshot.py), safeFormatDistanceToNow() (src/lib/safe-date.ts), useAuthContext() (src/contexts/AuthContext.tsx), traceHeaders() (src/lib/tracing.ts), withTrace() (src/lib/tracing.ts), formatDuration() (src/lib/utils.ts), safeToLocaleString() (src/lib/safe-date.ts), .collect() (scripts/supabase_snapshot/test_snapshot.py), excluded_sql() (scripts/supabase_snapshot/snapshot.py)
- consulta local: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<X>"`

## Hotspots (arquivos mais alterados, 90 dias)
- ESTADO_ATUAL.md (5)
- .github/workflows/contexto.yml (3)
- AGENTS.md (3)
- inventario/estado/edges.json (3)
- .github/workflows/ci.yml (2)
- .github/workflows/inventario-estado-semanal.yml (2)
- docs/estado/edge-functions-parte1.md (2)
- docs/prod-readiness.md (2)
- inventario/estado/rotas.json (2)
- scripts/inventario/banco.sql (2)
- scripts/inventario/gerar-banco.mjs (2)
- scripts/supabase_snapshot/snapshot.py (2)
- scripts/supabase_snapshot/test_snapshot.py (2)
- vite.config.ts (2)
- .claude/skills/hello-v3/SKILL.md (1)

## Workflows
- `ci.yml` — CI (pull_request, push)
- `contexto.yml` — Contexto para agentes de IA (10 min) (push, schedule, workflow_dispatch; cron 3-59/10 * * * *)
- `inventario-estado-semanal.yml` — Inventário do estado real (semanal) (schedule, workflow_dispatch; cron 23 10 * * 1)

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
- `AGENTS.md` — AGENTS.md — Hello V3 (137 linhas)
- `CLAUDE.md` (2 linhas)
- `ESTADO_ATUAL.md` — Estado Atual do Sistema — Auditoria de Estado (349 linhas)
- `README.md` — 📞 Bitrix Call Connect - VoIP Enterprise & AI Intelligence (79 linhas)
- `SYSTEM_FEATURES.md` — 📋 Levantamento Completo de Funcionalidades do Sistema (360 linhas)
- `docs/CONTEXTO-PARA-AGENTES.md` — Contexto para agentes de IA — leia ANTES de qualquer tarefa (41 linhas)
- `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md` — 📊 Inventário Exaustivo de Funcionalidades e Roadmap - VoIP Enterprise (63 linhas)
- `docs/prod-readiness.md` (92 linhas)
- subpastas de docs/: docs/adr (53), docs/estado (18), docs/agentes (6), docs/audits (2), docs/contexto (2), docs/qa (2), docs/analises (1), docs/audit (1), docs/runbooks (1)


## Últimos commits
- 2026-11-13 `feeb678` chore: docs: atualiza prod-readiness com publicacao do contexto e RLS vivo (#31)
- 2026-11-13 `4060612` chore: docs: relatorio de prod-readiness com inventario de funcionalidades (#30)
- 2026-11-13 `75a5df1` fix: guard de segredo do contexto ignora senha ja redigida (#29)
- 2026-11-13 `8ed39f4` fix(snapshot): reescreve query de grants via aclexplode (remove timeout de 2min) (#28)
- 2026-11-13 `fece2f3` chore: inventario do estado real [auto] (#27)
- 2026-11-13 `cf8f7fc` fix: inventario usa auth.schema_migrations e parser do types.ts nao conta funcoes (#26)
- 2026-11-13 `4e40e57` infra: job banco do contexto roda suíte offline do snapshot (unittest) (#25)
- 2026-11-13 `650143f` fix: test_snapshot.py lê arquivos gerados com UTF-8 explícito (#24)
- 2026-11-12 `f8c3c37` fix(ci): inventario nao quebra sem banco.json (add-paths varre o diretorio) (#22)
- 2026-11-12 `0335da9` chore: inventario do estado real [auto] (#23)
- 2026-11-12 `bc47e27` fix(ci): integra PRs 18/19/20 - CI 100% verde
- 2026-11-11 `5db3c07` Pipeline autônomo de contexto para agentes de IA (portado do Zapp Web V2) (#8)
- 2026-11-09 `bb41eec` feat(network): integra voip-quality-alerts-summary ao dashboard
- 2026-11-09 `2b05cbb` fix(chat-widget-session): aplica rate limit por IP no endpoint anônimo
- 2026-11-09 `fc37442` fix(e2e): bun run build + vite preview para webServer do Playwright (#17)

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

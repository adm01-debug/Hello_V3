<!-- Gerado por scripts/inventario/gerar-catalogo-edges.mjs — nao editar a mao. -->

# Catálogo de edge functions

Fonte: leitura de `supabase/functions/*/index.ts` no próprio repositório. Cada coluna é derivada do código,
não de documentação — por isso o arquivo é regenerável e verificável por CI.

Gerar de novo: `node scripts/inventario/gerar-catalogo-edges.mjs`  
Conferir se está atualizado: `node scripts/inventario/gerar-catalogo-edges.mjs --check`

## Resumo

- **94** edge functions
- **23** públicas (sem leitura de JWT no código)
- **63** exigem usuário autenticado
- **8** exigem papel admin/supervisor
- **9** sem chamador no repositório (invocadas por cron, webhook externo ou uso manual)

## Colunas

| Coluna | Significado |
| --- | --- |
| **Auth** | `publico` = não lê JWT; `autenticado` = `auth.getUser()`; `admin/supervisor` = além do usuário, checa papel |
| **service_role** | o código usa `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS) |
| **Zod** | o corpo é validado por schema (`validateBody`/Zod) |
| **rate** | aplica `checkRateLimit*` |
| **Chamadores** | `src` / `mig` / `edge` / `e2e` = onde a função é invocada |
| **Segredos** | variáveis lidas além das três do Supabase |

## Catálogo

| Função | Descrição (do código) | Auth | service_role | Zod | rate | Chamadores | Segredos | Linhas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `analyze-call` | — | autenticado | — | sim | sim | src 1 / mig 0 / edge 1 / e2e 0 | `OPENROUTER_API_KEY` | 147 |
| `analyze-contact-profile` | — | autenticado | sim | — | sim | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 99 |
| `analyze-live-utterance` | — | autenticado | sim | sim | sim | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 224 |
| `analyze-sentiment` | — | autenticado | sim | — | sim | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 89 |
| `analyze-talk-ratio` | — | publico | — | — | — | src 3 / mig 0 / edge 0 / e2e 0 | — | 116 |
| `approve-password-reset` | — | admin/supervisor | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 153 |
| `auto-scorecard` | Auto-Scorecard — Gera scorecard automático via IA para chamadas com resumo | publico | sim | sim | — | src 0 / mig 2 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 201 |
| `bitrix-api` | — | autenticado | — | — | sim | src 3 / mig 0 / edge 2 / e2e 0 | `BITRIX_WEBHOOK_URL` | 272 |
| `chat-widget-session` | — | publico | sim | — | sim | src 0 / mig 0 / edge 0 / e2e 0 | — | 184 |
| `chatbot-respond` | — | publico | sim | sim | — | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 217 |
| `check-alerts` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 119 |
| `check-contact-alerts` | — | autenticado | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 99 |
| `check-goals` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 297 |
| `check-hold-alerts` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 121 |
| `check-queue-metrics` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 243 |
| `cleanup-lock-conflicts` | — | header-only | sim | — | — | src 0 / mig 0 / edge 0 / e2e 0 | — | 89 |
| `compute-account-health` | Compute account health score 0-100 from deterministic signals | publico | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 127 |
| `compute-adherence` | — | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 94 |
| `compute-best-time` | — | autenticado | sim | sim | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 131 |
| `compute-deal-health` | — | header-only | sim | sim | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 104 |
| `data-lake-flush` | Data Lake Flush — Exporta incremental de datasets críticos em NDJSON para o bucket data-lake-exports. | publico | sim | — | — | src 0 / mig 2 / edge 0 / e2e 0 | — | 135 |
| `database-backup` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 100 |
| `database-cleanup` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 111 |
| `detect-churn-risk` | Detect churn risk signals deterministically + persist + bump churn score | publico | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 154 |
| `detect-key-moments` | — | publico | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 122 |
| `dialer-pacing-tick` | Tick do discador preditivo — invocado por pg_cron a cada 10s ou manualmente | publico | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 31 |
| `elevenlabs-conversation-token` | — | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `ELEVENLABS_AGENT_ID`, `ELEVENLABS_API_KEY` | 88 |
| `email-inbound` | — | publico | sim | — | — | src 0 / mig 0 / edge 0 / e2e 0 | — | 171 |
| `embed-kb-article` | — | publico | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `LOVABLE_API_KEY` | 67 |
| `enforce-sla` | — | publico | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 110 |
| `enroll-voice` | — | autenticado | sim | — | sim | src 2 / mig 0 / edge 0 / e2e 0 | — | 108 |
| `export-data-lake` | — | admin/supervisor | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 93 |
| `extract-crm-fields` | — | autenticado | sim | — | sim | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 172 |
| `forecast-call-volume` | — | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 87 |
| `forecast-deals` | — | header-only | sim | sim | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 79 |
| `fuzz-test-runner` | — | publico | — | sim | — | src 0 / mig 0 / edge 0 / e2e 0 | — | 80 |
| `generate-coaching` | — | admin/supervisor | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 282 |
| `generate-coaching-plan` | Coaching Copilot — Gera plano semanal de coaching baseado nas últimas chamadas do agente | header-only | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 115 |
| `generate-coaching-track` | — | admin/supervisor | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 139 |
| `generate-meeting-summary` | — | autenticado | sim | — | sim | src 3 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 309 |
| `generate-summary` | — | autenticado | — | sim | sim | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 96 |
| `global-load-test` | — | admin/supervisor | sim | — | — | src 0 / mig 0 / edge 0 / e2e 0 | — | 154 |
| `health-check` | Health check consolidado — endpoint público retornando status dos componentes | publico | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 122 |
| `ldap-sync` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `LDAP_ALLOW_SELF_SIGNED` | 367 |
| `notify-blocked-ip` | — | publico | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `ADMIN_EMAIL`, `FROM_EMAIL`, `RESEND_API_KEY` | 102 |
| `notify-new-device` | — | publico | — | — | — | src 2 / mig 0 / edge 0 / e2e 0 | `FROM_EMAIL`, `RESEND_API_KEY` | 120 |
| `ocr-virtual-fax` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 94 |
| `process-digest` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 108 |
| `realtime-analysis` | — | autenticado | — | — | sim | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 98 |
| `record-consent` | — | admin/supervisor | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 99 |
| `redact-sensitive-audio` | — | autenticado | sim | — | sim | src 2 / mig 0 / edge 0 / e2e 0 | — | 125 |
| `request-password-reset` | — | publico | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 128 |
| `rls-audit` | RLS Audit — Relatorio de RLS nas tabelas criticas. Restrito a admin/supervisor. | header-only | sim | — | — | src 0 / mig 0 / edge 0 / e2e 0 | — | 99 |
| `score-call` | — | header-only | sim | sim | — | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 121 |
| `score-call-attempt` | — | autenticado | sim | sim | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 117 |
| `search-calls` | — | header-only | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 123 |
| `send-notification` | — | autenticado | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 130 |
| `send-survey` | Send a survey trigger record (in-app notification) — channel delivery handled elsewhere | publico | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 60 |
| `sip-config` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `SIP_PASSWORD`, `SIP_SERVER`, `SIP_USERNAME` | 161 |
| `suggest-shift-swaps` | — | admin/supervisor | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 110 |
| `sync-crm-queue` | — | publico | sim | — | — | src 0 / mig 0 / edge 0 / e2e 0 | — | 69 |
| `teams-fetch-recordings` | — | publico | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `LOVABLE_API_KEY`, `MICROSOFT_TEAMS_API_KEY` | 93 |
| `transcribe-recording` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `ELEVENLABS_API_KEY` | 172 |
| `translate-summary` | — | autenticado | sim | — | — | src 0 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 115 |
| `translate-utterance` | — | autenticado | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 101 |
| `validate-geo` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 174 |
| `validate-ip` | — | autenticado | sim | — | — | src 3 / mig 0 / edge 0 / e2e 0 | — | 148 |
| `verify-voice` | — | autenticado | sim | sim | sim | src 2 / mig 0 / edge 0 / e2e 0 | — | 93 |
| `voice-command` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 97 |
| `voice-transcribe` | — | autenticado | — | — | — | src 2 / mig 0 / edge 0 / e2e 0 | `ELEVENLABS_API_KEY` | 133 |
| `voip-anomaly-detector` | — | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 194 |
| `voip-anomaly-remediation` | Edge Function: voip-anomaly-remediation | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 252 |
| `voip-capacity-forecast` | — | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 173 |
| `voip-capacity-recommendations` | — | autenticado | — | sim | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 190 |
| `voip-diagnostic-voice-qa` | Edge Function: voip-diagnostic-voice-qa (Onda 20) | autenticado | — | — | — | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 191 |
| `voip-executive-narrative` | Edge Function: voip-executive-narrative (Onda 20) | autenticado | — | — | — | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 165 |
| `voip-executive-summary` | Edge Function: voip-executive-summary | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 219 |
| `voip-failover-notifier` | — | header-only | sim | — | — | src 0 / mig 0 / edge 1 / e2e 0 | — | 54 |
| `voip-load-test` | — | admin/supervisor | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 142 |
| `voip-quality-alerts-summary` | Edge Function: voip-quality-alerts-summary | header-only | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 107 |
| `voip-quality-forecast` | — | autenticado | — | — | — | src 1 / mig 0 / edge 1 / e2e 0 | — | 248 |
| `voip-quality-heatmap` | Edge Function: voip-quality-heatmap | header-only | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 116 |
| `voip-recommendation-history` | Edge Function: voip-recommendation-history | autenticado | — | sim | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 125 |
| `voip-recommendation-insights` | Edge Function: voip-recommendation-insights | autenticado | — | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 216 |
| `voip-recommendation-simulate` | Edge Function: voip-recommendation-simulate | autenticado | — | sim | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 218 |
| `voip-recommendations` | Edge Function: voip-recommendations | autenticado | — | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 282 |
| `voip-sla-report` | Edge Function: voip-sla-report | header-only | — | sim | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 120 |
| `voip-trunks-healthcheck` | — | autenticado | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 177 |
| `voip-trunks-manage` | — | autenticado | sim | — | — | src 2 / mig 0 / edge 0 / e2e 0 | — | 205 |
| `wavoip-call` | — | autenticado | — | — | — | src 1 / mig 0 / edge 0 / e2e 0 | `WAVOIP_TOKEN` | 118 |
| `webauthn-authenticate` | — | publico | sim | — | — | src 1 / mig 0 / edge 0 / e2e 0 | — | 98 |
| `webhook-handler` | — | publico | sim | — | — | src 0 / mig 0 / edge 1 / e2e 0 | — | 77 |
| `whatsapp-inbound` | — | publico | sim | sim | — | src 0 / mig 0 / edge 0 / e2e 0 | — | 139 |
| `whatsapp-rewrite` | — | autenticado | — | — | sim | src 2 / mig 0 / edge 0 / e2e 0 | `OPENROUTER_API_KEY` | 140 |

## Funções sem chamador no repositório

Invocadas fora do repositório (cron, webhook de terceiro) ou disponíveis apenas para operação manual.

- `chat-widget-session`
- `cleanup-lock-conflicts`
- `email-inbound`
- `fuzz-test-runner`
- `global-load-test`
- `rls-audit` — RLS Audit — Relatorio de RLS nas tabelas criticas. Restrito a admin/supervisor.
- `sync-crm-queue`
- `translate-summary`
- `whatsapp-inbound`

## Funções públicas que usam `service_role`

Combinam ausência de checagem de JWT no código com bypass de RLS. Cada uma precisa de outro controle
(segredo compartilhado, assinatura HMAC, rate limit ou origem restrita) — e é onde uma auditoria de
exposição deve começar.

- `auto-scorecard`
- `chat-widget-session` (rate limit aplicado)
- `chatbot-respond`
- `compute-account-health`
- `data-lake-flush`
- `detect-churn-risk`
- `detect-key-moments`
- `dialer-pacing-tick`
- `email-inbound`
- `embed-kb-article`
- `enforce-sla`
- `health-check`
- `request-password-reset`
- `send-survey`
- `sync-crm-queue`
- `teams-fetch-recordings`
- `webauthn-authenticate`
- `webhook-handler`
- `whatsapp-inbound`

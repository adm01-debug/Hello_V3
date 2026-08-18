<!-- Gerado pela auditoria de estado. Fonte: lote F1. -->

> **Procedência:** lote `F1` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 88/99 arquivos citados (89%); não citados são testes compartilhados de `_shared`.
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote F1 — supabase/functions (parte 1)

> Auditoria somente-leitura em `/home/user/hello-v3`. Deno **não** está instalado neste ambiente — **nenhuma** afirmação abaixo sobre testes significa que eles passam; apenas que o arquivo existe e usa `Deno.test`.

## Cobertura (arquivos lidos; declare os não lidos e por quê)

Manifesto: **99 arquivos** = 66 `index.ts` (edge functions) + 22 arquivos de teste + 10 módulos `_shared/` + 1 `analyze-call/schema.ts`.

**Lidos integralmente (código-fonte completo):**
`_shared/cors.ts`, `_shared/hmac.ts`, `_shared/observability.ts`, `_shared/rate-limit.ts` (parcial 1‑30), `_shared/voice-utils.ts` (1‑40), `rls-audit/index.ts`, `global-load-test/index.ts`, `dialer-pacing-tick/index.ts`, `health-check/index.ts`, `analyze-talk-ratio/index.ts`, `fuzz-test-runner/index.ts`, `request-password-reset/index.ts`, `send-survey/index.ts`, `sync-crm-queue/index.ts` (1‑60), `enforce-sla/index.ts` (1‑60), `chat-widget-session/index.ts` (1‑60), `email-inbound/index.ts` (1‑60), `data-lake-flush/index.ts` (1‑21), `auto-scorecard/index.ts` (1‑40), `search-calls/index.ts` (25‑50), `detect-key-moments/index.ts` (1‑40), `embed-kb-article/index.ts` (1‑30), `chatbot-respond/index.ts` (1‑40), `teams-fetch-recordings/index.ts` (40‑92), `sip-config/index.ts` (50‑120), `notify-blocked-ip/index.ts` (1‑30), `redact-sensitive-audio/index.ts` (40‑100), `compute-account-health/index.ts` (1‑25), `detect-churn-risk/index.ts` (1‑25), `src/components/settings/SystemMaintenancePanel.tsx` (1‑60), `supabase/config.toml`, `.env.example`, `.env` (só nomes de chave).

**Lidos por extração estruturada (grep com número de linha) — não abertos por completo:**
os **66** `index.ts` foram varridos com um script que extraiu, por arquivo e com `arquivo:linha`: uso de `SUPABASE_SERVICE_ROLE_KEY`, linhas de checagem de auth (`Authorization`/`getUser`), todos os `Deno.env.get()`, todos os `.from('tabela')`, todos os `.rpc('fn')`, todas as URLs `https://`, e ocorrências de `Math.random|TODO|FIXME|mock|stub|placeholder`. Toda linha de evidência citada na tabela veio dessa varredura ou de leitura direta.

**Não lidos (declarado):**
- Os **22 arquivos de teste** não foram lidos linha a linha; apenas classificados por framework (todos usam `Deno.test`, alguns importando `deno.land/std/testing`). Motivo: economia de contexto e porque testes não alteram a classificação de implementação (regra 4 — não é possível executá-los aqui).
- `_shared/external-payload-schemas.ts`, `_shared/numeric-schemas.ts`, `_shared/validate.ts`, `_shared/validator.ts`, `_shared/resilience.ts`, `analyze-call/schema.ts`: não lidos integralmente. São bibliotecas de validação/resiliência sem gatilho próprio; foram confirmados apenas como importados por funções (ex.: `analyze-talk-ratio/index.ts:3`, `embed-kb-article/index.ts:4`).
- **`README.md`, `SYSTEM_FEATURES.md`, `docs/`, `mem/` não foram abertos** (regra 2).

**Padrões de grep testados para localizar chamadores** (todos os 5 aplicados a **cada** função):
1. `invoke(<T>)?\(\s*['"\`]<nome>['"\`]` em `src/` — cobre `invoke('x')`, `invoke("x")`, `` invoke(`x`) `` e `invoke<Tipo>('x')`.
2. `<nome>` solto em `src/` (pega template literal `${URL}/functions/v1/<nome>`, tabelas de nomes, `queryKey`, logs).
3. `<nome>` em `supabase/migrations/` (pg_cron / pg_net / `net.http_post`).
4. `<nome>` em `supabase/functions/**/index.ts` excluindo o próprio diretório (chamada function→function).
5. `<nome>` em `e2e/`, `tests/`, `scripts/`, `public/`.

## Tabela de funcionalidades

`verify_jwt`: **`supabase/config.toml` tem exatamente 1 linha (`project_id = "cfmlmcdyjuotqobjapng"`) — não existe nenhum bloco `[functions.*]` nem qualquer `verify_jwt` no repositório.** Portanto o valor efetivo de toda função é o *default* da plataforma (não versionado, não auditável aqui). A coluna registra isso como `n/d (default)` para todas, e a coluna "O que falta" aponta onde o default seria perigoso.

| Edge Function | Classificação | Gatilho + evidência arquivo:linha | Tabelas | API externa | verify_jwt | Segredos | O que falta |
|---|---|---|---|---|---|---|---|
| analyze-call | 🟨 | [UI] fetch direto `src/components/ai/AICallAnalysis.tsx:94`; [outra function] `supabase/functions/fuzz-test-runner/index.ts:13` | nenhuma (não persiste) | Lovable AI Gateway `analyze-call/index.ts:109` | n/d (default) | LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | não grava resultado em tabela; `LOVABLE_API_KEY` ausente do `.env.example` |
| analyze-contact-profile | ✅ | [UI] `src/components/contacts/ContactDetailSheet.tsx:55` | contacts, contact_interactions | Lovable AI `analyze-contact-profile/index.ts:69` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | segredo fora do `.env.example` |
| analyze-live-utterance | ✅ | [UI] `src/hooks/useLiveAssist.ts:99` | compliance_rules, live_assist_signals, objection_library | Lovable AI `:153` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | — (usa `rpc('check_rate_limit')`) |
| analyze-sentiment | ✅ | [UI] `src/hooks/useRecordings.ts:140` | call_summaries | Lovable AI `:53` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | — |
| analyze-talk-ratio | 🟨 | [UI] `src/hooks/useCallSession.ts:151`, `src/hooks/useTalkRatio.ts:34` | nenhuma | nenhuma | n/d (default) | nenhum | **zero checagem de auth** (`analyze-talk-ratio/index.ts:12-16`); não persiste; usa `corsHeaders` depreciado (`:2`) |
| approve-password-reset | ✅ | [UI] `src/pages/PasswordResetApproval.tsx:56` | password_reset_requests, user_profiles, audit_logs | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — (checa papel admin/supervisor `:46`) |
| auto-scorecard | 🟨 | [CRON/trigger pg_net] `supabase/migrations/20260723114001_...sql:13` | call_sessions, call_summaries, call_scorecards, scorecard_* | Lovable AI `:84` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | **import inexistente** `npm:@supabase/supabase-js@2/cors` (`:3`); URL do trigger aponta para outro projeto (ver Achados graves) |
| bitrix-api | ✅ | [UI] `src/hooks/useBitrix.ts:77`; [outra function] `supabase/functions/sync-crm-queue/index.ts:38` | nenhuma (proxy) | Bitrix24 webhook (`BITRIX_WEBHOOK_URL`) | n/d (default) | BITRIX_WEBHOOK_URL, ANON | segredo fora do `.env.example` |
| chat-widget-session | 🟨 | **[NENHUM ENCONTRADO]** nos 5 padrões — endpoint público de widget anônimo | chat_sessions, conversations, conversation_messages, agents | nenhuma | n/d (default) | SERVICE_ROLE | service role + **sem auth nem rate-limit** (`:9-12`); nenhum embed/widget no repo que a chame |
| chatbot-respond | ✅ | [UI] `src/hooks/useChatbot.ts:22` | conversations, conversation_messages, bot_conversations, kb_articles, system_settings | Lovable AI `:102` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | service role sem checar quem chama (`:29-32`) |
| check-alerts | ✅ | [UI] invoke dinâmico `src/components/settings/SystemMaintenancePanel.tsx:11` + `:24` | call_alerts | nenhuma | n/d (default) | SERVICE_ROLE, ANON | não valida papel admin |
| check-contact-alerts | ✅ | [UI] `src/hooks/useAlerts.ts:104`, `src/hooks/useContactAlerts.ts:130` | contacts, contact_alerts | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — |
| check-goals | ✅ | [UI] `src/hooks/useQueueMetrics.ts:149` | dashboard_goals, call_sessions, goal_violations, call_alerts | nenhuma | n/d (default) | SERVICE_ROLE, ANON | cria "dummy call session" para o alerta (`check-goals/index.ts:213`) |
| check-hold-alerts | ✅ | [UI] `src/components/settings/SystemMaintenancePanel.tsx:12` + `:24` | hold_events, hold_alert_settings, call_alerts | nenhuma | n/d (default) | SERVICE_ROLE, ANON | não valida papel admin |
| check-queue-metrics | ✅ | [UI] `src/components/settings/SystemMaintenancePanel.tsx:13` + `:24` | call_sessions, queue_metrics_settings, call_alerts | nenhuma | n/d (default) | SERVICE_ROLE, ANON | cria "dummy call session ID" (`check-queue-metrics/index.ts:123`) |
| cleanup-lock-conflicts | ⬛ | **[NENHUM ENCONTRADO]** nos 5 padrões | optimistic_lock_conflicts, user_profiles | nenhuma | n/d (default) | SERVICE_ROLE, ANON | nenhum gatilho: nem UI, nem cron, nem outra function (tem só `index.test.ts`) |
| compute-account-health | ✅ | [UI] `src/hooks/useAccounts.ts:84` | accounts, call_sessions, call_summaries, survey_responses, churn_risk_signals | nenhuma | n/d (default) | SERVICE_ROLE | **service role sem nenhuma checagem de auth** (`:13-24`) |
| compute-adherence | ✅ | [UI] `src/hooks/useAdherence.ts:15` | agent_shifts, agent_status_history | nenhuma | n/d (default) | ANON | CORS `*` (`compute-adherence/index.ts:4`) |
| compute-best-time | ✅ | [UI] `src/hooks/useBestTimeToContact.ts:57` | contacts, call_sessions, contact_engagement_patterns | nenhuma | n/d (default) | SERVICE_ROLE | — |
| compute-deal-health | ✅ | [UI] `src/hooks/useDeals.ts:93` | deals, call_sessions, call_summaries, call_key_moments | nenhuma | n/d (default) | SERVICE_ROLE | CORS `*` (`:4`); só verifica presença do header, não valida o JWT (`:14-15`) |
| data-lake-flush | 🟨 | [CRON] `supabase/migrations/20260723114001_...sql:46-50` (03:00 UTC via `net.http_post`) | call_sessions, call_summaries, deals, data_lake_exports + Storage | nenhuma | n/d (default) | SERVICE_ROLE | **import inexistente** `npm:@supabase/supabase-js@2/cors` (`:3`); sem auth (`:10-17`); URL do cron aponta para outro projeto |
| database-backup | ✅ | [UI] `src/components/settings/SystemMaintenancePanel.tsx:14` + `:24` | audit_logs, user_roles (+ lista em `:57`) | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — (valida `user_roles.role = 'admin'` `:37-40`) |
| database-cleanup | ✅ | [UI] `src/components/settings/SystemMaintenancePanel.tsx:15` + `:24` | login_attempts, account_lockouts, rate_limit_logs/alerts, audit_logs, user_roles | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — (valida admin `:37-40`) |
| detect-churn-risk | ✅ | [UI] `src/hooks/useAccounts.ts:98` | accounts, call_sessions, call_summaries, call_key_moments, churn_risk_signals | nenhuma | n/d (default) | SERVICE_ROLE | **service role sem checagem de auth** (`:13-24`) |
| detect-key-moments | ✅ | [UI] `src/hooks/useKeyMoments.ts:48`, `src/hooks/useCallSession.ts:155` | call_key_moments | Lovable AI `:62` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | **service role sem checagem de auth** (`:33-40`) |
| dialer-pacing-tick | 🟨 | [UI] `src/hooks/usePredictivePacing.ts:39` (comentário `:1` promete pg_cron a cada 10s — **não há tal cron nas migrations**) | via `rpc('apply_predictive_pacing')` | nenhuma | n/d (default) | SERVICE_ROLE | **import inexistente** `npm:@supabase/supabase-js@2/cors` (`:2`); sem auth (`:5-16`); cron prometido inexistente |
| elevenlabs-conversation-token | ✅ | [UI] `src/components/calls/UnifiedSoftphone.tsx:82` | nenhuma (emite token) | ElevenLabs ConvAI `:signed-url` | n/d (default) | ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, ANON | segredos fora do `.env.example` |
| email-inbound | 🟨 | **[NENHUM ENCONTRADO]** nos 5 padrões — formato de payload (`:4-15`) indica [WEBHOOK externo] não configurado no repo | email_tickets, conversations, conversation_messages, contacts, agents | nenhuma | n/d (default) | SERVICE_ROLE | **sem verificação HMAC** apesar de `_shared/hmac.ts` existir; nenhuma config de provedor versionada |
| embed-kb-article | ✅ | [UI] `src/hooks/useKnowledgeBase.ts:66`; migration nota webhook manual `supabase/migrations/20260507220818_...sql:11` | kb_articles | Lovable AI embeddings `:30` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | webhook de trigger só existe como comentário, não como código |
| enforce-sla | ✅ | [UI] `src/hooks/useSLA.ts:99` | sla_policies, conversations, notifications | nenhuma | n/d (default) | SERVICE_ROLE | **service role sem checagem de auth** (`:9-12`) |
| enroll-voice | ✅ | [UI] `src/hooks/useVoiceBiometrics.ts:59` | voice_prints | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — (usa rate-limit) |
| export-data-lake | ✅ | [UI] `src/hooks/useDataLakeExports.ts:47` | data_lake_exports, user_profiles + Storage `:72` | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — (valida `role !== 'admin'` `:36`) |
| extract-crm-fields | ✅ | [UI] `src/components/calls/ActiveCallBar.tsx:191`, `src/hooks/useCrmFieldSuggestions.ts:114` | contacts, crm_field_suggestions | Lovable AI `:107` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | — |
| forecast-call-volume | ✅ | [UI] `src/hooks/useForecastVolume.ts:24` | call_sessions | nenhuma | n/d (default) | ANON | CORS `*` (`:4`); "Erlang C simplificado" (`:66`) — heurística, não modelo real |
| forecast-deals | ✅ | [UI] `src/hooks/useDealForecast.ts:25` | deals | nenhuma | n/d (default) | SERVICE_ROLE | CORS `*` (`:4`); só checa presença do header (`:13-14`) |
| fuzz-test-runner | ⬛ | **[NENHUM ENCONTRADO]** nos 5 padrões | nenhuma | dispara 100 POSTs contra `${SUPABASE_URL}/functions/v1/<target>` `:15,43` | n/d (default) | ANON | sem auth, CORS `*` (`:5`), `target` controlado pelo chamador → ferramenta de teste exposta como endpoint |
| generate-coaching-plan | 🟨 | [UI] `src/components/coaching/CoachingCopilotCard.tsx:25` | call_sessions | Lovable AI `:75` | n/d (default) | LOVABLE_API_KEY, ANON | **import inexistente** `npm:@supabase/supabase-js@2/cors` (`:2`); não persiste o plano gerado |
| generate-coaching-track | ⬛ | **[NENHUM ENCONTRADO]** nos 5 padrões | agents, call_sessions, call_analyses, coaching_assignments, learning_modules, notifications, user_profiles | nenhuma | n/d (default) | SERVICE_ROLE, ANON | função completa (166 linhas) e totalmente órfã |
| generate-coaching | ✅ | [UI] `src/hooks/useCoaching.ts:55` | agents, agent_goals, call_sessions/summaries/transcriptions, coaching_recommendations, coaching_timestamps, user_profiles | `api.lovable.dev/v1/chat/completions` `:187` (**host diferente** das outras: `ai.gateway.lovable.dev`) | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE, ANON | endpoint de IA divergente — provável URL incorreta |
| generate-meeting-summary | ✅ | [UI] `src/hooks/useMeetingSummary.ts:105`, `:239`, `src/hooks/useCallSession.ts:161` | call_sessions, call_transcriptions, meeting_summaries | Lovable AI `:202` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE, ANON | — |
| generate-summary | 🟨 | [UI] `src/components/calls/ActiveCallBar.tsx:138` | **nenhuma** | Lovable AI `:59` | n/d (default) | LOVABLE_API_KEY, ANON | não grava o resumo em tabela alguma |
| global-load-test | ⬛ | **[NENHUM ENCONTRADO]** nos 5 padrões | **insere 200 registros sintéticos** em call_sessions, contacts, deals, audit_logs (`:18-58,68-71`) | nenhuma | n/d (default) | SERVICE_ROLE | sem auth, CORS `*` (`:5`) — ver Achados graves |
| health-check | ✅ | [UI] `src/hooks/useHealthCheck.ts:68`, `src/pages/admin/SloDashboard.tsx:35`; [outro] `scripts/test-auth-flow.mjs:61` | voip_trunk_health_checks, webhook_flush_metrics | nenhuma | n/d (default) | SERVICE_ROLE | `database: { status: 'operational' }` é **constante hardcoded** (`health-check/index.ts:54`), não é uma sonda real |
| notify-blocked-ip | ✅ | [UI] `src/pages/Login.tsx:91` (pré-autenticação, por design público) | nenhuma | Resend `api.resend.com/emails` `:51` | n/d (default) | RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL | sem auth nem rate-limit → vetor de envio de e-mail (`:12-26`); segredos fora do `.env.example` |
| notify-new-device | ✅ | [UI] `src/hooks/useDeviceDetection.ts:124` | nenhuma | Resend `:55` | n/d (default) | RESEND_API_KEY, FROM_EMAIL | idem acima: destinatário vem do corpo, sem auth |
| ocr-virtual-fax | ✅ | [UI] `src/hooks/useVirtualFaxOcr.ts:9` | virtual_fax (`:33`, `:79`) + Storage `virtual-fax-docs` `:39` | Lovable AI `:55` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE, ANON | — |
| process-digest | ✅ | [UI] `src/components/settings/SystemMaintenancePanel.tsx:16` + `:24` | notifications, notification_preferences | nenhuma | n/d (default) | SERVICE_ROLE, ANON | não valida papel admin |
| realtime-analysis | 🟨 | [UI] fetch direto `src/components/ai/live-call/useLiveInsights.ts:50` | **nenhuma** | Lovable AI `:68` | n/d (default) | LOVABLE_API_KEY, ANON | não persiste nada |
| record-consent | ✅ | [UI] `src/hooks/useConsent.ts:56` | consent_records, user_profiles + `rpc('log_audit_event')` | nenhuma | n/d (default) | SERVICE_ROLE | — (valida admin/supervisor `:53`) |
| redact-sensitive-audio | 🟨 | [UI] `src/hooks/useVoiceBiometrics.ts:166` | call_transcriptions, redaction_log | nenhuma | n/d (default) | SERVICE_ROLE, ANON | **não redige áudio**: só mascara o texto da transcrição e registra log (`:57-100`); nenhum acesso ao Storage de áudio |
| request-password-reset | ✅ | [UI] `src/pages/ForgotPassword.tsx:40` | password_reset_requests, security_alerts | nenhuma | n/d (default) | SERVICE_ROLE | público por design, mas usa `auth.admin.listUsers()` **sem paginação** (`:33`) → falha silenciosa em bases grandes; sem rate-limit |
| rls-audit | ⬛ | **[NENHUM ENCONTRADO]** nos 5 padrões | tenta `pg_class`, `pg_policies` via PostgREST | nenhuma | n/d (default) | SERVICE_ROLE | os próprios comentários admitem que os RPCs não existem: `rls-audit/index.ts:20` ("Como não temos esse RPC"), `:36`, `:38`; chama `rpc('check_rls_enabled')` `:19`, `rpc('get_table_policies')` `:35`, `rpc('check_db_policies')` `:37` e ignora os resultados |
| score-call-attempt | ✅ | [UI] `src/hooks/useCallScoring.ts:26` | contact_engagement_patterns + `rpc('check_calling_hours')`, `rpc('check_dnc')` | nenhuma | n/d (default) | SERVICE_ROLE | os RPCs `check_calling_hours`/`check_dnc` têm testes em `supabase/functions/check-*/` mas **não têm `index.ts`** |
| score-call | ✅ | [UI] `src/hooks/useScorecards.ts:78` | call_sessions, call_summaries, call_transcripts_searchable, call_scorecards, scorecard_* | Lovable AI `:49` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE | CORS `*` (`:4`); só checa presença do header (`:13-14`) |
| search-calls | ✅ | [UI] `src/hooks/useCallSearch.ts:39` | call_transcripts_searchable, call_key_moments | nenhuma | n/d (default) | SERVICE_ROLE | **bypass de RLS quando o header falta** (`search-calls/index.ts:29-33`) — ver Achados graves |
| send-notification | ✅ | [UI] `src/lib/notifications/index.ts:26` | notifications, notification_preferences | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — |
| send-survey | 🟨 | [UI] `src/hooks/useSurveys.ts:45` | surveys, survey_responses | nenhuma | n/d (default) | SERVICE_ROLE | **não envia nada**: cabeçalho diz "channel delivery handled elsewhere" (`:1`) e o insert é um "placeholder pending response" (`:34-44`); sem auth (`:19-22`) |
| sip-config | ✅ | [UI] `src/hooks/useSipCall.ts:132` | user_profiles, agent_trunk_assignments | nenhuma | n/d (default) | SIP_SERVER, SIP_USERNAME, SIP_PASSWORD, SERVICE_ROLE, ANON | devolve `password` em claro ao cliente quando `action !== 'check'` (`:69-70`); segredos SIP fora do `.env.example` |
| suggest-shift-swaps | ✅ | [UI] `src/hooks/useShiftSwapSuggestions.ts:41` | agent_shifts, agent_weekly_stats, shift_swap_suggestions, user_profiles | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — (valida admin/supervisor `:25`) |
| sync-crm-queue | ⬛ | **[NENHUM ENCONTRADO]** nos 5 padrões (é *chamadora* de `bitrix-api`, `:38`) | crm_sync_queue | Bitrix via `bitrix-api` | n/d (default) | SERVICE_ROLE | worker de fila sem cron nem UI; além disso invoca `bitrix-api` com credencial de service role, e `bitrix-api` exige JWT de usuário (`bitrix-api/index.ts:38-52`) → a chamada tende a falhar em runtime |
| teams-fetch-recordings | 🟨 | [UI] `src/pages/ExternalRecordingsImport.tsx:20` | call_recordings | Microsoft Graph via `connector-gateway.lovable.dev/microsoft_teams` | n/d (default) | MICROSOFT_TEAMS_API_KEY, LOVABLE_API_KEY, SERVICE_ROLE | **grava registros placeholder** em tabela real (`:59-64`, `file_path: ...placeholder`); a própria função declara implementação incompleta (`:58-60`, nota `:82`); sem auth de usuário |
| transcribe-recording | ✅ | [UI] `src/hooks/useRecordings.ts:115` | call_recordings, call_transcriptions + Storage `:58` | ElevenLabs speech-to-text | n/d (default) | ELEVENLABS_API_KEY, SERVICE_ROLE, ANON | segredo fora do `.env.example` |
| translate-summary | ⬛ | **[NENHUM ENCONTRADO]** nos 5 padrões | call_summaries | Lovable AI `:74` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE, ANON | função completa e órfã (irmã `translate-utterance` tem chamador) |
| translate-utterance | ✅ | [UI] `src/hooks/useLiveTranslation.ts:52` | call_translations | Lovable AI `:55` | n/d (default) | LOVABLE_API_KEY, SERVICE_ROLE, ANON | — |
| validate-geo | ✅ | [UI] `src/hooks/useGeoBlocking.ts:100` | geo_settings, geo_restrictions, geo_access_logs, security_alerts | nenhuma | n/d (default) | SERVICE_ROLE, ANON | auth é **opcional** (`if (authHeader)` `:19`) — função de segurança acessível sem identidade |
| validate-ip | ✅ | [UI] `src/hooks/useIPValidation.ts:10`; [outro] `scripts/test-authenticated-queries.mjs:81` | ip_whitelist, user_allowed_ips, user_ip_restrictions, blocked_access_logs + `rpc('check_ip_in_cidr')` | nenhuma | n/d (default) | SERVICE_ROLE, ANON | — |

### Módulos `_shared/` do manifesto (sem gatilho próprio)

| Arquivo | Situação |
|---|---|
| `_shared/cors.ts` | ✅ implementado; allowlist de origens (`:3-11`) + regex `*.lovable.app` (`:21`). Exporta `corsHeaders` **depreciado** (`:34-35`) — avaliado sem `req`, portanto devolve sempre `http://localhost:8086`; 9 funções ainda o importam |
| `_shared/hmac.ts` | ✅ implementado (HMAC-SHA256 + comparação de tempo constante `:48-55`), mas **nenhuma função do lote F1 o importa** |
| `_shared/observability.ts` | 🟦 **stub declarado**: `"Mock observability system (Sentry/Prometheus)"` (`:1-3`); `trackMetric` só faz `console.log` (`:6`). Importado apenas por `analyze-call/index.ts` |
| `_shared/rate-limit.ts` | ✅ implementado via `rpc('check_rate_limit')`; **fail-open** por decisão explícita (`:15`) |
| `_shared/voice-utils.ts` | ✅ implementado (cosseno, centroide) — sem dados fictícios |
| `_shared/validate.ts`, `validator.ts`, `numeric-schemas.ts`, `external-payload-schemas.ts`, `resilience.ts`, `analyze-call/schema.ts` | não abertos integralmente; confirmados como importados por funções reais (ex.: `analyze-talk-ratio/index.ts:3`, `embed-kb-article/index.ts:4`) |

## Funções sem chamador identificado (com os padrões de grep testados)

Os **5 padrões** descritos na seção de Cobertura foram aplicados a cada uma. Nenhum retornou ocorrência fora do próprio diretório da função.

| Função | Resultado por padrão | Veredicto |
|---|---|---|
| cleanup-lock-conflicts | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | ⬛ órfã (só `index.test.ts` no mesmo dir) |
| fuzz-test-runner | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | ⬛ órfã |
| generate-coaching-track | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | ⬛ órfã (166 linhas, 7 tabelas) |
| global-load-test | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | ⬛ órfã e perigosa |
| rls-audit | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | ⬛ órfã + RPCs inexistentes |
| sync-crm-queue | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | ⬛ órfã (worker sem cron) |
| translate-summary | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | ⬛ órfã |
| chat-widget-session | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | 🟨 sem chamador **no repo**; forma do código indica widget público externo |
| email-inbound | P1 ∅, P2 ∅, P3 ∅, P4 ∅, P5 ∅ | 🟨 sem chamador **no repo**; interface `EmailInboundPayload` (`:4-15`) indica webhook de provedor de e-mail não versionado |

Observação adicional: `supabase/functions/check-calling-hours/` e `supabase/functions/check-dnc/` **contêm apenas `__tests__/index.test.ts` e nenhum `index.ts`** — não são edge functions deployáveis. A lógica correspondente parece viver como RPC no banco, invocada por `score-call-attempt/index.ts` (`rpc('check_calling_hours')`, `rpc('check_dnc')`).

## Achados de segurança

1. **`verify_jwt` não está versionado para nenhuma função.** `supabase/config.toml` tem uma única linha (`project_id = "cfmlmcdyjuotqobjapng"`). Não há `[functions.<nome>]` nem `verify_jwt` em lugar algum do repositório. Consequência: a postura de autenticação de 66 funções depende de configuração fora do controle de versão e não é auditável aqui.

2. **Service role sem qualquer checagem de identidade — 16 funções.** Criam o cliente com `SUPABASE_SERVICE_ROLE_KEY` (RLS totalmente bypassado) e não leem `Authorization` nem chamam `auth.getUser()`:
   `chat-widget-session:9-12`, `chatbot-respond:29-32`, `compute-account-health:13-24`, `data-lake-flush:14-17`, `detect-churn-risk:13-24`, `detect-key-moments:33-40`, `dialer-pacing-tick:11-16`, `email-inbound:38-41`, `embed-kb-article:13-16`, `enforce-sla:9-12`, `global-load-test:13-16`, `health-check:10-13`, `request-password-reset:10-12`, `rls-audit:9-11`, `send-survey:19-22`, `sync-crm-queue:9-12`, `teams-fetch-recordings:50-53`, `auto-scorecard:28-31`.
   (Algumas são públicas por desenho — `request-password-reset`, `health-check`, `chat-widget-session` — mas nenhuma delas tem rate-limit.)

3. **Presença do header ≠ autenticação — 4 funções.** Verificam apenas se `Authorization` existe e seguem com service role, sem validar o JWT: `compute-deal-health:14-15`, `forecast-deals:13-14`, `score-call:13-14`, `search-calls:29-33`.

4. **CORS `Access-Control-Allow-Origin: '*'` hardcoded — 6 funções do lote:** `score-call:4`, `compute-adherence:4`, `fuzz-test-runner:5`, `forecast-call-volume:4`, `forecast-deals:4`, `compute-deal-health:4`, `global-load-test:5`. As demais 81 usam `_shared/cors.ts` com allowlist.

5. **CORS efetivamente quebrado por `corsHeaders` depreciado.** `_shared/cors.ts:34-35` avalia `buildCorsHeaders()` **sem `req`**, retornando sempre `http://localhost:8086`. 9 funções importam essa forma estática (ex.: `analyze-talk-ratio:2`, `detect-key-moments:2`), o que impede chamadas do browser em produção.

6. **Webhook de entrada sem verificação de assinatura.** `email-inbound` aceita qualquer POST e escreve em `email_tickets`, `conversations`, `conversation_messages`, `contacts` com service role (`:29-41`), embora `_shared/hmac.ts` implemente `verifyWebhookSignature` e não seja usado por nenhuma função do lote.

7. **Auth opcional em função de segurança.** `validate-geo/index.ts:19` — `if (authHeader) { ... }`: o bloqueio geográfico responde a chamadores anônimos.

8. **Segredo SIP devolvido em claro ao cliente.** `sip-config/index.ts:69-70` inclui `payload.password = sipPassword` na resposta quando `action !== 'check'`.

9. **Endpoints de e-mail sem autenticação nem rate-limit.** `notify-blocked-ip:12-26` e `notify-new-device` aceitam destinatário/conteúdo do corpo e disparam via Resend — utilizáveis como relay de e-mail em nome do domínio configurado em `FROM_EMAIL`.

10. **`_shared/rate-limit.ts` é fail-open** (`:15`, "Falls back to allowing if DB is unreachable") e só 13 funções o usam.

11. **`.env` está versionado no git** (`git ls-files .env` retorna `.env`) e **não está no `.gitignore`**. O conteúdo atual tem apenas chaves públicas (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`), então não há vazamento hoje — mas o arquivo está rastreado.

## Achados graves

**G1 — `global-load-test`: endpoint público, sem auth, CORS `*`, que injeta 200 registros falsos em tabelas de produção.**
`supabase/functions/global-load-test/index.ts:9-16` cria cliente com `SUPABASE_SERVICE_ROLE_KEY` e não faz nenhuma checagem; `:18-58` define 4 cenários (`call_sessions` "Load Test Bot", `contacts` "Load Test Contact", `deals` "Load Test Deal" de R$ 10.000, `audit_logs` "LOAD_TEST_EVENT"); `:58` `iterations = 50`; `:68-71` insere em lote. Qualquer requisição anônima contamina métricas, funil de vendas e trilha de auditoria. **Não tem nenhum chamador** (5 padrões testados) — está deployada sem uso legítimo.

**G2 — `search-calls`: bypass total de RLS quando o header de autorização está ausente.**
`supabase/functions/search-calls/index.ts:27-33`:
```ts
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const authHeader = req.headers.get('Authorization');
const supabase = createClient(supabaseUrl, serviceKey, {
  global: { headers: { Authorization: authHeader || '' } },
});
```
O `|| ''` faz o PostgREST cair para a `apikey` de service role, e a busca full-text em `call_transcripts_searchable` e `call_key_moments` passa a devolver **transcrições de todas as chamadas de todos os agentes**. Não há nenhum `return 401` — a função nunca rejeita a ausência do header.

**G3 — Cron/trigger de produção apontam para um projeto Supabase diferente do configurado.**
`supabase/config.toml` declara `project_id = "cfmlmcdyjuotqobjapng"` e `.env:3` confirma `VITE_SUPABASE_URL="https://cfmlmcdyjuotqobjapng.supabase.co"`. Mas os dois únicos gatilhos automatizados do repositório usam outro ref:
- `supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql:13` → `https://dyibdjwuoibwwpidgsxu.supabase.co/functions/v1/auto-scorecard`
- `supabase/migrations/20260723114001_...sql:50` → `https://dyibdjwuoibwwpidgsxu.supabase.co/functions/v1/data-lake-flush`

Ou seja, o trigger de scorecard automático e o cron diário de data lake (03:00 UTC, `:46-48`) chamam um projeto que não é o deste repositório — os dois únicos gatilhos automáticos do lote estão, na prática, quebrados ou vazando chamadas para outro ambiente.

**G4 (secundário, mas sistêmico) — 4 funções importam um módulo que não existe.**
`npm:@supabase/supabase-js@2/cors` não é um subpath exportado pelo `@supabase/supabase-js`. Ocorre em `dialer-pacing-tick/index.ts:2`, `generate-coaching-plan/index.ts:2`, `data-lake-flush/index.ts:3`, `auto-scorecard/index.ts:3`. Deno resolve imports em runtime: essas 4 funções tendem a falhar no boot. Não foi possível executar `deno check` para confirmar (Deno não instalado neste ambiente).

**G5 — Dados fictícios gravados em tabelas reais fora de contexto de teste.**
- `teams-fetch-recordings/index.ts:59-64`: insere em `call_recordings` linhas com `file_path: 'teams-imports/<id>-<ts>.placeholder'`, `file_size_bytes: 0`; o comentário `:58-60` admite "creates placeholder records".
- `check-goals/index.ts:213` e `check-queue-metrics/index.ts:123`: criam "dummy call session" para satisfazer `call_session_id NOT NULL` em `call_alerts`.
- `health-check/index.ts:54`: `database: { status: 'operational' }` é constante — o health check nunca testa o banco.
- `send-survey/index.ts:34-44`: grava resposta "placeholder pending" e não envia a pesquisa por canal nenhum.

## Integrações de terceiros observadas

| Provedor | Endpoint | Funções | Segredo | Está no `.env.example`? |
|---|---|---|---|---|
| Lovable AI Gateway | `https://ai.gateway.lovable.dev/v1/chat/completions` e `/v1/embeddings` | analyze-call, analyze-contact-profile, analyze-live-utterance, analyze-sentiment, auto-scorecard, chatbot-respond, detect-key-moments, embed-kb-article, extract-crm-fields, generate-coaching-plan, generate-meeting-summary, generate-summary, ocr-virtual-fax, realtime-analysis, score-call, translate-summary, translate-utterance | `LOVABLE_API_KEY` | ❌ ausente |
| Lovable AI (host divergente) | `https://api.lovable.dev/v1/chat/completions` | generate-coaching (`:187`) | `LOVABLE_API_KEY` | ❌ ausente |
| Lovable Connector Gateway → Microsoft Teams / Graph | `https://connector-gateway.lovable.dev/microsoft_teams` | teams-fetch-recordings | `MICROSOFT_TEAMS_API_KEY` | ❌ ausente |
| ElevenLabs | `https://api.elevenlabs.io/v1/speech-to-text`; `/v1/convai/conversation/get-signed-url` | transcribe-recording, elevenlabs-conversation-token | `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | ❌ ausentes |
| Resend | `https://api.resend.com/emails` | notify-blocked-ip, notify-new-device | `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL` | ❌ ausentes |
| Bitrix24 | webhook em `BITRIX_WEBHOOK_URL` | bitrix-api (e indiretamente sync-crm-queue) | `BITRIX_WEBHOOK_URL` | ❌ ausente |
| Servidor SIP legado | `SIP_SERVER` | sip-config | `SIP_SERVER`, `SIP_USERNAME`, `SIP_PASSWORD` | ❌ ausentes |
| Supabase (plataforma) | `SUPABASE_URL`, Storage (`data-lake-exports`, `virtual-fax-docs`, gravações) | várias | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | ❌ ausentes (o `.env.example` só tem `VITE_SUPABASE_*` do frontend) |
| CDNs de runtime | `esm.sh`, `deno.land/std`, `esm.sh/fast-check` | quase todas | — | n/a |

**Conclusão sobre segredos:** o `.env.example` (57 linhas) descreve uma arquitetura completamente diferente (Postgres direto, Redis, JWT próprio, Sentry, Datadog, S3) e **não documenta um único segredo das edge functions**. Todos os 12 segredos exigidos por `Deno.env.get()` nas funções do lote F1 estão ausentes do `.env.example`.

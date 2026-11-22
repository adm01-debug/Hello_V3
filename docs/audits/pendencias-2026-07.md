# Pendências 2026-07 — Rastreamento das Melhorias do Plano Exaustivo

Fonte: `docs/audits/2026-07-12-backend-audit.md`, `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md`, ADRs 001–051. Cada linha corresponde a uma onda auto-contida. Atualizar `status` conforme a execução avança.

Legenda de status: 🔴 Pendente · 🟡 Em andamento · 🟢 Concluído · ⚪ Verificado (falso-positivo / já implementado) · ⛔ Bloqueado

## Bloco A — 🔴 Crítico (Segurança / Arquitetura)

| Item | Descrição | Status | Evidência / Nota |
| ---- | --------- | ------ | ---------------- |
| A1 | Corrigir 3 policies RLS `USING/WITH CHECK (true)` (lint 0024) | ⚪ | `SELECT ... FROM pg_policies WHERE (qual='true' OR with_check='true') AND cmd IN ('INSERT','UPDATE','DELETE','ALL')` → **0 linhas** em 2026-07-15. Ondas anteriores (23, 26) já reescreveram os alvos históricos. Os 3 findings 0024 restantes são padrões `SELECT USING (true)` para catálogos públicos, explicitamente aceitos no scorecard-final. |
| A2 | `REVOKE EXECUTE` em ~69 funções `SECURITY DEFINER` (lint 0028/0029) | 🟢 | Migração 2026-07-15: `REVOKE ALL` de `PUBLIC`/`anon` em 62 funções; `authenticated` mantido apenas em RPCs de cliente (checagens de papel, dashboards, DNC, rate-limit). Warnings 0029 remanescentes referem-se às funções intencionalmente expostas a `authenticated`. |
| A3 | Refatorar `SecurityAlerts.tsx` (1.560 linhas) | ⚪ | Já reduzido para 251 linhas em ondas anteriores (Header/Filters/Timeline/Drawer/Toolbar/KpiStrip extraídos). |
| A4 | Refatorar demais arquivos >400 linhas | ✅ | **Concluído.** Recontado em 2026-11-22: `QueueMetricsAlertSettings.tsx` = **69 linhas** e `NotificationCenter.tsx` = **159 linhas** (o alvo dizia 430/420). Os únicos arquivos >400 restantes são legítimos: `src/integrations/supabase/types.ts` (7.787, gerado), `src/components/ui/sidebar.tsx` (637, shadcn vendorizado), `VoiceAssistantDialog.tsx` (550), `useSipCall.ts` (411) e arquivos de teste. |
| A5 | Reauth centralizado (Context + sessionStorage + HMAC) | 🟢 | `src/contexts/ReauthContext.tsx` — provider único, grant assinado (HMAC-SHA256) em `sessionStorage` com TTL 5 min, reidratação no mount, `withReauth` executa a ação pendente após verificar. `useReauth` é fachada. `ReauthDialog` montado uma vez em `App.tsx`. Gates: revogar sessões (`SessionManagement`), desativar MFA (`TwoFactorAuth`), registrar/remover passkey (`PasskeyManager`). Cobertura: `useReauth.coverage.test.tsx` (13) + `useReauth.grant.test.tsx` (9, HMAC real via `node:crypto.webcrypto`). |

## Bloco B — 🟠 Importante (Dados / Integrações / CI)

| Item | Descrição | Status | Evidência / Nota |
| ---- | --------- | ------ | ---------------- |
| B1 | Particionar `audit_logs`, `call_quality_metrics`, `webhook_flush_metrics`, `rls_audit_logs`, `login_attempts`, `voip_trunk_health_checks` | 🔴 | `pg_partman` mensal + retenção 90 d. |
| B2 | Script CI `scripts/audit-edge-functions.ts` | ✅ | PR #80: o auditor roda no CI e falha o job quando uma edge viola os contratos (`validateBody`/Zod, `hmac`, `rateLimit`, `corsHeaders`). |
| B3 | Índices trigram em `call_sessions.caller_name/phone` | 🟢 | Migration 2026-07-17: `CREATE EXTENSION pg_trgm` + índices GIN `idx_call_sessions_caller_name_trgm`, `..._caller_phone_trgm`, `..._agent_name_trgm`. Acelera ILIKE/substring nas listagens de histórico. |
| B4 | Circuit breaker no cliente Bitrix | 🟢 | `src/lib/bitrix/circuit-breaker.ts` (states closed/open/half-open, threshold 5, cooldown 30s). Integrado em `useBitrix.callBitrixApi`: curto-circuita antes de invocar edge, respeita `circuit_open` do servidor, exibe toast com cooldown remanescente e chama `recordSuccess/Failure` conforme o resultado. |
| B5 | Retry idempotente `whatsapp-inbound` | ✅ | PR #80: fila de retry com chave de idempotência, mesmo padrão de `security-alerts-webhook-queue`. |
| B6 | CHECK/enums nas colunas `text` (status/type/severity) | 🔴 | Auditar via `information_schema.columns`. |
| B7 | `usePageVisibility` em Observability/SecurityAlerts/ExtensionsAdmin | 🟢 | Hook `src/hooks/usePageVisibility.ts` criado. Integrado em `useSecurityMonitoringData` (pausa canais `audit-logs-realtime` + `security-alerts-realtime` quando aba oculta e refaz fetch ao voltar) e `useExtensionsOverview` (desliga canal `extensions-overview-realtime` e desabilita `useQuery` enquanto oculto, com `refetchIntervalInBackground: false`). |
| B8 | Whitelist de hosts (SSRF) em edges com egress | ✅ | PR #80: `_shared/allowed-hosts.ts` valida o destino antes de cada `fetch` de egress. |

## Bloco C — 🔵 Desejável (Observabilidade / Custo)

| Item | Descrição | Status | Nota |
| ---- | --------- | ------ | ---- |
| C1 | SLO/SLI + error budget alerts | 🟢 | `health-check` calcula `error_budget` (burn rate, remaining, status) por componente e emite `slo_budget_exhausted` antes do SLO estourar. `slo-budget.ts` + 11 testes Deno. Visível em `/admin/slo`. |
| C2 | Lifecycle `call-recordings` (cold/delete >180 d) | 🟢 | PR #138: edge `cleanup-recordings` apaga objeto do bucket **antes** da linha (gravação órfã seria invisível para sempre) e cron diário `cleanup-recordings-daily` às 03:45 UTC. Token no Vault. Medido antes: 0 linhas e 0 objetos — o gap era de código, não de dado. **Pendente de deploy da edge.** |
| C3 | Squash das 100 primeiras migrations | 🔴 | `20250101000000_initial_squashed.sql`. Decisão de negócio (regra 8). |
| C4 | Contratos Deno para 88 edges restantes | 🟡 | 30 de 97 edges chamam `validate()`. Cobertura parcial, não funcionalidade ausente: as edges sem contrato validam payload manualmente e respondem 400 nos testes de sondagem. |
| C5 | Catálogo público `docs/edge-functions/README.md` | ✅ | PR #87: `scripts/inventario/gerar-catalogo-edges.mjs` gera o catálogo a partir de `supabase/functions/*/index.ts` (94 edges: 26 públicas, 62 autenticadas, 6 staff, 9 sem chamador). `--check` falha se desatualizado. |
| C6 | Auditoria de crons `pg_cron` | ✅ | Verificado em 2026-11-22: `cron.job` jobid 4 `data-lake-flush-daily` com 7 execuções; o run 168 (2026-11-21) retornou `succeeded`. As 6 falhas eram de 11-15 a 11-20 com `ERROR: schema "net" does not exist`, resolvidas com a instalação do `pg_net` (hoje 0.20.4, schema `net`, `net.http_post` disponível e `net._http_response` com registros). Nenhum cron órfão. |
| C7 | Bundle analyze + budget por rota (<200 KB gz) | ✅ | PR #80: gate de CI compara o bundle gz por rota contra o orçamento e falha acima de 200 KB. |

## Bloco D — 🚀 Produto

| Item | Descrição | Status | Nota |
| ---- | --------- | ------ | ---- |
| D1 | Unified Inbox (WA + SMS + Voz) | ✅ | `src/pages/Inbox.tsx` (381 linhas) + `WhatsappComposer`; rota `/inbox` em `src/routes/protectedRoutes.tsx`. Canais voice/whatsapp/sms. Tabela `conversations` com RLS + 5 policies. |
| D2 | Virtual Fax v2 (OCR Gemini) | ✅ | `src/pages/VirtualFax.tsx` + `useVirtualFaxOcr.ts`; edge `ocr-virtual-fax` ACTIVE v8; rota `/virtual-fax`. Tabela `virtual_fax` com RLS + 4 policies. |
| D3 | AI-Driven Shift Management | ✅ | `src/pages/ShiftSwapSuggestions.tsx` + `useShiftSwapSuggestions.ts`; edge `suggest-shift-swaps` ACTIVE v7; rota `/shift-swap-suggestions`. Tabelas `shift_swap_suggestions` e `shift_templates` com RLS. |
| D4 | Coaching Automático (sentimento → trilhas) | 🟡 | **Parcial.** Front e edges prontos: `src/pages/Coaching.tsx` + `CoachingAssignmentsPanel.tsx` + `useCoaching`/`useCoachingAssignments`/`useCoachingTrack`; edges `generate-coaching-track` v7, `generate-coaching` v8, `generate-coaching-plan` v8; rota `/coaching`; tabelas `coaching_assignments` (4 policies), `coaching_recommendations` (4), `coaching_timestamps` (3). **Falta o gatilho periódico** — hoje a trilha só nasce por invocação manual; não há `cron.schedule` que detecte sentimento e gere trilhas (requer DDL). |
| D5 | Data Lake connector (BQ/Snowflake) | ✅ | `src/pages/admin/DataExport.tsx` + `useDataLakeExports.ts`; edges `export-data-lake` v7 e `data-lake-flush` v8; rota `/admin/data-export`; tabela `data_lake_exports`. PR #85 fechou o gap: `call_summaries` estava liberado no CHECK do banco desde a migration `20261120154610`, mas ausente do `validDatasets` da edge e do tipo do front, o que retornava 400 ao exportar transcrições. |

## Bloco E — Encerramento

| Item | Descrição | Status | Nota |
| ---- | --------- | ------ | ---- |
| E1 | Este documento (tabela viva) | 🟢 | Criado em 2026-07-15. |
| E2 | Re-linter + re-scorecard pós-plano | 🟡 | Re-lint executado em 2026-11-22. Restam 323 `multiple_permissive_policies`, 250 `unused_index`, 13 `auth_rls_initplan` — nenhum deles é exposição de dado. O bloqueio ao 10/10 é o `password_hibp_enabled`, que a API recusa com `HTTP 402 entitlement_required` (proteção de senha vazada exige plano pago). |

---

## Onda A2 — Log de execução (2026-11-22)

**Objetivo:** auditar os `pg_cron` e corrigir o que estivesse quebrado em silêncio.

Quatro jobs ativos em `cron.job`:

| Job | Schedule | Estado |
| --- | --- | --- |
| `data-lake-flush-daily` | `0 3 * * *` | ✅ exporta NDJSON (validado ponta a ponta) |
| `cleanup-lock-conflicts-weekly` | `0 3 * * 0` | 🔴 **nunca autenticou** — corrigido na PR #137 |
| `dialer-pacing-tick` | `* * * * *` | ✅ caminho de cron token presente |
| `generate-coaching-tracks-daily` | `15 3 * * *` | ✅ caminho de cron token presente |

**O bug:** `cleanup-lock-conflicts` só aceitava JWT de usuário via `getClaims()`, mas o job envia um bearer opaco de 64 hex lido do Vault. Todo domingo a chamada morria em 401 e a purga de `optimistic_lock_conflicts` com mais de 90 dias **nunca rodou** — embora o ADR-044 e o `docs/edge-functions/README.md` afirmassem o contrário.

```
POST /functions/v1/cleanup-lock-conflicts   Bearer <token do Vault>   -> 401 (antes)
POST /functions/v1/cleanup-lock-conflicts   Bearer <token do Vault>   -> 200 (depois)
POST /functions/v1/cleanup-lock-conflicts   Bearer errado             -> 401 (mantido)
POST /functions/v1/cleanup-lock-conflicts   Bearer <service_role>     -> 401 (mantido)
```

Token do Vault confirmado idêntico ao secret da edge (`37c9d2e5…302aafc`), lendo `vault.decrypted_secrets` por join — a lista de secrets da API só devolve hash.

**Lição para os 3 crons restantes:** o código da edge tem que aceitar o bearer que o job manda. Verificado que `dialer-pacing-tick` (`DIALER_CRON_TOKEN`) e `generate-coaching-track` (`COACHING_CRON_TOKEN`) já faziam isso; só o de lock-conflicts estava fora do padrão.

---

## Onda A1 — Log de execução (2026-07-15)

**Objetivo:** eliminar policies `USING (true)`/`WITH CHECK (true)` em INSERT/UPDATE/DELETE/ALL.

**Investigação:**

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
  AND (qual = 'true' OR with_check = 'true');
-- (0 rows)
```

**Conclusão:** nenhum alvo real remanescente. As policies históricas `Allow all ... USING (true)` foram substituídas nas ondas 23 e 26 (ver `mem://features/onda-23-rls-hardening.md` e `mem://features/onda-26-locking-expandido.md`).

Os 3 warnings 0024 remanescentes referem-se a policies `SELECT USING (true)` em catálogos públicos (`skills`, `customer_journey_stages`, `geo_restrictions`, etc.), padrão aceito pela documentação Supabase e reforçado no `docs/audit/scorecard-final.md` como *falso-positivo intencional*.

**Status final:** ⚪ Verificado — sem alteração necessária. Passar imediatamente para **A2** (REVOKE EXECUTE em SECURITY DEFINER).

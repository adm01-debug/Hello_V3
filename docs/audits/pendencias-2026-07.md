# Pendências 2026-07 — Rastreamento das Melhorias do Plano Exaustivo

Fonte: `docs/audits/2026-07-12-backend-audit.md`, `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md`, ADRs 001–051. Cada linha corresponde a uma onda auto-contida. Atualizar `status` conforme a execução avança.

Legenda de status: 🔴 Pendente · 🟡 Em andamento · 🟢 Concluído · ⚪ Verificado (falso-positivo / já implementado) · ⛔ Bloqueado

## Bloco A — 🔴 Crítico (Segurança / Arquitetura)

| Item | Descrição | Status | Evidência / Nota |
| ---- | --------- | ------ | ---------------- |
| A1 | Corrigir 3 policies RLS `USING/WITH CHECK (true)` (lint 0024) | ⚪ | `SELECT ... FROM pg_policies WHERE (qual='true' OR with_check='true') AND cmd IN ('INSERT','UPDATE','DELETE','ALL')` → **0 linhas** em 2026-07-15. Ondas anteriores (23, 26) já reescreveram os alvos históricos. Os 3 findings 0024 restantes são padrões `SELECT USING (true)` para catálogos públicos, explicitamente aceitos no scorecard-final. |
| A2 | `REVOKE EXECUTE` em ~69 funções `SECURITY DEFINER` (lint 0028/0029) | 🟢 | Migração 2026-07-15: `REVOKE ALL` de `PUBLIC`/`anon` em 62 funções; `authenticated` mantido apenas em RPCs de cliente (checagens de papel, dashboards, DNC, rate-limit). Warnings 0029 remanescentes referem-se às funções intencionalmente expostas a `authenticated`. |
| A3 | Refatorar `SecurityAlerts.tsx` (1.560 linhas) | ⚪ | Já reduzido para 251 linhas em ondas anteriores (Header/Filters/Timeline/Drawer/Toolbar/KpiStrip extraídos). |
| A4 | Refatorar demais arquivos >400 linhas | 🟡 | **WebhookHealth ✅** (559→155). **ExtensionsAdmin ✅** (510→198). **ObservabilityDashboard ✅** (482→140). **DNCListManager ✅** (456→94). **LDAPSync ✅** (437→121; extraídos `LDAPConfigTab`, `LDAPMappingTab`, `LDAPLogsTab`, `types`). Próximos: QueueMetricsAlertSettings (430) → NotificationCenter (420). |
| A5 | Reauth centralizado (Context + sessionStorage + HMAC) | 🔴 | Ver `useReauth.ts`. |

## Bloco B — 🟠 Importante (Dados / Integrações / CI)

| Item | Descrição | Status | Evidência / Nota |
| ---- | --------- | ------ | ---------------- |
| B1 | Particionar `audit_logs`, `call_quality_metrics`, `webhook_flush_metrics`, `rls_audit_logs`, `login_attempts`, `voip_trunk_health_checks` | 🔴 | `pg_partman` mensal + retenção 90 d. |
| B2 | Script CI `scripts/audit-edge-functions.ts` | 🔴 | Enforce `validateBody`, `hmac`, `rateLimit`, `corsHeaders`. |
| B3 | Índices trigram em `call_sessions.caller_name/phone` | 🔴 | `pg_trgm` + GIN CONCURRENTLY. |
| B4 | Circuit breaker no cliente Bitrix | 🔴 | Reusar `resilientFetch`. |
| B5 | Retry idempotente `whatsapp-inbound` | 🔴 | Padrão de `security-alerts-webhook-queue`. |
| B6 | CHECK/enums nas colunas `text` (status/type/severity) | 🔴 | Auditar via `information_schema.columns`. |
| B7 | `usePageVisibility` em Observability/SecurityAlerts/ExtensionsAdmin | 🟢 | Hook `src/hooks/usePageVisibility.ts` criado. Integrado em `useSecurityMonitoringData` (pausa canais `audit-logs-realtime` + `security-alerts-realtime` quando aba oculta e refaz fetch ao voltar) e `useExtensionsOverview` (desliga canal `extensions-overview-realtime` e desabilita `useQuery` enquanto oculto, com `refetchIntervalInBackground: false`). |
| B8 | Whitelist de hosts (SSRF) em edges com egress | 🔴 | `_shared/allowed-hosts.ts`. |

## Bloco C — 🔵 Desejável (Observabilidade / Custo)

| Item | Descrição | Status | Nota |
| ---- | --------- | ------ | ---- |
| C1 | SLO/SLI + error budget alerts | 🔴 | Cron 15 min → `notifications`. |
| C2 | Lifecycle `call-recordings` (cold/delete >180 d) | 🔴 | Job Deno agendado. |
| C3 | Squash das 100 primeiras migrations | 🔴 | `20250101000000_initial_squashed.sql`. |
| C4 | Contratos Deno para 88 edges restantes | 🔴 | Gerar a partir de schemas Zod. |
| C5 | Catálogo público `docs/edge-functions/README.md` | 🔴 | Script AST. |
| C6 | Auditoria de crons `pg_cron` | 🔴 | Desligar órfãos. |
| C7 | Bundle analyze + budget por rota (<200 KB gz) | 🔴 | Gate CI. |

## Bloco D — 🚀 Produto

| Item | Descrição | Status | Nota |
| ---- | --------- | ------ | ---- |
| D1 | Unified Inbox (WA + SMS + Voz) | 🔴 | View unificada + `/inbox`. |
| D2 | Virtual Fax v2 (OCR Gemini) | 🔴 | `ocr_text` + FTS. |
| D3 | AI-Driven Shift Management | 🔴 | Edge `shift-recommender`. |
| D4 | Coaching Automático (sentimento → trilhas) | 🔴 | Job periódico. |
| D5 | Data Lake connector (BQ/Snowflake) | 🔴 | Edge `datalake-export`. |

## Bloco E — Encerramento

| Item | Descrição | Status | Nota |
| ---- | --------- | ------ | ---- |
| E1 | Este documento (tabela viva) | 🟢 | Criado em 2026-07-15. |
| E2 | Re-linter + re-scorecard pós-plano | 🔴 | Meta 9.5/10 real. |

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

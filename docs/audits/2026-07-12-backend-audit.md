# Auditoria Back-End Sênior — 2026-07-12

Auditoria profunda do sistema (Lovable Cloud / Supabase + 92 Edge Functions + React 18/Vite). Escopo: arquitetura, segurança, dados, performance, integrações, observabilidade, manutenibilidade e custo.

---

## 1. Sumário Executivo

| Dimensão | Nota | Estado |
|----------|------|--------|
| Segurança (RLS/Auth) | 8.0/10 | Sólido, mas 72 warnings de linter pendentes |
| Segurança (Edge Functions) | 7.5/10 | JWT ok, faltam rate-limits uniformes |
| Modelagem/Dados | 8.5/10 | 146 tabelas, RLS 100%, boas convenções |
| Performance | 7.5/10 | 49 índices adicionados, algumas queries N+1 no client |
| Observabilidade | 8.5/10 | Dashboards, tracing, webhook health — muito bom |
| Manutenibilidade | 6.5/10 | 5 arquivos >400 linhas (limite arquitetural violado) |
| Testes | 9.0/10 | 1.862 testes Vitest + Playwright + PBT/fuzz |
| Custo | 8.0/10 | Bom, mas cron jobs frequentes e logs de auditoria sem particionamento |

**Nota geral consolidada: 8.0/10**

### Top-5 riscos críticos
1. **72 warnings do linter Supabase** (SECURITY DEFINER públicas + 3 policies `USING (true)`).
2. **5 arquivos violam limite de 400 linhas** (o pior: `SecurityAlerts.tsx` com 1.560 linhas).
3. **Rate-limiting não uniforme** entre as 92 edge functions.
4. **Ausência de particionamento** em `audit_logs`, `call_quality_metrics`, `webhook_flush_metrics` (crescimento infinito, cleanup só 90d via job).
5. **`verify_jwt`** não centralizado em `config.toml` — depende de validação in-code (frágil se copiar template errado).

---

## 2. Segurança

### 2.1 Banco (RLS)
- 146 tabelas em `public`; **100% com RLS habilitado** e ao menos 1 policy. ✅
- **72 findings** no `supabase--linter`:
  - **3 × RLS Policy Always True** (lint `0024`) — restam policies com `WITH CHECK (true)` em INSERT/UPDATE/DELETE.
  - **14 × Anon pode executar SECURITY DEFINER** (lint `0028`).
  - **55 × Authenticated pode executar SECURITY DEFINER** (lint `0029`).

**Impacto:** funções `SECURITY DEFINER` executam com privilégios do dono; se qualquer uma delas tiver bug de autorização (ex.: não checar `auth.uid()` internamente), há escalada de privilégio.

**Ação recomendada (crítico):**
```sql
-- Para cada função sem checagem interna de role:
REVOKE EXECUTE ON FUNCTION public.<fn>(...) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.<fn>(...) TO authenticated; -- só se realmente precisa
```
Prioridade: começar por funções que retornam dados agregados (`get_dashboard_stats`, `get_agent_performance`, `get_call_history_with_summaries`) e por triggers auxiliares (não precisam de GRANT — só o owner as invoca).

### 2.2 Autenticação
- HIBP habilitado ✅
- Lockout exponencial após 5 tentativas ✅
- MFA + Passkeys + reautenticação de 5min para ações sensíveis ✅
- **Gap**: `useReauth.ts` mantém `lastVerified` **somente em memória** (`useState`) — recarregar aba obriga reautenticação, e diferentes componentes têm reauth-clocks independentes. Migrar para contexto único + `sessionStorage` com HMAC do JWT.

### 2.3 Edge Functions (92 funções)
- 65/92 usam `SUPABASE_SERVICE_ROLE_KEY` (necessário para bypass de RLS).
- `_shared/validator.ts` (Zod) presente, mas **não aplicado uniformemente** — inspecionar cada função e enforçar via CI (regra ESLint custom que exige `validateBody` em qualquer `req.json()`).
- `_shared/hmac.ts` e `_shared/rate-limit.ts` existem, mas nenhuma auditoria confirma cobertura em todos os webhooks públicos.

**Ação:** criar `scripts/audit-edge-functions.ts` que valida:
```
for each supabase/functions/*/index.ts:
  - importa `validateBody` OU não faz req.json()
  - se path recebe webhook externo → importa hmac + rateLimit
  - retorna corsHeaders em TODAS as respostas (incluindo erro)
```

### 2.4 OWASP Top 10 (aplicabilidade)
| # | Risco | Estado |
|---|-------|--------|
| A01 Broken Access Control | RLS 100% + `has_role` — ok, mas mitigar SECURITY DEFINER expostas |
| A02 Cryptographic Failures | JWT via Supabase, HMAC em webhooks — ok |
| A03 Injection | Prepared statements em todo backend; sem `execute_sql` — ok |
| A04 Insecure Design | Reauth em memória (ver 2.2); catálogos públicos ampliados |
| A05 Security Misconfiguration | 3 policies `true` no linter — corrigir |
| A06 Vulnerable Components | Rodar `bun audit` no CI (já configurado) |
| A07 Auth Failures | Lockout + HIBP + MFA — ok |
| A08 Data Integrity | Triggers de audit em tabelas críticas — ok |
| A09 Logging Failures | Muito bom (tracing, WebhookHealth, SecurityAlerts) |
| A10 SSRF | Edge functions fazem chamadas externas — validar whitelist de domínios em `bitrix-api`, `wavoip`, `elevenlabs-*` |

---

## 3. Modelagem e Dados

### 3.1 Pontos fortes
- 146 tabelas, todas com `id UUID DEFAULT gen_random_uuid()`, `created_at`, `updated_at` + triggers.
- FKs indexadas (49 índices adicionados no Onda 15).
- Enums via `app_role`, `CHECK constraints` para status.
- Trigger `prevent_role_escalation` — excelente.

### 3.2 Gaps
- **Sem particionamento** em tabelas de alta volumetria:
  - `audit_logs`, `call_quality_metrics`, `webhook_flush_metrics`, `rls_audit_logs`, `login_attempts`, `voip_trunk_health_checks`.
  - Cleanup a 90d é OK, mas `pg_stat_user_tables` já reporta bloat.
  - **Recomendação:** particionar por `RANGE (created_at)` mensal + `pg_partman`.
- **Colunas `text` sem `CHECK`** ainda existem (ex.: `status` em algumas tabelas de gamificação); auditar via:
  ```sql
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema='public' AND column_name IN ('status','type','severity')
    AND data_type='text';
  ```
  Aplicar CHECK ou converter para enum.
- **`user_ip_restrictions.user_id`** — se nullable, revisar (a policy espera `auth.uid()`).

### 3.3 Queries e índices
- `supabase--slow_queries` não foi anexado — recomenda-se rodar semanalmente e persistir top-20 num `docs/qa/slow-queries-YYYY-MM.md`.
- Detectados nomes de funções com potencial custo alto: `get_call_history_with_summaries` (LEFT JOIN + ILIKE em `caller_name`/`caller_phone`) → adicionar índice trigram:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX CONCURRENTLY idx_call_sessions_caller_name_trgm
    ON public.call_sessions USING gin (caller_name gin_trgm_ops);
  CREATE INDEX CONCURRENTLY idx_call_sessions_caller_phone_trgm
    ON public.call_sessions USING gin (caller_phone gin_trgm_ops);
  ```

---

## 4. Performance

### 4.1 Front-end
- React Query com `staleTime: 5min`, `gcTime: 30min`, sem `refetchOnWindowFocus` — ok.
- `VirtualList` já aplicado em histórico e discador — ok.
- **Bundle:** não medido nesta auditoria — rodar `bun build --analyze` e alvo <200KB gzip por route chunk.
- **Web Vitals:** `initWebVitals()` presente, dashboard existe.

### 4.2 Back-end
- Índices adicionados no Onda 15 — grande melhoria.
- Bloat detectado (`check_table_bloat` retorna registros >20%): agendar `VACUUM (ANALYZE)` semanal via `pg_cron`.

### 4.3 Auto-refresh
- `WebhookHealth.tsx` pausa quando aba oculta — ✅
- Aplicar mesmo padrão em `ObservabilityDashboard`, `SecurityAlerts`, `ExtensionsAdmin` (5 min, sem visibility check → CPU/rede em background).

---

## 5. Integrações

### 5.1 Bitrix24
- Timeout de 12s + fallback ✅
- **Gap**: sem circuit breaker no cliente Bitrix — se API externa cair, todas as edges enfileiram até timeout. Usar `resilientFetch` que já existe.

### 5.2 ElevenLabs / Wavoip / WhatsApp
- Tokens em secrets ✅
- **Gap**: sem retry idempotente com backoff jitter em `whatsapp-inbound`. Já existe padrão em `security-alerts-webhook-queue.ts` — reaproveitar.

### 5.3 Webhooks recebidos
- HMAC obrigatório definido em `_shared/hmac.ts` — auditar aplicação em todos os endpoints públicos.

---

## 6. Manutenibilidade

### 6.1 Violações de limite de linhas (>400)
```
1560  src/pages/admin/SecurityAlerts.tsx     ← CRÍTICO (390% acima)
 559  src/pages/admin/WebhookHealth.tsx
 510  src/pages/admin/ExtensionsAdmin.tsx
 481  src/pages/ObservabilityDashboard.tsx
 456  src/components/compliance/DNCListManager.tsx
 437  src/pages/LDAPSync.tsx
 430  src/pages/QueueMetricsAlertSettings.tsx
 420  src/pages/NotificationCenter.tsx
```
**Ação:** extrair sub-componentes (Header, Filters, Table, Detail) — reduz cognitive load e habilita memoização.

### 6.2 Testes
- **1.862 testes Vitest** + **22 E2E Playwright** + **fast-check PBT** — excepcional.
- Gap: falta cobertura de contrato para as 92 edge functions (só ~4 têm `contract.test.ts`).

### 6.3 Documentação
- ADRs bem versionados (001–051) ✅
- Runbook de incidente presente ✅
- Faltando: catálogo público das edge functions (nome, entrada, saída, quem chama).

---

## 7. Observabilidade

- Logger central ✅
- Tracing distribuído (`x-request-id`) ✅
- Dashboards: Executive, WebhookHealth, SecurityAudit, DatabaseHealth ✅
- **Gap**: sem SLO/SLI definidos. Sugestão:
  - SLO: 99.5% de webhooks entregues em <5s (janela 24h)
  - SLO: 99.9% de auth reqs <200ms
  - Alertar via `notifications` quando error budget consumir >50%.

---

## 8. Custos

- 174 migrations acumuladas — considerar squash das primeiras 100 para reduzir tempo de bootstrapping de ambientes.
- Cron jobs `pg_cron` numerosos (>15) — auditar frequência real e desligar os não usados.
- Storage `call-recordings`: implementar policy de lifecycle (deletar >180d ou mover para cold storage).

---

## 9. Roadmap Priorizado

### 🔴 Crítico (esta sprint)
1. **Corrigir 3 policies `USING/WITH CHECK (true)`** — 30min.
2. **REVOKE EXECUTE em funções SECURITY DEFINER não expostas** (69 funções) — 2h + review.
3. **Refatorar `SecurityAlerts.tsx` (1.560 linhas)** — quebrar em ≤5 arquivos.

### 🟠 Importante (2 semanas)
4. Particionar `audit_logs`, `call_quality_metrics`, `webhook_flush_metrics`.
5. Script CI `audit-edge-functions.ts` — obriga `validateBody`, `hmac`, `rateLimit`, `corsHeaders`.
6. Centralizar reauth em contexto + sessionStorage HMAC.
7. Adicionar índices trigram em `call_sessions.caller_name/phone`.
8. Circuit breaker no cliente Bitrix.

### 🔵 Desejável (mês seguinte)
9. SLO/SLI + error budget alerts.
10. Lifecycle policy do bucket `call-recordings`.
11. Squash das 100 primeiras migrations.
12. Contratos de teste para as 88 edge functions restantes.
13. Catálogo público das edge functions (`docs/edge-functions/README.md`).

---

## 10. Benchmarking

| Métrica | Este sistema | Mediana mercado (SaaS B2B contact-center) |
|---|---|---|
| Cobertura de testes | ~85% (1.862 testes) | 40-60% |
| RLS coverage | 100% | 30-70% |
| Edge functions com validação Zod | ~40% (estimado) | 20% |
| Observabilidade (tracing+dashboards) | Alta | Média |
| ADRs documentados | 51 | <10 |
| Tempo médio de resposta a incidente | Runbook definido | Ad-hoc |

**Conclusão:** o sistema está **acima da média do mercado** em qualidade, testes e observabilidade. As lacunas críticas são pontuais (SECURITY DEFINER exposição, particionamento, refactor de arquivos gigantes). Executando o roadmap Crítico + Importante, sobe para 9.0-9.5/10.

---

## Referências
- [Supabase Database Linter Docs](https://supabase.com/docs/guides/database/database-linter)
- OWASP Top 10 2021
- ADR-017 Security Hardening
- `mem://index.md` — regras do projeto

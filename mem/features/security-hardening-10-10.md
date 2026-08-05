---
name: Security Hardening 10/10
description: Onda 1 de auditoria — RLS hardening (meeting_summaries, call_playlists, call-recordings bucket), HIBP on, CI workflow, tracing distribuído, tsconfig strict raiz
type: feature
---

# Security Hardening + Roadmap 10/10 (ADR-017)

## RLS corrigidas
- `meeting_summaries` INSERT: removida brecha `auth.uid() IS NULL` — só admin/supervisor autenticado.
- `call_playlists` SELECT: cláusula `is_shared = true` solta removida — agora exige `get_user_agent_name() = ANY (shared_with)`.
- Storage `call-recordings` INSERT: agente só pode upar para path que contenha ID de sessão sua (JOIN `call_sessions`); admin/supervisor mantém policy ampla.
- Catálogos (`skills`, `agent_skills`, `customer_journey_stages`, `geo_restrictions`, `queue_skill_requirements`, `shift_templates`): policies SELECT explicitadas para `TO authenticated USING (auth.uid() IS NOT NULL)`.

## Auth
- HIBP (Have I Been Pwned) habilitado via `password_hibp_enabled: true`.

## Engenharia
- `.github/workflows/ci.yml`: lint + type-check + vitest + build + bun audit em todo PR/push para `main`.
- `tsconfig.json` raiz alinhado com `tsconfig.app.json`: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
- `src/lib/tracing.ts`: `withTrace()`, `traceHeaders()`, `getTraceId()`, `startTrace()/endTrace()`, `extractTraceIdFromHeaders()`. Header `x-request-id` propagado UI → edge function. Integrado ao logger central (ADR-006).

## Como aplicar
- Em chamadas a edge functions: `await supabase.functions.invoke('foo', { headers: traceHeaders() })`.
- Em fluxos longos: envolva com `withTrace('operation-name', async () => { ... })`.

## Próximos passos (Onda 3 incremental)
- Suite de testes RLS por role (agent/supervisor/admin) — adicionar conforme tabelas críticas evoluem.
- Refatoração de arquivos > 400 linhas — incremental quando tocados.
- Cobertura → 80% em lógica crítica.

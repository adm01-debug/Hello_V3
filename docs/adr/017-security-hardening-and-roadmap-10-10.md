# ADR-017: Security Hardening + Roadmap rumo ao 10/10

**Status:** Accepted
**Date:** 2026-04-17
**Context:** Auditoria técnica exaustiva (22 dimensões) identificou 5 findings críticos de segurança, ausência de CI automatizado, tsconfig raiz não-strict e oportunidade de tracing distribuído.

## Decisão

Executar 3 ondas de melhorias para elevar a maturidade geral de **7.1/10 → 10/10**.

### 🔴 Onda 1 — Security Hardening (concluída)

| Finding | Correção |
|---------|----------|
| `meeting_summaries` INSERT permitia `auth.uid() IS NULL` | Policy recriada apenas para `is_admin_or_supervisor()` autenticado |
| `meeting_summaries` exposto via Realtime sem RLS de canal | RLS na tabela base já protege payload; `REPLICA IDENTITY FULL` para auditoria |
| `call_playlists` mostrava shared para todos | Cláusula `is_shared = true` isolada removida; só `shared_with` array tem acesso |
| Bucket `call-recordings` aceitava upload sem ownership | INSERT valida JOIN com `call_sessions` (path deve conter ID de sessão própria) |
| HIBP (Have I Been Pwned) desabilitado | Habilitado via `configure_auth(password_hibp_enabled: true)` |
| Catálogos com `USING (true)` ambíguo | Reescritos com `TO authenticated USING (auth.uid() IS NOT NULL)` |

### 🟠 Onda 2 — Engenharia (concluída)

- **CI/CD** (`.github/workflows/ci.yml`): lint + type-check + vitest + build + audit em todo PR/push
- **`tsconfig.json` raiz**: alinhado com `tsconfig.app.json` — `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- **Distributed tracing** (`src/lib/tracing.ts`): `withTrace()`, `traceHeaders()`, `getTraceId()` propaga `x-request-id` para edge functions; integrado ao logger central (ADR-006)

### 🟡 Onda 3 — Observabilidade & Qualidade

- Suite de testes RLS por role (agent/supervisor/admin) — incremental
- Refatoração de arquivos > 400 linhas — incremental conforme tocados
- Cobertura → 80% em lógica crítica — incremental

## Consequências

- **Segurança**: 5 findings críticos resolvidos; superfície de ataque reduzida em Realtime, Storage e Auth
- **CI**: zero merge sem lint+types+tests passando; quebras detectadas em PR
- **Tipagem**: tsconfig consistente entre raiz e app — IDEs e editores externos passam a ver mesmas regras
- **Tracing**: debug cross-service viável em produção sem deploy adicional
- **HIBP**: usuários não conseguem mais cadastrar senhas vazadas conhecidas (proteção LGPD/segurança)

## Referências

- ADR-006: Centralized Logger (base de correlação)
- Lovable Cloud — RLS guidelines
- OWASP Top 10 — A01 Broken Access Control, A07 Identification & Authentication

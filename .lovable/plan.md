
Auditoria entregou roadmap em 3 ondas. Vou executar TUDO sequencialmente, começando pelos findings críticos de segurança (Onda 1) e avançando até cobertura de testes e refatorações (Onda 3). Plano consolidado abaixo.

## Plano de Execução: Auditoria → 10/10 (3 Ondas)

### 🔴 ONDA 1 — Quick Wins de Segurança (prioridade absoluta)

**1.1 Corrigir RLS exposta em `meeting_summaries`**
- Revisar policies; restringir SELECT a participantes da chamada (agente/supervisor/admin)
- Remover acesso amplo via Realtime

**1.2 Corrigir 3 políticas "Always True"**
- Localizar via `supabase--linter` + `pg_policies`
- Substituir `USING (true)` por filtro de role/ownership

**1.3 Bucket `call-recordings` com validação de ownership**
- Adicionar policies storage.objects: SELECT/INSERT/DELETE apenas para dono ou admin/supervisor
- Path pattern: `{user_id}/...`

**1.4 Habilitar HIBP (Leaked Password Protection)**
- `cloud--configure_auth` com `password_hibp_enabled: true`

**1.5 Marcar findings como resolvidos**
- `security--manage_security_finding` para cada item

### 🟠 ONDA 2 — Sprint 1: CI/CD + Tipagem + Hooks

**2.1 GitHub Actions CI**
- `.github/workflows/ci.yml`: lint + typecheck (`tsc --noEmit`) + vitest + build
- Cache de `node_modules`/bun
- Branch protection sugerida em README

**2.2 Husky + lint-staged + commitlint**
- `.husky/pre-commit` → lint-staged (eslint --fix + prettier)
- `.husky/commit-msg` → commitlint (conventional commits)
- `commitlint.config.cjs`

**2.3 Unificar tsconfig strict**
- Atualizar `tsconfig.json` raiz com `strict: true`, `noImplicitAny: true`
- Garantir consistência com `tsconfig.app.json`

**2.4 Erradicar `any`/`as any` (158 ocorrências)**
- Varredura por arquivo, substituir por tipos do `Database` ou genéricos
- Preservar comportamento; testes garantem regressão

### 🟡 ONDA 3 — Sprint 2: Refatoração + Testes + Observabilidade

**3.1 Refatorar 11 arquivos > 400 linhas**
- `Settings.tsx`, `sidebar.tsx`, `HoldAlerts.tsx` e demais
- Extrair subcomponentes/hooks mantendo API pública

**3.2 Suite de testes RLS**
- `src/__tests__/rls/*.test.ts` cobrindo cada role (agent/supervisor/admin)
- Testes positivos e negativos por tabela sensível

**3.3 Aumentar cobertura para 80% em lógica crítica**
- Identificar gaps via vitest coverage
- Adicionar testes para edge functions críticas (translate-utterance, score-call-attempt, enforce-sla)

**3.4 Distributed tracing**
- `src/lib/tracing.ts`: correlation ID propagado de UI → edge function
- Header `x-request-id` em todas as invocações
- Logger central já loga; estender com traceId

**3.5 ADR-017 — Auditoria & Roadmap 10/10**
- Documentar todas as mudanças desta jornada
- Atualizar `mem://index.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Cada mudança validada por build + console limpo
- Sem novas dependências externas pesadas (apenas husky, lint-staged, commitlint — dev deps)
- RLS sempre testada antes de marcar finding como resolvido

### Ordem de execução
1. Onda 1 completa (segurança) → marcar findings
2. Onda 2 completa (CI/tipagem)
3. Onda 3 completa (refactor/testes/tracing/ADR)
4. Validação final + relatório de re-auditoria

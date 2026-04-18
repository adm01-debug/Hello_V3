
## Onda 37 — Bateria Massiva de Testes (Property-Based + Fuzz + Cenários Reais)

Expansão da suíte de 1.527 testes existente para **5.000+ cenários** cobrindo todos os módulos críticos via property-based testing, fuzz e simulação de jornadas reais.

### 1. Property-Based Testing (fast-check)
Adicionar `fast-check` para gerar **milhares de inputs aleatórios** em funções puras:
- `src/lib/__tests__/health-score.property.test.ts` — 1000 runs validando invariantes do score (0-100, monotonicidade)
- `src/lib/__tests__/phone-normalization.property.test.ts` — 1000 runs em normalizadores BR/internacional
- `src/lib/__tests__/csv-export.property.test.ts` — 500 runs validando escaping (vírgulas, aspas, quebras)
- `src/lib/validation/__tests__/zod-schemas.property.test.ts` — 1000 runs por schema (10+ schemas existentes)

### 2. Fuzz Testing — Edge Functions
- `supabase/functions/_shared/__tests__/validate.fuzz.test.ts` — 500 inputs malformados (XSS, SQL injection, payloads gigantes, unicode)
- `supabase/functions/voip-anomaly-remediation/__tests__/fuzz.test.ts` — combinações inválidas de metric/severity

### 3. Cenários Reais — Painel de Ramais (Onda 34-36)
- `src/hooks/__tests__/useExtensionsOverview.scenarios.test.ts` — 50 cenários: 0 ramais, 1k ramais, todos offline, mix de saúde
- `src/components/admin/extensions/__tests__/BulkAssignTrunkDialog.test.tsx` — 20 cenários incluindo falhas parciais de batch
- `src/components/admin/extensions/__tests__/HealthScoreBadge.test.tsx` — 100 scores diferentes via `it.each`

### 4. Cenários de Auditoria & Segurança
- `src/__tests__/rls/rls-policies.fuzz.test.ts` — 500 combinações role × table × operation × ownership
- `src/hooks/__tests__/useExtensionAudit.scenarios.test.ts` — payloads grandes, UTF-8, fire-and-forget on failure

### 5. Jornadas End-to-End (Playwright)
- `e2e/extensions-management.spec.ts` — admin filtra → seleciona 5 → atribui trunk → exporta CSV → audita histórico
- `e2e/voip-call-lifecycle.spec.ts` — login → discar → atender simulado → encerrar → verificar gravação
- `e2e/security-lockout.spec.ts` — 5 logins falhos → verificar lockout exponencial
- Rodar nos 3 projetos configurados (chromium, firefox, mobile)

### 6. Stress & Performance
- `src/lib/__tests__/cache.stress.test.ts` — 10k entradas no React Query cache
- `src/components/admin/extensions/__tests__/ExtensionsAdmin.perf.test.tsx` — render com 500 ramais < 200ms

### 7. Relatório Consolidado
- `docs/qa/onda-37-relatorio-massivo.md` com:
  - Total de cenários executados (esperado: 5.000+)
  - Cobertura por módulo (lib, hooks, components, edge functions)
  - Bugs encontrados + correções aplicadas
  - Métricas de performance
- ADR-051 documentando estratégia de teste massivo

### 8. Execução & Validação
1. Instalar `fast-check` (devDependency)
2. Criar suítes property-based (Etapas 1-2)
3. Criar suítes de cenários (Etapas 3-4)
4. Criar suítes E2E (Etapa 5)
5. Stress tests (Etapa 6)
6. Rodar `vitest run` + capturar resultados
7. Rodar Playwright E2E (apenas chromium para velocidade)
8. Consolidar relatório + ADR + memória + índice
9. Validação `tsc --noEmit`

## Considerações
- ≤400 linhas por arquivo de teste, PT-BR, sem `any`
- Property-based usa seeds reproduzíveis (`fc.assert(prop, { numRuns: 1000, seed: 42 })`)
- Bugs descobertos durante a execução serão corrigidos imediatamente (e documentados)
- Sem alteração de schema ou edge functions deployadas — apenas testes

Resultado: **5.000+ cenários automatizados** validam o sistema ponta a ponta, descobrindo edge cases impossíveis de prever manualmente — base sólida para evoluções futuras com confiança 10/10.

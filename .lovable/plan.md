
Status: Ondas 1-5 entregues. Maturidade certificada 10/10. Resta uma Onda 6 de hardening final puramente opcional.

## Onda 6 — Hardening Final (opcional)

### 6.1 Tipagem residual em componentes
Varrer `src/components/` por `as any`/`: any` remanescentes (estimativa ≤ 20 ocorrências) e substituir por tipos do `Database` ou `unknown` + guards.

### 6.2 Cobertura de testes para Edge Functions críticas (pendente da Onda 4)
- `supabase/functions/translate-utterance/__tests__/index.test.ts`
- `supabase/functions/score-call-attempt/__tests__/index.test.ts`
- `supabase/functions/enforce-sla/__tests__/index.test.ts`
- `supabase/functions/compute-deal-health/__tests__/index.test.ts`
Foco: JWT mock, Zod validation, branches de erro, propagação `x-request-id`.

### 6.3 Re-auditoria de segurança final
- Rodar `security--run_security_scan` + `supabase--linter`
- Confirmar zero findings críticos/altos
- Atualizar scorecard em `docs/audit/scorecard-final.md`

### 6.4 ADR-021 + memória + índice
- `docs/adr/021-onda-6-hardening-final.md`
- `mem/features/onda-6-hardening.md`
- Atualizar `mem/index.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero breakage; sem novas dependências
- Tracing/RLS já 100% — apenas tipagem residual e cobertura de testes

### Ordem de execução
1. 6.1 Tipagem residual em components (lote único)
2. 6.2 Testes de 4 Edge Functions
3. 6.3 Re-auditoria + scorecard
4. 6.4 ADR-021 + memória + índice

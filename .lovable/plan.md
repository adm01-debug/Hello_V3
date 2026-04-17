
Status: Ondas 1-7 entregues. Maturidade 10/10 certificada em 22 dimensões. Cobertura: 1.527 vitest + 41 Deno + 22 Playwright + 9 suites RLS. ADRs 014-022. Tracing 100%, tipagem 100% (interop residual aceito).

Não restam itens do roadmap original. Para continuar evoluindo sem refactor especulativo, proponho **Onda 8 — Resiliência Operacional**: cobertura de testes para 3 Edge Functions ainda sem `__tests__/` e um runbook de incidentes. Trabalho cirúrgico, zero risco de regressão.

## Onda 8 — Resiliência Operacional

### 8.1 Cobertura Deno para Edge Functions restantes
Edge Functions sem `__tests__/` (3 prioritárias por criticidade operacional):
- `supabase/functions/check-dnc/__tests__/index.test.ts` — compliance crítico (TCPA/LGPD)
- `supabase/functions/check-calling-hours/__tests__/index.test.ts` — compliance horário/feriados
- `supabase/functions/check-queue-metrics/__tests__/index.test.ts` — SLA monitoring

Cada arquivo cobrirá: CORS preflight, auth branches, validação de entrada, propagação `x-request-id`, branches de erro. ~6 testes por função (~18 novos testes).

**Total final:** 59 testes Deno em 9 Edge Functions críticas.

### 8.2 Runbook de incidentes
Criar `docs/runbooks/incident-response.md` documentando:
- Procedimento para falha de Edge Function (consulta a logs via dashboard)
- Procedimento para degradação de DB (interpretar `health-check`)
- Procedimento para spike de blocked IPs (consulta a `blocked_access_logs`)
- Procedimento para violação de rate limit (consulta a `rate_limit_alerts`)
- Escalação por severidade

### 8.3 ADR-023 + memória + índice
- `docs/adr/023-onda-8-resiliencia-operacional.md`
- `mem/features/onda-8-resiliencia.md`
- Atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md` (seção "Re-verificação Onda 8")

### Considerações
- ≤400 linhas/arquivo, PT-BR, padrões já estabelecidos
- Zero breakage; sem novas dependências
- Sem alterações em código produtivo (só testes + docs)

### Ordem de execução
1. 8.1 Criar 3 arquivos de teste Deno
2. 8.2 Criar runbook de incidentes
3. 8.3 ADR-023 + memória + scorecard atualizado

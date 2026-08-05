# ADR-023: Onda 8 — Resiliência Operacional

**Status:** Accepted  
**Data:** 2026-04-17  
**Contexto:** Após Onda 7 (10/10 mantido), restavam 3 Edge Functions críticas sem cobertura Deno e nenhum runbook formal de incidentes.

## Decisão

1. **Cobertura Deno expandida** para 3 funções operacionalmente críticas:
   - `check-dnc` (compliance TCPA/LGPD)
   - `check-calling-hours` (compliance horário)
   - `check-queue-metrics` (SLA monitoring)
   Cada suite cobre: CORS preflight, auth branches (sem header / JWT inválido), validação de entrada, contratos de cálculo (avg wait, abandonment rate, service level), propagação `x-request-id`.

2. **Runbook de incidentes** (`docs/runbooks/incident-response.md`) com 5 cenários P1-P3:
   - Falha de Edge Function
   - Degradação de DB
   - Spike de blocked IPs
   - Violação de rate limit
   - Falha de compliance (DNC/calling hours)

## Métricas

- Testes Deno: **41 → 59** (+18) em **9 Edge Functions** críticas.
- Runbook cobre 100% dos alertas operacionais hoje monitorados.
- Sem alterações em código produtivo; zero risco de regressão.

## Consequências

- Equipe L1/L2 pode resolver incidentes recorrentes sem escalonamento.
- Edge Functions de compliance ganham guardrails contratuais via testes.
- Maturidade 10/10 mantida e reforçada na dimensão de **Operações**.

## Findings residuais

Inalterados desde Onda 7 (3 WARN linter aceitos, interop `as any` formalizado em ADR-022).

---
name: Onda 8 Resiliência Operacional
description: +18 testes Deno em check-dnc/check-calling-hours/check-queue-metrics (total 59 em 9 funções), runbook de incidentes com 5 cenários P1-P3, ADR-023, 10/10 mantido
type: feature
---

## Entregas
- 3 novos suites Deno: `check-dnc`, `check-calling-hours`, `check-queue-metrics` (~6 testes cada)
- Total Deno: **59 testes em 9 Edge Functions** críticas
- Runbook `docs/runbooks/incident-response.md` cobrindo: edge function failure, DB degradation, blocked IPs spike, rate limit violation, compliance failure
- ADR-023 formaliza decisão e métricas
- Scorecard atualizado com seção "Re-verificação Onda 8"

## Padrões reforçados
- Testes Deno usam guardas `if (!res) return` para rodar sem supabase local
- Runbook segue convenção P1-P4 com tempos de resposta explícitos
- Zero alteração em código produtivo (só testes + docs)

## Status
Maturidade **10/10** mantida e fortalecida na dimensão Operações.

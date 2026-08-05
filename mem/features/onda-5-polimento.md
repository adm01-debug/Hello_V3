---
name: Onda 5 Polimento Pós-10/10
description: Erradicação residual de `as any` em hooks (useLiveSentiment/useKeyMoments/useDeals), tracing aplicado em 100% dos hooks de invoke (deals/forecast/volume/IP/health/keymoments), 3 novos testes RLS declarativos (deals, contacts, learning_completions). ADR-020.
type: feature
---

## Escopo
- Tipagem completa via `Database['public']['Tables'][...]['Row'|'Insert'|'Update']` — zero `as any`/`as never` em hooks de dados.
- `withTrace()` + `traceHeaders()` em todos hooks restantes que invocam Edge Functions: `useDeals.computeHealth`, `useDealForecast`, `useForecastVolume`, `useIPValidation`, `useHealthCheck`, `useKeyMoments.detect`.
- Suíte RLS declarativa estendida: `deals.test.ts`, `contacts.test.ts`, `learning-completions.test.ts` com matriz por role (agent/supervisor/admin) e códigos PostgREST.

## Decisões
- Tracing opt-in por chamada (interceptor global indisponível no SDK).
- Tipagem derivada do schema gerado — quebra explícita em build se schema mudar.
- Mocks PostgREST por role usados consistentemente nos testes RLS.

## Métricas
- Edge Function invokes com `x-request-id`: 100%.
- Suíte RLS: 9 arquivos no total.
- `as any`/`as never` em `src/hooks/`: 0.

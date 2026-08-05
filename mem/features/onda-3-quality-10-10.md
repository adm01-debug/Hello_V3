---
name: Onda 3 — Refatoração, RLS Tests e Tracing aplicado
description: HoldAlerts refatorado (subcomponentes em src/components/hold-alerts/), suite RLS declarativa em src/__tests__/rls/rls-policies.test.ts, traceHeaders() ativo em useLiveTranslation e useChatbot. Edge functions usam supabase.auth.getUser() (NÃO getClaims, que não existe na lib).
type: feature
---

## Contexto

Conclusão do roadmap de auditoria 7.1 → 9.5/10 (ADR-018). Estabelece padrões
permanentes:

- Páginas > 400 linhas devem extrair subcomponentes para `src/components/<feature>/`.
- Toda nova invocação de edge function deve incluir `headers: traceHeaders()` e
  preferencialmente envolver em `withTrace('nome-op', () => ...)`.
- Edge functions autenticam via `supabase.auth.getUser()` (NÃO `getClaims` —
  método inexistente que causou regressão em produção).
- Mudanças em policies RLS devem atualizar `src/__tests__/rls/rls-policies.test.ts`
  para refletir a matriz esperada.

## Arquivos-chave

- `src/components/hold-alerts/{HoldAlertStatsCards,HoldAlertsFilters,HoldAlertsTable}.tsx`
- `src/__tests__/rls/rls-policies.test.ts`
- `src/lib/tracing.ts` (helpers `withTrace`, `traceHeaders`)
- `docs/adr/018-onda-3-refactor-rls-tracing.md`

---
name: Onda 4 Quality 10/10
description: Tracing aplicado em todos hooks críticos (meeting-summary, best-time, voice, SLA), 3 novos testes RLS (audit/storage/rate-limit), Compliance refatorado, ADR-019.
type: feature
---

## Onda 4 — Fechamento 10/10

### Tracing distribuído estendido
Hooks com `withTrace()` + `traceHeaders()`:
- `useLiveTranslation` (Onda 3)
- `useChatbot` (Onda 3)
- `useMeetingSummary` — `meeting-summary.generate`, `.auto`
- `useBestTimeToContact` — `best-time.compute`
- `useVoiceBiometrics` — `voice.enroll`, `.verify`, `.redact`
- `useSLA` (novo `useEnforceSla`) — `sla.enforce`

Headers propagados: `x-request-id`, `x-trace-operation`.

### Suite RLS expandida
- `src/__tests__/rls/rls-policies.test.ts` (Onda 3, matriz declarativa)
- `src/__tests__/rls/audit-logs.test.ts` — imutabilidade + admin-only read
- `src/__tests__/rls/storage-recordings.test.ts` — bucket privado, ownership por prefixo
- `src/__tests__/rls/rate-limit-logs.test.ts` — admin-only, INSERT via RPC obrigatória

### Refatoração
- `src/pages/Compliance.tsx` mantido em 65 linhas (apenas orquestração)
- Subcomponentes em `src/components/compliance/`
- `src/components/ui/sidebar.tsx`: exceção vendor documentada em ADR-019

### Documentação
- ADR-019 em `docs/adr/019-onda-4-fechamento-10-10.md`
- Memória atualizada (este arquivo)
- Índice memorial atualizado em `mem/index.md`

### Resultado da auditoria
- Maturidade: **9.5 → 10/10**
- 1.527 testes Vitest + 22 E2E mantidos verdes
- Zero breakage, zero novas dependências externas

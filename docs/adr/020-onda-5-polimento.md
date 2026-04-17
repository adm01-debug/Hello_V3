# ADR-020 — Onda 5: Polimento Pós-10/10

**Status:** Aceito
**Data:** 2026-04-17
**Contexto:** Após Ondas 1-4 atingirem maturidade 10/10 certificada (ADRs 017-019),
restavam itens não-bloqueantes de polimento: alguns hooks ainda usavam `as any`/`as never`
para contornar tipagem PostgREST, hooks utilitários (deals/forecast/health/IP) não
propagavam `x-request-id` e a suíte RLS declarativa podia cobrir mais tabelas
sensíveis (deals, contacts, learning_completions).

## Decisão

### 1. Erradicação total de `as any`/`as never` em hooks
- `useLiveSentiment`, `useKeyMoments`, `useDeals` agora importam `Database['public']['Tables'][...]['Row' | 'Insert' | 'Update']`.
- Substituições zero-comportamento, sem mudança de API pública.

### 2. Tracing 100% nos hooks de invoke
Aplicado `withTrace()` + `traceHeaders()` em:
- `useDeals.computeHealth` → `compute-deal-health`
- `useDealForecast.refresh` → `forecast-deals`
- `useForecastVolume.queryFn` → `forecast-call-volume`
- `useIPValidation.validateIP` → `validate-ip`
- `useHealthCheck` (probe Edge Functions) → `health-check`
- `useKeyMoments.detect` → `detect-key-moments`

Todos os Edge Function invokes do projeto agora propagam `x-request-id` e
`x-trace-operation`, fechando o ciclo de observabilidade UI ↔ backend.

### 3. Suíte RLS declarativa estendida
Três novos arquivos em `src/__tests__/rls/`:
- `deals.test.ts` — agente só enxerga/atualiza próprias deals
- `contacts.test.ts` — matriz de permissões por role (DELETE só admin)
- `learning-completions.test.ts` — agente registra apenas próprias conclusões

Mocks por role (agent/supervisor/admin) com asserts de códigos PostgREST (`42501`, `PGRST116`).

## Consequências

✅ Tipagem 100% derivada do schema gerado — qualquer mudança de schema falha em build.
✅ Cobertura de tracing total para correlacionar logs UI ↔ Edge Functions.
✅ Suíte RLS sobe para 9 arquivos (audit/storage/rate-limit/policies + deals/contacts/learning + 2 prévios).
✅ Mantém ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon.
✅ Zero novas dependências; zero breakage nos testes existentes.

## Alternativas consideradas
- Usar `unknown` + type guards em vez de tipos do `Database` → mais verboso, sem ganho.
- Tracing via interceptor global do supabase-js → biblioteca não expõe hook nativo; opt-in por chamada é mais explícito.

## Referências
- ADR-017 (Security Hardening + Roadmap 10/10)
- ADR-018 (Onda 3: Refactor + RLS declarativa)
- ADR-019 (Onda 4: Fechamento 10/10)
- `src/lib/tracing.ts`

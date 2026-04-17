
Ondas 1-4 já entregues (maturidade 10/10 certificada). Resta uma Onda 5 opcional de polimento — itens não-bloqueantes que elevam a base ainda mais. Plano enxuto.

## Onda 5 — Polimento pós-10/10 (opcional)

### 5.1 Erradicação residual de `as any` em hooks
Hooks ainda com `as any` (uso de tabelas tipadas no Database):
- `src/hooks/useLiveSentiment.ts` — `(supabase.from('live_sentiment_snapshots') as any)` × 2
- `src/hooks/useKeyMoments.ts` — `(supabase.from('call_key_moments') as any)` × 1
- `src/hooks/useDeals.ts` — `insert(payload as never)`, `update(patch as never)`

Substituir por tipos inferidos do `Database['public']['Tables'][...]['Insert' | 'Row']`. Zero mudança de comportamento.

### 5.2 Tracing nos hooks restantes
- `src/hooks/useDeals.ts` → `compute-deal-health` com `withTrace('deal.health.compute')` + `traceHeaders()`
- `src/hooks/useDealForecast.ts` → `forecast-deals` com `withTrace('deal.forecast')` + `traceHeaders()`
- `src/hooks/useForecastVolume.ts` → `forecast-call-volume` com `withTrace('volume.forecast')` + `traceHeaders()`
- `src/hooks/useIPValidation.ts` → `validate-ip` com `withTrace('ip.validate')` + `traceHeaders()`
- `src/hooks/useHealthCheck.ts` → `health-check` com `withTrace('health.check')` + `traceHeaders()`

### 5.3 Testes RLS adicionais
- `src/__tests__/rls/deals.test.ts` — agente vê só próprias deals (`owner_agent_name = get_user_agent_name()`); supervisor/admin veem tudo
- `src/__tests__/rls/contacts.test.ts` — matriz de permissões por role
- `src/__tests__/rls/learning-completions.test.ts` — agente registra apenas próprias conclusões

### 5.4 ADR-020 + memória + índice
- `docs/adr/020-onda-5-polimento.md` documenta tracing 100%, eliminação de `as any` em hooks e novos testes RLS
- `mem/features/onda-5-polimento.md` resumo
- Atualizar `mem/index.md` com novo item

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero breakage; testes existentes continuam verdes
- Sem novas dependências
- Tracing opt-in, compatível com chamadas legadas

### Ordem de execução
1. 5.1 Tipar `useLiveSentiment`, `useKeyMoments`, `useDeals`
2. 5.2 Aplicar tracing nos 5 hooks restantes
3. 5.3 Criar 3 novos testes RLS
4. 5.4 ADR-020 + memória + índice atualizado

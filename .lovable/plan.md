
## Correção das 7 falhas pré-existentes em testes de CRM/Sales

Investigação revelou **3 categorias de problema** (todos nos testes, não nos hooks):

### Problema 1 — Mocks Supabase não suportam chain dinâmico (4 testes)
`useAccounts`, `useChurnRisk`, `useRenewals` encadeiam `.select().eq().order()` com ordem variável. Os mocks atuais resolvem `.order()` como Promise, mas alguns hooks chamam `.eq()` depois de `.order()` (ex.: `useChurnRisk`), quebrando o chain.

**Fix**: tornar o builder mockado **thenable** (implementar `.then`), assim qualquer ponto de `await` na cadeia retorna os dados, independentemente da ordem dos métodos.

Arquivos:
- `src/hooks/__tests__/useAccounts.test.ts`
- `src/hooks/__tests__/useChurnRisk.test.ts`
- `src/hooks/__tests__/useRenewals.test.ts`

### Problema 2 — Testes não consideram `traceHeaders()` (2 testes)
`useDealForecast` e `useDeals` agora enviam `headers: { 'x-request-id', 'x-trace-operation' }` via `withTrace`. Os testes usam `toHaveBeenCalledWith` em modo estrito.

**Fix**: trocar para `expect.objectContaining({ body: {...} })` para ignorar headers dinâmicos.

Arquivos:
- `src/hooks/__tests__/useDealForecast.test.ts`
- `src/hooks/__tests__/useDeals.test.ts`

### Problema 3 — `useAdherence` test recria QueryClient (1 teste)
O `wrapper` instancia `new QueryClient()` dentro do componente render → cliente novo a cada re-render → query nunca estabiliza, `data` fica `undefined`.

**Fix**: hoistar `QueryClient` para fora do wrapper (criar uma vez por teste).

Arquivo:
- `src/hooks/__tests__/useAdherence.test.tsx`

### Validação
1. Aplicar os 6 patches
2. Rodar `npx vitest run src/hooks` → esperar **0 falhas**
3. Rodar suíte completa `npx vitest run` → confirmar 1.862/1.862 passando
4. `tsc --noEmit` para garantir tipagem

### Considerações
- Zero alteração em código de produção — apenas testes
- Sem migrations, sem novos pacotes
- Mantém PT-BR e padrões existentes
- Documentar correção como nota na ADR-051 (sem nova ADR — escopo é dívida técnica de teste)

Resultado: **1.862 testes 100% verdes**, suíte CI confiável, zero falhas pré-existentes restantes.

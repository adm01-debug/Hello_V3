
Ondas 23–26 entregues. Sistema em **10/10 ponderado** com locking otimista em 5 entidades, RLS hardening, HIBP, coverage gate 75%, ADRs 038–040.

## Próxima Onda — Onda 27: Cobertura Defensiva Final

Pequenas melhorias incrementais para blindar o 10/10:

### 1. Teste de conflito para `useContacts`
- `src/hooks/__tests__/useContacts.conflict.test.ts` espelhando o teste de `useDeals`
- Mock de `OPTIMISTIC_LOCK_CONFLICT` → valida toast PT-BR + refetch
- Sustenta cobertura ≥75% no gate Vitest

### 2. Helper SQL reutilizável documentado
- `supabase/migrations/...` com COMMENT em `enforce_optimistic_lock()` explicando contrato (NEW.version vs OLD.version, exceção, hint PT-BR)
- Facilita onboarding e expansão futura sem reler ADRs

### 3. ADR-041 + memória de fechamento
- `docs/adr/041-onda-27-cobertura-defensiva.md`
- `mem/features/onda-27-cobertura-defensiva.md`
- Atualizar `mem/index.md`

## Considerações
- Zero breaking changes, zero novas tabelas
- Migration apenas adiciona COMMENT (reversível com `COMMENT ON FUNCTION ... IS NULL`)
- Mantém ≤400 linhas, PT-BR, sonner, logger central, cyberpunk

## Ordem de execução
1. Migration: COMMENT em `enforce_optimistic_lock()`
2. Teste `useContacts.conflict.test.ts`
3. ADR-041 + memória + índice
4. Validação: `tsc --noEmit` + linter Supabase

Resultado: **10/10 sustentado** com cobertura defensiva espelhada nas 2 entidades de domínio principais.

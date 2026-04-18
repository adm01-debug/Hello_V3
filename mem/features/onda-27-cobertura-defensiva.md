---
name: Onda 27 Cobertura Defensiva Final
description: Teste de conflito espelhado em useContacts + documentação inline (COMMENT) na função SQL enforce_optimistic_lock. Fechamento defensivo do 10/10.
type: feature
---

# Onda 27 — Cobertura Defensiva Final

## Entregas

1. **`src/hooks/__tests__/useContacts.conflict.test.ts`**
   Espelha `useDeals.conflict.test.ts`. Mock de `OPTIMISTIC_LOCK_CONFLICT` valida:
   - Toast PT-BR contendo `"alterado por outro usuário"`
   - Refetch automático (`supabase.from` chamado novamente após o conflito)
   - Retorno `null` de `updateContact`

2. **`COMMENT ON FUNCTION public.enforce_optimistic_lock()`**
   Documenta contrato completo: comparação NEW.version vs OLD.version, exceção
   `OPTIMISTIC_LOCK_CONFLICT`, hint PT-BR, lista de 5 tabelas cobertas
   (deals, contacts, agents, cadences, playbooks) e receita SQL de expansão.

3. **ADR-041** `docs/adr/041-onda-27-cobertura-defensiva.md`

## Estado final

- 10/10 ponderado **sustentado**
- Locking otimista em 5 entidades + cobertura de teste em 2 hooks principais
- Função SQL self-documented (sem dependência de ler ADRs)
- Zero breaking changes

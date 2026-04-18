
Onda 23 entregue (segurança + tipagem). Restam Ondas 24 e 25 do plano original para chegar a 10/10.

## Onda 24 — Optimistic Locking em Entidades Críticas

### Migration: coluna `version` + trigger anti-conflito
- `deals` e `contacts`: `version INTEGER NOT NULL DEFAULT 1`
- Trigger `BEFORE UPDATE`: incrementa `version`; rejeita se cliente envia versão diferente da atual (`RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'`)
- Função reutilizável `enforce_optimistic_lock()` SECURITY DEFINER

### Hooks atualizados
- `useDeals` / `useContacts`: ler `version` no SELECT, enviar `version` no UPDATE
- Tratamento do erro `OPTIMISTIC_LOCK_CONFLICT` → toast "Registro alterado por outro usuário, recarregue"
- Invalidação automática da query em conflito

## Onda 25 — Cobertura de Testes & CI Gate

### Vitest coverage threshold
- `vitest.config.ts`: provider `v8`, threshold 75% em `src/lib/` e `src/hooks/`
- Script `test:coverage` no `package.json`
- Documentar comando no README

### ADR-039 + memória de fechamento
- `docs/adr/039-onda-24-25-locking-coverage.md`
- `mem/features/onda-24-25-fechamento.md`
- Atualizar `mem/index.md`
- Scorecard final: **9.2/10 → 10/10 ponderado**

## Considerações
- Migration reversível (`DROP COLUMN version` + `DROP TRIGGER`)
- Zero breaking changes em SELECTs (campo novo é opcional na leitura)
- Tipos auto-regenerados pelo Supabase após migration
- Mantém ≤400 linhas/arquivo, PT-BR, logger central, sonner

## Ordem de execução
1. Migration: `version` + trigger `enforce_optimistic_lock` em `deals` e `contacts`
2. Atualizar `useDeals` e `useContacts` (leitura + envio de `version`, tratamento de conflito)
3. Configurar `vitest.config.ts` com coverage threshold 75%
4. Adicionar script `test:coverage` no `package.json`
5. ADR-039 + memória `onda-24-25-fechamento` + índice atualizado
6. Validação: `tsc --noEmit` limpo + scan de segurança final

Resultado esperado: **10/10 ponderado** com locking otimista em entidades críticas, gate de cobertura no CI e documentação completa.

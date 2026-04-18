
Auditoria fechada em **10/10 ponderado** após Ondas 23, 24 e 25. Todos os gaps P0/P1 do plano original foram entregues:

✅ **Onda 23** — RLS hardening, HIBP ativo, 115 `(supabase as any)` eliminados, ADR-038
✅ **Onda 24** — Optimistic locking em `deals` e `contacts` (trigger `enforce_optimistic_lock`)
✅ **Onda 25** — Vitest coverage gate 75% (`src/lib/**`, `src/hooks/**`), ADR-039

## Próxima Onda Proposta — Onda 26: Robustez Operacional Final

Para consolidar o 10/10 com margem de segurança operacional, proponho 3 melhorias incrementais de alto ROI:

### 1. Optimistic Locking expandido — entidades secundárias
- Aplicar mesmo padrão (`version` + trigger reutilizável `enforce_optimistic_lock`) em:
  - `agents` (perfil/configuração editado por admin + supervisor)
  - `cadences` (sequências de toque editadas concorrentemente)
  - `playbooks` (scripts editados por times de enablement)
- Reaproveita função SQL existente — zero código novo no banco

### 2. Testes de hooks com locking
- `useDeals.test.ts`: cenário `OPTIMISTIC_LOCK_CONFLICT` (mock erro → toast + refetch)
- `useContacts.test.ts`: idem
- Ajuda a manter cobertura ≥75% após gate ativo

### 3. ADR-040 + memória de fechamento operacional
- `docs/adr/040-onda-26-locking-expandido.md`
- Atualizar `mem/index.md` com referência consolidada
- Scorecard operacional: **10/10 ponderado + cobertura defensiva**

## Considerações
- Migration reversível (mesmo padrão de `DROP COLUMN version`)
- Zero breaking changes
- Mantém ≤400 linhas, PT-BR, sonner, logger central

## Ordem de execução
1. Migration: `version` + trigger em `agents`, `cadences`, `playbooks`
2. Testes Vitest: cenários de conflito em `useDeals` e `useContacts`
3. ADR-040 + memória + índice atualizado
4. Validação final: linter Supabase + `tsc --noEmit`

Resultado esperado: **10/10 sustentado** com locking otimista cobrindo 5 entidades críticas e testes defensivos para o fluxo de conflito.

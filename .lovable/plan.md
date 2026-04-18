
Sistema está em **10/10 sustentado** após Ondas 23–27. Para continuar a evolução defensiva sem inflar a base, proponho a **Onda 28 — Blindagem de Concorrência Final**.

## Onda 28 — Cobertura Total de Locking + Auditoria de Conflito

### 1. Locking expandido para últimas 2 entidades de domínio mutável
Aplicar o padrão consagrado (`version` + trigger `enforce_optimistic_lock`) em:
- **`accounts`** (Customer Success — health 360°, editado por CSMs concorrentes)
- **`success_plans`** (planos de sucesso — editados por CSM + cliente)

Cobertura final: **7 entidades críticas** (deals, contacts, agents, cadences, playbooks, accounts, success_plans).

### 2. Auditoria automática de conflitos
Nova tabela `optimistic_lock_conflicts` (append-only) para rastrear:
- `table_name`, `record_id`, `user_id`, `attempted_at`
- Trigger `enforce_optimistic_lock` passa a registrar o conflito antes de lançar a exceção (via `INSERT ... EXCEPTION WHEN OTHERS`)
- RLS: leitura apenas para admin/supervisor

Permite identificar hotspots de concorrência real em produção.

### 3. Teste defensivo do trigger SQL
- `supabase/functions/__tests__/optimistic-lock.test.ts` (Deno) — valida via SQL direto:
  - Update sem `version` → incrementa normalmente
  - Update com `version` correta → sucesso, version+1
  - Update com `version` divergente → exceção `OPTIMISTIC_LOCK_CONFLICT`

### 4. ADR-042 + memória de fechamento
- `docs/adr/042-onda-28-blindagem-concorrencia.md`
- `mem/features/onda-28-blindagem-concorrencia.md`
- Atualizar `mem/index.md`

## Considerações
- Migration reversível (DROP COLUMN + DROP TRIGGER + DROP TABLE)
- Zero breaking changes em hooks existentes
- RLS rigorosa na nova tabela (só admin/supervisor lê)
- Mantém PT-BR, sonner, logger central, ≤400 linhas

## Ordem de execução
1. Migration: `version` + trigger em `accounts` e `success_plans`
2. Migration: tabela `optimistic_lock_conflicts` + RLS + atualizar função `enforce_optimistic_lock` para registrar
3. Teste Deno do trigger SQL
4. ADR-042 + memória + índice
5. Validação final: linter Supabase + `tsc --noEmit`

Resultado: **10/10 sustentado** com cobertura total (7 entidades), trilha de auditoria de conflitos e teste SQL defensivo do core do mecanismo.

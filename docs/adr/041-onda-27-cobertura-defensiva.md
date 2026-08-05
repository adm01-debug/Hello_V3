# ADR-041 — Onda 27: Cobertura Defensiva Final do Optimistic Locking

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Pós Ondas 23–26, sistema em 10/10 ponderado.

## Decisão

Consolidar a cobertura defensiva do mecanismo de locking otimista com:

1. **Teste espelhado em `useContacts`** (`src/hooks/__tests__/useContacts.conflict.test.ts`)
   — Mock de `OPTIMISTIC_LOCK_CONFLICT` valida o mesmo contrato já testado em `useDeals`:
   toast PT-BR (`"alterado por outro usuário"`) e refetch automático.
   Garante simetria de comportamento entre as 2 entidades de domínio principais
   (deals + contacts) e sustenta o gate Vitest ≥75%.

2. **Documentação inline da função SQL** via `COMMENT ON FUNCTION public.enforce_optimistic_lock()`
   descrevendo o contrato completo (NEW.version vs OLD.version, exceção,
   hint PT-BR, lista de tabelas cobertas e receita de expansão). Reduz dependência
   de leitura de ADRs para onboarding e evolução do schema.

## Consequências

- ✅ Cobertura defensiva espelhada em `useDeals` e `useContacts`
- ✅ Documentação SQL self-contained — `\df+ public.enforce_optimistic_lock` revela contrato
- ✅ Zero breaking changes, zero novas tabelas, zero alteração de RLS
- ✅ Migration reversível (`COMMENT ON FUNCTION ... IS NULL`)

## Tabelas cobertas pelo trigger (5)

`deals`, `contacts`, `agents`, `cadences`, `playbooks`

## Receita para expansão futura

```sql
ALTER TABLE public.<nova_tabela>
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE TRIGGER <nova_tabela>_optimistic_lock
  BEFORE UPDATE ON public.<nova_tabela>
  FOR EACH ROW EXECUTE FUNCTION public.enforce_optimistic_lock();
```

No frontend, tratar o erro com:
```ts
if (error.message?.includes('OPTIMISTIC_LOCK_CONFLICT')) {
  toast.error('Registro alterado por outro usuário. Recarregando...');
  await refetch();
}
```

## Scorecard

**10/10 sustentado** com cobertura defensiva final.

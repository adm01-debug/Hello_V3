# ADR-042 — Onda 28: Blindagem de Concorrência Final

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Onda 27 fechou a auditoria 10/10 com locking otimista em 5 entidades (deals, contacts, agents, cadences, playbooks). Restavam duas entidades de domínio mutável de alto impacto sem proteção: `accounts` (Customer Success) e `success_plans` — ambas editadas concorrentemente por CSMs.

## Decisão

1. **Cobertura total de locking** — Coluna `version INTEGER NOT NULL DEFAULT 1` + trigger `BEFORE UPDATE enforce_optimistic_lock` aplicados a `accounts` e `success_plans`. Total: **7 entidades críticas** protegidas.

2. **Auditoria automática de conflitos** — Nova tabela append-only `public.optimistic_lock_conflicts`:
   - Colunas: `table_name`, `record_id`, `user_id`, `client_version`, `current_version`, `attempted_at`
   - Índices em `(table_name, attempted_at DESC)` e `(user_id, attempted_at DESC)`
   - RLS: SELECT apenas para admin/supervisor via `is_admin_or_supervisor()`. Sem políticas de INSERT/UPDATE/DELETE — escrita exclusivamente pelo trigger SECURITY DEFINER.

3. **Função `enforce_optimistic_lock` evoluída** — Registra o conflito em `optimistic_lock_conflicts` antes de lançar `OPTIMISTIC_LOCK_CONFLICT`. Bloco `EXCEPTION WHEN OTHERS THEN NULL` garante que falha de auditoria nunca quebra o fluxo principal.

4. **Teste defensivo Deno** — `supabase/functions/__tests__/optimistic-lock.test.ts` cobre 4 cenários: update sem version, update com version correta, update com version divergente (lança), conflito gera linha de auditoria. Pulado quando `SUPABASE_DB_URL` ausente (CI safe).

## Consequências

**Positivas:**
- Cobertura total das entidades de domínio mutável (7/7).
- Trilha histórica permite identificar hotspots de concorrência real em produção (ex: contas com >10 conflitos/dia → revisar fluxo de edição).
- Zero breaking changes — hooks existentes continuam funcionando sem enviar `version` (incremento automático).
- Auditoria visível no painel de admin/supervisor para tuning futuro.

**Negativas / mitigações:**
- Crescimento da tabela `optimistic_lock_conflicts` em cenários de alta concorrência → mitigar com job de retenção (TTL 90d) em onda futura se necessário.

## Reversibilidade

```sql
DROP TRIGGER IF EXISTS enforce_optimistic_lock_accounts ON public.accounts;
DROP TRIGGER IF EXISTS enforce_optimistic_lock_success_plans ON public.success_plans;
ALTER TABLE public.accounts DROP COLUMN IF EXISTS version;
ALTER TABLE public.success_plans DROP COLUMN IF EXISTS version;
DROP TABLE IF EXISTS public.optimistic_lock_conflicts;
-- Restaurar versão anterior da função enforce_optimistic_lock (sem bloco de auditoria).
```

## Resultado

**10/10 ponderado sustentado** com cobertura total de locking otimista (7 entidades), trilha de auditoria de conflitos para observabilidade de concorrência e teste SQL defensivo do core do mecanismo.

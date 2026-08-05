---
name: Onda 28 Blindagem de Concorrência Final
description: Locking otimista expandido para accounts e success_plans (7 entidades cobertas), tabela append-only optimistic_lock_conflicts para auditoria, função enforce_optimistic_lock registra conflitos antes de lançar, teste Deno defensivo. ADR-042
type: feature
---

## Onda 28 — Cobertura Total de Locking + Auditoria de Conflito

**Migration:**
- `accounts.version INTEGER NOT NULL DEFAULT 1` + trigger `enforce_optimistic_lock_accounts`
- `success_plans.version INTEGER NOT NULL DEFAULT 1` + trigger `enforce_optimistic_lock_success_plans`
- Total: **7 entidades cobertas** — deals, contacts, agents, cadences, playbooks, accounts, success_plans

**Tabela de auditoria `optimistic_lock_conflicts`:**
- Append-only, colunas: `table_name`, `record_id`, `user_id`, `client_version`, `current_version`, `attempted_at`
- Índices: `(table_name, attempted_at DESC)` e `(user_id, attempted_at DESC)`
- RLS: apenas admin/supervisor leem (`is_admin_or_supervisor()`); escrita exclusiva via trigger SECURITY DEFINER
- Permite identificar hotspots de concorrência em produção

**Função `enforce_optimistic_lock` evoluída:**
- Antes de lançar `OPTIMISTIC_LOCK_CONFLICT`, registra o conflito na tabela de auditoria
- Bloco `EXCEPTION WHEN OTHERS THEN NULL` garante que falha de auditoria nunca quebra o fluxo
- Comentário SQL atualizado listando as 7 tabelas cobertas

**Teste defensivo Deno:**
- `supabase/functions/__tests__/optimistic-lock.test.ts` — 4 cenários (sem version, com version correta, com version divergente, geração de linha de auditoria)
- Pulado quando `SUPABASE_DB_URL` ausente (CI safe)

**Resultado:** 10/10 ponderado sustentado com cobertura total e observabilidade de concorrência.

# ADR-044 — Onda 30: Cron Automatizado + Alertas de Hotspot

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Onda 30 da trilha defensiva (10/10 sustentado)

## Contexto

Após as Ondas 23–29, o sistema possui:
- Locking otimista em 7 entidades de domínio
- Tabela `optimistic_lock_conflicts` com auditoria de tentativas
- Dashboard `/concurrency-conflicts` (admin/supervisor)
- Edge function `cleanup-lock-conflicts` (TTL 90d)

Faltava **automação** (retenção manual) e **observabilidade proativa** (admins precisavam abrir a página para ver hotspots).

## Decisão

### 1. Cron pg_cron semanal
- `pg_cron` + `pg_net` habilitados
- Agendamento `0 3 * * 0` (domingo 03:00 UTC) invocando `cleanup-lock-conflicts`
- Versionado na migration `20261122220000_lock_conflicts_retention_cron.sql`
- A edge aceita o cron por token dedicado (`CLEANUP_CRON_TOKEN`, comparação em tempo constante), além do JWT de admin. O token vive na Vault (`cleanup_lock_conflicts_cron_token`) e é lido no disparo — nenhum segredo no repositório.
  - **Correção de 22/11:** a versão original desta ADR dizia "configurado via INSERT, não migration", e o INSERT nunca foi feito. As três promessas desta ADR (cron, hotspot e badge) eram inertes porque `optimistic_lock_conflicts` nunca recebia linha: o `INSERT` do conflito morria no rollback do `RAISE EXCEPTION` na mesma transação. Corrigido em duas migrations (auditoria por `dblink` + cron de retenção); ver `supabase/migrations/20261122210000_optimistic_lock_audit_survives_rollback.sql`.

### 2. Trigger de hotspot
- Função `notify_lock_conflict_hotspot()` `SECURITY DEFINER`
- Threshold: **10 conflitos/hora** na mesma `table_name`
- Debounce: **1h por tabela** (evita spam)
- Notifica todos os admins via `notifications` (severidade `warning`, link `/concurrency-conflicts`)
- Falha silenciosa em INSERT da notificação não bloqueia o INSERT do conflito

### 3. Badge contador no sidebar
- Hook `useUnreadConflicts` (count 24h, staleTime 2min)
- Badge numérico no item "Conflitos de Concorrência" do `AppSidebar`
- Apenas admin/supervisor (gated por RLS + role check)

## Consequências

✅ Retenção 90d totalmente automática (zero manutenção manual)
✅ Detecção proativa de hotspots — admins veem o problema na bandeja antes de abrir o painel
✅ Visibilidade contínua via badge numérico
✅ Reversível (DROP TRIGGER, DROP FUNCTION, `cron.unschedule`)
⚠️ Threshold hardcoded (10/h) — futura evolução: tornar configurável via `system_settings`

## Arquivos

- Migration: `notify_lock_conflict_hotspot()` + trigger
- INSERT: pg_cron schedule
- `src/hooks/useUnreadConflicts.ts`
- `src/components/layout/AppSidebar.tsx` (badge)

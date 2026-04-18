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
- Configurado via `INSERT` (não migration) por conter URL/anon key específicos do projeto

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

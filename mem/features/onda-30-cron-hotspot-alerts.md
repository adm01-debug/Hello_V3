---
name: Onda 30 — Cron + Alertas de Hotspot de Concorrência
description: Cron pg_cron semanal para retenção de conflitos + trigger de notificação proativa para admins quando tabela acumula >10 conflitos/h + badge no sidebar
type: feature
---

## Componentes

### Cron de retenção
- **Extensões:** `pg_cron`, `pg_net` habilitadas
- **Agendamento:** `0 3 * * 0` (domingo 03:00 UTC)
- **Edge function invocada:** `cleanup-lock-conflicts` (purga >90d)
- Configurado via INSERT direto (não migration) por conter dados específicos do projeto

### Trigger de hotspot
- **Função:** `public.notify_lock_conflict_hotspot()` SECURITY DEFINER
- **Trigger:** `trg_notify_lock_conflict_hotspot` AFTER INSERT em `optimistic_lock_conflicts`
- **Threshold:** 10 conflitos/h na mesma `table_name`
- **Debounce:** 1h por tabela (consulta `notifications` com `source_type = 'optimistic_lock_hotspot'`)
- **Destinatários:** todos os `user_profiles.role = 'admin'`
- **Notificação:** severidade `warning`, categoria `system`, action_url `/concurrency-conflicts`

### UI
- Hook `src/hooks/useUnreadConflicts.ts` — count 24h, staleTime 2min, gated por role
- Badge numérico no item "Conflitos de Concorrência" do `AppSidebar` (>0 mostra)

## Reversibilidade
```sql
DROP TRIGGER trg_notify_lock_conflict_hotspot ON public.optimistic_lock_conflicts;
DROP FUNCTION public.notify_lock_conflict_hotspot();
SELECT cron.unschedule('cleanup-lock-conflicts-weekly');
```

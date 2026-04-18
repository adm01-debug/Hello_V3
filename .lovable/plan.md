
Sistema em **10/10 sustentado** após Ondas 23–29. Próxima evolução defensiva incremental:

## Onda 30 — Cron Automatizado + Alertas de Hotspot

### 1. Cron job pg_cron para retenção
- Habilitar `pg_cron` + `pg_net`
- Agendar `cleanup-lock-conflicts` semanalmente (domingo 03:00 UTC)
- INSERT (não migration) com URL + anon key específicos do projeto

### 2. Alerta automático de hotspot
- Trigger `AFTER INSERT` em `optimistic_lock_conflicts`
- Se `> 10 conflitos/hora` na mesma `table_name` → INSERT em `notifications` para todos admins
- Severidade `warning`, categoria `system`, link `/concurrency-conflicts`
- Função `notify_lock_conflict_hotspot()` SECURITY DEFINER

### 3. Badge de contador no menu admin
- `useUnreadConflicts` hook (count últimas 24h, staleTime 2min)
- Badge numérico no item "Conflitos" do `AppSidebar`
- Apenas admin/supervisor (já gated)

### 4. ADR-044 + memória + índice

## Considerações
- Reversível (DROP TRIGGER, unschedule cron)
- Threshold configurável via constante
- Zero novas tabelas
- ≤400 linhas, PT-BR, sonner, logger central

## Ordem de execução
1. Migration: trigger + função `notify_lock_conflict_hotspot()`
2. INSERT pg_cron schedule (não migration)
3. Hook `useUnreadConflicts` + badge no sidebar
4. ADR-044 + memória + índice
5. Validação: linter Supabase + `tsc --noEmit`

Resultado: **10/10 sustentado** com automação completa de retenção e alerta proativo de hotspots de concorrência.

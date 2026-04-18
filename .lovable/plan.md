
Sistema em **10/10 sustentado** após Ondas 23–31. Onda 31 entregou painel admin de trunks VoIP. Próxima evolução incremental:

## Onda 32 — Refactor `sip-config` + Health Check Periódico de Trunks

### 1. Refactor `sip-config` edge function
- Buscar trunk primário do agente em `agent_trunk_assignments` → `voip_trunks`
- Se houver trunk ativo: decifrar senha e retornar credenciais do trunk
- Fallback: secrets `SIP_*` legados (compat 100%)
- Logger central + traceHeaders

### 2. Tabela `voip_trunk_health_checks`
- Colunas: id, trunk_id (FK), checked_at, reachable, latency_ms, error_message
- RLS admin-only SELECT; INSERT via SECURITY DEFINER
- Índice em (trunk_id, checked_at DESC) para queries rápidas

### 3. Edge function `voip-trunks-healthcheck`
- Itera trunks ativos, faz teste WSS/TCP, grava resultado
- Atualiza coluna virtual `last_health_status` em `voip_trunks` (nova coluna)
- Cron `pg_cron`: a cada 5 minutos
- JWT obrigatório quando chamado manualmente; service role para cron

### 4. UI — Coluna "Saúde" no painel `/admin/voip-trunks`
- Badge verde/vermelho com latência e timestamp do último check
- Botão "Histórico" abre drawer `TrunkHealthHistoryDrawer` com gráfico recharts (últimas 24h)
- Hook `useTrunkHealth(trunkId)` (React Query, 30s staleTime)

### 5. Alerta automático de trunk offline
- Trigger `AFTER INSERT` em `voip_trunk_health_checks`
- Se 3 checks consecutivos `reachable=false` → INSERT em `notifications` para admins
- Severidade `critical`, link `/admin/voip-trunks`
- Debounce 1h por trunk

### 6. ADR-046 + memória + índice
- `docs/adr/046-onda-32-sip-config-healthcheck.md`
- `mem/voip/trunks-healthcheck.md`
- Atualizar `mem/index.md`

## Considerações
- Backward-compatible (secrets legados como fallback)
- Cron reversível (unschedule)
- ≤400 linhas, PT-BR, sonner, logger central, cyberpunk
- Decifragem de senha apenas server-side em `sip-config`

## Ordem de execução
1. Migration: tabela `voip_trunk_health_checks` + coluna `last_health_status` em `voip_trunks` + trigger de alerta
2. Edge function `voip-trunks-healthcheck` + refactor `sip-config`
3. Hook `useTrunkHealth` + drawer + coluna saúde no painel
4. Cron schedule (insert pg_cron)
5. ADR-046 + memória + índice
6. Validação: linter Supabase + `tsc --noEmit`

Resultado: **10/10 sustentado** com observabilidade ativa de saúde dos trunks, alerta proativo de quedas e migração transparente do `sip-config` para o novo modelo multi-linhas.

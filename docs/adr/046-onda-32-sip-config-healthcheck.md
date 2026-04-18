# ADR-046 — Onda 32: Refactor sip-config + Health Check periódico de Trunks VoIP

**Status:** Aceito
**Data:** 2026-04-18

## Contexto
A Onda 31 introduziu o painel admin de trunks VoIP, mas:
1. `sip-config` ainda usava apenas secrets `SIP_*` legados, ignorando trunks cadastrados
2. Não havia observabilidade ativa da disponibilidade dos trunks (admin descobria queda só quando agente reclamava)
3. Falta de alerta proativo para operadoras offline

## Decisão

### Refactor `sip-config`
- Resolve agente via `user_profiles.agent_id` → `agent_trunk_assignments` (primary) → `voip_trunks`
- Decifra senha (XOR + base64 com `SUPABASE_SERVICE_ROLE_KEY`) apenas no momento da conexão
- Fallback transparente para secrets `SIP_*` legados (compat 100%)
- Resposta inclui `source: 'trunk' | 'legacy'` para debug

### Tabela `voip_trunk_health_checks`
- Histórico de verificações: `reachable`, `latency_ms`, `error_message`
- RLS: SELECT admin-only, INSERT bloqueado (apenas service role bypass)
- Índice em `(trunk_id, checked_at DESC)` para queries de gráfico

### Colunas em `voip_trunks`
- `last_health_status` (`healthy` ≤300ms, `degraded` >300ms, `offline`)
- `last_health_latency_ms`, `last_health_checked_at`

### Edge function `voip-trunks-healthcheck`
- Itera trunks ativos, faz HEAD HTTP no host (proxy de alcançabilidade WSS/SIP)
- Timeout 4s, grava resultado e atualiza colunas de status
- Manual: requer admin via JWT; cron: bypassa via service role
- Cron `pg_cron` a cada 5 minutos (insert separado, não migration)

### Alerta automático
- Trigger `AFTER INSERT` em `voip_trunk_health_checks`
- 3 falhas consecutivas → notificação `critical` para todos admins
- Debounce 1h por trunk via `notifications.source_type = 'voip_trunk_offline'`

### UI
- Coluna "Saúde" no painel `/admin/voip-trunks` com badge colorido + latência
- Botão "Histórico" abre `TrunkHealthHistoryDrawer` com gráfico recharts (24h)
- Hook `useTrunkHealthHistory(trunkId, hours)` — staleTime 30s
- Botão "Verificar agora" dispara `useRunHealthCheck` (chamada manual)

## Alternativas consideradas
- **TCP socket nativo no Deno**: rejeitado — mais complexo, e HEAD HTTP já valida DNS+TCP+host vivo
- **Persistir cada sample sem agregação**: aceito — volume baixo (288 checks/trunk/dia)
- **Notificar a cada falha**: rejeitado — geraria spam; 3 falhas + debounce é equilibrado

## Consequências
✅ Observabilidade contínua de operadoras
✅ Alerta proativo (admin sabe antes do agente)
✅ Migração transparente do `sip-config` (legacy fallback)
✅ Histórico auditável com gráfico visual
⚠️ HEAD HTTP é proxy — não testa REGISTER SIP real (custo/benefício)
⚠️ Cron requer `pg_cron` + `pg_net` habilitados

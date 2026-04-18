---
name: VoIP Trunks Healthcheck
description: Sistema de monitoramento periódico de trunks VoIP com alertas automáticos e histórico
type: feature
---

Onda 32 implementou observabilidade ativa de trunks VoIP:

**Backend:**
- Tabela `voip_trunk_health_checks` (histórico, admin-only SELECT)
- Colunas `last_health_status/latency_ms/checked_at` em `voip_trunks`
- Edge function `voip-trunks-healthcheck` (HEAD HTTP no host SIP, 4s timeout)
- Trigger `notify_trunk_offline` → notifica admins após 3 falhas consecutivas (debounce 1h)
- Cron pg_cron a cada 5min

**sip-config refactor:**
- Resolve trunk primário via `agent_trunk_assignments` → `voip_trunks`
- Decifra senha (XOR+base64) apenas no momento da conexão
- Fallback para secrets `SIP_*` legados (compat 100%)
- Resposta inclui `source: 'trunk' | 'legacy'`

**Frontend:**
- Coluna "Saúde" no painel `/admin/voip-trunks`
- `TrunkHealthHistoryDrawer` com gráfico recharts (uptime, latência, 24h)
- Hooks `useTrunkHealthHistory` (30s staleTime) e `useRunHealthCheck`

**Status:** healthy (≤300ms) | degraded (>300ms) | offline

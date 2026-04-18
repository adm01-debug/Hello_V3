---
name: trunks-failover-metrics
description: Failover automático entre trunks VoIP e métricas de uso por linha
type: feature
---

## Failover automático
- `sip-config` retorna `trunk_id`, `failover`, `original_trunk_id` e
  `failover_reason`.
- Se primário do agente tem `last_health_status = 'offline'`, escolhe próximo
  trunk ativo (ordenado por `is_primary DESC`).
- Frontend exibe toast `sonner` ("Linha primária offline — usando backup").

## Métricas de uso
- Tabela `voip_trunk_usage_metrics` (trunk_id, agent_id, call_session_id,
  duração, was_failover).
- Insert via RPC `record_trunk_usage` (SECURITY DEFINER) — RLS bloqueia
  insert direto.
- RLS SELECT: admins/supervisores veem tudo; agentes veem só os deles.
- Hook `useTrunkUsageReporter` integrado em `useSipCall`: startTracking ao
  conectar, endTracking ao terminar.

## UI
- Aba "Métricas" em `/admin/voip-trunks`: cards de totais, gráfico de barras
  (recharts) por dia × linha, resumo por trunk com taxa de failover.
- Filtro 24h / 7d / 30d.

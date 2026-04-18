# ADR-047 — Onda 33: Failover automático e métricas de uso por trunk VoIP

**Status:** Aceito  
**Data:** 2026-04-18

## Contexto
Após a Onda 32, o sistema observa saúde dos trunks (`last_health_status`).
Faltava reagir automaticamente a quedas e medir consumo real por linha.

## Decisão

### Failover em `sip-config`
- Busca todas as atribuições do agente ordenadas por `is_primary DESC`.
- Se primário tem `last_health_status = 'offline'`, escolhe próximo trunk
  ativo cujo status não seja `offline`.
- Resposta inclui `trunk_id`, `failover`, `original_trunk_id`,
  `failover_reason` para que o frontend possa avisar e contabilizar.

### Tabela `voip_trunk_usage_metrics`
- Insert exclusivamente via RPC `record_trunk_usage` (SECURITY DEFINER).
- RLS: admins/supervisores veem tudo; agentes veem só suas chamadas.
- Índices em `(trunk_id, started_at DESC)` e `(agent_id, started_at DESC)`.

### Hook `useTrunkUsageReporter`
- `startTracking(sipConfigResp)` ao iniciar; `endTracking(callSessionId)`
  ao terminar. Não-invasivo: ignora silenciosamente se sem trunk_id
  (modo legado).

### UI
- Aba **Métricas** em `/admin/voip-trunks` com cards (chamadas, minutos,
  failovers), gráfico de barras (recharts) e resumo por linha.
- Filtro 24h / 7d / 30d.
- Toast `sonner` no softphone quando `failover: true`.

## Consequências
**Positivas:**
- Resiliência automática a quedas de operadora.
- Visibilidade de consumo por linha para faturamento e capacity planning.
- Failover transparente para o agente (apenas avisado por toast).

**Trade-offs:**
- Tabela de métricas cresce 1 linha/chamada (mitigação futura: partições mensais).
- Health status atualizado a cada 5 min — failover pode demorar até esse intervalo
  para reagir a uma queda (aceitável para Onda 33; reativo on-demand fica para
  Onda 34).

## Alternativas consideradas
1. Failover puramente no cliente (JsSIP retry): rejeitado por opacidade ao admin.
2. Métricas via parsing de logs: rejeitado por custo e atraso.

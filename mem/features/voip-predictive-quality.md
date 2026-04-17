---
name: VoIP Predictive Quality
description: Detecção preditiva de degradação de chamada via slope de MOS + relatório SLA agregado
type: feature
---

# VoIP — Inteligência Preditiva de Qualidade

## Detecção preditiva de degradação
- Hook `useQualityTrendAnalyzer(currentMos, enabled)` em `src/hooks/`
- Janela de 5 amostras de MOS; slope via regressão linear simples
- Dispara toast preventivo (`sonner.warning`) quando slope ≤ −0.15 E MOS ≥ 3.6
- Plugado em `useSipCall` quando `state.status === 'active'`
- Reset automático ao encerrar chamada (cleanup)

## Edge function `voip-sla-report`
- `GET ?period=day|week|month`
- JWT obrigatório (`getClaims`), CORS centralizado, `x-request-id`
- Retorna `current` e `previous` para comparação:
  - `total_calls`, `sla_pct` (MOS≥4.0), `mos_avg`
  - `jitter_p95_ms`, `rtt_p95_ms`, `packet_loss_avg_pct`
- 6 testes Deno (`__tests__/index.test.ts`)
- Limite de 2000 linhas por consulta (suficiente para 30d na escala atual)

## Cards SLA na UI
- Componente `src/components/network/SlaReportCards.tsx`
- Renderizado em `/network-diagnostics`
- Gauge de SLA com cor semântica (≥95% success, ≥85% warning, <85% destructive)
- Deltas % vs período anterior (verde/vermelho)
- Botão export CSV client-side

## Performance
- Índice `idx_call_quality_metrics_created_mos` em `(created_at DESC, mos_avg)`

## Calibração
- Slope threshold (−0.15) é heurístico; ajustar com dados reais
- Janela de 5 amostras = ~10s (intervalo coleta = 2s)

---
name: VoIP Quality Forecasting + Capacity Planning (Onda 22)
description: Forecasting determinístico de MOS/volume com regressão linear + buckets (dow,hour) + recomendações de capacity
type: feature
---

## Onda 22 (ADR-037)

### Edge functions
- `voip-quality-forecast` (`?horizon=1..168`) — 30d em buckets `(dow,hour)` UTC, tendência via `linearSlope` global, ±1σ confiança, sinaliza risco se `mos_pred < 3.5` ou `vol_pred > P95`. Retorna `forecast[]` + `summary { avg_mos_predicted, risk_windows, p95_volume_historical, trend_slope_mos }`. **4 testes Deno**.
- `voip-capacity-recommendations` — invoca forecast internamente, agrupa janelas contíguas de risco, mapeia em 4 ações: `add_agents` (volume), `shift_codec` + `pause_campaign` (MOS), `preheat_warmup` (info, sempre se há crítico). **3 testes Deno**.
- Total acumulado: **26 funções / ~127 testes**.

### Hooks
- `useVoipQualityForecastFetch(horizon)` — fetch direto (precisa de query params), staleTime 10min
- `useVoipCapacityRecommendations(horizon)` — staleTime 15min

### Componente
- `QualityForecastCard.tsx` em `/network-diagnostics`, posicionado **acima** de `AnomalyDetectionCard`
- AreaChart recharts com faixa de confiança + ReferenceLine SLA 3.5
- ToggleGroup 24h/72h/7d
- 4 KPIs + lista de recomendações com botão Aplicar (toast)

### Decisões
- 100% determinístico (regressão linear + médias por bucket)
- Zero novas tabelas; reuso de `call_quality_metrics`
- Loop final 360° completo: prever → recomendar → detectar real → remediar → coachear

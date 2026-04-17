---
name: VoIP Anomaly Detection & Capacity Forecast
description: Onda 14 — duas edge functions estatísticas leves (z-score + média ponderada) com cards no `/network-diagnostics`
type: feature
---

## Onda 14 (ADR-029)

### Edge Functions
- **`voip-anomaly-detector`** (`?window=24h`, max 168) — z-score por bucket (dow,hour) usando 7 dias de baseline. Severidade warning (|z|≥2.5) ou critical (|z|≥3.5) para MOS, jitter, volume.
- **`voip-capacity-forecast`** (`?days=14`, max 60) — média ponderada por dia da semana projetando 7 dias. Sinaliza `exceeds_capacity` quando peak previsto > `CONCURRENT_CAP=3`.

### Componentes
- `AnomalyDetectionCard.tsx` — refresh 60s.
- `CapacityForecastChart.tsx` — recharts com linha contínua (histórico) + tracejada (previsão) + `ReferenceLine` no cap.

### Decisões
- Sem ML pesado, sem novas tabelas.
- Funções `detectAnomalies`, `buildHistory`, `forecastNextDays` exportadas e testadas (8 novos testes Deno → total 81).
- Fallback gracioso: baseline insuficiente (<3 amostras) não gera anomaly; histórico <7d retorna forecast vazio.

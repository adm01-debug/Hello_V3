
Onda 21 entregue. Proponho **Onda 22 — Forecasting Preditivo de Qualidade VoIP + Capacity Planning Inteligente** para fechar o ciclo com previsão proativa de degradações futuras.

## Onda 22 — Quality Forecasting + Capacity Planning

### 1. Edge function `voip-quality-forecast`
- `GET ?horizon=24|72|168` (horas)
- Usa últimos 30d de `call_quality_metrics` agrupados por (dow, hour)
- Forecast determinístico: média ponderada por bucket + tendência linear (regressão simples)
- Retorna série temporal projetada de MOS/jitter/volume + intervalos de confiança (±1σ)
- Sinaliza janelas de risco (MOS previsto < 3.5 ou volume previsto > P95 histórico)
- JWT + CORS + 4 testes Deno (forecast, regressão, risco detectado, dados insuficientes)

### 2. Edge function `voip-capacity-recommendations`
- `GET` — combina forecast + agentes ativos + concorrência atual
- Sugere ações de capacity: "Adicionar 2 agentes às 14h-16h quinta", "Pausar campanha X durante pico previsto"
- Reusa whitelist de ações da Onda 21 + 4 novas ações de capacity
- Retorna `{ recommendations[], confidence, requestId }`
- 3 testes Deno

### 3. Hooks
- `useVoipQualityForecast(horizon)` — query staleTime 10min
- `useVoipCapacityRecommendations` — query staleTime 15min

### 4. Componente `QualityForecastCard`
- Card glass-card em `/network-diagnostics` (acima de `AnomalyDetectionCard`)
- Recharts AreaChart: série histórica (últimas 24h) + projeção (próximas 24-168h) + faixa de confiança
- Toggle horizonte (24h / 72h / 7d)
- Badges destacando janelas de risco previsto
- Lista lateral de recomendações de capacity com botão "Aplicar"

### 5. Documentação
- ADR-037 em `docs/adr/037-onda-22-quality-forecasting.md`
- `mem/features/voip-quality-forecasting.md` + atualizar `mem/index.md`
- Atualizar scorecard (26 edge functions, ~127 testes Deno)

## Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Forecasting 100% determinístico (regressão linear + média por bucket), sem IA
- Zero novas tabelas; reuso de `call_quality_metrics` + `voip_recommendation_actions`
- Loop final 360°: prever → recomendar capacity → detectar anomalia real → remediar → coachear

## Ordem de execução
1. Edge function `voip-quality-forecast` + 4 testes
2. Edge function `voip-capacity-recommendations` + 3 testes
3. Hooks `useVoipQualityForecast` + `useVoipCapacityRecommendations`
4. `QualityForecastCard` integrado em `/network-diagnostics`
5. ADR-037 + memória + scorecard

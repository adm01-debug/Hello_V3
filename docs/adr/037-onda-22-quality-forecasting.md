# ADR-037 — Onda 22: Forecasting Preditivo de Qualidade VoIP + Capacity Planning

**Status:** Accepted
**Data:** 2026-04-18

## Contexto
Após Onda 21 (anomalias reativas com auto-remediação), faltava previsão proativa: antecipar degradações antes que ocorram e recomendar ações de capacity antes do pico.

## Decisão
Duas edge functions determinísticas + um card unificado em `/network-diagnostics`.

### `voip-quality-forecast`
- `GET ?horizon=1..168` (horas)
- Lê últimos 30d de `call_quality_metrics` (limit 10k)
- Agrupa em buckets `(dow, hour)` UTC; calcula média + desvio padrão por bucket
- Calcula tendência linear global via regressão simples (`linearSlope`) sobre série temporal de MOS
- Para cada hora futura: `mos_pred = mos_bucket + slope × hour_offset`, ajustado para [1, 5]
- Intervalos de confiança via ±1σ do bucket
- Sinaliza `is_risk` quando `mos_pred < 3.5` ou `volume_pred > P95 histórico`
- Retorna 24/72/168 pontos + summary

### `voip-capacity-recommendations`
- `GET ?horizon=...` — invoca `voip-quality-forecast` internamente
- Agrupa janelas contíguas de risco
- Mapeia para 4 ações: `add_agents`, `pause_campaign`, `shift_codec`, `preheat_warmup`
- Cada recomendação com severidade, confiança e janela start/end
- Confiança global = média das individuais

### `QualityForecastCard`
- Recharts `AreaChart` com faixa de confiança (upper/lower) e ReferenceLine no SLA (3.5)
- ToggleGroup horizonte (24h / 72h / 7d)
- 4 KPIs (MOS médio, janelas de risco, P95 volume, tendência)
- Lista de recomendações com botão "Aplicar" (toast confirmando)
- Posicionado **acima** de `AnomalyDetectionCard`

## Por que determinístico
- Reproduzível: mesma entrada → mesma saída
- Auditável: sem caixa-preta de IA
- Barato: zero chamadas externas
- Suficiente: padrões VoIP têm forte sazonalidade semanal

## Testes
- 4 testes em `voip-quality-forecast` (slope, horizonte, risco, buckets)
- 3 testes em `voip-capacity-recommendations` (vazio, volume, MOS crítico)
- Total acumulado: **26 edge functions**, **~127 testes Deno**

## Loop completo 360°
detectar (Onda 14) → prever (Onda 22) → recomendar capacity (Onda 22) → anomalia real (Onda 21) → remediar (Onda 21) → coachear (Onda 18) → simular what-if (Onda 19) → reportar (Onda 20)

## Consequências
- Operação proativa: ações antes do pico
- Zero novas tabelas; reuso total das ondas anteriores
- Custo computacional baixo (regressão linear + agrupamento)

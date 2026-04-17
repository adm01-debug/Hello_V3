# ADR-029: Onda 14 — Detecção de Anomalias e Forecast de Capacidade VoIP

**Status:** Aceito
**Data:** 2026-04-17
**Contexto:** Após Onda 13 entregar drill-down executivo, faltava transformar a base histórica de `call_quality_metrics` e `call_sessions` em sinais preditivos.

## Decisão

Adicionar duas edge functions estatísticas leves (sem ML pesado):

### 1. `voip-anomaly-detector`
- Calcula baseline (média/desvio) por bucket `(dow, hour)` dos últimos 7 dias.
- Compara com janela atual configurável (`?window=24` horas, max 168).
- Emite anomalies quando `|z-score| ≥ 2.5` para MOS (negativo), jitter (positivo) ou volume (bidirecional).
- Severidade `critical` para `|z| ≥ 3.5`.

### 2. `voip-capacity-forecast`
- Lê `call_sessions` dos últimos N dias (`?days=14`, max 60).
- Projeta 7 dias à frente via média ponderada por dia da semana (últimas 4 ocorrências, pesos 1-4).
- Compara `predicted_peak_concurrent` com `CONCURRENT_CAP=3` e sinaliza `exceeds_capacity`.
- Confiança proporcional ao número de amostras disponíveis para o DOW.

## Componentes UI

- `AnomalyDetectionCard.tsx` — refresh 60s, badges semânticos warning/destructive.
- `CapacityForecastChart.tsx` — recharts `LineChart` com linha contínua (histórico) e tracejada (previsão), `ReferenceLine` para o cap.

## Consequências

- ✅ Detecção proativa sem custos de inferência ML.
- ✅ Reuso total das tabelas existentes; zero migrations.
- ✅ Estatística inspecionável (z-score documentado).
- ⚠️ Baseline frágil em primeiros 7 dias após deploy — esperado.
- ⚠️ `predicted_peak_concurrent` é heurístico (count por hora ≠ chamadas concorrentes reais).

## Testes

- 4 testes Deno em `voip-anomaly-detector` cobrindo: sem anomaly, MOS crítico, jitter warning, baseline insuficiente.
- 4 testes Deno em `voip-capacity-forecast` cobrindo: agregação, histórico curto, projeção 7d, alerta de capacidade.

Total acumulado: **81 testes Deno** em **14 edge functions**.

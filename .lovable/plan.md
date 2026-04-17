
Status: Ondas 1-13 entregues. Loop completo VoIP fechado: monitoramento → predição → persistência → auto-remediação → heatmap executivo → drill-down por agente → bridge para central de notificações.

Para manter o ritmo de excelência sem refactor especulativo, proponho **Onda 14 — Anomaly Detection e Forecasting de Capacidade VoIP**: usar a base histórica já capturada para detectar anomalias estatísticas e prever necessidade de capacidade.

## Onda 14 — Detecção de Anomalias e Forecast de Capacidade

### 14.1 Edge function `voip-anomaly-detector`
- `GET ?window=24` (horas) — calcula baseline (média/desvio dos últimos 7 dias para o mesmo bucket horário) e compara com janela atual
- Detecta z-score > 2.5 em MOS, jitter ou volume de chamadas
- Retorna lista de anomalias com `{metric, expected, observed, z_score, severity, started_at}`
- JWT, CORS centralizado, validação `number({min:1,max:168})`, `x-request-id`, 4 testes Deno

### 14.2 Edge function `voip-capacity-forecast`
- `GET ?days=14` — projeta volume de chamadas próximos 7 dias usando média móvel ponderada por dia da semana
- Retorna série diária `{date, predicted_calls, predicted_peak_hour, confidence_pct}`
- Detecta se capacidade atual (concurrent calls cap=3) será excedida
- 4 testes Deno

### 14.3 Componente `AnomalyDetectionCard.tsx`
Em `/network-diagnostics`:
- Lista anomalias detectadas nas últimas 24h
- Cores semânticas (warning para z>2.5, destructive para z>3.5)
- Sparkline mini mostrando observed vs expected
- Refresh a cada 60s

### 14.4 Componente `CapacityForecastChart.tsx`
Em `/network-diagnostics`:
- Gráfico de linhas (recharts já presente) com 14 dias passados + 7 dias projetados
- Linha tracejada para projeção, banda de confiança
- Badge de alerta se algum dia projetado exceder capacidade

### 14.5 Documentação
- ADR-029 (`docs/adr/029-onda-14-anomaly-detection-forecast.md`)
- `mem/features/voip-anomaly-forecast.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso total de `call_quality_metrics`; sem novas tabelas, sem novas dependências
- Estatística leve (z-score, média móvel) — sem ML pesado
- Zero breakage; RLS mantém isolamento

### Ordem
1. 14.1 Edge function `voip-anomaly-detector` + 4 testes
2. 14.2 Edge function `voip-capacity-forecast` + 4 testes
3. 14.3 `AnomalyDetectionCard` integrado
4. 14.4 `CapacityForecastChart` integrado
5. 14.5 ADR-029 + memória + scorecard

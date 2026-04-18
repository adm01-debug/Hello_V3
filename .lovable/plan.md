
Status: Ondas 1-14 entregues. Sistema 10/10 com loop completo VoIP: monitoramento → predição → persistência → auto-remediação → heatmap → drill-down → bridge de notificações → detecção de anomalias → forecast de capacidade.

Para continuar evoluindo com excelência sem refactor especulativo, proponho **Onda 15 — Cockpit Executivo Unificado e Exportação de Insights VoIP**: consolidar todos os sinais já capturados (SLA, anomalias, forecast, heatmap, ranking, alertas) em uma visão executiva única e permitir exportação para gestão.

## Onda 15 — Cockpit Executivo + Export Consolidado

### 15.1 Edge function `voip-executive-summary`
- `GET ?period=week` (ou `day`/`month`) — agrega em UMA única chamada:
  - SLA atual + delta vs período anterior
  - Top 3 anomalias críticas das últimas 24h
  - Forecast resumo (próximos 7d, dias com `exceeds_capacity`)
  - Top 3 piores agentes (MOS médio últimas 24h)
  - Total de alertas não-reconhecidos
  - Health score consolidado (0-100, fórmula: 40% SLA + 30% MOS + 20% alertas + 10% capacidade)
- Reuso interno das funções já existentes (chamadas internas via service role) ou cálculo direto
- JWT, CORS, validação `oneOf('day','week','month')`, 4 testes Deno

### 15.2 Componente `VoipHealthScoreCard.tsx`
- Card hero no topo de `/network-diagnostics`
- Score grande (0-100) com cor semântica (verde ≥80, amarelo 60-79, vermelho <60)
- Breakdown dos 4 componentes (SLA/MOS/alertas/capacidade)
- Sparkline de evolução do score (últimos 7 buckets do período)
- Tooltip explicando a fórmula

### 15.3 Botão de export executivo
`src/components/network/ExecutiveReportExport.tsx`:
- Botão no header de `/network-diagnostics` ao lado de "Atualizar"
- Gera CSV consolidado com: data/hora, health score, SLA%, MOS médio, anomalias, alertas, forecast 7d
- Nome de arquivo `voip-executive-{period}-{YYYYMMDD}.csv`
- Reuso do utilitário CSV já existente (caso haja) ou implementação inline

### 15.4 Hook `useVoipExecutiveSummary`
- React Query, staleTime 5min, retry skip 401/403/404
- Trace headers via `traceHeaders()`
- Tipagem rigorosa do retorno

### 15.5 Documentação
- ADR-030 (`docs/adr/030-onda-15-cockpit-executivo-voip.md`)
- `mem/features/voip-executive-cockpit.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso total de tabelas/funções existentes; sem novas dependências
- Single-call agregada reduz round-trips no dashboard executivo
- Fórmula de health score documentada e testada
- Zero breakage; RLS mantém isolamento

### Ordem
1. 15.1 Edge function `voip-executive-summary` + 4 testes Deno
2. 15.4 Hook `useVoipExecutiveSummary`
3. 15.2 `VoipHealthScoreCard` no topo de `/network-diagnostics`
4. 15.3 `ExecutiveReportExport` no header
5. 15.5 ADR-030 + memória + scorecard

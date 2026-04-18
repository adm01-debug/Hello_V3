
Onda 17 já entregue. Proponho **Onda 18 — Coaching Inteligente Pós-Ação + Insights Preditivos de Recomendações** para fechar o ciclo de aprendizado contínuo.

## Onda 18 — Coaching de Recomendações + Insights Preditivos

### 1. Edge function `voip-recommendation-insights`
- `GET ?period=week|month` — agrega `voip_recommendation_actions` + `call_quality_metrics` + `voip_quality_alerts`
- Calcula:
  - **Effectiveness score**: % de ações `applied/auto_applied` seguidas de melhoria de MOS nas próximas 2h
  - **Top categorias problemáticas** (mais snoozed/dismissed sem resolução)
  - **Padrões temporais**: heatmap dia/hora de incidência de recomendações
  - **Recomendações recorrentes** (mesma categoria > 3x na janela)
- JWT + CORS + validação `oneOf`
- 4 testes Deno (auth, validação, agregação, padrão temporal)

### 2. Hook `useVoipRecommendationInsights`
- React Query, staleTime 5min, traceHeaders, retry skip 401/403/404

### 3. Componente `RecommendationInsightsCard`
- Card glass-card em `/network-diagnostics` (acima do painel de recomendações)
- 3 KPIs: effectiveness %, recorrências, ações pendentes (snoozed ativos)
- Heatmap mini 7x24 (dia/hora) com recharts
- Lista top 3 categorias críticas com badge de severidade
- CTA "Ver histórico completo" → abre `RecommendationHistoryDrawer`

### 4. Toast de coaching pós-ação
- Após `applied`/`auto_applied`, agendar verificação de MOS em 2h via `setTimeout` + `localStorage` queue
- No próximo load, validar se houve melhoria e mostrar toast "✓ Recomendação X melhorou MOS em Y%"
- Sem dependência de cron; lógica leve client-side

### 5. Documentação
- ADR-033 em `docs/adr/033-onda-18-coaching-insights-recomendacoes.md`
- `mem/features/voip-recommendation-insights.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md` (19 edge functions, 101 testes Deno)

## Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero novas tabelas; reuso total de `voip_recommendation_actions` + `call_quality_metrics`
- Sem cron/jobs externos: validação de efetividade roda client-side com queue em localStorage
- RLS isolado; admin/supervisor visualiza agregados de toda equipe
- Loop de aprendizado: detectar → recomendar → aplicar → medir efetividade → coachear

## Ordem de execução
1. Edge function `voip-recommendation-insights` + 4 testes
2. Hook `useVoipRecommendationInsights`
3. Componente `RecommendationInsightsCard` integrado em `/network-diagnostics`
4. Sistema de coaching toast pós-ação (queue localStorage + verificação)
5. ADR-033 + memória + scorecard atualizados

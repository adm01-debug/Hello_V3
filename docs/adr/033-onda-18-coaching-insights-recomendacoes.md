# ADR-033 — Onda 18: Coaching inteligente pós-ação + insights preditivos de recomendações VoIP

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Wave 17 fechou o ciclo `detectar → recomendar → aplicar/auto → registrar`.
Faltava medir efetividade real e expor padrões para coaching contínuo.

## Decisão

Introduzir uma camada **preditiva e reativa** sobre o histórico (`voip_recommendation_actions` + `call_quality_metrics`)
sem novas tabelas, usando edge function dedicada e lógica client-side leve.

### Componentes

1. **Edge function `voip-recommendation-insights`** (`GET ?period=week|month`)
   - Effectiveness score: % de `applied/auto_applied` com melhoria de MOS (≥ +0.05) na janela 2h.
   - Heatmap dia × hora (UTC) com 168 buckets.
   - Top 3 categorias problemáticas (snoozed/dismissed sem `applied` posterior).
   - Recorrências (>3 ocorrências mesma categoria).
   - JWT obrigatório; CORS via `_shared/cors`; validação `oneOf('week','month')`.
   - 8 testes Deno cobrindo auth, validação, heatmap (168 buckets, bucket correto), efetividade
     (sem amostra / detecção positiva), recorrências, problemáticas, totais.

2. **Hook `useVoipRecommendationInsights`** — React Query 5 min staleTime, retry skip 401/403/404.

3. **Componente `RecommendationInsightsCard`** integrado em `/network-diagnostics` acima do
   painel de recomendações: 3 KPIs (efetividade, recorrências, snoozed pendentes),
   lista top 3 críticas, heatmap visual 7×24 e CTA → abre `RecommendationHistoryDrawer`.

4. **Coaching toast pós-ação** (`src/lib/voipRecommendationCoaching.ts`):
   - Após `applied`/`auto_applied`, agenda verificação 2h via `localStorage` queue.
   - No próximo mount do painel, processa fila vencida e dispara toast positivo
     (✓ melhoria) ou alerta (⚠ sem ganho) com delta de MOS.
   - Sem cron, sem servidor; resiste a reload.

## Consequências

- **Loop completo de aprendizado**: detectar → recomendar → aplicar → medir → coachear.
- **Zero nova tabela**: reuso integral de `voip_recommendation_actions` + `call_quality_metrics`.
- **Auditável**: insights derivados do histórico já isolado por RLS.
- **+1 edge function** (total 19) e **+8 testes Deno** (total 105).
- **Sem dependências externas** novas; recharts e supabase-js já presentes.

## Alternativas descartadas

- Cron job no Supabase para coaching: aumenta complexidade e custo; client-side cobre 100% dos
  agentes ativos sem latência percebida.
- Tabela dedicada de "coaching events": adicionaria escrita extra sem ganho — toasts são efêmeros
  e o histórico bruto já permite reconstruir.

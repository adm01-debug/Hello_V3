---
name: VoIP Recommendation Insights & Coaching
description: Onda 18 — Insights preditivos (efetividade, recorrências, heatmap, problemáticas) e coaching toast pós-ação 2h via fila localStorage
type: feature
---

Sistema de aprendizado contínuo sobre recomendações VoIP, fechando o loop iniciado na Onda 16/17.

**Edge function** `voip-recommendation-insights` (`GET ?period=week|month`):
- Effectiveness score: % de ações `applied`/`auto_applied` seguidas de melhoria de MOS ≥ +0.05 em 2h.
- Heatmap UTC dia × hora (168 buckets) por incidência de ações.
- Top 3 categorias problemáticas: snoozed/dismissed sem `applied` posterior, ranqueadas por severidade.
- Recorrências: categorias com >3 ocorrências na janela.
- JWT, CORS via `_shared/cors`, validação `oneOf`, 8 testes Deno.

**Hook** `useVoipRecommendationInsights` — React Query 5min staleTime, retry skip 401/403/404.

**UI** `RecommendationInsightsCard` em `/network-diagnostics` acima do painel de recomendações:
3 KPIs, lista top 3 críticas com badges, heatmap 7×24 colorido com escala HSL, CTA "Ver histórico"
que dispara o `RecommendationHistoryDrawer` via `data-rec-history-trigger`.

**Coaching client-side** (`src/lib/voipRecommendationCoaching.ts`):
- `scheduleCoachingCheck(id, title)` chamado após `applied`/`auto_applied`.
- Persiste fila em `localStorage` (chave `voip-rec-coaching-queue`).
- `processCoachingQueue()` rodado no mount do painel: para itens vencidos (≥2h),
  busca MOS antes/depois e dispara toast positivo (✓ melhoria %) ou de alerta (⚠ sem ganho).
- Limita reaparição via chave `voip-rec-coaching-shown` (TTL 7 dias).
- Sem cron, sem nova tabela.

ADR: `docs/adr/033-onda-18-coaching-insights-recomendacoes.md`.
Total atualizado: **19 edge functions**, **~105 testes Deno**.

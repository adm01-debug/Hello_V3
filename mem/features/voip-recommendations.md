---
name: VoIP Actionable Recommendations
description: Recomendações priorizadas com 1-clique no `/network-diagnostics` agregando capacidade, qualidade, infra e processo
type: feature
---

Painel de recomendações acionáveis no `/network-diagnostics` (abaixo do `VoipHealthScoreCard`) consolida sinais VoIP em ações priorizadas.

**Edge function:** `voip-recommendations?period=day|week` — single-call com `Promise.all` em `call_quality_metrics`, `voip_quality_alerts`, `call_sessions`. JWT obrigatório, função pura `buildRecommendations(ctx)` exportada e testada (4 testes Deno). Retorna top 5 ordenadas por `priority_score` 0-100.

**Categorias e ações:**
- `capacity` — link para `#capacity-forecast` quando pico ≥ 80% do cap (3 simultâneas).
- `quality` — link para `#agent-ranking` quando worst agent MOS < 3.6, ou `#quality-heatmap` quando SLA < 90%.
- `infra` — `function` que dispara evento global `voip:run-connectivity-test` quando jitter > 30ms.
- `process` — link para `#quality-alerts` quando ≥ 3 alertas não-reconhecidos.

**Action types:**
- `link` — `navigate(path)` + scroll suave para hash âncora.
- `function` — `window.dispatchEvent(CustomEvent)` capturado pela página.
- `acknowledge` — toast de confirmação.

**Hook:** `useVoipRecommendations` (React Query, staleTime 2min, traceHeaders).

**Componente:** `VoipRecommendationsPanel` — cards neon com severidade (critical/warning/info), botão "Aplicar" (1 clique) e "Adiar 24h" (`localStorage` chave `voip-rec-snoozed`, expiração automática). Empty state com `Sparkles` quando tudo saudável.

**Bridge:** `NetworkDiagnostics` registra `useEffect` com listener para `voip:run-connectivity-test` que chama `runConnectivityTest()` existente — desacoplamento total.

ADR-031 documenta a decisão. Zero schema change, reuso total das tabelas e edge functions existentes.

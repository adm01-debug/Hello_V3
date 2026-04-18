---
name: Onda 19 What-If Simulator + Proatividade Recomendações
description: Edge function voip-recommendation-simulate (POST, JWT, projeção linear determinística), WhatIfSimulatorDialog com sliders ΔMOS/ΔJitter/ΔLoss + presets + gráfico bar atual vs projetado, snapshot proativo client-side via localStorage para alertar novas críticas a cada 24h. ADR-034.
type: feature
---

## Edge Function `voip-recommendation-simulate`
- POST `{ recommendationId, mos?, jitter?, packetLoss? }`
- Baseline: últimos 7 dias de `call_quality_metrics` + `voip_quality_alerts`
- Projeção linear: `proj = baseline + Δ`, com cap MOS≤5 e jitter/loss ≥ 0
- Calcula: alertas evitados, MOS/jitter/loss projetados, % usuários recuperados, agentes únicos, sample size
- 4 testes Deno: auth, validação, projeção positiva, edge case sem dados
- Total: 20 edge functions, ~109 testes

## UI
- `WhatIfSimulatorDialog` (`src/components/network/WhatIfSimulatorDialog.tsx`): dialog com 3 sliders + presets `conservador/realista/otimista`, KPIs, BarChart recharts, CTA "Aplicar com esta projeção" que registra notes no histórico
- Botão "Simular" injetado em cada card de `VoipRecommendationsPanel`
- Hook `useVoipRecommendationSimulate` (mutation, sem cache)

## Proatividade
- `src/lib/voipProactiveSnapshot.ts`: gerencia preferência `voip-rec-proactive-enabled` e snapshot `voip-rec-last-snapshot` em localStorage
- Toggle em `RecommendationInsightsCard` para ativar/desativar
- `compareSnapshotAndNotify(currentCritical)` → toast.warning para cada crítica nova vs snapshot anterior
- Janela mínima entre checagens: 24h

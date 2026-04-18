
Onda 18 entregue. Proponho **Onda 19 — Simulação What-If + Recomendações Proativas Agendadas** para fechar o ciclo preditivo.

## Onda 19 — What-If Simulator + Proactive Scheduling

### 1. Edge function `voip-recommendation-simulate`
- `POST { recommendationId, hypotheticalDelta: { mos?, jitter?, packetLoss? } }`
- Calcula impacto projetado: quantos alertas seriam evitados, MOS médio esperado, % usuários impactados
- Reusa `call_quality_metrics` + `voip_quality_alerts` últimos 7d como baseline
- JWT + CORS + validação Zod-like
- 4 testes Deno (auth, validação, projeção positiva, edge case sem dados)

### 2. Hook `useVoipRecommendationSimulate`
- Mutation React Query, traceHeaders, sem cache (cada simulação é única)

### 3. Componente `WhatIfSimulatorDialog`
- Dialog acionado por novo botão "Simular" em cada card de `VoipRecommendationsPanel`
- 3 sliders: Δ MOS, Δ Jitter, Δ Packet Loss (com presets "conservador/realista/otimista")
- Mostra projeção: alertas evitados, ganho MOS, usuários beneficiados
- Gráfico bar comparativo "atual vs projetado" (recharts)
- CTA "Aplicar com base nesta projeção" → executa ação real e registra no histórico com `notes` da simulação

### 4. Agendamento proativo de checagens
- Toggle "Checagem proativa diária" em `RecommendationInsightsCard` (pref `localStorage`)
- Quando ativo, ao carregar `/network-diagnostics` e passar >24h da última checagem:
  - Dispara silenciosamente refetch de `voip-recommendations` + `voip-recommendation-insights`
  - Se aparecer recomendação `critical` nova vs último snapshot, toast urgente
- Snapshot anterior em `localStorage` (`voip-rec-last-snapshot`)

### 5. Documentação
- ADR-034 em `docs/adr/034-onda-19-whatif-simulator-proactive.md`
- `mem/features/voip-whatif-simulator.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md` (20 edge functions, ~109 testes Deno)

## Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Zero novas tabelas; reuso total da Onda 17/18
- Simulação determinística baseada em fórmula linear documentada na ADR
- Proatividade opt-in com snapshot comparativo client-side (sem cron)
- Loop 360°: detectar → simular → aplicar → medir → coachear → reagendar

## Ordem de execução
1. Edge function `voip-recommendation-simulate` + 4 testes
2. Hook + dialog `WhatIfSimulatorDialog` integrado no painel
3. Toggle de checagem proativa + snapshot comparativo
4. ADR-034 + memória + scorecard

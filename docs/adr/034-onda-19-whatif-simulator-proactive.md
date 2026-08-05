# ADR-034 — Onda 19: What-If Simulator + Recomendações Proativas Agendadas

## Status
Aceito — 2026-04-18

## Contexto
A Onda 18 entregou o ciclo de aprendizado contínuo (recomendar → aplicar → medir → coachear). Faltava (1) permitir ao operador **explorar cenários hipotéticos** antes de executar uma ação e (2) **antecipar regressões** sem depender de o usuário acessar a página de diagnóstico.

## Decisão
Implementar a **Onda 19** com dois pilares:

### 1. Simulação What-If determinística
- Edge function `voip-recommendation-simulate` (POST) recebe `{ recommendationId, mos?, jitter?, packetLoss? }` e projeta:
  - **Alertas evitados**: alertas cujo `mos_at_alert + Δmos ≥ 3.6` (threshold "poor").
  - **MOS/jitter/packet-loss projetados**: aplicação linear do delta sobre a média baseline (cap MOS em 5, jitter/loss ≥ 0).
  - **Usuários recuperados (%)**: amostras com MOS < 3.6 que cruzariam o threshold com Δ aplicado.
- Baseline: últimos **7 dias** de `call_quality_metrics` + `voip_quality_alerts`.
- JWT obrigatório, CORS centralizado, validação Zod-like (`_shared/validate.ts`).
- 4 testes Deno: auth, validação, projeção positiva, edge case sem dados.

### 2. UI WhatIfSimulatorDialog
- Disparado por botão "Simular" em cada card de `VoipRecommendationsPanel`.
- 3 sliders (ΔMOS, ΔJitter, ΔPacketLoss) + presets `conservador / realista / otimista`.
- KPIs: alertas evitados, ganho MOS, usuários recuperados.
- Gráfico bar comparativo "atual vs projetado" (recharts).
- CTA "Aplicar com esta projeção" → executa ação real e registra no histórico com `notes` contendo os deltas e a projeção.

### 3. Proatividade opt-in
- Toggle "Checagem proativa diária" em `RecommendationInsightsCard` (preferência em `localStorage`).
- Ao montar `/network-diagnostics` e passar >24h da última checagem, compara recomendações críticas atuais com snapshot anterior em `localStorage` (`voip-rec-last-snapshot`) e dispara `toast.warning` para cada nova.
- Sem cron/edge schedule: pura lógica client-side, custo zero.

## Por que projeção linear?
- Determinística, auditável, fácil de explicar ao usuário.
- Não inventa correlações que o histórico não suporta.
- Suficiente para apoiar decisão "vale aplicar agora?".
- Modelos não-lineares ficam para roadmap futuro caso o sample-size e a observabilidade justifiquem.

## Consequências
- ✅ Operador valida hipóteses antes de executar — reduz ações desnecessárias.
- ✅ Regressões críticas notificadas mesmo sem usuário abrir o painel.
- ✅ Zero novas tabelas; reuso total da Onda 17/18.
- ✅ Código ≤400 linhas/arquivo; tokens semânticos; PT-BR.
- ⚠️ Projeção linear é uma simplificação; documentar como tal na UI.
- ⚠️ Snapshot client-side é por dispositivo; aceitável para v1.

## Métricas
- **20 edge functions** (era 19).
- **~109 testes Deno** (era ~105).
- 1 nova ADR, 1 novo memory, scorecard atualizado.

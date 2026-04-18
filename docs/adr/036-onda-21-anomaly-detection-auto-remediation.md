# ADR-036: Onda 21 — Detecção de Anomalias Estatística + Auto-Remediação Confiável

**Status:** Accepted
**Data:** 2026-04-18
**Contexto:** Fechar o ciclo preditivo do diagnóstico VoIP com detecção 100% determinística (sem IA) e ações automáticas seguras com whitelist rígida.

## Decisão

### 1. Classificação de anomalias (client-side determinístico)
A edge function `voip-anomaly-detector` (Onda 14) já entrega anomalias estatísticas (z-score). O hook `useVoipAnomalies` enriquece com `kind`:
- **outage** — `mos < 2.5 critical` ou `volume == 0 critical`
- **drift** — `2.5 ≤ |z| < 3.5` (desvio sustentado moderado)
- **spike** — caso geral (pico isolado)

### 2. Edge function `voip-anomaly-remediation`
- `POST { anomalyId, metric, kind, dryRun?, notes? }`
- **Whitelist rígida** com 9 ações pré-aprovadas (3 métricas × 3 tipos), todas `destructive: false`
- Combinações desconhecidas → `noop` (fail-safe)
- Idempotência: lookup em `voip_recommendation_actions.notes` por chave `anomaly:<id>` em janela de 1h
- Registra outcome `auto_applied` reusando tabela existente

### 3. Auto-remediação opt-in
- Toggle `localStorage` (`voip-anomaly-auto-remediate`)
- Quando ativo, anomalias `outage` disparam remediação silenciosa via `mutate({ silent: true })`
- Set em ref evita re-disparo na mesma sessão

### 4. UI
- `AnomalyDetectionCard` agora com sparkline (recharts), `ReferenceLine` no baseline, badges severidade/tipo, botão "Remediar" com confirmação e "Dispensar"
- Posicionado acima de `RecommendationInsightsCard` em `/network-diagnostics`

## Consequências
- **24 edge functions** total; **~127 testes Deno** (4 novos: planRemediation × 3 + idempotencyKey)
- Zero novas tabelas; reuso de `call_quality_metrics` + `voip_recommendation_actions`
- Loop completo: detectar (estatística) → classificar (determinístico) → remediar (whitelist) → registrar (auditável) → coachear (Onda 18)
- Auditável e reproduzível — sem dependência de IA para decisões críticas

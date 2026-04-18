---
name: voip-anomaly-detection
description: Onda 21 — classificação spike/drift/outage + edge function voip-anomaly-remediation com whitelist rígida de 9 ações não-destrutivas + idempotência 1h + toggle auto-remediação localStorage
type: feature
---

## Onda 21 (ADR-036)

### Classificação determinística (`useVoipAnomalies`)
- `outage`: MOS<2.5 critical ou volume==0 critical
- `drift`: 2.5 ≤ |z| < 3.5
- `spike`: demais

### Edge function `voip-anomaly-remediation`
- POST `{ anomalyId, metric, kind, dryRun?, notes? }`
- Whitelist 3×3 (mos|jitter|volume × spike|drift|outage), todas não destrutivas
- Idempotência: notes contém `[anomaly:<id>]`, bloqueio 1h
- Registra em `voip_recommendation_actions` com `outcome: 'auto_applied'`
- 4 testes Deno (planRemediation × 3 + idempotencyKey)

### Hooks
- `useVoipAnomalies` — query staleTime 2min, classifica e atribui id estável
- `useAnomalyRemediation` — mutation com toast (suporta `silent` para auto)

### UI
- `AnomalyDetectionCard` reescrito: sparkline recharts + ReferenceLine baseline + dialog de confirmação + toggle auto-remediação (`localStorage: voip-anomaly-auto-remediate`)
- Auto-disparo apenas para `outage` quando toggle ativo
- Posicionado acima de `RecommendationInsightsCard`

### Princípio
Detecção e ação 100% determinísticas, auditáveis e idempotentes. Zero dependência de IA para decisões críticas.

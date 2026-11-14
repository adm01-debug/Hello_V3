# SLI / SLO — Observabilidade

**Versão:** 1.0 · **Adicionado em:** 2026-11-14

Contrato de observabilidade do sistema. SLIs (indicadores medidos) alimentam o `health-check`; quando o status deriva de `operational`, um log estruturado `slo_violation_*` é emitido (consumível por Supabase Logs / Logflare / webhook).

## SLIs

| SLI | Fonte | Janela |
|---|---|---|
| Disponibilidade de trunks VoIP (`trunkUptimePct`) | `voip_trunk_health_checks.reachable` | 15 min |
| Taxa de erro de webhooks (`webhookErrorRate`) | `webhook_flush_metrics.sent/failed` | 15 min |
| Latência p95 de webhooks | `webhook_flush_metrics.duration_ms` | 15 min |

## SLOs

| SLO | Limite | Status health-check |
|---|---|---|
| Trunks disponíveis ≥ 99% | `trunkUptimePct >= 99` | `operational` |
| Trunks entre 95% e 99% | `95 <= uptime < 99` | `degraded` |
| Trunks < 95% | `uptime < 95` | `outage` |
| Erro webhooks < 1% | `errorRate < 1` | `operational` |
| Erro webhooks 1–5% | `1 <= errorRate < 5` | `degraded` |
| Erro webhooks ≥ 5% | `errorRate >= 5` | `outage` |

Qualquer componente em `degraded`: health-check global = `degraded`; qualquer `outage` → global `outage`.

## Alerta

Quando `overall != operational`, `health-check` emite:

```
{"level":"error","event":"slo_violation_<degraded|outage>","ts":"...","error":"downtime >= threshold","components":{...}}
```

## Instrumentação existente

- `health-check` (edge function pública) — consolida SLIs e deriva o status.
- Logs JSON em edge functions (`_shared/observability.ts`): `logInfo/logError/logRequest/withRequestLog`.
- Runbook de incidentes em `docs/runbooks/incident-response.md`.

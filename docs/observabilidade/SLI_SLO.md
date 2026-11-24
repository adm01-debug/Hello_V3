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
| Trunks disponíveis ≥ 99,9% | `trunkUptimePct >= 99.9` | `operational` |
| Trunks entre 95% e 99,9% | `95 <= uptime < 99.9` | `degraded` |
| Trunks < 95% | `uptime < 95` | `outage` |
| Erro webhooks < 1% | `errorRate < 1` | `operational` |
| Erro webhooks 1–5% | `1 <= errorRate < 5` | `degraded` |
| Erro webhooks ≥ 5% | `errorRate >= 5` | `outage` |

Qualquer componente em `degraded`: health-check global = `degraded`; qualquer `outage` → global `outage`.

A meta é uma só: `SLO_TARGETS` em `supabase/functions/health-check/index.ts` (uptime 99,9%, erro de
webhook 1%, p95 2000 ms, janela 15 min). O valor de 99,9% é o SLA contratual publicado na página de
status, e a edge devolve os alvos na resposta (`slo_targets`), junto de `window_minutes`. O painel
admin (`src/pages/admin/SloDashboard.tsx`) exibe esses valores — não existe meta duplicada no
frontend. O error budget usa a mesma meta: a tolerância do uptime é 0,1% (não 1%).

## Alerta

Quando `overall != operational`, `health-check` emite:

```
{"level":"error","event":"slo_violation_<degraded|outage>","ts":"...","error":"downtime >= threshold","components":{...}}
```

## Error budget

Cada componente expõe um bloco `error_budget` calculado a partir do SLI da janela de 15 min:

| Campo | Significado |
|---|---|
| `remaining_pct` | quanto da tolerância de falha ainda resta (100 = nada consumido) |
| `burn_rate` | velocidade de consumo. `1` = exatamente no ritmo que estoura o SLO no fim da janela; `5` = estoura 5× mais rápido |
| `tolerance_pct` | tolerância usada, em percentual (0,1 para alvo 99,9%) |
| `status` | `healthy` (burn < 0,5) · `warning` (0,5 ≤ burn < 1) · `exhausted` (burn ≥ 1) · `unknown` (< 10 amostras) |

`remaining_pct` e `burn_rate` medem coisas diferentes: o primeiro é o estado acumulado, o segundo é a
tendência. Um pico curto zera o budget sem indicar tendência; burn rate alto indica que o SLO vai estourar
antes do fim da janela.

Quando um budget está `exhausted` mas o status geral ainda é `operational`, o `health-check` emite:

```
{"level":"error","event":"slo_budget_exhausted","error":"error budget exhausted","exhausted":["trunks"],"components":{...}}
```

É o alerta antecipado — o SLO ainda não foi violado, mas a margem acabou.

Cálculo em `supabase/functions/health-check/slo-budget.ts`, testes em `__tests__/slo-budget_test.ts`
(11 casos: limites exatos, amostra insuficiente, valores não finitos, alvo de 100%).

## Instrumentação existente

- `health-check` (edge function pública) — consolida SLIs e deriva o status.
- Logs JSON em edge functions (`_shared/observability.ts`): `logInfo/logError/logRequest/withRequestLog`.
- Runbook de incidentes em `docs/runbooks/incident-response.md`.

## Como ler os logs em produção

As edge functions emitem JSON de uma linha (`logInfo/logError/logRequest`). O CLI do Supabase **não** tem
subcomando de leitura de logs; o acesso é pelo dashboard:

- **Dashboard → Edge Functions → <função> → Logs** — filtra por função (origem destinatária dos eventos).
- Filtro sugerido: `event == "request" || event == "slo_violation"` para ver requests e alertas de SLO.
- Logs ficam retidos conforme o plano do projeto (retenção do Logflare).

Não há necessidade de infra extra: a saída já é estruturada e consumível por qualquer agregador que
leia o stream de logs do projeto (ex.: Logflare direto, se configurado no dashboard).

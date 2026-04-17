---
name: voip-executive-intelligence
description: Onda 13 — Inteligência executiva e drill-down de qualidade VoIP. QualityHeatmap (7×24, MOS por hora/dia), AgentQualityRanking (drill-down 24h ordenável), edge function voip-quality-heatmap (4 testes Deno), bridge automático voip_quality_alerts → notifications (apenas poor/offline) via trigger PostgreSQL.
type: feature
---

# Onda 13 — Inteligência Executiva VoIP

## UI (todos em `/network-diagnostics`)
- `src/components/network/QualityHeatmap.tsx` — Grid 7 dias × 24 horas. Cor por bucket (verde MOS≥4, amarelo 3.5-4, vermelho <3.5, cinza sem dados). Tooltip com count, MOS, jitter p95. Resumo (saudáveis/medianos/ruins).
- `src/components/network/AgentQualityRanking.tsx` — Tabela ordenável (agente, chamadas 24h, MOS médio, alertas, SLA%). Badge "CRÍTICO" em MOS<3.5. Cores semânticas por threshold.

## Backend
- `supabase/functions/voip-quality-heatmap/index.ts` — `GET ?days=7` (1-30). Agrega `call_quality_metrics` por (UTC dow, hour). Retorna matriz 7×24 com `{count, mos_avg, jitter_p95}`. JWT, CORS, x-request-id. 4 testes Deno.
- Trigger `bridge_voip_alert_to_notification` em `voip_quality_alerts` (AFTER INSERT) — espelha alertas `poor`/`offline` em `public.notifications` (categoria `call`, type `voip_quality`, action_url `/network-diagnostics`). Alertas `degrading` ficam só no toast/dashboard. Realtime herdado da subscrição existente em `notifications`.

## Padrões aplicados
- ≤400 linhas/arquivo
- Reuso total: zero schema novo, zero dependência nova
- RLS herdada (agente vê próprios alertas; admin/supervisor vê tudo)
- Sonner para erros, logger central com contexto

## ADR
- ADR-028 (`docs/adr/028-onda-13-inteligencia-executiva-voip.md`)

# ADR-026 — Onda 11: Inteligência Preditiva de Qualidade VoIP

**Data:** 2026-04-17
**Status:** Aceito
**Contexto:** Ondas 1-10 entregaram monitoramento reativo (badge no header, métricas persistidas, página `/network-diagnostics`). Faltava camada preditiva e visão executiva agregada.

## Decisão

Adicionar três capacidades sem refactor especulativo:

1. **Detecção preditiva de degradação** — `useQualityTrendAnalyzer` mantém janela de 5 amostras de MOS e calcula slope via regressão linear simples. Toast preventivo via `sonner` quando slope ≤ −0.15 e MOS ainda em zona aceitável (≥3.6). Plugado em `useSipCall` somente durante chamadas ativas.

2. **Edge function `voip-sla-report`** — agrega `call_quality_metrics` por `day|week|month` retornando: `total_calls`, `sla_pct` (chamadas com MOS≥4.0), `mos_avg`, `jitter_p95_ms`, `rtt_p95_ms`, `packet_loss_avg_pct` para período atual e anterior (comparação). JWT obrigatório via `getClaims`, CORS centralizado (`buildCorsHeaders`), validação de período via `_shared/validate.oneOf`, tracing via `x-request-id`. 6 testes Deno.

3. **Cards SLA + export CSV** — componente `SlaReportCards` adicionado a `/network-diagnostics` com gauge de SLA, p95 jitter/RTT e deltas vs período anterior. Botão de export CSV client-side.

## Performance

Migration adiciona índice `idx_call_quality_metrics_created_mos` em `(created_at DESC, mos_avg)` para acelerar agregações.

## Alternativas consideradas

- **Cron job materializando agregados** — descartado: volume atual (~dezenas de chamadas/dia) não justifica. Edge function on-demand com índice é suficiente.
- **WebSocket push para alerta de degradação** — descartado: análise client-side é mais simples, sem custo de infra, e o alerta é local ao agente afetado.

## Consequências

- ✅ Agentes recebem aviso proativo antes da chamada cair
- ✅ Supervisores têm visão executiva de SLA com tendência
- ✅ Zero novas dependências; reuso total da tabela existente
- ✅ Arquivos ≤400 linhas (componente extraído de `NetworkDiagnostics`)
- ⚠️ Slope threshold (−0.15) calibrado heuristicamente; pode precisar ajuste com dados de produção

## Arquivos

- `supabase/migrations/*_idx_call_quality_metrics_created_mos.sql`
- `supabase/functions/voip-sla-report/index.ts` + `__tests__/index.test.ts`
- `src/hooks/useQualityTrendAnalyzer.ts`
- `src/hooks/useSipCall.ts` (integração do trend analyzer)
- `src/components/network/SlaReportCards.tsx`
- `src/pages/NetworkDiagnostics.tsx` (integração do card)

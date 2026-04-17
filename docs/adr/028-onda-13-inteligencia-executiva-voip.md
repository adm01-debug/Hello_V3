# ADR-028: Onda 13 — Inteligência Executiva e Drill-Down VoIP

**Status:** Accepted
**Date:** 2026-04-17
**Context:** Ondas 9-12 entregaram detecção, persistência e auto-remediação de eventos de qualidade VoIP. Faltava transformar os dados acumulados em `call_quality_metrics` e `voip_quality_alerts` em insights acionáveis para gestão (heatmap temporal, ranking por agente) e fechar o loop com a central de notificações já existente.

## Decision

Adicionar três capacidades sem refactor invasivo:

### 1. Heatmap temporal 7×24
- Edge function `voip-quality-heatmap` agrega `call_quality_metrics` por (UTC dow, hour) nos últimos N dias (1-30).
- Componente `QualityHeatmap` renderiza grid colorido por threshold de MOS, com tooltip por bucket.
- Permite identificar visualmente padrões de degradação por horário (ex.: pico às 14h, queda nas sextas).

### 2. Drill-down por agente (24h)
- Componente `AgentQualityRanking` consulta `call_quality_metrics` agrupado por `agent_name`.
- Tabela ordenável (agente, chamadas, MOS médio, alertas, SLA%), com badge "CRÍTICO" em MOS<3.5.
- Cores semânticas (success/warning/destructive) refletem thresholds de qualidade.

### 3. Bridge automático para notificações
- Trigger PostgreSQL `bridge_voip_alert_to_notification` em `voip_quality_alerts` (AFTER INSERT).
- Apenas alertas `poor` e `offline` geram notificação (degrading = só toast efêmero).
- Notificação criada em `public.notifications` (type `voip_quality`, action_url `/network-diagnostics`).
- Realtime e badge de não-lidos são herdados da subscrição já existente em `notifications` — zero código frontend novo.

## Rationale

- **Reuso total**: nenhum schema novo, nenhuma dependência nova, nenhuma alteração de RLS.
- **Realtime gratuito**: bridge via trigger evita duplicar lógica de subscrição.
- **Separação de severidade**: `degrading` (preventivo) não polui central; `poor`/`offline` (acionável) sim.
- **Drill-down compatível com RLS**: agente vê apenas seus dados (RLS de `call_quality_metrics`).

## Consequences

- **Positivas:** insight executivo imediato; central única de alertas; trend analysis sem custo extra.
- **Atenção:** trigger `bridge_voip_alert_to_notification` é `SECURITY DEFINER` — limitado a INSERT em `notifications` com `user_id` herdado do alerta, sem possibilidade de elevação.
- Total de testes Deno: 73 em 12 edge functions.

## Files
- `supabase/functions/voip-quality-heatmap/index.ts` + `__tests__/index.test.ts`
- `src/components/network/QualityHeatmap.tsx`
- `src/components/network/AgentQualityRanking.tsx`
- `src/pages/NetworkDiagnostics.tsx` (integração)
- Migration: trigger `bridge_voip_alert_to_notification`

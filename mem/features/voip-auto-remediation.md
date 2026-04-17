---
name: voip-auto-remediation
description: Auto-remediação e persistência de alertas de qualidade VoIP — tabela voip_quality_alerts, hook useVoipAutoRemediation com throttle/toast action, QualityAlertsCard em /network-diagnostics, edge function voip-quality-alerts-summary
type: feature
---

# Onda 12 — Auto-Remediação e Alertas Persistentes VoIP

## Backend
- Tabela `voip_quality_alerts` (alert_type degrading|poor|offline, mos_at_alert, slope, jitter_ms, rtt_ms, remediation_action, acknowledged_at). RLS: agente vê próprios; admin/supervisor vê todos. Índices `(created_at DESC, user_id)` + parcial em não reconhecidos.

## Hooks
- `src/hooks/useQualityTrendAnalyzer.ts` — agora persiste alertas via `supabase.from('voip_quality_alerts').insert(...)` quando degradação detectada. Aceita `onSevereDegradation` callback.
- `src/hooks/useVoipAutoRemediation.ts` — sugere reconexão SIP via toast com action button. Throttle 30s. Nunca age sem confirmação.
- `src/hooks/useSipCall.ts` — plugado: passa `callSessionId`, `jitterMs`, `rttMs` ao analyzer e fornece callbacks `reconnect`/`endCall` ao remediation.

## UI
- `src/components/network/QualityAlertsCard.tsx` — em `/network-diagnostics`. Lista 20, filtro por tipo, badge de não reconhecidos, "Marcar todos como lidos".

## Edge Function
- `supabase/functions/voip-quality-alerts-summary/index.ts` — `GET ?period=day|week|month`. Retorna contagem por tipo, top 5 usuários, MOS médio. JWT obrigatório, 4 testes Deno.

## Como usa
```tsx
useQualityTrendAnalyzer(mos, isActive, {
  callSessionId,
  jitterMs,
  rttMs,
  onSevereDegradation: ({ mos, slope }) => remediation.suggest({ mos, slope }),
});
```

## ADR
- ADR-027 (`docs/adr/027-onda-12-auto-remediacao-voip.md`)

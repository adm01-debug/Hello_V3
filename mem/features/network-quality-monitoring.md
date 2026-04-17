---
name: network-quality-monitoring
description: Monitoramento de internet local (navigator.onLine + ping) e qualidade VoIP (RTCPeerConnection.getStats com MOS via E-Model) com persistência em call_quality_metrics
type: feature
---

# Monitoramento de Rede e Qualidade VoIP (Onda 9)

## Hooks
- `src/hooks/useNetworkMonitor.ts` — `navigator.onLine` + `NetworkInformation API` + ping a `health-check` a cada 10s. Estados: `online | unstable | offline | checking`. Classificação por latência (≤150ms ok, ≤400ms instável, >400ms ruim).
- `src/hooks/useVoipQualityMonitor.ts` — coleta de `RTCPeerConnection.getStats()` a cada 2s. Métricas: jitter, packet loss, RTT, audioLevel. MOS calculado via E-Model simplificado (1.0–5.0). Persiste agregado ao final em `call_quality_metrics`.

## Componentes UI
- `src/components/calls/NetworkStatusBadge.tsx` — badge cyberpunk no header de `/calls` (verde/amarelo/vermelho) com tooltip de latência, effectiveType, downlink, RTT.
- `src/components/calls/CallQualityIndicator.tsx` — barras de sinal (1-5) baseadas no MOS, toast sonner automático ao degradar para `poor`.

## Backend
- Tabela `call_quality_metrics`: call_session_id, agent_name, channel, mos_avg/min, jitter_avg/max_ms, packet_loss_pct, rtt_avg/max_ms, samples_count, quality_label, raw_samples (jsonb).
- RLS: agente vê suas chamadas; admin/supervisor veem todas.

## Como usar
```tsx
const quality = useVoipQualityMonitor(peerConnection, {
  callSessionId, agentName, channel: 'webrtc', persistOnEnd: true,
});
<CallQualityIndicator quality={quality} />
```

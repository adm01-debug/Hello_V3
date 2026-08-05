# ADR-024 — Onda 9: Monitoramento de Rede e Qualidade VoIP

**Status:** Aceito
**Data:** 2026-04-17

## Contexto
O sistema possui módulo de conexão VoIP completo (SIP via JsSIP, WebRTC, Wavoip) mas não dispunha de:
1. Monitoramento de internet local (offline/instável)
2. Métricas de qualidade da chamada VoIP (jitter, perda, RTT, MOS)

Usuários reportavam quedas de chamada e qualidade ruim sem ferramentas para diagnóstico ou alertas proativos.

## Decisão
Implementar dois hooks observáveis sem dependências externas:

### `useNetworkMonitor`
- `navigator.onLine` + eventos `online`/`offline`
- `NetworkInformation API` (effectiveType, downlink, rtt do browser)
- Ping HTTP a cada 10s na edge function `health-check` (já com tracing)
- Classificação de status: online (≤150ms), unstable (≤400ms ou 1 falha), offline (≥2 falhas)

### `useVoipQualityMonitor`
- `RTCPeerConnection.getStats()` a cada 2s
- Cálculo de MOS via **E-Model simplificado** (R-factor → MOS 1.0–5.0)
- Agregação de samples e persistência em `call_quality_metrics` ao desmontar
- Toast automático ao degradar para qualidade `poor`

### Tabela `call_quality_metrics`
- RLS por agente (vê suas) + admin/supervisor (vê todas)
- Index em call_session_id, agent_name, created_at
- raw_samples limitado a 30 últimas amostras (proteção de tamanho)

## Componentes UI
- `NetworkStatusBadge` — header de `/calls` com tooltip detalhado
- `CallQualityIndicator` — barras de sinal (1-5) + toast em degradação

## Alternativas consideradas
- **WebRTC stats nativos sem MOS**: rejeitado — usuário precisa de score interpretável, não números brutos
- **Lib externa (webrtc-stats-gatherer)**: rejeitado — viola "sem novas dependências"
- **Persistir cada sample (2s)**: rejeitado — explosão de linhas; agregação ao final é suficiente

## Consequências
✅ Diagnóstico proativo de qualidade
✅ Histórico auditável por chamada/agente
✅ Zero novas dependências
⚠️ MOS via E-Model é aproximação (não substitui PESQ/POLQA)
⚠️ Browser sem `NetworkInformation API` (Safari) terá dados parciais — `effectiveType: null` é tratado

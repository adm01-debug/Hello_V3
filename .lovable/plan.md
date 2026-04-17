
Vou investigar o estado atual do projeto para responder com precisão sobre os 3 pontos: (1) módulo de conexão à linha VoIP, (2) monitoramento de internet local, (3) monitoramento da conexão VoIP.
<lov-tool-use id="toolu_vrtx_0136SAmYg2eBE1xrUWRx4k8N" name="code--search_files" integration-id="code" data="{\"query\": \"network|connection|latency|jitter|ping|quality\", \"search_dir\": \"src\", \"include_patterns\": \"*.tsx,*.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01FNnRieyHB9nXoNFEte73rM" name="code--list_dir" integration-id="code" data="{\"dir_path\": \"src/components/calls\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Fiusjc8e9sQSSeMAbKMG7g" name="code--list_dir" integration-id="code" data="{\"dir_path\": \"src/hooks\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EdjoH69weSmqt1WkENuRgH" name="code--list_dir" integration-id="code" data="{\"dir_path\": \"src/components/calls\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DPC8zRMREiNazL2NyDFf18" name="code--search_files" integration-id="code" data="{\"query\": \"jitter|packet.?loss|rtt|connection.?quality|networkQuality\", \"include_patterns\": \"*.ts,*.tsx\", \"search_dir\": \"src\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01HoUNmhzSjpD5uhXYy9V2ga" name="code--search_files" integration-id="code" data="{\"query\": \"navigator\\\\.onLine|NetworkInformation|effectiveType|downlink\", \"include_patterns\": \"*.ts,*.tsx\", \"search_dir\": \"src\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01E9NBj1oLq6puHDDgBDrtdD" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"*.ts,*.tsx\", \"query\": \"getStats|RTCPeerConnection.*stats|MOS|voipQuality|callQuality\", \"search_dir\": \"src\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CWFdC8PCKBWBNr6KiY1bxs" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"*.tsx,*.ts\", \"query\": \"SIP.*conect|sip.*status|registration.*sip|sipStatus\", \"search_dir\": \"src\"}">
</lov-tool-use>
I have enough context. The user is asking about three monitoring features: VoIP line connection module, local internet monitoring, and VoIP connection quality monitoring. Let me check briefly if any quality/network monitor exists.
<lov-tool-use id="toolu_vrtx_016msKzda9Qmt574ekKKDsua" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"*.tsx,*.ts\", \"query\": \"NetworkMonitor|InternetStatus|VoipMonitor|connectionMonitor\", \"search_dir\": \"src\"}">
</lov-tool-use>
<lov-plan>
## Resposta ao diagnóstico atual

**1. Módulo de conexão à linha VoIP?** ✅ **SIM.**
- `src/hooks/useSipCall.ts` (JsSIP via WebSocket/WSS) — registra na operadora, gerencia estados (`disconnected → connecting → registered → calling → ringing → active`), reconnect automático.
- `src/hooks/useWavoipCall.ts` — canal WhatsApp Voice.
- `src/components/calls/UnifiedSoftphone.tsx` — softphone unificado WebRTC + SIP + Wavoip.
- Edge functions `sip-config` e `wavoip-call` para credenciais e controle.

**2. Monitoramento de internet local?** ❌ **NÃO existe.**
- Nenhum uso de `navigator.onLine`, `NetworkInformation API`, `effectiveType`, `downlink` ou ping.
- Sem indicador online/offline no header nem aviso de queda de internet.

**3. Monitoramento da qualidade da conexão VoIP?** ❌ **NÃO existe.**
- Nenhum uso de `RTCPeerConnection.getStats()`, jitter, packet loss, RTT ou MOS score.
- O `useSipCall` só expõe status binário de registro — sem métricas de qualidade da chamada.

---

## Plano: Onda 9 — Monitoramento de Rede e Qualidade VoIP

### 9.1 Monitor de internet local (`useNetworkMonitor`)
- Hook `src/hooks/useNetworkMonitor.ts` consumindo `navigator.onLine`, evento `online`/`offline`, e `navigator.connection` (effectiveType, downlink, rtt).
- Ping periódico (10s) a `/health-check` edge function para latência real.
- Estados: `online | unstable | offline` com classificação por latência (<150ms ok, 150-400ms instável, >400ms ruim).

### 9.2 Monitor de qualidade VoIP (`useVoipQualityMonitor`)
- Hook que pluga em `RTCPeerConnection.getStats()` da sessão SIP/WebRTC ativa.
- Coleta a cada 2s: `jitter`, `packetsLost`, `roundTripTime`, `audioLevel`.
- Calcula **MOS Score** (1.0–5.0) via fórmula E-Model simplificada.
- Persiste métricas agregadas em nova tabela `call_quality_metrics` (call_id, mos_avg, jitter_avg, packet_loss_pct, rtt_avg, samples).

### 9.3 UI — Indicadores em tempo real
- `src/components/calls/NetworkStatusBadge.tsx` — badge no header (verde/amarelo/vermelho) com tooltip detalhando latência, tipo de rede e status SIP.
- `src/components/calls/CallQualityIndicator.tsx` — indicador no `ActiveCallBar` mostrando barras de sinal (1-5) baseado no MOS, com tooltip de jitter/loss/RTT.
- Toast (sonner) quando qualidade degradar para ruim durante chamada ativa.

### 9.4 Página de diagnóstico (`/network-diagnostics`)
- Nova rota acessível por admin/supervisor.
- Painel cyberpunk neon com:
  - Status atual da internet (gauge de latência)
  - Status SIP/Wavoip (registrado/desconectado, uptime)
  - Histórico de qualidade das últimas 10 chamadas (chart Recharts)
  - Botão "Testar conexão" (executa ping + STUN test)

### 9.5 Backend
- Migration: tabela `call_quality_metrics` com RLS (agente vê suas chamadas; admin/supervisor vê todas).
- Reuso da edge function existente `health-check` para ping (já tem tracing).

### 9.6 Documentação
- ADR-024 (`docs/adr/024-onda-9-monitoramento-voip.md`).
- Memória `mem/voip/network-quality-monitoring.md` + atualização do `mem/index.md`.
- Atualização do scorecard.

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon (Orbitron + glassmorphism).
- Zero breakage; tracing via `traceHeaders()` em todas chamadas a edge functions.
- Sem novas dependências — usa APIs nativas do navegador.

### Ordem de execução
1. 9.5 Migration `call_quality_metrics` + RLS
2. 9.1 `useNetworkMonitor`
3. 9.2 `useVoipQualityMonitor` (integração com `useSipCall`)
4. 9.3 Componentes de UI (badge + indicator + toasts)
5. 9.4 Página `/network-diagnostics` + rota + entrada no menu
6. 9.6 ADR-024 + memória + scorecard

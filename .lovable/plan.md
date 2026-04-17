
Status: Ondas 1-9 entregues. Sistema 10/10 com monitoramento de rede e qualidade VoIP completos (hooks `useNetworkMonitor`, `useVoipQualityMonitor`, badge no header de `/calls`, indicador de chamada, persistência em `call_quality_metrics`).

Pendência identificada da Onda 9: a página dedicada `/network-diagnostics` (item 9.4 do plano original) ainda não foi criada. Proponho a Onda 10 para fechar esse loop e adicionar histórico auditável.

## Onda 10 — Diagnóstico de Rede & VoIP (fechamento da Onda 9)

### 10.1 Página `/network-diagnostics`
`src/pages/NetworkDiagnostics.tsx` (admin/supervisor):
- Gauge de latência atual + status de internet (`useNetworkMonitor`)
- Card de status SIP (registrado/desconectado, servidor, uptime)
- Histórico das últimas 20 chamadas com MOS, jitter, packet loss, RTT (query a `call_quality_metrics`)
- Gráfico Recharts de MOS médio nas últimas 24h
- Botão "Testar conexão agora" (ping + STUN test via `stun.l.google.com`)
- Estética cyberpunk neon (Orbitron, glassmorphism, ≤400 linhas)

### 10.2 Rota + navegação
- Adicionar rota em `src/App.tsx` protegida por `RoleGuard` (admin/supervisor)
- Entrada no menu lateral em `src/components/layout/AppSidebar.tsx` (ícone `Activity`)
- `usePageTitle('Diagnóstico de Rede')`

### 10.3 Integração do `useVoipQualityMonitor` no `useSipCall`
Hoje o monitor existe mas não é plugado automaticamente. Conectar a `RTCPeerConnection` da sessão JsSIP ativa em `useSipCall.ts` para popular `call_quality_metrics` durante chamadas reais.

### 10.4 Componente `SipConnectionStatus`
`src/components/calls/SipConnectionStatus.tsx` — badge compacto no header de `/calls` mostrando estado SIP (registrado/conectando/erro), complementando o `NetworkStatusBadge` já existente.

### 10.5 Documentação
- ADR-025 (`docs/adr/025-onda-10-diagnostico-rede.md`)
- Atualizar `mem/features/network-quality-monitoring.md` com a nova página
- Atualizar `mem/index.md` e `docs/audit/scorecard-final.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso total dos hooks já existentes; sem novas dependências
- Zero breakage; RLS de `call_quality_metrics` já garante isolamento

### Ordem
1. 10.3 Plugar `useVoipQualityMonitor` no `useSipCall`
2. 10.4 `SipConnectionStatus` + integração no header
3. 10.1 Página `NetworkDiagnostics.tsx`
4. 10.2 Rota + sidebar + RoleGuard
5. 10.5 ADR-025 + memórias + scorecard

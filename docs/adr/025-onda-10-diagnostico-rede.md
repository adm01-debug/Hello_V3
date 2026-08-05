# ADR-025 — Onda 10: Diagnóstico de Rede & VoIP

**Status:** Aceito
**Data:** 2026-04-17
**Decisores:** Tech Lead

## Contexto
A Onda 9 entregou hooks de monitoramento (`useNetworkMonitor`, `useVoipQualityMonitor`), persistência em `call_quality_metrics` e badges no header de `/calls`. Faltavam três peças para fechar o loop de observabilidade VoIP:

1. Página dedicada para visualizar histórico de qualidade auditável.
2. Plug automático do `useVoipQualityMonitor` no `useSipCall` (sem isso, a tabela nunca recebia dados de chamadas reais).
3. Indicador de status SIP no header (a `NetworkStatusBadge` cobria só internet local).

## Decisão
Implementar **Onda 10 — Diagnóstico de Rede & VoIP**:

- **`src/pages/NetworkDiagnostics.tsx`** (rota `/network-diagnostics`, supervisor/admin): cards de status (internet/MOS médio/total chamadas), gráfico Recharts de evolução do MOS, tabela das últimas 20 chamadas com MOS/jitter/loss/RTT, botão "Testar conexão" (ICE gathering via STUN do Google).
- **`src/hooks/useSipCall.ts`** agora expõe `quality` e ativa o monitor automaticamente quando a `RTCPeerConnection` da sessão JsSIP fica disponível (`accepted`/`confirmed`). Ao final da chamada, métricas agregadas são gravadas em `call_quality_metrics` via `persistOnEnd: true`.
- **`src/components/calls/SipConnectionStatus.tsx`**: badge compacto no header de `/calls` (registrado/conectando/erro/em chamada) complementando a `NetworkStatusBadge`.

## Consequências
- ✅ Operadores e supervisores têm uma página única para auditar qualidade VoIP histórica.
- ✅ Métricas reais de chamadas SIP passam a popular o BD automaticamente — antes a tabela ficava vazia.
- ✅ Status da linha VoIP visível em tempo real ao lado do status da internet local.
- ✅ Sem novas dependências; reuso total dos hooks da Onda 9.
- ⚠️ Métricas só são coletadas em chamadas SIP via JsSIP; canal Wavoip continua sem monitor (não expõe `RTCPeerConnection`).

## Arquivos
- `src/pages/NetworkDiagnostics.tsx` (nova)
- `src/components/calls/SipConnectionStatus.tsx` (nova)
- `src/hooks/useSipCall.ts` (integração com `useVoipQualityMonitor`)
- `src/pages/Calls.tsx` (header com SipConnectionStatus)
- `src/routes/protectedRoutes.tsx` (rota protegida)
- `src/components/layout/AppSidebar.tsx` (entrada na seção Segurança)

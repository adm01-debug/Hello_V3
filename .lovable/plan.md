
Status: Ondas 1-11 entregues. Sistema 10/10 com monitoramento reativo, diagnóstico completo e inteligência preditiva VoIP. Não restam itens dos roadmaps aprovados.

Para manter excelência sem refactor especulativo, proponho **Onda 12 — Auto-Remediação e Notificações Persistentes de Qualidade**: fechar o ciclo entre detecção (já existente) e ação (atualmente só toast efêmero).

## Onda 12 — Auto-Remediação e Alertas Persistentes VoIP

### 12.1 Persistência de eventos de degradação
Migration: tabela `voip_quality_alerts` (id, user_id, call_session_id, alert_type [`degrading`|`poor`|`offline`], mos_at_alert, slope, jitter_ms, rtt_ms, created_at, acknowledged_at). RLS: agente vê próprios; admin/supervisor vê todos. Índice em `(created_at DESC, user_id)`.

### 12.2 Hook de persistência
Estender `useQualityTrendAnalyzer` para gravar em `voip_quality_alerts` quando degradação detectada (não só toast). Reuso do `callSessionId` já fornecido por `useSipCall`.

### 12.3 Auto-remediação leve
Hook `src/hooks/useVoipAutoRemediation.ts`:
- Ao detectar `slope ≤ -0.15` E `currentMos < 3.5`, sugerir ações concretas via toast com action button:
  - "Reduzir qualidade do áudio" (renegociar codec via `session.renegotiate` com constraints reduzidos)
  - "Reconectar SIP" (chama `useSipCall.disconnect()` + `connect()`)
- Sem ação automática destrutiva — usuário sempre confirma.

### 12.4 Card de alertas no `/network-diagnostics`
`src/components/network/QualityAlertsCard.tsx`:
- Lista últimos 20 alertas (tabela com timestamp, tipo, MOS, ação tomada)
- Badge de "não reconhecidos" com botão "Marcar todos como lidos"
- Filtro por tipo (degrading/poor/offline)

### 12.5 Edge function `voip-quality-alerts-summary`
- `GET ?period=day|week`
- Retorna contagem por tipo, top 5 usuários afetados, MOS médio nos momentos de alerta
- JWT obrigatório, CORS centralizado, validação `oneOf`, `x-request-id`, 4 testes Deno

### 12.6 Documentação
- ADR-027 (`docs/adr/027-onda-12-auto-remediacao-voip.md`)
- `mem/features/voip-auto-remediation.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md`

### Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Reuso total dos hooks/tabelas existentes; sem novas dependências
- Zero breakage; RLS isola por agente

### Ordem
1. 12.1 Migration `voip_quality_alerts` + RLS + índice
2. 12.2 Persistência no `useQualityTrendAnalyzer`
3. 12.3 Hook `useVoipAutoRemediation` + integração no `useSipCall`
4. 12.4 Card de alertas no `/network-diagnostics`
5. 12.5 Edge function `voip-quality-alerts-summary` + testes
6. 12.6 ADR-027 + memória + scorecard

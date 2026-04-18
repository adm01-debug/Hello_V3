
Sistema **10/10 sustentado** após Ondas 23–32. Onda 32 entregou health check periódico de trunks. Próxima evolução incremental:

## Onda 33 — Failover Automático + Métricas de Uso por Trunk

### 1. Failover automático em `sip-config`
- Se trunk primário do agente está `offline` (last_health_status), retornar trunk secundário ativo (próximo por `priority` em `agent_trunk_assignments`)
- Logger registra evento `trunk_failover` com motivo
- Resposta inclui `failover: true` e `original_trunk_id` para o frontend exibir aviso

### 2. Tabela `voip_trunk_usage_metrics`
- Colunas: id, trunk_id (FK), agent_id, call_session_id, started_at, ended_at, duration_seconds, was_failover, failover_reason
- RLS: SELECT admin/supervisor; INSERT via SECURITY DEFINER por `useUnifiedSoftphone` ao final da chamada
- Índices: (trunk_id, started_at DESC), (agent_id, started_at DESC)

### 3. Hook `useTrunkUsageReporter`
- Ao iniciar chamada SIP, captura trunk_id da resposta de `sip-config`
- Ao finalizar, INSERT em `voip_trunk_usage_metrics` com duração
- Integração não-invasiva no `useUnifiedSoftphone`

### 4. Aba "Métricas" no painel `/admin/voip-trunks`
- `TrunkMetricsTab.tsx`: cards com total de chamadas, minutos consumidos, taxa de failover por trunk (últimos 7 dias)
- Gráfico de barras (recharts) — chamadas/dia por trunk
- Hook `useTrunkMetrics(trunkId, days)` (React Query, 2min staleTime)
- Filtro por período (24h/7d/30d)

### 5. Banner de failover no Softphone
- Componente `FailoverBanner.tsx` exibido brevemente (sonner toast) quando `sip-config` retorna `failover: true`
- Mensagem: "Linha primária offline — usando linha de backup"

### 6. ADR-047 + memória + índice
- `docs/adr/047-onda-33-failover-trunks.md`
- `mem/voip/trunks-failover-metrics.md`
- Atualizar `mem/index.md`

## Considerações
- **Backward-compatible**: agentes sem trunk secundário mantêm comportamento atual
- **Performance**: métricas registradas async, sem bloquear UI
- **Segurança**: RLS estrita, agentes só veem suas próprias métricas
- ≤400 linhas, PT-BR, sonner, logger central, cyberpunk

## Ordem de execução
1. Migration: tabela `voip_trunk_usage_metrics` + RLS + índices
2. Refactor `sip-config` (lógica de failover)
3. Hook `useTrunkUsageReporter` + integração softphone
4. `TrunkMetricsTab` + hook + integração no `VoipTrunksAdmin`
5. ADR-047 + memória + índice
6. Validação: linter Supabase + `tsc --noEmit`

Resultado: **10/10 sustentado** com resiliência automática a quedas de operadora e visibilidade total do consumo por linha.

# ADR-050 — Onda 36: Auditoria + Telemetria Operacional do Painel de Ramais

**Status:** Aceito
**Data:** 2026-04-18
**Contexto:** Onda 35 entregou bulk operations sem rastro. Sem visibilidade de uso real (chamadas) por ramal.

## Decisão

1. **Auditoria de bulk ops** via hook `useExtensionAudit.logBulk()` (fire-and-forget, RPC `log_audit_event`).
   - Actions: `bulk_assign_trunk`, `bulk_force_offline`, `bulk_export_csv`
   - `resource_type='extension_bulk'`, payload com `agent_ids`, `count`, e metadados específicos.

2. **Histórico por ramal** via hook `useExtensionAuditHistory` — query única em `audit_logs` com OR entre `resource_id = agent_id` e `details->agent_ids @> ["agent_id"]`. Limite 20 entradas.

3. **Telemetria de chamadas (7d)** integrada em `useExtensionsOverview`:
   - Query adicional `call_sessions` filtrada por `started_at >= now() - 7 days`
   - Agregação client-side por `agent_name`: `call_count_7d`, `last_call_at`, `avg_duration_seconds`
   - Health score ganha bônus condicional: +10 se `call_count_7d > 0` (engajamento real)

4. **Drawer ampliado**: nova aba "Histórico" com `ExtensionAuditTimeline` (timeline cyberpunk com ícones por tipo de ação, timestamp relativo PT-BR via date-fns).

5. **CSV expandido**: colunas `chamadas_7d` e `ultima_chamada` adicionadas ao export, mantendo retrocompatibilidade das colunas anteriores.

## Consequências

✅ Rastreabilidade total: quem fez o quê, quando, em quais ramais
✅ Detecção de ramais ociosos (sem chamadas em 7d → score baixo)
✅ Base para SLA por ramal e billing por uso
✅ Sem migrations — `audit_logs` e `call_sessions` já existiam com RLS adequada
⚠️ Query OR em `audit_logs` requer índice em `details` (jsonb) para escalar — aceitável até 100k logs

## Arquivos

- `src/hooks/useExtensionAudit.ts` (novo)
- `src/hooks/useExtensionAuditHistory.ts` (novo)
- `src/components/admin/extensions/ExtensionAuditTimeline.tsx` (novo)
- `src/hooks/useExtensionsOverview.ts` (estendido)
- `src/pages/admin/ExtensionsAdmin.tsx` (audit + coluna chamadas + CSV)
- `src/components/admin/extensions/ExtensionDetailsDrawer.tsx` (aba Histórico + card Atividade)

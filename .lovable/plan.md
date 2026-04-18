
## Onda 36 — Auditoria + Telemetria Operacional do Painel de Ramais

Próxima evolução do `/admin/extensions`: rastreabilidade total das ações administrativas e telemetria de uso por ramal.

### 1. Auditoria de Bulk Operations
- Toda ação em massa (atribuir trunk, forçar offline, export CSV) registrada via `log_audit_event` RPC
- Payload com: `action`, `resource_type='extension_bulk'`, `details` (count, agent_ids, trunk_id, etc.)
- Hook `useExtensionAudit` para invocar consistentemente

### 2. Histórico de Ações por Ramal (drawer)
- Nova aba "Histórico" no `ExtensionDetailsDrawer`
- Lista últimas 20 entradas de `audit_logs` filtradas por `resource_id = agent_id` ou onde `details->>'agent_ids'` contém o id
- Timeline cyberpunk com ícones por tipo de ação + timestamp relativo

### 3. Telemetria de Chamadas (overview)
- Coluna nova "Chamadas 7d" na tabela master
- Hook `useExtensionsOverview` agrega `call_sessions` agrupado por `agent_name` últimos 7 dias
- Score de saúde ganha bônus: agente com chamadas recentes (+0 a +10 condicional)

### 4. Drill-down "Última Atividade"
- Card na aba "Visão Geral" do drawer: última chamada, total 7d, duração média
- Botão "Ver chamadas" → deep-link para `/calls?agent={name}`

### 5. Export CSV expandido
- Adicionar colunas: `chamadas_7d`, `ultima_chamada`
- Manter retrocompatibilidade

### 6. ADR-050 + memória + índice
- `docs/adr/050-onda-36-auditoria-telemetria-ramais.md`
- Atualizar `mem/voip/painel-ramais-unificado.md` + `mem/index.md`

## Considerações
- ≤400 linhas, PT-BR, cyberpunk, sonner, logger central
- Sem migrations — `audit_logs` e `call_sessions` já existem com RLS adequada
- Performance: query de telemetria com agregação client-side simples (limite 7d)
- Audit calls são fire-and-forget (não bloqueiam UI em caso de falha)

## Ordem de execução
1. Hook `useExtensionAudit` para log centralizado
2. Estender `useExtensionsOverview` com `call_count_7d` + `last_call_at`
3. Plugar audit nas 3 ações em massa de `ExtensionsAdmin.tsx`
4. Adicionar coluna "Chamadas 7d" + atualizar export CSV
5. Aba "Histórico" + card "Atividade" no `ExtensionDetailsDrawer`
6. ADR-050 + memória + índice
7. Validação `tsc --noEmit`

Resultado: **rastreabilidade completa** do que foi feito por quem + visibilidade de **uso real** de cada ramal — base para SLA, billing por ramal e detecção de ramais ociosos.

---
name: Painel Unificado de Ramais
description: Tela /admin/extensions com visão 360° + bulk ops + health score + auditoria + telemetria de chamadas por ramal
type: feature
---

Painel unificado de gestão de ramais em `/admin/extensions` (admin only) — consolida dados antes fragmentados em 5 telas: cadastro de agentes, Multi-Device Ring, trunks VoIP, QR provisioning e LDAP sync.

**Arquitetura (ADR-048 + ADR-049 + ADR-050):**
- Hook `useExtensionsOverview` agrega 5 queries paralelas (`agents`, `user_profiles`, `agent_trunk_assignments` + `voip_trunks`, `agent_devices`, `call_sessions` últimos 7d) com realtime em `agents.status` e staleTime de 1min. Computa **`health_score` (0-100)** e **`health_issues: string[]`** client-side com pesos: trunk (+30), trunk healthy (+20), dispositivos (+15), online (+10), perfil completo (+15), **chamadas recentes (+10)**. Expõe também `call_count_7d`, `last_call_at`, `avg_duration_seconds`.
- Página `ExtensionsAdmin.tsx`: tabela com checkboxes (seleção múltipla + master indeterminado), busca, filtros (status, trunk, **health: healthy/warning/critical**), 4 cards de resumo (total/online/sem trunk/**score médio**), coluna **Chamadas 7d**, kebab menu por linha.
- Drawer `ExtensionDetailsDrawer` com **5 abas** (Geral/Dispositivos/Trunk/QR/**Histórico**) — aba Geral inclui card "Atividade 7d" (chamadas, duração média, última chamada relativa) com deep-link para `/calls?agent={name}`.
- Badges: `ExtensionStatusBadge`, `TrunkHealthBadge`, `HealthScoreBadge` (verde≥80, amarelo 50-79, vermelho<50, com tooltip de issues).

**Bulk Operations (Onda 35):**
- Barra flutuante glassmorphism quando ≥1 selecionado.
- **Atribuir trunk em massa**: `BulkAssignTrunkDialog` — DELETE assignments primários + INSERT batch.
- **Forçar offline**: UPDATE batch em `agents.status`.
- **Exportar CSV**: `lib/export/exportToCSV` com BOM UTF-8, **12 colunas** (inclui `chamadas_7d`, `ultima_chamada`), semicolon (Excel BR). Exporta seleção atual ou filtrados.

**Auditoria + Telemetria (Onda 36):**
- Hook `useExtensionAudit.logBulk()` — fire-and-forget via RPC `log_audit_event` para todas as ações em massa (`bulk_assign_trunk`, `bulk_force_offline`, `bulk_export_csv`) com `resource_type='extension_bulk'` e `details.agent_ids[]`.
- Hook `useExtensionAuditHistory(agentId)` — lista 20 últimas entradas em `audit_logs` filtrando por `resource_id = agentId` OR `details->agent_ids @> ["agentId"]`.
- Componente `ExtensionAuditTimeline.tsx` — timeline cyberpunk com ícones por tipo de ação e timestamp relativo PT-BR (date-fns).

**Ações rápidas (kebab):** editar agente, configurar dispositivos, atribuir trunk, gerar QR, copiar credencial SIP.
**Integração:** AppSidebar (Sistema), CommandPalette ("ramais"/"extensions"), card no Settings.
**ADRs:** docs/adr/048-onda-34-painel-unificado-ramais.md, docs/adr/049-onda-35-bulk-ops-health-score.md, docs/adr/050-onda-36-auditoria-telemetria-ramais.md

---
name: Painel Unificado de Ramais
description: Tela /admin/extensions com visão 360° + bulk ops + health score por ramal
type: feature
---

Painel unificado de gestão de ramais em `/admin/extensions` (admin only) — consolida dados antes fragmentados em 5 telas: cadastro de agentes, Multi-Device Ring, trunks VoIP, QR provisioning e LDAP sync.

**Arquitetura (ADR-048 + ADR-049):**
- Hook `useExtensionsOverview` agrega 4 queries paralelas (`agents`, `user_profiles`, `agent_trunk_assignments` + `voip_trunks`, `agent_devices`) com realtime em `agents.status` e staleTime de 1min. Computa **`health_score` (0-100)** e **`health_issues: string[]`** client-side com pesos: trunk (+30), trunk healthy (+20), dispositivos (+20), online (+15), perfil completo (+15).
- Página `ExtensionsAdmin.tsx`: tabela com checkboxes (seleção múltipla + master indeterminado), busca, filtros (status, trunk, **health: healthy/warning/critical**), 4 cards de resumo (total/online/sem trunk/**score médio**), kebab menu por linha.
- Drawer `ExtensionDetailsDrawer` com 4 abas (Geral/Dispositivos/Trunk/Provisionamento) — usa deep-links sem duplicar lógica.
- Badges: `ExtensionStatusBadge`, `TrunkHealthBadge`, `HealthScoreBadge` (verde≥80, amarelo 50-79, vermelho<50, com tooltip de issues).

**Bulk Operations (Onda 35):**
- Barra flutuante glassmorphism quando ≥1 selecionado.
- **Atribuir trunk em massa**: `BulkAssignTrunkDialog` — DELETE assignments primários + INSERT batch.
- **Forçar offline**: UPDATE batch em `agents.status`.
- **Exportar CSV**: `lib/export/exportToCSV` com BOM UTF-8, 10 colunas, semicolon (Excel BR). Exporta seleção atual ou filtrados.

**Ações rápidas (kebab):** editar agente, configurar dispositivos, atribuir trunk, gerar QR, copiar credencial SIP.
**Integração:** AppSidebar (Sistema), CommandPalette ("ramais"/"extensions"), card no Settings.
**ADRs:** docs/adr/048-onda-34-painel-unificado-ramais.md, docs/adr/049-onda-35-bulk-ops-health-score.md

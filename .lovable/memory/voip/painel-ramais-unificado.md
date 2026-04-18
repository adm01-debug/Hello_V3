---
name: Painel Unificado de Ramais
description: Tela /admin/extensions consolidando agentes, dispositivos, trunks e provisionamento em visão 360°
type: feature
---

Painel unificado de gestão de ramais em `/admin/extensions` (admin only) — consolida dados antes fragmentados em 5 telas: cadastro de agentes, Multi-Device Ring, trunks VoIP, QR provisioning e LDAP sync.

**Arquitetura:**
- Hook `useExtensionsOverview` agrega 4 queries paralelas (`agents`, `user_profiles`, `agent_trunk_assignments` + `voip_trunks`, `agent_devices`) com realtime em `agents.status` e staleTime de 1min.
- Página `ExtensionsAdmin.tsx`: tabela com busca, filtros (status, trunk), 4 cards de resumo (total/online/sem trunk/sem dispositivos), kebab menu de ações rápidas por linha.
- Drawer `ExtensionDetailsDrawer` com 4 abas (Geral/Dispositivos/Trunk/Provisionamento) — usa deep-links para páginas especializadas, sem duplicar lógica.
- Badges `ExtensionStatusBadge` (available/busy/away/offline) e `TrunkHealthBadge` (healthy/degraded/offline) com glow cyberpunk.

**Ações rápidas:** editar agente, configurar dispositivos, atribuir trunk, gerar QR, copiar credencial SIP.
**Integração:** AppSidebar (Sistema), CommandPalette ("ramais"/"extensions"), card no Settings.
**ADR:** docs/adr/048-onda-34-painel-unificado-ramais.md

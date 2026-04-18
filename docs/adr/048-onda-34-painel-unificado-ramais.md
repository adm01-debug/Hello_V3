# ADR-048 — Onda 34: Painel Unificado de Gestão de Ramais

**Status:** Aceito
**Data:** 2026-04-18

## Contexto
A gestão de ramais estava fragmentada em 5 telas distintas: cadastro de agentes (`/admin/users`), Multi-Device Ring (`/multi-device-ring`), atribuição de trunks (`/admin/voip-trunks`), provisionamento QR (`/qr-provisioning`) e LDAP Sync. Administradores precisavam navegar entre múltiplas páginas para obter visão completa de um ramal.

## Decisão
Criar página unificada `/admin/extensions` (somente admin) consolidando dados de `agents`, `user_profiles`, `agent_devices` e `agent_trunk_assignments` (+ saúde de `voip_trunks`) em uma única consulta agregada via React Query (`useExtensionsOverview`), com realtime em `agents.status`.

## Implementação
- **Hook:** `src/hooks/useExtensionsOverview.ts` — agregação client-side de 4 queries paralelas, mapeada para `ExtensionOverview[]`. Subscrição realtime invalida a query.
- **Página:** `src/pages/admin/ExtensionsAdmin.tsx` — tabela com busca/filtros (status, trunk), 4 cards de resumo (total/online/sem trunk/sem dispositivos), kebab menu por linha.
- **Drawer:** `ExtensionDetailsDrawer` — abas Geral/Dispositivos/Trunk/Provisionamento, deep-links para páginas especializadas (sem duplicar lógica).
- **Badges:** `ExtensionStatusBadge` + `TrunkHealthBadge` — cyberpunk neon com glow conforme tokens semânticos.
- **Navegação:** AppSidebar + CommandPalette + Settings card.

## Consequências
**Positivas:** visão 360° em 1 tela, fim da fragmentação, deep-links preservam SSOT das telas existentes.
**Negativas:** agregação client-side (aceitável para <1000 ramais; otimizar com VIEW SQL futura se necessário).

## Alternativas
- VIEW SQL — descartada por enquanto (mantém flexibilidade no client e zero migration).
- Refatorar 5 páginas em uma — descartada (aumentaria escopo e quebraria deep-links externos).

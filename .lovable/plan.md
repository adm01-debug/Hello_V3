
## Onda 34 — Painel Unificado de Gestão de Ramais

Tela única consolidando todos os dados de ramais hoje espalhados em 5 áreas distintas.

### 1. Página `/admin/extensions`
- Tabela master com todos os ramais cadastrados (`agents` + `user_profiles`)
- Colunas: Ramal, Nome, Status (realtime), Dispositivos, Trunk Primário, Saúde do Trunk, Ações
- Busca por nome/ramal + filtros (status, trunk, com/sem dispositivos)
- Badges cyberpunk neon para status (available/busy/away/offline)

### 2. Hook `useExtensionsOverview`
- Query consolidada via React Query agregando:
  - `agents` (id, name, extension, status)
  - `agent_devices` count por agente
  - `agent_trunk_assignments` + `voip_trunks` (trunk primário + saúde)
  - `user_profiles` (full_name, role)
- Realtime subscription em `agents.status`

### 3. Drawer `ExtensionDetailsDrawer`
- Abas: **Visão Geral**, **Dispositivos**, **Trunk VoIP**, **Provisionamento**
- Visão Geral: dados do agente + métricas rápidas (chamadas hoje, duração média)
- Dispositivos: lista inline de `agent_devices` (reutiliza componentes existentes)
- Trunk VoIP: trunk atribuído + botão "Trocar" → atalho para `/admin/voip-trunks`
- Provisionamento: botão "Gerar QR" → atalho para `/qr-provisioning?ext={ext}`

### 4. Ações Rápidas (kebab menu por linha)
- Editar agente → `/admin/users`
- Configurar dispositivos → `/multi-device-ring?agent={id}`
- Atribuir trunk → `/admin/voip-trunks?tab=assignments&agent={id}`
- Gerar QR Code → `/qr-provisioning?ext={ext}`
- Copiar credenciais SIP

### 5. Cards de resumo no topo
- Total de ramais | Online agora | Sem trunk atribuído | Sem dispositivos extras

### 6. Integração de navegação
- `AppSidebar`: novo item "Ramais" em Administração
- `CommandPalette`: comando "ramais" / "extensions"
- Settings.tsx: card link

### 7. ADR-048 + memória + índice
- `docs/adr/048-onda-34-painel-unificado-ramais.md`
- `mem/voip/painel-ramais-unificado.md`
- Atualizar `mem/index.md`

## Considerações
- ≤400 linhas por componente, PT-BR, sonner, logger central, cyberpunk neon
- Sem duplicação de lógica: drawer faz deep-link para páginas especializadas existentes
- RLS: admin/supervisor only
- Performance: query única consolidada, staleTime 1min

## Ordem de execução
1. Hook `useExtensionsOverview` + tipos
2. Página `ExtensionsAdmin.tsx` + tabela + filtros + cards resumo
3. `ExtensionDetailsDrawer.tsx` + abas
4. Rota `/admin/extensions` + AppSidebar + CommandPalette
5. ADR-048 + memória + índice
6. Validação: `tsc --noEmit`

Resultado: Admin tem **visão 360° de cada ramal** em uma única tela, com deep-links para ações especializadas — fim da fragmentação operacional.

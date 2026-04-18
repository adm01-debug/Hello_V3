
## Onda 31 — Painel Admin de Trunks VoIP (Multi-Linhas)

Substitui o modelo atual de trunk único via secrets por gestão completa de múltiplas linhas VoIP no banco, com CRUD admin e seleção por agente.

### 1. Migration — Tabela `voip_trunks` + `agent_trunk_assignments`
- `voip_trunks`: id, name, provider (enum: nvoip/directcall/totalvoice/generic/wavoip), sip_server, sip_username, sip_password_encrypted, sip_realm, transport (wss/tcp/udp), max_channels, priority, is_active, version, created_by, timestamps
- `agent_trunk_assignments`: agent_id, trunk_id, is_primary, version
- Senha criptografada via `pgsodium` (vault) ou base64 + secret server-side
- RLS: SELECT/INSERT/UPDATE/DELETE apenas `is_admin_user()`; agentes leem só seus assignments
- Triggers: `update_updated_at_column`, `enforce_optimistic_lock` (mantém padrão Onda 28)

### 2. Edge function `voip-trunks-manage`
- Actions: `list`, `create`, `update`, `delete`, `test-registration`, `decrypt-password` (apenas admin)
- JWT obrigatório + `is_admin_user()` check
- `test-registration`: tenta REGISTER SIP via WebSocket simulado e retorna status
- Rate limiting via `check_rate_limit` (10 req/min)

### 3. Refatorar `sip-config` edge function
- Buscar trunk ativo do agente em `agent_trunk_assignments` (primary) → `voip_trunks`
- Fallback para secrets legados se nenhum trunk configurado (compat)
- Retorna credenciais decifradas apenas para o agente dono do assignment

### 4. UI Admin — `/admin/voip-trunks`
- `src/pages/admin/VoipTrunksAdmin.tsx` (admin only via `is_admin_or_supervisor()`)
- Tabela com lista de trunks (nome, provider, status, canais, prioridade, badge ativo/inativo)
- Drawer de criação/edição (`VoipTrunkFormDrawer.tsx`) com Zod validation
- Botão "Testar Registro" → invoca `test-registration`, mostra resultado em sonner
- Aba "Atribuições" (`TrunkAssignmentsTab.tsx`) para mapear agentes ↔ trunks
- Hook `useVoipTrunks` (React Query, staleTime 2min)

### 5. Integração Settings + Sidebar
- Substituir aviso "em desenvolvimento" no Settings.tsx → CTA "Gerenciar Linhas VoIP" (admin) que navega para `/admin/voip-trunks`
- Adicionar item no `AppSidebar.tsx` (seção Admin): "Linhas VoIP" com ícone `Phone`
- Adicionar entrada no `CommandPalette.tsx`

### 6. ADR-045 + memória + índice
- `docs/adr/045-onda-31-painel-trunks-voip.md`
- `mem/voip/admin-trunks-panel.md`
- Atualizar `mem/index.md`

## Considerações
- **Backward-compatible**: secrets `SIP_*` continuam funcionando como fallback
- **Segurança**: senha nunca trafega no frontend; decifrada só em `sip-config` no momento da conexão SIP
- **Audit trail**: todos CRUD logados via `log_audit_event`
- **Locking**: `enforce_optimistic_lock` em `voip_trunks` e `agent_trunk_assignments` (entidades 8 e 9 do padrão)
- **PT-BR, sonner, logger central, ≤400 linhas/arquivo, cyberpunk**

## Ordem de execução
1. Migration: tabelas + RLS + triggers + enum provider
2. Edge function `voip-trunks-manage` + refactor `sip-config`
3. Hook + página `VoipTrunksAdmin` + drawer + aba assignments
4. Atualizar Settings.tsx + AppSidebar + CommandPalette
5. ADR-045 + memória + índice
6. Validação: linter Supabase + `tsc --noEmit`

Resultado: Admin gerencia múltiplas linhas VoIP via UI, agentes recebem trunk atribuído automaticamente, fim da dependência de secrets manuais para escalar operadoras.

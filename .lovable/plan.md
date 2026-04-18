
## Onda 35 — Bulk Operations + Health Score por Ramal

Painel de ramais entregue. Próxima evolução: ações em massa e score de saúde individual.

### 1. Coluna Health Score por ramal
- Cálculo client-side em `useExtensionsOverview`: 0-100 baseado em
  - Tem trunk ativo (+30) / trunk online (+20)
  - Tem ≥1 dispositivo (+20)
  - Status != offline (+15)
  - Perfil completo (full_name + email) (+15)
- Badge colorido na tabela (verde ≥80, amarelo 50-79, vermelho <50)
- Tooltip detalha o que falta

### 2. Seleção múltipla + Bulk Actions
- Checkbox por linha + "selecionar todos filtrados"
- Barra flutuante quando ≥1 selecionado: contador + ações
- Ações em massa:
  - **Atribuir trunk** → modal com select de trunk → INSERT batch em `agent_trunk_assignments`
  - **Forçar status offline** → UPDATE batch em `agents.status`
  - **Exportar CSV** → download client-side (ramal, nome, status, trunk, dispositivos, score)

### 3. Modal `BulkAssignTrunkDialog`
- Lista trunks ativos com saúde
- Confirmação com contagem ("Atribuir Trunk X a 12 ramais?")
- Toast de sucesso/erro via sonner + invalidate query

### 4. Filtro adicional "Health Score"
- Select: Todos | Saudáveis (≥80) | Atenção (50-79) | Críticos (<50)

### 5. Card de resumo extra
- Substituir "Sem Dispositivos" por "Score Médio" (com tendência)

### 6. ADR-049 + memória
- `docs/adr/049-onda-35-bulk-ops-health-score.md`
- Atualizar `mem/voip/painel-ramais-unificado.md`

## Considerações
- ≤400 linhas, PT-BR, cyberpunk neon, sonner, logger central
- Bulk operations em transação client-side com rollback de UI on error
- CSV gerado com BOM UTF-8 para Excel BR
- RLS já cobre INSERT em `agent_trunk_assignments` (admin only)

## Ordem de execução
1. Adicionar `health_score` + `health_issues` ao tipo `ExtensionOverview` e cálculo no hook
2. Componente `HealthScoreBadge.tsx`
3. Refator `ExtensionsAdmin.tsx`: checkboxes + barra flutuante + filtro score + card médio
4. `BulkAssignTrunkDialog.tsx` + função export CSV
5. ADR-049 + memória + índice
6. Validação `tsc --noEmit`

Resultado: Admin gerencia **dezenas de ramais simultaneamente** com visão de saúde individual — fim do clique-a-clique repetitivo.

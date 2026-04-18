# ADR-049 — Onda 35: Bulk Operations + Health Score por Ramal

## Status
Aceito — 2026-04-18

## Contexto
O painel unificado de ramais (Onda 34, ADR-048) entregou visão 360° por ramal individual, mas administrar dezenas de ramais ainda exigia clique-a-clique repetitivo. Faltava também uma medida única de "saúde" para priorizar atenção operacional.

## Decisão

### 1. Health Score (0-100) computado client-side
Cálculo em `useExtensionsOverview` ponderado por:
- Trunk atribuído (+30) / Trunk healthy (+20)
- ≥1 dispositivo extra (+20)
- Status != offline/inactive (+15)
- Perfil completo (full_name + email) (+15)

Cada ramal recebe `health_score: number` e `health_issues: string[]` para tooltip explicativo.

### 2. Componente `HealthScoreBadge`
Badge cyberpunk com 3 níveis (verde ≥80, amarelo 50-79, vermelho <50), ícone contextual (ShieldCheck/AlertTriangle/Heart) e tooltip listando os pontos faltantes.

### 3. Bulk Operations
- Checkbox por linha + master "selecionar todos filtrados" com estado indeterminado
- Barra flutuante (`fixed bottom-6 left-1/2`) glassmorphism com glow primary
- Ações em massa:
  - **Atribuir trunk**: `BulkAssignTrunkDialog` — DELETE assignments primários antigos + INSERT batch
  - **Forçar offline**: UPDATE batch em `agents.status` via `.in('id', ids)`
  - **Exportar CSV**: usa `lib/export/exportToCSV` com BOM UTF-8 (10 colunas, semicolon separator pt-BR)

### 4. Filtro Health Score
Select adicional: Todos | Saudáveis (≥80) | Atenção (50-79) | Críticos (<50)

### 5. Card "Score Médio"
Substitui "Sem Dispositivos" no grid de stats (que se tornou redundante com o score). Tom dinâmico: success/warning/destructive baseado na média.

## Consequências

**Positivas**
- Admin gerencia dezenas de ramais simultaneamente (atribuir trunk a 50 agentes em 2 cliques)
- Visão de saúde consolidada — basta filtrar "Críticos" para encontrar ramais mal configurados
- Zero migrations necessárias — score é derivação client-side dos dados já agregados
- Export CSV pronto para Excel BR (BOM + semicolon)

**Negativas / Trade-offs**
- Score é heurístico simples; pesos são opinionados e não configuráveis
- Bulk delete+insert de assignments não é transacional (mas o impacto é restrito a admin)
- Página chegou a ~360 linhas (próximo do limite de 400)

## Alternativas consideradas
- Cálculo do score em SQL via view: rejeitado por acoplar lógica de negócio ao schema
- Bulk operations via edge function: desnecessário, RLS já cobre admin-only
- Scorecard ML-based: overkill para a Onda 35

## Referências
- ADR-048 (Painel Unificado de Ramais)
- `src/hooks/useExtensionsOverview.ts`
- `src/pages/admin/ExtensionsAdmin.tsx`
- `src/components/admin/extensions/{HealthScoreBadge,BulkAssignTrunkDialog}.tsx`

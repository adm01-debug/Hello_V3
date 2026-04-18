
Onda 17 — Auto-Apply Programado de Recomendações + Histórico Auditável.

## Escopo

### 1. Migration: `voip_recommendation_actions`
- Colunas: `id uuid pk`, `user_id uuid not null`, `recommendation_id text`, `category text`, `severity text`, `action_type text`, `action_payload jsonb`, `outcome text check in (applied|snoozed|dismissed|auto_applied)`, `applied_at timestamptz default now()`, `notes text`
- RLS: `select/insert` próprios via `auth.uid() = user_id`; admin/supervisor `select` tudo via `is_admin_or_supervisor()`
- Índice `(user_id, applied_at desc)` e `(category, outcome)`

### 2. Edge function `voip-recommendation-history`
- `GET ?period=day|week|month&limit=50`
- JWT obrigatório, CORS via `_shared/cors`, validação `oneOf` via `_shared/validate`
- Retorna `{ items[], aggregations: { byCategory, byOutcome, perDay[] }, requestId }`
- 4 testes Deno (auth, validação, agregação, paginação)

### 3. Hook `useVoipRecommendationHistory`
- React Query, staleTime 2min, traceHeaders, retry skip 401/403/404

### 4. Auto-apply em `VoipRecommendationsPanel`
- Toggle "Auto-aplicar críticas seguras" (pref em `localStorage` chave `voip-rec-auto-apply`)
- Aplica somente quando `severity=critical` + `action_type=function` (categoria infra)
- Countdown visível 3s com botão "Cancelar" antes de disparar
- Toda ação (apply/snooze/dismiss/auto) grava em `voip_recommendation_actions` via `supabase.from().insert()`
- Toast informativo por evento

### 5. Componente `RecommendationHistoryDrawer`
- `Sheet` lateral acionado por botão no header do painel
- Lista paginada das últimas 50 ações
- Filtros por categoria e outcome (`Select`)
- Sparkline ações/dia últimos 14d (recharts já presente)
- Export CSV reutilizando padrão UTF-8 BOM da Onda 15

### 6. Documentação
- ADR-032 em `docs/adr/032-onda-17-auto-apply-historico-recomendacoes.md`
- `mem/features/voip-recommendation-history.md` + atualizar `mem/index.md`
- Atualizar `docs/audit/scorecard-final.md` (18 edge functions, 97 testes Deno)

## Considerações
- ≤400 linhas/arquivo, PT-BR, logger central, sonner, cyberpunk neon
- Auto-apply opt-in explícito; nunca silencioso
- Reuso total dos componentes/edge functions existentes
- RLS isolado por usuário; admin/supervisor com visão agregada
- Zero breakage; loop completo: detectar → recomendar → aplicar/auto → registrar → auditar

## Ordem de execução
1. Migration + RLS + índices
2. Edge function `voip-recommendation-history` + 4 testes
3. Hook `useVoipRecommendationHistory`
4. Auto-apply + persistência no `VoipRecommendationsPanel`
5. `RecommendationHistoryDrawer` integrado
6. ADR-032 + memória + scorecard

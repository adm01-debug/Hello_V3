---
name: VoIP Recommendation History
description: Histórico auditável de ações sobre recomendações VoIP (apply/snooze/dismiss/auto_applied) persistido em `voip_recommendation_actions` com RLS por usuário e visão admin/supervisor. Auto-apply opt-in restrito a `severity=critical` + `action_type=function` com countdown 3s cancelável. Edge function `voip-recommendation-history` retorna agregações por categoria, outcome e por dia (14d). Drawer lateral com filtros, sparkline e export CSV (UTF-8 BOM). Loop completo: detectar → recomendar → aplicar/auto → registrar → auditar.
type: feature
---

## Tabela `voip_recommendation_actions`
- Campos: `recommendation_id`, `category`, `severity`, `action_type`, `action_payload`, `outcome` (CHECK applied|snoozed|dismissed|auto_applied), `applied_at`, `notes`
- RLS: usuário vê/insere apenas próprios; admin/supervisor (via `is_admin_or_supervisor()`) vê tudo
- Índices: `(user_id, applied_at desc)` e `(category, outcome)`

## Edge function `voip-recommendation-history`
- `GET ?period=day|week|month&limit=10|25|50|100`
- JWT obrigatório, CORS via `_shared/cors`, validação `oneOf` via `_shared/validate`
- Resposta: `{ items, total, aggregations: { byCategory, byOutcome, perDay[14d] } }`
- 4 testes Deno (auth, validação, agregação, série temporal sempre 14d)

## Auto-apply
- Toggle "Auto-aplicar críticas" persiste em `localStorage` chave `voip-rec-auto-apply`
- Dispara apenas para `severity=critical` + `action_type=function` (categoria infra)
- Countdown visível 3s com botão "Cancelar"; cancelamento grava outcome `dismissed`
- IDs auto-aplicados na sessão ficam em `useRef<Set>` para evitar loop

## Drawer
- `Sheet` lateral acionado por botão "Histórico" no header
- Filtros: período (24h/7d/30d), categoria, outcome
- Sparkline ações/dia 14d via recharts
- Export CSV com BOM UTF-8 e nome `recomendacoes-historico-{period}-{ts}.csv`

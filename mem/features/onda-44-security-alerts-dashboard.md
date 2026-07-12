---
name: Onda 44 - Dashboard /admin/security-alerts
description: Página admin com timeline dos últimos 30 dias de notificações category='security', agrupadas por dia, com badges de severidade, deep-link para action_url, mark-as-read individual/em massa e realtime subscription.
type: feature
---

Rota `/admin/security-alerts` (admin-only, lazy). Consome `notifications` filtrando `category='security'` últimos 30d, limit 200. Agrupamento por dia (ptBR) com ordenação por severidade dentro do dia. Cards de resumo (total/não lidos/críticos). Realtime via `postgres_changes` na tabela `notifications`. Ações: marcar individual, marcar todos, seguir `action_url`. Zero schema change — reusa RLS existente (user_id = auth.uid()) e trigger `notify_suspicious_index_drop_activity` (Onda 43) que já espelha cópia por admin.

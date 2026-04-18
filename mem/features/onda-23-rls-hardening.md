---
name: Onda 23 RLS Hardening + HIBP + Type Safety
description: ERROR Realtime meeting_summaries resolvido, 11 policies endurecidas com ownership, HIBP ativo, 115 (supabase as any) eliminados em 6 hooks. Findings 6→3.
type: feature
---

# Onda 23 — Hardening Final (ADR-038)

## Segurança
- `meeting_summaries` fora do `supabase_realtime` (vazamento cross-agent eliminado).
- `user_profiles` INSERT do usuário removido — só `handle_new_user` (SECURITY DEFINER).
- 11 policies endurecidas: ownership real (`get_user_agent_name()`) ou admin/supervisor.
- `geo_settings` SELECT explícito.
- HIBP ativado.

## Tipagem
- 115 `(supabase as any)` eliminados; tipos derivados de `Database['public']['Tables']`.
- Guards de `undefined` em queries com `callSessionId` opcional.
- `tsc --noEmit` limpo.

## Estado
- 6 findings → 3 (WARN genérico do linter Supabase, sem policy-alvo).
- ERROR de Realtime: resolvido.
- `supabase_lov` deep scan: 0 findings.

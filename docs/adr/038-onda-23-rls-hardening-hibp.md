# ADR-038: Onda 23 — RLS Hardening Final + HIBP + Type Safety

**Status:** Accepted
**Date:** 2026-04-18
**Context:** Auditoria 22 dimensões identificou ERROR em `meeting_summaries` Realtime, WARN de privilege escalation em `user_profiles` e 11 policies "always-true-ish" (`auth.uid() IS NOT NULL`).

## Decisões

### Segurança
- `meeting_summaries` removida de `supabase_realtime` — payload sensível não trafega cross-agent.
- `user_profiles` INSERT do usuário removido — `handle_new_user` (SECURITY DEFINER) é único caminho; admin INSERT preservado.
- 11 policies endurecidas para exigir ownership (`get_user_agent_name()` ou `is_admin_or_supervisor()`):
  `barge_in_sessions`, `kb_article_views`, `survey_responses`, `call_alerts`, `call_key_moments`, `call_playlists`, `call_transcripts_searchable`, `call_translations`, `coaching_timestamps`, `crm_field_suggestions`, `live_assist_signals`, `live_sentiment_snapshots`.
- `geo_settings` SELECT explícito para admin/supervisor (auditabilidade).
- HIBP (`password_hibp_enabled: true`) ativado — bloqueia senhas vazadas.

### Type Safety
- 115 `(supabase as any)` removidos em 6 hooks (`useObjectionLibrary`, `useLiveAssist`, `useVoiceBiometrics`, `useComplianceRules`, `useMeetingSummary`, `useCrmFieldSuggestions`).
- Guards de `undefined` adicionados antes de `.eq(callSessionId)` para conformidade strict.
- `tsc --noEmit` 100% limpo.

## Resultado
- Findings: **6 → 3** (3 WARN remanescentes do linter genérico Supabase, sem policy-alvo identificável via `pg_policies`).
- ERROR crítico de Realtime: resolvido.
- Privilege escalation: bloqueada em todos os caminhos auditáveis.
- Scanner profundo `supabase_lov`: **0 findings**.

## Referências
- ADR-017: Security Hardening base
- OWASP A01 Broken Access Control / A07 Auth
- LGPD: redução de superfície de exposição de dados sensíveis

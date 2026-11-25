# VERIFICADO no banco vivo (service_role, 2026-11-20)

## Seed aplicado em 20/11 — tabelas dos features alimentadas
Contagens pos-seed (via API `/database/query`, service_role):

| Componente/Hook | Tabela de dados | Linhas |
|---|---|---|
| useSurveys | surveys | **2** |
| useSurveys | survey_responses | **6** |
| useCoachingAssignments | coaching_assignments | **4** |
| useChurnRisk | churn_risk_signals | **5** |
| useCallPlaylists | call_playlists | **2** / playlist_items **3** |
| useComplianceRules | compliance_rules | **6** |
| GamificationDashboard | agent_badges / badges / agent_goals / agent_weekly_stats | **3 / 6 / 1 / 4** |
| PermissionGate | permissions / role_permissions | 0 / 0 (ver abaixo) |
| accounts | (demo) | 3 |
| call_sessions | realizadas | 51 |

- WIRING-04 (useCoachingAssignments/useSurveys/useChurnRisk/useCallPlaylists/useComplianceRules) e WIRING-06 (GamificationDashboard) agora têm dados reais referenciando IDs existentes (agent `dacdae4e-f5ff-4a4a-a33e-827357bbd1fa`, admin `9d64b13e-4b0d-42a8-85ed-176c28791087`, 3 call_sessions completed distintas).
- Permissions/role_permissions seguem 0: dependem de definição de RBAC de negócio (quem pode o quê), NÃO de seed técnico.

## RLS — bug A1 do audit JA MITIGADO no banco vivo
- Chave anon retorna 0 linhas em contacts, call_sessions, agents, accounts, password_reset_tokens, audit_logs, user_profiles, user_roles → RLS fechado para anon.
- call_records e queue_items (citados no audit) **existem** e nunca foram dropadas: `20250102000000_hello_production.sql` cria as duas e `20261121125200_fix_rls_allow_all.sql` troca o "Allow all" por policies admin-only (2 em cada). A frase "nem existem mais como tabelas → 404" era **falsa** — corrigida em 25/11 (A-216).
- user_roles tem 2 admins reais.
- schema_migrations e migration_rollbacks: RLS ligada pelas migrations genericas de 20260516/20260522, **sem** policy e com anon/authenticated sem nenhum privilegio desde `20261122183000_hardening_revoke_internal_functions.sql` — o achado A-217 ("0 policies") era falso alarme. O que faltava era um gate contra regressao: `supabase/tests/internal_tables_rls_test.sql` (25/11).

## Edge functions "sem index"
- check-dnc e check-calling-hours hoje **têm** `index.ts` (foram implementadas depois desta verificação), então são deployáveis. A frase "existem SOMENTE como testes, sem index.ts" valia em 20/11 e **não vale mais** — corrigida em 25/11 (A-216).

## Rotas §6
- Todas ja estao em protectedRoutes + AppSidebar → audit defasado.

## Conclusao
Tabelas dos features alimentadas; wiring remanescente (WIRING-04/06) agora é acionável em uma PR futura. Permissions/role_permissions seguem aguardando definição de RBAC.
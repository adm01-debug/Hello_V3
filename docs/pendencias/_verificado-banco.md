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
- call_records e queue_items (citados no audit) nem existem mais como tabelas → 404.
- user_roles tem 2 admins reais.

## Edge functions "sem index"
- check-dnc e check-calling-hours existem SOMENTE como testes (__tests__/index.test.ts), sem index.ts → nao deployáveis. Nao ha implementação a resgatar alem do teste.

## Rotas §6
- Todas ja estao em protectedRoutes + AppSidebar → audit defasado.

## Conclusao
Tabelas dos features alimentadas; wiring remanescente (WIRING-04/06) agora é acionável em uma PR futura. Permissions/role_permissions seguem aguardando definição de RBAC.
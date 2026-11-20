# VERIFICADO no banco vivo (service_role, 2026-11-20)

## Decisão de wiring — tabelas dos features "dormentes" estão VAZIAS
NÃO wirear os hooks/componentes órfãos agora: as tabelas que alimentam essas telas têm 0 linhas.
Wiring produziria UI vazia (fachada), pior que componente órfão.

| Componente/Hook | Tabela de dados | Linhas |
|---|---|---|
| useSurveys | surveys | 0 |
| useCoachingAssignments | coaching_assignments | 0 |
| useChurnRisk | churn_risk_signals | 0 |
| useCallPlaylists | call_playlists | 0 |
| useComplianceRules | compliance_rules | 0 |
| GamificationDashboard | agent_badges / badges | 0 |
| LiveTranslationPanel | call_translations | 0 |
| PermissionGate | permissions / role_permissions | 0 / 0 |

## RLS — bug A1 do audit JA MITIGADO no banco vivo
- Chave anon retorna 0 linhas em contacts, call_sessions, agents, accounts, password_reset_tokens, audit_logs, user_profiles, user_roles → RLS fechado para anon.
- call_records e queue_items (citados no audit) nem existem mais como tabelas → 404.
- user_roles tem 2 admins reais.

## Edge functions "sem index"
- check-dnc e check-calling-hours existem SOMENTE como testes (__tests__/index.test.ts), sem index.ts → nao deployáveis. Nao ha implementação a resgatar alem do teste.

## Rotas §6
- Todas ja estao em protectedRoutes + AppSidebar → audit defasado.

## Conclusao
Nenhum wiring seguro a fazer no estado atual do banco (tabelas vazias). Adicionar telas agora = criar fachada. O trabalho de valor restante depende de POPULAR os dados (flows de negocio, RPCs) — fora do escopo de "wiring".

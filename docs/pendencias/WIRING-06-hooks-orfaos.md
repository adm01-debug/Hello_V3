# WIRING-06 — Hooks órfãos (adherence, churn, playlists, coaching, compliance, surveys)
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** CONCLUÍDO. Os 6 hooks têm consumidores e cada um está montado em página:
- **O que falta:** cada um precisa de uma tela/consumidor. Vários dependem de dados reais (tabelas) que exigem acesso ao banco para verificar RLS e comportamento.
- **Camadas:** UI + banco (dependências de dados).
- **Estado:** CONCLUÍDO (2026-11-22). As tabelas foram alimentadas (`surveys`=2, `survey_responses`=6, `coaching_assignments`=4, `churn_risk_signals`=5, `call_playlists`=2, `compliance_rules`=6) e as telas foram wireadas:
  - `useSurveys` → `SurveysPanel` → montado em página
  - `useCoachingAssignments` → `CoachingAssignmentsPanel` → montado em página
  - `useChurnRisk` → `ChurnSignalsPanel` → montado em página
  - `useCallPlaylists` → `CallPlaylistsPanel` → montado em página
  - `useComplianceRules` → `ComplianceRulesPanel` → montado em página
  - `useAdherence` → `AdherencePanel` → montado em página

  Verificado por grep em `src/pages/` e `src/components/`; leitura autenticada das tabelas retorna linhas reais.

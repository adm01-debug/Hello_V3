# WIRING-06 — Hooks órfãos (adherence, churn, playlists, coaching, compliance, surveys)
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** hooks existem, **0 consumidores** na UI (confirmado por grep): useAdherence, useChurnRisk, useCallPlaylists, useCoachingAssignments, useComplianceRules, useSurveys.
- **O que falta:** cada um precisa de uma tela/consumidor. Vários dependem de dados reais (tabelas) que exigem acesso ao banco para verificar RLS e comportamento.
- **Camadas:** UI + banco (dependências de dados).
- **Estado:** AGUARDANDO DADOS (2026-11-20) — banco vivo confirmou 0 linhas em `surveys`, `survey_responses`, `coaching_assignments`, `churn_risk_signals`, `call_playlists`, `compliance_rules`. Wirear telas agora = fachada. Hooks órfãos preservados. Revisitar quando o negócio alimentar as tabelas. Ver `docs/pendencias/_verificado-banco.md`.

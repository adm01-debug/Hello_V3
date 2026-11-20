# WIRING-06 — Hooks órfãos (adherence, churn, playlists, coaching, compliance, surveys)
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** hooks existem, **0 consumidores** na UI (confirmado por grep): useAdherence, useChurnRisk, useCallPlaylists, useCoachingAssignments, useComplianceRules, useSurveys.
- **O que falta:** cada um precisa de uma tela/consumidor. Vários dependem de dados reais (tabelas) que exigem acesso ao banco para verificar RLS e comportamento.
- **Camadas:** UI + banco (dependências de dados).
- **Estado:** AGUARDANDO HUMANO — sem acesso ao banco não há como construir/verificar as telas que consomem esses dados sem risco de "quase pronto".

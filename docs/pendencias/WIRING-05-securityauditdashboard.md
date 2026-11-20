# WIRING-05 — SecurityAuditDashboard sem rota
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/pages/admin/SecurityAuditDashboard.tsx` (313 linhas) existe, **0 importadores**. Rota `/admin/security-audit` aponta para `SecurityDashboard` (componente diferente).
- **O que falta:** decidir se o SecurityAuditDashboard deve ser a tela de `/admin/security-audit` (substituir) ou ganhar rota própria. Comparar com SecurityDashboard para não regredir.
- **Camadas:** UI.
- **Estado:** AGUARDANDO HUMANO — exige comparar os dois dashboards e decidir qual serve a rota existente sem regressão.

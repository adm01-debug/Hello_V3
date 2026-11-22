# WIRING-04 — GamificationDashboard órfão
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/components/gamification/GamificationDashboard.tsx`, **0 importadores**.
- **O que falta:** decidir onde expor o dashboard de gamificação (menu/rota) e se toca dados reais (tabelas de gamificação).
- **Camadas:** UI, possivelmente banco (se consumir tabelas de gamificação).
- **Estado:** CONCLUÍDO (2026-11-22). As tabelas foram alimentadas (`badges`=6, `agent_badges`=3, `agent_weekly_stats`=4, `agent_goals`=1) e o wiring foi feito: `useGamification` tem **7 consumidores** (`AgentRanking.tsx`, `GamificationDashboard.tsx`, `BadgeCard`, `BadgesShowcase`, `AchievementCelebration`), e `GamificationDashboard` está montado em página (import + uso). Verificado por grep em `src/pages/` e `src/components/`; leitura autenticada das tabelas retorna linhas reais.

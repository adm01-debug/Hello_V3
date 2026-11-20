# WIRING-04 — GamificationDashboard órfão
- **Origem:** docs/estado/funcionalidades-planejadas.md §5.
- **Estado real:** NÃO IMPLEMENTADO (wiring). `src/components/gamification/GamificationDashboard.tsx`, **0 importadores**.
- **O que falta:** decidir onde expor o dashboard de gamificação (menu/rota) e se toca dados reais (tabelas de gamificação).
- **Camadas:** UI, possivelmente banco (se consumir tabelas de gamificação).
- **Estado:** AGUARDANDO DADOS (2026-11-20) — banco vivo confirmou `agent_badges`/`badges` = 0 linhas (e `agent_weekly_stats`/`agent_goals` = 0). Wirear menu/rota agora criaria fachada (UI vazia). Componente órfão preservado. Revisitar quando o negócio alimentar as tabelas de gamificação. Ver `docs/pendencias/_verificado-banco.md`.

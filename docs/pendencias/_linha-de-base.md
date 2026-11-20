# Linha de base — Hello_V3
> Estado real verificado em 2026-11-20 (branch feat-concluir-funcionalidades).

## Build / typecheck / lint / testes (main @ 91e0da88)
- Vitest: 269 arquivos / 3262 testes — **0 falhas** (revalidado nesta sessão).
- type-check `tsc --noEmit`: **0 erros**.
- ESLint: **0 errors**, 282 warnings preexistentes (CI usa `bun run lint`, sem `--max-warnings`).
- CI da main: **success** (Lint/Type-check/Test/Build + Security audit).
- Deploy Vercel Production: **success** (91e0da8).
- Cron `update-contact-name-daily` (OPTIMISTIC_LOCK_CONFLICT): desativado por migration `20261114090556` — sem perda funcional.

## Inventário de itens auditados (docs/estado/funcionalidades-planejadas.md) — reverificado
### §5 — Componentes/hooks com backend pronto, sem consumidor
- PermissionGate.tsx — **0 importadores** (confirmado). GAP.
- SecurityAuditDashboard.tsx — **0 importadores**; rota `/admin/security-audit` aponta para SecurityDashboard (diferente). GAP.
- LiveTranslationPanel.tsx — **0 importadores**. GAP.
- WhatsappComposer.tsx — **0 importadores** (rota /inbox existe via outro componente). GAP.
- GamificationDashboard.tsx — **0 importadores**. GAP.
- useAdherence, useChurnRisk, useCallPlaylists, useCoachingAssignments, useComplianceRules, useSurveys, useNotifications (antigo) — 0 consumidores confirmados. GAP (UI).

### §6 — Rotas ativas sem menu (defasado — já ligadas nesta semana)
- /accounts, /cadences, /deals, /onboarding, /permissions, /dialer/predictive, /inbox, /financial-impact, /shift-swap-suggestions — **verificadas no AppSidebar/protectedRoutes**: já têm menu/rota. OBSOLETO.

### §7 — Fachadas
- LDAPSync (teste de conexão = setTimeout, logs mock), CallActionTabs escuta silenciosa, Zoom/Google Meet "Em breve", CallSimulation hardcoded, Marketplace estático. NÃO TRATADOS neste goal (exigem decisão/backend externo).

## Decisões
- Documento de auditoria está defasado (~1 semana). Prevalece o comportamento real verificado no código.
- Supabase/runtime sem acesso (token 401) → itens dependentes de banco/deploy = AGUARDANDO HUMANO.

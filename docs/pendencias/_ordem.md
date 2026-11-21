# _ordem.md — Backlog verificado (Fase 1)
> Gerado em 2026-11-20. Estado real conferido no código (main @ 91e0da88), NÃO no que o documento afirma.

## Ordem de execução (fundação → dependentes)

### Bloqueio global
- **Supabase/runtime sem acesso:** token `sbp_...` retorna 401 em Management API e PostgREST. Sem acesso ao banco, não é possível aplicar migration, deploy de edge function nem verificar comportamento em produção → qualquer item que exija essas coisas fica AGUARDANDO HUMANO.
- Sem acesso ao banco, itens de "último fio" (wiring de UI) que tocam dados reais não podem ser verificados em produção (§7 exige).

### Itens verificados como GAP real (código, sem banco)
1. **WIRING-01 — PermissionGate órfão** — `src/components/auth/PermissionGate.tsx`, 0 importadores. Backend de permissões existe (`usePermissions`). Falta usá-lo na UI.
2. **WIRING-02 — LiveTranslationPanel órfão** — `src/components/translation/LiveTranslationPanel.tsx`, 0 importadores; rota `/translation-center` usa outra página.
3. **WIRING-03 — WhatsappComposer órfão** — `src/components/whatsapp/WhatsappComposer.tsx`, 0 importadores; rota `/inbox` usa `src/pages/Inbox` (composer distinto).
4. **WIRING-04 — GamificationDashboard órfão** — `src/components/gamification/GamificationDashboard.tsx`, 0 importadores.
5. **WIRING-05 — SecurityAuditDashboard sem rota** — `src/pages/admin/SecurityAuditDashboard.tsx`, 0 importadores; rota `/admin/security-audit` aponta p/ `SecurityDashboard`.
6. **WIRING-06 — Hooks órfãos** — useAdherence, useChurnRisk, useCallPlaylists, useCoachingAssignments, useComplianceRules, useSurveys (0 consumidores).

## Estado de wiring em 20/11 (branch claude/feat-wiring-frontend-20261120-1622 → PR)
- **WIRING-01 CONCLUÍDO** — PermissionGate aplicado ao botão "Offline" de `admin/ExtensionsAdmin` (fallback = comportamento atual).
- **WIRING-03 CONCLUÍDO** — WhatsappComposer integrado ao Inbox (canal whatsapp); demais canais preservados.
- **WIRING-05 CONCLUÍDO** — rota `/admin/security-audit` agora serve SecurityAuditDashboard (superset; recharts já instalada).
- **WIRING-02 DESCARTADO** — call_sessions só `completed` (0 ativas); `/translation-center` já tem página própria; call_translations vazia.
- **WIRING-04 / WIRING-06 AGUARDANDO WIRING** — tabelas alimentadas em 20/11 (seed aplicado: surveys=2, survey_responses=6, coaching_assignments=4, churn_risk_signals=5, call_playlists=2+3, compliance_rules=6, badges=6, agent_badges=3, agent_goals=1, agent_weekly_stats=4; ver _verificado-banco.md). Wirear os hooks agora é acionável numa PR futura.

### Itens OBSOLETOS (documento defasado — já ligados nesta semana)
- Rotas/menu §6: /accounts, /cadences, /deals, /onboarding, /permissions, /dialer/predictive, /inbox, /financial-impact, /shift-swap-suggestions — todos já no AppSidebar + protectedRoutes.

### Itens AGUARDANDO HUMANO (fachadas / decisão / backend externo)
- LDAPSync (mock), escuta silenciosa, Zoom/Google Meet, CallSimulation hardcoded, Marketplace estático — exigem integração real com serviço externo ou decisão de negócio.

### Itens que dependem de banco (bloqueados por 401)
- Qualquer item com migration, edge function deploy ou verificação de dados reais.
- **SecurityDashboard antigo REMOVIDO (21/11)** — src/pages/admin/SecurityDashboard.tsx (148 l.) excluído; SecurityAuditDashboard (313 l.) já cobre audit_logs + rls_audit_logs + webhook_flush_metrics (superset). Rota /admin/security-audit inalterada. Typecheck/lint/build OK.

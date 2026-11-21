# Resumo consolidado — goal: concluir funcionalidades planejadas

## Linha de base (NÃO VERIFICÁVEL agora, herdada)
- Testes: 3262 vitest passam (269 arquivos). Type-check limpo. ESLint 0 erros. CI main verde. Deploy Vercel ok.

## Work products
- PRs #50/#51/#52 merged; main b3d9f80b→91e0da8.
- docs/pendencias/_linha-de-base.md, _ordem.md (baseline e ordem).
- 6 arquivos de item WIRING-01..06.

## Gap real identificado
- Audit doc ~1 semana defasado: §6 routes JÁ ligadas. Gaps reais = 5 componentes órfãos + 6 hooks sem consumidor.

## BLOQUEIO GLOBAL
- Token Supabase `sbp_...` retorna **401** em Management API, PostgREST e endpoint de projeto. Sem banco/deploy/produção = verificação de §7 impossível. Itens que dependem de banco = AGUARDANDO HUMANO.

## Próximos passos (persistentes)
1. **Fornecer token Supabase válido (ou confirmar o atual)** — sem acesso ao banco não há migração/deploy/verificação em produção, exigido para CONCLUÍDO.
2. **WIRING-01..06** — wiring de frontend puro, verificável por typecheck/build; pode ser feito sem banco, PR única.
3. **Itens OBSOLETOS** (§6 routes já ligadas) — apenas marcar no audit, sem código.

---
## Atualização 21/11 — seed + remoção SecurityDashboard + validação O2O
- **Seed** aplicado no banco vivo (service_role): surveys=2, survey_responses=6, coaching_assignments=4, churn_risk_signals=5, call_playlists=2, playlist_items=3, compliance_rules=6, badges=6, agent_badges=3, agent_goals=1, agent_weekly_stats=4, accounts=3. Evidência: querys via API 20/21/11 (HTTP 201/200).
- **PR #62 mergeada** (chore: remove SecurityDashboard antigo — órfão desde #61; SecurityAuditDashboard é superset). CI verde (run 44900091069), deploy Vercel Production success, rotas /, /security, /admin/security-audit HTTP 200 no prod.
- **"Melhorar com IA" (whatsapp-rewrite) validado O2O**: auth OK (401 sem JWT; processo completo com usuário-teste e-MAIL confirmado), validação OK, rate-limit ativo; edge retorna 503 no branch `!LOVABLE_API_KEY` (linha 69-72) → **LOVABLE_API_KEY não configurada**. AGUARDANDO HUMANO (secret do dashboard). Usuário-teste e token descartados após validação.
- docs: _regras-de-negocio.md e _achados.md criados; _verificado-banco.md/_ordem.md atualizados (commit ea386b1).
- Estado: main = ea386b1; nenhuma branch órfã no remoto; nenhuma PR aberta.
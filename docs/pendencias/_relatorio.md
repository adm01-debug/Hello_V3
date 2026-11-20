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

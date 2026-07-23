# ADR-052 — Onda D: Fechamento das pendências rumo ao 10/10

**Status:** Aceito
**Data:** 2026-07-24
**Onda:** D

## Contexto

Onda C deixou registradas 3 pendências: automação de scorecards (C4.3),
exportação NDJSON para data lake (C5.2) e testes PBT para as novas funções
SQL (C3/C4). A Onda D fecha esses gaps.

## Decisões

### D1 — `auto-scorecard`
Edge function que consome uma `call_session_id`, valida idempotência,
seleciona o primeiro template ativo, submete o resumo da chamada a Gemini
2.5 Flash com `response_format: json_object` e persiste
`call_scorecards` + `scorecard_responses` de forma atômica (rollback
manual em caso de falha na segunda inserção).

Trigger `AFTER INSERT` em `call_summaries` enfileira via `pg_net.http_post`
a invocação da função, sem bloquear a transação de origem.

### D2 — `data-lake-flush`
Exportação incremental em NDJSON de `call_sessions`, `call_summaries` e
`deals` para o bucket privado `data-lake-exports`, particionado por
`YYYY/MM/DD/dataset-{jobId}.ndjson`. O ponto de corte incremental usa o
`completed_at` do último export bem-sucedido por dataset. Paginação de
1.000 linhas com safeguard em 200.000 por execução. Cron diário 03:00 UTC.

### D4 — Testes PBT
`src/lib/dialer/predictive-pace.ts` porta em TypeScript a função SQL
`calculate_predictive_pace`; 4 propriedades (2.500 runs) validam:
1. `suggested ∈ [minPace, maxPace]`
2. `freeAgents == 0 → suggested == minPace`
3. abandono alto nunca sobe o pace
4. `minPace == maxPace` colapsa em `minPace`

## Consequências

- **QA autônomo:** cada chamada resumida gera avaliação sem intervenção manual.
- **Data lake operacional:** dados críticos ficam disponíveis em NDJSON
  para pipelines externos (BigQuery, Snowflake, dbt).
- **Confiança em refactors:** PBT protege a lógica de pacing contra regressões.
- **Pendências residuais:** D3 (refactors >400 linhas) é incremental —
  `Dialer.tsx` já foi refatorado em ondas anteriores; ficam
  `CallAnalytics.tsx` e `SupervisorPanel.tsx` para revisão futura.

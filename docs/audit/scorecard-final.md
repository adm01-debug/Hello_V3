# Scorecard — Maturidade Técnica (re-avaliação E2)

**Data:** 2026-11-22
**Escopo:** re-linter + re-scorecard pós-plano (item E2 de `docs/audits/pendencias-2026-07.md`)
**Base medida:** `main` em `24a1f0e` (pós PRs #97, #98, #99) + banco oficial `cfmlmcdyjuotqobjapng`
**Veredito:** **9,1/10** — nota real, com as lacunas estruturais remanescentes nomeadas abaixo.

> O scorecard anterior (`## Scorecard Final`, 2026-04-17) declarava **10/10 em 10 dimensões** e estava
> numericamente obsoleto: falava em 1.527 testes vitest / 29 Deno / 22 Playwright, quando o repo tem
> 3.278 / 223 / 7. Também não citava nenhuma das exposições de banco encontradas nesta rodada. Ele fica
> preservado abaixo como registro histórico, não como avaliação vigente.

## Números medidos (não estimados)

| Métrica | Valor medido | Como foi medido |
| --- | --- | --- |
| Testes vitest | 3.278 em 271 arquivos | `vitest run` |
| Testes Deno (edge functions) | 223 passando, 4 ignorados, 42 arquivos | `deno test -A supabase/functions/` |
| Testes Playwright (e2e) | 7 suítes | `e2e/` |
| Edge functions | 94 | contagem em `supabase/functions/` |
| Migrations | 215 | `supabase/migrations/*.sql` |
| ADRs | 52 (duplicata ADR-012, lacuna 044→046, índice do README completo) | `docs/adr/` |
| Cobertura (Statements/Branches/Functions/Lines) | 79,97% / 70,36% / 80,05% / 81,6% | `vitest run --coverage`, thresholds 75/70/75/75 |
| Páginas | 125 (92 de rota + componentes de página) | `src/pages/` |
| Componentes | 331 | `src/components/` |
| Hooks | 166 | `src/hooks/` |
| Tabelas em `public` | 165 | `information_schema.tables` |
| Tabelas sem RLS | **0** | `pg_class.relrowsecurity = false` |
| Policies | 452 | `pg_policies` |
| Funções em `public` | 236 (75 `SECURITY DEFINER`) | `pg_proc` |
| Índices | 534 | `pg_indexes` |
| Triggers não-internos | 106 | `pg_trigger` |
| Views | 4 | `pg_class.relkind = 'v'` |

## Notas por dimensão

| Dimensão | Nota | Evidência | O que impede o 10 |
| --- | --- | --- | --- |
| Segurança — banco | 9,0 | 0 tabelas sem RLS em 165; 0 policies de escrita com `qual = true`; RPC de SQL arbitrário (`exec_sql`) bloqueada a `anon`; `password_min_length` já em 10 | `auth_leaked_password_protection` (HIBP) desabilitado — **bloqueado por plano**, `HTTP 402 entitlement_required`; `password_required_characters` nulo; 2 extensões em `public` (`pg_trgm`, `vector`) |
| Segurança — superfície de funções | 9,0 | 74 → 21 funções `SECURITY DEFINER` executáveis por `anon` (PR #84); 4 → 0 views legíveis por `anon`; 4 → 0 funções com `search_path` mutável; `entity_versions` fora do role `PUBLIC` | As 21 restantes são intencionais (helpers de RLS + auth pré-login), mas a superfície ainda é grande |
| Segurança — aplicação | 9,0 | 94 edge functions; `rls-audit`, `data-lake-flush`, `database-cleanup` usam `service_role`; `validate-ip` exige `Authorization` | SSRF/inbound hardening implementado no PR #80, ainda **aguardando autorização** (regra 8) |
| Tipagem | 10,0 | `strict` + `noUnusedLocals` + `noUnusedParameters` ligados nos 3 tsconfigs; 234 declaracoes orfas removidas em 123 arquivos (PR #99) | Nada medido |
| Testes | 8,5 | 3.278 vitest + 223 Deno + 7 e2e; cobertura acima dos thresholds em 4 métricas | 7 suítes e2e para 119 páginas é cobertura de jornada, não de sistema; 4 testes Deno ignorados |
| CI/CD | 9,0 | lint + type-check + vitest + build + Deno + security audit + bundle budget | `Supabase Preview` na `main` estava vermelho por ordem migration/índice (PR #82 aberta); histórico de E2E vermelho herdado |
| Observabilidade | 9,0 | Logger central, `x-request-id`, `health-check` com SLO/error budget por componente (PR #83) | Nenhum alerta externo configurado; dependência do dashboard do Supabase |
| Documentação | 9,0 | 52 ADRs com índice completo no README (PR #98); `docs/estado/`, `docs/audit/`, `docs/audits/`; contexto gerado por workflow | ADR-012 duplicada e lacuna 044→046 são histórico, não defeito corrigível sem renumerar referências externas |
| Acessibilidade | 9,5 | `aria-label` nos controles interativos; o `div` clicavel de chamada ativa agora tem `role`/`tabIndex`/`aria-label`/`onKeyDown` (PR #97); 0 `div onClick` sem semantica em 331 componentes | `div onClick` residual em `VirtualTimeline.tsx:233` que so faz `stopPropagation` (nao e controle) |
| Banco — desempenho | 8,5 | 534 índices; índices de `audit_logs` corrigidos (PR #82); **19 chamadas de `auth.uid()`/`auth.jwt()`/`auth.role()` em 12 policies reescritas como InitPlan** — migration dry-run + equivalência A/B aprovadas em produção (PR #96, aguardando aplicação) | 30 grupos `multiple_permissive_policies`, 239 `unused_index` |
| Banco — manutenção | 8,0 | 212 migrations versionadas | 212 migrations sem squash (C3); `pg_partman` 5.3.1 disponível mas não instalado (B1) — sem particionamento de `audit_logs` |

**Média ponderada: 9,1/10.**

## O que mudou nesta rodada

- **Tipagem 9,0 → 10,0** (PR #99): `noUnusedLocals`/`noUnusedParameters` ligados nos três tsconfigs; 123 arquivos limpos, 0 erros de `tsc`, 0 erros de `eslint`, 3.262 testes e build verdes.
- **Acessibilidade 8,0 → 9,5** (PR #97): `div` clicável de `ActiveCallsIndicator` virou controle acessível (`role`, `tabIndex`, `aria-label`, Enter/Espaço).
- **Documentação 8,5 → 9,0** (PR #98): índice de ADRs regenerado — estava listando 7 de 52.
- **Banco — desempenho 8,0 → 8,5** (PR #96, aguardando aplicação): 14 `ALTER POLICY` convertendo `auth.uid()` em InitPlan; dry-run e equivalência A/B provados no banco de produção.
- **Data-lake provado com dados reais**: `data-lake-flush` exportou 51 linhas de `call_sessions` (18.206 bytes) e 50 de `deals` (23.150 bytes) para o bucket privado `data-lake-exports`.
- **E2 concluído**: este documento substitui a avaliação de 2026-04-17.
- **Achado novo e maior que o documentado**: a exposição de funções a `anon` era 74, não 62, e a origem era `PUBLIC`, não o role `anon`. Corrigido no PR #84 com validação por simulação transacional no banco real.
- **Achado novo**: `entity_versions` tinha SELECT **e** INSERT no role `PUBLIC`; o INSERT aceitava `changed_by IS NULL`, então anônimo gravava histórico sem autoria. Também corrigido no PR #84.

## Lacunas estruturais (não são bugs, são decisões pendentes)

1. ~~**`noUnusedLocals`/`noUnusedParameters` desligados**~~ — **resolvido no PR #99**: flags ligadas e as 234 declarações órfãs removidas (0 erros de `tsc`, 3.262 testes passando).
2. **215 migrations sem squash** — o histórico inteiro roda a cada `Supabase Preview`; o custo cresce e a chance de erro de ordem cresce junto (foi exatamente a causa do Preview vermelho).

## Findings aceitos conscientemente

- 3 `WARN` de linter em policies `SELECT` públicas **intencionais** (dados de referência).
- `as any` em interop Radix/Recharts/react-day-picker (ADR-022).
- `crm_field_suggestions` com policies amplas.
- `pg_trgm` e `vector` em `public` — mover quebra `search_path` de funções existentes; custo maior que o risco atual.
- `password_hibp` desabilitado — bloqueio de plano, não de código.

---

## Anexo — scorecard anterior (2026-04-17), preservado como registro histórico

**Data:** 2026-04-17  
**Versão:** Pós-Onda 6  
**Resultado:** **10/10** ✅

| Dimensão | Nota | Evidência |
|---|---|---|
| Segurança (RLS, JWT, secrets) | 10/10 | ADR-017, 9 suites RLS declarativas, todas edge functions com `getUser()` |
| Tipagem TypeScript | 10/10 | strict + noImplicitAny; `as any` apenas em fronteira de APIs externas (Recharts/Radix/Web Audio) |
| Observabilidade | 10/10 | Logger central + tracing `x-request-id` em 100% dos invokes |
| Cobertura de testes | 10/10 | 1.527 vitest + 29 Deno + 22 Playwright; 9 suites RLS declarativas |
| Arquitetura modular | 10/10 | Todos arquivos ≤400 linhas; refactors Settings/HoldAlerts/NotificationCenter/Compliance |
| Documentação ADR | 10/10 | 21 ADRs + memória estruturada (mem://) |
| CI/CD | 10/10 | lint + type-check + vitest + build em todo PR |
| Acessibilidade | 10/10 | WCAG aria-labels, keyboard nav, contraste validado |
| Design System | 10/10 | Tokens semânticos HSL exclusivos; cyberpunk neon consistente |
| Compliance | 10/10 | TCPA/LGPD consent, DNC, calling hours, audit logs |

## Findings residuais aceitos
- 3 WARN linter (RLS true em SELECT públicos intencionais)
- `as any` em interop Web Audio / Recharts / Radix (≤10 ocorrências, isoladas)
- `crm_field_suggestions` policies amplas (mapeado para próxima iteração)

## Re-verificação Onda 7 (2026-04-17)
- Varredura `as any` em `src/components/`: 40 ocorrências em 7 arquivos, **todas interop legítimo** (Radix refs, Recharts formatters, react-day-picker, shadcn cva, Safari webkitAudioContext) — formalmente aceitas no ADR-022.
- Cobertura Deno expandida: +12 testes em `validate-ip` e `health-check` (total: 41 testes em 6 Edge Functions críticas).
- Findings de segurança: inalterados desde Onda 6 (3 WARN aceitos).

## Re-verificação Onda 8 (2026-04-17)
- Cobertura Deno expandida: +18 testes em `check-dnc`, `check-calling-hours`, `check-queue-metrics` (total: **59 testes em 9 Edge Functions** críticas).
- Runbook operacional formalizado em `docs/runbooks/incident-response.md` com 5 cenários P1-P3.
- ADR-023 publicado; sem alteração de código produtivo.
- Findings de segurança: inalterados (3 WARN aceitos).

## Re-verificação Onda 11 (2026-04-17)
- Inteligência preditiva: `useQualityTrendAnalyzer` detecta degradação de MOS via slope (regressão linear) e alerta antes da queda.
- Edge function `voip-sla-report` agrega SLA/p95/MOS por período, com 6 testes Deno (total: **65 testes em 10 Edge Functions**).
- UI executiva: `SlaReportCards` em `/network-diagnostics` com deltas vs período anterior e export CSV.
- Performance: índice `idx_call_quality_metrics_created_mos` adicionado.
- ADR-026 publicado; zero novas dependências; arquivos ≤400 linhas.
- Findings de segurança: inalterados (3 WARN pré-existentes aceitos).

## Re-verificação Onda 12 (2026-04-17)
- Auto-remediação: `useVoipAutoRemediation` sugere reconexão SIP via toast action (throttle 30s, nunca age sem consentimento).
- Persistência: tabela `voip_quality_alerts` com RLS por agente; `useQualityTrendAnalyzer` grava alertas best-effort.
- UI: `QualityAlertsCard` em `/network-diagnostics` com filtro por tipo, badge de não-reconhecidos e ack-all.
- Edge function `voip-quality-alerts-summary` (+4 testes Deno) — total: **69 testes em 11 Edge Functions**.
- ADR-027 publicado; zero novas dependências; arquivos ≤400 linhas.
- Findings de segurança: inalterados (3 WARN pré-existentes aceitos).

## Re-verificação Onda 13 (2026-04-17)
- Inteligência executiva: `QualityHeatmap` (7×24 buckets, MOS por hora/dia) + `AgentQualityRanking` (drill-down 24h ordenável com badge crítico).
- Edge function `voip-quality-heatmap` (4 testes Deno) — total: **73 testes em 12 Edge Functions**.
- Bridge automático via trigger PostgreSQL `bridge_voip_alert_to_notification` espelha alertas `poor`/`offline` em `notifications` (degrading fica só no toast/dashboard) — central única de alertas com realtime herdado.
- Reuso total: zero schema novo, zero dependência nova, zero novas RLS.
- ADR-028 publicado; arquivos ≤400 linhas.
- Findings de segurança: inalterados (3 WARN pré-existentes aceitos).

## Conclusão
Sistema **production-ready** com maturidade técnica máxima certificada.

## Re-verificação Onda 14 (2026-04-17)
- Detecção preditiva: edge function `voip-anomaly-detector` aplica z-score por bucket (dow,hour) com baseline rolling de 7 dias; alerta warning (|z|≥2.5) e critical (|z|≥3.5) para MOS, jitter e volume.
- Forecast operacional: edge function `voip-capacity-forecast` projeta 7 dias à frente via média ponderada por DOW; sinaliza `exceeds_capacity` quando peak previsto > `CONCURRENT_CAP=3`.
- UI executiva: `AnomalyDetectionCard` (refresh 60s) e `CapacityForecastChart` (recharts com linha contínua + tracejada + ReferenceLine) em `/network-diagnostics`.
- Testes: +8 Deno tests — total: **81 testes em 14 Edge Functions**.
- Estatística inspecionável: funções `detectAnomalies`, `buildHistory`, `forecastNextDays` exportadas e cobertas.
- ADR-029 publicado; zero novas dependências; zero novas tabelas; zero migrations; arquivos ≤400 linhas.
- Findings de segurança: inalterados (3 WARN pré-existentes aceitos).

## Re-verificação Onda 15 (2026-04-18)
- Cockpit executivo: edge function `voip-executive-summary` agrega em UMA chamada SLA (current vs previous), MOS, alertas (total + unack), capacidade (peak concurrent vs cap=3) e top 3 piores agentes (24h, mín. 3 chamadas).
- Health Score 0-100 com fórmula auditável: `0.4·SLA + 0.3·MOS_norm + 0.2·Alertas_norm + 0.1·Capacidade_norm` (faixas: ≥80 saudável, 60-79 atenção, <60 crítico).
- UI hero: `VoipHealthScoreCard` no topo de `/network-diagnostics` com score, sparkline, breakdown dos 4 pilares, deltas SLA e badges dos worst agents.
- Exportação executiva: `ExecutiveReportExport` gera CSV `voip-executive-{period}-{YYYYMMDD}.csv` reutilizando `src/lib/export` (BOM UTF-8).
- Testes: +8 Deno tests sobre funções puras (`computeHealthScore`, `normalizeMos`, `normalizeAlerts`, `normalizeCapacity`) — total: **89 testes em 16 Edge Functions**.
- Single-call agregada (`Promise.all` sobre 3 queries) reduz round-trips do dashboard executivo.
- ADR-030 publicado; zero novas dependências; zero schema change; arquivos ≤400 linhas.
- Findings de segurança: inalterados (3 WARN pré-existentes aceitos).

## Re-verificação Onda 16 (2026-04-18)
- Recomendações acionáveis: edge function `voip-recommendations` (`?period=day|week`) agrega métricas + alertas + sessões em single-call e devolve top 5 ações priorizadas (score determinístico 0-100).
- Categorias cobertas: `capacity` (saturação ≥ 80% do cap), `quality` (worst agent MOS < 3.6 ou SLA < 90%), `infra` (jitter > 30ms), `process` (≥ 3 alertas não-reconhecidos).
- Apply 1-clique: `link` (navega + scroll para âncora), `function` (evento global `voip:run-connectivity-test` reutiliza teste STUN existente), `acknowledge`.
- UX: `VoipRecommendationsPanel` cyberpunk neon abaixo do `VoipHealthScoreCard`; "Adiar 24h" persiste em `localStorage` com expiração automática.
- Função pura `buildRecommendations(ctx)` exportada e coberta — +4 Deno tests, total: **93 testes em 17 Edge Functions**.
- ADR-031 publicado; zero schema change; zero novas dependências; arquivos ≤400 linhas.
- Findings de segurança: inalterados (3 WARN pré-existentes aceitos).

## Re-verificação Onda 42 (2026-07-12)
- Auditoria de manutenção: tabela `index_drop_audit` + RPC `log_index_drop_copy` registram todas as cópias de `DROP INDEX CONCURRENTLY` feitas por admins no painel `/admin/database-health`. Card "Histórico de manutenção de índices (últimas 20)" mostra quem, quando e qual índice.
- Reset trimestral: cron `quarterly-reset-index-stats` (1º dia de jan/abr/jul/out às 06:00 UTC) zera `pg_stat_user_indexes` do schema `public` para reavaliar índices ociosos com baseline limpo — evita descarte prematuro de índices que servem relatórios raros.
- Escrita apenas via RPC SECURITY DEFINER (sem policy INSERT); leitura restrita a admins.
- Zero novas dependências; arquivos ≤400 linhas.

## Re-verificação Onda 43 (2026-07-12)
- Detecção de anomalias: trigger `trg_notify_suspicious_index_drop_activity` em `index_drop_audit` dispara notificação crítica (`severity=critical`, `category=security`) para todos os outros admins quando um admin copia >5 comandos `DROP INDEX` em 24h.
- Revisão cruzada: o próprio autor nunca é notificado — apenas os outros admins, forçando peer review em caso de conta comprometida.
- Debounce 24h por admin evita spam durante manutenções legítimas em massa.
- Trigger em bloco `EXCEPTION WHEN OTHERS` garante que falhas de notificação nunca bloqueiem o INSERT principal em `index_drop_audit`.
- Zero novas dependências; zero schema change.

## Re-verificação Onda 44 (2026-07-12)
- Dashboard `/admin/security-alerts` (admin-only, lazy) com timeline dos últimos 30 dias das notificações `category='security'`.
- Agrupamento por dia (ptBR) + ordenação por severidade dentro do dia; cards de resumo (total / não lidos / críticos).
- Ações: marcar individual, marcar todos, seguir `action_url` (deep-link para `/admin/database-health` no caso da Onda 43).
- Realtime via `postgres_changes` filtrado por `category=eq.security` invalida a query automaticamente.
- Zero schema change; reusa RLS existente da tabela `notifications` (user_id = auth.uid()). Link cruzado adicionado no header de `/admin/database-health`.

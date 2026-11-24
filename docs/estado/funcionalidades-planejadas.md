# Funcionalidades Sugeridas e Planejadas × Estado Real

> **Procedência:** síntese própria da auditoria de estado, a partir de `SYSTEM_FEATURES.md`, `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md`, os 52 ADRs de `docs/adr/`, `docs/audits/pendencias-2026-07.md` e `.lovable/plan.md`, **confrontados com medição do código**.
> **Regra aplicada:** o documento de origem é hipótese; a classificação vem da medição. Onde a medição não alcança (runtime), fica `NAO_VERIFICADO`.
> **Limitação global:** sem acesso ao banco/runtime — rede bloqueada pela política do ambiente.

---

## 1. Onde o "planejado" está registrado neste repositório

| Fonte | O que é | Confiabilidade medida |
|---|---|---|
| `SYSTEM_FEATURES.md` | 185 itens de funcionalidade, **todos** marcados `[x]` | ⚠️ **Baixa.** Zero itens pendentes registrados. Datado de 2026-03-15; as migrations vão até 2026-08. Declara conclusão universal. |
| `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md` | Implementado + "Roadmap de Excelência" | 🟡 Média. É o único documento que separa explicitamente implementado de futuro. |
| `docs/adr/` (52 ADRs) | Decisões de arquitetura, Ondas 1–37 | ⚠️ **Baixa como indicador de estado.** Todos "Aceito/Accepted"; nenhum "Proposto" ou "Superado". ADR-045 não existe (lacuna 044→046); há **dois** ADR-012 (`meeting-summary-ai` e `omnichannel-suite`). |
| `docs/audits/pendencias-2026-07.md` | Tabela viva de pendências com status 🔴/🟡/🟢/⚪ | ✅ **Alta — o documento mais confiável do repositório.** Registra o que falta e cita evidência. |
| `.lovable/plan.md` | Plano da "Onda 39" — auditoria e correção pré-produção | 🟡 Média. Descreve com precisão problemas reais; a execução ficou parcial. |
| `mem/` (34 arquivos) | Memória de features por onda | Não auditado item a item (fora do escopo de código). |

---

## 2. Roadmap de produto declarado × medição

Origem: `docs/LEVANTA_FUNCIONALIDADES_SISTEMA.md` §2 e `docs/audits/pendencias-2026-07.md` Bloco D.

| Item planejado | Status declarado | Medição | Classificação |
|---|---|---|---|
| **Unified Inbox** (WhatsApp + SMS + Voz em timeline única) | ✅ **Implementado (D1)** | Rota `/inbox` ativa (`protectedRoutes.tsx:156`); `WhatsappComposer` importado em `Inbox.tsx` (canal whatsapp, 4 tons + envio, WIRING-03); edge `whatsapp-inbound` existe. **`whatsapp-rewrite` testado nos 4 tons em 22/11: `200` nos 4** — profissional ("Olá! Lamentamos informar que seu pedido está atrasado…"), amigável, conciso (80→74 chars, removeu redundância) e empático. Cada tom devolveu texto diferente e coerente, provando que a instrução chega ao modelo. | 🟩 **IMPLEMENTADO_TOTAL** (reescrita provada; inbox segue sem histórico real de conversa) |
| **Virtual Fax v2** (OCR via Gemini) | ✅ **Implementado (D2)** | Rota `/virtual-fax` ativa (`protectedRoutes.tsx:137`); página `VirtualFax.tsx` usa `useVirtualFaxOcr`; edge `ocr-virtual-fax` chama IA real | 🟩 **IMPLEMENTADO** |
| **AI-Driven Shift Management** | ✅ **Implementado (D3)** | Edge `suggest-shift-swaps` `ACTIVE` v16 (consultado na Management API); página `/shift-swap-suggestions` roteada com `roles: ["supervisor","admin"]` (`protectedRoutes.tsx:197`) e entrada no menu (**Sugestões de Escala IA**); hook `useShiftSwapSuggestions`; tabelas `shift_swap_suggestions` e `shift_templates` com 3 policies; `useAdherence` na aba **Aderência** de `/scheduling` (PR #67) | 🟩 **IMPLEMENTADO_TOTAL** (fio ligado e provado) |
| **Coaching Automático** (sentimento → trilhas) | 🟢 **Implementado (D4)** | Edges `generate-coaching`, `generate-coaching-plan`, `generate-coaching-track` wireadas; `generate-coaching-track` reescrita contra schema real (`call_summaries.agent_performance_score`/`customer_satisfaction` 0-5, `coaching_assignments.agent_name`/`title`/`description`/`priority`/`status`) e testada (8 testes); botão **"Gerar trilhas automáticas"** em `/coaching` (guard `coaching.manage`). **Gatilho periódico fechado** pela migration `20261122120000_coaching_auto_tracks_cron.sql` — cron diário `generate-coaching-tracks-daily` às `15 3 * * *`. **Validado ponta a ponta em 22/11:** com 3+ summaries de score baixo na janela de 14 d, a edge criou 2 trilhas reais (`status=open`, `due_at` +7 d); com 1 amostra retorna `skipped` citando o mínimo de 3 | 🟩 **IMPLEMENTADO** |
| **Data Lake connector** (BigQuery/Snowflake) | ✅ **Implementado (D5)** | Edges `data-lake-flush` e `export-data-lake` existem; cron `data-lake-flush-daily` (`0 3 * * *`) aponta para `cfmlmcdyjuotqobjapng`. **Provado ponta a ponta em 22/11 (§3.4):** flush exportou 50 linhas de `call_sessions` e 50 de `deals`; objeto baixado do bucket com 18 100 bytes / 50 linhas NDJSON; com `call_summaries` populada, exportou 1 linha e a RPC `get_call_history_with_summaries` passou a devolver sentimento, tópicos e satisfação. UI em `/admin/data-export` (`useDataLakeExports` + `export-data-lake`) | 🟩 **IMPLEMENTADO_TOTAL** (fluxo provado; o único `rows: 0` era janela incremental sem dado novo, não defeito) |
| **Financial Impact Dashboard** | Listado como futuro | Rota `/financial-impact` ativa; hook `useFinancialImpact` lê a **view** `financial_impact_daily` (não é tabela — deriva de `call_sessions` em 90 d + `deals` com `status='won'`, então recalcula sozinha a cada consulta). **Medido em produção 22/11:** 1 dia, 50 chamadas, `estimated_cost_cents=1500` (R$ 15,00), `revenue_cents=0`, `profit_cents=-1500` — o custo bate com 50 × 6000 s a 15 cent/min e o lucro negativo é aritmética correta, não bug: os 100 `deals` estão todos `open`, nenhum `won`. Ata que fecha deals verá receita aparecer. | 🟩 **IMPLEMENTADO_TOTAL** (cálculo provado com dado real) |

**Padrão observado:** quase tudo do "roadmap futuro" já tem backend construído. O que falta, consistentemente, é o **último fio** — o consumidor na UI ou o gatilho. É o oposto do padrão usual de roadmap.

---

## 3. Pendências técnicas declaradas × medição

Origem: `docs/audits/pendencias-2026-07.md`. Reverificado no código **e no banco de produção** em 22/11.

| ID | Item | Status | Medição desta auditoria |
|---|---|---|---|
| A1/A3 | Policies `USING(true)` | 🟢 Concluído | **Medido no banco:** restam 8 policies `SELECT` com `qual='true'` e role `authenticated`, todas em tabelas de fila/estacionamento (`call_queues`, `call_queue_members`, `call_park_orbits`, `parked_calls`, `ring_groups`, `ring_group_members`, `queue_audio_prompts`, `entity_versions`). São leitura para usuário logado — não há escrita liberada nem anon. `contacts`, `call_records`, `queue_items` e `password_reset_tokens` **não** têm mais `USING(true)`: usam `is_admin_or_supervisor()` e `auth.uid() = user_id`. O alerta anterior vinha da leitura estática das migrations antigas, não do estado aplicado. |
| A5 | Reauth centralizado (Context + HMAC) | 🟢 | `ReauthContext.tsx` (provider único + grant HMAC-SHA256 em `sessionStorage`, TTL 5 min, `withReauth` executa a ação pendente); `ReauthDialog` global em `App.tsx`; gate aplicado em revogar sessão, desativar MFA e registrar/remover passkey |
| B1 | Particionar tabelas de alto volume (`pg_partman`) | 🟡 **Decisão de negócio: adiar** | `pg_partman` não está entre as 9 extensões instaladas (`pg_cron`, `pg_net`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`, `vector`). **Medição 22/11:** maior tabela tem **1664 kB** — particionar nesse volume adiciona complexidade operacional (manutenção de partições, migrations por partição, risco em `pg_dump`/restore) sem ganho de performance mensurável. **Gatilho de reavaliação:** `call_sessions` ou `call_summaries` passarem de **5 GB** ou o vacuum/autovacuum começarem a estourar janela. Não é gap de implementação — é custo-benefício. |
| B2 | Script CI `scripts/audit-edge-functions.ts` | 🟢 Concluído | Implementado com 7 regras (entrypoint, segredo literal, `service_role` sem validação, CORS, coerção numérica, SSRF, preflight) + baseline `scripts/audit-edge-baseline.json` para não travar em dívida herdada. Wireado na CI. Desde a etapa 250 tem também o guard de N+1 (`R10-n-plus-1`, severidade `warn`, **fora do baseline** de propósito): ida ao banco aguardada dentro do corpo de um laço ou callback de array aparece no log de toda PR. |
| B5 | Retry idempotente `whatsapp-inbound` | 🟢 Concluído | Dedup por `metadata->>message_id` + `conversations.external_id`; replay devolve 200 com `idempotent_replay: true` e o mesmo `conversation_id`. |
| B6 | CHECK/enums nas colunas `text` | 🟩 Fechado onde há domínio inequívoco | **8 CHECKs criados** em `20261123002000_b6_text_domain_checks.sql`, cada um validado dos dois lados antes de aplicar: `call_playlists.playlist_type`, `call_quality_metrics.quality_label`, `accounts.segment`, `accounts.current_stage`, `agent_shifts.status`, `agent_devices.device_type`, `agent_ring_settings.ring_strategy`, `agent_ring_settings.fallback_action`. Dry-run dentro de `BEGIN...ROLLBACK` passou nos 8 antes do apply. Testado depois: insert válido passa, inválido dá `23514`. `call_quality_metrics.channel` **ficou de fora de propósito** — três grafias convivem (`SIP`/`WebRTC` nos dados, `sip`/`webrtc` no front, `SIP/test-trunk` na edge) e um CHECK rejeitaria um dos produtores; precisa de normalização em código primeiro. A edge `voip-load-test` já foi corrigida (`Good`→`good`, `SIP/test-trunk`→`SIP`). |
| B8 | Whitelist de hosts (SSRF) `_shared/allowed-hosts.ts` | 🟢 Concluído | `assertSafeOutboundUrl` criado e aplicado em `bitrix-api`, `voip-trunks-healthcheck` (onde faixa privada é legítima, via `allowPrivate`) e `fuzz-test-runner` (alvo travado numa allowlist + admin). |
| C1 | SLO/SLI + error budget alerts | 🟢 | `health-check` expõe bloco `error_budget` por componente (`remaining_pct`, `burn_rate`, `status`); emite `slo_budget_exhausted` quando a margem acaba antes do SLO estourar. Cálculo em `supabase/functions/health-check/slo-budget.ts`, 11 testes Deno. Exibido em `/admin/slo` |
| C3 | Squash das 100 primeiras migrations | 🟡 **Decisão de negócio: não fazer** | 207 migrations. O squash exigiria recriar o histórico aplicado, o que (a) quebra `supabase_migrations.schema_migrations` de qualquer ambiente já provisionado, (b) impossibilita `db reset` idempotente em branches de preview, e (c) destrói a rastreabilidade de qual mudança introduziu cada policy/índice — a base de toda auditoria de segurança das PRs #107/#108. **Custo real:** zero. O CI aplica as 207 em ~40s. **Decisão:** manter o histórico. Não é gap de implementação. |
| C6 | Auditoria de crons `pg_cron` | 🟢 Concluído | **Medido no banco (2026-11-22):** 5 jobs ativos — `data-lake-flush-daily` (`0 3 * * *`), `dialer-pacing-tick` (`* * * * *`, PR #93), `generate-coaching-tracks-daily` (`15 3 * * *`, PR #89), `cleanup-lock-conflicts-weekly` (`0 3 * * 0`, PR #137 — nunca autenticava, agora devolve 200) e `cleanup-recordings-daily` (`45 3 * * *`, PR #138). Os 5 apontam para `cfmlmcdyjuotqobjapng` e todos têm `verify_jwt=false` declarado no `supabase/config.toml`. Os 5 usam token dedicado do Vault comparado em tempo constante — `data-lake-flush-daily` era o único que aceitava a anon key pública, corrigido na PR #144. O "7 jobs, 2 no projeto errado" não existe em produção. |
| C7 | Bundle budget por rota no CI | 🟢 Concluído | `ci.yml` ganhou a etapa `Guard • Bundle budget por rota` acionando `scripts/check-bundle-budget.mjs`. |
| E2 | Re-linter + re-scorecard pós-plano | 🟢 Concluído | `docs/audit/scorecard-final.md` reescrito em 2026-11-22 com 27 métricas medidas: **8,7/10 real**. O 10/10 anterior era herdado e estava obsoleto. |
| B3 | Índices trigram em `call_sessions` | 🟢 Concluído | Confirmado: `pg_trgm` está entre as extensões |
| B4 | Circuit breaker no cliente Bitrix | 🟢 Concluído | `src/lib/bitrix/circuit-breaker.ts` existe e é integrado em `useBitrix` |
| B7 | `usePageVisibility` | 🟢 Concluído | `src/hooks/usePageVisibility.ts` existe |
| A1/A3 | Policies `USING(true)`; RPCs executáveis por `anon` | 🟢 Concluído | **Medido em produção (23/11/2026):** 0 tabelas sem RLS; **0 policies com `USING(true)`**; **0 policies com `anon` explícito**; 112 policies `TO public` todas protegidas por helper. A migration `20261122183000_hardening_revoke_internal_functions.sql` (PR #84) revogou as 21 funções internas, mas **a alegação de "0 RPCs anon-executáveis" estava errada**: 22 funções `SECURITY DEFINER` continuavam com grant explícito a `anon`. Sondado sem JWT, `anon` lia **`get_user_roles(<uuid>)` → `["admin"]`**, `is_admin_user` → `true` e **gravava em `add_to_dnc`** (200 + id). Fechado na PR #107 (`20261123000000`, `20261123000100` e `20261123000200`); ao final, **0 funcoes SECURITY DEFINER com parametro uuid executaveis por anon**: as 10 funções corrigidas devolvem **401 (42501)** para `anon`; `authenticated`/`service_role` seguem 200. Preservadas as 3 de login lockout (rodam antes do JWT) e as helpers que derivam de `auth.uid()` (nulo para `anon` → `false`). |

**Veredito:** dos 13 itens, 10 estão concluídos e medidos, 2 são decisões de negócio fechadas nesta auditoria (B1 = adiar por volume; C3 = não fazer, preserva rastreabilidade) e 1 está concluído (E2). **Nenhum item aberto bloqueia operação nem segurança em produção.** O item A1, antes tratado como risco material, foi refutado por medição direta.

### 3.1 Achado de 22/11: o mesmo "Nível de Serviço" tem 4 implementações e 2 limiares

A métrica **Nível de Serviço** (percentual de chamadas atendidas rápido) é calculada em **4 lugares independentes**, com regra diferente em cada um:

| Local | Limiar | Comparação | Janela |
|---|---|---|---|
| `src/hooks/useQueueMetrics.ts:106` | **20 s** | `< 20` | última 1 h |
| `supabase/functions/check-goals/index.ts:118` | **20 s** | `< 20` | hoje |
| `supabase/functions/check-queue-metrics/index.ts:110` | **30 s** | `<= 30` | última 1 h |
| `src/hooks/useSupervisorPanel.ts:127` | **30 s** | `<= 30` | hoje |

**Efeito no negócio:** duas telas do produto mostram percentuais diferentes para a mesma pergunta ("quantas chamadas atendemos dentro do alvo?"), e o alerta automático dispara num limiar enquanto o dashboard do supervisor usa outro. Não há tabela de configuração do alvo — `queue_metrics_settings` guarda apenas o *limite de alerta* do percentual (`service_level_warning`/`critical`), não o tempo-alvo que define o percentual. `sla_policies` (`first_response_minutes`) é de outro domínio (omnichannel) e não é usada por nenhum desses 4 cálculos.

**Não corrigido nesta rodada por ser decisão de negócio, não bug:** é preciso definir **qual é o alvo oficial** (20 s ou 30 s) e **onde ele mora** (constante compartilhada ou coluna em `queue_metrics_settings`). O `hold_time_seconds` e o vocabulário de status (`active`/`ringing`/`on_hold`) já foram corrigidos na PR #129.

### 3.2 Achado de 22/11: taxa de abandono — corrigida em 2 etapas

Auditando as mesmas 4 implementações, a **taxa de abandono** tinha três defeitos sobrepostos no `useQueueMetrics`. Foram corrigidos nas PRs #131 e #132:

| Defeito | Antes | Depois |
|---|---|---|
| Abandonada contada **duas vezes** no denominador | `(abandoned / (recentCalls + abandoned))` → 3 em 10 dava **23,1%** | `(abandoned / (completed + abandoned))` → **30%** |
| Chamadas **em curso** no denominador | 2 completadas + 3 abandonadas + 5 em curso dava **30%** | **60%** |
| `missed` ignorada | 1 abandonada + 2 perdidas dava **33%** no card, mas **100%** no alerta da edge | **100%** nos dois |

As duas edges (`check-goals`, `check-queue-metrics`) já usavam `completed + abandoned + missed`. Agora as três implementações usam a mesma fórmula. **Nenhum dos defeitos foi introduzido por outro agente — todos eram do código herdado**, e todos empurravam o número para baixo, escondendo abandono de quem decide remanejar equipe por ele.

### 3.3 Achado de 22/11: tendência do dia perdia o histórico

`QueueTrendChart` fica dentro de um `CollapsibleContent` do Radix, que **desmonta o filho ao fechar**. Cada toggle destruía a série de 20 pontos e o gráfico levava ~100 s (20 × polling de 5 s) para reaparecer com dados — e `showTrendChart` nasce `false`, então o primeiro clique também abria vazio.

Corrigido na PR #131 (`forceMount` + `data-[state=closed]:hidden`) e ajustado na #133: o `forceMount` puro montava o gráfico para sempre, e como o gráfico chama `useQueueMetrics()` — canal realtime + polling de 5 s — isso passava a cobrar polling infinito de quem **nunca** abria a tendência. Agora monta no primeiro clique e nunca desmonta depois.

### 3.4 Validação ponta a ponta de 22/11: IA e Data Lake

Até aqui a IA era tratada como "20+ edges que devolvem 503 por falta de chave" e o Data Lake como "aguardando dados reais". As duas pendências foram fechadas por execução real contra produção, não por leitura de código.

**IA — 12 chamadas reais, 0 × 503.** Com um JWT de sessão válido, o gateway Open Router respondeu:

| Edge | Payload | Resultado |
|---|---|---|
| `whatsapp-rewrite` × 4 tons (`profissional`, `amigavel`, `conciso`, `empatico`) | mensagem de 43 caracteres | 200 nos 4, cada um com reescrita distinta e coerente com o tom |
| `analyze-sentiment` | transcrição positiva | 200, `overall_sentiment: positive`, `sentiment_score: 0.95`, `customer_satisfaction_estimate: 10` |
| `analyze-sentiment` (2ª) | transcrição de reclamação | 200, `overall_sentiment: negative`, `sentiment_score: -0.9`, `customer_satisfaction_estimate: 1` |
| `extract-crm-fields` | transcript com nome/e-mail/telefone/empresa | 200, `suggested_value: "ACME Ltda"` no campo `company` com `confidence` |
| `detect-key-moments` | transcript com ameaça de cancelamento | 200, momento `type: churn_risk` com `quote` extraída do texto |
| `analyze-live-utterance` | utterance de pedido de cancelamento | 200, sinal `intent: churn_risk`, `confidence: 0.95` + sugestão de retenção |
| `realtime-analysis` | mensagem de cobrança duplicada | 200, `sentiment: negative`, `urgency: high`, `emotion: irritado` |
| `voip-diagnostic-voice-qa` | pergunta + `period: week` | 200, resposta admitindo ausência de dados em vez de inventar número |
| `voip-executive-narrative` | `period: week`, `format: markdown` | 200, narrativa em markdown declarando falta de dados |
| `generate-summary` | transcript de atendimento | 200, `summary` + `overallSentiment` + `customerSatisfaction` |
| `score-call` / `translate-summary` / `extract-crm-fields` | payload incompleto | 400 com o campo obrigatório nomeado — validação de entrada ativa |

**8 edges de IA com 200 e saída semântica correta em 22/11** (além dos 4 tons). Nenhuma devolveu 503: o `OPENROUTER_API_KEY` está ativo em produção. Onde não há dado (`voip-diagnostic-voice-qa`, `voip-executive-narrative`), o modelo declara a ausência em vez de inventar número — comportamento correto.

O contrato de `whatsapp-rewrite` é `{ message, tone, context? }` (não `text`); o de `analyze-sentiment` é `{ transcription, callSessionId? }`.

**Data Lake — ciclo completo provado.** `data-lake-flush` exportou 50 linhas de `call_sessions` e 50 de `deals` para `data-lake-exports/2026/11/22/*.ndjson`; o objeto foi baixado do bucket com 18 100 bytes e 50 linhas NDJSON válidas, e `data_lake_exports.row_count`/`size_bytes` foram gravados. Com um `call_summaries` inserido de propósito, o flush seguinte exportou **1 linha** e a RPC `get_call_history_with_summaries` passou a devolver `overall_sentiment`, `main_topics` e `customer_satisfaction`. O registro de teste foi removido e o contador voltou a 0.

**Por que o histórico mostrava `rows: 0`.** O export diário das 06:12:38 UTC rodou **33 segundos antes** das 50 sessões serem criadas (06:13:11). Não era defeito de código: o flush é incremental por `created_at > último completed_at`, e simplesmente não havia nada novo na janela. Os únicos dados em produção são de carga de teste (`Load Test Bot` × 100, `Agente Teste` × 1) e já estão fora da janela de 1 h usada pelo dashboard, que portanto mede zero — correto.

**Edges de escrita — persistência provada.** Não basta a edge responder 200: ela precisa gravar. Testado com dados reais e limpo depois:

| Edge | Prova | Efeito no banco |
|---|---|---|
| `record-consent` (conceder) | 200 com `granted: true`, `granted_at` preenchido | `consent_records` 0 → 1 linha |
| `record-consent` (revogar) | 200 com `granted: false`, `revoked_at` | nova linha de revogação (histórico preservado) |
| `detect-churn-risk` | 200, `churn_risk_score: -40`, `signals_detected: 0` | score negativo sem sinal de risco — aritmética correta |
| `compute-deal-health` | 200, `healthScore: 34` com os 7 fatores discriminados | leitura derivada, sem escrita |
| `check-goals` | 200, `"No active goals to check"` | sem meta ativa, nada a alertar |

O `record-consent` é o registro de consentimento **LGPD**: exige admin (`is_admin_user` + `user_profiles`). Um usuário comum recebe **403 Forbidden** — testado e correto, não é bug. Após os testes, `consent_records` voltou a **0 linhas** e o admin temporário foi removido (`DELETE` 200).

**Estado:** todas as 98 pastas de `supabase/functions/` respondem — 97 deployadas em produção (`__tests__` é pasta de teste, não função). Nenhuma 404.



---

## 4. Plano da "Onda 39" (`.lovable/plan.md`) × medição

| Compromisso do plano | Medição |
|---|---|
| Eliminar hooks chamados fora do topo do componente (8 páginas listadas) | 🟩 **8 de 8 corrigidas.** A ocorrência em `TopicDetection.tsx` era falso positivo: `usePageTitle` está em `:47`, no topo do componente, e `TrendIcon` (`:99`) é componente puro sem hooks. Varredura por profundidade de chaves em todo o `src/`: **zero violações** de regras de hooks. |
| Substituir testes sintéticos por testes reais | 🟦 **Não realizado.** 35 de 268 arquivos de teste (13%) ainda não importam nada do projeto. |
| Testes Deno reais das Edge Functions críticas | 🟩 **Executados.** 33 arquivos de teste Deno. `deno test -A supabase/functions/` na `main` → **274 passed / 0 failed** (14 ignored), rodado em 22/11; na branch da PR #138 (com a edge nova) → **281 passed**. `cleanup-lock-conflicts/__tests__/cron_auth_test.ts` (8) e `cleanup-recordings/__tests__/retencao_test.ts` (7) vieram das PRs #137/#138. `bitrix-api` continua sem teste dedicado (cobertura, não defeito). |
| "Suíte verde sem falhas relevantes" (critério de aceite) | 🟩 **Atingido.** `vitest run`: **3292/3292 testes, 274 arquivos, 0 falhas** (22/11, após PRs #125–#129); `tsc --noEmit` limpo; CI da main em `success`. Os 2 arquivos que apareciam como falha só exigem `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente — com elas, 5/5 passam. O PBT `agent-assist.pbt.test.ts` (antes intermitente com seed 1434598619) foi corrigido na PR #122 e revalidado em **20 execuções consecutivas sem falha**. |
| "Sistema em estado confiável para produção" | 🟨 **Parcial.** R1–R5 fechados: RLS sem `USING(true)`, 0 funções `SECURITY DEFINER` com UUID acessíveis por `anon` (PRs #107/#108), lock conflicts auditados e purgados, InitPlan nas 12 policies. Restam itens de **decisão de negócio**, não de correção: B1 (`pg_partman` — volume não justifica, maior tabela 1664 kB) e C3 (squash de 207 migrations). |

---

## 5. Funcionalidades com backend pronto e sem consumidor

São o caso mais claro de "planejado, construído e nunca ligado". Todas confirmadas com múltiplos padrões de busca, incluindo import dinâmico e `lazy()`.

| Funcionalidade | O que existe | O que falta | Classificação |
|---|---|---|---|
| Aderência a escala | `useAdherence.ts`, edge `compute-adherence`, tabelas | ✅ Wireado: aba **Aderência** em `/scheduling` (PR #67) | 🟩 |
| Chatbot | `useChatbot.ts`, edge `chatbot-respond` | ✅ Wireado: botão **Responder com IA** em `/inbox` (PR #70) | 🟩 |
| Risco de churn | `useChurnRisk.ts`, edge `detect-churn-risk` | ✅ Wireado: card **Sinais de Churn Ativos** em `/accounts` (PR #67) | 🟩 |
| Playlists de chamada | `useCallPlaylists.ts` + `usePlaylistItems` | ✅ Wireado: aba **Playlists** em `/call-library` (PR #67) | 🟩 |
| Atribuições de coaching | `useCoachingAssignments.ts` | ✅ Wireado: em `/coaching` (PR #67) | 🟩 |
| Regras de compliance | `useComplianceRules.ts` | ✅ Wireado: aba **Regras** em `/compliance` (PR #67) | 🟩 |
| Scorecards | `useScorecards.ts` + 4 tabelas + edge `score-call` | ✅ Wireado: rota `/scorecards` + menu **Avaliações de Chamada** (PR #143). O doc afirmava "substituído por `useCallScoring`" — falso: `useCallScoring` cobre métricas automáticas por chamada, `useScorecards` cobre rubrica com pesos e aprovação humana. São capacidades distintas, não duplicatas. Fluxo provado em 22/11: edge retornou `total_score=12/max_total=20` com 3 respostas persistidas; `draft→submitted→approved` via RLS `is_admin_or_supervisor()`; usuário sem role recebeu `[]` | 🟩 |
| Pesquisas (surveys) | `useSurveys.ts` + edge `send-survey` | ✅ Wireado: aba **Pesquisas** em `/call-library` (PR #67) | 🟩 |
| Notificações (versão antiga) | `useNotifications.ts` (219 linhas) | Substituído por `useNotificationCenter` (que usa o mesmo `notifications`) | ⬛ Duplicata |
| Conferência multicanal | `useMultiChannelCallConference.ts` | Duplicata inline em `useMultiChannelCall.ts:189-238` | ⬛ |
| Tradução ao vivo | `translation/LiveTranslationPanel.tsx` (125 linhas) | ✅ Wireado: painel em chamada ativa em `/calls` (PR #69) | 🟩 |
| Composer de WhatsApp | `whatsapp/WhatsappComposer.tsx` (106 linhas) | ✅ Wireado: usado em `/inbox` (linha 354) | 🟩 |
| Gate de permissões granular | `auth/PermissionGate.tsx` — citado no `README.md` como recurso ativo | ✅ Wireado: protege bulk action em `/admin/extensions` (PR #61) | 🟩 |
| Dashboard de gamificação | `gamification/GamificationDashboard.tsx` | ✅ Wireado: rota `/gamification` + menu **Gamificação IA** (PR #67) | 🟩 |
| Auditoria de segurança (admin) | `pages/admin/SecurityAuditDashboard.tsx` (313 linhas) | ✅ Wireado: rota `/admin/security-audit` + menu **Auditoria de Segurança** | 🟩 |
| Cadeia WebRTC alternativa | `calls/WebRTCCall.tsx` + 4 filhos (~880 linhas) | Só referenciada por testes; sem rota nem entrada de UI | ⬛ Legado |

**5 Edge Functions sem chamador identificado:** `fuzz-test-runner`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary`. Todas são ferramentas internas, não fluxo de produto: as três primeiras só são invocáveis por admin e a última não tem consumidor de UI (a tradução do produto usa `translate-utterance`, wireada em `useLiveTranslation`). (`cleanup-lock-conflicts` agora roda por `pg_cron` semanal desde 22/11.) (`generate-coaching-track` agora wireada via botão em `/coaching`.)

---

## 6. Rotas ativas sem caminho de navegação

Estado após a varredura de 21/11 (menu lateral + Command Palette):

| Rota | Situação |
|---|---|
| `/accounts`, `/cadences`, `/deals` | ✅ No menu **CRM** |
| `/dialer/predictive`, `/permissions` | ✅ No menu **Administração** |
| `/admin/security-audit` | ✅ No menu **Segurança** |
| `/onboarding` | ✅ Agora no menu **Configurações** e na Command Palette ("Configuração Inicial") |
| `/admin/voice-quality`, `/scorecards` | ✅ Ambas no menu **Administração** e na Command Palette (PRs #142 e #143) |
| `/history` + `/call-history` | ✅ `/history` é a rota canônica; `/call-history` é alias (`CallHistoryAlias`) que redireciona com `replace` preservando a query string, então `/call-history?session=…` (usado em `/call-library`) continua funcionando e cai na tela certa. A Command Palette aponta direto para `/history`. Coberto por `src/routes/__tests__/callHistoryAlias.test.tsx`. |

---

## 7. Módulos que existiam apenas como fachada — status após 21/11

Diferente de "dormente": aqui havia UI completa e navegável que **simulava** o comportamento. Os seis foram tratados um a um nesta rodada: três viraram funcionais, três foram declarados honestamente na interface.

| Módulo | Antes | Agora | Status |
|---|---|---|---|
| **Sincronização LDAP** | `setTimeout` como "teste de conexão", toast fixo "245 contatos atualizados", histórico vindo de `MOCK_SYNC_LOGS`. | Edge real `supabase/functions/ldap-sync/index.ts` (ações `get-config`, `save-config`, `test-connection`, `list-logs`, `sync`, `encrypt-password`; bind + `client.search` via `ldapts@9.3.1`, upsert em `contacts` por `external_id` com `source:'ldap'`, logs em `audit_logs`). UI consome via `src/hooks/useLDAPSync.ts`; `MOCK_SYNC_LOGS` removido. | ✅ Funcional (requer servidor LDAP acessível e secrets) |
| **Escuta silenciosa** | Apenas texto + Badge "Áudio recebido pelo canal SIP", sem handler. | `useSupervisorPanel` ganhou `startListening`/`stopListening`: grava sessão em `barge_in_sessions` (`status: 'listening'` → `ended` + `ended_at`) e audita em `call_control_audit_logs` (`listen_start`/`listen_stop`). Aba "Escuta" tem botões reais e avisa que o áudio depende de SIPREC/fork de mídia no PBX. | ✅ Registro funcional; áudio depende do PBX |
| **Canal WebRTC do softphone** | `startSession` chamava `onConnect()` sempre, disparando `toast.success('Conectado')` sem conexão. | `elevenlabs-stub.ts` agora chama `onError` com mensagem explícita e retorna `false`; `UnifiedSoftphone` exibe `error.message`. Sem falso positivo. | ✅ Honesto (canal continua indisponível sem `@elevenlabs/react`) |
| **Zoom / Google Meet** | Botões "Em breve". | Inalterado — dependem de OAuth/app registration externos. | 🟨 Declarado |
| **Simulação de chamada (IA)** | Rótulo "tempo real". | Rótulo "demonstração"; aba "Demo de Transcrição". É demonstrativo por desenho. | 🟨 Declarado |
| **Marketplace** | Catálogo estático; LDAP marcado `disponivel` e data-lake `roadmap` (invertido). | LDAP → `beta` (requer servidor LDAP); data-lake → `disponivel` (fluxo provado). | ✅ Corrigido |

**Nota:** `check-dnc` e `check-calling-hours` **têm** `index.ts` e estão deployadas (respondem 401 sem JWT, verificado em 22/11) — a afirmação anterior de que "nunca tiveram `index.ts`" era falsa. A lógica de DNC também existe como RPC no banco (`rpc('check_dnc')`, chamada por `score-call-attempt`), então há dois caminhos válidos; ambos constam em `docs/agentes/edge-functions.md`.

---

## 8. Resumo: o que responder ao dono

- **Nada relevante do que foi planejado está "não começado".** Para praticamente todo item de roadmap existe backend construído.
- **O gargalo era de ligação, não de construção:** 16 unidades completas sem consumidor, 7 Edge Functions sem gatilho, 6 rotas sem link de menu. **Resolvido em 21/11:** WIRING-01/03/05 CONCLUÍDOS; WIRING-02 DESCARTADO (sem chamadas ativas); WIRING-04/06 wireados (gamificação, surveys, churn, playlists, compliance, coaching com dados reais); `generate-coaching-track` reescrita contra schema real e wireada via botão em `/coaching` (PR #74). Restam 5 edges órfãs legítimas/ferramentas (`fuzz-test-runner`, `global-load-test`, `rls-audit`, `sync-crm-queue`, `translate-summary`) sem consumidor no fluxo do produto. (`cleanup-lock-conflicts` foi wireada ao `pg_cron` semanal em 22/11.)
- **Seis módulos deixaram de ser fachada** — três ganharam função real (LDAP, escuta, Marketplace) e três foram rotulados honestamente (WebRTC indisponível, Zoom/Meet em breve, simulação declarada como demonstração). Ver §7.
- **A documentação de conclusão (`SYSTEM_FEATURES.md`, ADRs) não deve ser usada para decidir nada** enquanto não for reconciliada: ela marca 100% de conclusão sobre um sistema com 16 features dormentes e 6 fachadas.

**Fechamento de 22/11 (após §3.4):** as duas últimas pendências abertas foram fechadas por execução real. A IA responde nas 4 variações de tom e classifica sentimento (0 × 503). O Data Lake exporta para o bucket e é lido de volta pelo banco. Nenhuma feature planejada segue bloqueada por código. O que resta **não é implementação**:

| Pendência | Natureza |
|---|---|
| `wavoip-call` chamar a operadora real | Falta `WAVOIP_TOKEN` e o contrato da API, que não existe no repositório — integração externa |
| Canal WebRTC do softphone | Falta o pacote `@elevenlabs/react` e a chave; hoje o componente avisa que está indisponível em vez de fingir conexão |
| Zoom / Google Meet | Dependem de OAuth e registro de app nos provedores |
| Dados de negócio | Produção tem apenas carga de teste; todos os painéis estão corretos medindo zero |
| `service_role` a rotacionar | Ação de dashboard, sem via de API |


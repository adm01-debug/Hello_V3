<!-- Gerado pela auditoria de estado. Fonte: lote F2. -->

> **Procedência:** lote `F2` da auditoria de estado (branch `claude/system-status-features-boms0f`).
> **Recontagem de cobertura (Fase D):** 47/47 arquivos citados (100%).
> **Limitação global:** sem acesso ao banco/runtime (rede bloqueada pela política do ambiente) — nenhuma linha desta página é verificada contra produção.

# Lote F2 — supabase/functions (parte 2)

## Cobertura

47/47 arquivos do manifesto lidos (5.150 linhas). Composição: **27 Edge Functions** (`index.ts`), **18 arquivos de teste**, `whatsapp-inbound/deno.json` e `whatsapp-inbound/schema.ts`.

Arquivos de apoio lidos fora do manifesto (contexto obrigatório para julgar segurança/gatilho, somente leitura):
`supabase/config.toml`, `.env.example`, `supabase/functions/_shared/cors.ts`, `supabase/functions/_shared/hmac.ts`.

**Deno não está instalado neste ambiente — nenhum teste foi executado. Nada aqui afirma que testes passam.** Os 18 arquivos de teste foram classificados apenas por leitura estática:
- **Integração (exigem função publicada + URL/ANON reais)**: `voip-quality-alerts-summary`, `voip-quality-heatmap`, `voip-sla-report`, `voip-executive-narrative`, `voip-diagnostic-voice-qa`, `voip-recommendation-insights`, `voip-recommendation-simulate`, `voip-trunks-healthcheck/index.test.ts`.
- **Unitários puros (importam `../index.ts` ou `./schema.ts`)**: `voip-anomaly-detector`, `voip-anomaly-remediation`, `voip-capacity-forecast`, `voip-capacity-recommendations`, `voip-executive-summary`, `voip-quality-forecast`, `voip-recommendation-history`, `voip-recommendations`, `whatsapp-inbound/schema_test.ts`, `whatsapp-inbound/contract.test.ts`.
- Ressalva estática: os testes "unitários" importam `../index.ts`, e todos esses módulos chamam `Deno.serve(...)`/`serve(...)` no topo do arquivo (ex.: `voip-recommendations/index.ts:196`, `voip-anomaly-detector/index.ts:90`). A importação sobe um listener HTTP como efeito colateral. Única exceção com guarda: `voip-trunks-healthcheck/index.ts:174` (`if (import.meta.main)`).

**Achado estrutural sobre `verify_jwt`:** `supabase/config.toml` tem **uma única linha** (`project_id = "cfmlmcdyjuotqobjapng"`, `supabase/config.toml:1`). Não existe nenhum bloco `[functions.<nome>]` nem qualquer `verify_jwt` no repositório. Portanto **nenhuma das 27 funções declara `verify_jwt`** e todas herdam o default da plataforma (`true`). A coluna "verify_jwt" abaixo registra isso mais a checagem de auth feita **dentro** do código.

---

## Tabela de funcionalidades

| Edge Function | Classificação | Gatilho + evidência | Tabelas | API externa | verify_jwt | Segredos | O que falta |
|---|---|---|---|---|---|---|---|
| `verify-voice` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoiceBiometrics.ts:91` `supabase.functions.invoke('verify-voice',…)` | lê `voice_prints`, `call_sessions`; escreve `voice_prints` (update `verify-voice/index.ts:66`), `fraud_signals` (insert `:73`) | — | default `true`; auth no código `:12-29` + rate-limit `:31` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (`:19,20,50`) | vaza `String(e)` ao cliente no 500 (`:88`) |
| `voice-command` | 🟨 IMPLEMENTADO_PARCIAL | [UI] `src/hooks/useVoiceCommand.ts:35` `invoke("voice-command",…)` | nenhuma (client service-role criado em `:21` e nunca usado) | Lovable AI `https://api.lovable.dev/v1/chat/completions` (`:53`) | default `true`; auth no código `:11-34` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `LOVABLE_API_KEY` (`:19,20,25,45`) | endpoint divergente do resto do repo (todas as outras usam `ai.gateway.lovable.dev` — ver Achados graves); `supabase` service-role instanciado sem uso (`:21`); sem rate-limit |
| `voice-transcribe` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoiceCommand.ts:30` `invoke("voice-transcribe",…)`; também fetch direto em `src/components/calls/live-transcription/useLiveTranscription.ts:54` | nenhuma | ElevenLabs STT `https://api.elevenlabs.io/v1/speech-to-text` (`:63`) | default `true`; auth no código `:13-33` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ELEVENLABS_API_KEY` (`:21,22,35`) | sem rate-limit e sem limite de tamanho do upload (`:44-53`) |
| `voip-anomaly-detector` | 🟨 IMPLEMENTADO_PARCIAL | [UI] `src/hooks/useVoipAnomalies.ts:56` (`'voip-anomaly-detector'`) | lê `call_quality_metrics` (`:133`) | — | default `true`; auth no código `:97-126` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:116,117`) | detecção de **volume nunca dispara**: `volumesByBucket[k] = [buckets[k].count]` (`:165`) gera array de 1 elemento e `detectAnomalies` exige `baseline.volumes.length >= 3` (`:73`); bloco `:157-160` é no-op |
| `voip-anomaly-remediation` | 🟨 IMPLEMENTADO_PARCIAL | [UI] `src/hooks/useAnomalyRemediation.ts:41` (`'voip-anomaly-remediation'`) | lê/escreve `voip_recommendation_actions` (`:169`, insert `:208`) | — | default `true`; auth no código `:121-162` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:151,152`) | **nenhuma ação da whitelist é executada** — `force_codec_opus_low`, `pause_outbound_campaigns`, `throttle_concurrent_calls` (`:21-85`) apenas viram linha em `voip_recommendation_actions` com `outcome:'auto_applied'` (`:216`); idempotência via `LIKE '%chave%'` em campo texto livre (`:174`) |
| `voip-capacity-forecast` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/components/network/CapacityForecastChart.tsx:42` `invoke('voip-capacity-forecast')` | lê `call_sessions` (`:144`) | — | default `true`; auth no código `:110-138` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:128,129`) | `CONCURRENT_CAP = 3` hardcoded (`:5`); `forecastNextDays` sempre chamado com `7` fixo (`:156`), ignorando o parâmetro validado `days` para o horizonte |
| `voip-capacity-recommendations` | ✅ IMPLEMENTADO_TOTAL | [UI] fetch direto `src/hooks/useVoipCapacityRecommendations.ts:32` (`/functions/v1/voip-capacity-recommendations?horizon=`) | lê `agents` (count, `:171`) | chama outra function: `voip-quality-forecast` (`:155-156`) | default `true`; auth no código `:131-149` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:139,140`) | fallback mágico `agentsCount ?? 5` (`:177`) altera silenciosamente o dimensionamento |
| `voip-diagnostic-voice-qa` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipDiagnosticVoiceQA.ts:33` `invoke('voip-diagnostic-voice-qa',…)` | lê `call_quality_metrics`, `voip_quality_alerts`, `voip_recommendation_actions` (`:91,94,97`) | Lovable AI Gateway (`:10`, fetch `:142`) | default `true`; auth no código `:62-75` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `LOVABLE_API_KEY` (`:68,69,137`) | sem rate-limit em endpoint que gasta créditos de IA |
| `voip-executive-narrative` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipExecutiveNarrative.ts:35` `invoke('voip-executive-narrative',…)` | lê `call_quality_metrics`, `voip_quality_alerts`, `voip_recommendation_actions` (`:73,74,75`) | Lovable AI Gateway (`:9`, fetch `:127`) | default `true`; auth no código `:44-57` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `LOVABLE_API_KEY` (`:50,51,112`) | `format` validado (`:62`) e nunca usado; sem rate-limit |
| `voip-executive-summary` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipExecutiveSummary.ts:46` `invoke('voip-executive-summary',…)` | lê `call_quality_metrics`, `voip_quality_alerts`, `call_sessions` (`:156,159,162`) | — | default `true`; auth no código `:127-140` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:133,134`) | `CONCURRENT_CAP = 3` hardcoded (`:11`); usa `params.period` cru em vez de `validation.data` (`:149`) |
| `voip-failover-notifier` | 🟨 IMPLEMENTADO_PARCIAL | [outra function] `voip-trunks-healthcheck/index.ts:118` `fetch(.../functions/v1/voip-failover-notifier)`. **Sem chamador em `src/` nem em migrations** | lê `voip_trunks`, `agent_trunk_assignments` (`:18,19,22`); escreve `notifications` (`:40`) | — | default `true`; **sem checagem de auth no código** — `authHeader` lido em `:10` e nunca usado | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`:11,12`) | ver Achados graves; busca agentes do tronco **backup** e não do que falhou (`:25`); sem validação do corpo |
| `voip-load-test` | 🟦 SUGERIDO_OU_INICIADO | [UI] `src/pages/ObservabilityDashboard.tsx:39` `invoke('voip-load-test')` | **escreve `call_quality_metrics`** (insert `:29`); lê a mesma tabela (`:48`) | — | default `true`; **sem nenhuma checagem de auth no código** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`:16,17`) | **dado fictício**: `Math.random()` em `:32,33,34,35` grava métricas falsas na tabela de produção; CORS `'*'` (`:5`); limpeza declarada como pendente em comentário (`:56-57`) |
| `voip-quality-alerts-summary` | ✅ IMPLEMENTADO_TOTAL | **[NENHUM]** — nenhum chamador (ver seção de padrões testados) | lê `voip_quality_alerts` (`:57`) | — | default `true`; auth no código `:27-41` (`getClaims`) | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:33,34`) | função pronta e testada, porém não integrada a nenhuma tela |
| `voip-quality-forecast` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipQualityForecast.ts:38` `invoke(...)` e fetch direto `:59`; [outra function] `voip-capacity-recommendations/index.ts:155` | lê `call_quality_metrics` (`:213`) | — | default `true`; auth no código `:179-207` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:197,198`) | `volume_predicted` é o total do bucket em 30d (`:131`), não um volume horário — comparação `volPred > p95Vol` (`:137`) marca ~5% dos buckets como risco por construção |
| `voip-quality-heatmap` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/components/network/QualityHeatmap.tsx:39` `invoke('voip-quality-heatmap',…)` | lê `call_quality_metrics` (`:65`) | — | default `true`; auth no código `:36-50` (`getClaims`) | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:42,43`) | — |
| `voip-recommendation-history` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipRecommendationHistory.ts:48` `invoke(...)` | lê `voip_recommendation_actions` (`:99`) | — | default `true`; auth no código `:65-78` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:71,72`) | `aggregate` fixa janela de 14 dias (`:36`) mesmo com `period=month` |
| `voip-recommendation-insights` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipRecommendationInsights.ts:28` `invoke(...)` | lê `voip_recommendation_actions`, `call_quality_metrics` (`:170,176`) | — | default `true`; auth no código `:142-155` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:148,149`) | correlação MOS antes/depois (`:71-83`) é global, não filtrada por agente/tronco — atribuição de causalidade frágil |
| `voip-recommendation-simulate` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipRecommendationSimulate.ts:41` `invoke(...)` | lê `call_quality_metrics`, `voip_quality_alerts` (`:177,182`) | — | default `true`; auth no código `:136-149` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:142,143`) | projeção é soma linear determinística assumida (`:84-87`), sem modelo — declarado no comentário |
| `voip-recommendations` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useVoipRecommendations.ts:49` `invoke('voip-recommendations',…)` | lê `call_quality_metrics`, `voip_quality_alerts`, `call_sessions` (`:232,235,238`) | — | default `true`; auth no código `:204-217` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:210,211`) | `CONCURRENT_CAP = 3` hardcoded (`:10`); emite `action_type:'function'` com `action_payload:{action:'run_connectivity_test'}` (`:153-155`) sem função correspondente no repo |
| `voip-sla-report` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/components/network/SlaReportCards.tsx:47` `invoke(...)` e fetch direto `:54` | lê `call_quality_metrics` (`:91`) | — | default `true`; auth no código `:57-71` (`getClaims`) | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:63,64`) | import morto `string as vstring` (`:7`) |
| `voip-trunks-healthcheck` | 🟨 IMPLEMENTADO_PARCIAL | [UI] `src/hooks/useTrunkHealth.ts:39` `invoke('voip-trunks-healthcheck', { body: {} })`. **Nenhum pg_cron/pg_net o agenda** apesar do modo `isCron` (`:31`) | lê/escreve `voip_trunks` (`:68`, update `:107,146`), `agent_trunk_assignments` (update `:100`), insere `voip_trunk_health_checks` (`:140`) | HTTP HEAD ao host do trunk (`:14`); chama `voip-failover-notifier` (`:118`) | default `true`; admin no código `:45-65`, **mas bypass por `authHeader.includes(SERVICE_ROLE_KEY)` (`:31`)** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (`:33,34,46`) | healthcheck SIP é **simulado por HTTP HEAD** (comentário `:5`) — não valida registro SIP; agendamento cron inexistente; ordenação de prioridade contraditória (ver Achados graves) |
| `voip-trunks-manage` | 🟨 IMPLEMENTADO_PARCIAL | [UI] `src/hooks/useVoipTrunks.ts:42` `invoke('voip-trunks-manage',…)` | lê/escreve `voip_trunks` (`:67,79,106,121,135`), `agent_trunk_assignments` (`:161,173,176,186`), insere `call_control_audit_logs` (`:91,109,123`) | WebSocket/TCP ao servidor SIP em `test-registration` (`:144,151`) | default `true`; auth + admin no código `:30-60` | `SUPABASE_SERVICE_ROLE_KEY` (`:7`, usado como chave de cifra), `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`:37,38`) | XOR+base64 chamado de "cifragem" (`:5-23`); fallback `"fallback-key"` (`:7`); locking otimista quebrado (ver Achados graves) |
| `wavoip-call` | 🟦 SUGERIDO_OU_INICIADO | [UI] `src/hooks/useWavoipCall.ts:51,101,165` `invoke('wavoip-call',…)` | nenhuma | **nenhuma** — `WAVOIP_TOKEN` é exigido (`:41-49`) e nunca usado | default `true`; auth no código `:19-39` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `WAVOIP_TOKEN` (`:27,28,41`) | **dado fictício**: todas as respostas são constantes hardcoded — `connected:true` (`:65`), `callId: \`wavoip-${Date.now()}\`` (`:78`), `status:'ready'` (`:96`). Nenhuma chamada é realmente iniciada |
| `webauthn-authenticate` | 🟨 IMPLEMENTADO_PARCIAL | [UI] `src/hooks/useWebAuthn.ts:240` `invoke('webauthn-authenticate',…)` | lê `user_passkeys` (`:37`); escreve `audit_logs` (`:63`) | GoTrue admin `generateLink` (`:49`) | default `true`; **nenhuma checagem de auth/assinatura no código** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`:25,26`) | **não verifica a asserção WebAuthn** — ver Achados graves |
| `webhook-handler` | 🟨 IMPLEMENTADO_PARCIAL | **[NENHUM]** — nenhum chamador interno; destinado a [WEBHOOK] externo, mas sem `verify_jwt=false` em `config.toml` | lê `webhook_secrets` (via `_shared/hmac.ts:26`); escreve `audit_logs` só em falha de assinatura (`:23`) | — (recebe) | default `true` — **conflita com o uso como webhook externo**; HMAC no código `:15` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`:19,20`) | payload validado e **descartado**: sucesso só faz `console.log` (`:71`) e devolve `{success:true}` (`:73`) — nenhuma persistência ou roteamento do evento |
| `whatsapp-inbound` | 🟨 IMPLEMENTADO_PARCIAL | **[NENHUM]** — nenhum chamador interno; destinado a [WEBHOOK] externo, mas sem `verify_jwt=false` em `config.toml` | lê `contacts`, `conversations`, `agents` (`:39,48,63,72`); escreve `conversations` (`:85,104`), `conversation_messages` (`:114`) | — (recebe) | default `true` — **conflita com o uso como webhook externo**; **sem HMAC e sem checagem de auth no código** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`:29,30`) | injeção de filtro PostgREST em `.or()` (ver Achados graves); roteamento faz N+1 de counts (`:69-78`); sem idempotência por `message_id` |
| `whatsapp-rewrite` | ✅ IMPLEMENTADO_TOTAL | [UI] `src/hooks/useWhatsappRewrite.ts:39` (`"whatsapp-rewrite"` como 1º arg de invoke) | nenhuma (rate-limit via `_shared/rate-limit.ts`) | Lovable AI Gateway (`:83`) | default `true`; auth `:21-41` + rate-limit `:43` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `LOVABLE_API_KEY` (`:30,31,70`) | — |

**Resumo:** ✅ 15 · 🟨 10 · 🟦 2 · ⬛ 0.

---

## Funções sem chamador identificado (padrões testados)

Padrões efetivamente executados para **cada uma das 27 funções**, em `src/`, `supabase/migrations/` e `supabase/functions/`:

1. `invoke('<nome>')` / `invoke("<nome>")` / `` invoke(`<nome>`) `` — regex `invoke(<[^>]*>)?\(\s*['"\`]<nome>['"\`]` (cobre também `invoke<T>('<nome>')`).
2. `<nome>` solto (busca literal, sem âncora) em `src/` — pega template literal `${...}/functions/v1/<nome>`, `queryKey`, strings quebradas em várias linhas.
3. Em `supabase/migrations/`: busca literal do nome **e** busca por `cron.schedule`, `net.http_post`, `functions/v1`.
4. Em `supabase/functions/`: busca literal do nome excluindo o próprio diretório da função (chamada function→function).
5. Varredura repo-wide para os casos sem resultado, excluindo `node_modules/`, `coverage/`, `covout/`, `bun.lock*`, e os diretórios proibidos (`docs/`, `mem/`, `README.md`, `SYSTEM_FEATURES.md`).

Resultado — **3 funções sem nenhum chamador**:

| Função | Situação |
|---|---|
| `voip-quality-alerts-summary` | **[NENHUM]**. Únicas ocorrências no repo são o próprio `index.ts:1` e seu teste de integração (`__tests__/index.test.ts:7`). Função completa e coberta por testes, mas nenhuma tela consome. |
| `webhook-handler` | **[NENHUM]** interno. Ocorrências apenas em `webhook-handler/index.ts:53` (self-log) e num comentário em `_shared/external-payload-schemas.ts:136`. É por natureza [WEBHOOK] externo — porém sem `verify_jwt = false` em `config.toml`. |
| `whatsapp-inbound` | **[NENHUM]** interno. Única ocorrência fora do próprio diretório: `whatsapp-inbound/index.ts:134` (self-log). É por natureza [WEBHOOK] externo — mesmo problema de `verify_jwt`. |

Observações adicionais de gatilho:
- `voip-failover-notifier` **não** tem chamador em `src/` nem em migrations; é acionado apenas por `voip-trunks-healthcheck/index.ts:118`.
- **Nenhuma** função deste lote aparece em `supabase/migrations/` (207 migrations varridas). Os únicos `net.http_post` agendados apontam para `auto-scorecard` e `data-lake-flush` (`supabase/migrations/20260723114001_09502153-d05c-40eb-be5f-f84f78526fb3.sql:13,50`), que **não pertencem a este lote**. Consequência: o caminho `isCron` de `voip-trunks-healthcheck/index.ts:31` **não é exercido por nenhum agendamento existente** no repositório.

---

## Achados de segurança

**S1 — `config.toml` sem qualquer declaração de função.** `supabase/config.toml:1` contém só `project_id`. Efeitos: (a) webhooks externos (`webhook-handler`, `whatsapp-inbound`) ficam atrás de `verify_jwt=true` e são inalcançáveis pelo provedor; (b) qualquer alteração futura de `verify_jwt` não está versionada; (c) funções sem auth interna dependem 100% de um default implícito.

**S2 — CORS permissivo por wildcard de subdomínio.** `_shared/cors.ts:21` aceita **qualquer** `https://<algo>.lovable.app` via regex. Qualquer app hospedado nesse domínio de terceiros recebe `Access-Control-Allow-Origin` refletido. Além disso, origem não reconhecida não é bloqueada: `getCorsOrigin` devolve `ALLOWED_ORIGINS[0]` (`:22`). Origens de desenvolvimento (`localhost:8086/8081/5173/3000/8080`, `:4-8`) estão na lista de produção.

**S3 — CORS `*` literal.** `voip-load-test/index.ts:5`: `'Access-Control-Allow-Origin': '*'` — única função do lote que ignora o helper centralizado.

**S4 — SERVICE_ROLE_KEY sem checagem de auth no código (3 funções).**
- `voip-load-test/index.ts:16-17` — nenhuma verificação; **escreve** em `call_quality_metrics`.
- `voip-failover-notifier/index.ts:11-12` — `authHeader` lido em `:10` e **nunca usado**; **escreve** em `notifications`.
- `webauthn-authenticate/index.ts:25-26` — nenhuma verificação; emite token de autenticação.
Mitigação parcial: `verify_jwt=true` por default exige *algum* JWT válido do projeto, mas isso significa que **qualquer usuário autenticado** (qualquer agente logado) atinge esses três endpoints.

**S5 — Comparação de segredo dentro de header, não constante no tempo.** `voip-trunks-healthcheck/index.ts:31`: `authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))` concede modo "cron" (que **pula toda a checagem de admin**, `:45-65`) a quem apresentar a service key no header. `String.includes` não é constante no tempo. Para comparação, `_shared/hmac.ts:48-54` implementa `safeCompare` corretamente — o padrão seguro existe no repo e não foi usado aqui.

**S6 — Criptografia caseira de senhas SIP.** `voip-trunks-manage/index.ts:9-23`: XOR de fluxo com chave repetida + base64, rotulado no comentário `:5` como "cifragem simétrica". É reversível por análise de frequência/known-plaintext e não tem autenticação de integridade. A chave é a própria `SUPABASE_SERVICE_ROLE_KEY` (`:7`) — reuso de segredo entre finalidades — com fallback silencioso `"fallback-key"` que produziria cifras trivialmente quebráveis se a env faltasse.

**S7 — Injeção de filtro PostgREST.** `whatsapp-inbound/index.ts:41`:
```ts
.or(`phone.eq.${fromPhone},phone.eq.${normalizedPhone}`)
```
`fromPhone` vem de `body.from`, validado apenas como `z.string().min(1)` (`whatsapp-inbound/schema.ts:5`). Vírgulas e operadores PostgREST no valor alteram a expressão do filtro e permitem selecionar um contato arbitrário.

**S8 — `.env.example` não documenta nenhum segredo de Edge Function.** Nenhum de `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `LOVABLE_API_KEY`, `ELEVENLABS_API_KEY`, `WAVOIP_TOKEN` aparece em `.env.example` (58 linhas lidas). O arquivo descreve uma stack diferente (Next/Postgres/Redis direto: `DB_HOST`, `REDIS_HOST`, `JWT_SECRET`, `:11-30`), inconsistente com o runtime Deno/Supabase deste diretório. Deploy sem os segredos degrada silenciosamente: `wavoip-call:43` e `voice-command:46` respondem 500/503, e `voip-trunks-manage:7` cai no `"fallback-key"`.

**S9 — Vazamento de detalhe interno em erro.** `verify-voice/index.ts:88` (`message: String(e)`), `voip-anomaly-detector/index.ts:189`, `voip-quality-forecast/index.ts:243`, `voip-capacity-forecast/index.ts:168`, `voip-anomaly-remediation/index.ts:246` devolvem `String(err)` ao cliente.

---

## Achados graves

**G1 — `webauthn-authenticate` não verifica a asserção WebAuthn: bypass de autenticação.**
`webauthn-authenticate/index.ts:18` recebe `{credentialId, userId, email}` do corpo. A única "verificação" é confirmar que existe uma linha em `user_passkeys` com esse `credential_id` + `user_id` (`:36-46`). **Não há challenge, nem `clientDataJSON`, nem `authenticatorData`, nem verificação de assinatura, nem checagem de `signCount`, nem validação de origem/RP ID.** Em seguida a função chama `auth.admin.generateLink` (`:49`) e devolve `hashed_token` e `action_link` ao chamador (`:76-77`).

Consequência: quem conhecer (ou obtiver por enumeração/vazamento) o trio `credential_id`/`user_id`/`email` recebe um link mágico de login para aquela conta, **sem posse do autenticador**. Não há rate-limit nem lockout — os helpers `checkRateLimitDB`/`getClientIp` existem em `_shared/rate-limit.ts` e são usados em `verify-voice:31` e `whatsapp-rewrite:43`, mas não aqui. Nenhuma tentativa falha é auditada; só o sucesso é (`:63`). O endpoint é exposto à UI em `src/hooks/useWebAuthn.ts:240`.

**G2 — `voip-load-test` injeta dados sintéticos na tabela de métricas de produção.**
`voip-load-test/index.ts:26-42` insere 10 linhas em `call_quality_metrics` com `mos_avg`, `jitter_avg_ms`, `packet_loss_pct` e `rtt_avg_ms` gerados por `Math.random()` (`:32-35`), sob `agent_name: 'Load Test Bot'`. O comentário `:56-57` reconhece que a limpeza não foi implementada.

Essa é exatamente a tabela lida por **9 outras funções deste lote** (`voip-sla-report:91`, `voip-quality-heatmap:65`, `voip-quality-forecast:213`, `voip-anomaly-detector:133`, `voip-executive-summary:156`, `voip-recommendations:232`, `voip-recommendation-insights:176`, `voip-recommendation-simulate:177`, `voip-diagnostic-voice-qa:91`, `voip-executive-narrative:73`). Nenhuma delas filtra `agent_name`. Logo, cada clique no botão de `src/pages/ObservabilityDashboard.tsx:39` contamina permanentemente SLA, health score, heatmap, forecast, detecção de anomalias e o contexto enviado à IA. Combinado com S4 (sem auth) e S3 (CORS `*`), qualquer usuário autenticado pode inflar as métricas em loop.

**G3 — `voip-failover-notifier` notifica os agentes errados e aceita entrada não autenticada.**
`voip-failover-notifier/index.ts:22-25` busca as atribuições por `.eq("trunk_id", backup_trunk_id)` — o tronco **reserva**. No momento da chamada, `voip-trunks-healthcheck/index.ts:99-102` **já migrou** os agentes do tronco falho para o backup, então a consulta acerta por acidente nesse fluxo; porém a mensagem montada em `:34` afirma "Você foi migrado" a **todos** os ocupantes do backup, incluindo os que já estavam lá e não sofreram failover. Somado a isso, `user_id` das notificações vem de `agent_id` (`:32`) sem validação de que são IDs de `auth.users`, e a função escreve em `notifications` com service role sem validar quem chamou (S4) nem o corpo da requisição (`:15`).

**G4 — Locking otimista quebrado em `voip-trunks-manage`.**
`voip-trunks-manage/index.ts:100-108`: `version` é exigido do cliente (`:102`), colocado no payload de update (`:103`) e o `UPDATE` filtra **apenas** por `.eq("id", id)` (`:107`). Não há `.eq("version", version)` nem incremento. Duas edições concorrentes sobrescrevem-se silenciosamente, e a coluna `version` (que é selecionada e exibida em `:68` e `:163`) passa a refletir o valor enviado pelo cliente em vez de um contador do servidor. O mesmo endpoint grava senhas SIP (`:105`) — a última escrita vence sem detecção de conflito.

**G5 — Semântica de prioridade de trunk contraditória entre as duas funções.**
`voip-trunks-manage/index.ts:69` lista troncos com `.order("priority", { ascending: true })` (menor número = mais prioritário, convenção SIP usual, coerente com o default `priority: 100` em `:85`). Já `voip-trunks-healthcheck/index.ts:91` escolhe o backup do failover com `.order("priority", { ascending: false })`, comentado como "maior prioridade" (`:84`). As duas leituras são incompatíveis: o failover automático seleciona justamente o tronco que a UI apresenta como **menos** prioritário.

**G6 — `voip-anomaly-remediation` reporta ações que nunca executa.**
A whitelist (`voip-anomaly-remediation/index.ts:21-85`) descreve efeitos concretos — forçar codec Opus, pausar campanhas outbound, reduzir chamadas concorrentes em 30%. O handler nunca invoca nada disso: o único efeito é o `INSERT` em `voip_recommendation_actions` (`:208-218`) com `outcome: 'auto_applied'`. Esse mesmo valor é depois contado como sucesso operacional por `voip-recommendation-insights` (`calcEffectiveness`, `:64`), `voip-executive-narrative` (`:86`) e `voip-diagnostic-voice-qa` (`:111`), e alimenta o texto enviado ao LLM. O resultado é um indicador de efetividade construído sobre ações que não ocorreram.

**G7 — `webhook-handler` descarta o evento validado.**
`webhook-handler/index.ts` faz a parte difícil corretamente (HMAC em `:15`, auditoria da falha em `:23`, validação de schema em `:51`) e então, no caminho de sucesso, apenas registra `console.log` (`:71`) e responde `{success:true}` (`:73`). Nenhuma persistência, nenhum enfileiramento, nenhum roteamento. Todo evento aceito é perdido, e o emissor recebe confirmação de processamento.

**G8 — `wavoip-call` é um stub que se apresenta como integração ativa.**
`wavoip-call/index.ts:41-49` exige `WAVOIP_TOKEN` e retorna 503 sem ele, sugerindo integração real; o token **nunca é usado** e não há nenhum `fetch` no arquivo. Todos os ramos devolvem constantes: `connected: true` (`:65`), `callId` derivado de `Date.now()` (`:78`), `status: 'ready'` (`:96`), `status: 'ended'` (`:92`). A UI consome esses valores em três pontos (`src/hooks/useWavoipCall.ts:51,101,165`) e exibirá chamadas "conectadas" que não existem.

**G9 — Endpoint de IA divergente em `voice-command`.**
`voice-command/index.ts:53` chama `https://api.lovable.dev/v1/chat/completions`. As outras quatro integrações de IA do lote usam `https://ai.gateway.lovable.dev/v1/chat/completions` (`voip-diagnostic-voice-qa:10`, `voip-executive-narrative:9`, `whatsapp-rewrite:83`). O host diverge do padrão do repositório; se estiver incorreto, o fluxo de comando de voz falha em produção — e o código não trata `!response.ok` (lê `aiResult.choices` direto em `:76`), degradando silenciosamente para `{action:"none", confidence:0.5}` (`:81`) em vez de sinalizar erro.

**G10 — Detecção de anomalia de volume é código morto.**
`voip-anomaly-detector/index.ts:165` monta `volumesByBucket[k] = [buckets[k].count]` — sempre um array de **um** elemento. `detectAnomalies` exige `baseline.volumes.length >= 3` (`:73`). A condição nunca é satisfeita pelo handler HTTP, então o ramo de volume (`:73-85`) jamais dispara em produção; ele só é exercitado quando o teste unitário chama `detectAnomalies` diretamente. O bloco `:157-160` também é no-op (cria o bucket sem inserir amostras).

---

## Integrações de terceiros observadas

| Serviço | Onde | Segredo | Observação |
|---|---|---|---|
| **Lovable AI Gateway** (`ai.gateway.lovable.dev`) | `voip-diagnostic-voice-qa:142`, `voip-executive-narrative:127`, `whatsapp-rewrite:83` | `LOVABLE_API_KEY` | Modelo `google/gemini-2.5-flash` em todos. Tratam 429/402 explicitamente (`voip-diagnostic-voice-qa:154,157`; `whatsapp-rewrite:100,106`). Só `whatsapp-rewrite` tem rate-limit próprio (`:43`). |
| **Lovable API** (`api.lovable.dev`) | `voice-command:53` | `LOVABLE_API_KEY` | Host divergente dos demais — ver G9. Sem tratamento de `!response.ok`. |
| **ElevenLabs Speech-to-Text** | `voice-transcribe:63` | `ELEVENLABS_API_KEY` | `model_id: scribe_v1`, `language_code: por`, diarização ligada (`:58-60`). Sem limite de tamanho de upload. |
| **Wavoip** (WhatsApp voice) | `wavoip-call` | `WAVOIP_TOKEN` | **Nenhuma chamada HTTP existe.** Token exigido e não utilizado — ver G8. |
| **Supabase GoTrue Admin** | `webauthn-authenticate:49` (`auth.admin.generateLink`) | `SUPABASE_SERVICE_ROLE_KEY` | Emite magic link sem verificação criptográfica da passkey — ver G1. |
| **Servidores SIP de terceiros** | `voip-trunks-manage:144` (WebSocket `wss://`), `:151` (`Deno.connect` porta 5060); `voip-trunks-healthcheck:14` (HTTP HEAD) | credenciais SIP em `voip_trunks` | O healthcheck **não** fala SIP — faz HEAD HTTP no host e trata qualquer resposta como saudável (`:17-18`). O próprio comentário `:5` chama de "simulado". |
| **Provedor WhatsApp (inbound)** | `whatsapp-inbound` | nenhum | Recebe webhook **sem verificação de assinatura**, ao contrário de `webhook-handler` que usa `_shared/hmac.ts`. |
| **Provedor genérico de webhook** | `webhook-handler:15` | segredo em `webhook_secrets` (provider `'generic-provider'`) | HMAC-SHA256 com comparação constante no tempo — a implementação de segurança mais sólida do lote; o payload, porém, é descartado (G7). |

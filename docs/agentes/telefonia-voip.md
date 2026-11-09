# Telefonia (SIP / WebRTC / WhatsApp) — referência para agentes

Ler quando mexer em chamada, softphone, ramal, fila, BLF, tronco, gravação ou métrica de chamada.

## O que é real e o que não é

| Camada | Estado | Evidência |
|---|---|---|
| **SIP** | **real** — `jssip` de fato integrado: `JsSIP.UA`, `JsSIP.WebSocketInterface`, `RTCSession` | `src/hooks/useSipCall.ts:4-6,50,153` |
| **WebRTC / ICE** | **real** — STUN Google + Cloudflare fixos; **TURN só existe se as 3 envs estiverem setadas** | `src/lib/webrtc-config.ts:5-20` |
| **WhatsApp (Wavoip)** | **fachada** — a edge exige `WAVOIP_TOKEN` (503 sem ele, `wavoip-call/index.ts:41-48`) e **nunca o usa**: `case 'connect'` devolve objeto constante (`:63-65`). No front, `useWavoipCall.ts:125-134` marca a chamada como `active` por `setTimeout(2000)`, não por evento — a UI mostra "atendida" sem atendimento | leitura dos dois arquivos |
| **ElevenLabs (voz)** | `src/lib/elevenlabs-stub.ts:12-13` devolve `status:'disconnected'` / `isSpeaking:false` constantes e é consumido em produção por `UnifiedSoftphone.tsx:3` | — |
| **IA de conversa (Gemini via Lovable)** | **real** — requisições HTTP genuínas ao `ai.gateway.lovable.dev` com `LOVABLE_API_KEY` | ver `lovable-deploy.md` |

**Regra:** não descreva fluxo de WhatsApp ou de voz ElevenLabs como funcionando. Ao mexer neles, diga ao dono
que a camada é stub antes de propor fix em cima.

## Rotas do domínio

`/` → **PhoneDialer** (não é o dashboard; o dashboard é `/dashboard`). Demais:
`/calls`, `/call-history`, `/history`, `/call-park`, `/call-queues`, `/call-flow-designer`, `/call-library`,
`/blf`, `/dialer`, `/dialer/predictive`, `/callbacks`, `/recordings`, `/hold-metrics`, `/hold-alerts`,
`/hold-settings`, `/ranking`, `/observability`, `/analytics`, e as admin `/admin/extensions` e
`/admin/voip-trunks`.

Guarda de rota em `src/routes/protectedRoutes.tsx` (94 rotas) e `publicRoutes.tsx` (11). **O menu não tem o
mesmo filtro:** `AppSidebar.tsx` expõe 76 links sem filtro por papel contra 47 rotas que declaram `roles:` —
um agente comum vê itens que levam a `/unauthorized`. Ao adicionar rota com `roles:`, adicione o filtro
correspondente no menu, senão você aumenta essa divergência.

## 🔴 Dois fios de dados quebrados — leia antes de "consertar métrica"

### 1. A barra de chamada ativa nunca renderiza

`src/components/calls/ActiveCallBar.tsx:63` inicializa `call` como `null` e a **única** chamada a `setCall`
em todo o arquivo é `:213 setCall(null)`. Logo `call` é sempre nulo e o componente cai no `return null`.
Ele está montado em **todas** as páginas (`src/components/layout/AppLayout.tsx:85`).

Com ele morrem, sem erro visível: transcrição ao vivo (`useLiveTranscription` → edge `voice-transcribe`),
`NextBestActionPanel`, `CrmSuggestionsCard` e as edges `generate-summary` / `extract-crm-fields` — todas
implementadas de verdade e inalcançáveis por esse fio. **É um fio solto, não uma reescrita:** quem for ligar
precisa definir quem chama `setCall` (evento do `useSipCall`/`useMultiChannelCall`) e testar o ciclo inteiro.

### 2. Métrica de espera (hold) grava sempre nula

`src/hooks/useMultiChannelCall.ts:143` é o **único** gravador de `hold_events` no repositório e insere
`call_session_id` e `agent_name` **nulos**. A função que preencheria os dois — `setCallDbSession` (`:169`) —
**nunca é chamada em código de produção**: só a definição (`:169`), o export (`:241`) e um teste
(`useMultiChannelCall.coverage.test.tsx:110`).

Cadeia de consequências, nesta ordem:
`call_session_id` nulo → o encerramento (`:145`) compara `call_session_id` com `''` e nunca casa →
`ended_at` nunca é preenchido → `useHoldMetrics.ts:60` zera a métrica por agente e
`supabase/functions/check-hold-alerts/index.ts:52` (`.is('ended_at', null)`) gera alerta que **nunca cessa**.

Ligar `setCallDbSession` conserta a cadeia, mas **exige decisão do dono** sobre os registros históricos já
gravados nulos (contar, ignorar ou expurgar). Não decida isso sozinho.

## 🔴 Dois botões que gravam dados fictícios em produção

| Botão | Onde | O que faz |
|---|---|---|
| **"Criar Dados"** | `src/pages/AgentRanking.tsx:47`, rota `/ranking`, **sem `roles:`** | `src/hooks/useAgentRanking.ts:262-307` gera com `Math.random()` chamadas, durações, sentimentos e notas, e faz `INSERT` real em `call_sessions` (:274), `call_summaries` (:286) e `call_analyses` (:292), com nomes fixos ("Lucas Ferreira", "Ana Carolina Silva"…) |
| **"Criar Testes"** | `CallAlertsList.tsx:63` → `useAlerts.ts:239` | insere `call_sessions` e `call_alerts` fictícios, também sem guarda de papel |

**Atenuante medido:** a RLS contém o dano para agente comum — a policy de INSERT de `call_sessions` é
`WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name))`
(`20260404153900_c14f803b….sql:16-18`), e `is_active_agent` exige o nome vinculado ao `auth.uid()`. Como os
nomes são fixos, o INSERT do agente comum é **rejeitado**.
**O que sobra, e é real:** `useAgentRanking.ts:282` engole o erro com `continue` e `:301` exibe
`toast.success('Dados de teste criados com sucesso!')` de qualquer jeito — confirmação de sucesso sobre
operação que a RLS recusou. E admin/supervisor **gravam de fato**, sem coluna que separe fabricado de real
depois.

Remover ou restringir esses botões toca produção → **chame o dono**. Mas nunca adicione um terceiro.

## Painéis com número inventado — não alimente

| Componente | Rota | O que exibe sem fonte de dados |
|---|---|---|
| `dashboard/PerformanceNarrative.tsx:24-45` | `/dashboard` | "crescimento de 12%", "meta 94%", "Health Score 9.8" sob rótulo "Análise IA de Performance" — **zero imports de dados** |
| `dashboard/SystemIntegrityDashboard.tsx:6-11` | `/observability` | "SIP Gateway Online 45ms", "RLS Policies Seguro 10/10" — array literal |
| `executive/SecurityAuditCard.tsx` | `RealtimeQualityDashboard.tsx:124` | "Auditoria de Segurança (10/10)", "última validação" = hora do render |
| `supervisor/QueueTrendChart.tsx:23-24` | `/dashboard` (colapsável que inicia fechado) | `waiting`/`active` por `Math.random()`; importa `supabase` em `:3` e nunca usa |
| `pages/SecurityReport.tsx:97-101` | `/security-report` | exporta `.txt` com "teste de carga < 50ms" e "Meta 10/10" fixos |
| `pages/Status.tsx:52` | `/status` — **rota pública** | "Todos os sistemas operacionais" mesmo com zero amostras |

`src/lib/security-report-data.ts:20` declara "22 tabelas com RLS habilitado"; a contagem real nas migrations
é **160**. Um monitor que nunca fica vermelho é pior que a ausência de monitor: ao tocar qualquer um destes,
ligue a dado real ou troque por estado vazio honesto — não ajuste o número fixo.

## KPI que mede não-ação

`VoipRecommendationsPanel.tsx:104-125` — "Aplicar recomendação" só executa `navigate()` (5 das 6
recomendações são do tipo `link`, `supabase/functions/voip-recommendations/index.ts:108-187`), mas emite
`toast.success('Aplicado')` e grava `outcome:'applied'`. Esses registros alimentam o KPI **"Efetividade %"**
em `RecommendationInsightsCard.tsx:124-131`. Mesmo padrão em `voip-anomaly-remediation`: as ações da
whitelist (`force_codec_opus_low`, `pause_outbound_campaigns`, `throttle_concurrent_calls`) **nunca são
executadas** e viram linha com `outcome:'auto_applied'` (`index.ts:216`). Não use esse KPI como evidência de
nada.

## Funcionalidades provisionadas e dormentes

Backend pronto (tabela + edge), **zero consumidores** em `src/`: `useAdherence`, `useChatbot`,
`useChurnRisk`, `useCallPlaylists`, `useCoachingAssignments`, `useComplianceRules`, `useScorecards` (deixa 4
tabelas sem leitor), `useSurveys` (edge `send-survey` sem gatilho), `useNotifications`,
`useMultiChannelCallConference`. Antes de "implementar" algo dessa lista, confira se já existe — a maior
parte do trabalho está feita e falta só o consumidor.

## TURN — degradação silenciosa

`VITE_TURN_URL`, `VITE_TURN_USER`, `VITE_TURN_CRED` **não estão em `.env.example`** e, sem as três,
`getIceServers()` devolve só STUN: chamada atrás de NAT simétrico falha sem mensagem. Ao diagnosticar "a
chamada não conecta para alguns usuários", **confira TURN antes de mexer em SIP**.
